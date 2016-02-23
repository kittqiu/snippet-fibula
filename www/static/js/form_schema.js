
var SCHEMA_PROPERTY = {
	BRIEF:{
		type: 'string',
		minLength: 1,
		maxLength: 100,
		desc: '简述'
	},
	EMAIL:{
		type: 'string',
        maxLength: 100,
        pattern: '^(?:[\\w\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+\\.)*[\\w\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+@(?:(?:(?:[a-z0-9](?:[a-z0-9\\-](?!\\.)){0,61}[a-z0-9]?\\.)+[a-z0-9](?:[a-z0-9\\-](?!$)){0,61}[a-z0-9]?)|(?:\\[(?:(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\.){3}(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\]))$',
        desc: '邮箱'
	},
	ENVIRONMENT:{
		type: 'string',
		minLength: 1,
		maxLength: 20,
		desc: '开发环境'
	},
	EXPLANATION:{
		type: 'string',
		minLength: 1,
		desc: '说明'
	},
	FUNCTIONNAME:{
		type: 'string',
		minLength: 3,
		maxLength: 50,
		pattern:'^[a-z0-9A-Z\\_\\-\\$]{3,50}$',
		desc: '函数或模板名'
	},
	HELP:{
		type: 'string',
		minLength: 1,
		desc: '帮助'
	},
	ID: {
        type: 'string',
        pattern: '^[0-9a-f]{50}$'
    },
    IDEx: {
        type: 'string',
        pattern: '^[0-9a-z]{1,50}$'
    },
	KEYWORD:{
		type: 'string',
		minLength: 3,
		maxLength: 100,
		desc: '关键字'
	},
	LANGUAGE:{
		type: 'string',
		minLength: 1,
		maxLength: 20,
		desc: '编程语言'
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
	SNIPPET:{
		type: 'string',
		minLength: 1,
		desc: '源代码'
	},
	TIMESTAMP: {
        type: 'integer',
        minimum: 0,
        maximum: 32506358400000 // 3000-1-1 0:0:0 UTC
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
	confirmemail: {
		type: 'object',
		properties: {
			email: SCHEMA_PROPERTY.EMAIL
		},
		required:['email']
	},
	signup: {
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME,
			username: SCHEMA_PROPERTY.USERNAME,
			password: SCHEMA_PROPERTY.PASSWORD,
			verifypassword: SCHEMA_PROPERTY.PASSWORDVERIFY,
			email: SCHEMA_PROPERTY.EMAIL
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
	},
	changepsd: {
		type: 'object',
		properties: {
			oldpassword: SCHEMA_PROPERTY.PASSWORD,
			newpassword: SCHEMA_PROPERTY.PASSWORD,
			verifypassword:SCHEMA_PROPERTY.PASSWORDVERIFY
		},
		required:['oldpassword', 'newpassword', 'verifypassword']
	},
	createDepartment:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME,
			pid: SCHEMA_PROPERTY.IDEx,
		},
		required:['name', 'pid']
	},
	createProduct:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME,
			sid: SCHEMA_PROPERTY.ID,
		},
		required:['name', 'sid']
	},
	createSeries:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME
		},
		required:['name']
	},
	createTplModule:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME
		},
		required:['name']
	},
	createVersion:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME,
			pid: SCHEMA_PROPERTY.ID,
		},
		required:['name', 'pid']
	},
	createProject:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.NAME,
			start_time: SCHEMA_PROPERTY.TIMESTAMP,
			end_time:SCHEMA_PROPERTY.TIMESTAMP,
			master:SCHEMA_PROPERTY.ID,
			details:SCHEMA_PROPERTY.EXPLANATION
		},
		required:['name', 'start_time', 'end_time', 'master', 'details']
	},
	createSnippet:{
		type: 'object',
		properties: {
			name: SCHEMA_PROPERTY.FUNCTIONNAME,
			brief: SCHEMA_PROPERTY.BRIEF,
			language:SCHEMA_PROPERTY.LANGUAGE,
			environment:SCHEMA_PROPERTY.ENVIRONMENT,
			keywords:SCHEMA_PROPERTY.KEYWORD,
			code:SCHEMA_PROPERTY.SNIPPET,
			help:SCHEMA_PROPERTY.HELP
		},
		required:['name', 'brief', 'language', 'environment', 'keywords', 'code', 'help']
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