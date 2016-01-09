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
    modelUser = db.user,
    next_id = db.next_id,
    warp = db.warp;

var 
    CACHE_PREFIX = 'snippet/',
    PAGE_SIZE = config.snippet.page_size,
    SCORE_DELTA = config.snippet.score_delta,
    CONTRIB_EDIT = 'edit',
    CONTRIB_CHECK = 'check',
    CONTRIB_REFER = 'refer';

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
    FLOW_EDIT = 'edit',
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

function* $_addContribution( snippet_id, user_id, type ){
    var contrib = yield modelContribute.$find({
                    where: '`snippet_id`=? and `user_id`=?',
                    params: [snippet_id, user_id ], 
                    limit: 1
                });
    if( contrib ){
        if( type === CONTRIB_CHECK ){
            contrib.check_count += 1;
            yield contrib.$update(['check_count']);
        }else if( type === CONTRIB_EDIT ){
            contrib.edit_count += 1;
            yield contrib.$update(['edit_count']);
        }else if( type === CONTRIB_REFER ){
            contrib.refer_count += 1;
            yield contrib.$update(['refer_count']);
        }//else no do
    }else{
        contrib = {
            snippet_id: snippet_id,
            user_id: user_id,
            check_count: type === CONTRIB_CHECK ? 1 : 0,
            edit_count: type === CONTRIB_EDIT ? 1 : 0,
            refer_count: type === CONTRIB_REFER ? 1 : 0
        }
        yield modelContribute.$create(contrib);
    } 
}

function* $_addCheckContribution( snippet_id, user_id ){
    yield $_addContribution( snippet_id, user_id, CONTRIB_CHECK );
}

function* $_addEditContribution( snippet_id, user_id ){
    yield $_addContribution( snippet_id, user_id, CONTRIB_EDIT );
}

function* $_addReferContribution( snippet_id, user_id ){
    yield $_addContribution( snippet_id, user_id, CONTRIB_REFER );
}

function* $_getContribution(snippet_id, type){
    var rs,
        column = type + '_count',
        sql = 'select c.' + column+',u.name from  snippet_contribute as c, users as u where c.snippet_id=? and c.' + column + ' != 0 and c.user_id=u.id';
    rs = yield warp.$query( sql, [snippet_id] );
    return rs || [];
}
function* $_getAllContribution( snippet_id ){
    var check, edit, refer, contrib;
    check = yield $_getContribution( snippet_id, CONTRIB_CHECK );
    edit = yield $_getContribution( snippet_id, CONTRIB_EDIT );
    refer = yield $_getContribution( snippet_id, CONTRIB_REFER );
    contrib = {
        check: check,
        edit: edit,
        refer: refer
    };
    return contrib;
}

function* $_getLastestHistory(snippet_id, version){
    var rs,
        sql = 'select h.newversion,u.name from  snippet_flow as h, users as u  where h.snippet_id=? and h.result=? and h.newversion <> ? and h.user_id=u.id order by h.newversion DESC limit 4';
    rs = yield warp.$query( sql, [snippet_id,'pass',version] );
    console.log( rs );
    return rs || [];
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
/snippet
/snippet/create
/snippet/entity/view?id=id
/snippet/entity/edit?id=id
/snippet/pending
/snippet/pending/check?id=id
/snippet/pending/edit?id=id
/snippet/pending/list/:lang
/api/snippet/list/lastest?limit=limit
/api/snippet/pending/entity/:id
/api/snippet/pending/lang/:lang
/api/snippet/view/entity/:id


POST:
/api/snippet/create
/api/snippet/entity/edit/:id
/api/snippet/pending/entity/:id
/api/snippet/pending/check
/api/snippet/refer/entity/:id
*/


module.exports = {
    'GET /snippet':function* (){
        var model = {};
        yield $_render( this, model, 'snippet-index.html' );
    },
	'GET /snippet/create':function* (){
        var model = {'__languages':modelDict['language'], '__environments':modelDict['environment'], '__form': {action: '/api/snippet/create', name: 'Create'}};
        yield $_render( this, model, 'snippet-form.html' );
    },
    'GET /snippet/entity/view': function* (id){
        var id = getId(this.request),
            model = {'__id': id };
        yield $_render( this, model, 'snippet-view.html');
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
            score:0,
            contributor:''
        };

        yield modelFlow.$create(snippet);
        yield $_addEditContribution( snippet.id, user.id );

        //update cache
        yield $_removeLangCache(data.language);

        this.body = {
            id: snippet.id
        };
    },
    

    'GET /api/snippet/pending/lang/:lang': function* (lang){
        var
            page = helper.getPage(this.request,PAGE_SIZE), 
            snippets = yield $_getAllPending(lang, page);
            
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
            model,
            path = '/api/snippet/pending/entity/' + id;
        model = {'__languages':modelDict['language'], '__environments':modelDict['environment'], '__id': id, '__form': {
            action: path, 
            name: 'Change', 
            redirect: this.request.query.redirect,
            src: path
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
            r, history, num,
            columns = ['score', 'contributor'],
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
        
        num = yield modelFlowHistory.$findNumber( {
            select: 'count(*)',
            where: '`flow_id`=? and `user_id`=?',
            params: [data.id, user.id]
        });
        if( num > 0 ){
            throw api.notAllowed( this.translate('Not Repeat.'));
        }

        /*record the contribution*/
        yield $_addCheckContribution( r.snippet_id, user.id );

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
                var snippet,
                    baseSnippet = yield modelSnippet.$find(r.snippet_id);

                /* create or update */
                if( baseSnippet === null ){
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
                    yield modelSnippet.$create(snippet);
                }else{
                    baseSnippet.name = r.name;
                    baseSnippet.brief = r.brief;
                    baseSnippet.language = r.language;
                    baseSnippet.environment = r.environment;
                    baseSnippet.keywords = r.keywords;
                    baseSnippet.code = r.code;
                    baseSnippet.help = r.help;
                    //baseSnippet.version = r.newversion; _base.js auto increment
                    yield baseSnippet.$update(['name','brief', 'language', 'environment', 'keywords', 'code', 'help', 'version']);
                }

                r.result = 'pass';
                columns.push('result');
                
            }//else update score only
        }else if( data.type === 'discard' ){
            r.score = r.score - SCORE_DELTA < -100? -100 : r.score - SCORE_DELTA;
            if( r.score === -100 ){
                r.result = 'discard';
                columns.push('result');
            }
        }

        if( r.contributor && r.contributor .length > 0 ){
            r.contributor += ',' + user.id;
        }else{
            r.contributor = user.id;
        }
        yield r.$update(columns);

        yield $_removeLangCache(r.language);
        this.body = {
            id: r.snippet_id
        };
    },

    'GET /api/snippet/view/entity/:id': function* (id){
        var 
            param = this.query || {},
            record = yield modelSnippet.$find(id);
        if( record && param){
            if( param.idToName ){
                var master,
                    user = yield modelUser.$find(record.creator_id);
                if( record.creator_id === record.own_id ){
                    master = user;
                }else{
                    master = yield modelUser.$find(record.own_id);
                }
                record.creator = user.name;
                record.master = master.name;
            }
            if( param.nextVersion ){
                var next_version = record.version + 1,
                    new_version = yield modelFlow.$find({
                    select: ['score', 'contributor', 'newversion'],
                    where: '`snippet_id`=? and `newversion`=?',
                    params: [record.id, next_version]
                    });
                if( new_version !== null){
                    record.next_version = new_version;
                }
            }
            if( param.contributor){
                record.contrib = yield $_getAllContribution( id );
            }
            if( param.history){
                record.history = yield $_getLastestHistory(id,record.version);
            }
        }
        this.body = record || {};
    }, 

    'GET /api/snippet/list/lastest': function* (id){
        var 
            limit = this.query.limit || 15,
            record;

        record = yield cache.$get( this.request.path, function*(){
            return yield modelSnippet.$findAll( {
                select: ['id', 'name', 'brief', 'language'],
                order: '`updated_at` desc',
                limit: limit,
                offset: 0
            });
        } );
        
        this.body = record || {};
    },

    /* edit the snippet */
    'GET /snippet/entity/edit': function* (){
        var id = getId(this.request),
            model,
            path = '/api/snippet/entity/edit/' + id;
        model = {'__languages':modelDict['language'], '__environments':modelDict['environment'], '__id': id, '__form': {
            action: '/api/snippet/entity/edit/' + id, 
            name: 'Change', 
            src: '/api/snippet/view/entity/' + id,
            redirect: this.request.query.redirect
            } };
        yield $_render( this, model, 'snippet-form.html');
    }, 

    'POST /api/snippet/entity/edit/:id': function* (id){
        var 
            user = this.request.user,
            snippet, flowsnippet,
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

        snippet = yield modelSnippet.$find(id);
        if( snippet === null ){
            throw api.notFound('snippet', this.translate('Record not found'));
        }

        //flow object
        flowsnippet = {
            id: next_id(),
            flow_type: FLOW_EDIT,
            snippet_id: id,
            user_id: user.id,
            name: data.name,
            brief: data.brief,
            language: data.language,
            environment: data.environment,
            keywords: data.keywords,
            code: data.code,
            help: data.help,
            newversion: snippet.version + 1,
            score:0,
            contributor:''
        };

        yield $_addEditContribution( id, user.id );
        yield modelFlow.$create(flowsnippet);

        //update cache
        yield $_removeLangCache(data.language);

        this.body = {
            id: snippet.id
        };
    },

    'POST /api/snippet/refer/entity/:id': function* (id){
        var user = this.request.user;
        yield $_addReferContribution(id, user.id);
        this.body = {
            result: 'ok'
        }
    },


    'LoginRequired': [ '/snippet/create', '/api/snippet/create', '/snippet/pending']
};
