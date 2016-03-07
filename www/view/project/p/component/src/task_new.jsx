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
		this.refs.name.value = ""
		this.refs.executor.value = this.props.users[0].id;
		this.refs.duration.value = 0;
		this.refs.automode.value = 0;
		this.refs.start_time.value = formatNow();
		this.refs.end_time.value = formatNow();
		this.refs.rely_to.value = "";
		this.refs.difficulty.value = 0;
		this.refs.details.value = "";
	},
	getPostData: function(){
		var name = this.refs.name.value.trim(),
			executor = this.refs.executor.value,
			duration = parseInt(this.refs.duration.value),
			automode = parseInt(this.refs.automode.value),
			start_time = this.refs.start_time.value||0,
			end_time = this.refs.end_time.value||0,
			rely_to = this.refs.rely_to.value.trim(),
			difficulty = parseInt(this.refs.difficulty.value),
			details = this.refs.details.value;
		
		var data = {
			name: name,
			parent: this.props.parent,
			executor: executor,
			duration: duration,
			start_time: wd_formatStart(toDateTime(start_time)),
			automode: automode,
			end_time: wd_formatEnd(toDateTime(end_time)),
			rely_to: rely_to,
			difficulty: difficulty,
			details: details
		};
		//console.log(data)
		if(validateJsonObj('createTask', data)){
			if(data.start_time > data.end_time){
				throw  { error:'invalid parameter', data:'end_time', message:"结束时间应该大于开始时间"}; 
			}
			if( data.automode == 0 && !data.rely_to){
				throw { error:'invalid parameter', data:'rely_to', message:"计划模式为自动时，需要设置依赖任务"}
			}
			if( !/^[0-9\,]{0,50}$/.test(data.rely_to)){
				throw { error:'invalid parameter', data:'rely_to', message:"依赖的任务只可输入整数与英文逗号"}
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
		form.postJSON( '/api/project/p/{{__id}}/task', data, function(err, result){
			if( !err ){
				var modal = UIkit.modal("#modal_new_task");
				modal.hide();
				this.resetFields();
				this.props.onNewTask(result.id);
			}
		}.bind(this));

	},
	render: function(){
		var textarea_height = { height: "60px"};
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
										<select name="executor" ref="executor" className="uk-width-1-1">
											{ this.props.users.map(function(u){
												return <option key={u.user_id} value={u.user_id}>{u.name}</option>
												})
											}
										</select>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">工期（小时）</label>
									<div className="uk-form-controls uk-width-1-3">
										<input type="number" name="duration" ref="duration" placeholder="填入整数" defaultValue="0"/>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">计划模式</label>
									<div className="uk-form-controls uk-width-1-3">
										<select name="automode" ref="automode" className="uk-width-1-1">
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
											<input type="text" name="start_time" ref="start_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}" defaultValue={formatNow()}/>
										</div>
									</div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">计划结束时间</label>
									<div className="uk-form-controls uk-width-1-3">
										<div className="uk-form-icon">
											<i className="uk-icon-calendar"></i>
											<input type="text" name="end_time" ref="end_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}" defaultValue={formatNow()}/>
										</div>
									</div>
								</div>								
								<div className="uk-form-row uk-width-1-1">
									<label className="uk-form-label">前置任务</label>
									<div className="uk-form-controls uk-width-1-3">
										<input type="text" name="rely_to" ref="rely_to" placeholder="填写标识，用逗号分隔" />
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
