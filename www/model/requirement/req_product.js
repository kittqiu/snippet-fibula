'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'ReqProduct', [
		base.column_varchar_50('name'),
		base.column_id('series_id', {index:true})
		], {
			table: 'req_product',
			no_column_version:true
		});
};