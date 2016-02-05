'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'ReqVersion', [
		base.column_varchar_50('name'),
		base.column_id('own_id', {index:true}),
		base.column_varchar_20('type', {defautValue:'product'})//options: product, client
		], {
			table: 'req_version',
			no_column_version:true
		});
};