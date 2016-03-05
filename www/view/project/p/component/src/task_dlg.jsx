
var TaskTabView = React.createClass({	
	render: function(){
		var task = this.props.task;
		var difficulties = [ '简单', '普通', '困难'];
		return ( 
			<div>
				<table className="uk-table dv-border">
					<tbody>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">任务名称：</td>
							<td className="uk-width-3-10">{task.name}</td>
							<td className="uk-width-2-10 uk-block-muted">工期(天)：</td>
							<td className="uk-width-3-10">{task.duration}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">执行人：</td>
							<td className="uk-width-3-10">{task.executor_name}</td>
							<td className="uk-width-2-10 uk-block-muted">工作审核人：</td>
							<td className="uk-width-3-10">{task.manager_name}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划模式：</td>
							<td className="uk-width-3-10">{task.automode ? '自动' : '手动'}</td>
							<td className="uk-width-2-10 uk-block-muted">任务难度：</td>
							<td className="uk-width-3-10">{ difficulties[task.difficulty]}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">开始时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.start_time) } </td>
							<td className="uk-width-2-10 uk-block-muted">计划开始时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_start_time)}</td>	
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">结束时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.end_time)}</td>
							<td className="uk-width-2-10 uk-block-muted">计划结束时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_end_time)}</td>
						</tr>
						<tr>
							<td className="uk-block-muted">任务说明:</td>
							<td colSpan="3" >{ task.details }</td>
						</tr>
					</tbody>
				</table>
			</div>
			)
	}
});

var TaskTabEdit = React.createClass({
	render: function(){
		return ( 
			<div></div>
			)
	}
});


var TaskTabLog = React.createClass({
	render: function(){
		return ( 
			<div></div>
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
	componentDidMount: function(){
		this.showModal();
	},
	componentDidUpdate:function(){
		this.showModal();
	},
	render: function(){
		var task = this.props.task;
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
										<TaskTabView task={task}/>
									</li>
									<li className={ this.state.tab == 'edit' ? "uk-active": '' }>
										<TaskTabEdit task={task}/>
									</li>
									<li className={ this.state.tab == 'log' ? "uk-active": '' }>
										<TaskTabLog task={task}/>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			);
	}
});
