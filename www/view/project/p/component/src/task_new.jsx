var NewTaskDlg = React.createClass({
	correctErrMsg: function(err){
		var error_msgs = {
			end_time: '请选择结束时间',
			master: '请选择项目负责人'
		};
		_.each(err, function(e,n){
			if(error_msgs.hasOwnProperty(e.data) && !e.message){
				e.message = options.error_msgs[e.data];
			}
		});
	},
	resetFields: function(){
		var eid = this.props.users.length > 0 ? this.props.users[0].id:'0';
		this.refs.name.value = ""
		this.refs.executor.value = eid;
		this.refs.duration.value = 0;
		this.refs.automode.value = 0;
		this.refs.start_time.value = formatNow();
		this.refs.end_time.value = formatNow();
		this.refs.rely_to.value = "";
		this.refs.difficulty.value = 0;
		this.refs.details.value = "";
		this.refs.start_time.disabled = true;
		this.refs.end_time.disabled = true;

		var time = Date.now();
		this.setState({ automode: 0, relies:'', duration: 0, start_time:time, end_time:time, executor: eid });
	},
	getPostData: function(){
		var name = this.refs.name.value.trim(),
			executor = this.refs.executor.value,
			duration = parseInt(this.refs.duration.value),
			automode = parseInt(this.refs.automode.value),
			start_time = toDateTime(this.refs.start_time.value||0),
			end_time = toDateTime(this.refs.end_time.value||0),
			difficulty = parseInt(this.refs.difficulty.value),
			details = this.refs.details.value,
			rs = [],
			max_task_index = this.props.project.tasks.length - 1;;
		
		if( automode === 1 ){
			start_time = wd_formatStart(start_time);
			end_time = wd_formatEnd(end_time);
		}else{
			start_time = this.state.start_time;
			end_time = this.state.end_time;
		}
		console.log(new Date(end_time))

		this.state.relies.split(',').forEach( function(r, index) {
			if(r){
				var n = parseInt(r);
				if( n > max_task_index){
					throw {error:'invalid parameter', data:'rely_to', message:"不能指定不存在的任务"+ r +"作为前置任务"}
				}
				rs.push( this.props.project.tasks[n].id);
			}				
		}.bind(this));

		var data = {
			name: name,
			parent: this.props.parent,
			executor: executor,
			duration: duration,
			start_time: start_time,
			automode: automode,
			end_time: end_time,
			difficulty: difficulty,
			details: details,
			relyTo: rs
		};
		console.log(data)
		if(validateJsonObj('createTask', data)){
			if(data.start_time > data.end_time){
				throw  { error:'invalid parameter', data:'end_time', message:"结束时间应该大于开始时间"}; 
			}
			if( data.automode == 0 && rs.length===0){
				throw { error:'invalid parameter', data:'rely_to', message:"计划模式为自动时，需要设置依赖任务"}
			}
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var data,
			form = $('#modal_new_task').find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			this.correctErrMsg(e);
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/project/p/'+ this.props.project.id+'/task', data, function(err, result){
			if( !err ){
				this.resetFields();
				this.props.onNewTask(result.id);
				var modal = UIkit.modal("#modal_new_task");
				modal.hide();
			}
		}.bind(this));

	},
	resetPlanTime: function(automode, relies, duration){
		var rs = [];
			relies.split(',').forEach( function(r, index) {
				if( r ){
					rs.push(parseInt(r));
				}
			});
		console.log(automode)
		if( automode == 0 && rs.length > 0 ){
			var tasks = this.props.project.tasks,
				max_end_time = 0, new_end_time;
			rs.forEach(function(r,n){
				if( tasks.length > r ){
					var t = tasks[r];
					if( t.isCompleted ){
						max_end_time = Math.max(t.end_time, max_end_time);
					}else{
						max_end_time = Math.max(t.plan_end_time, max_end_time);
					}
				}
			}.bind(this));
			new_end_time = wd_after(max_end_time, duration);
			this.setState({start_time:max_end_time});
			this.setState({end_time:new_end_time})
		}
	},
	getInitialState: function() {
		var time = Date.now();
		return { automode: 0, relies:'', duration: 0, start_time:time, end_time:time, executor:'0' };
	},
	onDurationChanged: function(event){
		var value = event.target.value;
		this.setState({duration:parseInt(value)});
		this.resetPlanTime(this.state.automode, this.state.relies, parseInt(value));
	},
	onStartTimeChanged: function(event){
		this.setState({start_time:toDateTime(event.target.value)});
	},
	onEndTimeChanged: function(event){
		this.setState({end_time:toDateTime(event.target.value)});
	},
	executorChanged: function(event){
		this.setState({executor:event.target.value});
	},
	onAutoModeChanged: function(event){
		var value = event.target.value;
		this.setState({automode:parseInt(value)});
		var isDisabled = value == 0 ? true:false;
		this.refs.start_time.disabled = isDisabled;
		this.refs.end_time.disabled = isDisabled;
		this.resetPlanTime(parseInt(value), this.state.relies, this.state.duration);
	},
	onRelyChanged: function(event){
		var value = event.target.value,
			regExp = /^[0-9\,]{0,99}$/;
		console.log(value);
		if( regExp.test(value)){			
			this.setState({relies:value});
			this.resetPlanTime(this.state.automode, value, this.state.duration);
		}
	},
	componentDidMount: function(){
		this.resetFields();
		var datepicker = UIkit.datepicker(this.refs.start_time, {weekstart:0, format:'YYYY-MM-DD'});
		datepicker.on('change', this.onStartTimeChanged);
		datepicker = UIkit.datepicker(this.refs.end_time, {weekstart:0, format:'YYYY-MM-DD'});
		datepicker.on('change', this.onEndTimeChanged);
	},
	render: function(){
		var textarea_height = { height: "100px"};
		return (
			<div id="modal_new_task" className="uk-modal uk-text-left">
				<div className="uk-modal-dialog">
					<a href="" className="uk-modal-close uk-close uk-close-alt"></a>
					<div className="uk-modal-header "><h2>创建新任务</h2></div>
					<div>
						<form className="uk-form uk-form-stacked uk-form-horizontal">
							<fieldset>
								<div className="uk-alert uk-alert-danger uk-hidden"></div>
								<div className="uk-form-row uk-width-2-3">
									<label className="uk-form-label">名称</label>
									<div className="uk-form-controls">
										<input name="name" type="text" ref="name" className="uk-width-1-1" autofucus placeholder="3-50字符" defaultValue="" maxLength="50"/>
									</div>
								</div>
								<div className="uk-form-row uk-width-2-3">
									<label className="uk-form-label">父任务</label>
									<div className="uk-form-controls">
										<span>{this.props.parent=='root'?'无':this.props.TaskMap[this.props.parent].name}</span>
									</div>
								</div>
								<div className="uk-form-row" >
									<label className="uk-form-label">负责人</label>
									<div className="uk-form-controls uk-width-1-3">
										<select name="executor" ref="executor" className="uk-width-1-1" value={this.state.executor} onChange={this.executorChanged}>
											{ this.props.users.map(function(u){
												return <option key={u.user_id} value={u.user_id}>{u.name}</option>
												})
											}
										</select>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">计划工期（小时）</label>
									<div className="uk-form-controls uk-width-1-3">
										<input type="number" name="duration" ref="duration" min="0" max="256" 
										placeholder="填入整数" value={this.state.duration} onChange={this.onDurationChanged}/>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">计划模式</label>
									<div className="uk-form-controls uk-width-1-3">
										<select name="automode" ref="automode" className="uk-width-1-1" value={this.state.automode} onChange={this.onAutoModeChanged}>
											<option value="0">自动</option>
											<option value="1">手动</option>
										</select>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">计划开始时间</label>
									<div className="uk-form-controls uk-width-1-3">
										<div className="uk-form-icon">
											<i className="uk-icon-calendar"></i>
											<input type="text" name="start_time" ref="start_time"  
											 	disabled value={formatDate(this.state.start_time)} onChange={this.onStartTimeChanged}/>
										</div>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">计划结束时间</label>
									<div className="uk-form-controls uk-width-1-3">
										<div className="uk-form-icon">
											<i className="uk-icon-calendar"></i>
											<input type="text" name="end_time" ref="end_time"  
											 disabled value={formatDate(this.state.end_time)} onChange={this.onEndTimeChanged} />
										</div>
									</div>
								</div>								
								<div className="uk-form-row uk-width-1-1">
									<label className="uk-form-label">前置任务</label>
									<div className="uk-form-controls uk-width-1-3">
										<input type="text" name="rely_to" ref="rely_to" placeholder="填写标识，用逗号分隔"
										 value={this.state.relies} onChange={this.onRelyChanged} />
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">任务难度</label>
									<div className="uk-form-controls uk-width-1-3">
										<select name="difficulty" ref="difficulty" className="uk-width-1-1">
											<option value="0">简单</option>
											<option value="1">普通</option>
											<option value="2">困难</option>
										</select>
									</div>
								</div>
								<div className="uk-form-row uk-width-1-1">
									<label className="uk-form-label">任务说明</label>
									<div className="uk-form-controls">
										<textarea ref="details" name="details" className="uk-width-2-3" style={textarea_height} placeholder="可暂时不填">
										</textarea>
									</div>
								</div>
							</fieldset>
						</form>
					</div>
					<div className="uk-modal-footer uk-text-right">
						<button type="button" onClick={this.handleSubmit} className="uk-button uk-button-primary">保存</button>
					</div>
				</div>
			</div>
			)
	}
});
