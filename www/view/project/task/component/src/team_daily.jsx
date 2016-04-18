
var styles = {
	smallBottomMargin: {marginBottom:'2px'},
	toolbar: {marginTop:'20px'},
	tableBorder: { borderCollapse: 'collapse'}
};

var UserTaskDaily = React.createClass({
	handleViewTask: function(e){
		e.preventDefault();
		var task = this.props.task;
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={this.onTaskChanged} role="executor"/>,
				document.getElementById('modal_task_'+task.id)
			);
	},
	onTaskChanged: function(){
	},    
	render: function(){
		var t = this.props.task,
			daily = t.daily,
			org_plan = daily.org_plan || '未填写',
			plan = daily.plan || '未填写',
			report = daily.report || '未填写',
			marginTop = {marginTop:'40px'},
			marginLeft = {marginLeft:'0px', paddingTop:'10px'},
			nopadding = {padding:'0', maxWidth:'310px'},
			nopadding_plan = {padding:'0', maxWidth:'230px'},
			nomargin = {margin:'0', borderRadius:'0'},
			org_plan_cls = org_plan === '未填写' ? 'dv-pre-clear uk-text-muted': 'dv-pre-clear',
			report_cls = report === '未填写' ? 'dv-pre-clear uk-text-muted': 'dv-pre-clear',
			duration_cls = report === '未填写' ? 'uk-text-muted': '';
		return (
			<tr>
				<td className="dv-border">
					<a onClick={this.handleViewTask} className="uk-button-link dv-link">{t.name}</a>
					<div id={"modal_task_daily_"+t.id} className="uk-modal"></div>
					<div id={"modal_task_"+t.id} className="uk-modal"></div>
				</td>
				<td className="dv-width-7-20"> 
					<pre className={report_cls} style={nopadding}>{ report }</pre>
				</td>
				<td className="dv-width-5-20"><pre className={org_plan_cls} style={nopadding_plan}>{org_plan}</pre></td>
				<td>
					<div>项目：<a href={'/project/p/' + t.project_id + '/build'} className="dv-link">{t.project_name}</a></div>
					<div>审核人：{t.manager_name}</div>
					{
						daily.duration ? 
						<div>今日用时：<span className={duration_cls}>{daily.duration + '小时'}</span></div>
						:null
					}
				</td>
			</tr>
		)
	}
});

var DepTaskDaily = React.createClass({
	handleViewTask: function(e){
		e.preventDefault();
		var task = this.props.task;
		ReactDOM.render(
			<TaskDialog task={task} onTaskChanged={this.onTaskChanged} role="executor"/>,
				document.getElementById('modal_task_'+task.id)
			);
	},
	onTaskChanged: function(){
	},    
	render: function(){
		var t = this.props.task,
			daily = t.daily,
			org_plan = daily.org_plan || '未填写',
			plan = daily.plan || '未填写',
			report = daily.report || '未填写',
			marginTop = {marginTop:'40px'},
			marginLeft = {marginLeft:'0px', paddingTop:'10px'},
			nopadding = {padding:'0', maxWidth:'310px'},
			nopadding_plan = {padding:'0', maxWidth:'230px'},
			nomargin = {margin:'0', borderRadius:'0'},
			org_plan_cls = org_plan === '未填写' ? 'dv-pre-clear uk-text-muted': 'dv-pre-clear',
			report_cls = report === '未填写' ? 'dv-pre-clear uk-text-muted': 'dv-pre-clear',
			duration_cls = report === '未填写' ? 'uk-text-muted': '';
		return (
			<tr>
				<td>{t.executor_name}</td>
				<td className="dv-border">
					<a onClick={this.handleViewTask} className="uk-button-link dv-link">{t.name}</a>
					<div id={"modal_task_daily_"+t.id} className="uk-modal"></div>
					<div id={"modal_task_"+t.id} className="uk-modal"></div>
				</td>
				<td className="dv-border"> 
					<pre className={report_cls} style={nopadding}>{ report }</pre>
				</td>				
				<td className="dv-border"><pre className={org_plan_cls} style={nopadding_plan}>{org_plan}</pre></td>
				<td>
					<div>项目：<a href={'/project/p/' + t.project_id + '/build'} className="dv-link">{t.project_name}</a></div>
					<div>审核人：{t.manager_name}</div>
					{
						daily.duration ? 
						<div>今日用时：<span className={duration_cls}>{daily.duration + '小时'}</span></div>
						:null
					}					
				</td>
			</tr>
		)
	}
});

var DepartmentDaily = React.createClass({
	loadUserDaily: function(members, fromindex, dayTime){
		var uid = members[fromindex];
		getJSON( '/api/project/u/'+ uid+'/daily', {date:dayTime}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					var ts = this.state.tasks;
					ts = ts.concat(data)
					this.setState({tasks:ts});
					if( fromindex < members.length - 1){
						this.loadUserDaily(members, fromindex+1, dayTime);
					}
				}
			}.bind(this)
		);
	},
	loadData: function(users, dayTime){
		this.state.tasks.splice(0, this.state.tasks.length);
		this.loadUserDaily(users, 0, dayTime);
	},
	previous: function(){
		var day = new Date(this.state.dayTime);
		day.setDate(day.getDate()-1);
		var dayTime = day.getTime();
		this.setState({dayTime:dayTime});
		this.loadData(this.props.members,dayTime);
	},
	next: function(){
		var day = new Date(this.state.dayTime);
		day.setDate(day.getDate()+1);
		var dayTime = day.getTime();
		this.setState({dayTime:dayTime});
		this.loadData(this.props.members,dayTime);
	},
	onTimeChanged: function(event){
		var dayTime = toDateTime(event.target.value);
		this.setState({dayTime:dayTime});
		this.loadData(this.props.members,dayTime);
	},
	getInitialState: function() {
		return {dayTime:Date.now(), tasks:[]}
	},
	componentDidMount: function(){
		var datepicker = UIkit.datepicker(this.refs.time, {weekstart:0, format:'YYYY-MM-DD'});
		datepicker.on('change', this.onTimeChanged);
		this.loadData(this.props.members, this.state.dayTime);
	},
	componentWillReceiveProps: function(nextProps){
		if(nextProps.members !== this.props.members ){
			this.loadData(nextProps.members, this.state.dayTime);
		}
	},
	render: function(){
		var dateWidth = {width:'80px'},
			dep = this.props.deps[this.props.depid] || {};
		return (
			<div className="uk-width-1-1">
				<h2 className="uk-text-center"><b>{dep.name}的日志</b></h2>
				<div style={styles.toolbar}>
				<ul className="uk-pagination" style={styles.smallBottomMargin} >
					<li className="uk-pagination-previous">
						<a onClick={this.previous}><i className="uk-icon-angle-double-left"></i>前一天</a>
					</li>
					<li className="">
						<input type="text" name="time" ref="time" style={dateWidth} 
							value={formatDate(this.state.dayTime)} onChange={this.onTimeChanged}/>
					</li>
					<li className="uk-pagination-next">
						<a onClick={this.next}>后一天<i className="uk-icon-angle-double-right"></i></a>
					</li>
				</ul>
				</div>
				<hr className="dv-hr"/>
				<div className="uk-accordion">
					<table	className="uk-width-1-1 uk-table" style={styles.tableBorder} >
						<thead>
							<tr>
								<th className="dv-width-2-20">执行人</th>							
								<th className="dv-width-4-20">任务</th>
								<th className="dv-width-6-20">当日工作</th>
								<th className="dv-width-4-20">原计划</th>													
								<th className="dv-width-4-20">任务信息</th>
							</tr>
						</thead>
						<tbody>
						{
							this.state.tasks.map(function(t, n){
								return (
									<DepTaskDaily key={n} task={t} dayTime={this.state.dayTime} />
									)
							}.bind(this))
						}
						</tbody>
					</table>
					<div className={this.state.tasks.length>0?'uk-hidden':''}>无执行任务</div>
				</div>
			</div>
			)
	}
});



var UserDaily = React.createClass({
	// loadUser: function(uid){
	// 	getJSON( '/api/team/member/'+ uid, {}, function(err, data ){
	// 			if(err){
	// 				fatal(err);
	// 			}else{
	// 				this.setState({user:data});
	// 			}
	// 		}.bind(this)
	// 	);
	// },
	loadData: function(uid,dayTime){
		getJSON( '/api/project/u/'+ uid+'/daily', {date:dayTime}, function(err, data ){
				if(err){
					fatal(err);
				}else{                  
					this.setState({tasks:data});
					//this.loadUser(uid);
				}
			}.bind(this)
		);
	},
	previous: function(){
		var day = new Date(this.state.dayTime);
		day.setDate(day.getDate()-1);
		var dayTime = day.getTime();
		this.setState({dayTime:dayTime});
		this.loadData(this.props.uid,dayTime);
	},
	next: function(){
		var day = new Date(this.state.dayTime);
		day.setDate(day.getDate()+1);
		var dayTime = day.getTime();
		this.setState({dayTime:dayTime});
		this.loadData(this.props.uid,dayTime);
	},
	onTimeChanged: function(event){
		var dayTime = toDateTime(event.target.value);
		this.setState({dayTime:dayTime});
		this.loadData(this.props.uid,dayTime);
	},
	getInitialState: function() {
		return {dayTime:Date.now(), tasks:[]}
	},
	componentDidMount: function(){
		var datepicker = UIkit.datepicker(this.refs.time, {weekstart:0, format:'YYYY-MM-DD'});
		datepicker.on('change', this.onTimeChanged);
		this.loadData(this.props.uid, this.state.dayTime);
	},
	componentWillReceiveProps: function(nextProps){
		if(nextProps.uid !== this.props.uid ){
			this.loadData(nextProps.uid, this.state.dayTime);
		}
	},
	render: function(){
		var dateWidth = {width:'80px'},
			user = this.props.users[this.props.uid]||{};
		return (
			<div className="uk-width-1-1">
				<h2 className="uk-text-center"><b>{user.name}的日志</b></h2>
				<div style={styles.toolbar}>
				<ul className="uk-pagination" style={styles.smallBottomMargin} >
					<li className="uk-pagination-previous">
						<a onClick={this.previous}><i className="uk-icon-angle-double-left"></i>前一天</a>
					</li>
					<li className="">
						<input type="text" name="time" ref="time" style={dateWidth} 
							value={formatDate(this.state.dayTime)} onChange={this.onTimeChanged}/>
					</li>
					<li className="uk-pagination-next">
						<a onClick={this.next}>后一天<i className="uk-icon-angle-double-right"></i></a>
					</li>
				</ul>
				</div>
				<hr className="dv-hr"/>
				<div className="uk-accordion">
					<table	className="uk-width-1-1 uk-table" style={styles.tableBorder} >
						<thead>
							<tr>
								<th className="dv-width-4-20">任务</th>
								<th className="dv-width-7-20">当日工作</th>
								<th className="dv-width-5-20">原计划</th>
								<th className="dv-width-4-20">任务信息</th>
							</tr>
						</thead>
						<tbody>
						{
							this.state.tasks.map(function(t, n){
								return (
									<UserTaskDaily key={n} task={t} dayTime={this.state.dayTime} />
									)
							}.bind(this))
						}
						</tbody>
					</table>
					<div className={this.state.tasks.length>0?'uk-hidden':''}>无执行任务</div>
				</div>
			</div>
			)
	}
});


var TeamDaily = React.createClass({
	handleSelected: function(type, id, members){
		if( type === 'user'){
			this.setState({selectedType:'user', selectedItem:id})
		}else{//department
			this.setState({selectedType:'department', selectedItem:id, members:members})
		}
	},
	updateUserData: function(userMap){
		this.setState({UserMap:userMap});
	},
	updateDepData: function( depMap){
		this.setState({DepMap:depMap})
	},
	getInitialState: function(){
		return {selectedType:'user', selectedItem:ENV.user.id, members:[], UserMap:{}, DepMap:{}}
	},
	render: function(){
		var borderRight = { borderRight:'1px solid #ddd'};
		return (
			<div className="uk-grid">
				<div className="uk-width-2-10" style={borderRight}>
					<StructureTree onSelected={this.handleSelected} updateDepData={this.updateDepData} updateUserData={this.updateUserData}/>
				</div>
				<div className="uk-width-8-10">
				{
					this.state.selectedType === 'user'? 
					<UserDaily key={'UserDaily_' + this.state.selectedItem} uid={this.state.selectedItem} users={this.state.UserMap}/> :
					<DepartmentDaily key={'DepartmentDaily_' + this.state.selectedItem}  depid={this.state.selectedItem} members={this.state.members} 
						deps={this.state.DepMap} users={this.state.UserMap}/>
				}
					
				</div>
			</div>
			)
	}
});