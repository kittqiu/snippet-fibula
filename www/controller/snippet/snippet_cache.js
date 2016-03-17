'use strict';

var 
    _ = require('lodash'),
    base = require('./base'),
    cache = require('../../cache'),
    contrib = require('./contribute'),
    co = require('co');

var 
    model = base.model,
    config = base.config,
    modelFlow = model.flow,
    warp = model.warp;

var
    CACHE_PREFIX = 'snippet/',
    PAGE_SIZE = config.page_size,
    Languages = model.language, 
    KEY_STATS = 'key_snippet_stats',
    KEY_LASTEST_SNIPPET = 'Key_snippet_lastest',
    KEY_BEST_SNIPPET = 'Key_snippet_best';

function keyLangCount(lang){
    return CACHE_PREFIX + 'pending/language/' + lang;
}
function keyLangFirstPage(lang){
    return  CACHE_PREFIX + 'pending/language/' + lang + '/FirstPage';
}

var
    pendingCountKeys = [],// ['pending/language/0', 'pending/language/1'...]
    pendingFirstPageKeys= [];

function* $__getPendingCount(lang){
    return yield cache.$get( keyLangCount(lang), function*(){
        return yield modelFlow.$findNumber( {
            select: 'count(*)',
            where: '`result`=? and `language`=?',
            params: ['processing', lang]
        });
    } );
}

function* $_getAllPendingCount(){
    var counts = yield cache.$gets(pendingCountKeys);
    for( var i = 0; i < counts.length; i++ ){
        if( counts[i] === null ){
            counts[i] = yield $__getPendingCount(Languages[i]);
        }
    }
    return counts;
}

function* $__getPendingFirstPage(lang){
    return yield cache.$get( keyLangFirstPage(lang), function*(){
        return yield modelFlow.$findAll( {
            select: ['id', 'snippet_id', 'user_id', 'name', 'brief', 'score', 'contributor'],
            where: '`result`=? and `language`=?',
            params: ['processing', lang], 
            order: '`created_at` desc',
            limit: PAGE_SIZE,
            offset: 0
        });
    } );
}

function* $_getAllPendingFirstPage(){
    var counts = yield cache.$gets(pendingFirstPageKeys);
    for( var i = 0; i < counts.length; i++ ){
        if( counts[i] === null ){
            counts[i] = yield $__getPendingFirstPage(Languages[i]);
        }
    }
    return counts;
}

function* $_getAllPending(lang,page) {
    page.total = yield $__getPendingCount(lang);
    if (page.isEmpty) {
        return [];
    }
    return yield modelFlow.$findAll( {
            select: ['id', 'snippet_id', 'user_id', 'name', 'brief', 'score', 'contributor'],
            where: '`result`=? and `language`=?',
            params: ['processing', lang], 
            order: '`created_at` desc',
            offset: page.offset,
            limit: page.limit
        });
}

var cachePath = [
'/api/snippet/list/lastest'
];
function* $_removeLangCache(lang){
    yield cache.$remove(keyLangCount(lang) );
    yield cache.$remove(keyLangFirstPage(lang) );

    for( var i = 0; i< cachePath.length; i++ ){
        yield cache.$remove(cachePath[i]);    
    }

    yield cache.$remove( KEY_LASTEST_SNIPPET );
}

function* $__getStatistics(){
    var sum = yield base.$countSnippets('all'),
        ct = yield contrib.$statsRefers();
    return {count:sum, contribute: ct };
}

function* $_getStatistics(){
    return yield cache.$get( KEY_STATS, $__getStatistics );
}

function* $_getLastestSnippet(size){
    var limit = size || 15;
    return yield cache.$get( KEY_LASTEST_SNIPPET, function*(){
        return yield model.snippet.$findAll( {
            select: ['id', 'name', 'brief', 'language'],
            order: '`updated_at` desc',
            limit: limit,
            offset: 0
        });
    });
}

function* $_getBestSnippet(size){
    var limit = size || 15;

    return yield cache.$get( KEY_BEST_SNIPPET, function*(){
        var i, j, bs, ids, id, ret;
        bs = yield model.referStats.$findAll( {
            select: ['snippet_id'],
            order: '`sum` desc',
            limit: limit,
            offset: 0
            });

        for( i = 0; i < bs.length; i++ ){
            id = bs[i].snippet_id;
            if( i === 0 )
                ids = "'" + id + "'";
            else
                ids += ",'" + id + "'";
        }
        if( bs.length > 0 ){
            var rs = yield model.snippet.$findAll( {
                select: ['id', 'name', 'brief', 'language'],
                where: "`id` in (" + ids + ")"
            });
            //order by ids
            ret = [];
            for( i = 0; i < bs.length; i++ ){
                id = bs[i].snippet_id;
                for( j = 0; j < rs.length; j++ ){
                    if( rs[j].id === id )
                        ret.push( rs[j] );
                }
            }
            return ret;
        }
        return [];
    });
}

function MODULE_init(){
    _.each( Languages, function(lang){
        pendingCountKeys.push( keyLangCount(lang)  );
        pendingFirstPageKeys.push( keyLangFirstPage(lang));
    } );

    var init_gens = [ $_getAllPendingFirstPage, $_getStatistics, $_getLastestSnippet,  $_getBestSnippet, $_getAllPendingCount ];
    for( var i = 0; i < init_gens.length; i++ ){
        co( init_gens[i] ).then( function (val) {
        }, function (err) {
          console.error(err.stack);
        });
    }
}

MODULE_init();


module.exports = {
    $getAllPendingCount: $_getAllPendingCount,

    $getAllPendingFirstPage: $_getAllPendingFirstPage,

    $getAllPending: $_getAllPending,

    $removeLang: $_removeLangCache, 
    
    $get: cache.$get,

    $getStatistics: $_getStatistics, 
    $getLastestSnippet: $_getLastestSnippet,
    $getBestSnippet: $_getBestSnippet
};