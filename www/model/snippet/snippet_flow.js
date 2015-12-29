'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetFlow', [
		base.column_varchar_20('flow_type'),
		base.column_id('snippet_id', { index: true }),
		base.column_id('user_id'),
		base.column_varchar_50('name'),
		base.column_varchar_100('brief'),
		base.column_varchar_20('language'),
		base.column_varchar_20('environment'),
		base.column_varchar_100('keywords'),
		base.column_text('code'),
		base.column_text('help'),
		base.column_bigint('newversion'),
		base.column_bigint('score'),
		base.column_varchar_20('result', {defaultValue:'processing'}),
		base.column_text('contributor') //id1,id2,id3,...
		], {
			table: 'snippet_flow'
		});
};