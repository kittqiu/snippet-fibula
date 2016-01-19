'use strict';

var 
	api = require( './api'),
    Page = require( './page');

// for safe base64 replacements:
var
    re_add = new RegExp(/\+/g),
    re_sla = new RegExp(/\//g),
    re_equ = new RegExp(/\=/g),
    re_r_add = new RegExp(/\-/g),
    re_r_sla = new RegExp(/\_/g),
    re_r_equ = new RegExp(/\./g);

// string -> base64:
function _safe_b64encode(s) {
    var b64 = new Buffer(s).toString('base64');
    return b64.replace(re_add, '-').replace(re_sla, '_').replace(re_equ, '.');
}

// base64 -> string
function _safe_b64decode(s) {
    var b64 = s.replace(re_r_add, '+').replace(re_r_sla, '/').replace(re_r_equ, '=');
    return new Buffer(b64, 'base64').toString();
}

var re_int = /^[0-9]+$/;

function string2Integer(s) {
    if (re_int.test(s)) {
        return parseInt(s, 10);
    }
    return null;
}

function getWeek(){
    var now = new Date(),
        onejan = new Date(now.getFullYear(), 0, 1);
    return Math.floor((((now - onejan) / 86400000) + onejan.getDay()) / 7);
}

function getFirstDayOfMonth(){
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getId(request) {
    var id = request.query.id;
    if (id && id.length === 50) {
        return id;
    }
    throw api.notFound('id');
}

module.exports = {

	checkPermission: function( request, expectedRole ){
		if( !request.user || request.user.role > expectedRole ){
			console.log('check permission failed: expected = ' + expectedRole + ', actual = ' + (request.user ? request.user.role : 'null' ));
			throw api.notAllowed( 'No permission!');
		}
	},
	base64encode: _safe_b64encode,
	base64decode: _safe_b64decode, 

    getPage: function (request, pageSize) {
        var
            index = string2Integer(request.query.page || '1'),
            size = pageSize || string2Integer(request.query.size || '10');
        if (index === null || index < 1) {
            index = 1;
        }
        if (size === null || size < 1 || size > 100) {
            size = 10;
        }
        return new Page(index, size);
    }, 

    getWeek: getWeek, 
    getFirstDayOfMonth: getFirstDayOfMonth,
    getId: getId
};