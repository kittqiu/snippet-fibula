'use strict';

/**
 * Authenticate users.
 * 
 * How to generate password:
 * 
 * user's email: user@example.com
 * user's password: HelloWorld
 * send hashed password for authentication:
 *   {
 *     email: 'user@example.com',
 *     passwd: 'fa54b4176373caef36be50474880541de1894428' // => sha1('user@example.com' + ':' + 'HelloWorld')
 *   }
 * verify in db:
 * db_password = loadFromDatabase(); // => 'f901cedb0cfbd27bfdb69d8b66e1f49a9fe0d0fe'
 * authenticated = db_password === sha1(user_id + ':' + 'fa54b4176373caef36be50474880541de1894428')
 * 
 * that means, there are 2 sha1-hash for user's original password, and the salt is user's email and id.
 */

 var
    crypto = require('crypto'),
    config = require('./config');

 function _generatePassword(salt, inputPassword){
 	return crypto.createHash('sha1').update( salt + ':' + inputPassword ).digest('hex');
 }

 function _verifyPassword( salt, inputPassword, expectedPassword ){
 	return expectedPassword === crypto.createHash('sha1').update( salt + ':' + inputPassword ).digest('hex');
 }

 module.exports = {
 	generatePassword: _generatePassword,
 	verifyPassword: _verifyPassword
 };