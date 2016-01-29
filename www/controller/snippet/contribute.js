'use strict';

var 
    reminder = require('reminder'),
    co = require('co'),
	base = require('./base'), 
    helper = require('../../helper');

var 
    model = base.model,
    modelContribute = model.contrib,
    modelRefer = model.refer,
    modelReferStats = model.referStats,
    modelSnippet = model.snippet,
    modelFlowHistory = model.flowHistory,
    modelFlow = model.flow,
    warp = model.warp,
    job;

var
    CONTRIB_EDIT = 'edit',
    CONTRIB_CHECK = 'check',
    CONTRIB_REFER = 'refer';

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
    yield modelRefer.$create({snippet_id: snippet_id, user_id: user_id});
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

/************ statistics ******************/
function* $_statsRefers(){
    var r = yield modelReferStats.$findAll({
        select: 'sum(`last_week`) as last_week, sum(`last_month`) as last_month, sum(`last_year`) as last_year, sum(`sum`) as sumary'
    });
    return r === null ? {} : r[0];
}

function* $__statsSnippet( snippet_id, type, year, tyvalue ){
    var 
        where = '`snippet_id`=? and year(FROM_UNIXTIME(`created_at`/1000))=?' + (type === 'YEAR' ? '': ' and ' + type + '(FROM_UNIXTIME(`created_at`/1000)) = ?'),
        params = [ snippet_id, year ];
    if( type !== 'YEAR' ){
        params.push(tyvalue);
    }
    return yield modelRefer.$findNumber( {
                select: 'count(*)',
                where: where,
                params: params
            });
}

function* $_statsSnippet( snippet_id ){    
    var now = new Date(),
        week = helper.getWeek(),
        month = now.getMonth(),
        year = now.getFullYear(), 
        lastweek, lastmonth, lastyear,
        weekcnt, monthcnt, yearcnt, sum, 
        r;

    //last week
    if( week === 0 ){
        lastweek = 52;
        lastyear = year -1;
    }else{
        lastweek = week - 1;
        lastyear = year;
    }
    weekcnt = yield $__statsSnippet( snippet_id, 'WEEK', lastyear, lastweek);

    //last month
    if( month === 0 ){
        lastmonth = 12;
        lastyear = year -1;
    }else{
        lastmonth = month;//mysql 1-12, but javascript 0-11
        lastyear = year;
    }
    monthcnt = yield $__statsSnippet( snippet_id, 'MONTH', lastyear, lastmonth);

    //last year
    lastyear = year - 1;
    yearcnt = yield $__statsSnippet( snippet_id, 'YEAR', lastyear);

    sum = yield modelRefer.$findNumber( {
                select: 'count(*)',
                where: '`snippet_id`=?',
                params: [snippet_id]
            });

    r = yield modelReferStats.$find({
            select: '*',
            where: '`snippet_id`=?',
            params: [snippet_id]
        });
    if( r === null ){
        r = {
            snippet_id: snippet_id,
            last_week: weekcnt,
            last_month: monthcnt, 
            last_year: yearcnt,
            sum: sum
        };
        yield modelReferStats.$create(r);
    }else{
        r.last_week = weekcnt;
        r.last_month = monthcnt;
        r.last_year = yearcnt;
        r.sum = sum;
        yield r.$update(['last_week', 'last_month', 'last_year', 'sum']);
    }
}

function* $_getLastStatsTime(){
    var sql = "SELECT created_at FROM snippet_refer ORDER BY created_at DESC LIMIT 1",
        r = yield warp.$query( sql );   
    return r!==null && r.length > 0? r[0].created_at : 0;
}

function* $_countLastRefer(fromtime){
    return yield modelRefer.$findNumber({
        select: 'count(*)',
        where: '`created_at`>?',
        params: [fromtime]
        });
}

function* $statsSnippets(){
    var i, j, rs,
        page_size = 100,
        //count = yield base.$countSnippets(),
        lasttime = yield $_getLastStatsTime(),
        count = yield $_countLastRefer(lasttime);

    for( i = 0; i < count; i += page_size){
        /*rs = yield modelSnippet.$findAll({
                select: ['id'],
                order: '`created_at` desc',
                limit: page_size,
                offset: i
            });*/
        rs = yield modelRefer.$findAll({
                select: ['id'],
                where: '`created_at`>?',
                params: [lasttime],
                order: '`created_at` inc',
                limit: page_size,
                offset: i
            });
        for( j = 0; j < rs.length; j++ ){
            //yield $_statsSnippet( rs[j].id );
            yield $_statsSnippet( rs[j].snippet_id );
        }
    }
}

function statsSnippets(){
    co( $statsSnippets ).then( function () {
          console.log('statistics ok!');
          setTimeout(resetJob, 120000 );
          //setTimeout(resetJob, 12000 );
        }, function (err) {
          console.error(err.stack);
          setTimeout(resetJob, 120000 );
        });
}

function resetJob(){
    console.log( 'reset statistics jobs');
    job.at( '23:59', statsSnippets );
    //job.at( '17:39', statsSnippets );
}

function __init(){
    job = new reminder();
    statsSnippets();    
}
__init();


/**********************mine***********************/
function* $_countMySnippet(user_id){
    return yield modelSnippet.$findNumber({
        select: 'count(*)',
        where: '`own_id`=?',
        params: [user_id]
    });
}

function* $_getMySnippets(user_id, offset, limit){
    offset = offset < 0 ? 0: offset;
    limit = limit < 0 ? 10 : limit;
    return yield modelSnippet.$findAll({
        where: '`own_id`=?',
        params: [user_id],
        order: '`created_at` desc',
        limit: limit,
        offset: offset
    });
}

function* $_countMyEditSnippet(user_id){
    /*return yield modelFlow.$findNumber({
        select: 'count(*)',
        where: '`user_id`=? group by `snippet_id`',
        params: [user_id]
    });*/
    var sql = "select count(*) as c from ( select count(*)from `snippet_flow` where `user_id`='"
        + user_id + "' group by `snippet_id`) t",
        r = yield warp.$query( sql );
    return r[0].c;
}

function* $_getMyEditSnippets(user_id, offset, limit){
    offset = offset < 0 ? 0: offset;
    limit = limit < 0 ? 10 : limit;
    return yield modelFlow.$findAll({
        where: '`user_id`=? group by `snippet_id`',
        params: [user_id],
        order: '`created_at` desc',
        limit: limit,
        offset: offset
    });
}

function* $__countFromDate(Model, user_id, start_time){
    return yield Model.$findNumber({
            select: 'count(*)',
            where: '`user_id`=? and `created_at`>?',
            params: [user_id, start_time],
        });
}

function* $__countByUser(Model,user_id){
    return yield Model.$findNumber({
            select: 'count(*)',
            where: '`user_id`=?',
            params: [user_id],
        });
}

function* $_statsCurrentMonth(user_id){
    var start_time = helper.getFirstDayOfMonth().getTime(),
        checkcnt = yield $__countFromDate(modelFlowHistory, user_id, start_time),
        editcnt = yield $__countFromDate(modelFlow, user_id, start_time),
        refercnt = yield $__countFromDate(modelRefer, user_id, start_time);
    return {check:checkcnt, edit:editcnt, refer:refercnt};
}

function* $_statsMyContrib(user_id){
    var checkcnt = yield $__countByUser(modelFlowHistory, user_id),
        editcnt = yield $__countByUser(modelFlow, user_id),
        refercnt = yield $__countByUser(modelRefer, user_id);
    return {check:checkcnt, edit:editcnt, refer:refercnt};
}

function* $_getAllCheckAdvice(flow_id){
     var rs,
        sql = 'select h.advice,u.name from  snippet_flow_history as h, users as u  where h.flow_id=? and h.user_id=u.id',
        r = yield modelFlow.$find(flow_id),
        advice = '';
    rs = yield warp.$query( sql, [flow_id] );
    if( r !== null && rs ){
        advice = '\n\n### 版次' + r.newversion + '的审核建议\n';
        for( var i = 0; i < rs.length; i++ ){
            if( rs[i].advice ){
                advice += '* ' + rs[i].advice + '\n';
            }
        }
        advice += '\n\n'
    }
    return advice;
}

module.exports = {
    $addCheck: $_addCheckContribution,
    $addEdit: $_addEditContribution,
    $addRefer: $_addReferContribution,
    $get: $_getContribution,
    $getAll: $_getAllContribution,
    $getAllCheckAdvice: $_getAllCheckAdvice,

    $statsRefers: $_statsRefers,

    $countMySnippet: $_countMySnippet,
    $getMySnippets: $_getMySnippets,
    $countMyEditSnippet: $_countMyEditSnippet,
    $getMyEditSnippets: $_getMyEditSnippets,
    $statsCurrentMonth: $_statsCurrentMonth,
    $statsMyContrib: $_statsMyContrib
};

