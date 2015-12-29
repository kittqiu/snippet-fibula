'use strict';
var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('./home'),
    db = require('../db'),
    json_schema = require('../json_schema'),
    cache = require('../cache'), 
    helper = require('../helper'),
    Page = require('../page'),
    config = require('../config'),
    api = require('../api');

var 
    modelDict = {},
	modelSnippet = db.snippet,
    modelContribute = db.snippet_contribute,
    modelHistory = db.snippet_history,
    modelRefer = db.snippet_refer,
    modelFlow = db.snippet_flow,
    modelFlowHistory = db.snippet_flow_history,
    next_id = db.next_id,
    warp = db.warp;

var 
    CACHE_PREFIX = 'snippet/',
    PAGE_SIZE = config.snippet.page_size,
    SCORE_DELTA = config.snippet.score_delta;

function loadFixedModels(){
    var files = fs.readdirSync( __dirname + '/../model/snippet');
    var re = new RegExp("^[A-Za-z][A-Za-z0-9\\_]*\\.json$");
    var models =  _.filter(files, function (f) {
        return re.test(f);
        });

    _.each(models, function(fname){
        var name = fname.slice(0, -5);
        var path = __dirname + '/../model/snippet/' + fname;
        var model = require( path );
        modelDict[name] = model;
        console.log( 'find model ' + name + ' in ' + path );
    });
}

/*function loadCacheData(){
    _.each( modelDict['language'], function(lang, index){
        modelSnippet.findNumber({
            select: 'count(*)',
            where: 'language=? and version=0',
            params: [index]
        }, function(err, num ){
            if(err){
                console.log(err);
            }else{
                console.log( num );
                cache.set( CACHE_PREFIX + 'language/' + lang, num );
            }
        });
    } );
}*/

function keyLangCount(lang){
    return CACHE_PREFIX + 'pending/language/' + lang;
}
function keyLangFirstPage(lang){
    return  CACHE_PREFIX + 'pending/language/' + lang + '/FirstPage';
}

var
    FlowType = [],
    FLOW_CREATE = 'create',
    Languages =  [], // [  'C', 'C++' ....]
    pendingCountKeys = [],// ['pending/language/0', 'pending/language/1'...]
    pendingFirstPageKeys= [];

function __init(){
    loadFixedModels();
    FlowType = modelDict['workflow'];
    Languages =  modelDict['language'];

    _.each( Languages, function(lang){
        pendingCountKeys.push( keyLangCount(lang)  );
        pendingFirstPageKeys.push( keyLangFirstPage(lang));
    } );
}



__init();
//loadCacheData();



function validLanguage(value){
    return _.indexOf( Languages, value ) !== -1;
}

function validEnvironment(value){
    return _.indexOf( modelDict['environment'], value ) !== -1;
}

function* $__getPendingCount(lang){
    return yield cache.$get( keyLangCount(lang), function*(){
        return yield modelFlow.$findNumber( {
            select: 'count(*)',
            where: '`flow_type`=?  and `result`=? and `language`=?',
            params: ['create', 'processing', lang]
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
            select: ['id', 'snippet_id', 'user_id', 'name', 'brief', 'score'],
            where: '`flow_type`=?  and `result`=? and `language`=?',
            params: ['create', 'processing', lang], 
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
            select: ['id', 'snippet_id', 'user_id', 'name', 'brief', 'score'],
            where: '`flow_type`=? and `result`=? and `language`=?',
            params: ['create', 'processing', lang], 
            order: '`created_at` desc',
            offset: page.offset,
            limit: page.limit
        });
}


function* $_removeLangCache(lang){
    yield cache.$remove(keyLangCount(lang) );
    yield cache.$remove(keyLangFirstPage(lang) );
}

function getId(request) {
    var id = request.query.id;
    if (id && id.length === 50) {
        return id;
    }
    throw api.notFound('id');
}

function getView(view){
	return 'snippet/' + view;
}

function* $_render( context, model, view ){
    context.render( 'snippet/' + view, yield home.$getModel.apply(context, [model]) );
}

/*
GET:
/snippet/create
/snippet/pending
/snippet/pending/check?id=id
/snippet/pending/edit
/snippet/pending/list/:lang
/api/snippet/pending/entity/:id
/api/snippet/pending/lang/:lang

POST:
/api/snippet/create
/api/snippet/pending/entity/:id
/api/snippet/pending/check
*/


module.exports = {    
	'GET /snippet/create':function* (){
        var model = {'__languages':modelDict['language'], '__environments':modelDict['environment'], '__form': {action: '/api/snippet/create', name: 'Create'}};
        yield $_render( this, model, 'snippet-form.html' );
    },
    'GET /snippet/pending': function* (){
        var
            counts = yield $_getAllPendingCount(),
            records = yield $_getAllPendingFirstPage(),
            pages = [];
        for(var i = 0; i < counts.length; i++){
            if(counts[i]){
                var page = new Page(0,PAGE_SIZE);
                page.total = counts[i];
                pages.push( page.toJSON());
            }else{
                pages.push(null);
            }
        }

        var model = {'__languages':modelDict['language'], '__environments':modelDict['environment'], '__counts': counts, '__records': records, '__pages': pages};
        yield $_render( this, model, 'snippet-pending.html' );
    }, 

	'POST /api/snippet/create': function* (){
        var 
            user = this.request.user,
            snippet,
            contrib,
            data = this.request.body;

        //validate data
        json_schema.validate('createSnippet', data);
        if( !validLanguage(data.language) ){
            throw api.invalidParam('language'); 
        }
        if( !validEnvironment(data.environment)){
            throw api.invalidParam('environment'); 
        }

        //flow object
        snippet = {
            id: next_id(),
            flow_type: FLOW_CREATE,
            snippet_id: next_id(),
            user_id: user.id,
            name: data.name,
            brief: data.brief,
            language: data.language,
            environment: data.environment,
            keywords: data.keywords,
            code: data.code,
            help: data.help,
            newversion: 0,
            score:0
        };
        contrib = {
            id: next_id(),
            snippet_id: snippet.id,
            user_id: user.id,
            edit_count: 1
        }
        yield modelFlow.$create(snippet);
        yield modelContribute.$create(contrib);

        //update cache
        yield $_removeLangCache(data.language);

        this.body = {
            id: snippet.id
        };
    },
    

    'GET /api/snippet/pending/lang/:lang': function* (lang){
        var
            ids = "", contribs, i,
            user = this.request.user,
            page = helper.getPage(this.request,PAGE_SIZE), 
            snippets = yield $_getAllPending(lang, page);

        for(i = 0; i < snippets.length; i++ ){
            if( i !== 0 )
                ids += ','
            ids += "'" + snippets[i].id + "'";
        }
        if( ids.length > 0 ){
            contribs = yield modelFlowHistory.$findAll({
                select: ['flow_id'],
                where: '`user_id`=?  and `flow_id` in (' + ids + ') group by `flow_id`',
                params: [user.id ]
            });
            if( contribs !== null && contribs.length > 0 ){
                ids = [];
                for( i = 0; i < contribs.length; i++)
                    ids.push( contribs[i].flow_id);

                console.log(ids);
                for( i = 0; i < snippets.length; i++  ){
                    if( _.indexOf(ids,snippets[i].id) !== -1 ){
                        snippets[i].pass = true;
                    }
                }
            }
        }
        //console.log(snippets);

        this.body = {
            page: page,
            snippets: snippets
        };
    },

    'GET /snippet/pending/list/:lang': function* (lang){
        var model = {'__language':lang, '__page': this.request.query.page||1};
        yield $_render( this, model, 'snippet-pending-list.html' );
        
    },

    'GET /snippet/pending/edit': function* (){
        var id = getId(this.request),
            model;
        model = {'__languages':modelDict['language'], '__environments':modelDict['environment'], '__id': id, '__form': {
            action: '/api/snippet/pending/entity/' + id, 
            name: 'Change', 
            redirect: this.request.query.redirect
            } };
        yield $_render( this, model, 'snippet-form.html');
    }, 

    'GET /api/snippet/pending/entity/:id': function* (id){
        var record = yield modelFlow.$find(id);
        this.body = record || {};
    },

    'POST /api/snippet/pending/entity/:id': function* (id){
        var 
            isLangChanged = false,
            oldLang,
            data = this.request.body;

        //validate data
        json_schema.validate('createSnippet', data);
        if( !validLanguage(data.language) ){
            throw api.invalidParam('language'); 
        }
        if( !validEnvironment(data.environment)){
            throw api.invalidParam('environment'); 
        }

        var r = yield modelFlow.$find(id);
        if( r === null ){
            throw api.notFound('snippet', this.translate('Record not found'));
        }
        isLangChanged = r.language !== data.language;
        oldLang = r.language;

        r.name = data.name;
        r.brief = data.brief;
        r.language = data.language;
        r.environment = data.environment;
        r.keywords = data.keywords;
        r.code = data.code;
        r.help = data.help;

        yield r.$update(['name', 'brief', 'language', 'environment', 'keywords', 'code', 'help']);
        //update cache
        yield $_removeLangCache(data.language);
        if( isLangChanged ){
            yield $_removeLangCache(oldLang);
        }

        this.body = {
            id: id
        };
    },

    'GET /snippet/pending/check': function* (){
        var id = getId(this.request),
            model = {'__languages':modelDict['language'], '__environments':modelDict['environment'],'__id': id, '__form': {
            action: '/api/snippet/' + id, 
            name: 'Check', 
            redirect: this.request.query.redirect
            } };
        yield $_render( this, model, 'snippet-check.html');
    },

    'POST /api/snippet/pending/check': function* (){
        var 
            contrib, r, history, num,
            columns = ['score'],
            user = this.request.user,
            data = this.request.body;

        //validate data
        json_schema.validate('checkSnippet', data);
        r = yield modelFlow.$find(data.id);
        if( r === null ){
            throw api.notFound('snippet', this.translate('Record not found'));
        }

        /* user should not be the creator and check secondly*/
        if( r.user_id === user.id ){
            throw api.notAllowed(this.translate('Not Allowed'));
        }
        console.log(data);
        num = yield modelFlowHistory.$findNumber( {
            select: 'count(*)',
            where: '`flow_id`=? and `user_id`=?',
            params: [data.id, user.id]
        });
        if( num > 0 ){
            throw api.notAllowed( this.translate('Not Repeat.'));
        }

        /*record the contribution*/
        contrib = yield modelContribute.$find({
                    where: '`snippet_id`=? and `user_id`=?',
                    params: [r.snippet_id, user.id], 
                    limit: 1
                });
        if( contrib ){
            contrib.check_count += 1;
            yield contrib.$update(['check_count']);
        }else{
            contrib = {
                snippet_id: r.snippet_id,
                user_id: user.id,
                check_count: 1
            }
            yield modelContribute.$create(contrib);
        } 

        /* save the action history*/ 
        history = {
            flow_id: r.id,
            user_id: user.id,
            action: data.type, 
            advice: data.advice || '',
            timeused: data.timeused
        };
        yield modelFlowHistory.$create(history);

        if( data.type === 'pass' ){
            r.score = r.score + SCORE_DELTA > 100 ? 100 : r.score + SCORE_DELTA;
            if( r.score === 100 ){
                var snippet;

                snippet = {
                    id: r.snippet_id,
                    creator_id: r.user_id,
                    own_id: r.user_id,
                    name: r.name, 
                    brief: r.brief,
                    language: r.language,
                    environment: r.environment,
                    keywords: r.keywords, 
                    code: r.code, 
                    help: r.help,
                    version: 0,
                    created_at: r.created_at 
                }; 

                r.result('pass');
                columns.push('result');
                yield modelSnippet.$create(snippet);
            }//else update score only
        }else if( data.type === 'discard' ){
            r.score = r.score - SCORE_DELTA < -100? -100 : r.score - SCORE_DELTA;
            if( r.score === -100 ){
                r.result('discard');
                columns.push('result');
            }
        }
        yield r.$update(columns);

        yield $_removeLangCache(r.language);
        this.body = {
            id: r.snippet_id
        };
    },
    

    'LoginRequired': [ '/snippet/create', '/api/snippet/create', '/snippet/pending']
};