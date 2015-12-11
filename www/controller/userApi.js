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

var LOCAL_SIGNIN_EXPIRES_IN_MS = 1000 * config.session.expires;

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
	},

    'POST /api/authenticate': function* () {
        /**
         * Authenticate user by email or user name and password, for local user only.
         * 
         * @param {string} username: user name or Email address, in lower case.
         * @param {string} passwd: The password, 40-chars SHA1 string, in lower case.
         */
        var
            username,
            email, 
            passwd,
            user,
            localuser,
            data = this.request.body;
        json_schema.validate('authenticate', data);

        email = username = data.username;
        passwd = data.password;
        user = yield $getUserByName(username);
        if( user === null ){
            user = yield $getUserByEmail(email);
        }
        if (user === null) {
            throw api.authFailed('username', this.translate('User name or password invalid'));
        }
        if (user.locked_until > Date.now()) {
            throw api.authFailed('locked', this.translate('User is locked.'));
        }

        //reset 
        email = user.email;
        username = user.username;

        localuser = yield LocalUser.$find({
            where:'`user_id`=?',
            params: [user.id]
        })
        if( localuser === null ){
            throw api.authFailed('password', this.translate('User name or password invalid'));
        }

        //check password
        if(!auth.verifyPassword(email, passwd, localuser.passwd )){
            throw api.authFailed('password', this.translate('User name or password invalid'));
        }

        // make session cookie:
        var 
            expires = Date.now() + LOCAL_SIGNIN_EXPIRES_IN_MS,
            cookieStr = auth.makeSessionCookie(constants.signin.LOCAL, localuser.id, localuser.passwd, expires);
        this.cookies.set( config.session.cookie, cookieStr, {
            path: '/',
            httpOnly: true,
            expires: new Date(expires)
        });
        console.log('set session cookie for user: ' + user.email);
        this.body = user;
    }
};