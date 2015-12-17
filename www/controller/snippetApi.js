'use strict';
var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('./home');

var 
	modelDict = {};

function getView(view){
	return 'snippet/' + view;
}


function loadFixedModels(){
	var files = fs.readdirSync( __dirname + '/../model/snippet');
	var re = new RegExp("^[A-Za-z][A-Za-z0-9\\_]*\\.json$");
	var models =  _.filter(files, function (f) {
    	return re.test(f);
		});

	_.each(models, function(fname){
		var name = fname.slice(0, -5);
		var path = __dirname + '/../model/snippet/' + fname;
		var model = require( path );
		modelDict[name] = model;
		console.log( 'find model ' + name + ' in ' + path );
	});
}

loadFixedModels();

module.exports = {
	'GET /snippet/create':function* (){
		var model = {'__languages':modelDict['language'], '__environments':modelDict['environment']};
		this.render( getView('snippet-form.html'), yield home.$getModel.apply(this, [model]) );
	}
};