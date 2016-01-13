'use strict';

var 
    reds = require('../../reds'),
    redis = require('redis'),
    _ = require('lodash'),
    co = require('co'),
    thunkify = require('thunkify'),
    config = require('../../config'),
    base = require('./base');

var 
	search,
	model = base.model,
	Snippet = model.snippet;

function createEngine(){
	reds.client = redis.createClient({host:'45.78.49.170', port:6001});
	reds.Query.prototype.$end = thunkify(reds.Query.prototype.end);
	reds.Query.prototype.$count = thunkify(reds.Query.prototype.count);
	return reds.createSearch( base.name );
}

function* indexSnippet(){
	var i,
		snippets,
		page_size = 100,
		count = yield Snippet.$findNumber({
			select: 'count(*)'
		});

	for( i = 0; i < count; i += page_size){
		snippets = yield Snippet.$findAll( {
            select: ['id', 'name', 'keywords', 'language', 'environment'],
            order: '`created_at` desc',
            limit: page_size,
            offset: i
        });
        _.each(snippets, function(s){
        	var str = s.name + ' ' + s.language + ' ' + s.environment + ' ' + s.keywords;
        	search.index( str, s.id );
        });
	}

	/*var test = yield $query( 'C 字符串' );
	console.log(test);*/
	return 'Index all snippet completed!';
}

function MODULE_init(){
	search = createEngine();
	co( indexSnippet ).then( function (val) {
		  console.log(val);
		}, function (err) {
		  console.error(err.stack);
		});
}

MODULE_init();

var MAX_LIMIT = 20;

function* $count(str){
	var q = search.query( str );
	return yield q.$count();
}

function* $query( str, offset, limit ){
	if( arguments.length === 1 ){
		offset = 0;
		limit = MAX_LIMIT;
	}else if(arguments.length === 2){
		limit = MAX_LIMIT;
	}
	limit = limit > MAX_LIMIT ? MAX_LIMIT : limit;
	limit = limit < 1 ? 1 : limit;
	offset = offset < 0 ? 0 : offset;

	var ids, 
		q = search.query( str );

	q.between( offset, limit );
	ids = yield q.$end();
	if( ids.length > 0 ){
		return yield Snippet.$findAll( {
            select: ['id', 'name', 'brief', 'language', 'environment'],
            where: "`id` in ('" + ids.join("','") + "')"
        });
	}
	return [];
}

module.exports = {
	$search: $query,
	$count: $count
};
