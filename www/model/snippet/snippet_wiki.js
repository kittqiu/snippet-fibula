'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetWiki', [
		base.column_varchar_50('title', { index: true }),
		base.column_text('content')
		], {
			table: 'snippet_wiki'
		});
};