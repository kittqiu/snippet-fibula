'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetFlowHistory', [		
		base.column_id('flow_id', { index: true }),
		base.column_id('user_id'),
		base.column_varchar_20('action'), 
		base.column_varchar_100('advice', {allowNull:true}),
		base.column_bigint('timeused')
		], {
			table: 'snippet_flow_history'
		});
};