'use strict';

var 
	base = require('./base'),
	json_schema = require('../../json_schema');

var 
	cache = base.cache,
	model = base.model,
	modelSeries = model.series,
	modelProduct = model.product,
	modelVersion = model.version,
	$render = base.$render;

function mergeFixedModel(pageModel){
    //pageModel['__languages'] = model.language;
}

function* $_render( context, pageModel, view ){
    mergeFixedModel(pageModel);
    yield $render( context, pageModel, view );
}

/*******GET METHODS******
/req/plan
/req/plan/product/creation?series=id
/req/plan/product/:id/edit
/req/plan/series/creation
/req/plan/series/:id/edit
/req/plan/version/creation?product=id
/req/plan/version/:id
/req/plan/version/:id/edit

/api/req/plan/product/:id
/api/req/plan/series/:id
/api/req/plan/version/:id


********POST METHODS*****
/api/req/plan/product
/api/req/plan/product/:id
/api/req/plan/series
/api/req/plan/series/:id
/api/req/plan/version
/api/req/plan/version/:id
*/

module.exports = {
	'GET /req/plan': function* (){
		var tree = yield cache.$getVersionTree(),
			model = {
				tree: tree,
				size: tree.length
			};
		base.setHistoryUrl(this);
		yield $render(this, model, 'req_plan.html' );
	},

	'GET /req/plan/product/creation': function* (){
		var sid = this.request.query.series || '',
			series = yield modelSeries.$find(sid), 
			form = {
				name: this.translate('Create product'),
				submit: this.translate('Save'),
				action: '/api/req/plan/product'
			},
			model = {
				__form: form,
				series: series
			};
		yield $render(this, model, 'plan/req_product_form.html')
	},

	'GET /req/plan/product/:id/edit': function* (id){
		var series,
			product = yield modelProduct.$find(id), 
			form = {
				name: this.translate('Edit product'),
				submit: this.translate('Save'),
				action: '/api/req/plan/product/'+id,
				src: '/api/req/plan/product/'+id
			},
			model = {
				__form: form, 
				__id: id
			};

		if( product !== null ){
			series = yield modelSeries.$find(product.series_id);
			model.series = series;
		}
		yield $render(this, model, 'plan/req_product_form.html')
	},

	'GET /req/plan/series/creation': function* (){
		var form = {
				name: this.translate('Create product series'),
				submit: this.translate('Save'),
				action: '/api/req/plan/series'
			},
			model = {
				__form: form
			};
		yield $render( this, model, 'plan/req_series_form.html');
	},

	'GET /req/plan/series/:id/edit': function* (id){
		var series = yield modelSeries.$find(id), 
			form = {
				name: this.translate('Edit series'),
				submit: this.translate('Save'),
				action: '/api/req/plan/series/'+id,
				src: '/api/req/plan/series/'+id
			},
			model = {
				__form: form, 
				__id: id,
				series: series
			};

		yield $render(this, model, 'plan/req_series_form.html')
	},

	'GET /req/plan/version/creation': function* (){
		var pid = this.request.query.product || '',
			product = yield modelProduct.$find(pid), 
			form = {
				name: this.translate('Create version'),
				submit: this.translate('Save'),
				action: '/api/req/plan/version'
			},
			model = {
				__form: form,
				product: product
			};
		yield $render(this, model, 'plan/req_version_form.html')
	},

	'GET /req/plan/version/:id/edit': function* (id){
		var product,
			version = yield modelVersion.$find(id), 
			form = {
				name: this.translate('Edit version'),
				submit: this.translate('Save'),
				action: '/api/req/plan/version/'+id,
				src: '/api/req/plan/version/'+id
			},
			model = {
				__form: form, 
				__id: id
			};

		if( product !== null ){
			product = yield modelProduct.$find(version.own_id);
			model.product = product;
		}
		yield $render(this, model, 'plan/req_version_form.html')
	},

	'GET /api/req/plan/product/:id':function* (id){
		this.body = yield modelProduct.$find(id);
	},

	'GET /api/req/plan/series/:id': function* (id){
		this.body = yield modelSeries.$find(id);
	},

	'GET /api/req/plan/version/:id': function* (id){
		this.body = yield modelVersion.$find(id);
	},

	'POST /api/req/plan/product': function* (){
		var r,
			data = this.request.body;
		json_schema.validate('product', data);

		r = {
			name: data.name,
			series_id: data.sid
		};
		yield modelProduct.$create( r );
		yield cache.$removeVersionTree();
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/req/plan/product/:id':function*(id){
		var r = yield modelProduct.$find(id),
			data = this.request.body;

		json_schema.validate('product', data);
		r.name = data.name;
		yield r.$update( ['name'] );
		yield cache.$removeVersionTree();
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/req/plan/series': function* (){
		var r,
			data = this.request.body;
		json_schema.validate('productSeries', data);

		r = {
			name: data.name
		};
		yield modelSeries.$create( r );
		yield cache.$removeVersionTree();
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/req/plan/series/:id': function* (id){
		var r = yield modelSeries.$find(id),
			data = this.request.body;

		json_schema.validate('productSeries', data);
		r.name = data.name;
		yield r.$update( ['name'] );
		yield cache.$removeVersionTree();
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/req/plan/version': function* (){
		var r,
			data = this.request.body;
		json_schema.validate('version', data);

		r = {
			name: data.name,
			own_id: data.pid,
			type: base.TYPE_VERSION_PRODUCT
		};
		yield modelVersion.$create( r );
		yield cache.$removeVersionTree();
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/req/plan/version/:id':function* (id){
		var r = yield modelVersion.$find(id),
			data = this.request.body;

		json_schema.validate('version', data);
		r.name = data.name;
		yield r.$update( ['name'] );
		yield cache.$removeVersionTree();
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}	
	}
};