'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetRefer', [
		base.column_id('snippet_id',  {index:true}),
		base.column_id('user_id')
		], {
			table: 'snippet_refer'
		});
};