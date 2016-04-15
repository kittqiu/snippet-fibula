'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'TrainSection', [
		base.column_id('own_id', {index:true}),
		base.column_id('course_id', {index:true}),
		base.column_bigint('order', {defaultValue:0}),
		base.column_varchar_50('name'),
		base.column_varchar_100('brief'),
		base.column_text('content')
		], {
			table: 'train_section'
		});
};