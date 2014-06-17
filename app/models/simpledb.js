var brisk = require("brisk"),
	uuid = require("node-uuid"),
	Model = brisk.getBaseModel("model");

var model = Model.extend({

	options: {
		"delete" : true,
		delKey : "_archive", // combine this with the delete flag?
		timestamps: {
			updated: "updated",
			created: "created"
		}
	},

	init: function( site ){
		// db
		this.db = site.modules.db;
		this.backend = false;
		// schema
		this.schema = {};
		//
	},

	create: function( data, callback ) {
		// if not 'real' deleting add the 'archive' flag
		if( !this.options.delete ){
			data[this.options.delKey] = 0;
		}
		if( this.options.timestamps ){
			data[this.options.timestamps.created] = now();
			data[this.options.timestamps.updated] = now();
		}
		var attributes = this.attributes( data );

		this.db.call("PutAttributes", attributes, callback);

	},

	read: function( data, callback, options ) {
		// fallbacks
		options || ( options ={} );
		var self = this;
		var query = "select * from "+ this.backend;
		if( data ){
			query += " where "+ this.query( data, options );
		}

		this.db.call("Select", { SelectExpression: query }, function(err, result) {
			if (err) return callback(err);
			var response = self.parse( result["SelectResult"] );
			// convert to an array if returning a single object (for no id)
			//if ( response && (typeof data.id == "undefined") && !(response instanceof Array) ){
			//	response = [response];
			//}
			callback(  response );
		});

	},

	update: function( data, callback ) {
		// fallback for no callback
		var next = callback || function(){};
		// don't execute with no specified id...
		if( typeof data.id == "undefined" ) next( false );
		if( this.options.timestamps ){
			data[this.options.timestamps.updated] = now();
		}
		var attributes = this.attributes( data, { replace : true });

		this.db.call("PutAttributes", attributes, next);

	},

	"delete": function( data, callback ) {
		// fallback for no callback
		var next = callback || function(){};
		// if deleting is not allowed forward to archiving
		if( !this.options.delete ) return this.archive( data, {}, next );
		// don't execute with no specified id...
		if( typeof data.id == "undefined" ) next( false );

		var attributes = this.attributes( data, { noAttr: true } );

		this.db.call("DeleteAttributes", attributes, next);

	},

	attributes: function(model, options){
		//default options
		options || (options = {});
		options.replace || (options.replace = false);
		options.noAttr || (options.noAttr = false);

		var query = {};
		var count = 0;

		// create id if not defined
		if( typeof model.id == "undefined" ) model.id = uuid.v1();

		query.DomainName = this.backend;
		query.ItemName = model.id;
		// if we don't require any attributes end now
		if(options.noAttr) return query;

		// deal with attributes
		for( var key in model ){
			//if( key == "id" ) continue;
			var item = new Array()
			query["Attribute."+ count +".Name"] = key;
			query["Attribute."+ count +".Value"] = ( typeof model[key] != "object") ? model[key] : JSON.stringify(model[key]);
			if(options.replace) query["Attribute."+ count +".Replace"] = true;
			count++;
		}

		return query;
	},

	query: function( data, options ){
		// fallbacks
		options || ( options ={} );
		var str = "";

		//if(typeof data === "string") return data;

		var first = true;

		for( var key in data ){
			if( !first ) str += " and ";
			//
			var exp = "`{{field}}`='{{value}}'";
			var field = key;
			var value = data[key];
			// check the key
			var like = ( key.search(/\./) > -1 ) ?  true : false ;
			// if looking into the object...
			if(like){
				exp = "`{{field}}` like '%{{value}}%'";
				var field = key.split(".");
				field = field[0];
			}
			// operators
			if(data[key] && data[key].$gt) {
				exp = "`{{field}}` > '{{value}}'";
				value = data[key].$gt;
			}
			// operators
			if(data[key] && data[key].$lt) {
				exp = "`{{field}}` < '{{value}}'";
				value = data[key].$lt;
			}
			if( typeof value == "object") value = JSON.stringify(value);
			str += exp.replace("{{field}}", field).replace("{{value}}", value);
			//
			first = false;
		}

		if( options.limit ){
			str += " limit "+ options.limit;
		}

		return str;

	},

	parse: function( data ) {

		// return empty if there are no results
		if( typeof data["Item"] == "undefined"){
			return false;
		}

		if( data["Item"] instanceof Array ){

			// deconstruct the response to an array
			var collection = [];

			for( i in data["Item"] ){

				var model = {};
				var attr = data["Item"][i]["Attribute"];
				//var attr = data["Item"][i];

				// parse as independent attributes
				var key = "";
				for( k in attr ){

					try{
						model[attr[k]["Name"]] = JSON.parse( attr[k]["Value"] );
					} catch(err) {
						// output err.message ?
						model[attr[k]["Name"]] = attr[k]["Value"];
					}

				}
				// ovewrite any model id present with the Attribute Name
				model.id  = data["Item"][i]["Name"];
				// filter model
				model = this.filter( model );
				//
				collection.push(model);

			}

		} else {

			var model = {};
			var attr = data["Item"]["Attribute"];

			for (var i in attr) {
				try{
					model[attr[i]["Name"]] = JSON.parse( attr[i]["Value"] );
				} catch(err) {
					// output err.message ?
					model[attr[i]["Name"]] = attr[i]["Value"];
				}
			}

			// ovewrite any model id present with the Attribute Name
			model.id  = data["Item"]["Name"];
			// filter model
			model = this.filter( model );
		}

		// check if we have a model or collection returned
		return collection || model;

	},

	// remove certain (internal) keys when reading
	filter: function( data ){
		// remove the archive flag
		try{
			delete data[this.options.delKey];
		} catch( e ){};
		//...
		return data;
	},

	// mongoDB compatibility
	find: function( data, callback, options ) {
		// only look into the entries that are not archived...
		if( !this.options.delete ){
		  data[this.options.delKey] = 0;
		}
		this.read( data, callback, options);
	},

	findOne: function( data, callback ) {
		// only look into the entries that are not archived...
		if( !this.options.delete ){
		  data[this.options.delKey] = 0;
		}
		this.read( data, callback, { limit : 1 });

	},

	all: function( callback ) {

		this.read( false, callback );

	},

	// sets an archive flag for "deleted" items
	archive: function( data, options, callback ) {
		// don't execute with no specified id...
		if( typeof data.id == "undefined" ) callback( false );
		// fallbacks
		options || (options = {});
		if( options.$set ){
			// loop through the $set
			var set = options.$set;
			for( var i in options.$set ){
				if( set[i] == "timestamp" ){
					data[i] = (new Date()).getTime();
				} else {
					data[i] = set[i];
				}
			}
		}
		// set the data
		data[this.options.delKey] = 1;
		if( this.options.timestamps ){
			data[this.options.timestamps.updated] = now();
		}
		var attributes = this.attributes( data, { replace : true });

		this.db.call("PutAttributes", attributes, callback);

	}

});

// Helpers

function now(){
	// make sure this is calculates miliseconds? (13 chars)
	return (new Date()).getTime();
}


module.exports = model;