'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'SnippetWikiHistory', [
		base.column_varchar_50('title', { index: true }),
		base.column_text('content'),
		base.column_bigint('newversion')
		], {
			table: 'snippet_wiki_history'
		});
};