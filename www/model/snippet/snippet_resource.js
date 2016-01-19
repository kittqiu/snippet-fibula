'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetResource', [
		base.column_id('snippet_id'),
		base.column_id('user_id'),
		base.column_id('att_id'),
		base.column_varchar_20('type', {defautValue:'attachment'}),//'attachment' or 'code'
		base.column_bigint('new_version')
		], {
			table: 'snippet_resource'
		});
};