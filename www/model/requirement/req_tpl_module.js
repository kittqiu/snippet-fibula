'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'ReqTemplateModule', [
		base.column_varchar_50('name'),
		base.column_bigint('order', {defaultValue:0}), //base 0
		base.column_id('parent')
		], {
			table: 'req_tpl_module',
			no_column_version:true
		});
};