'use strict';

var 
	_ = require("lodash"),
	base = require('./base'), 
	attop = require('../system/attachment');

var 
	modelRes = base.model.resource,
	warp = base.model.warp;

var	
	TYPE_ATTACHMENT = 'attachment';

function* $__createResource( snippet, atts, type ){
	var sid = snippet.snippet_id,
		uid = snippet.user_id,
		version = snippet.newversion,
		r, i, aid;
	for( i = 0; i < atts.length; i++ ){
		aid = atts[i];
		r = {
			snippet_id: sid,
			user_id: uid,
			att_id: aid,
			type: type || TYPE_ATTACHMENT, 
			new_version:version
		}
		yield modelRes.$create(r);
		yield attop.$addRefer(aid);
	}
}

function* $_createAttachments( snippet, atts ){
	yield $__createResource( snippet, atts, TYPE_ATTACHMENT );
}

function* $__updateResource( snippet, atts, type ){
	var sid = snippet.snippet_id,
		version = snippet.newversion,
		uid = snippet.user_id,
		ors, r, i, j, aid, found;
	ors = yield modelRes.$findAll({
			select: '*',
			where: '`snippet_id`=? and `new_version`=? and type=?',
			params: [sid, version, type]
		});
	for( i = 0; i < atts.length; i++ ){
		aid = atts[i];
		found = false;
		for( j = 0; j < ors.length; j++ ){
			if( ors[j].att_id === aid ){
				ors.splice(j,1);
				found = true;
				break;
			}
		}
		if( !found ){//create on not found
			r = {
				snippet_id: sid,
				user_id: uid,
				att_id: aid,
				type: type || TYPE_ATTACHMENT, 
				new_version:version
				}
			yield modelRes.$create(r);
			yield attop.$addRefer(aid);
		}
	}
	//delete old resource
	for( i = 0; i < ors.length; i++ ){
		r = ors[i];
		yield attop.$descRefer(r.att_id);
		yield r.$destroy();
	}
}

function* $_updateAttachments( snippet, atts ){
	yield $__updateResource( snippet, atts, TYPE_ATTACHMENT );
}

function* $__deleteResource( snippet, type ){
	var sid = snippet.snippet_id,
		version = snippet.newversion,
		ors, r, i;
	ors = yield modelRes.$findAll({
			select: '*',
			where: '`snippet_id`=? and `new_version`=? and type=?',
			params: [sid, version, type]
		});
	
	//delete old resource
	for( i = 0; i < ors.length; i++ ){
		r = ors[i];
		yield attop.$descRefer(r.att_id);
		yield r.$destroy();
	}
}

function* $_deleteAttachments(snippet){
	yield $__deleteResource( snippet, TYPE_ATTACHMENT );
}

function* $__findResource( snippet_id, version, type ){
	var rs,
        sql = 'select att.id, att.path, att.name from snippet_resource as res, attachment as att where res.snippet_id=? and res.type=? and res.new_version=? and res.att_id=att.id ';
    rs = yield warp.$query( sql, [snippet_id, type, version] );
    return rs || [];
}

function* $_findAttachments( snippet_id, version ){
	return yield $__findResource( snippet_id, version, TYPE_ATTACHMENT );
}


module.exports = {
	$createAttachments: $_createAttachments,
	$updateAttachments: $_updateAttachments,
	$deleteAttachments: $_deleteAttachments,
	$findAttachments: $_findAttachments

};
