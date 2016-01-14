'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetReferStats', [
		base.column_id('snippet_id', {index:true}),
		base.column_bigint('last_week'),
		base.column_bigint('last_month'),
		base.column_bigint('last_year'),
		base.column_bigint('sum'),
		], {
			table: 'snippet_refer_statistics'
		});
};