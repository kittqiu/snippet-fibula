'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetContribute', [
		base.column_id('snippet_id'),
		base.column_id('user_id'),
		base.column_bigint('edit_count'),
		base.column_bigint('check_cout'),
		base.column_bigint('refer_count')
		], {
			table: 'snippet_contribute'
		});
};