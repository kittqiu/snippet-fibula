'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetRefer', [
		base.column_id('snippet_id', {index:true}),
		base.column_id('user_id', {index:true})
		], {
			table: 'snippet_refer'
		});
};