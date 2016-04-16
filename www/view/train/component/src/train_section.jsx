var EditSectionPage = React.createClass({
	getFileIdList: function(){
		var ids = [], 
			fs = this.state.files;
		fs.forEach( function(f, index) {
			ids.push(f.id);
		});
		return ids;
	},
	getPostData: function(){
		var data = {
			course_id: this.props.mode==='new' ? this.props.cid:this.state.course.id,
			name: this.refs.name.value.trim(),
			brief:this.refs.brief.value.trim(),
			content: this.refs.content.value.trim(),
			attachments: this.getFileIdList(),
		};
		console.log(data)
		if(validateJsonObj('sectionCreate', data)){
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data, url,
			form = $('#form_new_section').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}

		url = '/api/train/s' + ( this.props.mode==='new'? '': '/' + this.props.sid );
		form.postJSON( url, data, function(err, result){
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
					var fs = [];
					data.atts.forEach( function(att, index) {
						fs.push({id:att.att_id, name:att.name});
					});
					this.setState({name:data.name, brief: data.brief, content: data.content, files:fs});
					this.loadCourse(data.course_id);
					var htmleditor = UIkit.htmleditor($('#content').get(0), {
							markdown: true,
							maxsplitsize: 300
					});
				}
			}.bind(this)
		);
	},
	addFile: function(f){
		var fs = this.state.files;
		fs.push({id:f.attid, name:f.name});
		this.setState({files:fs});
	},
	removeFile: function(fid){
		var fs = this.state.files;
		for(var i = 0; i < fs.length; i++ ){
			if(fs[i].id===fid){
				fs.splice(i,1);
			}
		}
		this.setState({files:fs});
	},
	initUploadField: function (prefix, allow, onlyone){
		var progressbar = $('#' +  prefix + '-progressbar'),
			bar         = progressbar.find('.uk-progress-bar'),
			uploadfiles = [],
			container = this,
			settings    = {
				action: '/api/file?t=train', // upload url

				before: function(settings, files){
					var i, names = [];
					for( i = 0; i<files.length; i++ ){
						names.push( files[i].name );
					}

					uploadfiles = [];
					$('#' + prefix +' tr').each(function(i){
						uploadfiles.push($(this).attr("name"));
					});

					for(i = 0; i < uploadfiles.length; i++ ){
						if( names.indexOf(uploadfiles[i])!==-1){
							info('请不要上传相同的文件');
							return false;
						}
					}
					if(onlyone && names.length + uploadfiles.length > 1){
						info('只能上传1个文件');
						return false;
					}
					return true;
				},

				allow : allow || '*.*', // allow only images
				notallowed:function(file, settings){
					var exts = settings.allow.substring(settings.allow.indexOf('.')+2);
					exts = exts.slice(0,-1);
					exts = exts.split('|').join(', ');
					info('仅允许后缀名为'+ exts + '的文件');
				},
				loadstart: function() {
					bar.css("width", "0%").text("0%");
					progressbar.removeClass("uk-hidden");
				},
				progress: function(percent) {
					percent = Math.ceil(percent);
					bar.css("width", percent+"%").text(percent+"%");
				},
				complete:function(response){
					var allfiles = JSON.parse(response).files,
						f = allfiles[0];

					uploadfiles.push( f.name );
					container.addFile(f);
				},
				allcomplete: function(response) {
					bar.css("width", "100%").text("100%");
					setTimeout(function(){
						progressbar.addClass("uk-hidden");
					}, 250);
				}
			};

		var select = UIkit.uploadSelect($("#" + prefix + "-upload-select"), settings),
			drop   = UIkit.uploadDrop($("#" + prefix + "-upload-drop"), settings);
	},
	componentDidMount: function(){
		if( this.props.mode==='new' ){
			this.loadCourse( this.props.cid );
			var htmleditor = UIkit.htmleditor($('#content').get(0), {
					markdown: true,
					maxsplitsize: 300
				});			
		}else{
			this.loadData();
		}
		this.initUploadField('attachments');
	},
	getInitialState: function(){
		return { name: '', brief:'', content:'', course:{}, files:[]}
	},
	render: function(){
		var small_margin = {marginTop:'40px', width:'480px'},
			texteara_height={height:'120px'};
		return (
			<div>
				<h1 className="uk-text-center">
					<b>{
						this.props.mode==='new'? '创建新章节': 
						'修改章节：' + this.state.name
						}</b>
				</h1>				
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
									<div>
										{
											this.state.files.length > 0 ? 
											<table id="attachments" className="uk-table uk-table-striped">
												<thead>
													<tr>
														<th className="uk-width-3-4">文件名</th>
														<th className="uk-width-1-4">操作</th>
													</tr>
												</thead>
												<tbody>
												{
													this.state.files.map(function(f,index){
														return (
															<tr key={'file-'+index} id={f.id}>
																<td>{f.name}</td>
																<td><a onClick={this.removeFile.bind(this,f.id)} className="dv-link">删除</a></td>
															</tr>
															)
													}.bind(this))
												}
												</tbody>
											</table>
											: null
										}
									</div>			
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