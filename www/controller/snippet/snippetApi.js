'use strict';
var 
    _ = require('lodash'),
    json_schema = require('../../json_schema'),
    helper = require('../../helper'),
    Page = require('../../page'),
    config = require('../../config'),
    api = require('../../api'),
    base = require('./base'),
    cache = require('./snippet_cache'),
    contrib = require('./contribute'),
    search = require('./search');

var 
    PAGE_SIZE = config.snippet.page_size,
    LARGE_PAGE_SIZE = config.snippet.large_page_size,
    SCORE_DELTA = config.snippet.score_delta,
    FLOW_CREATE = 'create',
    FLOW_EDIT = 'edit';

var 
    model = base.model,
    modelSnippet = model.snippet,
    modelContribute = model.contrib,
    modelHistory = model.history,
    modelRefer = model.refer,
    modelFlow = model.flow,
    modelFlowHistory = model.flowHistory,
    modelUser = model.user,
    next_id = model.next_id,
    warp = model.warp;

/*import function*/
var 
    $render = base.$render,
    getId = base.getId,
    next_id = model.next_id,
    validLanguage = base.validLanguage,
    validEnvironment = base.validEnvironment;

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


function __init(){
}

__init();
//loadCacheData();

function* $_getLastestHistory(snippet_id, version){
    var rs,
        sql = 'select h.newversion,u.name from  snippet_flow as h, users as u  where h.snippet_id=? and h.result=? and h.newversion <> ? and h.user_id=u.id order by h.newversion DESC limit 4';
    rs = yield warp.$query( sql, [snippet_id,'pass',version] );
    console.log( rs );
    return rs || [];
}

function mergeFixedModel(pageModel){
    pageModel['__languages'] = model.language;
    pageModel['__environments'] = model.environment;
}

function* $_render( context, pageModel, view ){
    mergeFixedModel(pageModel);
    yield $render( context, pageModel, view );
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
/snippet/search
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
    /***************** GET METHOD *********/
    /* index */
    'GET /snippet':function* (){
        var pageModel = {};
        base.setHistoryUrl(this);
        yield $_render( this, pageModel, 'snippet-index.html' );
    },

    /* create a snippet */
    'GET /snippet/create':function* (){
        var pageModel = {'__form': {action: '/api/snippet/create', name: 'Create'}};
        yield $_render( this, pageModel, 'snippet-form.html' );
    },

    /* view a snippet */
    'GET /snippet/entity/view': function* (id){
        var id = getId(this.request),
            pageModel = {'__id': id };
        base.setHistoryUrl(this);
        yield $_render( this, pageModel, 'snippet-view.html');
    },

    /* edit the snippet */
    'GET /snippet/entity/edit': function* (){
        var id = getId(this.request),
            path = '/api/snippet/entity/edit/' + id,
            pageModel = {'__id': id, '__form': {
                action: '/api/snippet/entity/edit/' + id, 
                name: 'Change', 
                src: '/api/snippet/view/entity/' + id,
                redirect: this.request.query.redirect
                } };        
        yield $_render( this, pageModel, 'snippet-form.html');
    }, 

    /* get pending snippets for all language */
    'GET /snippet/pending': function* (){
        var
            counts = yield cache.$getAllPendingCount(),
            records = yield cache.$getAllPendingFirstPage(),
            pages = [];
        console.log( records );
        for(var i = 0; i < counts.length; i++){
            if(counts[i]){
                var page = new Page(0,PAGE_SIZE);
                page.total = counts[i];
                pages.push( page.toJSON());
            }else{
                pages.push(null);
            }
        }
        base.setHistoryUrl(this);
        var pageModel = {'__counts': counts, '__records': records, '__pages': pages};
        yield $_render( this, pageModel, 'snippet-pending.html' );
    }, 

    'GET /snippet/pending/check': function* (){
        var id = getId(this.request),
            pageModel = {'__id': id, '__form': {
            action: '/api/snippet/' + id, 
            name: 'Check', 
            redirect: this.request.query.redirect
            } };
        yield $_render( this, pageModel, 'snippet-check.html');
    },

    'GET /snippet/pending/edit': function* (){
        var id = getId(this.request),
            path = '/api/snippet/pending/entity/' + id,
            pageModel = {'__id': id, '__form': {
                action: path, 
                name: 'Change', 
                redirect: this.request.query.redirect,
                src: path
                } };
        yield $_render( this, pageModel, 'snippet-form.html');
    }, 

    /* get pending list*/
    'GET /snippet/pending/list/:lang': function* (lang){
        var pageModel = {'__language':lang, '__page': this.request.query.page||1};
        base.setHistoryUrl(this);
        yield $render( this, pageModel, 'snippet-pending-list.html' );        
    },

    'GET /snippet/search': function* (){
        var rs = [],
            qstr = this.request.query.q,
            page =  helper.getPage(this.request,LARGE_PAGE_SIZE), 
            pageModel;
        if( qstr ){
            console.log( 'search:' + qstr);
            page.total = yield search.$count(qstr);
            if( !page.isEmpty ){
                rs = yield search.$search( qstr, LARGE_PAGE_SIZE * (page.index-1), LARGE_PAGE_SIZE );
            }
        }
        pageModel = { q:qstr, 'rs': rs, count:rs.length,  page: page };
        yield $render( this, pageModel, 'snippet-search-list.html' );
    },

    'GET /api/snippet/list/lastest': function* (id){
        var 
            limit = this.query.limit || 15,
            record;
        record = yield cache.$get( this.request.path, function*(){
            return yield model.snippet.$findAll( {
                select: ['id', 'name', 'brief', 'language'],
                order: '`updated_at` desc',
                limit: limit,
                offset: 0
            });
        } );
        
        this.body = record || {};
    },

    'GET /api/snippet/pending/entity/:id': function* (id){
        var record = yield model.flow.$find(id);
        this.body = record || {};
    },

    'GET /api/snippet/pending/lang/:lang': function* (lang){
        var
            page = helper.getPage(this.request,PAGE_SIZE), 
            snippets = yield cache.$getAllPending(lang, page);
            
        this.body = {
            page: page,
            snippets: snippets
        };
    },

    'GET /api/snippet/view/entity/:id': function* (id){
        var 
            param = this.query || {},
            record = yield model.snippet.$find(id);
        if( record && param){
            if( param.idToName ){
                var master,
                    user = yield model.user.$find(record.creator_id);
                if( record.creator_id === record.own_id ){
                    master = user;
                }else{
                    master = yield model.user.$find(record.own_id);
                }
                record.creator = user.name;
                record.master = master.name;
            }
            if( param.nextVersion ){
                var next_version = record.version + 1,
                    new_version = yield model.flow.$find({
                    select: ['id', 'score', 'contributor', 'newversion'],
                    where: '`snippet_id`=? and `newversion`=?',
                    params: [record.id, next_version]
                    });
                if( new_version !== null){
                    record.next_version = new_version;
                }
            }
            if( param.contributor){
                record.contrib = yield contrib.$getAll( id );
            }
            if( param.history){
                record.history = yield $_getLastestHistory(id,record.version);
            }
        }
        this.body = record || {};
    }, 

    /******************* POST METHOD *************************/

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

        yield model.flow.$create(snippet);
        yield contrib.$addEdit( snippet.id, user.id );

        //update cache
        yield cache.$removeLang(data.language);

        this.body = {
            id: snippet.id,
            redirect: base.getHistoryUrl(this)
        };
    },

    'POST /api/snippet/entity/edit/:id': function* (id){
        var 
            user = this.request.user,
            snippet, flowsnippet,
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

        yield contrib.$addEdit( id, user.id );
        yield modelFlow.$create(flowsnippet);

        //update cache
        yield cache.$removeLang(data.language);

        this.body = {
            id: snippet.id,
            redirect: base.getHistoryUrl(this)
        };
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

        var r = yield model.flow.$find(id);
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
        yield cache.$removeLang(data.language);
        if( isLangChanged ){
            yield cache.$removeLang(oldLang);
        }

        this.body = {
            id: id,
            redirect: base.getHistoryUrl(this)
        };
    },

    'POST /api/snippet/pending/check': function* (){
        var 
            r, history, num,
            columns = ['score', 'contributor'],
            user = this.request.user,
            data = this.request.body;

        //validate data
        json_schema.validate('checkSnippet', data);
        r = yield model.flow.$find(data.id);
        if( r === null ){
            throw api.notFound('snippet', this.translate('Record not found'));
        }

        /* user should not be the creator and check secondly*/
        if( r.user_id === user.id ){
            throw api.notAllowed(this.translate('Not Allowed'));
        }
        
        num = yield model.flowHistory.$findNumber( {
            select: 'count(*)',
            where: '`flow_id`=? and `user_id`=?',
            params: [data.id, user.id]
        });
        if( num > 0 ){
            throw api.notAllowed( this.translate('Not Repeat.'));
        }

        /*record the contribution*/
        yield contrib.$addCheck( r.snippet_id, user.id );

        /* save the action history*/ 
        history = {
            flow_id: r.id,
            user_id: user.id,
            action: data.type, 
            advice: data.advice || '',
            timeused: data.timeused
        };
        yield model.flowHistory.$create(history);

        if( data.type === 'pass' ){
            r.score = r.score + SCORE_DELTA > 100 ? 100 : r.score + SCORE_DELTA;
            if( r.score === 100 ){
                var snippet,
                    baseSnippet = yield model.snippet.$find(r.snippet_id);

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

        yield cache.$removeLang(r.language);
        this.body = {
            id: r.snippet_id,
            redirect: base.getHistoryUrl(this)
        };
    },    

    'POST /api/snippet/refer/entity/:id': function* (id){
        var user = this.request.user;
        yield contrib.$addRefer(id, user.id);
        this.body = {
            result: 'ok'
        }
    },

    'LoginRequired': [ '/snippet/create', '/api/snippet/create', '/snippet/pending']
};
