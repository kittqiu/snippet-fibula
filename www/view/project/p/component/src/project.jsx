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
			noMargin = {marginRight:'0px'},
			statusCls = { created: 'uk-text-muted', clear:'uk-text-muted', doing: 'uk-text-primary', commit: 'uk-text-primary',
				completed: 'uk-text-success', cancel: 'uk-text-warning', pending: 'uk-text-warning' },
			start_time = taskIsInPlan(task)?formatDate(task.plan_start_time): formatDate(task.start_time),
			end_time = taskIsInPlan(task)?formatDate(task.plan_end_time): (task.end_time===0?'无' : formatDate(task.end_time)),
			timeCls = taskIsInPlan(task)?'':'uk-text-primary',
			durationCls = task.isCompleted?'uk-text-primary':'',
			relies = [];
			task.rely.forEach(function(r, n){
				relies.push( this.props.project.TaskMap[r].index );
			}.bind(this));

		return (
			<tr id={task.id} key={task.id} onDoubleClick={this.onDoubleClick} className={ 'treegrid-' + task.id + ' ' + parentCls}>
				<td className="uk-block-muted"><button className="uk-button-link dv-link" style={noMargin}>{this.props.index}</button></td>
				<td>{task.name}
					<div id={"modal_task_"+task.id} className="uk-modal">
					</div>
				</td>
				<td className="uk-text-center"><i className={ 'uk-icon-circle ' + statusCls[task.status] }></i></td>
				<td>{task.executor_name}</td>				
				<td><span className={durationCls}>{task.isCompleted?task.duration:task.plan_duration}</span></td>
				<td>{plan_mode}</td>
				<td>{relies.toString()||'无'}</td>
				<td><span className={timeCls}>{start_time}</span></td>
				<td><span className={timeCls}>{end_time}</span></td>
			</tr>
			);
	}
});

var TaskTable = React.createClass({
	getInitialState: function() {
		return {taskLen: 0, changed_cnt:0, update_cnt:0 };
	},
	initTree: function (options){
		options = options || {};
		$('.tree').treegrid('initTreeInOrder', {
			treeColumn: 1,
			expanderExpandedClass: 'uk-icon-minus-square-o',
			expanderCollapsedClass: 'uk-icon-plus-square-o',
			nodeClasses: {
				task:'uk-icon-tasks'
			},
			draggable: this.props.mode === 'rw', 
			renderOnDrag: false,
			onMove: this.dragTask,
			selectable: true,
			selectedClass: 'dv-row-selected',
			onSelected:options.onSelected,
			leafClass:'uk-icon-file-text-o',
			initialState:'collapsed',
			saveState: true,
			saveStateName: 'project-' + this.props.project.id
		});
	},
	dragTask: function(task_id, toParentId, fromParentId ){
		var TaskMap = this.props.project.TaskMap;
		if( TaskMap[task_id].parent !== toParentId ){
			this.props.handleMoveTo(toParentId, task_id);
			console.log( 'Move task ' + TaskMap[task_id].name +' from ' + (fromParentId==='root'||fromParentId===null ?'root':TaskMap[fromParentId].name) + ' to ' + TaskMap[toParentId].name );
		}
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
		if( this.props.tasks.length !== this.state.taskLen){
			if( this.state.taskLen === 0 ){
				this.resetTree();
			}else{
				if( this.props.action.startsWith("add")){
					var $this = $('.tree'),
						id = this.props.action.split("-")[1],
						settings = $this.data('settings');
					var $node = $this.treegrid('getSetting', 'getNodeById').apply($this, [id, $this]);
					$node.treegrid('initNode', settings);
				}
			}
			
			this.setState({taskLen:this.props.tasks.length})
		}
		if( this.props.project.update_cnt !== this.state.update_cnt){
			this.resetTree();
			this.setState({update_cnt:this.props.project.update_cnt})
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
							<th style={smallwidth}>状态</th>							
							<th className="uk-width-1-10">负责人</th>							
							<th className="uk-width-1-10">工期(小时)</th>
							<th className="uk-width-1-10">计划模式</th>
							<th className="uk-width-1-10">前置任务</th>
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
		return {new_task_parent:'root', selected_task:'root', disabledDown:true, disabledUp:true, disabledRoot:true, showltb:false};
	},
	handleNewTask: function(parent){
		this.setState({new_task_parent:parent});
	},
	handleMove: function(action){
		var selected_task = this.state.selected_task,
			task = this.props.project.TaskMap[selected_task],
			tasks = this.props.project.tasks,
			i;
		
		postJSON( '/api/project/task/'+task.id+'/move', {action:action}, function(err, result){
			if(err)
				fatal(err);
		});
		if( action === 'up'){
			task.order--;
			for( i = task.index-1; i >= 0; i--){
				if( tasks[i].parent === task.parent){
					tasks[i].order++;
					break;
				}
			}
		}else if( action === 'down' ){
			task.order++;
			for( i = task.index+1; i < tasks.length; i++){
				if( tasks[i].parent === task.parent){
					tasks[i].order--;
					break;
				}
			}
		}
		
		this.props.onTaskOrderChanged();
		this.resetMoveStatus(selected_task);
	},
	handleMoveToRoot: function(){
		var selected_task = this.state.selected_task,
			TaskMap = this.props.project.TaskMap,
			task = TaskMap[selected_task];
		while( task.parent !== 'root' ){
			task = TaskMap[task.parent];
		} 
		this.props.handleMoveTo('root', selected_task, task.order+1);
		this.resetMoveStatus(selected_task);
	},
	resetMoveStatus: function(selected_task){
		var task = this.props.project.TaskMap[selected_task],
			tasks = this.props.project.tasks,
			maxOrder = task.order;
		for( var i = task.index + 1; i < tasks.length; i++ ){
			var t = tasks[i];
			if( t.parent === task.parent ){
				maxOrder = t.order;
				break;
			}
		}
		this.setState({disabledDown: task.order===maxOrder, disabledUp: task.order===0, disabledRoot: task.parent==='root'});	
	},
	showLeftToolBar: function(){
		var isshown = this.state.showltb;
		if( isshown ){
			$('#ID_LeftToolBar').hide();
		}else{
			$('#ID_LeftToolBar').show();
		}
		this.setState( {showltb: !isshown});
	},
	componentWillReceiveProps: function(nextProps){
		if( nextProps.selected_task !== this.state.selected_task){
			var selected_task = nextProps.selected_task;
			this.resetMoveStatus(selected_task);
			this.setState({selected_task:selected_task})
		}
	},
	render: function(){		
		return (
			<div className="uk-grid">
				<div className="uk-width-1-3">
					添加任务：
					<a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,'root')} data-uk-modal="{center:true}">顶级</a>、
					<a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,this.props.evaluateTaskParent(this.props.selected_task))} data-uk-modal="{center:true}">同级</a>、
					<a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,this.props.selected_task)} data-uk-modal="{center:true}">下属</a>
					<NewTaskDlg users={this.props.users} project={this.props.project} parent={this.state.new_task_parent} onNewTask={this.props.onNewTask} />
				</div>
				<div className="uk-width-1-3">
					移动：
					<button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'up')} disabled={this.state.disabledUp}>上移</button>、
					<button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'down')} disabled={this.state.disabledDown}>下移</button>、
					<button className="uk-button-link dv-link" onClick={this.handleMoveToRoot} disabled={this.state.disabledRoot}>置为顶级</button>
				</div>
				<div className="uk-width-1-3">
					其他：
					<button className="uk-button-link dv-link" onClick={this.showLeftToolBar}>{ this.state.showltb ? '隐藏' : '显示'}左侧工具栏</button>
				</div>
				<ul id="ID_LeftToolBar" className={ "uk-nav uk-nav-menu " + ( this.state.showltb ? "": "uk-hidden" )} data-uk-scrollspy-nav="{closest:'li', smoothscroll:false}">
					<li>添加任务</li>
					<li><a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,'root')} data-uk-modal="{center:true}">顶级</a></li>
					<li><a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,this.props.evaluateTaskParent(this.props.selected_task))} data-uk-modal="{center:true}">同级</a></li>
					<li><a className="dv-link" href={'#modal_new_task'} onClick={this.handleNewTask.bind(this,this.props.selected_task)} data-uk-modal="{center:true}">下属</a></li>
					<li>移动任务</li>
					<li><button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'up')} disabled={this.state.disabledUp}>上移</button></li>
					<li><button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'down')} disabled={this.state.disabledDown}>下移</button></li>
					<li><button className="uk-button-link dv-link" onClick={this.handleMoveToRoot} disabled={this.state.disabledRoot}>置为顶级</button></li>
				</ul>
			</div>
			)
	}
});


var Project = React.createClass({
	getInitialState: function() {
		return { project: {}, users:[], tasks:[], selected_task:'root', UserMap:{}, TaskMap:{}, action:''};
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
					this.setState({tasks:ts, action:'add-' + t.id});
				}
			}.bind(this)
		); 
	},
	hasBloodRelation:function(ida, idb){
		var pas = this.evaluateTaskAncestor(ida),
			pbs = this.evaluateTaskAncestor(idb);
		if( pas.indexOf(idb)!== -1 || pbs.indexOf(ida)!== -1){
			console.log('hasBloodRelation')
			return true;
		}
		return false;
	},
	onTaskSelected: function(id){
		this.setState({selected_task:id});
	},
	onTaskOrderChanged: function(){
		var ts = this.state.tasks;
		this.sortTasks(ts);
		this.setState({tasks:ts});
	},
	handleMoveTo: function(parent, task_id, new_order){
		var selected_task = task_id || this.state.selected_task,
			task = this.state.TaskMap[selected_task],
			tasks = this.state.tasks,
			params = {action:'update_parent', parent:parent },
			i;
		if( task.parent === parent ){
			return;
		}
		
		for(i = task.index + 1; i < tasks.length; i++ ){
			var t = tasks[i];
			if( t.parent === task.parent ){
				t.order--;
			}				
		}

		if( new_order === undefined ){
			var maxOrder = -1;
			for( i = 0; i < tasks.length; i++ ){
				var t = tasks[i];
				if( t.parent === parent){
					maxOrder = Math.max(maxOrder, t.order);
				}
			}
			task.order = maxOrder + 1;
		}else{
			for( i = 0; i < tasks.length; i++ ){
				var t = tasks[i];
				if( t.parent === parent){
					if(t.order >= new_order){
						t.order++;
					}
				}
			}
			task.order = new_order;
			params.new_order = new_order;
		}
		
		task.parent = parent;		

		postJSON( '/api/project/task/'+task.id+'/move', params, function(err, result){
			if(err)
				fatal(err);
		});
		this.sortTasks(tasks);
		this.state.project.update_cnt++;
		this.setState({tasks:tasks});
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
	taskIsLeaf: function(tid){
		var tasks = this.state.tasks;
		for( var i = this.state.TaskMap[tid].index + 1; i < tasks.length; i++ ){
			if( tasks[i].parent === tid ){
				return false;
			}
		}
		return true;
	},
	
	evaluateTaskParent: function (id){
		var TaskMap = this.state.TaskMap;
		if( !TaskMap.hasOwnProperty(id) || id === 'root'){
			return 'root';
		}
		return TaskMap[id].parent;
	},
	evaluateTaskAncestor: function(id){
		var TaskMap = this.state.TaskMap;
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
	},
	sortTasks: function( ts ){
		var TaskMap = this.state.TaskMap, 
			i;		

		function calcTaskLevel(tasks){
			for( var i = 0; i < tasks.length; i++ ){
				var t = tasks[i];
				if( t.parent === 'root'){
					t.level = 1;
				}else{
					t.level = TaskMap[t.parent].level + 1;
				}
			}
		}

		function calcTotalDuration(tasks){
			var i, j, t;

			//reset
			for( i = 0; i < tasks.length; i++){
				t = tasks[i];
				t.total_duration = t.duration;
			}

			for( i = 0; i < tasks.length; i++){
				t = tasks[i];
				var children = 0;
				for( j = i + 1; j < tasks.length; j++ ){
					var tk = tasks[j];
					if( tk.level <= t.level ){
						break;
					}
					children += tk.duration;
				}
				t.total_duration += children;
			}
		}

		ts.sort(function(a,b){
			if(a.parent === b.parent){
				return a.order - b.order;
			}else{
				var aas = this.evaluateTaskAncestor(a.id),
					abs = this.evaluateTaskAncestor(b.id),
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
		}.bind(this));

		for( i = 0; i < ts.length; i++ ){
			var t = ts[i];
			t.index = i;
			t.isLeaf = this.taskIsLeaf.bind(this, t.id);
		}
		calcTaskLevel(ts);
		calcTotalDuration(ts);
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
					data.update_cnt = 0;
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
				{
					this.props.mode === 'ro'? null :
					<ToolBar users={this.state.users} onNewTask={this.onNewTask} project={this.state.project} onTaskOrderChanged={this.onTaskOrderChanged}
						selected_task={this.state.selected_task} evaluateTaskParent={this.evaluateTaskParent} 
						handleMoveTo={this.handleMoveTo}/>
				}			
				<hr className="dv-hr"/>				
				<TaskTable project={this.state.project} tasks={this.state.tasks} onTaskSelected={this.onTaskSelected} 
					getTaskById={this.getTaskById} handleMoveTo={this.handleMoveTo} mode={this.props.mode} action={this.state.action}/>
			</div>
			);
	}
});

