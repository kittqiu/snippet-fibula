'use strict';

var 
	api = require( __base + 'api'),
	Page = require( __base + 'page'),
	home = require( __base + 'controller/home'), 
	base = require('./base');

function* $_render( context, model, view ){
    context.render( 'train/' + view, yield home.$getModel.apply(context, [model]) );
}

/******
GET METHOD:
/train


POST METHOD:

********/


module.exports = {
	'/train': function* (){
		
	}
}
