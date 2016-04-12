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
/train/c/creation
/train/c/list?page=xx
/train/c/:id
/api/train/c/list?page=xx

POST METHOD:

/api/train/c

********/


module.exports = {
	'GET /train': function* (){
		this.redirect( '/train/c/list' );
	},

	'GET /train/c/creation': function* (){
		yield base.$render( this, {}, 'course_form.html')
	},

	'GET /train/c/list': function* (){
		var model = {
			__page: this.request.query.page || 1
		};
		yield base.$render( this, model, 'train_list.html');
		base.setHistoryUrl(this);
	},

	'GET /train/c/:id': function* (id){

	},

	'GET /api/train/c/list': function* (){
		var index = this.request.query.page || '1',
			index = parseInt(index),
			page_size = base.config.PAGE_SIZE,
			page = new Page(index, page_size), 
			rs = yield yield base.course.$list( page_size*(index-1), page_size);
		page.total = yield base.course.$count();
		this.body = { page:page, courses: rs};
	},

	'POST /api/train/c': function* (){
		var r,
			data = this.request.body;

		base.validate('courseCreate', data);
		
		r = {
			id: base.next_id(),
			owner_id: this.request.user.id,
			name: data.name, 
			brief: data.brief,
			details: data.details
		};		
		yield base.modelCourse.$create( r );
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	}
}
