'use strict';

var 
	db = require( __base + 'db'),
	api = require( __base + 'api'),
	home = require( __base + 'controller/home'), 
	json_schema = require( __base + 'json_schema'),
	base = require('./base');

var 
	modelUser = db.user;

function* $_render( context, model, view ){
    context.render( 'project/' + view, yield home.$getModel.apply(context, [model]) );
}

/******
GET METHOD:
/project
/project/p/creation
/project/p/:id/build

POST METHOD:

/api/project/p

********/


module.exports = {
	'GET /project': function*(){
		var model = {
			projects: yield base.project.$list( 0, 20 )
		};
		console.log(model)
		yield $_render( this, model, 'project_index.html');
		base.setHistoryUrl(this);
	},

	'GET /project/p/creation': function*(){
		var 
			form = {
				name: this.translate('Create project'),
				submit: this.translate('Save'),
				action: '/api/project/p'
			},
			model = {
				__form: form,
				users: yield base.user.$list()
			};
		yield $_render( this, model, 'project_form.html');
	},

	'GET /project/p/:id/build': function* (id){
		var project = yield base.project.$get(id) || {},
			model = {
				project: project
			};
		yield $_render( this, model, 'project_build.html');
	},

	'POST /api/project/p': function* (){
		var r,
			data = this.request.body;
		json_schema.validate('project', data);

		r = {
			creator_id: this.request.user.id,
			name: data.name, 
			master_id: data.master,
			start_time: data.start_time,
			end_time: data.start_time,
			details: data.details
		};
		yield base.modelProject.$create( r );
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	}
};