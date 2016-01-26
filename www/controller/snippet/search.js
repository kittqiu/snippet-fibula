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
	warp = model.warp,
	Snippet = model.snippet;

function createEngine(){
	reds.client = redis.createClient({host:config.search.host, port:config.search.port});
	reds.Query.prototype.$end = thunkify(reds.Query.prototype.end);
	reds.Query.prototype.$count = thunkify(reds.Query.prototype.count);
	reds.Query.prototype.$count_end = thunkify(reds.Query.prototype.count_end);
	reds.Search.prototype.$exists = thunkify(reds.Search.prototype.exists);
	reds.Search.prototype.$index = thunkify(reds.Search.prototype.index);
	//return reds.createSearch( base.name + process.pid );//for multi process
	return reds.createSearch( base.name );//for multi process
}

function* indexAllSnippet(){
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

function* indexSnippet(){
	var i, j, m, r, sql, sid, 
		snippets, found,
		page_size = 100,
		count = yield Snippet.$findNumber({
			select: 'count(*)'
		});

	i = 0;
	j = count-1;
	while( i <= j ){
		m = Math.floor((i + j)/2);
		sql = "SELECT id FROM snippet ORDER BY created_at ASC LIMIT 1 OFFSET " + m;
        r = yield warp.$query( sql );
        sid = r[0].id;
        found = yield search.$exists(sid);
        if( found === 1 ){
        	i = m + 1;
        }else{
        	j = m - 1;
        }
	}
	m = i;
	for( i = m; i < count; i += page_size){
		sql = "SELECT id,name,keywords,language,environment FROM snippet ORDER BY created_at ASC LIMIT " + page_size + " OFFSET " + i;
		snippets = yield warp.$query(sql);
		
		for( j = 0; j < snippets.length; j++ ){
			var s = snippets[j];
			var str = s.name + ' ' + s.language + ' ' + s.environment + ' ' + s.keywords;
        	yield search.$index( str, s.id );
		}
	}
	return 'Index all snippet completed!';
}

function* heartHit(){
	yield $count('test');
}

function resetJob(){
    console.log( 'reset search link');

    //job.at( '17:39', statsSnippets );
    co( heartHit ).then( function (val) {
		  setTimeout(resetJob, 1800000 );
		}, function (err) {
		  console.error(err.stack);
		  setTimeout(resetJob, 1800000 );
		});
}

function MODULE_init(){
	search = createEngine();
	co( indexSnippet ).then( function (val) {
		  setTimeout(resetJob, 1800000 );
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

function* $queryAndCount( str, offset, limit ){
	if( arguments.length === 1 ){
		offset = 0;
		limit = MAX_LIMIT;
	}else if(arguments.length === 2){
		limit = MAX_LIMIT;
	}
	limit = limit > MAX_LIMIT ? MAX_LIMIT : limit;
	limit = limit < 1 ? 1 : limit;
	offset = offset < 0 ? 0 : offset;

	var r, ids, rs = [],
		q = search.query( str );

	q.between( offset, offset + limit );
	r = yield q.$count_end();
	ids = r.ids;
	if( ids.length > 0 ){
		rs = yield Snippet.$findAll( {
            select: ['id', 'name', 'brief', 'language', 'environment'],
            where: "`id` in ('" + ids.join("','") + "')"
        });
	}
	return {count: r.count, rs:rs};
}

function* $index( str, id){
	search.index( str, id );
}

module.exports = {
	$search: $query,
	$searchAndCount: $queryAndCount,
	$count: $count, 
	$index: $index
};
