'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'ProjectTask', [
		base.column_id('project_id', {index:true}),
		base.column_id('parent', {defaultValue:'root'}),
		base.column_varchar_50('name'),
		base.column_boolean('automode', {defaultValue:true}), 
		base.column_bigint('order_id', {defaultValue:0}),//order in project
		base.column_varchar_100('rely_to', {defaultValue:''}),//order_id list, e. 1, 5
		base.column_bigint('duration', {defaultValue:1}),//hour
		base.column_bigint('plan_start_time', {defaultValue:0}),//validate on automode is false
		base.column_bigint('plan_end_time', {defaultValue:0}),//validate on automode is false
		base.column_bigint('difficulty', {defaultValue:0}),//0:simple, 1:general, 2: di
		base.column_boolean('closed', {defaultValue:'false'}),
		base.column_text('details')
		], {
			table: 'project_task'
		});
};