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
    search = require('./search'),
    Page = require( '../../page'),
    resource = require('./resource');

var 
    PAGE_SIZE = config.snippet.page_size,
    LARGE_PAGE_SIZE = config.snippet.large_page_size,
    SCORE_DELTA = config.snippet.score_delta,
    FLOW_CREATE = 'create',
    FLOW_EDIT = 'edit',
    TYPE_CODE = 'code',
    TYPE_ATT = 'attachment',
    RESULT_DOING = 'processing',
    DEFAULT_SECTION = 0;

var 
    model = base.model,
    modelSnippet = model.snippet,
    modelContribute = model.contrib,
    modelHistory = model.history,
    modelRefer = model.refer,
    modelReferStats = model.referStats,
    modelFlow = model.flow,
    modelFlowHistory = model.flowHistory,
    modelUser = model.user,
    modelRes = model.resource,
    next_id = model.next_id,
    warp = model.warp;

/*import function*/
var 
    $render = base.$render,
    getId = base.getId,
    next_id = model.next_id,
    validLanguage = base.validLanguage,
    validEnvironment = base.validEnvironment;


function __init(){
}

__init();

function* $_getLastestHistory(snippet_id, version){
    var rs,
        sql = 'select h.newversion,u.name from  snippet_flow as h, users as u  where h.snippet_id=? and h.result=? and h.newversion <> ? and h.user_id=u.id order by h.newversion DESC limit 4';
    rs = yield warp.$query( sql, [snippet_id,'pass',version] );
    return rs || [];
}

function* $_getStatsHistory(snippet_id){
    var r = yield modelReferStats.$find({
            select: '*',
            where: '`snippet_id`=?',
            params: [snippet_id]
        });
    return r || { snippet_id: snippet_id, last_week: 0, last_month: 0, last_year: 0, sum: 0 };
}

function* $_getSnippetHistory(snippet_id, offset, limit){
    offset = offset < 0 ? 0: offset;
    limit = limit < 0 ? LARGE_PAGE_SIZE : limit;

    var rs,
        sql = 'select h.id, h.snippet_id, h.newversion, h.updated_at, u.name as user from snippet_flow as h, users as u where h.snippet_id=? and h.result=? and h.user_id=u.id order by h.newversion DESC limit '
        + limit + ' OFFSET ' + offset;
    rs = yield warp.$query( sql, [snippet_id,'pass'] );
    return rs || [];
}

function* $_countSnippetHistory(snippet_id){
    return yield modelFlow.$findNumber({
        select: 'count(*)',
        where: '`snippet_id`=? and result=?',
        params: [snippet_id, 'pass']
    });
}

function* $_getSnippetVersion(snippet_id, version){
    return yield modelFlow.$find({
            select: '*',
            where: '`snippet_id`=? and `newversion`=? and result=?',
            params: [snippet_id, version, 'pass']
        });
}

function* $_findWiki(title){
    return yield model.wiki.$find({
                select: '*',
                where: '`title`=?',
                params: [title]
            });
}

function* $_countWikiVersion(title){
    return yield model.wikiHistory.$findNumber({
        select: 'count(*)',
        where: '`title`=?',
        params: [title]
    })
}

function* $_getWikiVersions(title, offset, limit){
    offset = offset < 0 ? 0: offset;
    limit = limit < 0 ? 10 : limit;
    return yield model.wikiHistory.$findAll({
        where: '`title`=?',
        params: [title],
        order: '`newversion` desc',
        limit: limit,
        offset: offset
    });
}

function __getHeaderLevel(line){
    var j, sn = 0;
    for( j = 0; j < line.length; j++ ){//h1, h2, h3...hn
        if( line.charAt(j) !== '#'){
            break;
        }
        sn++;
    }
    return sn;
}

function _splitWiki( content, section ){
    if( typeof(section) === 'string'){
        section = parseInt(section);
    }
    if( section === DEFAULT_SECTION ){
        return {before:'', value:content, after:''};
    }
    var i, m,l, lt, s = 0, 
        before = '', 
        after = '',
        value = '',
        step = 0,
        sn = 0,
        lines = content.split('\n');

    for( i = 0; i < lines.length; i++ ){
        l = lines[i];
        lt = l.trim();
        if( lt.length > 0 && lt.charAt(0) === '#'){
            if( l.charAt(0) !== '\t' &&  l.substr(0,3) !== '   '){//find header
                s++;
                if( s === section ){//find section
                    step = 1;
                    sn = __getHeaderLevel( lt );
                }
                if( s > section && step === 1 ){//cross section
                    m = __getHeaderLevel( lt );
                    if( sn >= m){
                        step = 2;
                    }
                }
            }
        }
        switch(step){
            case 0:
                before += l + '\n';
            break;
            case 1:
                value += l + '\n';
            break;
            case 2:
                after += l + '\n';
            break;
        }
    }
    return {before:before, value:value, after:after};
}

function _validateSnippet(data){
    json_schema.validate('createSnippet', data);
    if( !validLanguage(data.language) ){
        throw api.invalidParam('language'); 
    }
    if( !validEnvironment(data.environment)){
        throw api.invalidParam('environment'); 
    }
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
/snippet/s?page=x?lang=x
/snippet/s/creation
/snippet/s/:id
/snippet/s/:id/edit
/snippet/s/:id/history?page=x
/snippet/s/:id/history/:version
/snippet/mine/index
/snippet/mine/own?page=1
/snippet/mine/edit?page=1
/snippet/pending
/snippet/pending/:id/check
/snippet/pending/:id/edit
/snippet/pending/lang/:lang?page=x
/snippet/search
/snippet/wiki
/snippet/wiki/:title/edit?section=x
/snippet/wiki/:title/history?page=x
/snippet/wiki/:title/history/:version
/api/snippet/index
/api/snippet/s/:id?idToName=true&nextVersion=true&contributor=true&history=true&stats=true
/api/snippet/s/:id/history/:version
/api/snippet/pending/:id
/api/snippet/pending/lang/:lang?page=x
/api/snippet/wiki/:title
/api/snippet/wiki/:title/history/:version


POST:
/api/snippet/s
/api/snippet/s/:id
/api/snippet/s/:id/refer
/api/snippet/pending/:id/edit
/api/snippet/pending/:id/check
/api/snippet/wiki/:title
*/


module.exports = {
    /***************** GET METHOD *********/
    /* index */
    'GET /snippet':function* (){
        var pageModel = {};
        base.setHistoryUrl(this);
        yield $_render( this, pageModel, 'snippet-index.html' );
    },

    'GET /snippet/s': function* (){
         var lang= this.request.query.lang || 'all',
            page = helper.getPage(this.request,LARGE_PAGE_SIZE),
            pageModel, rs;
        page.total = yield base.$countSnippets(lang);
        rs = yield base.$getSnippets( lang, (page.index-1)*LARGE_PAGE_SIZE, LARGE_PAGE_SIZE );
        pageModel = { lang:lang, page:page, snippets:rs, count: rs.length };
        yield $_render( this, pageModel, 'snippet-all.html');      
    },

    /* create a snippet */
    'GET /snippet/s/creation':function* (){
        var pageModel = {'__form': {action: '/api/snippet/s', name: 'Create'}};
        yield $_render( this, pageModel, 'snippet-form.html' );
    },

    /* view a snippet */
    'GET /snippet/s/:id': function* (id){
        var pageModel = {'__id': id };
        base.setHistoryUrl(this);
        yield $_render( this, pageModel, 'snippet-view.html');
    },

    /* edit the snippet */
    'GET /snippet/s/:id/edit': function* (id){
        var pageModel = {'__id': id, '__form': {
                action: '/api/snippet/s/' + id, 
                name: 'Change', 
                src: '/api/snippet/s/' + id,
                redirect: this.request.query.redirect
                } };        
        yield $_render( this, pageModel, 'snippet-form.html');
    }, 

    'GET /snippet/s/:id/history': function* (id){
        var index = this.request.query.page||'1',
            index = parseInt(index),
            page = new Page(index, LARGE_PAGE_SIZE),
            snippets = yield $_getSnippetHistory( id, (index-1)*LARGE_PAGE_SIZE, LARGE_PAGE_SIZE ),
            record = yield model.snippet.$find(id),
            pageModel;
        page.total = yield $_countSnippetHistory( id );
        pageModel = { name: record.name, id:id, page:page, snippets:snippets, count: snippets.length };
        yield $_render( this, pageModel, 'snippet-history.html');      
    },

    'GET /snippet/s/:id/history/:version': function* (id,version){
        var pageModel = { id:id, version: version};
        yield $_render( this, pageModel, 'snippet-history-view.html');
    },

    'GET /snippet/mine/index': function* (){
        var pageModel,
            user_id = this.request.user.id,
            count = yield contrib.$countMySnippet( user_id ),
            snippets = yield contrib.$getMySnippets( user_id, 0, PAGE_SIZE ), 
            editcount = yield contrib.$countMyEditSnippet( user_id ),
            editrs = yield contrib.$getMyEditSnippets( user_id, 0, PAGE_SIZE ), 
            stats_month = yield contrib.$statsCurrentMonth(user_id),
            stats_all = yield contrib.$statsMyContrib(user_id);

        pageModel = { count: count, more: count > PAGE_SIZE, snippets: snippets, 
            editcount: editcount, editmore: editcount > PAGE_SIZE, editsnippets: editrs,
            stats_month: stats_month, stats_all: stats_all };
        yield $_render( this, pageModel, 'snippet-mine.html');
    },

    'GET /snippet/mine/own': function* (){
        var pageModel,
            index = this.request.query.page||'1',
            index = parseInt(index),
            page = new Page(index, LARGE_PAGE_SIZE),
            user_id = this.request.user.id,
            snippets;
        base.setHistoryUrl(this);
        page.total = yield contrib.$countMySnippet( user_id );
        snippets = yield contrib.$getMySnippets( user_id, (index-1)*LARGE_PAGE_SIZE, LARGE_PAGE_SIZE );
            
        pageModel = { type:'create', page:page, snippets:snippets, count: snippets.length };
        yield $render( this, pageModel, 'snippet-mine-list.html' );        
    },

    'GET /snippet/mine/edit': function* (){
        var pageModel,
            index = this.request.query.page || '1',
            index = parseInt(index),
            page = new Page(index, LARGE_PAGE_SIZE),
            user_id = this.request.user.id,
            snippets;
        base.setHistoryUrl(this);
        page.total = yield contrib.$countMyEditSnippet( user_id );
        snippets = yield contrib.$getMyEditSnippets( user_id, (page.index-1)*LARGE_PAGE_SIZE, LARGE_PAGE_SIZE );
            
        pageModel = { type:'edit', page:page, snippets:snippets, count: snippets.length };
        yield $render( this, pageModel, 'snippet-mine-list.html' );        
    },

    /* get pending snippets for all language */
    'GET /snippet/pending': function* (){
        var
            counts = yield cache.$getAllPendingCount(),
            records = yield cache.$getAllPendingFirstPage(),
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
        base.setHistoryUrl(this);
        var pageModel = {'__counts': counts, '__records': records, '__pages': pages};
        yield $_render( this, pageModel, 'snippet-pending.html' );
    }, 

    'GET /snippet/pending/:id/check': function* (id){
        var pageModel = {'__id': id, '__form': {
            action: '/api/snippet/' + id, 
            name: 'Check', 
            redirect: this.request.query.redirect
            } };
        yield $_render( this, pageModel, 'snippet-check.html');
    },

    'GET /snippet/pending/:id/edit': function* (id){
        var path = '/api/snippet/pending/' + id,
            pageModel = {'__id': id, '__form': {
                action: '/api/snippet/pending/' + id + '/edit', 
                name: 'Change', 
                redirect: this.request.query.redirect,
                src: path
                } };
        yield $_render( this, pageModel, 'snippet-form.html');
    }, 

    /* get pending list*/
    'GET /snippet/pending/lang/:lang': function* (lang){
        var pageModel = {'__language':lang, '__page': this.request.query.page||1};
        base.setHistoryUrl(this);
        yield $render( this, pageModel, 'snippet-pending-list.html' );        
    },

    'GET /snippet/search': function* (){
        var rs = [], r,
            qstr = this.request.query.q,
            page =  helper.getPage(this.request,LARGE_PAGE_SIZE), 
            pageModel;
        if( qstr ){
            console.log( 'search:' + qstr);
            r = yield search.$searchAndCount(qstr, LARGE_PAGE_SIZE * (page.index-1), LARGE_PAGE_SIZE);
           /* page.total = yield search.$count(qstr);
            if( !page.isEmpty ){
                rs = yield search.$search( qstr, LARGE_PAGE_SIZE * (page.index-1), LARGE_PAGE_SIZE );
            }*/
            page.total = r.count;
            rs = r.rs;
        }
        pageModel = { q:qstr, 'rs': rs, count:rs.length,  page: page };
        yield $render( this, pageModel, 'snippet-search-list.html' );
    },

    'GET /snippet/wiki': function* (){
        var name = this.request.query.lang || this.request.query.env || model.language[0];
        base.setHistoryUrl(this);
        yield $_render( this, {title:name}, 'snippet-wiki.html');
    },

    'GET /snippet/wiki/:title/edit': function* (title){
        var section = this.request.query.section || 0;
        yield $_render( this, {title:title, section:section}, 'snippet-wiki-form.html');
    },

    'GET /snippet/wiki/:title/history': function* (title){
        var page =  helper.getPage(this.request,LARGE_PAGE_SIZE),
            pageModel, rs;

        page.total = yield $_countWikiVersion(title);
        rs = yield $_getWikiVersions(title, LARGE_PAGE_SIZE * (page.index-1), LARGE_PAGE_SIZE );
        pageModel = {title:title, page: page, 'rs': rs, count:rs.length};

        yield $_render( this, pageModel, 'snippet-wiki-history-list.html');        
    },

    'GET /snippet/wiki/:title/history/:version':function* (title, version){
        yield $_render( this, {title:title, version:version}, 'snippet-wiki-history.html');
    },

    'GET /api/snippet/s/:id/history/:version': function* (id,version){
        var r = yield $_getSnippetVersion(id, version);
        if( r !== null){
            r.attachments = yield resource.$findAttachments(r.snippet_id, r.newversion);
        }  
        this.body = r;
    },

    'GET /api/snippet/index': function* (){
        var limit =  this.query.limit || 15,
            stats = yield cache.$getStatistics(),
            lastest = yield cache.$getLastestSnippet( limit ),
            best = yield cache.$getBestSnippet(limit);
        this.body = { stats: stats, lastest: lastest, best:best };
    },

    'GET /api/snippet/pending/:id': function* (id){
        var record = yield model.flow.$find(id), 
            atts;
        if( record !== null){
            atts = yield resource.$findAttachments(record.snippet_id, record.newversion);
            record.attachments = atts;
        } 
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

    'GET /api/snippet/s/:id': function* (id){
        var 
            param = this.query || {},
            record = yield model.snippet.$find(id),
            atts;

        if( record !== null){
            atts = yield resource.$findAttachments(id, record.version);
            record.attachments = atts;
        } 

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
                    select: ['id', 'user_id', 'score', 'contributor', 'newversion'],
                    where: '`snippet_id`=? and `newversion`=? and `result`=?',
                    params: [record.id, next_version, RESULT_DOING ]
                    });//too long, 32ms
                if( new_version !== null){
                    record.next_version = new_version;
                }
            }
            if( param.contributor){
                record.contrib = yield contrib.$getAll( id );//too long 47ms
            }
            if( param.history){
                record.history = yield $_getLastestHistory(id,record.version);
            }
            if( param.stats){
                record.stats = yield $_getStatsHistory(id);
            }
        }
        this.body = record || {};
    },

    'GET /api/snippet/wiki/:title':function* (title){
        var section = this.request.query.section || DEFAULT_SECTION,
            r = yield $_findWiki(title),
            sp;
        if( r !== null ){
            console.log(section);
            sp = _splitWiki(r.content, section);
            console.log(sp);
            this.body = { content: sp.value }
        }else {
            this.body = {}
        }        
    },

    'GET /api/snippet/wiki/:title/history/:version':function* (title, version){
        var r = yield model.wikiHistory.$find({
                select: '*',
                where: '`title`=? and `newversion`=?',
                params: [title, version]
            });
        this.body = r || {};     
    },

    /******************* POST METHOD *************************/

    'POST /api/snippet/s': function* (){
        var 
            user = this.request.user,
            snippet,
            data = this.request.body, 
            attachments;

        _validateSnippet(data);//validate data
        attachments = data.attachments || [];

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
            type: TYPE_CODE,
            code: data.code,
            help: data.help,
            newversion: 0,
            score:0,
            contributor:''
        };

        yield model.flow.$create(snippet);
        if(attachments.length > 0){
            yield resource.$createAttachments(snippet,attachments);
        }
        yield contrib.$addEdit( snippet.id, user.id );

        //update cache
        yield cache.$removeLang(data.language);

        this.body = {
            id: snippet.id,
            redirect: base.getHistoryUrl(this)
        };
    },

    'POST /api/snippet/s/:id': function* (id){
        var 
            user = this.request.user,
            snippet, flowsnippet,
            data = this.request.body, 
            attachments;

        _validateSnippet(data);//validate data
        attachments = data.attachments || [];

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
            type: TYPE_CODE,
            code: data.code,
            help: data.help,
            newversion: snippet.version + 1,
            score:0,
            contributor:''
        };

        yield contrib.$addEdit( id, user.id );
        yield modelFlow.$create(flowsnippet);
        yield resource.$createAttachments(flowsnippet,attachments);

        //update cache
        yield cache.$removeLang(data.language);

        this.body = {
            id: snippet.id,
            redirect: base.getHistoryUrl(this)
        };
    },    

    'POST /api/snippet/pending/:id/edit': function* (id){
        var 
            isLangChanged = false,
            oldLang,
            data = this.request.body,
            attachments;

        _validateSnippet(data);//validate data
        attachments = data.attachments || [];
        console.log( attachments );

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

        yield r.$update(['name', 'brief', 'language', 'environment', 'keywords', 'code', 'help', 'updated_at']);
        yield resource.$updateAttachments(r,attachments);

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

    'POST /api/snippet/pending/:id/check': function* (id){
        var 
            r, history, num,
            columns = ['score', 'contributor'],
            user = this.request.user,
            data = this.request.body;

        //validate data
        json_schema.validate('checkSnippet', data);
        r = yield model.flow.$find(id);
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
                    baseSnippet = yield model.snippet.$find(r.snippet_id), 
                    kw = r.name + ' ' + r.language + ' ' + r.environment + ' ' + r.keywords;         
                r.help += yield contrib.$getAllCheckAdvice(r.id);

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
                        type: r.type,
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
                    baseSnippet.type = r.type;
                    baseSnippet.code = r.code;
                    baseSnippet.help = r.help;
                    //baseSnippet.version = r.newversion; _base.js auto increment
                    yield baseSnippet.$update(['name','brief', 'language', 'environment', 'keywords', 'code', 'help', 'updated_at', 'version']);
                }
                yield search.$index( kw, r.snippet_id );

                r.result = 'pass';
                columns.push('result');                
            }//else update score only
        }else if( data.type === 'discard' ){
            r.score = r.score - SCORE_DELTA < -100? -100 : r.score - SCORE_DELTA;
            if( r.score === -100 ){
                r.result = 'discard';
                columns.push('result');
                yield resource.$deleteAttachments(r);
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

    'POST /api/snippet/s/:id/refer': function* (id){
        var user = this.request.user;
        yield contrib.$addRefer(id, user.id);
        this.body = {
            result: 'ok'
        }
    },

    'POST /api/snippet/wiki/:title': function* (title){
        var r, section, sp,
            data = this.request.body;

        json_schema.validate('editwiki', data);        
        r = yield $_findWiki(title);
        if( r === null ){
            yield model.wiki.$create( {title:title, content:data.content});
        }else{//replace
            section = data.section;
            sp = _splitWiki( r.content, section );
            console.log(sp);
            yield model.wikiHistory.$create( {title:r.title, content:r.content, newversion:r.version} );
            r.content = sp.before + data.content + sp.after;
            yield r.$update(['content','updated_at', 'version']);
        }

        this.body = {
            result: 'ok',
            title: title,
            redirect: base.getHistoryUrl(this)
        };
    },


    'LoginRequired': [ /^\/snippet[\s\S]*/, /^\/api\/snippet[\s\S]*/]
};
