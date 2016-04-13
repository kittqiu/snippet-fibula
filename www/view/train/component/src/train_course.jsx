var NewCoursePage = React.createClass({
	getPostData: function(){
		var data = {
			name: this.refs.name.value.trim(),
			brief:this.refs.brief.value.trim(),
			details: this.refs.details.value.trim()
		};
		console.log(data)
		if(validateJsonObj('courseCreate', data)){
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data,
			form = $('#form_new_course').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/train/c', data, function(err, result){
			if( !err ){
				$('#content-block').addClass('uk-hidden');
				jumpTo( result.redirect, "{{ _('History Page')}}", 2 );
			}
		}.bind(this));

	},
	componentDidMount: function(){
		var htmleditor = UIkit.htmleditor($('#details').get(0), {
				markdown: true,
				maxsplitsize: 300
			});
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'};
		return (
			<div>
				<h1 className="uk-text-center"><b>创建新课程</b></h1>				
				<div className="uk-text-right">
				</div>
				<hr className="dv-hr"/>
				<div id="form_new_course">
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row uk-width-1-3">
								<label className="uk-form-label">课程名称</label>
								<div className="uk-form-controls">
									<input name="name" type="text" ref="name" className="uk-width-1-1" autofucus placeholder="3-50字符" defaultValue="" maxLength="50"/>
								</div>
							</div>
							<div className="uk-form-row uk-width-2-3">
								<label className="uk-form-label">课程简述</label>
								<div className="uk-form-controls">
									<input name="brief" type="text" ref="brief" className="uk-width-1-1" placeholder="1-100字符" defaultValue="" maxLength="100"/>
								</div>
							</div>
							
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">课程说明</label>
								<div className="uk-form-controls">
									<textarea ref="details" id="details" name="details" className="uk-width-4-5">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row uk-clearfix" >
								<button  type="submit" className="uk-button-primary uk-button-large uk-width-medium uk-align-center" style={small_margin}>
									<i className="uk-icon-check uk-icon-medium"></i>保存
								</button>
							</div>
						</fieldset>
					</form>
				</div>
			</div>
			)
	}
});



var EditCoursePage = React.createClass({
	getPostData: function(){
		var data = {
			name: this.refs.name.value.trim(),
			brief:this.refs.brief.value.trim(),
			details: this.refs.details.value.trim()
		};
		if(validateJsonObj('courseCreate', data)){
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data,
			form = $('#form_new_course').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/train/c/'+this.props.cid, data, function(err, result){
			if( !err ){
				$('#content-block').addClass('uk-hidden');
				jumpTo( result.redirect, "{{ _('History Page')}}", 2 );
			}
		}.bind(this));

	},
	loadData: function(){
		getJSON( '/api/train/c/' + this.props.cid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({name:data.name, brief:data.brief, details:data.details});
					var htmleditor = UIkit.htmleditor($('#details').get(0), {
						markdown: true,
						maxsplitsize: 300
					});
				}
			}.bind(this)
		);
	},
	handleNameChange: function(event) {
		this.setState({name: event.target.value});
	},
	handleBriefChange: function(event) {
		this.setState({brief: event.target.value});
	},
	handleDetailsChange: function(event) {
		this.setState({details: event.target.value});
	},
	getInitialState: function(){
		return {name:'', brief:'', details:''}
	},
	componentDidMount: function(){
		this.loadData();
		
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'};
		console.log(this.state.details)
		return (
			<div>
				<h1 className="uk-text-center"><b>创建新课程</b></h1>				
				<div className="uk-text-right">
				</div>
				<hr className="dv-hr"/>
				<div id="form_new_course">
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row uk-width-1-3">
								<label className="uk-form-label">课程名称</label>
								<div className="uk-form-controls">
									<input name="name" type="text" ref="name" className="uk-width-1-1" autofucus placeholder="3-50字符" 
										value={this.state.name} maxLength="50" onChange={this.handleNameChange}/>
								</div>
							</div>
							<div className="uk-form-row uk-width-2-3">
								<label className="uk-form-label">课程简述</label>
								<div className="uk-form-controls">
									<input name="brief" type="text" ref="brief" className="uk-width-1-1" placeholder="1-100字符" 
										value={this.state.brief} maxLength="100" onChange={this.handleBriefChange}/>
								</div>
							</div>
							
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">课程说明</label>
								<div className="uk-form-controls">
									<textarea ref="details" id="details" name="details" value={this.state.details} 
										className="uk-width-4-5" onChange={this.handleDetailsChange}>
									</textarea>
								</div>
							</div>
							<div className="uk-form-row uk-clearfix" >
								<button  type="submit" className="uk-button-primary uk-button-large uk-width-medium uk-align-center" style={small_margin}>
									<i className="uk-icon-check uk-icon-medium"></i>保存
								</button>
							</div>
						</fieldset>
					</form>
				</div>
			</div>
			)
	}
});