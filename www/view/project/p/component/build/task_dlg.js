'use strict';

var TaskTabView = React.createClass({
	displayName: 'TaskTabView',

	render: function render() {
		var task = this.props.task;
		var difficulties = ['简单', '普通', '困难'];
		return React.createElement(
			'div',
			null,
			React.createElement(
				'table',
				{ className: 'uk-table dv-border' },
				React.createElement(
					'tbody',
					null,
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'任务名称：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							task.name
						),
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'工期(天)：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							task.duration
						)
					),
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'执行人：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							task.executor_name
						),
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'工作审核人：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							task.manager_name
						)
					),
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'计划模式：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							task.automode ? '自动' : '手动'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'任务难度：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							difficulties[task.difficulty]
						)
					),
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'开始时间：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							formatDate(task.start_time),
							' '
						),
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'计划开始时间：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							formatDate(task.plan_start_time)
						)
					),
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'结束时间：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							formatDate(task.end_time)
						),
						React.createElement(
							'td',
							{ className: 'uk-width-2-10 uk-block-muted' },
							'计划结束时间：'
						),
						React.createElement(
							'td',
							{ className: 'uk-width-3-10' },
							formatDate(task.plan_end_time)
						)
					),
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							{ className: 'uk-block-muted' },
							'任务说明:'
						),
						React.createElement(
							'td',
							{ colSpan: '3' },
							task.details
						)
					)
				)
			)
		);
	}
});

var TaskTabEdit = React.createClass({
	displayName: 'TaskTabEdit',

	render: function render() {
		return React.createElement('div', null);
	}
});

var TaskTabLog = React.createClass({
	displayName: 'TaskTabLog',

	render: function render() {
		return React.createElement('div', null);
	}
});

var TaskDialog = React.createClass({
	displayName: 'TaskDialog',

	getInitialState: function getInitialState() {
		return { task: this.props.task, tab: 'view' };
	},
	onSwitch: function onSwitch(type) {
		this.setState({ tab: type });
	},
	render: function render() {
		var task = this.state.task;
		return React.createElement(
			'div',
			{ id: 'modal_' + task.id, className: 'uk-modal' },
			React.createElement(
				'div',
				{ className: 'uk-modal-dialog uk-modal-dialog-large' },
				React.createElement('a', { href: '#', className: 'uk-modal-close uk-close uk-close-alt' }),
				React.createElement(
					'div',
					{ className: 'uk-modal-header' },
					React.createElement(
						'h2',
						null,
						'任务：',
						task.name
					)
				),
				React.createElement(
					'div',
					null,
					React.createElement(
						'div',
						{ className: 'uk-grid' },
						React.createElement(
							'div',
							{ className: 'uk-width-medium-1-10' },
							React.createElement(
								'ul',
								{ className: 'uk-tab uk-tab-left', 'data-uk-tab': "{connect:'#tab-" + task.id + "'}" },
								this.props.tabs.map(function (t) {
									return React.createElement(
										'li',
										{ key: 'tab_view_' + t.type, id: 'tab_view_' + task.id, className: this.state.tab == t.type ? "uk-active" : '', onClick: this.onSwitch.bind(this, t.type) },
										React.createElement(
											'a',
											{ href: '#' },
											t.title
										)
									);
								}.bind(this))
							)
						),
						React.createElement(
							'div',
							{ className: 'uk-width-medium-9-10' },
							React.createElement(
								'ul',
								{ id: "tab-" + task.id, className: 'uk-switcher' },
								React.createElement(
									'li',
									{ className: this.state.tab == 'view' ? "uk-active" : '' },
									React.createElement(TaskTabView, { task: this.state.task })
								),
								React.createElement(
									'li',
									{ className: this.state.tab == 'edit' ? "uk-active" : '' },
									React.createElement(TaskTabEdit, { task: this.state.task })
								),
								React.createElement(
									'li',
									{ className: this.state.tab == 'log' ? "uk-active" : '' },
									React.createElement(TaskTabLog, { task: this.state.task })
								)
							)
						)
					)
				)
			)
		);
	}
});