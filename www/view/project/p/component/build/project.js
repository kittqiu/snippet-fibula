'use strict';

var Task = React.createClass({
	displayName: 'Task',

	getInitialState: function getInitialState() {
		return { task: this.props.task, detail_shown: false };
	},
	onToggle: function onToggle(e) {
		e.preventDefault();
		this.setState({ detail_shown: !this.state.detail_shown });
	},
	render: function render() {
		var task = this.state.task,
		    parentCls = task.parent !== 'root' ? 'treegrid-parent-' + task.parent : '',
		    plan_mode = task.automode ? '自动' : '手动',
		    start_time = task.status == 'created' ? formatDate(task.plan_start_time) : formatDate(task.start_time),
		    end_time = task.status == 'created' ? formatDate(task.plan_end_time) : formatDate(task.end_time),
		    tabs = [{ type: 'view', title: '概况' }, { type: 'edit', title: '编辑' }, { type: 'log', title: '进展' }];

		return React.createElement(
			'tr',
			{ id: task.id, key: task.id, className: 'treegrid-' + task.id + ' ' + parentCls },
			React.createElement(
				'td',
				{ className: 'uk-block-muted' },
				React.createElement(
					'button',
					{ className: 'uk-button-link dv-link' },
					this.props.index
				)
			),
			React.createElement(
				'td',
				null,
				React.createElement(
					'a',
					{ className: 'dv-link-black', href: '#modal_' + task.id, 'data-uk-modal': '{center:true}' },
					task.name
				),
				React.createElement(TaskDialog, { task: task, tabs: tabs })
			),
			React.createElement(
				'td',
				null,
				task.executor_name
			),
			React.createElement(
				'td',
				null,
				task.duration
			),
			React.createElement(
				'td',
				null,
				plan_mode
			),
			React.createElement(
				'td',
				null,
				start_time
			),
			React.createElement(
				'td',
				null,
				end_time
			)
		);
	}
});

var TaskTable = React.createClass({
	displayName: 'TaskTable',

	getInitialState: function getInitialState() {
		return { taskLen: 0 };
	},
	initTree: function initTree(options) {
		options = options || {};
		$('.tree').treegrid({
			treeColumn: 1,
			expanderExpandedClass: 'uk-icon-folder-open-o',
			expanderCollapsedClass: 'uk-icon-folder-o',
			nodeClasses: {
				user: 'uk-icon-user',
				manager: 'uk-icon-manage',
				manager_duputy: 'uk-icon-manage-deputy'
			},
			draggable: true,
			//onMove: moveDepartment,
			selectable: true,
			selectedClass: 'uk-active',
			onSelected: options.onSelected
		});
	},
	resetTree: function resetTree() {
		this.initTree({
			onSelected: this.props.onTaskSelected
		});
	},
	componentDidUpdate: function componentDidUpdate() {
		if (this.props.tasks.length !== this.state.taskLen) {
			this.resetTree();
			this.setState({ taskLen: this.props.tasks.length });
		}
	},
	render: function render() {
		var smallwidth = { width: "5%" };
		return React.createElement(
			'table',
			{ id: 'treeTask', className: 'tree uk-table uk-width-1-1 uk-table-condensed' },
			React.createElement(
				'thead',
				null,
				React.createElement(
					'tr',
					null,
					React.createElement(
						'th',
						{ style: smallwidth },
						'标识'
					),
					React.createElement(
						'th',
						{ className: 'uk-width-3-10' },
						'任务名称'
					),
					React.createElement(
						'th',
						{ className: 'uk-width-2-10' },
						'负责人'
					),
					React.createElement(
						'th',
						{ className: 'uk-width-1-10' },
						'工期(天)'
					),
					React.createElement(
						'th',
						{ className: 'uk-width-1-10' },
						'计划模式'
					),
					React.createElement(
						'th',
						{ className: 'uk-width-1-10' },
						'开始时间'
					),
					React.createElement(
						'th',
						{ className: 'uk-width-1-10' },
						'结束时间'
					)
				)
			),
			React.createElement(
				'tbody',
				null,
				this.props.tasks.map(function (t, index) {
					return React.createElement(Task, { key: t.id, task: t, index: index });
				})
			)
		);
	}
});

var ToolBar = React.createClass({
	displayName: 'ToolBar',

	getInitialState: function getInitialState() {
		return { new_task_parent: 'root' };
	},
	handleNewTask: function handleNewTask(parent) {
		this.setState({ new_task_parent: parent });
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'uk-grid' },
			React.createElement(
				'div',
				{ className: 'uk-width-1-3' },
				'添加任务：',
				React.createElement(
					'a',
					{ className: 'dv-link', href: '#modal_new_task', onClick: this.handleNewTask.bind(this, 'root'), 'data-uk-modal': '{center:true}' },
					'顶级'
				),
				'、',
				React.createElement(
					'a',
					{ className: 'dv-link', href: '#modal_new_task', onClick: this.handleNewTask.bind(this, this.props.evaluateTaskParent(this.props.selected_task)), 'data-uk-modal': '{center:true}' },
					'同级'
				),
				'、',
				React.createElement(
					'a',
					{ className: 'dv-link', href: '#modal_new_task', onClick: this.handleNewTask.bind(this, this.props.selected_task), 'data-uk-modal': '{center:true}' },
					'下属'
				),
				React.createElement(NewTaskDlg, { users: this.props.users, parent: this.state.new_task_parent, onNewTask: this.props.onNewTask, TaskMap: this.props.TaskMap })
			)
		);
	}
});

var Project = React.createClass({
	displayName: 'Project',

	getInitialState: function getInitialState() {
		return { project: {}, users: [], tasks: [], selected_task: 'root', UserMap: {}, TaskMap: {} };
	},
	onNewTask: function onNewTask(id) {
		getJSON('/api/project/task/' + id, function (err, data) {
			if (!err) {
				var t = data,
				    ts = this.state.tasks;
				t.executor_name = this.state.UserMap[t.executor_id].name;
				this.state.TaskMap[t.id] = t;
				ts.push(t);
				this.sortTasks(ts);
				this.setState({ tasks: ts });
			}
		}.bind(this));
	},
	onTaskSelected: function onTaskSelected(id) {
		this.setState({ selected_task: id });
	},
	/*key-value: user id - user object*/
	makeUserMap: function makeUserMap(us) {
		us.forEach(function (u) {
			this.state.UserMap[u.id] = u;
		}.bind(this));
	},
	makeTaskMap: function makeTaskMap(ts) {
		var TaskMap = this.state.TaskMap;
		TaskMap['root'] = { id: 'root', name: 'root', parent: 'none' };
		ts.forEach(function (t) {
			TaskMap[t.id] = t;
		});
	},
	evaluateTaskParent: function evaluateTaskParent(id) {
		var TaskMap = this.state.TaskMap;
		if (!TaskMap.hasOwnProperty(id) || id === 'root') {
			return 'root';
		}
		return TaskMap[id].parent;
	},
	sortTasks: function sortTasks(ts) {
		var TaskMap = this.state.TaskMap;

		function evaluateTaskAncestor(id) {
			var as = [];
			if (TaskMap.hasOwnProperty(id) && id !== 'root') {
				var tid = id;
				do {
					var a = TaskMap[tid];
					as.unshift(a.parent);
					tid = a.parent;
				} while (tid !== 'root');
			}
			return as;
		}

		ts.sort(function (a, b) {
			if (a.parent === b.parent) {
				return a.order - b.order;
			} else {
				var aas = evaluateTaskAncestor(a.id),
				    abs = evaluateTaskAncestor(b.id),
				    maxlen = Math.max(aas.length, abs.length);
				for (var i = 0; i < maxlen; i++) {
					if (i >= aas.length) {
						return a.order - TaskMap[abs[i]].order <= 0 ? -1 : 1;
					}
					if (i >= abs.length) {
						return TaskMap[aas[i]].order - b.order >= 0 ? 1 : -1;
					}
					if (aas[i] !== abs[i]) {
						return TaskMap[aas[i]].order - TaskMap[abs[i]].order;
					}
				}
				return 0;
			}
		});
		return ts;
	},
	loadTasks: function loadTasks() {
		getJSON('/api/project/p/{{__id}}/tasklist', function (err, data) {
			readyElement('vm');
			if (err) {
				fatal(err);
			} else {
				data.forEach(function (t, index) {
					t.executor_name = this.state.UserMap[t.executor_id].name;
				}.bind(this));
				this.makeTaskMap(data);
				this.setState({ tasks: this.sortTasks(data) });
			}
		}.bind(this));
	},
	componentDidMount: function componentDidMount() {
		loadingElement('vm');
		getJSON('/api/project/p/{{__id}}', function (err, data) {
			if (err) {
				fatal(err);
			} else {
				this.makeUserMap(data.members);
				this.setState({ project: data, users: data.members });
				this.loadTasks();
			}
		}.bind(this));
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'uk-width-1-1' },
			React.createElement(
				'h2',
				{ className: 'x-title' },
				'项目: ',
				this.state.project.name
			),
			React.createElement(ToolBar, { users: this.state.users, onNewTask: this.onNewTask, selected_task: this.state.selected_task, evaluateTaskParent: this.evaluateTaskParent, TaskMap: this.state.TaskMap }),
			React.createElement('hr', { className: 'dv-hr' }),
			React.createElement(TaskTable, { tasks: this.state.tasks, onTaskSelected: this.onTaskSelected })
		);
	}
});

