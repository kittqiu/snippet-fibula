'use strict';

var 
	db = require( __base + 'db'),
	home = require( __base + 'controller/home');


function* $_render( context, model, view ){
    context.render( 'team/structure/' + view, yield home.$getModel.apply(context, [model]) );
}

/**************
GET METHOD:
/team/structure/build



*************/

module.exports = {
	'GET /team/structure/build': function* (){
		yield $_render( this, {}, 'build.html');
	}

};