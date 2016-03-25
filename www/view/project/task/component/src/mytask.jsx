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
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged} role="manager" />,
				document.getElementById('modal_task_'+task.id)
			);
	},
	onTaskChanged: function(newtask){
		// var tasks = this.state.tasks, 
		// 	oldtask_index = null;
		// for(var i = 0; i < tasks.length; i++){
		// 	if( tasks[i].id === newtask.id ){
		// 		oldtask_index = i;
		// 		break;
		// 	}
		// }
		// // if( oldtask_index !== null){
		// // 	if( newtask.status !== 'doing'){
		// // 		tasks.splice(oldtask_index,1);
		// // 		this.setState({tasks:tasks});
		// // 		console.log("ExecutingTaskList delete")
		// // 	}
		// // }else if( newtask.status === 'doing' ){
		// // 	tasks.push(newtask);
		// // 	this.setState({tasks:tasks});
		// // 	console.log("ExecutingTaskList add")
		// // }
		// if( oldtask_index !== null){
		// 	if( newtask.status === 'completed' || newtask.status === 'cancel'){
		// 		var id = "modal_task_"+newtask.id;
		// 			var modal = new UIkit.modal('#'+id);
		// 			modal.on({
		// 			 	'hide.uk.modal': function(e){
		// 			 		this.loadTasks();
		// 			 	}.bind(this)
		// 			 });
		// 			modal.hide();
		// 	}else{
		// 		this.loadTasks();
		// 	}
		// }
		this.setState({updatedCnt:this.state.updatedCnt+1})	
	},
	sortTasks: function(tasks){
		var statusOrder = ['created','clear', 'pending', 'doing', 'commit'];
		tasks.sort(function(a,b){
			if(a.status === b.status){
				return a.plan_start_time - b.plan_start_time;
			}else{
				return statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status);
			}
		}.bind(this));
		return tasks;
	},
	loadTasks: function(){
		getJSON( '/api/project/t/listManage', {uid:this.props.uid}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					var ts = this.sortTasks(data);		
					this.setState({tasks:ts});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {tasks:[], updatedCnt:0}
	},
	componentWillMount: function(){
		this.loadTasks();
		listeners.push(this);
	},
	render: function(){
		return (
			<div className="uk-width-1-1">		
				<hr className="dv-hr"/>
				<table className="uk-table">
					<thead>
						<tr>
							<th className="uk-width-2-10">任务名称</th>
							<th className="uk-width-1-10">任务状态</th>
							<th className="uk-width-1-10">任务执行人</th>
							<th className="uk-width-1-10">计划开始时间</th>
							<th className="uk-width-1-10">计划结束时间</th>
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
								var statusCls = { created: 'uk-text-warning', clear:'', doing: 'uk-text-primary', commit: 'uk-text-success',
				completed: 'uk-text-success', pending: 'uk-text-warning' };
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											{getDateTimeAt0(t.plan_end_time)<Date.now()?tip:''}
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td><span className={statusCls[t.status]}>{taskStatusMap[t.status]}</span></td>
										<td>{t.executor_name}</td>
										<td>{formatDate(t.plan_start_time)}</td>
										<td>{formatDate(t.plan_end_time)}</td>
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
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged} role="executor"/>,
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
		//if( oldtask_index !== null){
		// 	if( newtask.status !== 'doing' && newtask.status !== 'commit'){
		// 		tasks.splice(oldtask_index,1);
		// 		this.setState({tasks:tasks});
		// 		console.log("ExecutingTaskList delete")
		// 	}
		// }else if( newtask.status === 'doing' ){
		// 	tasks.push(newtask);
		// 	this.setState({tasks:tasks});
		// 	console.log("ExecutingTaskList add")
		// }
		if( oldtask_index !== null && ( newtask.status === 'completed' 
			|| newtask.status === 'pending' || newtask.status === 'cancel')){
			var id = "modal_task_"+newtask.id;
				var modal = new UIkit.modal('#'+id);
				modal.on({
				 	'hide.uk.modal': function(e){
				 		this.loadTasks();
				 	}.bind(this)
				 });
				modal.hide();
		}else{
			this.loadTasks();
		}
	},
	sortTasks: function(tasks){
		var statusOrder = ['pending', 'doing', 'commit'];
		tasks.sort(function(a,b){
			if(a.status === b.status){
				return a.plan_end_time - b.plan_end_time;
			}else{
				return statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status);
			}
		}.bind(this));
		return tasks;
	},
	loadTasks: function(){
		getJSON( '/api/project/t/listExecuting', {uid:this.props.uid}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					var ts = this.sortTasks(data);			
					this.setState({tasks:ts});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
		//listeners.push(this);
	},
	render: function(){
		return (
			<div className="uk-width-1-1">		
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
								var tip = <span className="uk-badge uk-badge-danger uk-badge-notification">紧急</span>
								var statusCls = { doing: 'uk-text-primary', commit: 'uk-text-success', pending: '' };
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											{getDateTimeAt0(t.plan_end_time)<Date.now()?tip:''}
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td><span className={statusCls[t.status]}>{taskStatusMap[t.status]}</span></td>
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
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged} role="executor"/>,
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
		// if( oldtask_index !== null ){
		// 	if( newtask.status === 'doing'){
		// 		console.log('doing')
		// 		var id = "modal_task_"+newtask.id;
		// 		var modal = new UIkit.modal('#'+id);
		// 		modal.on({
		// 		 	'hide.uk.modal': function(e){
		// 		 		tasks.splice(oldtask_index,1);
		// 				this.setState({tasks:tasks});
		// 				console.log("ExecutingTaskList delete")
		// 		 	}.bind(this)
		// 		 });
		// 		console.log(modal);
		// 		modal.hide();
				
		// 	}else if(  newtask.status === 'clear'){
		// 		tasks[oldtask_index] = newtask;
		// 		this.setState({tasks:tasks});
		// 	}
		// }
		if( oldtask_index !== null ){
			var oldtask = tasks[oldtask_index]
			if( (oldtask.status === 'clear' || oldtask.status === 'pending') && (
				newtask.status === 'doing' )){
				var id = "modal_task_"+newtask.id;
					var modal = new UIkit.modal('#'+id);
					modal.on({
					 	'hide.uk.modal': function(e){
					 		this.loadTasks();
					 	}.bind(this)
					 });
					modal.hide();
			}else{
				this.loadTasks();
			}
		}else{
			this.loadTasks();
		}		
	},
	sortTasks: function(tasks){
		var statusOrder = ['created', 'pending', 'clear', 'doing'];
		tasks.sort(function(a,b){
			if(a.status === b.status){
				return a.plan_start_time - b.plan_start_time;
			}else{
				return statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status);
			}
		}.bind(this));
		return tasks;
	},
	loadTasks: function(){
		getJSON( '/api/project/t/listQueue', {uid:this.props.uid}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					var ts = this.sortTasks(data);		
					this.setState({tasks:ts});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
		//listeners.push(this);
	},
	render: function(){
		return (
			<div className="uk-width-1-1">		
				<hr className="dv-hr"/>
				<table className="uk-table">
					<thead>
						<tr>
							<th className="uk-width-3-10">任务名称</th>
							<th className="uk-width-1-10">任务状态</th>
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
								var statusCls = { created: '', clear:'uk-text-warning', doing: 'uk-text-primary', 
				 							pending: '' };
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											{getDateTimeAt0(t.plan_start_time)<Date.now()?tip:''}
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td><span className={statusCls[t.status]}>{taskStatusMap[t.status]}</span></td>
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
			</div>
			)
	}
});

var MyManageTask = React.createClass({
	render: function(){
		var marginTop = {marginTop:'50px'}
		return (
			<div className="uk-width-1-1">
				<h1 className="uk-text-center"><b>我管理的任务</b></h1>
				<ManageTaskList uid={this.props.uid}/>
				<div style={marginTop}></div>
			</div>
			)
	}
});

var MyPlanTask = React.createClass({
	render: function(){
		var marginTop = {marginTop:'50px'}
		return (
			<div className="uk-width-1-1">
				<h1 className="uk-text-center"><b>待执行的任务</b></h1>
				<QueueTaskList uid={this.props.uid}/>
				<div style={marginTop}></div>
			</div>
			)
	}
});