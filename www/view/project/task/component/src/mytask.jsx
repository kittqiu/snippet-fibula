var listeners = [];
function noticeTaskChanged(newtask){
	for(var i = 0; i < listeners.length; i++ ){
		listeners[i].onTaskChanged(newtask);
	}
}

var ManageTaskList = React.createClass({	
	handleView: function(task, e){
		e.preventDefault();
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged}/>,
				document.getElementById('modal_task_'+task.id)
			);
	},
	onTaskChanged: function(newtask){
		var tasks = this.state.tasks, 
			oldtask_index = null;
		for(var i = 0; i < tasks.length; i++){
			if( tasks[i].id === newtask.id ){
				oldtask_index = i;
				break;
			}
		}
		if( oldtask_index !== null){
			if( newtask.status !== 'doing'){
				tasks.splice(oldtask_index,1);
				this.setState({tasks:tasks});
				console.log("ExecutingTaskList delete")
			}
		}else if( newtask.status === 'doing' ){
			tasks.push(newtask);
			this.setState({tasks:tasks});
			console.log("ExecutingTaskList add")
		}
	},
	loadTasks: function(){
		getJSON( '/api/project/t/listManage', {uid:this.props.uid}, function(err, data ){
				if(err){
					fatal(err);
				}else{					
					this.setState({tasks:data});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
	},
	render: function(){
		return (
			<div className="uk-width-1-1">		
				<h2><b>管理的任务</b></h2>		
				<hr className="dv-hr"/>
				<table className="uk-table">
					<thead>
						<tr>
							<th className="uk-width-2-10">任务名称</th>
							<th className="uk-width-1-10">任务执行人</th>
							<th className="uk-width-1-10">计划开始时间</th>
							<th className="uk-width-1-10">计划结束时间</th>
							<th className="uk-width-1-10">实际开始时间</th>
							<th className="uk-width-1-10">当前进度</th>
							<th className="uk-width-1-10">已用工期</th>
							<th className="uk-width-1-10">计划工期</th>
							<th className="uk-width-1-10">所属的项目</th>						
						</tr>
					</thead>
					<tbody>
						{
							this.state.tasks.map(function(t, index){
								var tip = <span className="uk-badge uk-badge-danger uk-badge-notification">紧急</span>
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											{getDateTimeAt0(t.plan_end_time)<Date.now()?tip:''}
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td>{t.executor_name}</td>
										<td>{formatDate(t.plan_start_time)}</td>
										<td>{formatDate(t.plan_end_time)}</td>
										<td>{t.start_time===0?'无':formatDate(t.start_time)}</td>
										<td>{t.percent}%</td>
										<td>{t.duration}小时</td>									
										<td>{t.plan_duration}小时</td>										
										<td><a className="dv-link" href={'/project/p/'+t.project_id+'/build'}>{t.project_name}</a></td>
									</tr>
									)
							}.bind(this))
						}
					</tbody>
				</table>
			</div>
			)
	}
});


var ExecutingTaskList = React.createClass({	
	handleView: function(task, e){
		e.preventDefault();
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged}/>,
				document.getElementById('modal_task_'+task.id)
			);
	},
	onTaskChanged: function(newtask){
		var tasks = this.state.tasks, 
			oldtask_index = null;
		for(var i = 0; i < tasks.length; i++){
			if( tasks[i].id === newtask.id ){
				oldtask_index = i;
				break;
			}
		}
		if( oldtask_index !== null){
			if( newtask.status !== 'doing' && newtask.status !== 'commit'){
				tasks.splice(oldtask_index,1);
				this.setState({tasks:tasks});
				console.log("ExecutingTaskList delete")
			}
		}else if( newtask.status === 'doing' ){
			tasks.push(newtask);
			this.setState({tasks:tasks});
			console.log("ExecutingTaskList add")
		}
	},
	loadTasks: function(){
		getJSON( '/api/project/t/listExecuting', {uid:this.props.uid}, function(err, data ){
				if(err){
					fatal(err);
				}else{					
					this.setState({tasks:data});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
		listeners.push(this);
	},
	render: function(){
		return (
			<div className="uk-width-1-1">		
				<h2><b>今日任务</b></h2>		
				<hr className="dv-hr"/>
				<table className="uk-table">
					<thead>
						<tr>
							<th className="uk-width-2-10">任务名称</th>
							<th className="uk-width-1-10">任务状态</th>
							<th className="uk-width-1-10">计划开始时间</th>
							<th className="uk-width-1-10">计划结束时间</th>
							<th className="uk-width-1-10">当前进度</th>
							<th className="uk-width-1-10">任务审核人</th>
							<th className="uk-width-1-10">计划工期</th>
							<th className="uk-width-1-10">已用工期</th>
							<th className="uk-width-1-10">所属的项目</th>						
						</tr>
					</thead>
					<tbody>
						{
							this.state.tasks.map(function(t, index){
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td>{taskStatusMap[t.status]}</td>
										<td>{formatDate(t.plan_start_time)}</td>
										<td>{formatDate(t.plan_end_time)}</td>
										<td>{t.percent}%</td>
										<td>{t.manager_name}</td>
										<td>{t.plan_duration}小时</td>
										<td>{t.duration}小时</td>
										<td><a className="dv-link" href={'/project/p/'+t.project_id+'/build'}>{t.project_name}</a></td>
									</tr>
									)
							}.bind(this))
						}
					</tbody>
				</table>
			</div>
			)
	}
});

var QueueTaskList = React.createClass({
	handleView: function(task, e){
		e.preventDefault();
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged}/>,
				document.getElementById('modal_task_'+task.id)
			);
	},
	onTaskChanged: function(newtask){
		var tasks = this.state.tasks, 
			oldtask_index = null;
		for(var i = 0; i < tasks.length; i++){
			if( tasks[i].id === newtask.id ){
				oldtask_index = i;
				break;
			}
		}
		if( oldtask_index !== null && newtask.status !== 'created'){
			tasks.splice(oldtask_index,1);
			this.setState({tasks:tasks});
			console.log("ExecutingTaskList delete")
		}
	},
	loadTasks: function(){
		getJSON( '/api/project/t/listQueue', {uid:this.props.uid}, function(err, data ){
				if(err){
					fatal(err);
				}else{					
					this.setState({tasks:data});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
		listeners.push(this);
	},
	render: function(){
		return (
			<div className="uk-width-1-1">		
				<h2><b>待执行的任务</b></h2>		
				<hr className="dv-hr"/>
				<table className="uk-table">
					<thead>
						<tr>
							<th className="uk-width-3-10">任务名称</th>
							<th className="uk-width-1-10">计划开始时间</th>
							<th className="uk-width-1-10">计划结束时间</th>
							<th className="uk-width-1-10">任务审核人</th>
							<th className="uk-width-1-10">工期(小时)</th>
							<th className="uk-width-1-10">所属的项目</th>
						</tr>
					</thead>
					<tbody>
						{
							this.state.tasks.map(function(t, index){
								var tip = <span className="uk-badge uk-badge-danger uk-badge-notification">紧急</span>
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											{getDateTimeAt0(t.plan_start_time)<Date.now()?tip:''}
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td>{formatDate(t.plan_start_time)}</td>
										<td>{formatDate(t.plan_end_time)}</td>
										<td>{t.manager_name}</td>
										<td>{t.plan_duration}</td>
										<td><a className="dv-link" href={'/project/p/'+t.project_id+'/build'}>{t.project_name}</a></td>
									</tr>
									)
							}.bind(this))
						}
					</tbody>
				</table>
			</div>
			)
	}
});


var MyTask = React.createClass({
	render: function(){
		var marginTop = {marginTop:'50px'}
		return (
			<div className="uk-width-1-1">
				<h1 className="uk-text-center"><b>我的任务</b></h1>
				<ExecutingTaskList uid={this.props.uid}/>
				<div style={marginTop}></div>
				<ManageTaskList uid={this.props.uid}/>
				<div style={marginTop}></div>
				<QueueTaskList uid={this.props.uid}/>
			</div>
			)
	}
});