var taskStatusMap = {
	created: '待需求确认',
	clear: '待接收执行',
	doing: '正在执行',
	pending: '已暂停执行',
	cancel: '已取消', 
	commit: '已提交',
	completed: '已完成'
};

function taskIsInPlan(task){
	if( task.status === 'created' || task.status === 'clear'){
		return true;
	}
	return false;
}

function taskIsInDoing(task){
	if( task.status === 'doing' || task.status === 'commit' || task.status === 'pending'){
		return true;
	}
	return false;
}

var TaskInfo = React.createClass({
	render: function(){
		var task = this.props.task;
		var difficulties = [ '简单', '普通', '困难'];
		return (
			<div>
				<h2>基本信息</h2>
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
							<td className="uk-width-3-10">{ task.start_time===0?'无':formatDate(task.start_time) } </td>
						</tr>
						<tr>
							<td className="uk-width-2-10 uk-block-muted">计划结束时间：</td>
							<td className="uk-width-3-10">{ formatDate(task.plan_end_time)}</td>
							<td className="uk-width-2-10 uk-block-muted">实际结束时间：</td>
							<td className="uk-width-3-10">{ task.end_time===0?'无':formatDate(task.end_time)}</td>
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

var ActionOnStatus = {
	created: {
		executor: ['reply'],
		manager: ['confirm', 'reply', 'cancel']
	},
	clear: {
		executor: ['accept', 'reply'],
		manager: ['reply', 'cancel']
	},/*
	understood: {
		executor: ['accept', 'reply'],
		manager: ['reply', 'cancel']
	},*/
	doing: {
		executor: ['commit', 'reply'],
		manager: ['reply', 'pause', 'cancel']
	},
	commit: {
		executor: ['reply'],
		manager: ['complete', 'reopen', 'reply']
	},
	pending: {
		executor: ['reply'],
		manager: ['resume', 'cancel', 'reply']
	},
	cancel: {
		executor: ['reply'],
		manager: ['reply']
	},
	completed: {
		executor: ['reply'],
		manager: ['reply']
	}
};
var ACTIONMAP = {
	confirm: '确认要求',
	understand: '已理解要求',
	accept: '接收任务',
	reply: '回复',
	commit: '提交',
	pause: '暂停执行',
	cancel: '取消任务',
	complete: '完成',
	reopen: '继续执行',
	resume: '恢复执行'
};

var TaskFlow = React.createClass({
	loadFlow: function(){
		getJSON( '/api/project/t/'+ this.props.task.id+'/listFlow', function(err, data ){
				if(err){
					fatal(err);
				}else{					
					this.setState({flows:data});
				}
			}.bind(this)
		);
	},
	changeAction: function(event){
		this.setState({actionType:event.target.value})
	},
	getPostData: function(){
		var data = {
			action: this.state.actionType,
			reply: this.refs.reply.value || ''
		}
		if( data.action !== 'accept' && data.reply.length === 0){
			throw {error:'invalid parameter', data:'reply', message:"请填写必要的备注说明，如原因或提交信息"}
		}
		return data;
	},
	handleSubmitFlow: function(e){
		e.preventDefault();		
		var tid = this.props.task.id,
			formid = 'form-flow-'+ tid,
			data,
			form = $('#'+formid).find('form');
		try{
			data = this.getPostData();
			form.showFormError();//clear error tip
		}catch(e){
			form.showFormError(e);
			return;
		}
		form.postJSON( '/api/project/t/' + tid + '/flow', data, function(err, result){
			if( !err ){
				this.resetFields();
				this.loadFlow();
				getJSON( '/api/project/task/'+ tid, function(err, data ){
					this.setState({actionType:'reply'})	
					if( !err && this.props.task.status !== data.status ){
						this.props.task.status = data.status;
						this.setState({myUpdatedCnt:this.state.myUpdatedCnt+1})
						this.props.resetDialog(data);
					}
				}.bind(this));
			}
		}.bind(this));
	},
	resetFields: function(){
		this.refs.reply.value = '';
	},
	haveFlow: function(type){
		var flows = this.state.flows;
		for(var i = 0; i < flows.length; i++ ){
			if( flows[i].action === type ){
				return true;
			}
		}
		return false;
	},
	getFlowProgressClass: function(){
		var progresses = ['confirm', 'accept', 'do', 'commit', 'complete', 'cancel'],
			cls = {}, task = this.props.task;
		for(var i = 0;i <progresses.length; i++){
			cls[progresses[i]] = 'dv-badge-muted';
		}
		cls['cancel'] = 'uk-hidden';
		if( this.haveFlow('confirm') ){
			cls['confirm'] = 'uk-badge-success';
		}else if(task.status === 'created'){
			cls['confirm'] = 'uk-badge-warning';
		}
		if( this.haveFlow('accept') ){
			cls['accept'] = 'uk-badge-success';
		}else if(task.status === 'clear'){
			cls['accept'] = 'uk-badge-warning';
		}

		if( task.status === 'doing'){
			cls['do'] = 'uk-badge-warning';
		}else if( this.haveFlow('commit') ){
			cls['do'] = 'uk-badge-success';
		}
		if(task.status === 'commit'){
			cls['commit'] = 'uk-badge-warning';
		}else if( this.haveFlow('commit') && task.status !== 'doing' ){
			cls['commit'] = 'uk-badge-success';
		}
		if(task.status === 'completed'){
			cls['complete'] = 'uk-badge-success';
		}
		if(task.status === 'cancel'){
			cls['cancel'] = 'uk-badge uk-badge-danger';
		}
		return cls;
	},
	getInitialState: function() {
		return {flows:[], actionType:'reply', myUpdatedCnt:0}
	},
	componentDidMount: function(){
		this.loadFlow();
	},
	render: function(){
		var task = this.props.task,
			role = this.props.role || 'all',
			actions = [], i, radios = [],
			marginRadio = { marginLeft: '15px'},
			marginSpan = { marginLeft: '5px'},
			nopadding = { padding: '0'},
			textarea_height = { height: "60px"},
			cls = this.getFlowProgressClass();

		if( (role==='executor'|| role==='all') && task.executor_id === ENV.user.id ){
			actions = actions.concat( ActionOnStatus[task.status].executor );
		}
		if( task.manager_id === ENV.user.id && (role==='manager'|| role==='all') ){
			var list = ActionOnStatus[task.status].manager;
			for( i = 0; i < list.length; i++){
				if( actions.indexOf(list[i])===-1){
					actions.push(list[i]);
				}
			}
		}
		if(actions.length === 0){
			actions.push( 'reply' );
		}
		for( i = 0; i < actions.length; i++){
			var a = actions[i];				
			radios.push( <label key={i} style={marginRadio}><input type="radio" checked={this.state.actionType===a} onChange={this.changeAction} name="action" key={a} value={a} />{ACTIONMAP[a]}</label> )
		}

		return (
			<div>
				<h2>工作流</h2>
				<div>
					<span className="uk-badge uk-badge-success" style={marginSpan}>创建</span>
					<span className={ 'uk-badge ' + cls['confirm'] } style={marginSpan}>确认需求</span>
					<span className={ 'uk-badge ' + cls['accept'] } style={marginSpan}>接收</span>
					<span className={ 'uk-badge ' + cls['do'] } style={marginSpan}>执行</span>
					<span className={ 'uk-badge ' + cls['commit'] } style={marginSpan}>提交</span>
					<span className={ 'uk-badge ' + cls['complete'] } style={marginSpan}>完成</span>
					<span className={ cls['cancel'] } style={marginSpan}>取消</span>
				</div>
				<table className={"uk-table" + (this.state.flows.length === 0?' uk-hidden':'')}>
					<thead>
						<tr>
							<th className="uk-width-1-10">序号</th>
							<th className="uk-width-1-10">操作</th>
							<th className="uk-width-1-10">用户</th>
							<th className="uk-width-2-10">时间</th>
							<th className="uk-width-5-10">回复信息</th>	
						</tr>
					</thead>
					<tbody>
						{
							this.state.flows.map(function(f, index){
								return (
									<tr key={index}>
										<td>{index}</td>
										<td>{ACTIONMAP[f.action]}</td>
										<td>{f.user_name}</td>
										<td>{formatDate(f.created_at)}</td>
										<td><pre className="dv-pre-clear" style={nopadding}>{f.reply}</pre></td>
									</tr>
									)
							}.bind(this))
						}
					</tbody>
				</table>
				<div id={'form-flow-'+task.id}>
					<form onSubmit={this.handleSubmitFlow} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<legend>追加工作流</legend>
							<div className="uk-form-row">
								<label className="uk-form-label">选择操作类型：</label>
								<div className="uk-form-controls uk-form-controls-text">
								{ radios }
								</div>
							</div>
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">备注说明：</label>
								<div className="uk-form-controls">
									<textarea ref="reply" name="reply" className="uk-width-2-3" style={textarea_height} placeholder="">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row uk-width-2-3 uk-text-center">
								<button type="submit" className="uk-button uk-button-primary">提交</button>
							</div>
						</fieldset>
					</form>
				</div>				
			</div>
			)
	}
});

var TaskDailyList = React.createClass({
	loadFlow: function(){
		getJSON( '/api/project/t/'+ this.props.task.id+'/daily', function(err, data ){
				if(err){
					fatal(err);
				}else{					
					this.setState({daily:data});
				}
			}.bind(this)
		);
	},
	componentWillMount: function(){
		this.loadFlow();
	},
	getInitialState: function(){
		return {daily:[]}
	},
	render: function(){
		return (
			<div>
				<h2>进展日志</h2>
				<table className="uk-width-1-1 uk-table">
					<thead>
						<tr>
							<th className="uk-width-1-10">时间</th>
							<th className="uk-width-1-10">执行人</th>
							<th className="uk-width-1-10">用时</th>
							<th className="uk-width-4-10">当日工作</th>
							<th className="uk-width-3-10">明日计划</th>					
						</tr>
					</thead>
					<tbody>
						{ 
							this.state.daily.map(function(d, index){
							return (
								<tr key={index}>
									<td>{formatDate(d.time,true)}</td>
									<td>{d.user_name}</td>
									<td>{d.duration}小时</td>
									<td><pre className="dv-pre-clear">{d.report}</pre></td>
									<td><pre className="dv-pre-clear">{d.plan}</pre></td>
								</tr>
								)
							}.bind(this))
						}
						<tr className={this.state.daily.length>0?'uk-hidden':''}><td colSpan="5">无记录</td></tr>				
					</tbody>
				</table>
			</div>
			)
	}
});

var TaskDialog = React.createClass({
	showModal: function(){
		if( this.props.task ){
			var id = "modal_task_"+this.props.task.id;
			var modal = new UIkit.modal('#'+id);
			modal.show();
		}		
	},
	hideModel: function(){
		if( this.props.task ){
			var id = "modal_task_"+this.props.task.id;
			var modal = new UIkit.modal('#'+id);
			modal.hide();
		}
	},
	reset: function(newtask){
		if( this.props.task ){
			// var id = "modal_task_"+this.props.task.id;
			// var modal = new UIkit.modal('#'+id);
			// modal.on({
			//  	'hide.uk.modal': function(e){
			//  		this.props.onTaskChanged(newtask);
			//  	}.bind(this)
			//  });
			// modal.hide();
			this.props.onTaskChanged(newtask);
			this.setState({updatedCnt:this.updatedCnt+1})
		}		
	},
	componentDidMount: function(){
		this.showModal();
	},
	componentDidUpdate:function(){
		this.showModal();
	},
	getInitialData: function(){
		return {updatedCnt:0};
	},
	render: function(){
		var task = this.props.task;
		var marginTop = {marginTop:'50px'}

		return (
			<div className="uk-modal-dialog uk-modal-dialog-large">
					<a href="#" className="uk-modal-close uk-close uk-close-alt"></a>
					<div className="uk-modal-header"><h2>任务：{task.name}</h2></div>					
					<div>
						<TaskInfo task={task}/>
						<div style={marginTop}/>
						<TaskFlow task={task} onTaskChanged={this.props.onTaskChanged} resetDialog={this.reset}
							role={this.props.role}/>
						<div style={marginTop}/>
						<TaskDailyList task={task}/>
					</div>
				</div>
			)
	}
});