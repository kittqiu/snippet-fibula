var UserInfoEdit = React.createClass({
	getPostData: function(){
		var data = {
			name: this.refs.name.value.trim()
		};
		if(validateJsonObj('userEdit', data)){
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data,
			form = $('#form_edit').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/user/'+this.props.uid, data, function(err, result){
			if( !err ){
				$('#content-block').addClass('uk-hidden');
				jumpTo( result.redirect, "首页", 2 );
			}
		}.bind(this));

	},
	loadData: function(){
		getJSON( '/api/user/' + this.props.uid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({name:data.name, username:data.username, email:data.email});
				}
			}.bind(this)
		);
	},
	handleNameChange: function(event) {
		this.setState({name: event.target.value});
	},
	getInitialState: function(){
		return {username:'', email:'', name:''}
	},
	componentDidMount: function(){
		this.loadData();
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'},
			div_style = {maxWidth:'800px'};
		return (
			<div style={div_style}>
				<h1 className="uk-text-center"><b>修改个人信息</b></h1>				
				<div className="uk-text-right">
				</div>
				<hr className="dv-hr"/>
				<div id="form_edit">
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row uk-width-1-3">
								<label className="uk-form-label">用户名</label>
								<div className="uk-form-controls">
									{this.state.username}
								</div>
							</div>
							<div className="uk-form-row uk-width-2-3">
								<label className="uk-form-label">中文名</label>
								<div className="uk-form-controls">
									<input name="name" type="text" ref="name" className="uk-width-1-1" placeholder="1-100字符" 
										value={this.state.name} maxLength="100" onChange={this.handleNameChange}/>
								</div>
							</div>
							
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">Email</label>
								<div className="uk-form-controls">
									{this.state.email}
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