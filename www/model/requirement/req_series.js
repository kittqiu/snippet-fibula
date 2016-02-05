'use strict';

var base = require('../_base');

module.exports = function(warp){
	return base.defineModel(warp, 'ReqSeries', [
		base.column_varchar_50('name')
		], {
			table: 'req_series',
			no_column_version:true
		});
};