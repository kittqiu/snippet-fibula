'use strict';

var 
    _ = require('lodash'),
    base = require('./base'),
    cache = require('../../cache');

var 
    model = base.model,
    config = base.config,
    modelFlow = model.flow,
    warp = model.warp;

var
    CACHE_PREFIX = 'snippet/',
    PAGE_SIZE = config.page_size,
    Languages = model.language;

function keyLangCount(lang){
    return CACHE_PREFIX + 'pending/language/' + lang;
}
function keyLangFirstPage(lang){
    return  CACHE_PREFIX + 'pending/language/' + lang + '/FirstPage';
}

var
    pendingCountKeys = [],// ['pending/language/0', 'pending/language/1'...]
    pendingFirstPageKeys= [];

function __init(){
    _.each( Languages, function(lang){
        pendingCountKeys.push( keyLangCount(lang)  );
        pendingFirstPageKeys.push( keyLangFirstPage(lang));
    } );
}

__init();


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
}

module.exports = {
    $getAllPendingCount: $_getAllPendingCount,

    $getAllPendingFirstPage: $_getAllPendingFirstPage,

    $getAllPending: $_getAllPending,

    $removeLang: $_removeLangCache, 
    
    $get: cache.$get
};