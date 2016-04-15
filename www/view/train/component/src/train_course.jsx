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


var CoursePage = React.createClass({
	loadSections: function(){
		getJSON( '/api/train/c/'+ this.props.cid +'/sections', {}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({sections:data});					
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
		return { course: {}, sections:[]}
	},
	render: function(){
		var course = this.state.course,
			block_margin = {marginTop:'30px'};
		return (
			<div>
				<h1 className="uk-text-center"><b>课程：{course.name}</b></h1>				
				<div className="uk-text-right">
					<a href={ "/train/s/creation?cid=" + course.id } className="dv-link">添加章节</a>
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
						<h3><b>章节</b></h3>
						<div>
							{
								this.state.sections.length > 0 ? 
							<table className="uk-table uk-table-striped">
								<thead>
									<tr>
										<td className="uk-width-1-10">序号</td>
										<td className="uk-width-2-10">名称</td>
										<td className="uk-width-3-10">简介</td>
										<td className="uk-width-2-10">资源下载</td>
										<td className="uk-width-2-10">操作</td>
									</tr>
								</thead>					
								<tbody>
									{
										this.state.sections.map( function(s,index){
											return (
												<tr>
													<td>{index+1}</td>
													<td>{s.name}</td>
													<td>{s.brief}></td>
													<td></td>
													<td></td>
												</tr>
											)
										})
									}
								</tbody>
							</table>
							: <p>无章节记录，请<a href={ "/train/s/creation?cid=" + course.id } className="dv-link">创建新章节</a></p>
							}
						</div>
					</div>
					
				</div>
			</div>
			)
	}
});