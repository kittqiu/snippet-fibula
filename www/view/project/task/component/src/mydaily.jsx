
var styles = {
	smallBottomMargin: {marginBottom:'2px'},
	toolbar: {marginTop:'20px'},
	areaHeight: { height: '60px'},
	tableBorder: { borderCollapse: 'collapse'}
};

var ReportDialog = React.createClass({
	showModal: function(){
		if( this.props.task ){
			var id = "modal_task_daily_"+this.props.task.id;
			var modal = new UIkit.modal('#'+id);
			modal.show();
		}		
	},
	hideModel: function(){
		if( this.props.task ){
			var id = "modal_task_daily_"+this.props.task.id;
			var modal = new UIkit.modal('#'+id);
			modal.hide();
		}
	},
	handleSubmit: function(e){
		e.preventDefault();		
		var task = this.props.task,
			tid = task.id,
			daily = task.daily,
			formid = 'form-daily-'+ tid,
			form = $('#'+formid).find('form'),
			percent = parseInt(this.refs.percent.value),
			data = {
				task_id: tid,
				duration: parseInt(this.refs.duration.value),
				report: this.refs.report.value,
				plan: this.refs.plan.value,
				time: this.props.dayTime,
				percent: (percent > 100? 100:(percent<0?0:percent))
			},
			url = '/api/project/daily/' + (daily.id? daily.id: 'creation');
		//console.log(data);
		form.postJSON( url, data, function(err, result){
			if( !err ){
				if( !daily.id ){
					daily.id = result.id;
					daily.task_id = task.id;
					daily.time = data.time;
				}				
				daily.report = data.report;
				daily.plan = data.plan;
				daily.duration = data.duration;
				this.props.onUpdate();
				this.hideModel();
			}
		}.bind(this));
	},
	componentDidMount: function(){
		this.showModal();
	},
	componentDidUpdate:function(){
		this.showModal();
	},
	render: function(){
		var task = this.props.task,
			daily = task.daily,
			plan = daily.plan || '',
			report = daily.report || '',
			duration= daily.duration || 0;
		return (
			<div className="uk-modal-dialog">
				<a href="#" className="uk-modal-close uk-close uk-close-alt"></a>
				<div className="uk-modal-header"><h2>修改任务日志：{task.name}</h2></div>					
				<div id={'form-daily-'+task.id}>
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row">
								<label className="uk-form-label">今日工作：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="report" name="report" defaultValue={report} className="uk-width-1-1" style={styles.areaHeight} placeholder="填写今日工作">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">今日用时：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<input type="number" name="duration" ref="duration" defaultValue={duration} className="uk-width-1-3" min="0"/>小时
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">总计进度：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<input type="number" name="percent" ref="percent" defaultValue={task.percent} className="uk-width-1-3" min="0" max="100"/>%
								</div>
							</div>
							<div className="uk-form-row uk-width-1-1">
								<label className="uk-form-label">明日计划：</label>
								<div className="uk-form-controls">
									<textarea ref="plan" name="plan" defaultValue={plan} className="uk-width-1-1" style={styles.areaHeight} placeholder="填写明日计划工作">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row uk-width-1-1 uk-text-center">
								<button type="submit" className="uk-button uk-button-primary">提交</button>
							</div>
						</fieldset>
					</form>
				</div>
			</div>
			)
	}
});

var TaskDaily = React.createClass({
	handleEdit: function(e){
		e.preventDefault();
		var task = this.props.task;
		ReactDOM.render(
			<ReportDialog task={task} dayTime={this.props.dayTime} onUpdate={this.onUpdate}/>,
				document.getElementById('modal_task_daily_'+task.id)
			);
	},
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
			nopadding = {padding:'0', maxWidth:'310px'},
			nopadding_plan = {padding:'0', maxWidth:'230px'},
			nomargin = {margin:'0', borderRadius:'0'};
		return (
		    <tr>
		        <td className="dv-border">
                    <a onClick={this.handleViewTask} className="uk-button-link dv-link">{t.name}</a>
                    <div id={"modal_task_daily_"+t.id} className="uk-modal"></div>
                    <div id={"modal_task_"+t.id} className="uk-modal"></div>
                </td>
                <td className="dv-border"><pre className="dv-pre-clear" style={nopadding_plan}>{org_plan}</pre></td>
                <td className="dv-border"> 
                    <pre className="dv-pre-clear" style={nopadding}>{ report }</pre>
                    {daily.duration ? <span style={marginLeft}> {'用时：' + daily.duration + '小时'}</span>:''}
                </td>
                <td className="dv-border">
                	<pre className="dv-pre-clear" style={nopadding_plan}>{plan}</pre>
                </td>
                <td className="dv-border">
                	<a onClick={this.handleEdit} className="dv-link"><i className="uk-icon-small uk-icon-edit"></i></a>
                </td>
            </tr>
        )
    }
});

var MyDaily = React.createClass({
	loadData: function(dayTime){
		getJSON( '/api/project/daily', {date:dayTime}, function(err, data ){
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
		return {dayTime:Date.now(), tasks:[]}
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
				<h2 className="uk-text-center"><b>我的日志</b></h2>
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
								<th className="dv-width-4-20">今日计划</th>
								<th className="dv-width-7-20">今日工作</th>
								<th className="dv-width-4-20">明日计划</th>					
								<th className="dv-width-1-20">操作</th>					
							</tr>
						</thead>
						<tbody>
						{
							this.state.tasks.map(function(t, n){
								return (
									<TaskDaily key={n} task={t} dayTime={this.state.dayTime} />
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