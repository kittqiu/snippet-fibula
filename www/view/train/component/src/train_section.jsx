var NewSectionPage = React.createClass({
	getPostData: function(){
		var data = {
			course_id: this.props.cid,
			name: this.refs.name.value.trim(),
			brief:this.refs.brief.value.trim(),
			content: this.refs.content.value.trim()
		};
		console.log(data)
		if(validateJsonObj('sectionCreate', data)){
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data,
			form = $('#form_new_section').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/train/s', data, function(err, result){
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
					this.setState({course:data});
				}
			}.bind(this)
		);
	}, 
	componentDidMount: function(){
		this.loadData();
		var htmleditor = UIkit.htmleditor($('#content').get(0), {
				markdown: true,
				maxsplitsize: 300
		});
	},
	getInitialState: function(){
		return { course: {}, sections:[]}
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'},
			texteara_height={height:'120px'};
		return (
			<div>
				<h1 className="uk-text-center"><b>创建新章节</b></h1>				
				<div className="uk-text-right">
				</div>
				<hr className="dv-hr"/>
				<div id="form_new_section">
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row uk-width-1-2">
								<label className="uk-form-label">名称</label>
								<div className="uk-form-controls">
									<input name="name" type="text" ref="name" className="uk-width-1-1" autofucus placeholder="3-50字符" defaultValue="" maxLength="50"/>
								</div>
							</div>
							<div className="uk-form-row uk-width-1-3">
								<label className="uk-form-label">所属的课程</label>
								<div className="uk-form-controls">{this.state.course.name}
								</div>
							</div>							
							<div className="uk-form-row uk-width-2-3">
								<label className="uk-form-label">章节简述</label>
								<div className="uk-form-controls">
									<input name="brief" type="text" ref="brief" className="uk-width-1-1" placeholder="1-100字符" defaultValue="" maxLength="100"/>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">附件</label>
								<div className="uk-form-controls">						
									<div id="attachments-upload-drop" className="uk-placeholder">
										<i className="uk-icon-cloud-upload uk-icon-medium"></i>请把文件拖放到这个区域或
										<a className="uk-form-file">选择一个文件<input id="attachments-upload-select" type="file"/></a>.
									</div>
									<div id="attachments-progressbar" className="uk-progress uk-hidden">
										<div className="uk-progress-bar">...</div>
									</div>
								</div>
							</div>
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">章节内容</label>
								<div className="uk-form-controls">
									<textarea ref="content" id="content" name="content" className="uk-width-4-5" style={texteara_height}>
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

var EditSectionPage = React.createClass({
	getPostData: function(){
		var data = {
			course_id: this.state.course.id,
			name: this.refs.name.value.trim(),
			brief:this.refs.brief.value.trim(),
			content: this.refs.content.value.trim()
		};
		console.log(data)
		if(validateJsonObj('sectionCreate', data)){
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data,
			form = $('#form_new_section').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/train/s/' + this.props.sid, data, function(err, result){
			if( !err ){
				$('#content-block').addClass('uk-hidden');
				jumpTo( result.redirect, "{{ _('History Page')}}", 2 );
			}
		}.bind(this));

	},
	handleNameChange: function(event) {
		this.setState({name: event.target.value});
	},
	handleBriefChange: function(event) {
		this.setState({brief: event.target.value});
	},
	handleContentChange: function(event) {
		this.setState({content: event.target.value});
	},
	loadCourse: function(cid){
		getJSON( '/api/train/c/' + cid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({course:data});
				}
			}.bind(this)
		);
	}, 
	loadData: function(){
		getJSON( '/api/train/s/' + this.props.sid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({name:data.name, brief: data.brief, content: data.content});
					this.loadCourse(data.course_id);
					var htmleditor = UIkit.htmleditor($('#content').get(0), {
							markdown: true,
							maxsplitsize: 300
					});
				}
			}.bind(this)
		);
	}, 
	componentDidMount: function(){
		this.loadData();		
	},
	getInitialState: function(){
		return { name: '', brief:'', content:'', course:{}}
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'},
			texteara_height={height:'120px'};
		return (
			<div>
				<h1 className="uk-text-center"><b>修改章节：{this.state.name}</b></h1>				
				<div className="uk-text-right">
				</div>
				<hr className="dv-hr"/>
				<div id="form_new_section">
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row uk-width-1-2">
								<label className="uk-form-label">名称</label>
								<div className="uk-form-controls">
									<input name="name" type="text" ref="name" className="uk-width-1-1" autofucus placeholder="3-50字符" 
										value={this.state.name} onChange={this.handleNameChange}  maxLength="50"/>
								</div>
							</div>
							<div className="uk-form-row uk-width-1-3">
								<label className="uk-form-label">所属的课程</label>
								<div className="uk-form-controls">{this.state.course.name}
								</div>
							</div>							
							<div className="uk-form-row uk-width-2-3">
								<label className="uk-form-label">章节简述</label>
								<div className="uk-form-controls">
									<input name="brief" type="text" ref="brief" className="uk-width-1-1" placeholder="1-100字符" 
										value={this.state.brief} onChange={this.handleBriefChange} maxLength="100"/>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">附件</label>
								<div className="uk-form-controls">						
									<div id="attachments-upload-drop" className="uk-placeholder">
										<i className="uk-icon-cloud-upload uk-icon-medium"></i>请把文件拖放到这个区域或
										<a className="uk-form-file">选择一个文件<input id="attachments-upload-select" type="file"/></a>.
									</div>
									<div id="attachments-progressbar" className="uk-progress uk-hidden">
										<div className="uk-progress-bar">...</div>
									</div>
								</div>
							</div>
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">章节内容</label>
								<div className="uk-form-controls">
									<textarea ref="content" id="content" name="content" className="uk-width-4-5" style={texteara_height}
										value={this.state.content} onChange={this.handleContentChange} >
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