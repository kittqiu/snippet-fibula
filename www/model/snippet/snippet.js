'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'Snippet', [
		base.column_id('creator_id'),
		base.column_id('own_id'),
		base.column_varchar_50('name'),
		base.column_varchar_100('brief'),
		base.column_bigint('language'),
		base.column_bigint('environment'),
		base.column_varchar_100('keywords'),
		base.column_text('code'),
		base.column_text('help')
		], {
			table: 'snippet'
		});
};