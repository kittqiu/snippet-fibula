'use strict';

var 
	db = require( __base + 'db'),
	api = require( __base + 'api'),
	home = require( __base + 'controller/home'), 
	json_schema = require( __base + 'json_schema'),
	base = require('./base');

var 
	modelDep = db.team_department,
	modelUser = db.user;

function* $_render( context, model, view ){
    context.render( 'team/structure/' + view, yield home.$getModel.apply(context, [model]) );
}

/**************
GET METHOD:
/team/structure/build
/team/structure/department/creation?parent=xx
/team/structure/department/:id/edit

/api/team/department/list
/api/team/department/:id
/api/team/department/users
/api/team/department/freeusers

POST METHOD:
/api/team/department?parent=xx&before=xx
/api/team/department/:id
/api/team/department/:id/order?action=xx
/api/team/member/u/:uid?department=xx

*************/

module.exports = {
	'GET /team/structure/build': function* (){
		yield $_render( this, {}, 'build.html');
		base.setHistoryUrl(this);
	},

	'GET /team/structure/department/creation': function* (){
		var query = this.request.query,
			parent = query.parent || 'root', 
			before = query.before || '',
			form = {
				name: this.translate('Create department'),
				submit: this.translate('Save'),
				action: '/api/team/department?parent=' + parent + ( before ? '&before='+before : '' )
			},
			model = {
				__form: form, 
				parent: yield base.$getDepartment(parent)
			};
		yield $_render( this, model, 'department_form.html');
	},

	'GET /team/structure/department/:id/edit': function* (id){
		var dep = yield base.$getDepartment(id),
			form = {
				src: '/api/team/department/' + id,
				name: this.translate('Edit') + this.translate('Department'),
				submit: this.translate('Save'),
				action: '/api/team/department/' + id
			},
			model = {
				__id: id,
				__form: form, 
				parent: yield base.$getDepartment(dep.parent)
			};
		yield $_render( this, model, 'department_form.html');
	},

	'GET /api/team/department/freeusers': function* (){
		this.body = yield base.$member_getFree();
	},

	'GET /api/team/department/list': function* (){
		this.body = yield base.$getAllDepartment();
	},

	'GET /api/team/department/users': function* (){
		this.body = yield base.$member_getDepUsers();
	},

	'GET /api/team/department/:id': function* (id){
		this.body = yield modelDep.$find(id);
	},

	'POST /api/team/department': function* (){
		var r,
			data = this.request.body;
		json_schema.validate('simpleDepartment', data);

		r = {
			name: data.name,
			type: 'department',
			parent: data.pid,
			order: yield base.$getDepNextOrder(data.pid),
			duty: ''
		};
		yield modelDep.$create( r );
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/team/department/:id': function* (id){
		var r, orgParentId, orgOrder, columns = [],
			data = this.request.body;
		json_schema.validate('simpleDepartment', data);

		r = yield base.$getDepartment(id);
		if( r === null ){
			throw api.notFound('department');
		}
		if( r.name !== data.name ){
			columns.push('name');
			r.name = data.name;
		}
		if( r.parent !== data.pid ){
			orgParentId = r.parent;
			orgOrder = r.order;
			columns.push('parent');
			r.parent = data.pid;
			r.order = yield base.$getDepNextOrder(data.pid);
			columns.push('order');
		}
		//if( r.order != data)
		if( columns.length !== 0 ){
			yield r.$update(columns);
		}

		if( orgParentId ){
			yield base.$deleteParentDepartOrder( orgParentId, orgOrder );
		}

		this.body = {
            redirect: base.getHistoryUrl(this)
        };
	}, 
	'POST /api/team/department/:id/delete':function* (id){
		var r = yield base.$getDepartment(id);
		if( r === null ){
			throw api.notFound('department');
		}
		var isLeaf = yield base.$dep_isLeaf(id);
		if( !isLeaf ){
			throw api.notAllowed('department is not empty');
		}
		yield r.$destroy();
		this.body = {
			result:'ok'
		}
	},
	'POST /api/team/department/:id/order': function* (id){
		var r = yield base.$getDepartment(id),
			action = this.request.query.action || 'up';
		if( r === null ){
			throw api.notFound('department');
		}
		if( action === 'up' ){
			yield base.$changeDepartmentOrder(id, -1 );
		}else if( action === 'down' ){
			yield base.$changeDepartmentOrder(id, 1 );
		}
		this.body = {
			result:'ok'
		}
	},
	'POST /api/team/member/u/:uid': function* (uid){
		var u = yield modelUser.$find(uid),
			m = yield base.$member_getUser(uid),
			q = this.request.query,
			cols = [];
		if( u === null ){
			throw api.notFound('user');
		}
		if( m === null ){
			yield base.$member_create(uid,q.department);
		}else{
			if( q.hasOwnProperty('department')){
				m.department = q.department;
				cols.push('department');
			}
			if( cols.length > 0 ){
				yield m.$update(cols);
			}			
		}
		this.body = {
			result: 'ok'
		}

	}

};