var listeners = [];
function noticeTaskChanged(newtask){
	for(var i = 0; i < listeners.length; i++ ){
		listeners[i].onTaskChanged(newtask);
	}
}

var ManageHistoryList = React.createClass({
	handleView: function(task, e){
		e.preventDefault();
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged} role="manager" />,
				document.getElementById('modal_task_'+task.id)
			);
	},
	loadTasks: function(){
		getJSON( '/api/project/t/history/listManage', {uid:ENV.user.id, page:this.props.page}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({tasks:data.tasks, page:data.page, pagelist: data.page.list});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {page:{}, pagelist:[], tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
	},
	render: function(){
		var page = this.state.page,
			left = page.index == 1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-left"></i></span></li> 
				: <li><a href={"?page=" + (page.index-1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-left"></i></a></li>,
			right = page.index == Math.floor(page.total/page.size)+1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-right"></i></span></li> 
				: <li><a href={"?page=" + (page.index+1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-right"></i></a></li>;
		
		return (
			<div className="uk-width-1-1">		
				<table className={this.state.tasks.length>0?'uk-table':'uk-hidden'}>
					<thead>
						<tr>
							<th className="uk-width-2-10">任务名称</th>
							<th className="uk-width-1-10">任务状态</th>
							<th className="uk-width-1-10">任务执行人</th>
							<th className="uk-width-1-10">开始时间</th>
							<th className="uk-width-1-10">结束时间</th>
							<th className="uk-width-1-10">用时</th>
							<th className="uk-width-1-10">所属的项目</th>						
						</tr>
					</thead>
					<tbody>
						{
							this.state.tasks.map(function(t, index){
								var statusCls = { completed: '', cancel: 'uk-text-warning' };
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td><span className={statusCls[t.status]}>{taskStatusMap[t.status]}</span></td>
										<td>{t.executor_name}</td>
										<td>{formatDate(t.start_time)}</td>
										<td>{formatDate(t.end_time)}</td>
										<td>{t.duration}小时</td>									
										<td><a className="dv-link" href={'/project/p/'+t.project_id+'/build'}>{t.project_name}</a></td>
									</tr>
									)
							}.bind(this))
						}
					</tbody>
				</table>
				<div className={this.state.tasks.length>0?'uk-hidden':''}>无记录</div>
				<div className={this.state.page.pages>1?'uk-text-center':'uk-hidden'}>
					<ul className="uk-pagination">
						{ left }
						{
							this.state.pagelist.map(function(i, index){
								if( i === '...' ){
									return <li key={index} className="uk-disabled"><span>...</span></li>
								}else if( i == page.index ){
									return <li key={index} className="uk-active"><span>{i}</span></li>
								}else{
									return <li key={index}><a href={"?page=" + i + '&uid=' + ENV.user.id}>{ i }</a></li>
								}
							}.bind(this))
						}
						{ right }
					</ul>
				</div>
			</div>
			)
	}
});

var ExecuteHistoryList = React.createClass({
	handleView: function(task, e){
		e.preventDefault();
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={noticeTaskChanged} role="executor"/>,
				document.getElementById('modal_task_'+task.id)
			);
	},
	loadTasks: function(){
		getJSON( '/api/project/t/history/listCompleted', {uid:ENV.user.id, page:this.props.page}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({tasks:data.tasks, page:data.page, pagelist: data.page.list});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return {page:{}, pagelist:[],tasks:[]}
	},
	componentWillMount: function(){
		this.loadTasks();
	},
	render: function(){
		var page = this.state.page,
			left = page.index == 1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-left"></i></span></li> 
				: <li><a href={"?page=" + (page.index-1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-left"></i></a></li>,
			right = page.index == Math.floor(page.total/page.size)+1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-right"></i></span></li> 
				: <li><a href={"?page=" + (page.index+1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-right"></i></a></li>;
		return (
			<div className="uk-width-1-1">				
				<table className={this.state.tasks.length>0?'uk-table':'uk-hidden'}>
					<thead>
						<tr>
							<th className="uk-width-2-10">任务名称</th>
							<th className="uk-width-1-10">任务状态</th>
							<th className="uk-width-1-10">开始时间</th>
							<th className="uk-width-1-10">结束时间</th>
							<th className="uk-width-1-10">任务审核人</th>
							<th className="uk-width-1-10">用时</th>
							<th className="uk-width-1-10">所属的项目</th>						
						</tr>
					</thead>
					<tbody>
						{
							this.state.tasks.map(function(t, index){
								var statusCls = { commit: '', cancel: 'uk-text-warning' };
								return (
									<tr key={t.id}>
										<td><a className="dv-link" onClick={this.handleView.bind(this, t)}>{t.name}</a>
											<div id={"modal_task_"+t.id} className="uk-modal">
											</div>
										</td>
										<td><span className={statusCls[t.status]}>{taskStatusMap[t.status]}</span></td>
										<td>{formatDate(t.start_time)}</td>
										<td>{formatDate(t.end_time)}</td>
										<td>{t.manager_name}</td>
										<td>{t.duration}小时</td>
										<td><a className="dv-link" href={'/project/p/'+t.project_id+'/build'}>{t.project_name}</a></td>
									</tr>
									)
							}.bind(this))
						}
					</tbody>
				</table>
				<div className={this.state.tasks.length>0?'uk-hidden':''}>无记录</div>
				<div className={this.state.page.pages>1?'uk-text-center':'uk-hidden'}>
					<ul className="uk-pagination">
						{ left }
						{
							this.state.pagelist.map(function(i, index){
								if( i === '...' ){
									return <li key={index} className="uk-disabled"><span>...</span></li>
								}else if( i == page.index ){
									return <li key={index} className="uk-active"><span>{i}</span></li>
								}else{
									return <li key={index}><a href={"?page=" + i + '&uid=' + ENV.user.id}>{ i }</a></li>
								}
							}.bind(this))
						}
						{ right }
					</ul>
				</div>
			</div>
			)
	}
});

var MyManageHistory = React.createClass({
	render: function(){
		return (
			<div className="uk-width-1-1">
				<h1 className="uk-text-center"><b>历史管理的任务</b></h1>
				<hr className="dv-hr"/>
				<ManageHistoryList page={this.props.page}/>
			</div>
			)
	}
});

var MyExecuteHistory = React.createClass({
	render: function(){
		return (
			<div className="uk-width-1-1">
				<h1 className="uk-text-center"><b>历史完成的任务</b></h1>
				<hr className="dv-hr"/>
				<ExecuteHistoryList page={this.props.page}/>
			</div>
			)
	}
});
