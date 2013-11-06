var Module = require("brisk").getHelper("module");

var Main = Module.extend({
	dir : __dirname,
	model: require("../app/models/simpledb")
});


module.exports = new Main();