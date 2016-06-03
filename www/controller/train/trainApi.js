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
/train/c/:id/author/edit
/train/c/:id/edit
/train/s/creation?cid=xx
/train/s/:id
/api/train/c/list?page=xx
/api/train/c/:id
/api/train/c/:id/sections
/api/train/s/:id

POST METHOD:

/api/train/c
/api/train/c/:id
/api/train/c/:id/member/add
/api/train/c/:id/member/delete
/api/train/s
/api/train/s/:id
/api/train/s/:id/up
/api/train/s/:id/down

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

	'GET /train/c/:id/author/edit': function* (id){
		yield base.$render( this, {__id:id}, 'course_author_form.html')
	},

	'GET /train/c/:id/edit': function* (id){
		yield base.$render( this, {__id:id}, 'course_form.html')
	},

	'GET /train/s/creation': function* (){
		var cid = this.request.query.cid || '',
			model = { cid: cid };
		yield base.$render( this, model, 'section_form.html');
	},

	'GET /train/s/:id/edit': function* (id){
		yield base.$render( this, {__id:id}, 'section_form.html')
	},

	'GET /train/s/:id': function* (id){
		var s = yield base.modelSection.$find(id),
			model = { __id: id, course_id: s.course_id };
		yield base.$render( this, model, 'train_section.html');
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

	'GET /api/train/c/:id/authors': function* (id){
		this.body = yield base.course.$listAuthor(id);
	},

	'GET /api/train/c/:id/sections': function* (id){
		this.body = yield base.course.$listSection(id);
	},

	'GET /api/train/c/:id': function* (id){
		this.body = yield base.course.$find(id);
	},

	'GET /api/train/s/:id': function* (id){
		var s = yield base.modelSection.$find(id);
		s.atts = yield base.section.$listAttachments(id);
		this.body = s;
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

	'POST /api/train/c/:id/member/add': function* (id){
		var r = yield base.modelCourse.$find(id),
			data = this.request.body;

		if( r === null ){
			throw api.notFound('course', this.translate('Record not found'));
		}
		yield base.course.$addMembers(id, data);
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/train/c/:id/member/delete': function* (id){
		var r = yield base.modelCourse.$find(id),
			data = this.request.body;

		if( r === null ){
			throw api.notFound('course', this.translate('Record not found'));
		}
		yield base.course.$deleteMember(id, data.user);
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
	},

	'POST /api/train/s': function* (){
		var r, course, maxOrder, cid,
			data = this.request.body;

		base.validate('section_create', data);
		cid = data.course_id;

		course = yield base.modelCourse.$find(cid);
		if( course === null ){
			throw api.notFound('course', this.translate('Record not found'));
		}
		maxOrder = yield base.section.$getMaxOrder(cid);

		r = {
			id: base.next_id(),
			own_id: this.request.user.id,
			course_id: cid,
			order: maxOrder+1,
			name: data.name, 
			brief: data.brief,
			content: data.content
		};
		yield base.modelSection.$create( r );
		yield base.section.$addAttachments(r.id, cid, data.attachments );
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/train/s/:id/down': function* (id){
		yield base.section.$move(id, 1);
		this.body = { result: 'ok' };
	},

	'POST /api/train/s/:id/up': function* (id){
		yield base.section.$move(id, -1);
		this.body = { result: 'ok' };
	},

	'POST /api/train/s/:id': function* (id){
		var r = yield base.modelSection.$find(id),
			data = this.request.body;

		base.validate('section_create', data);
		if( r === null ){
			throw api.notFound('course', this.translate('Record not found'));
		}

		yield db.op.$update_record( r, data, ['name', 'brief', 'content']);
		yield base.section.$updateAttachments(id, r.course_id, data.attachments);
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	}
}
