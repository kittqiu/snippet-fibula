'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'TrainCourse', [
		base.column_id('own_id', {index:true}),
		base.column_varchar_50('name'),
		base.column_varchar_100('brief'),
		base.column_text('details')
		], {
			table: 'train_course'
		});
};