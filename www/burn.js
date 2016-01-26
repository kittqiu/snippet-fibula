'use strict';

var 
	crypto = require('crypto'),
	http = require('http'),
	co = require('co'),
	cluster = require('cluster'),
	config = require('./config'), 
	request = require('co-request'),
	db = require('./db');

//request.defaults({jar: true});
var 
	domain = 'http://localhost:80',
	cookiej = request.jar(),
	PASSWORD = '123456';

function* $get( url){
	var options = {
			url: domain + url,
			method: 'GET',
			jar: cookiej
		};
	return yield request(options);
}

function* $post( url, data){	
	var options = {
			url: domain + url,
			method: 'POST',
			json: true,
			body: data,
			jar: cookiej,
		};
	return yield request(options);
}

function* $registerUser(name, username, psd, email){
	var p = crypto.createHash('sha1').update(psd).digest('hex'),
		data = { name: name, username:username, password: p, email: email }, 
		url = '/api/signup',
		res, result;
	res = yield $post(url, data);
	result = res.body;
	if( result.error ){
		console.log( "Register user error, " + result.message );
	}else{
		console.log( 'Register user: ' + res.body.id);
	}	
	return res;
}

function* $login( user, psd ){
	var p = crypto.createHash('sha1').update(psd).digest('hex'),
		data = { username: user, password: p }, 
		url = '/api/authenticate',
		res;
	return yield $post(url, data);
}

function* $logout(){
	return yield $get('/auth/signout')
}

function isOK(response){
	var result = response.body;
	if( result.error ){
		console.log( "error:" + result.message );
		return false;
	}else{
		return true;
	}}

function* $burnUser(){
	var 
		i, r, name, email,
		psd = PASSWORD, 
		basename = 'test' + process.pid;
	for( i = 0; i < 100; i++ ){
		name = basename + i;
		email = name + '@example.com';
		r = yield $registerUser( name, name, psd, email );
		if( isOK(r)){
			r = yield $login(name, psd);
			if( isOK(r)){
				r = yield $logout();
				if( isOK(r)){
					continue;
				}
			}
		}
		break;
	}
	console.log( 'Create Users total ' + (i+1) );
}

var nameList = ['Bind', 'Hex', 'Bcd', 'Com', 'Uart', 'Find', 'Get', 'Set', 'Delete', 'Open', 
			'File', 'Close', 'Read', 'Write', 'List', 'Hash', 'Login', 'Week', 'Month', 'Year',
			'Logout', 'Auth', 'Search', 'Calc', 'Count', 'Number', 'Char', 'UCS2', 'Vendor', 'unBind', 'Create', 'Query'],

 	langList = require('./model/snippet/language.json'),
 	envList = require('./model/snippet/environment.json');

function getNameArray(){
	var size = nameList.length, n,
		name = [];
	for( var i = 0; i < 4 ; i++ ){
		n = Math.floor((Math.random() * 100) + 1) % size;
		name.push(nameList[n]);
	}
	return name;
}

function getLang(){
	var size = langList.length,
		 n =  Math.floor((Math.random() * 100) + 1) % size;
	return langList[n];
}

function getEnv(){
	var size = envList.length,
		 n =  Math.floor((Math.random() * 100) + 1) % size;
	return envList[n];
}

function getKeyWords(){
	var size = nameList.length, n,
		name = '';
	for( var i = 0; i < 4 ; i++ ){
		n = Math.floor((Math.random() * 100) + 1) % size;
		name += nameList[n];
	}
	return name;
}

function* $createSnippet(){
	var ns = getNameArray(),
		name = ns.join(''),
		kw = ns.join(' '),
		res;

	var data = {
			name: name,
			brief: 'this is a brief',
			language: getLang(),
			environment: getEnv(),
			keywords: kw,
			code: "this is code",
			help: "this is help",
			attachments: []
		};
	res = yield $post('/api/snippet/s', data);
	//console.log( 'Create Snippet: ' + (res.body.id||'error'));
	return res;
}

function* $checkSnippet(id){
	var url = '/api/snippet/pending/' + id + '/check',
		data = {
					id: id,
					type: 'pass',
					advice: 'this is an advice',
					timeused: 1000
				},
		res;
	res = yield $post(url, data);
	//console.log( 'Check Snippet: ' + (res.body.id||'error'));
	return res;
}

function* $getUsers(){
	var rs = yield db.user.$findAll({
			select: ['username'],
			limit: 300,
			order: '`created_at` desc'
		}),
		users = [];
	for( var i = 0; i < rs.length; i++ ){
		users.push( rs[i].username );
	}
	return users;
}

function getRandomUser(users, lastusers ){
	var size = users.length, n,
		name = '';
	while(true){
		n = Math.floor((Math.random() * 100) + 1) % size;
		name = users[n];
		if( lastusers.indexOf(name) === -1 )
			return name;
	}
	return name;
}

function* $burnSnippet(){
	var users = yield $getUsers(),
		username, r, i, j, sid, skipusers,
		SCORE_DELTA = Math.ceil(100/config.snippet.score_delta);

	db.warp.destroy();
	for( i = 0; i < 1000; i++ ){
		username = getRandomUser(users, []);
		r = yield $login(username, PASSWORD);
		if( !isOK(r) ) break;

		r = yield $createSnippet();
		if( !isOK(r) ) break;
		sid = r.body.id;
		
		r = yield $logout();
		if( !isOK(r) ) break;

		skipusers = [ username ];
		for( j = 0; j < SCORE_DELTA; j++ ){
			username = getRandomUser(users, skipusers );
			skipusers.push(username);
			r = yield $login(username, PASSWORD);
			if( !isOK(r) ) break;

			r = yield $checkSnippet(sid);
			if( !isOK(r) ) break;
			
			r = yield $logout();
			if( !isOK(r) ) break;
		}
	}
}

function* cleanUser(){
	var u = yield db.user.$find({
		select: '*',
		where: "`username` like 'test%'",
		order: '`created_at` asc',
		limit: 1
	});
	if( u !== null ){
		yield db.warp.$query( "delete from users where users.username like 'test%'");
		yield db.warp.$query( "delete from localusers where localusers.created_at >=" + u.created_at );
	}
}



function* $burnClean(){
	yield cleanUser();
}

var burnWork = {
	'user': $burnUser, 
	'clean': $burnClean,
	'snippet': $burnSnippet
};

function* burn(){
	var 
		start = Date.now(), 
		target = process.argv[2] || 'user';

	yield burnWork[target];
	console.log( 'execTime = ' + (Date.now() - start));
	// yield $login('qiuzy', '123456');
	// yield $logout();
	// yield $registerUser('test1', 'test1', '123456' );
	//console.log( cookiej.getCookies(domain) );

}


function main(){
	if( cluster.isMaster && process.argv[2] !== 'clean'){
		var cpus = process.argv[3] || 10;
		for(var i = 0; i < cpus; i++) {
    		cluster.fork();
    	}
    	cluster.on('exit', function(worker, code, signal) {
		    console.log('worker '+ worker.process.pid + ' died');
		  });
	}else{
		co( burn ).then( function (val) {
			  console.log(val);
			}, function (err) {
			  console.error(err.stack);
			});

	}
}

main();