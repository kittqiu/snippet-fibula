
var styles = {
	smallBottomMargin: {marginBottom:'2px'},
	toolbar: {marginTop:'20px'},
	tableBorder: { borderCollapse: 'collapse'}
};

var ProjectTaskDaily = React.createClass({
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
	onUpdate: function(){
		this.setState({updateCnt:this.state.updateCnt+1})
	},
	getInitialState:function() {
		return {updateCnt:0}     
	},     
	render: function(){
		var t = this.props.task,
			daily = t.daily,
			org_plan = daily.org_plan || '未填写',
			plan = daily.plan || '未填写',
			report = daily.report || '未填写',
			marginTop = {marginTop:'40px'},
			marginLeft = {marginLeft:'0px', paddingTop:'10px'},
			nopadding = {padding:'0'},
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
				<td>{t.executor_name}</td>
				<td>{t.manager_name}</td>
				<td className="dv-border"><pre className={org_plan_cls} style={nopadding}>{org_plan}</pre></td>
				<td className="dv-border"> 
					<pre className={report_cls} style={nopadding}>{ report }</pre>
				</td>
				<td className={duration_cls}>
					{daily.duration ? (daily.duration + '小时') : '0'}
				</td>
			</tr>
		)
	}
});

var ProjectDaily = React.createClass({
	loadData: function(dayTime){
		getJSON( '/api/project/p/'+ this.props.pid, {}, function(err, data ){
				if(err){
					fatal(err);
				}else{                  
					this.setState({project:data});
				}
			}.bind(this)
		);
		getJSON( '/api/project/p/'+ this.props.pid + '/daily', {date:dayTime}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({tasks:data});
				}
			}.bind(this)
		);
	},
	previous: function(){
		var day = new Date(this.state.dayTime);
		day.setDate(day.getDate()-1);
		var dayTime = day.getTime();
		this.setState({dayTime:dayTime});
		this.loadData(dayTime);
	},
	next: function(){
		var day = new Date(this.state.dayTime);
		day.setDate(day.getDate()+1);
		var dayTime = day.getTime();
		this.setState({dayTime:dayTime});
		this.loadData(dayTime);
	},
	onTimeChanged: function(event){
		var dayTime = toDateTime(event.target.value);
		this.setState({dayTime:dayTime});
		this.loadData(dayTime);
	},
	getInitialState: function() {
		return {dayTime:Date.now(), tasks:[], project:{}}
	},
	componentDidMount: function(){
		var datepicker = UIkit.datepicker(this.refs.time, {weekstart:0, format:'YYYY-MM-DD'});
		datepicker.on('change', this.onTimeChanged);
		this.loadData(this.state.dayTime);
	},
	render: function(){
		var dateWidth = {width:'80px'};
		return (
			<div className="uk-width-1-1">
				<h2 className="uk-text-center"><b>项目进展日志：{this.state.project.name}</b></h2>
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
								<th className="uk-width-2-10">任务</th>
								<th className="uk-width-1-10">执行人</th>
								<th className="uk-width-1-10">审核人</th>
								<th className="uk-width-2-10">当日计划</th>
								<th className="uk-width-3-10">当日工作</th>
								<th className="uk-width-1-10">工作用时</th>					
							</tr>
						</thead>
						<tbody>
						{
							this.state.tasks.map(function(t, n){
								return (
									<ProjectTaskDaily key={n} task={t} dayTime={this.state.dayTime} />
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