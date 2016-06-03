'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'TrainCourseMember', [
		base.column_id('course_id', {index:true}),
		base.column_id('user_id', {index:true})
		], {
			table: 'train_course_member'
		});
};