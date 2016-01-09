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

var 
    COOKIE_NAME = config.session.cookie,
    LOCAL_SIGNIN_EXPIRES_IN_MS = 1000 * config.session.expires;

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

function getReferer(request) {
    var url = request.get('referer') || '/';
    if (url.indexOf('/auth/') >= 0 || url.indexOf('/manage/') >= 0) {
        url = '/';
    }
    return url;
}

function _makeSessionCooike(localuser, cookies){
    // make session cookie:
    var 
        expires = Date.now() + LOCAL_SIGNIN_EXPIRES_IN_MS,
        cookieStr = auth.makeSessionCookie(constants.signin.LOCAL, localuser.id, localuser.passwd, expires);
        cookies.set( COOKIE_NAME, cookieStr, {
        path: '/',
        httpOnly: true,
        expires: new Date(expires)
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
        this.cookies.set( COOKIE_NAME, cookieStr, {
            path: '/',
            httpOnly: true,
            expires: new Date(expires)
        });
        console.log('set session cookie for user: ' + user.email);
        this.body = user;
    },

    'GET /auth/signout': function* () {
        this.cookies.set(COOKIE_NAME, 'deleted', {
            path: '/',
            httpOnly: true,
            expires: new Date(0)
        });
        var redirect = '/';//getReferer(this.request);
        console.log('Signout, goodbye!');
        this.response.redirect(redirect);
    },
    'POST /api/user/changepwd': function* (){
        var 
            user,
            localuser,
            email, 
            oldpassword, 
            newpassword,
            data = this.request.body;

        //validate data
        json_schema.validate('changePassword', data);

        /*if( !this.request.user ){
            throw api.authRequired('oldpassword', this.translate('Please log in first'));
        }*/
        user = this.request.user;
        oldpassword = data.oldpassword;
        newpassword = data.newpassword;
        email = user.email;

        localuser = yield LocalUser.$find({
            where:'`user_id`=?',
            params: [user.id]
        })
        if( localuser === null ){
            throw api.authFailed('oldpassword', this.translate('Please log in first'));
        }

        if( !auth.verifyPassword(email, oldpassword, localuser.passwd )){
            throw api.authFailed('oldpassword', this.translate('Old password invalid.'));
        }

        //modify password
        localuser.passwd = auth.generatePassword(email, newpassword);
        yield localuser.$update(['passwd']);

        // make session cookie:
        _makeSessionCooike( localuser, this.cookies );
        /*
        var 
            expires = Date.now() + LOCAL_SIGNIN_EXPIRES_IN_MS,
            cookieStr = auth.makeSessionCookie(constants.signin.LOCAL, localuser.id, localuser.passwd, expires);
        this.cookies.set( COOKIE_NAME, cookieStr, {
            path: '/',
            httpOnly: true,
            expires: new Date(expires)
        });*/
        console.log('set session cookie for user: ' + user.email);
        this.body = {
            id: user.id
        };
    },
    'LoginRequired': [ '/api/user/changepwd'] 
};