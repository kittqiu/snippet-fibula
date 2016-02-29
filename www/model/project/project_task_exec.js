'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'ProjectTaskExec', [
		base.column_id('task_id', {index:true}),
		base.column_id('executor_id', {index:true}),
		base.column_id('manager_id', {index:true}),
		base.column_bigint('start_time', {defaultValue:0}),
		base.column_bigint('end_time', {defaultValue:0}),
		base.column_bigint('percent', {defaultValue:0}),//0-100
		base.column_bigint('qulity', {defaultValue:0}),//0:bad, 1:not bad, 2: good, 3: very good
		base.column_varchar_20('status', {defaultValue:'ready'})//options: created,accept, pending, cancel, commit, completed
		], {
			table: 'project_task_exec'
		});
};