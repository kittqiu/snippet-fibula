'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetHistory', [
		base.column_id('user_id'),
		base.column_varchar_50('name'),
		base.column_varchar_100('brief'),
		base.column_bigint('language'),
		base.column_bigint('environment'),
		base.column_varchar_100('keywords'),
		base.column_text('code'),
		base.column_text('help'),
		base.column_bigint('score'),
		base.column_bigint('newversion'),
		], {
			table: 'snippet_history'
		});
};