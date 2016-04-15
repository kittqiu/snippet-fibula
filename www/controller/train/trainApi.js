'use strict';

var 
	db = require( __base + 'db'),
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
/train/c/:id/edit
/train/s/creation?cid=xx
/api/train/c/list?page=xx
/api/train/c/:id
/api/train/c/:id/sections

POST METHOD:

/api/train/c
/api/train/c/:id

********/


module.exports = {
	'GET /train': function* (){
		this.redirect( '/train/c/list' );
	},

	'GET /train/c/creation': function* (){
		yield base.$render( this, {}, 'course_form.html');
	},

	'GET /train/c/list': function* (){
		var model = {
			__page: this.request.query.page || 1
		};
		yield base.$render( this, model, 'train_list.html');
		base.setHistoryUrl(this);
	},

	'GET /train/c/:id': function* (id){
		var model = { __id: id };
		yield base.$render( this, model, 'train_course.html');
		base.setHistoryUrl(this);
	},

	'GET /train/c/:id/edit': function* (id){
		yield base.$render( this, {__id:id}, 'course_form.html')
	},

	'GET /train/s/creation': function* (){
		var cid = this.request.query.cid || '',
			model = { cid: cid };
		yield base.$render( this, model, 'section_form.html');
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

	'GET /api/train/c/:id/sections': function* (id){
		this.body = yield base.course.$listSection(id);
	},

	'GET /api/train/c/:id': function* (id){
		this.body = yield base.modelCourse.$find(id);
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
	},
	'POST /api/train/c/:id': function* (id){
		var r = yield base.modelCourse.$find(id),
			data = this.request.body;

		base.validate('courseCreate', data);
		if( r === null ){
			throw api.notFound('course', this.translate('Record not found'));
		}

		yield db.op.$update_record( r, data, ['name', 'brief', 'details'])
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	}
}
