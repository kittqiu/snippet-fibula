'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'TrainResource', [
		base.column_id('section_id', {index:true}),
		base.column_id('course_id', {index:true}),
		base.column_id('att_id')
		], {
			table: 'train_resource'
		});
};