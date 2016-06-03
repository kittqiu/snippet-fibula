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
		// var htmleditor = UIkit.htmleditor($('#details').get(0), {
		// 		markdown: true,
		// 		maxsplitsize: 300
		// 	});
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'},
			texteara_height={height:'120px'};
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
									<textarea ref="details" id="details" name="details" className="uk-width-4-5" style={texteara_height}>
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
					// var htmleditor = UIkit.htmleditor($('#details').get(0), {
					// 	markdown: true,
					// 	maxsplitsize: 300
					// });
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
		var small_margin = {marginTop:'40px', width:'480px'},
			texteara_height={height:'120px'};
		return (
			<div>
				<h1 className="uk-text-center"><b>修改课程</b></h1>				
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
										className="uk-width-4-5" onChange={this.handleDetailsChange} style={texteara_height}>
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

var CourseSectionFileList = React.createClass({
	render: function(){
		return (
			<ul>
				{
					this.props.atts.map( function(att, index){
						return (
							<li key={index}>
								<a href={ '/api/file/'+ att.att_id} className="dv-link">{att.name}</a>
							</li>
							)
						})
				}
			</ul>
			)
	}
});

var CoursePage = React.createClass({
	onMoveUp: function(section_id){
		postJSON( '/api/train/s/'+section_id+'/up', function(err, result){
			if(err)
				fatal(err);
			else{
				this.loadSections();
			}
		}.bind(this));
	},
	onMoveDown: function(section_id){
		postJSON( '/api/train/s/'+section_id+'/down', function(err, result){
			if(err)
				fatal(err);
			else{
				this.loadSections();
			}
		}.bind(this));
	},
	loadAuthors: function(){
		getJSON( '/api/train/c/'+ this.props.cid +'/authors', {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({authors:data});					
				}
			}.bind(this)
		);
	},
	loadSections: function(){
		getJSON( '/api/train/c/'+ this.props.cid +'/sections', {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({sections:data});
					this.loadAuthors();				
				}
			}.bind(this)
		);
	},
	loadData: function(){
		getJSON( '/api/train/c/' + this.props.cid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({course:data});
					this.loadSections();				
				}
			}.bind(this)
		);
	},
	componentDidMount: function(){
		this.loadData();
	},
	getInitialState: function(){
		return { course: {}, sections:[], authors:[]}
	},
	isAuthor: function(){
		if( ENV.user.id===this.state.course.owner_id ){
			return true;
		}else{
			var us = this.state.authors;
			for( var i = 0; i < us.length; i++ ){
				if( us[i].user_id === ENV.user.id ){
					return true;
				}
			}
			return false;
		}
	},
	render: function(){
		var course = this.state.course,
			block_margin = {marginTop:'30px'},
			sections = this.state.sections;
		return (
			<div>
				<h1 className="uk-text-center"><b>课程：{course.name}</b></h1>				
				<div className="uk-text-right">					
					{
						this.isAuthor() ? <a href={ "/train/s/creation?cid=" + course.id } className="dv-link">添加章节</a>
						: <span>创建人：{ course.owner_name}</span>
					}
					
				</div>
				<hr className="dv-hr"/>
				<div>
					<div>
						<h3><b>简介</b></h3>
						<div>{course.brief}</div>
					</div>
					<div style={block_margin}>
						<h3><b>说明</b></h3>
						<div><pre className="dv-pre-clear">{course.details}</pre></div>
					</div>
					<div style={block_margin}>
						<h3><b>作者</b></h3>
						<div>
							<span>{ course.owner_name }</span>
							{
								this.state.authors.map(function(u,index){
										return (
											<span key={index}>、{u.user_name}</span>
											)
									})
							}
						</div>
					</div>
					<div style={block_margin}>
						<h3><b>章节</b></h3>
						<div>
							{
								sections.length > 0 ? 
							<table className="uk-table uk-table-striped">
								<thead>
									<tr>
										<th className="dv-width-1-20">序号</th>
										<th className="dv-width-4-20">名称</th>
										<th className="dv-width-7-20">简介</th>
										<th className="dv-width-5-20">资源下载</th>
										<th className="dv-width-3-20">操作</th>					
									</tr>
								</thead>					
								<tbody>
									{
										sections.map( function(s,index){
											return (
												<tr key={index}>
													<td>{index+1}</td>
													<td><a href={'/train/s/' + s.id} className="dv-link">{s.name}</a></td>
													<td>{s.brief}</td>
													<td>
														{ s.atts.length > 0 ?
															<CourseSectionFileList atts={s.atts}/>
															: '无'
														}
													</td>
													{
														this.isAuthor() ?
														<td>
															<a href={'/train/s/' + s.id + '/edit'} className="dv-link">修改</a>
															{
																index !== 0?
																<a onClick={this.onMoveUp.bind(this,s.id)} className="dv-link">上移</a>
																: null
															}
															{
																index !== sections.length - 1?
																<a onClick={this.onMoveDown.bind(this,s.id)} className="dv-link">下移</a>
																: null
															}
														</td>
														:
														<td>
															<a href={'/train/s/' + s.id} className="dv-link">查看</a>
														</td>
													}													
												</tr>
											)
										}.bind(this))
									}
								</tbody>
							</table>
							: <p>无章节记录{ ENV.user.id===course.owner_id?<span>，请<a href={ "/train/s/creation?cid=" + course.id } className="dv-link">创建新章节</a></span>:null}</p>
							}
						</div>
					</div>
					
				</div>
			</div>
			)
	}
});

var SelectMemberDialog = React.createClass({
	updateFreeUser: function(users, authors){
		var i, as = [], 
			freeusers = [];
		for( i = 0; i < authors.length; i++ ){
			as.push( authors[i].user_id );
		}
		for( i = 0; i < users.length; i++ ){
			if( as.indexOf(users[i].id) == -1 ){
				freeusers.push( users[i]);
			}
		}
		this.setState({freeusers: freeusers});
	},
	loadUsers: function(){
		getJSON( '/api/team/member/list', {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.updateFreeUser(data, this.props.authors);
					this.setState({users:data});
				}
			}.bind(this)
		);
	},
	handleSubmit: function(){
		var $members = $("#modal_add_member input:checked"),
			ms = [], fs=[], as=[], i, users = this.state.users;
		for( i = 0; i < $members.length; i++){
			ms.push($members[i].value);
		}
		for( i = 0; i < users.length; i++ ){
			var u = users[i];
			if( ms.indexOf(u.id)!== -1){
				as.push(u);
			}else{
				fs.push(u);
			}
		}
		//this.setState({users:fs});
		this.props.addUsers(as);

		var modal = UIkit.modal("#modal_add_member");
		modal.hide();
	},
	componentWillReceiveProps: function(nextProps){
		this.updateFreeUser(this.state.users, nextProps.authors);
	},
	componentWillMount: function(){
		this.loadUsers();
	},
	getInitialState: function(){
		return {users:[], freeusers:[]}
	},
	render: function(){
		return (
			<div id="modal_add_member" className="uk-modal uk-text-left">
				<div className="uk-modal-dialog">
					<a href="" className="uk-modal-close uk-close uk-close-alt"></a>
					<div className="uk-modal-header "><h2>选择新成员</h2></div>
					<div>
						<form className="uk-form uk-form-stacked uk-form-horizontal">
							<fieldset>
								<div className="uk-alert uk-alert-danger uk-hidden"></div>
								{
									this.state.freeusers.map(function(u,index){
										return (
											<div key={u.id} className="uk-form-controls">
												<input id={u.id} type="checkbox" value={u.id} />
												<label htmlFor={u.id}>{u.name}</label>
											</div>
											)
									})
								}
								<div className={this.state.users.length>0?'uk-hidden':''}>无新成员</div>
							</fieldset>
						</form>
					</div>
					<div className="uk-modal-footer uk-text-right">
						<button type="button" onClick={this.handleSubmit} className="uk-button uk-button-primary">提交</button>
					</div>
				</div>
			</div>
			)
	}
});

var CourseAuthorForm = React.createClass({
	addUsers: function(users){
		var as = this.state.authors, i;
		for( i = 0; i < users.length; i++ ){
			var u = users[i];
			as.push( {user_id: u.id, user_name: u.name})
		}
		
		postJSON( '/api/train/c/'+this.props.cid+'/member/add', users, function(err, result){
			if(err)
				fatal(err);
			else{
				this.setState( {authors:as});
			}
		}.bind(this));
	},
	deleteUser: function( user_id ){
		postJSON( '/api/train/c/'+this.props.cid+'/member/delete', {user:user_id}, function(err, result){
			if(err)
				fatal(err);
			else{
				var as = this.state.authors, i;
				for( i = 0; i < as.length; i++ ){
					var u = as[i];
					if( u.user_id === user_id ){
						as.splice( i, 1);
						break;
					}
				}
				this.setState( {authors:as});
			}
		}.bind(this));
	},
	loadAuthors: function(){
		getJSON( '/api/train/c/' + this.props.cid + '/authors', {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({authors:data});
				}
			}.bind(this)
		);
	},
	loadData: function(){
		getJSON( '/api/train/c/' + this.props.cid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({course:data});
					this.loadAuthors();				
				}
			}.bind(this)
		);
	},
	componentDidMount: function(){
		this.loadData();
	},
	getInitialState: function(){
		return { course: {}, authors:[]}
	},
	render: function(){
		return (
			<div>
				<h1 className="uk-text-center"><b>修改课程的作者：<span>{this.state.course.name}</span></b></h1>				
				<div className="uk-text-right">
					<button className="uk-button-link dv-link" data-uk-modal="{center:true,target:'#modal_add_member'}" >添加新作者</button>
					<SelectMemberDialog authors={this.state.authors} addUsers={this.addUsers} />
				</div>
				<hr className="dv-hr"/>
				<div id="form_new_course">
					{
						this.state.authors.length > 0 ? 
						<table className="uk-width-1-1 uk-table">
							<thead>
								<tr>
									<th className="uk-width-1-2">作者</th>
									<th className="uk-width-1-2">操作</th>
								</tr>
							</thead>
							<tbody>							
								{									
									this.state.authors.map( function(c,index){
										return (
											<tr key={index}>
												<td className="uk-text-left">{ c.user_name }</td>
												<td>
													<a onClick={ this.deleteUser.bind(this, c.user_id )} className="dv-link">删除</a>
												</td>
											</tr>
											)
									}.bind(this))
								}
							</tbody>
						</table>
						: '无其他作者'
					}
				</div>
			</div>
			)
	}
});