'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'Snippet', [
		base.column_id('creator_id'),
		base.column_id('own_id', {index:true}),
		base.column_varchar_50('name'),
		base.column_varchar_100('brief'),
		base.column_varchar_20('language'),
		base.column_varchar_20('environment'),
		base.column_varchar_100('keywords'),
		base.column_varchar_20('type', {defautValue:'code'}),//'code', 'file', 'zip'
		base.column_text('code'),
		base.column_text('help')
		], {
			table: 'snippet'
		});
};