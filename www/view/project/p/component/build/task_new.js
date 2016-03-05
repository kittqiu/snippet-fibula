'use strict';

var NewTaskDlg = React.createClass({
	displayName: 'NewTaskDlg',

	correctErrMsg: function correctErrMsg(err) {
		var error_msgs = {
			end_time: '请选择结束时间',
			master: '请选择项目负责人'
		};
		_.each(err, function (e, n) {
			if (error_msgs.hasOwnProperty(e.data) && !e.message) {
				e.message = options.error_msgs[e.data];
			}
		});
	},
	resetFields: function resetFields() {
		this.refs.name.value = "";
		this.refs.executor.value = this.props.users[0].id;
		this.refs.duration.value = 0;
		this.refs.automode.value = 0;
		this.refs.start_time.value = formatNow();
		this.refs.end_time.value = formatNow();
		this.refs.rely_to.value = "";
		this.refs.difficulty.value = 0;
		this.refs.details.value = "";
	},
	getPostData: function getPostData() {
		var name = this.refs.name.value.trim(),
		    executor = this.refs.executor.value,
		    duration = parseInt(this.refs.duration.value),
		    automode = parseInt(this.refs.automode.value),
		    start_time = this.refs.start_time.value || 0,
		    end_time = this.refs.end_time.value || 0,
		    rely_to = this.refs.rely_to.value.trim(),
		    difficulty = parseInt(this.refs.difficulty.value),
		    details = this.refs.details.value;

		var data = {
			name: name,
			parent: this.props.parent,
			executor: executor,
			duration: duration,
			start_time: toDateTime(start_time),
			automode: automode,
			end_time: toDateTime(end_time),
			rely_to: rely_to,
			difficulty: difficulty,
			details: details
		};
		//console.log(data)
		if (validateJsonObj('createTask', data)) {
			if (data.start_time > data.end_time) {
				throw { error: 'invalid parameter', data: 'end_time', message: "结束时间应该大于开始时间" };
			}
			if (data.automode == 0 && !data.rely_to) {
				throw { error: 'invalid parameter', data: 'rely_to', message: "计划模式为自动时，需要设置依赖任务" };
			}
			if (!/^[0-9\,]{0,50}$/.test(data.rely_to)) {
				throw { error: 'invalid parameter', data: 'rely_to', message: "依赖的任务只可输入整数与英文逗号" };
			}
			return data;
		}
	},
	handleSubmit: function handleSubmit(e) {
		e.preventDefault();
		var data,
		    form = $('#modal_new_task').find('form');
		try {
			data = this.getPostData();
			form.showFormError(); //clear error tip
		} catch (e) {
			this.correctErrMsg(e);
			form.showFormError(e);
			return;
		}
		form.postJSON('/api/project/p/{{__id}}/task', data, function (err, result) {
			if (!err) {
				var modal = UIkit.modal("#modal_new_task");
				modal.hide();
				this.resetFields();
				this.props.onNewTask(result.id);
			}
		}.bind(this));
	},
	render: function render() {
		var textarea_height = { height: "60px" };
		return React.createElement(
			'div',
			{ id: 'modal_new_task', className: 'uk-modal uk-text-left' },
			React.createElement(
				'div',
				{ className: 'uk-modal-dialog' },
				React.createElement('a', { href: '', className: 'uk-modal-close uk-close uk-close-alt' }),
				React.createElement(
					'div',
					{ className: 'uk-modal-header ' },
					React.createElement(
						'h2',
						null,
						'创建新任务'
					)
				),
				React.createElement(
					'div',
					null,
					React.createElement(
						'form',
						{ className: 'uk-form uk-form-stacked uk-form-horizontal' },
						React.createElement(
							'fieldset',
							null,
							React.createElement('div', { className: 'uk-alert uk-alert-danger uk-hidden' }),
							React.createElement(
								'div',
								{ className: 'uk-form-row uk-width-2-3' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'名称'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls' },
									React.createElement('input', { name: 'name', type: 'text', ref: 'name', className: 'uk-width-1-1', autofucus: true, placeholder: '3-50字符', defaultValue: '', maxLength: '50' })
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row uk-width-2-3' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'父任务'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls' },
									React.createElement(
										'span',
										null,
										this.props.parent == 'root' ? '无' : this.props.TaskMap[this.props.parent].name
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'负责人'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement(
										'select',
										{ name: 'executor', ref: 'executor', className: 'uk-width-1-1' },
										this.props.users.map(function (u) {
											return React.createElement(
												'option',
												{ key: u.id, value: u.id },
												u.name
											);
										})
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'工期（小时）'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement('input', { type: 'number', name: 'duration', ref: 'duration', placeholder: '填入整数', defaultValue: '0' })
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'计划模式'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement(
										'select',
										{ name: 'automode', ref: 'automode', className: 'uk-width-1-1' },
										React.createElement(
											'option',
											{ value: '0' },
											'自动'
										),
										React.createElement(
											'option',
											{ value: '1' },
											'手动'
										)
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'开始时间'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement(
										'div',
										{ className: 'uk-form-icon' },
										React.createElement('i', { className: 'uk-icon-calendar' }),
										React.createElement('input', { type: 'text', name: 'start_time', ref: 'start_time', 'data-uk-datepicker': '{weekstart:0, format:\'YYYY-MM-DD\'}', defaultValue: formatNow() })
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'结束时间'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement(
										'div',
										{ className: 'uk-form-icon' },
										React.createElement('i', { className: 'uk-icon-calendar' }),
										React.createElement('input', { type: 'text', name: 'end_time', ref: 'end_time', 'data-uk-datepicker': '{weekstart:0, format:\'YYYY-MM-DD\'}', defaultValue: formatNow() })
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row uk-width-1-1' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'前置任务'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement('input', { type: 'text', name: 'rely_to', ref: 'rely_to', placeholder: '填写标识，用逗号分隔' })
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'任务难度'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls uk-width-1-3' },
									React.createElement(
										'select',
										{ name: 'difficulty', ref: 'difficulty', className: 'uk-width-1-1' },
										React.createElement(
											'option',
											{ value: '0' },
											'简单'
										),
										React.createElement(
											'option',
											{ value: '1' },
											'普通'
										),
										React.createElement(
											'option',
											{ value: '2' },
											'困难'
										)
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'uk-form-row uk-width-1-1' },
								React.createElement(
									'label',
									{ className: 'uk-form-label' },
									'任务说明'
								),
								React.createElement(
									'div',
									{ className: 'uk-form-controls' },
									React.createElement('textarea', { ref: 'details', name: 'details', className: 'uk-width-2-3', style: textarea_height, placeholder: '可暂时不填' })
								)
							)
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'uk-modal-footer uk-text-right' },
					React.createElement(
						'button',
						{ type: 'button', onClick: this.handleSubmit, className: 'uk-button uk-button-primary' },
						'保存'
					)
				)
			)
		);
	}
});