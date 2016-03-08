var Task = React.createClass({
	getInitialState: function() {
		return { };
	},
	onDoubleClick: function(e){
		e.preventDefault();
		var tabs = [
						{ type:'view', title: '概况' },
						{ type:'edit', title: '编辑' },
						{ type:'log', title: '进展' }
					];
		ReactDOM.render(
			<TaskDialog task={this.props.task} tabs={tabs} project={this.props.project} onTaskChanged={this.props.onTaskChanged}/>,
				document.getElementById('modal_task_'+this.props.task.id)
			);
	},
	render: function(){		
		var task = this.props.task,
			parentCls = task.parent !=='root' ? 'treegrid-parent-' + task.parent : '',
			plan_mode = task.automode === 0 ? '自动' : '手动',
			start_time = task.status=='created'?formatDate(task.plan_start_time): formatDate(task.start_time),
			end_time = task.status=='created'?formatDate(task.plan_end_time): formatDate(task.end_time),
			relies = [];
			task.rely.forEach(function(r, n){
				relies.push( this.props.project.TaskMap[r].index );
			}.bind(this));

		return (
			<tr id={task.id} key={task.id} onDoubleClick={this.onDoubleClick} className={ 'treegrid-' + task.id + ' ' + parentCls}>
				<td className="uk-block-muted"><button  className="uk-button-link dv-link">{this.props.index}</button></td>
				<td>{task.name}
					<div id={"modal_task_"+task.id} className="uk-modal">
					</div>
				</td>
				<td>{task.executor_name}</td>
				<td>{relies.toString()||'无'}</td>
				<td>{task.isCompleted?task.duration:task.plan_duration}</td>
				<td>{plan_mode}</td>
				<td>{start_time}</td>
				<td>{end_time}</td>
			</tr>
			);
	}
});

var TaskTable = React.createClass({
	getInitialState: function() {
		return {taskLen: 0, changed_cnt:0 };
	},
	initTree: function (options){
		options = options || {};
		$('.tree').treegrid({
			treeColumn: 1,
			expanderExpandedClass: 'uk-icon-folder-open-o',
			expanderCollapsedClass: 'uk-icon-folder-o',
			nodeClasses: {
				task:'uk-icon-tasks'
			},
			draggable: true, 
			//onMove: moveDepartment,
			selectable: true,
			selectedClass: 'dv-row-selected',
			onSelected:options.onSelected,
			leafClass:'uk-icon-leaf'
		});
	},
	resetTree: function(){
		this.initTree({
			onSelected: this.props.onTaskSelected
		});
	},
	onTaskChanged: function(){
		this.setState({changed_cnt:this.state.changed_cnt++});
	},
	componentDidUpdate:function(){
		if( this.props.tasks.length !== this.state.taskLen ){
			this.resetTree();
			this.setState({taskLen:this.props.tasks.length})
		}
	},
	render: function(){
		var smallwidth = { width: "5%" };
		
		return (
			<div>
				<table id="treeTask" className="tree uk-table uk-width-1-1 uk-table-condensed">
					<thead>
						<tr>
							<th style={smallwidth}>标识</th>
							<th className="uk-width-3-10">任务名称</th>
							<th className="uk-width-1-10">负责人</th>
							<th className="uk-width-1-10">前置任务</th>
							<th className="uk-width-1-10">工期(小时)</th>
							<th className="uk-width-1-10">计划模式</th>
							<th className="uk-width-1-10">开始时间</th>
							<th className="uk-width-1-10">结束时间</th>		
						</tr>
					</thead>
					<tbody>
						{ this.props.tasks.map(function(t, index){
								return <Task key={t.id} task={t} index={index} project={this.props.project} onTaskChanged={this.onTaskChanged}/>
							}.bind(this))
						}
					</tbody>
				</table>
				
			</div>
			);
	}
});

var ToolBar = React.createClass({
	getInitialState: function() {
		return {new_task_parent:'root'};
	},
	handleNewTask: function(parent){
		this.setState({new_task_parent:parent});
	},
	render: function(){		
		return (
			<div className="uk-grid">
				<div className="uk-width-1-3">
					添加任务：
					<a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,'root')} data-uk-modal="{center:true}">顶级</a>、
					<a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,this.props.evaluateTaskParent(this.props.selected_task))} data-uk-modal="{center:true}">同级</a>、
					<a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,this.props.selected_task)} data-uk-modal="{center:true}">下属</a>
					<NewTaskDlg users={this.props.users} project={this.props.project} parent={this.state.new_task_parent} onNewTask={this.props.onNewTask} TaskMap={this.props.TaskMap}/>
				</div>
			</div>
			)
	}
});

var Project = React.createClass({
	getInitialState: function() {
		return { project: {}, users:[], tasks:[], selected_task:'root', UserMap:{}, TaskMap:{}};
	},
	onNewTask: function(id){
		getJSON( '/api/project/task/'+id, function(err, data ){
				if(!err){
					var t = data,
						ts = this.state.tasks;
					t.executor_name = this.state.UserMap[t.executor_id].name;
					t.manager_name = this.state.UserMap[t.manager_id].name;
					t.isCompleted = t.status=='completed';
					this.state.TaskMap[t.id] = t;
					ts.push(t);
					this.sortTasks(ts);
					this.setState({tasks:ts});
				}
			}.bind(this)
		); 
	},
	onTaskSelected: function(id){
		this.setState({selected_task:id});
	},
	/*key-value: user id - user object*/
	makeUserMap: function (us){
		us.forEach(function(u){
			this.state.UserMap[u.user_id] = u;
		}.bind(this));
	},
	makeTaskMap: function (ts){
		var TaskMap = this.state.TaskMap;
		TaskMap['root'] = { id:'root', name:'root', parent: 'none' };
		ts.forEach(function(t){
			TaskMap[t.id] = t;
		});
	},
	getTaskById: function( id){
		return this.state.TaskMap[id];
	},
	evaluateTaskParent: function (id){
		var TaskMap = this.state.TaskMap;
		if( !TaskMap.hasOwnProperty(id) || id === 'root'){
			return 'root';
		}
		return TaskMap[id].parent;
	},
	sortTasks: function( ts ){
		var TaskMap = this.state.TaskMap;

		function evaluateTaskAncestor(id){
			var as = [];
			if( TaskMap.hasOwnProperty(id) && id !== 'root' ){
				var tid = id;
				do{
					var a = TaskMap[tid];
					as.unshift(a.parent);
					tid = a.parent;
				}while(tid!=='root');
			}
			return as;
		}

		ts.sort(function(a,b){
			if(a.parent === b.parent){
				return a.order - b.order;
			}else{
				var aas = evaluateTaskAncestor(a.id),
					abs = evaluateTaskAncestor(b.id),
					maxlen = Math.max(aas.length, abs.length);
				for(var i = 0; i < maxlen; i++ ){
					if(i>=aas.length){
						return a.order - TaskMap[abs[i]].order <= 0 ? -1 : 1;
					}
					if(i>=abs.length){
						return TaskMap[aas[i]].order - b.order >= 0? 1: -1;
					}
					if(aas[i]!==abs[i]){
						return TaskMap[aas[i]].order - TaskMap[abs[i]].order;
					}
				}
				return 0;
			}
		});

		ts.forEach( function(t, index) {
			t.index = index;
		});
		return ts;
	},
	loadTaskRelies: function(tasks){
		getJSON( '/api/project/p/'+ this.props.id +'/taskrelylist', function(err, data ){
				readyElement('vm');
				if(err){
					fatal(err);
				}else{
					data.forEach( function(r, index) {
						var task = this.state.TaskMap[r.task_id];
						if( task ){
							task.rely.push(r.rely_task_id);
						}
					}.bind(this));
					this.setState({tasks:tasks});
				}
			}.bind(this)
		);
	},
	loadTasks: function(){
		getJSON( '/api/project/p/'+ this.props.id+'/tasklist', function(err, data ){
				if(err){
					fatal(err);
				}else{					
					this.makeTaskMap(data);
					var tasks = this.sortTasks(data);
					data.forEach( function(t, index) {
						t.executor_name = this.state.UserMap[t.executor_id].name;
						t.manager_name = this.state.UserMap[t.manager_id].name;
						t.isCompleted = t.status=='completed';
						t.rely = [];
					}.bind(this));					
					this.loadTaskRelies(tasks);
					this.state.project.tasks = tasks;
				}
			}.bind(this)
		);
	},
	componentWillMount: function(){
		loadingElement('vm');
		getJSON( '/api/project/p/' + this.props.id, function(err, data ){				
				if(err){
					fatal(err);
				}else{
					this.makeUserMap(data.members);
					data.UserMap = this.state.UserMap;
					data.TaskMap = this.state.TaskMap;
					this.setState({project:data, users: data.members});
					this.loadTasks();				
				}
			}.bind(this)
		);
		
	},	
	render: function(){
		return (
			<div className="uk-width-1-1">				
				<h2 className="x-title">项目: {this.state.project.name}</h2>
				<ToolBar users={this.state.users} onNewTask={this.onNewTask} project={this.state.project} selected_task={this.state.selected_task} evaluateTaskParent={this.evaluateTaskParent} TaskMap={this.state.TaskMap}/>				
				<hr className="dv-hr"/>
				<TaskTable project={this.state.project} tasks={this.state.tasks} onTaskSelected={this.onTaskSelected} getTaskById={this.getTaskById}/>
			</div>
			);
	}
});

