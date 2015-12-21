'use strict';
var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('./home'),
    db = require('../db'),
    json_schema = require('../json_schema');

var 
    modelDict = {},
	modelSnippet = db.snippet,
    modelContribute = db.snippet_contribute,
    modelHistory = db.snippet_history,
    modelRefer = db.snippet_refer,
    next_id = db.next_id;

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

function validLanguage(value){
    return value in modelDict['language'];
}

function validEnvironment(value){
    return value in modelDict['environment'];
}

function getView(view){
	return 'snippet/' + view;
}


module.exports = {    
	'GET /snippet/create':function* (){
		var model = {'__languages':modelDict['language'], '__environments':modelDict['environment']};
		this.render( getView('snippet-form.html'), yield home.$getModel.apply(this, [model]) );
	},
	'POST /api/snippet/create': function* (){
		var 
            user = this.request.user,
            snippet,
            contrib,
            data = this.request.body;

        //validate data
        json_schema.validate('createSnippet', data);
        if( !validLanguage(data.language) ){
            throw api.invalidParam('language'); 
        }
        if( !validEnvironment(data.environment)){
            throw api.invalidParam('environment'); 
        }

        snippet = {
            id: next_id(),
            creator_id: user.id,
            own_id: user.id,
            name: data.name,
            brief: data.brief,
            language: parseInt(data.language),
            environment: parseInt(data.environment),
            keywords: data.keywords,
            code: data.snippet,
            help: data.help
        };
        contrib = {
            id: next_id(),
            snippet_id: snippet.id,
            user_id: user.id,
            edit_count: 1
        }
        yield modelSnippet.$create(snippet);
        yield modelContribute.$create(contrib);

        this.body = {
            id: snippet.id
        };
	},
    'LoginRequired': [ '/snippet/create', '/api/snippet/create']
};