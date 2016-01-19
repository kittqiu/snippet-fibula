'use strict';
var 
	fs = require('fs'),	
	parse = require('co-busboy'), 
	attachment = require('./attachment');


/*
GET:

POST:
/api/file/upload?t=?
*/

module.exports = {
    /***************** GET METHOD *********/

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