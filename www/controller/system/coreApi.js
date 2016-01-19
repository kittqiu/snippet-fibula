'use strict';
var 
	fs = require('fs'),	
	parse = require('co-busboy'), 
	attachment = require('./attachment'), 
    helper = require('../../helper'),
    api = require('../../api'),
    db = require('../../db');

var 
    modelAtt = db.attachment,
    getId = helper.getId;

/*
GET:
/api/file/download?id=?

POST:
/api/file/upload?t=?
*/

module.exports = {
    /***************** GET METHOD *********/
    'GET /api/file/download': function* (){
        var id = getId(this.request),
            att = yield modelAtt.$find(id);

        if( att != null ){
            this.attachment(att.name); 
            this.body = fs.createReadStream( att.path );
        }else{
            throw api.notFound( id );
        }
    },

    /***************** POST METHOD *********/
    'POST /api/file/upload': function* (){
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
		      	//part.pipe(fs.createWriteStream(tmppath));
		      	id = yield attachment.$createAttachment( file.path, part.filename, subsys );
		     	files.push({attid:id, name:part.filename})
		      	console.log( part.filename );
		    }
    	}
    	this.body = {
    		result: 'ok',
    		files: files
    	};
    }
};