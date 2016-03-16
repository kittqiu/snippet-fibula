'use strict';
var 
	fs = require('fs'),	
	parse = require('co-busboy'), 
	attachment = require('./attachment'), 
    helper = require('../../helper'),
    api = require('../../api'),
    db = require('../../db'), 
    help = require('./help'),
    perm = require('./permission');

var 
    modelAtt = db.attachment,
    modelUser = db.user,
    getId = helper.getId;

/*
GET:
/api/file/:id
/api/help?path=encodeURIComponent(path)

/api/sys/role/list
/api/sys/user/:id/roles

POST:
/api/file?t=?

/api/sys/user/:id/roles
*/

module.exports = {
    /***************** GET METHOD *********/
    'GET /api/file/:id': function* (id){
        var att = yield modelAtt.$find(id);

        if( att != null ){
            this.attachment(att.name); 
            this.body = fs.createReadStream( att.path );
        }else{
            throw api.notFound( id );
        }
    },

    'GET /api/help': function* (){
        var txt,
            path = this.request.query.path || '/';
        path = decodeURIComponent( path );
        txt = help.getHelpText(path, this.request.get('Accept-Language') || 'en');
        this.body = {
            result: 'ok',
            help: txt
        }
    },

    'GET /api/sys/role/list': function* (){
        this.body = yield perm.role.$list();
    },

    'GET /api/sys/user/:id/roles': function* (id){
        this.body = yield perm.user.$listRoles(id);
    },

    /***************** POST METHOD *********/
    'POST /api/file': function* (){
    	if( !this.request.is('multipart/*')){
    		return yield next;
    	}    	

    	var part,
    		subsys = this.request.query.t || 'system',    		
    		parts = parse(this), files = [];
    	while( part = yield parts ){
    		if (part.length) {
		      // arrays are busboy fields 
		      console.log('key: ' + part[0])
		      console.log('value: ' + part[1])
		    } else {
		      	// otherwise, it's a stream
		      	var file = {}, id;
                //console.dir( part );
                file = yield attachment.$saveTmpFile( part, part.filename );
		      	id = yield attachment.$createAttachment( file.path, part.filename, subsys );
		     	files.push({attid:id, name:part.filename})
		      	console.log( part.filename );
		    }
    	}
    	this.body = {
    		result: 'ok',
    		files: files
    	};
    },

    'POST /api/sys/user/:id/roles': function* (uid){
        var u = yield modelUser.$find(uid),
            data = this.request.body;

        if( u === null ){
            throw api.notFound('user', this.translate('Record not found'));
        }
        yield perm.user.$setRoles(uid, data);
        this.body = { result: 'ok' };
    },

    'LoginRequired': [ /^\/sys[\s\S]*/, /^\/api\/file[\s\S]*/]
};