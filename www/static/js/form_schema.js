
var SCHEMA_PROPERTY = {
	EMAIL:{
		type: 'string',
        maxLength: 100,
        pattern: '^(?:[\\w\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+\\.)*[\\w\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+@(?:(?:(?:[a-z0-9](?:[a-z0-9\\-](?!\\.)){0,61}[a-z0-9]?\\.)+[a-z0-9](?:[a-z0-9\\-](?!$)){0,61}[a-z0-9]?)|(?:\\[(?:(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\.){3}(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\]))$',
        desc: '邮箱'
	},
	NAME:{
		type: 'string',
		minLength: 1,
		maxLength: 100,
		pattern:'^\\s*[^\\s]+.*$',
		desc: '名称'
	},
	PASSWORD:{
		type: 'string',
		minLength: 6,
		maxLength: 20,
		pattern: '^[a-f0-9A-Z]{6,20}$',
		desc: '密码'
	},
	PASSWORDVERIFY:{
		type: 'string',
		minLength: 6,
		maxLength: 20,
		pattern: '^[a-f0-9A-Z]{6,20}$',
		desc: '确认密码'
	},
	USERNAME:{
		type: 'string',
		minLength: 3,
		maxLength: 50,
		pattern: '^[a-z0-9\\_\\-]{3,50}$',
		desc: '用户名'
	},
	USERNAMEOREMAIL:{
		type: 'string',
		minLength: 3,
		maxLength: 50,
		pattern: '^((?:[a-z0-9\\_\\-]{3,50})|(?:(?:[\\w\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+\\.)*[\\w\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+@(?:(?:(?:[a-z0-9](?:[a-z0-9\\-](?!\\.)){0,61}[a-z0-9]?\\.)+[a-z0-9](?:[a-z0-9\\-](?!$)){0,61}[a-z0-9]?)|(?:\\[(?:(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\.){3}(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\]))))$',
		desc: '用户名或邮箱'
	}
};

var SCHEMAS = {
	signup: {
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME,
			username: SCHEMA_PROPERTY.USERNAME,
			password: SCHEMA_PROPERTY.PASSWORD,
			verifypassword: SCHEMA_PROPERTY.PASSWORDVERIFY,
			email: SCHEMA_PROPERTY.EMAIL,
		},
		required:['name', 'username', 'password', 'email']
	},
	login: {
		type: 'object',
		properties: {
			username: SCHEMA_PROPERTY.USERNAMEOREMAIL,
			password: SCHEMA_PROPERTY.PASSWORD
		},
		required:['username', 'password']
	}
};

var formjjv = jjv();
$.each( SCHEMAS, function(k, v){
	formjjv.addSchema(k,v);
});

var code2Message = {
    required: '参数不能为空',
    email: '无效的电子邮件',
    pattern: '格式无效',
    minLength: '不满足最少字符',
    maxLength: '超过了允许最大字符',
    minimum: '超出了最小允许范围',
    exclusiveMinimum: '超出了最小允许范围',
    maximum: '超出了最大允许范围',
    exclusiveMaximum: '超出了最大允许范围',
};

function getPropertyDesc(schema,property){
	return SCHEMAS[schema].properties[property].desc;
}

function translateFormError(schema, errors){
	if (!errors.validation) {
        throw {error:'Invalid JSON request.'};
    }
    exps = [];
    $.each(errors.validation, function(property,invalids){    	
    	var msg = '无效的值：' + property;
    	if( invalids.length !== 0) {
    		var cond = Object.keys(invalids)[0];
	    	msg = getPropertyDesc(schema, property) + code2Message[cond];
	    }
	    exps.push( {error:'Invalid parameters', data: property, message: msg});
    });
    if( exps.length === 1 ){
    	throw exps[0];
    }else{
    	throw exps;
    }
}

function validateJsonObj(schemaName, data){
	var errors = formjjv.validate(schemaName, data);
    if (errors !== null) {
        throw translateFormError(schemaName, errors);
    }
    return true;
}