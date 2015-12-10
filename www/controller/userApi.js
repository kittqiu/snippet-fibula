'use strict';

// user api

var
    _ = require('lodash'),
    thunkify = require('thunkify'),
    json_schema = require('../json_schema'),
    db = require('../db'), 
    config = require('../config'),
    constants = require('../constants'),
    auth = require('../auth'),
    api = require('../api'),
    i18n = require('../i18n');

var 
	User = db.user,
	LocalUser = db.localuser, 
	next_id = db.next_id;

function* $getUserByEmail(email) {
    return yield User.$find({
        where: '`email`=?',
        params: [email],
        limit: 1
    });
}

function* $getUserByName(name) {
    return yield User.$find({
        where: '`username`=?',
        params: [name],
        limit: 1
    });
}

module.exports = {

	'POST /api/signup': function* (){
		var 
			user,
			localuser,
			email, 
			name, 
			username, 
			password,
			data = this.request.body;

		//validate data
		json_schema.validate('createAccount', data);

		email = data.email;
		password = data.password;
		username = data.username;
		name = data.name;

		user = yield $getUserByEmail(email);
        if (user !== null) {
            throw api.conflictError('email', this.translate('Email has been signed up by another user.'));
        }
        user = yield $getUserByName(username);
        if (user !== null) {
            throw api.conflictError('username', this.translate('User name has been signed up by another user.'));
        }

        //create account
        user = {
            id: next_id(),
            role: constants.role.DEVELOPER,
            username: username,
            name: name,
            email: email,
            image_url: '/static/img/user.png'
        };
        localuser = {
        	user_id: user.id,
        	passwd: auth.generatePassword(email, password)
        };
        yield User.$create(user);
        yield LocalUser.$create(localuser);

        this.body = {
        	id: user.id
        };
	}
};