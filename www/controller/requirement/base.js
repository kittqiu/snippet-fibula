'use strict';

var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('../home'),
    config = require('../../config'),
    db = require('../../db'),
    api = require('../../api'), 
    cache = require('../../cache'),
    json_schema = require('../../json_schema');

var models = {
    series: db.req_series,
    product: db.req_product,
    version: db.req_version,
    next_id: db.next_id,
    warp : db.warp
};

var 
	modelSeries = models.series,
	modelProduct = models.product,
	modelVersion = models.version;


var 
	TYPE_VERSION_PRODUCT = 'product',
    MODEL_PATH = __dirname + '/../../model/requirement',
    DEFAULT_EXPIRES_IN_MS = 1000 * config.session.expires;;


function* $_render( context, model, view ){
    context.render( 'requirement/' + view, yield home.$getModel.apply(context, [model]) );
}

function setHistoryUrl( context, url ){
    if( arguments.length === 1){
        url = context.request.url;
    }
    context.cookies.set( 'REQ_HISTORYURL', url, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now()+DEFAULT_EXPIRES_IN_MS)
    });
}

function getHistoryUrl( context ){
    var url = context.cookies.get('REQ_HISTORYURL');
    return url || '/req/';
}


/**********cache*********/
var 
	KEY_VERSION_TREE = 'req_version_tree';

function* $___getSeries(){
	return yield modelSeries.$findAll({
		select:'*'
	});
}

function* $___getProducts(){
	return yield modelProduct.$findAll({
		select:'*'
	});
}

function* $___getVersions(type){
	return yield modelVersion.$findAll({
		select:'*',
		where: '`type`=?',
		params: [type]
	});
}

/*
 [{id:id, name:name,products:[{id:id, name:name, versions:[{id:id, name:id}]}]}]
 */
function* $__getVersionTree(){
	var 
		series = yield $___getSeries(),
		products = yield $___getProducts(),
		versions = yield $___getVersions(TYPE_VERSION_PRODUCT),
		tree = [], 
		i, j, k, s, p, v, po, vo;
	console.log(series);
	for( i = 0; i < series.length; i++ ){
		s = series[i];
		po = [];
		for( j = 0; j < products.length; j++){
			p = products[j];
			vo = [];
			if( p.series_id === s.id ){
				for( k = 0; k < versions.length; k++){
					v = versions[k];
					if( v.own_id === p.id ){
						vo.push(v);					
						versions.splice(k, 1);//remove
						k--;
					}
				}
				p['versions'] = vo;
				po.push(p);	
				products.splice(j,1);//remove
				j--;
			}			
		}
		s['products'] = po;
		tree.push(s);
	}
	return tree;
}

function* $_cacheVersionTree(){
	return yield cache.$get( KEY_VERSION_TREE, $__getVersionTree );
}

function* $_cacheRemoveVersionTree(){
	yield cache.$remove( KEY_VERSION_TREE );
}


module.exports = {

	TYPE_VERSION_PRODUCT: TYPE_VERSION_PRODUCT,
	model : models,

	$render: $_render,
	setHistoryUrl: setHistoryUrl,
	getHistoryUrl: getHistoryUrl,
	validate: json_schema.validate,


	/***cache***/
	cache: {
		$getVersionTree: $_cacheVersionTree,
		$removeVersionTree: $_cacheRemoveVersionTree	
	}	
};


