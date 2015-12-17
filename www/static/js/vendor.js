
// extends jQuery.form:

$(function () {
    console.log('Extends $form...');
    $.fn.extend({
        showFormError: function (err) {
            return this.each(function () {
                var
                    $form = $(this),
                    $alert = $form && $form.find('.uk-alert-danger');                    
                if (! $form.is('form')) {
                    console.error('Cannot call showFormError() on non-form object.');
                    return;
                }
                $form.find('input').removeClass('uk-form-danger');
                $form.find('select').removeClass('uk-form-danger');
                $form.find('textarea').removeClass('uk-form-danger');
                if ($alert.length === 0) {
                    console.warn('Cannot find .uk-alert-danger element.');
                    return;
                }
                if (err) {
                    var errtext;
                    if( err instanceof( Array ) ){
                        $alert.find('p').remove();
                        $.each(err, function(n,error){
                            $alert.append($("<p></p>").text(error.message).prepend($("<i></i>").addClass('uk-icon-times')));
                            var fieldName = error && error.data;
                            if (fieldName) {
                                $form.find('[name=' + fieldName + ']').addClass('uk-form-danger');
                            }
                        });
                                             
                    }else{
                        errtext = err.message ? err.message : (err.error ? err.error : err);
                        $alert.text(errtext);

                        var fieldName = err && err.data;
                        if (fieldName) {
                            $form.find('[name=' + fieldName + ']').addClass('uk-form-danger');
                        }
                    }
                    $alert.removeClass('uk-hidden').show();
                    if (($alert.offset().top - 60) < $(window).scrollTop()) {
                        $('html,body').animate({ scrollTop: $alert.offset().top - 60 });
                    }
                }
                else {
                    $alert.addClass('uk-hidden').hide();
                    $form.find('.uk-form-danger').removeClass('uk-form-danger');
                }
            });
        },
        showFormLoading: function (isLoading) {
            return this.each(function () {
                var
                    $form = $(this),
                    $submit = $form && $form.find('button[type=submit]'),
                    $buttons = $form && $form.find('button');
                    $i = $submit && $submit.find('i'),
                    iconClass = $i && $i.attr('class');
                if (! $form.is('form')) {
                    console.error('Cannot call showFormLoading() on non-form object.');
                    return;
                }
                if (!iconClass || iconClass.indexOf('uk-icon') < 0) {
                    console.warn('Icon <i class="uk-icon-*>" not found.');
                    return;
                }
                if (isLoading) {
                    $buttons.attr('disabled', 'disabled');
                    $i && $i.addClass('uk-icon-spinner').addClass('uk-icon-spin');
                }
                else {
                    $buttons.removeAttr('disabled');
                    $i && $i.removeClass('uk-icon-spinner').removeClass('uk-icon-spin');
                }
            });
        },
        postJSON: function (url, data, callback) {
            if (arguments.length===2) {
                callback = data;
                data = {};
            }
            return this.each(function () {
                var $form = $(this);
                $form.showFormError();
                $form.showFormLoading(true);
                _httpJSON('POST', url, data, function (err, r) {
                    if (err) {
                        $form.showFormError(err);
                        $form.showFormLoading(false);
                    }
                    if (callback) {
                        if (callback(err, r)) {
                            $form.showFormLoading(false);
                        }
                    }
                });
            });
        }
    });
});

function _httpJSON(method, url, data, callback){
	var opt = {
		type : method, 
		dataType: 'json'
	};

	if( method === 'GET'){
		opt.url = url + '?' + data;
	}else if( method === 'POST'){
		opt.url = url;
		opt.data = JSON.stringify( data || {});
		opt.contentType = 'application/json';
	}

	$.ajax(opt).done(function(r){
		if( r && r.error ){
			return callback(r);
		}
		return callback( null, r );
	}).fail( function(jqXHR, textStatus){
		return callback({'error': 'http_bad_response', 'data': '' + jqXHR.status, 'message': '网络好像出问题了 (HTTP ' + jqXHR.status + ')'});
	});
}


function getJSON(url, data, callback){
	if( arguments.length === 2){
		callback = data;
		data = {};
	}
	if( typeof(data) === 'object'){
		var arr = [];
		$.each(data, function(k, v){
			arr.push( k + '=' + encodeURIComponent( v ));
		});
		data = arr.join('&');
	}
	_httpJSON( 'GET', url, data, callback );
}

function postJSON(url, data, callback){
	if( arguments.length === 2){
		callback = data;
		data = {};
	}
	_httpJSON( url, data, callback );
}

/*form validate*/
function isValidUserName(name){
    return  /^[a-zA-Z\\_][a-zA-Z0-9\\_]*$/.test(name);
}

function saltpassword(psd,salt){
    return CryptoJS.SHA1( psd + salt ).toString();
}

function parseDocBlock( lines ){
    var ss = _.map(lines.split('\n'), function (value) {
        return value.match(/^\s*\*?([\w\W]*)$/)[1].trim();
        }),
        doc = {
            name: '',
            brief: '',
            description: '',
            params: [],
            result: '',
            returns: []
        },
        continue_description = true,
        continue_brief = false;

    _.each(ss, function (value) {
        value = value.replace('\\', '@');
        console.log(value);
        var m, param, err;

        //brief
        if( value.indexOf('@brief')===0 ){
            doc.brief = value.substring(6).trim();
            continue_brief = true;
            return;
        }

        //details
        if( value.indexOf('@details')===0 ){
            doc.description = value.substring(8).trim();
            continue_description = true;
            return;
        }

        if( value.length === 0 ){
            if( continue_brief )
                continue_brief = false;
        }

        if( value.indexOf('@') === 0) {
            continue_brief = false;
            continue_description = false;
        }
        if( value.indexOf('@name') === 0 ) {
            doc.name = value.substring(5).trim();
        } else if( value.indexOf('@param') === 0) {
            /*@param [dir] <parameter-name> { parameter description }*/
            m = value.match(/^(?:\@|\\)param\s+(\[\w+(?:\,\w+)?\])?\s*(\w+)\s+([\w\W]+)$/);
            
            if (m) {
                param = {
                    dir: m[1],
                    name: m[2],
                    description: m[3]
                };
                doc.params.push(param);
            } else {
                console.log('WARNING: invalid doc line: ' + value);
            }
        } else if (value.indexOf('@return') === 0) {
            doc.result = value.substring(7).trim();
        }else if (value.indexOf('@retval') === 0) {
            // @return {object} User object.
            m = value.match(/^(?:\@|\\)retval\s+(\w+)\s+([\w\W]*)$/);
            if (m) {
                console.log(m[2]);
                result = {
                    value: m[1],
                    description: m[2]
                };
                doc.returns.push(result);
            } else {
                console.log('WARNING: invalid doc line: ' + value);
            }
        }else {
            if( continue_brief ){
                doc.brief = doc.brief + value;
            }
            // append description:
            if (continue_description) {
                doc.description = doc.description + value;
            }
        }
    });
    return doc;
}

/*find comment block and parse it*/
function getCommentDoc(src){
    var 
        codeobj = {},
        docs = src.match(/[\w\W]*(\/\*(?:\*|!)?([\d\D]*)\*?\*\/)[\w\W]*/);
    if(docs){
        var comment = docs[1];
        codeobj.doc =  parseDocBlock( docs[2] );
        codeobj.code = src.replace( comment, '' );        
    }else{
        codeobj.code= src;
    }
    return codeobj;
}

function codeToHtml( src ){
    var codeobj = getCommentDoc(src);
    var html = '<div class="dv-snippet">';
    if( codeobj.doc ){
        var doc = codeobj.doc;
        if( doc.name ){
            html += '<h2>' + _.escape(doc.name) + '</h2>';
        }
        if( doc.brief ){
           html += '<p>' + _.escape(doc.brief) + '</p>';
        }
        if( doc.description ){
            html += '<dl>';
            html += '<dt>说明:</dt>';
            html += '<dd>' + doc.description + '</dd>';
            html += '</dl>';             
        }
        if( doc.params ){
            html += '<dl class="dv-params">';
            html += '<dt>参数:</dt>';
            html += '<dd><table class="dv-params">';
            _.each(doc.params, function(param){
                html += '<tr><td class="dv-paramdir">' + (param.dir?_.escape(param.dir):'') + '</td><td class="dv-paramname">' + _.escape(param.name) + '</td><td>' + _.escape(param.description) + '</td></tr>'
            });
            html += '</table></dd></dl>';
        }
        html += '<dl class="dv-returns"><dt>返回:</dt>';
        if( doc.result ){            
            html += '<dd>' + _.escape(doc.result) +'</dd>';
        }else if( doc.returns ){
            html += '<dd><table class="dv-returns">';
            _.each(doc.returns, function(result){
                html += '<tr><td class="dv-retval">' + _.escape(result.value) + '</td><td>' + _.escape(result.description) + '</td></tr>'
            });
            html += '</table></dd>';
        }
        html += '</dl>';
    }
    html += '<div><dl><dt>代码:</dt><dd><pre>' + codeobj.code.trim()  +'</dd></dl></pre></div>';
    html += '</div>';
    return html;
}