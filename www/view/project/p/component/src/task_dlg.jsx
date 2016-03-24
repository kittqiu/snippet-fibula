
var TaskTabView = React.createClass({	
	render: function(){
		var task = this.props.task,
			difficulties = this.props.difficulties,
			relies = [];
			task.rely.forEach(function(r, n){
				relies.push( this.props.project.TaskMap[r].name );
			}.bind(this));
		return ( 
			<div>
				<table className="uk-table dv-border">
					<tbody>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">任务名称：</td>
							<td className="uk-width-3-10">{task.name}</td>
							<td className="uk-width-2-10 uk-block-muted">状态：</td>
							<td className="uk-width-3-10">{taskStatusMap[task.status]}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">执行人：</td>
							<td className="uk-width-3-10">{task.executor_name}</td>
							<td className="uk-width-2-10 uk-block-muted">工作审核人：</td>
							<td className="uk-width-3-10">{task.manager_name}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划工期(小时)：</td>
							<td className="uk-width-3-10">{task.plan_duration}</td>
							<td className="uk-width-2-10 uk-block-muted">实际工期(小时)：</td>
							<td className="uk-width-3-10">{task.duration}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划模式：</td>
							<td className="uk-width-3-10">{task.automode ===0 ? '自动' : '手动'}</td>
							<td className="uk-width-2-10 uk-block-muted">任务难度：</td>
							<td className="uk-width-3-10">{ difficulties[task.difficulty]}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划开始时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_start_time)}</td>
							<td className="uk-width-2-10 uk-block-muted">实际开始时间：</td>
							<td className="uk-width-3-10">{ task.start_time!==0?formatDate(task.start_time):'无' } </td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划结束时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_end_time)}</td>
							<td className="uk-width-2-10 uk-block-muted">实际结束时间：</td>
							<td className="uk-width-3-10">{ task.end_time!==0?formatDate(task.end_time):'无'}</td>
						</tr>
						<tr>
							<td className="uk-block-muted">前置任务:</td>
							<td>{ relies.toString()||'无' }</td>
							<td className="uk-block-muted">进度:</td>
							<td>{ task.percent }%</td>
						</tr>
						<tr className={task.isLeaf()?'uk-hidden':''}>
							<td className="uk-block-muted">下属总工期(已执行):</td>
							<td colSpan="3" >{ task.total_duration }小时</td>
						</tr>
						<tr>
							<td className="uk-block-muted">任务说明:</td>
							<td colSpan="3" ><pre className="dv-pre-clear">{ task.details }</pre></td>
						</tr>
					</tbody>
				</table>
			</div>
			)
	}
});

var TaskTabEdit = React.createClass({	
	correctErrMsg: function(err){
		var error_msgs = {
			duration: '工期最长为256小时',
			master: '请选择项目负责人'
		};
		if( err instanceof(Array)){
			_.each(err, function(e,n){
				if(error_msgs.hasOwnProperty(e.data)){
					e.message = error_msgs[e.data];
				}
			});
		}else{
			if(error_msgs.hasOwnProperty(err.data)){
				err.message = error_msgs[err.data];
			}
		}
	},
	relyInLoop: function(relies){
		for(var i = 0; i < relies.length; i++){
			var r = relies[i];
			if( r === this.props.task.id){
				return true;
			}
			if( this.relyInLoop(this.props.project.TaskMap[r].rely)){
				return true;
			}
		}
		return false;
	},
	getPostData: function(){
		var plan_start_time = toDateTime(this.refs.plan_start_time.value||0),
			plan_end_time = toDateTime(this.refs.plan_end_time.value||0),
			automode = parseInt(this.refs.automode.value);
		if( automode === 1 ){
			plan_start_time = wd_formatStart(plan_start_time);
			plan_end_time = wd_formatEnd(plan_end_time);
		}else{
			plan_start_time = this.state.plan_start_time;
			plan_end_time = this.state.plan_end_time;
		}
		console.log('start:'+plan_start_time)
		console.log('end:'+plan_end_time)

		var rs = [], 
			task_index = this.props.task.index,
			max_task_index = this.props.project.tasks.length - 1;
			console.log(this.state.relies.split(','));
			this.state.relies.split(',').forEach( function(r, index) {
				if(r){
					var n = parseInt(r);
					if( n === task_index){
						throw {error:'invalid parameter', data:'rely_to', message:"不能把自身设置为前置任务"}
					}
					if( n > max_task_index){
						throw {error:'invalid parameter', data:'rely_to', message:"不能指定不存在的任务"+ r +"作为前置任务"}
					}
					rs.push( this.props.project.tasks[n].id);
				}				
			}.bind(this));

			if( this.relyInLoop(rs)){
				throw {error:'invalid parameter', data:'rely_to', message:"前置任务导致死循环依赖"}
			}

		var data = {
			name: this.refs.name.value.trim(),
			executor_id: this.refs.executor.value,
			manager_id: this.refs.manager.value,
			plan_duration: parseInt(this.refs.plan_duration.value),
			plan_start_time: plan_start_time,
			automode: automode,
			plan_end_time: plan_end_time,
			difficulty: parseInt(this.refs.difficulty.value),
			details: this.refs.details.value,
			relyTo: rs
		};
		if(validateJsonObj('editTask', data)){
			if(data.start_time > data.end_time){
				throw  { error:'invalid parameter', data:'end_time', message:"结束时间应该大于开始时间"}; 
			}
			if( data.automode == 0 && rs.length === 0){
				throw { error:'invalid parameter', data:'rely_to', message:"计划模式为自动时，需要设置依赖任务"}
			}
			return data;
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var formid = 'modal_task_'+this.props.task.id + '_edit',
			data,
			form = $('#'+formid).find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			this.correctErrMsg(e);
			form.showFormError(e);
			return;
		}
		
		form.postJSON( '/api/project/task/'+this.props.task.id, data, function(err, result){
			if( !err ){
				var task = this.props.task,
					project = this.props.project, 
					shouldUpdateChildren = (task.plan_start_time !== data.plan_start_time) 
							|| (task.plan_end_time !== data.plan_end_time);

				task.name = data.name;
				task.plan_start_time = data.plan_start_time;
				task.plan_end_time = data.plan_end_time;
				task.automode = data.automode;
				task.plan_duration = data.plan_duration;
				task.difficulty = data.difficulty;
				task.details = data.details;
				task.executor_id= data.executor_id;
				task.manager_id= data.manager_id;
				task.executor_name= project.UserMap[data.executor_id].name;
				task.manager_name= project.UserMap[data.manager_id].name;
				task.rely = data.relyTo;
				this.setState({plan_start_time: data.plan_start_time,
								plan_end_time: data.plan_end_time});

				if( shouldUpdateChildren ){
					var updatePlans = [];
					this.updateRelyChildren(updatePlans, task.id);
					if( updatePlans.length > 0 ){
						postJSON( '/api/project/tasklist/updateplan', updatePlans, function(err, result){
							if(err)
								fatal(err);
							else
								console.log("update all task's plan OK!")
						});
					}
					
				}

				this.props.hideModal();
				this.props.onTaskChanged();
			}
		}.bind(this));
	},
	updateRelyChildren: function(plans,tid){
		console.log('updateRelyChildren');
		var tasks = this.props.project.tasks,
			TaskMap = this.props.project.TaskMap,
			task = TaskMap[tid];
		for(var i = 0; i < tasks.length; i++){
			var t = tasks[i];
			if( t.rely.indexOf(tid) !== -1 && t.automode === 0 && t.isCompleted === false ){
				if( t.plan_start_time !== task.plan_end_time ){
					t.plan_start_time = task.plan_end_time;
					t.plan_end_time = wd_after(task.plan_end_time, t.plan_duration);
					plans.push( {id:t.id, plan_start_time: t.plan_start_time, plan_end_time: t.plan_end_time});
					this.updateRelyChildren(plans, t.id);
				}
			}
		}
	},
	getInitialState: function() {
		return { automode: this.props.task.automode, relies:'', plan_start_time: this.props.task.plan_start_time,
			plan_end_time: this.props.task.plan_end_time, plan_duration: this.props.task.plan_duration };
	},
	resetRelies: function(){
		var relies = [];

		this.props.task.rely.forEach(function(r, n){
			relies.push( this.props.project.TaskMap[r].index );
		}.bind(this));
		this.setState({relies:relies.toString()});
	},
	componentWillMount: function(){
		this.resetRelies();
	},
	resetPlanTime: function(automode, relies, duration){
		var rs = [], task_index = this.props.task.index;
			relies.split(',').forEach( function(r, index) {
				if( r && r != task_index ){
					rs.push(parseInt(r));
				}
			});
		if( automode == 0 && rs.length > 0 ){
			var tasks = this.props.project.tasks,
				max_end_time = 0, new_end_time;
			rs.forEach(function(r,n){
				if( tasks.length > r ){
					console.log(r);
					var t = tasks[r];
					console.log(t);
					if( t.isCompleted ){
						max_end_time = Math.max(t.end_time, max_end_time);
					}else{
						max_end_time = Math.max(t.plan_end_time, max_end_time);
					}
				}
			}.bind(this));
			console.log(new Date(max_end_time));
			new_end_time = wd_after(max_end_time, duration);
			console.log(new Date(new_end_time));
			this.setState({plan_start_time:max_end_time});
			this.setState({plan_end_time:new_end_time})
		}
	},
	onDurationChanged: function(event){
		var value = event.target.value;
		this.setState({plan_duration:parseInt(value)});
		this.resetPlanTime(this.state.automode, this.state.relies, parseInt(value));
	},
	onAutoModeChanged: function(event){
		var value = event.target.value;
		this.setState({automode:parseInt(value)});
		var isDisabled = value == 0 ? true:false;
		this.refs.plan_start_time.disabled = isDisabled;
		this.refs.plan_end_time.disabled = isDisabled;
		this.resetPlanTime(parseInt(value), this.state.relies, this.state.plan_duration);
	},
	onPlanStartTimeChanged: function(event){
		this.setState({plan_start_time:toDateTime(event.target.value)});
	},
	onPlanEndTimeChanged: function(event){
		this.setState({plan_end_time:toDateTime(event.target.value)});
	},
	onRelyChanged: function(event){
		var value = event.target.value,
			regExp = /^[0-9\,]{0,99}$/;
		if( regExp.test(value)){			
			this.setState({relies:value});
			this.resetPlanTime(this.state.automode, value, this.state.plan_duration);
		}
	},
	resetForm: function(event){
		event.preventDefault();
		var task = this.props.task;
		this.refs.name.value = task.name;
		this.refs.executor.value = task.executor_id;
		this.refs.manager.value =task.manager_id;
		this.refs.difficulty.value = task.difficulty;
		this.refs.details.value = task.details;

		this.setState({plan_duration:task.plan_duration, automode: task.automode, plan_start_time: task.plan_start_time,
			plan_end_time: task.plan_end_time});
		this.resetRelies();
	},
	render: function(){
		var task = this.props.task,
			difficulties = this.props.difficulties,
			textarea_height = { height: "120px"};
			console.log(task);
		return ( 
			<div id={'modal_task_'+task.id + '_edit'}>
				<form onSubmit={this.handleSubmit}>
					<div className="uk-alert uk-alert-danger uk-hidden"></div>
					<table className="uk-table dv-border">
						<tbody>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">任务名称：</td>
								<td className="uk-width-3-10">
									<input name="name" type="text" ref="name" className="uk-width-1-1" autofucus placeholder="3-50字符" defaultValue={task.name} maxLength="50"/>
								</td>
								<td className="uk-width-2-10 uk-block-muted">计划工期(小时)：</td>
								<td className="uk-width-3-10">
									<input type="number" min="0" max="256" name="plan_duration" ref="plan_duration" className="uk-width-1-1" placeholder="填入整数" value={this.state.plan_duration} onChange={this.onDurationChanged}/>
								</td>
							</tr>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">执行人：</td>
								<td className="uk-width-3-10">
									<select name="executor" ref="executor" className="uk-width-1-1" defaultValue={task.executor_id}>
										{ this.props.project.members.map(function(u){
											return <option key={u.user_id} value={u.user_id}>{u.name}</option>
											})
										}
									</select>
								</td>
								<td className="uk-width-2-10 uk-block-muted">工作审核人：</td>
								<td className="uk-width-3-10">
									<select name="manager" ref="manager" className="uk-width-1-1" defaultValue={task.manager_id}>
										{ this.props.project.members.map(function(u){
											return <option key={u.user_id} value={u.user_id}>{u.name}</option>
											})
										}
									</select>
								</td>
							</tr>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">计划模式：</td>
								<td className="uk-width-3-10">
									<select name="automode" ref="automode" className="uk-width-1-1" value={this.state.automode} onChange={this.onAutoModeChanged}>
										<option value="0">自动</option>
										<option value="1">手动</option>
									</select>
								</td>
								<td className="uk-width-2-10 uk-block-muted">任务难度：</td>
								<td className="uk-width-3-10">
									<select name="difficulty" ref="difficulty" className="uk-width-1-1" defaultValue={task.difficulty}>
										{ difficulties.map(function(u, index){
											return <option key={index} value={index}>{u}</option>
											})
										}
									</select>
								</td>
							</tr>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">计划开始时间：</td>
								<td className="uk-width-3-10">
									<div className="uk-form-icon uk-width-1-1">
										<i className="uk-icon-calendar"></i>
										<input type="text" name="plan_start_time" className="uk-width-1-1" ref="plan_start_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}" value={formatDate(this.state.plan_start_time)} onChange={this.onPlanStartTimeChanged}/>
									</div>
								</td>
								<td className="uk-width-2-10 uk-block-muted">实际开始时间：</td>
								<td className="uk-width-3-10">{ task.start_time!==0?formatDate(task.start_time):'无' }</td>								
							</tr>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">计划结束时间：</td>
								<td className="uk-width-3-10">
									<div className="uk-form-icon uk-width-1-1">
										<i className="uk-icon-calendar"></i>
										<input type="text" name="plan_end_time" className="uk-width-1-1" ref="plan_end_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}" value={formatDate(this.state.plan_end_time)} onChange={this.onPlanEndTimeChanged}/>
									</div>
								</td>
								<td className="uk-width-2-10 uk-block-muted">实际结束时间：</td>
								<td className="uk-width-3-10">{ task.end_time!==0?formatDate(task.end_time):'无'}</td>
							</tr>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">前置任务：</td>
								<td colSpan="3">
									<input type="text" name="rely_to" className="uk-width-1-1" ref="rely_to" 
										value={this.state.relies} onChange={this.onRelyChanged}/>
								</td>
							</tr>	
							<tr>
								<td className="uk-block-muted">任务说明:</td>
								<td colSpan="3" >
									<textarea ref="details" name="details" className="uk-width-1-1" style={textarea_height} defaultValue={ task.details }>
									</textarea>
								</td>
							</tr>							
						</tbody>
					</table>
					<div className="uk-modal-footer uk-text-right">
						<div className="uk-grid">
							<div className="uk-width-1-2 uk-text-left">
								<button onClick={this.resetForm} className="uk-button">重置</button>
							</div>
							<div className="uk-width-1-2 uk-text-right">
								<button type="submit" className="uk-button uk-button-primary">保存</button>
							</div>
						</div>
					</div>
				</form>
			</div>
			)
	}
});


var TaskTabLog = React.createClass({
	onTaskChanged: function(newtask){

	},
	reset: function(newtask){
		var task = this.props.task;
		task.status = newtask.status;
		//this.props.hideModal();
		this.props.onTaskChanged();
	},
	render: function(){
		var marginTop = {marginTop:'50px'};
		var task = this.props.task;
		return ( 
			<div>
				<TaskFlow task={task} onTaskChanged={this.onTaskChanged} resetDialog={this.reset}/>
				<div style={marginTop}/>
				<TaskDailyList task={task}/>
			</div>
			)
	}
});


var TaskDialog = React.createClass({
	getInitialState: function() {
		return {task_id:'root', tab: 'view'};
	},
	onSwitch: function(type){
		this.setState({tab:type});
	},	
	showModal: function(){
		if( this.props.task ){
			var id = "modal_task_"+this.props.task.id;
			var modal = new UIkit.modal('#'+id);
			modal.show();
			// modal.on({
			// 	'hide.uk.modal': function(e){
			// 		ReactDOM.unmountComponentAtNode(document.getElementById(id));
			// 	}.bind(this)
			// });
		}		
	},
	hideModal: function(){
		var id = "modal_task_"+this.props.task.id;
			var modal = new UIkit.modal('#'+id);
			modal.hide();
	},
	componentDidMount: function(){
		this.showModal();
	},
	componentDidUpdate:function(){
		this.showModal();
	},
	render: function(){
		var task = this.props.task;
		var difficulties = [ '简单', '普通', '困难'];
		return (
				<div className="uk-modal-dialog uk-modal-dialog-large">
					<a href="#" className="uk-modal-close uk-close uk-close-alt"></a>
					<div className="uk-modal-header"><h2>任务：{task.name}</h2></div>
					
					<div>
						<div className="uk-grid">
							<div className="uk-width-medium-1-10">
								<ul className="uk-tab uk-tab-left" data-uk-tab={"{connect:'#tab-" + task.id +"'}"}>
									{ 
										this.props.tabs.map(function(t){
											if( t.type === 'edit' && task.manager_id !== ENV.user.id && this.props.project.master_id !== ENV.user.id){
												return null;
											}											
											return ( 
												<li key={'tab_view_'+t.type} id={'tab_view_'+task.id} className={ this.state.tab == t.type ? "uk-active": '' } onClick={this.onSwitch.bind(this,t.type)}>
													<a href="#" >{t.title}</a>
												</li>)
										}.bind(this))
									}
								</ul>
							</div>
							<div className="uk-width-medium-9-10">
								<ul id={"tab-" + task.id} className="uk-switcher">
									<li className={ this.state.tab == 'view' ? "uk-active": '' }>
										<TaskTabView task={task} difficulties={difficulties} project={this.props.project}/>
									</li>
									{
										( task.manager_id === ENV.user.id || this.props.project.master_id === ENV.user.id )?
										<li className={ this.state.tab == 'edit' ? "uk-active": '' }>
											<TaskTabEdit task={task} difficulties={difficulties} project={this.props.project} hideModal={this.hideModal} onTaskChanged={this.props.onTaskChanged}/>
										</li>
										: null
									}
									<li className={ this.state.tab == 'log' ? "uk-active": '' }>
										<TaskTabLog task={task} onTaskChanged={this.props.onTaskChanged} hideModal={this.hideModal}/>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			);
	}
});
