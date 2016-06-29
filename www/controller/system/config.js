'use strict';

var 
	db = require( __base + 'db'),
	helper = require( __base + 'helper');

var 
	modelDate = db.date,
	next_id = db.next_id,
	warp = db.warp;

function* $date_listByYear(year){
	var begin = helper.getFirstDayOfYear(year).getTime(),
		end = helper.getLastDayOfYear(year).getTime();
	return yield modelDate.$findAll({
			select: '*',
			where: '`time`>=? and `time`<=?',
			params: [begin, end],
			order: '`time` asc'
		});
}

function* $date_addWorkDate(year, month, date, isworkday){
	var d = new Date( year, month, date, 12, 0, 0 ),
		o = {
			time: d.getTime(),
			workday: isworkday
		};
	var r = yield modelDate.$find({
			select: '*',
			where: '`time`=?',
			params: [d.getTime()]
		});
	if( r !== null ){
		return false;
	}
	yield modelDate.$create( o );
	return true;
}

function* $date_switchWorkDate(id){
	var r = yield modelDate.$find(id);
	if( r != null ){
		r.workday = !r.workday;
		yield r.$update(['workday']);
		return true;
	}
	return false;
}

module.exports = {
	
	date: {
		$listByYear: $date_listByYear,
		$addWorkDate: $date_addWorkDate,
		$switchWorkDate: $date_switchWorkDate
	}
};