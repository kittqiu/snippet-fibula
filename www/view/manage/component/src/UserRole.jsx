
var UserRole = React.createClass({
	loadUserRole: function(uid){
		uid = uid || this.state.user;
		getJSON( '/api/sys/user/'+uid+'/roles', function(err, rs ){				
				if(err){
					fatal(err);
				}else{
					var i;					
					this.setState({user_roles:rs});
					for(i = 0; i < this.state.allroles.length; i++ ){
						var r = this.state.allroles[i];
						this.refs[r.id].checked = false;
					}
					for(i = 0; i < rs.length; i++ ){
						var r = rs[i];
						this.refs[r.id].checked = true;
					}					
				}
			}.bind(this)
		);
	},
	loadRoles: function(){
		getJSON( '/api/sys/role/list', function(err, rs ){				
				if(err){
					fatal(err);
				}else{					
					this.setState({allroles:rs})							
				}
			}.bind(this)
		);
	},
	loadData: function(){
		getJSON( '/api/team/member/list', function(err, us ){				
				if(err){
					fatal(err);
				}else{
					var uid = us[0].id;
					this.loadRoles();
					this.loadUserRole(uid);								
					this.setState({users:us,user:uid})							
				}
			}.bind(this)
		);
	},
	componentWillMount: function(){
		this.loadData();
	},
	handleUserSelected: function(e){
		var uid = e.target.value;
		this.setState({user:uid})
		this.loadUserRole(uid);
	},
	handleSubmit: function(e){
		e.preventDefault();
		var i, roles = [],
			allroles = this.state.allroles,
			form = $('#select_user_role').find('form'),
			uid = this.refs.user.value;

		for(i = 0; i < allroles.length; i++ ){
			var r = allroles[i];
			if( this.refs[r.id].checked ){
				roles.push(r.id);
			}
		}
		console.log(roles);

		form.postJSON( '/api/sys/user/'+uid+'/roles', roles, function(err, result){
			if( !err ){
				UIkit.modal.alert("保存成功！");
			}
		}.bind(this));
	},
	getInitialState: function(){
		return {users:[], allroles:[], user:'', user_roles:[]}
	},
	render: function(){
		return (
			<div id="select_user_role">
				<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked">
					<fieldset>
						<div className="uk-alert uk-alert-danger uk-hidden"></div>
						<div className="uk-form-row uk-width-1-1">
							<label className="uk-form-label">选择一个用户：</label>
							<div className="uk-form-controls">
								<select name="user" ref="user" className="uk-width-1-1" value={this.state.user} onChange={this.handleUserSelected}>
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
							<label className="uk-form-label">选择启用的角色：</label>
							<div className="uk-form-controls">
								{
									this.state.allroles.map(function(r,index){
										return (
											<div key={r.id} className="uk-form-controls">
												<input id={r.id} ref={r.id} type="checkbox" value={r.id} />
												<label htmlFor={r.id}>{r.name}</label>
											</div>
											)
									})
								}
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