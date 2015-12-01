'use strict';

var 
	api = require( './api');

module.exports = {

	checkPermission: function( request, expectedRole ){
		if( !request.user || request.user.role > expectedRole ){
			console.log('check permission failed: expected = ' + expectedRole + ', actual = ' + (request.user ? request.user.role : 'null' ));
			throw api.notAllowed( 'No permission!');
		}
	}
};