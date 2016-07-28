'use strict';

var 
	sysconf = require( __base + 'controller/system/config'),
	helper = require( __base + 'helper');

require( 'useful-date' );
require( 'useful-date/locale/en-US.js' );

function* $_getLastWorkDayOfMonth( offset ){
	var i = 0,
		day = helper.getFirstDayOfMonth();
	day.adjust( Date.MONTH, 1 );
	
	while( i < offset ){
		day.adjust( Date.DAY, -1 );
		var bwork = yield sysconf.date.$isWorkDate( day.getFullYear(), day.getMonth(), day.getDate());
		if( bwork ){
			i++;
		}
	}
	return day;
}

function* $_isLastWorkDayByOffset( offset ){
	var day = yield $_getLastWorkDayOfMonth( offset ),
		now = new Date();
	return ( now.getFullYear() === day.getFullYear()) &&  ( now.getMonth() === day.getMonth()) && ( now.getDate() === day.getDate());
}

module.exports = {
	$getLastWorkDayOfMonth: $_getLastWorkDayOfMonth,
	$isLastWorkDayByOffset: $_isLastWorkDayByOffset
};
