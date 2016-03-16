'use strict';

var 
	base = require('./base');

var 
	cache = base.cache,
	model = base.model,
	modelSeries = model.series,
	modelProduct = model.product,
	modelVersion = model.version, 
	$render = base.$render;

function mergeFixedModel(pageModel){
    //pageModel['__languages'] = model.language;
}

function* $_render( context, pageModel, view ){
    mergeFixedModel(pageModel);
    yield $render( context, pageModel, view );
}

/*******GET METHODS******
/req/

********POST METHODS*****

*/

module.exports = {
	'GET /req': function* (){
		var model = {
			tree: yield cache.$getVersionTree()
		};
		yield $render(this, model, 'req_index.html' )
	},
	'LoginRequired': [ /^\/req[\s\S]*/, /^\/api\/req[\s\S]*/]
};