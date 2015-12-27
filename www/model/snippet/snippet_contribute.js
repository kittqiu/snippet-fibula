'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetContribute', [
		base.column_id('snippet_id', {index:true}),
		base.column_id('user_id', {index:true}),
		base.column_bigint('edit_count'),
		base.column_bigint('check_count'),
		base.column_bigint('refer_count')
		], {
			table: 'snippet_contribute'
		});
};