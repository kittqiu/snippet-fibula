'use strict';

//user.js

var constants = require('../constants');
var base = require('./_base');

module.exports = function(warp){
	return base.defineModel( warp, 'User', [
		base.column_bigint( 'role', { defaultValue: constants.role.DEVELOPER}),
		base.column_varchar_100( 'name'),
		base.column_varchar_100( 'email', { unique: true, validate:{ isEmail: true, isLowerCase: true}}),
		base.column_boolean( 'verified'),
		base.column_varchar_1000( 'image_url' ),
		base.column_bigint( 'locked_util')
		], {
			table: 'users'
		})
};
