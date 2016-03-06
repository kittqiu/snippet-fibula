
var TaskTabView = React.createClass({	
	render: function(){
		var task = this.props.task,
			difficulties = this.props.difficulties;
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
							<td className="uk-width-3-10">{task.automode ===0 ? '自动' : '手动'}</td>
							<td className="uk-width-2-10 uk-block-muted">任务难度：</td>
							<td className="uk-width-3-10">{ difficulties[task.difficulty]}</td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划开始时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_start_time)}</td>
							<td className="uk-width-2-10 uk-block-muted">开始时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.start_time) } </td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划结束时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_end_time)}</td>
							<td className="uk-width-2-10 uk-block-muted">结束时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.end_time)}</td>
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
	correctErrMsg: function(err){
		console.log(err);
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
	getPostData: function(){
		var start_time = this.refs.plan_start_time.value||0,
			end_time = this.refs.plan_end_time.value||0;
		
		var data = {
			name: this.refs.name.value.trim(),
			executor_id: this.refs.executor.value,
			manager_id: this.refs.manager.value,
			duration: parseInt(this.refs.duration.value),
			plan_start_time: toDateTime(start_time),
			automode: parseInt(this.refs.automode.value),
			plan_end_time: toDateTime(end_time),
			difficulty: parseInt(this.refs.difficulty.value),
			details: this.refs.details.value
		};
		console.log(data)
		if(validateJsonObj('editTask', data)){
			if(data.start_time > data.end_time){
				throw  { error:'invalid parameter', data:'end_time', message:"结束时间应该大于开始时间"}; 
			}
			// if( data.automode == 0 && !data.rely_to){
			// 	throw { error:'invalid parameter', data:'rely_to', message:"计划模式为自动时，需要设置依赖任务"}
			// }
			// if( !/^[0-9\,]{0,50}$/.test(data.rely_to)){
			// 	throw { error:'invalid parameter', data:'rely_to', message:"依赖的任务只可输入整数与英文逗号"}
			// }
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
					project = this.props.project;
				task.name = data.name;
				task.plan_start_time = data.plan_start_time;
				task.plan_end_time = data.plan_end_time;
				task.automode = data.automode;
				task.duration = data.duration;
				task.difficulty = data.difficulty;
				task.details = data.details;
				task.executor_id= data.executor_id;
				task.manager_id= data.manager_id;
				task.executor_name= project.UserMap[data.executor_id].name;
				task.manager_name= project.UserMap[data.manager_id].name;

				this.props.hideModal();
				this.props.onTaskChanged();
			}
		}.bind(this));

	},
	render: function(){
		var task = this.props.task,
			difficulties = this.props.difficulties,
			textarea_height = { height: "60px"};

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
								<td className="uk-width-2-10 uk-block-muted">工期(小时)：</td>
								<td className="uk-width-3-10">
									<input type="number" max="256" name="duration" ref="duration" className="uk-width-1-1" placeholder="填入整数" defaultValue={task.duration}/>
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
									<select name="automode" ref="automode" className="uk-width-1-1" defaultValue={task.automode}>
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
										<input type="text" name="plan_start_time" className="uk-width-1-1" ref="plan_start_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}" defaultValue={formatDate(task.plan_start_time)}/>
									</div>
								</td>
								<td className="uk-width-2-10 uk-block-muted">实际开始时间：</td>
								<td className="uk-width-3-10">{ formatDate(task.start_time) }</td>								
							</tr>
							<tr>
								<td className="uk-width-2-10 uk-block-muted">计划结束时间：</td>
								<td className="uk-width-3-10">
									<div className="uk-form-icon uk-width-1-1">
										<i className="uk-icon-calendar"></i>
										<input type="text" name="plan_end_time" className="uk-width-1-1" ref="plan_end_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}" defaultValue={formatDate(task.plan_end_time)}/>
									</div>
								</td>						
								<td className="uk-width-2-10 uk-block-muted">实际结束时间：</td>
								<td className="uk-width-3-10">{ formatDate(task.end_time)}</td>
							</tr>	
							<tr>
								<td className="uk-block-muted">任务说明:</td>
								<td colSpan="3" >
									<textarea ref="details" name="details" className="uk-width-1-1" style={textarea_height} defautValue={ task.details }>
												</textarea>
								</td>
							</tr>							
						</tbody>
					</table>
					<div className="uk-modal-footer uk-text-right">
						<button type="submit" className="uk-button uk-button-primary">保存</button>
					</div>
				</form>
			</div>
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
										<TaskTabView task={task} difficulties={difficulties}/>
									</li>
									<li className={ this.state.tab == 'edit' ? "uk-active": '' }>
										<TaskTabEdit task={task} difficulties={difficulties} project={this.props.project} hideModal={this.hideModal} onTaskChanged={this.props.onTaskChanged}/>
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
