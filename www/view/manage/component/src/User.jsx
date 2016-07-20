
var UserStatusManage = React.createClass({
	loadUser: function(uid){
		uid = uid || this.state.user.id;
		getJSON( '/api/user/'+uid, function(err, rs ){				
				if(err){
					fatal(err);
				}else{						
					this.setState({user:rs});
					this.refs.user_actived.checked = rs.actived;
				}
			}.bind(this)
		);
	},
	loadData: function(){
		getJSON( '/api/team/member/list', {contain_unactived:true}, function(err, us ){				
				if(err){
					fatal(err);
				}else{
					var uid = us[0].id;
					this.loadUser(uid);								
					this.setState({users:us, uid:uid})							
				}
			}.bind(this)
		);
	},
	componentWillMount: function(){
		this.loadData();
	},
	handleUserSelected: function(e){
		var uid = e.target.value;
		this.setState({uid:uid});
		this.loadUser(uid);
	},
	handleSubmit: function(e){
		e.preventDefault();
		var form = $('#select_user_status').find('form'),
			checked = this.refs.user_actived.checked;
		
		form.postJSON( '/api/user/'+this.state.uid+'/status', {actived:checked}, function(err, result){
			if( !err ){
				UIkit.modal.alert("保存成功！");
			}
		}.bind(this));
	},
	getInitialState: function(){
		return {users:[], uid:'', user:{}}
	},
	render: function(){
		return (
			<div id="select_user_status">
				<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked">
					<fieldset>
						<div className="uk-alert uk-alert-danger uk-hidden"></div>
						<div className="uk-form-row uk-width-1-1">
							<label className="uk-form-label">选择一个用户：</label>
							<div className="uk-form-controls">
								<select name="user" ref="user" className="uk-width-1-1" value={this.state.uid } onChange={this.handleUserSelected}>
								{
									this.state.users.map(function(u,index){
										return (
											<option key={index} value={u.id}>{u.name}</option>
											)
									})
								}
								</select>
							</div>
						</div>
						<div className="uk-form-row uk-width-1-1">
							<label className="uk-form-label">设置激活状态：</label>
							<div className="uk-form-controls">
								<input id="user_actived" ref="user_actived" type="checkbox"/>
								<label htmlFor="user_actived">激活</label>
							</div>
						</div>
						<div className="uk-text-center">
							<button type="submit" className="uk-button uk-button-primary">保存</button>
						</div>
					</fieldset>
				</form>
			</div>
			)
	}
});

var UserManagePage = React.createClass({
	getInitialState: function(){
		return {users:[], allroles:[], user:'', user_roles:[]}
	},
	render: function(){
		return (
			<div>
				<h2>用户角色管理</h2>
				<hr/>
				<UserRole />

				<h2>用户状态管理</h2>
				<hr/>
				<UserStatusManage />
			</div>
			)
	}
});