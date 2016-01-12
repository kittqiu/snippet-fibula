'use strict';

var 
	base = require('./base');

var 
    model = base.model,
    modelContribute = model.contrib,
    warp = model.warp;

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

module.exports = {
    $addCheck: $_addCheckContribution,
    $addEdit: $_addEditContribution,
    $addRefer: $_addReferContribution,
    $get: $_getContribution,
    $getAll: $_getAllContribution
};
