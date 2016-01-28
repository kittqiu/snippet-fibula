'use strict';

const 
	_ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	pathToRegexp = require('path-to-regexp');

/*global vars*/
var help = {};//{'path':{re:regexp,lang1:"help text", ....}}

var RE_HELP_FILENAME = /^\[(\w+\.hlp)\]$/;

function loadHelp(file){
	var fstats = fs.statSync( file );

	if( fstats.isDirectory()){
		var files = fs.readdirSync( file );
		_.each( files, function(f){
			loadHelp( file + '/' + f);
		});
	}else if( fstats.isFile() ){
		var ext = path.extname(file);
		if( ext === '.json' ){
			//load and loop all path
			var dict = require(file);
			_.each(dict, function( value, key ){
				if( typeof key === 'string' && typeof value === 'string'){
					if( !help.hasOwnProperty(key)){
						var re = pathToRegexp(key);
						help[key] = {re:re};
					}//else none

					var h = help[key],
						basename = path.basename( file, '.json' ).toLowerCase();

					if( RE_HELP_FILENAME.test(value)){//load file
						var dir = path.dirname(file), 
							hlpfile = dir + '/' + value.match( RE_HELP_FILENAME )[1],
							fdata = fs.readFileSync(hlpfile, 'utf8');
						h[basename] = fdata;
					}else{
						h[basename] = value;
					}
				}else{
					console.log( '[INVALID] help text: ' + key + ' -> ' + value);
				}
			});
		}//else pass
	}//else pass
}

function MODULE_init(){
	loadHelp( __dirname + '/../../view/help' );
}
MODULE_init();

function getHelpText(urlpath, acceptLanguage ){
	console.log( urlpath );
	console.log(help);
	console.log( acceptLanguage);
	var h, p;
	for( p in help ){
		if( help.hasOwnProperty(p)){
			h =  help[p];
			if( h.re.test(urlpath)){
				break;
			}
		}
	}
	console.log(h);

	if( h ){
		// header like: zh-CN,zh;q=0.8,en;q=0.6,en-US;q=0.4,ru;q=0.2,zh-TW;q=0.2
	    var header = acceptLanguage.toLowerCase().replace(/\-/g, '_');
	    var
	    	i, s, n, ss = header.split(',');
	    for( i = 0; i < ss.length; i++ ){
	    	s = ss[i].trim();
	    	n = s.indexOf(';');
	    	if( n !== -1 ){
	    		s = s.substring(0, n).trim();
	    	}
	    	console.log('find ' + s);
	    	if( h.hasOwnProperty(s)){
	    		return h[s];
	    	}
	    }
	}
	
    return '';
}

module.exports = {
	getHelpText: getHelpText
}
