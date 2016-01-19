'use strict';
var
	crypto = require('crypto'),
	//hashFile = require('hash-file'),
	thunkify = require('thunkify'),
	cofs = require('co-fs'), 
	fs = require('fs'),
	path = require('path'),
	cs = require('co-stream'),
	db = require('../../db');

var 
	//$__hashFile = thunkify(hashFile),
	modelAtt = db.attachment;

function* $__saveFile(istream, ostream){
	var cin = new (cs.Reader)(istream),
		cos = new (cs.Writer)(ostream), 
		data, 
		size = 0;
	while(data = yield cin.read()) {
		yield cos.write(data);
		size += data.length;
	}
	return size;
}

function* $_saveTmpFile(istream, fname){
	var tmpname  = fname + Date.now() + '.tmp',
		tmppath = './media/tmp',
		size;
	yield $_createDirs(tmppath);
	tmppath += '/' + tmpname;
	size = yield $__saveFile(istream, fs.createWriteStream(tmppath));
	return {path:tmppath, name: tmpname, size: size};
}

function* $_hashFile(path){
	var crypter = crypto.createHash('sha1'),
		is = fs.createReadStream(path),
		cin = new (cs.Reader)(is),
		data;

	while(data = yield cin.read()) {
		crypter.update( data );
	}
	return crypter.digest('hex');
}

function* $_createDirs(dist){
	/*var dir1 = parent + '/' + dhash.substr(0,2),
		dir2 = dir1 + '/' + dhash.substr(2,2);
	if( !(yield cofs.exists(dir1))){
		yield cofs.mkdir(dir1);
	}
	if( !(yield cofs.exists(dir2))){
		yield cofs.mkdir(dir2);
	}*/
	
	var dist = path.resolve(dist);
	if( yield cofs.exists(dist)){
		return true;
	}else{
		var parent = path.dirname(dist);
		if( !(yield cofs.exists(parent)) ){
			yield $_createDirs(parent);
		}
		cofs.mkdir(dist);		
	}
	return true;
}

function* $_createAttachment(tmppath, fileName, subsystem){
	var att,
		fhash = yield $_hashFile( tmppath ), 
		dhash = crypto.createHash('sha1').update(fhash).digest('hex'),
		parent = './media/' + subsystem + '/' + dhash.substr(0,2) + '/' + dhash.substr(2,2),
		path = parent + '/' + fhash,
		id = db.next_id(), 
		newop = true;

	console.log( "Create attachment: " + fileName + ", hash:" + fhash + ",to:" + path );
	yield $_createDirs(parent);
	if( fs.existsSync(path) ){//hash conflict
		if( fs.statSync(path).size === fs.statSync(tmppath).size ){//same file
			newop = false;
		}else{//conflict
			path += Date.now();
		}
	}

	if( newop ){
		yield cofs.rename(tmppath, path);
		att = {
			id: id,
			refer: 0, 
			name: fileName, 
			path: path
		};
		yield modelAtt.$create( att );
	}
	else{
		att = yield modelAtt.$find({
			select: ['id'],
			where: '`path`=?',
			params: [path]
		});
		id = att.id;
	}
	console.log( id );
	return id;
}

module.exports = {
	$createAttachment: $_createAttachment,
	$saveTmpFile: $_saveTmpFile
};