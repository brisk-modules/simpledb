# Brisk: SimpleDB

An extension for [Brisk](http://github.com/makesites/brisk) models that use [SimpleDB](https://aws.amazon.com/simpledb/) as a backend.


## Install

Using npm:
```
npm install brisk-simpledb
```


## Methods

The default model is extended with the following CRUD methods

* create( data, callback )
* update( data, callback )
* read( query, callback )
* delete( query, callback )

It also has an API similar to Mongoose for MongoDB, by extending the model with the following:

* find( query, callback )
* findOne( query, callback )
* findAll()


## Usage

Afte the model is initialized (automatically done by Brisk) you can use any of the above methods, for example:

```
db.read({ key: "value" }, function(err, data){
	if(err) return console.log(err);
	console.log("data", data);
});
```


## Credits

Initiated by Makis Tracend ( [@tracend](http://github.com/tracend) )

Distributed through [Makesites](http://makesites.org)

Released under the [MIT license](http://makesites.org/licenses/MIT)
