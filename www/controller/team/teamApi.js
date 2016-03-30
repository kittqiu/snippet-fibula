'use strict';

var 
	base = require('./base');

/**************
GET METHOD:
/team
/api/team/member/list
/api/team/member/:id/roles
/api/team/member/:id

POST METHOD:

'GET'

*************/

module.exports = {
	'GET /team': function*(){
		this.redirect('/team/structure');
	},

	'GET /api/team/member/list': function* (){
		this.body = yield base.member.$getUsers();
	},

	'GET /api/team/member/:id/roles': function* (id){
		this.body = yield base.member.$listRoles(id);
	},

	'GET /api/team/member/:id': function* (id){
		this.body = yield base.member.$collectUser(id);
	},

	'LoginRequired': [ /^\/team[\s\S]*/, /^\/api\/team[\s\S]*/]
};