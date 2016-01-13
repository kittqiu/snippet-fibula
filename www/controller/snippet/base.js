'use strict';
var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('../home'),
    config = require('../../config'),
    db = require('../../db'),
    api = require('../../api');

var models = {
    snippet: db.snippet,
    contrib: db.snippet_contribute,
    history: db.snippet_history,
    refer: db.snippet_refer,
    flow: db.snippet_flow,
    flowHistory: db.snippet_flow_history,
    user: db.user,
    next_id: db.next_id,
    warp : db.warp
};

var 
    MODEL_PATH = __dirname + '/../../model/snippet',
    DEFAULT_EXPIRES_IN_MS = 1000 * config.session.expires;;

function loadFixedModels(){
    var files = fs.readdirSync( MODEL_PATH );
    var re = new RegExp("^[A-Za-z][A-Za-z0-9\\_]*\\.json$");
    var modfiles =  _.filter(files, function (f) {
        return re.test(f);
        });

    _.each(modfiles, function(fname){
        var name = fname.slice(0, -5);
        var path = MODEL_PATH + '/' + fname;
        var model = require( path );
        models[name] = model;
        console.log( 'find model ' + name + ' in ' + path );
    });
}

function __init(){
    loadFixedModels();
}
__init();

/*export api*/
function validLanguage(value){
    return _.indexOf( models.language, value ) !== -1;
}

function validEnvironment(value){
    return _.indexOf( models.environment, value ) !== -1;
}

function getId(request) {
    var id = request.query.id;
    if (id && id.length === 50) {
        return id;
    }
    throw api.notFound('id');
}

function* $_render( context, model, view ){
    context.render( 'snippet/' + view, yield home.$getModel.apply(context, [model]) );
}

function setHistoryUrl( context, url ){
    if( arguments.length === 1){
        url = context.request.url;
    }
    context.cookies.set( 'HISTORYURL', url, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now()+DEFAULT_EXPIRES_IN_MS)
    });
}

function getHistoryUrl( context ){
    var url = context.cookies.get('HISTORYURL');
    return url || '/snippet/';
}

module.exports = {
    /*constant*/
    name: 'snippet',

    /*members*/
    model: models,
    config: config.snippet,

    /*operation*/
    getHistoryUrl: getHistoryUrl,
    getId: getId,
    setHistoryUrl: setHistoryUrl,
    validEnvironment: validEnvironment,
    validLanguage: validLanguage,
    $render: $_render
};
