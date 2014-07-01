# Brisk: SimpleDB

An extension for [Brisk](http://github.com/makesites/brisk) models that use [SimpleDB](https://aws.amazon.com/simpledb/) as a backend.


## Install

Using npm:
```
npm install brisk-simpledb
```

## Usage

After the model is initialized (automatically done by Brisk) you can use any of the available methods (listed below).

```
db.read({ key: "value" }, function(err, data){
	if(err) return console.log(err);
	console.log("data", data);
});
```


## Options

These options can be set on the model to customize the DB

* **archive**: boolean (default: false) Defines if the delete method deletes or archives items (aka soft-delete)
* **delKey**: string (default: "_archive"), sets the key used to define if an item is archived (on a soft delete state)
* **timestamps.updated**: string (default: "updated"): Sets a field to record a timestamp every time the ```update``` method is pinged
* **timestamps.created**: string (default: "created"): Sets a field to record a timestamp when an item is created.


## Methods

The default model is extended with the following CRUD methods

* create( data, callback )
* update( data, callback )
* read( query, callback )
* delete( query, callback )

In addition, there's a compatibility layer to [Mongoose](http://mongoosejs.com/) for MongoDB, featuring the following methods:

* find( query, callback )
* findOne( query, callback )
* findAll()
* destroy() - Deletes items even if _soft delete_ is activated.


## Credits

Initiated by Makis Tracend ( [@tracend](http://github.com/tracend) )

Distributed through [Makesites](http://makesites.org)

Released under the [MIT license](http://makesites.org/licenses/MIT)
