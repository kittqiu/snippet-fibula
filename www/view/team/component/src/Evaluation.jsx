var MonthDailyDialog = React.createClass({
	showModal: function(){		
		var id = "modal_eval_daily_month";
		var modal = new UIkit.modal('#'+id);
		modal.show();
	},
	hideModel: function(){
		var id = "modal_eval_daily_month";
		var modal = new UIkit.modal('#'+id);
		modal.hide();
	},
	loadData: function(){
		var uid = this.props.user.user_id,
			date = this.props.date;
		getJSON( '/api/project/u/' + uid + '/monthwork', {year:date.getFullYear(), month:date.getMonth()}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({daily_list:data});
				}
			}.bind(this)
		);
	},
	getInitialState: function() {
		return { daily_list:[]}
	},
	componentDidMount: function(){
		this.loadData();
		this.showModal();
	},
	componentDidUpdate:function(){
		this.showModal();
	},
	render: function(){
		return (
			<div className="uk-modal-dialog uk-modal-dialog-large">
				<a href="#" className="uk-modal-close uk-close uk-close-alt"></a>
				<div className="uk-modal-header"><h2>{this.props.user.name}的月工作</h2></div>					
				<div id={'form-evaluation-'+ this.props.key}>
					{
						this.state.daily_list.length > 0 ? 
					
					<table className="uk-width-1-1 uk-table">
						<thead>
							<tr>
								<th className="dv-width-2-20">日期</th>
								<th className="dv-width-10-20">当日工作</th>
								<th className="dv-width-1-20">用时</th>
								<th className="dv-width-4-20">所属任务</th>												
								<th className="dv-width-3-20">所属项目</th>
							</tr>
						</thead>
						<tbody>
						{
							this.state.daily_list.map(function(d, n){
								return (
									<tr key={n}>
										<td>{formatDate(d.time)}</td>
										<td>{d.report}</td>
										<td>{d.duration}</td>
										<td>{d.task_name}</td>
										<td>{d.project_name}</td>
									</tr>
									)
							}.bind(this))
						}
						</tbody>
					</table>
					: '无记录'}
				</div>
			</div>
			)
	}
});

var ManagerEvalDialog = React.createClass({
	showModal: function(){		
		var id = "modal_eval_manager";
		var modal = new UIkit.modal('#'+id);
		modal.show();
	},
	hideModel: function(){
		var id = "modal_eval_manager";
		var modal = new UIkit.modal('#'+id);
		modal.hide();
	},
	handleSubmit: function(e){
		e.preventDefault();
		var url = '/api/team/evaluation/' + this.props.data.id + '/edit', 
			data = {
				type:'bymanager',
				outputeval: this.refs.outputeval.value,
				goodjobeval: this.refs.goodjobeval.value,
				badjobeval: this.refs.badjobeval.value, 
				kpi: this.refs.kpi.value
			},
			formid = 'form-evaluation-'+ this.props.key,
			form = $('#'+formid).find('form');
				
		form.postJSON( url, data, function(err, result){
			if( !err ){				
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
		var evaluation = this.props.data.evaluation || {};
		var areaHeight = { height: '60px'};

		return (
			<div className="uk-modal-dialog">
				<a href="#" className="uk-modal-close uk-close uk-close-alt"></a>
				<div className="uk-modal-header"><h2>评价成员的月工作</h2></div>					
				<div id={'form-evaluation-'+ this.props.key}>
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row">
								<label className="uk-form-label">成果评价（重点）：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="outputeval" name="outputeval" defaultValue={evaluation.outputeval} className="uk-width-1-1" style={areaHeight} placeholder="用1-2句话对关键项工作进行总体评判，应有结果量化级别，例如：差，一般，很好，特别好。">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">为他点赞的地方(重点)：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="goodjobeval" name="goodjobeval" defaultValue={evaluation.goodjobeval} className="uk-width-1-1" style={areaHeight} placeholder="填写你所看到的1-2个做得突出且值得表扬的行为。如果放空，表示没有">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">令人遗憾的地方：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="badjobeval" name="badjobeval" defaultValue={evaluation.badjobeval} className="uk-width-1-1" style={areaHeight} placeholder="填写做得不足的方面。如果放空，表示没有">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">考评分：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<input type="text" ref="kpi" name="kpi" defaultValue={evaluation.kpi} className="uk-width-1-1" placeholder="选填考核数字0.8-1.2之间，单位间隔为0.1">
									</input>
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

var UserEvalDialog = React.createClass({
	showModal: function(){		
		var id = "modal_eval_user";
		var modal = new UIkit.modal('#'+id);
		modal.show();
	},
	hideModel: function(){
		var id = "modal_eval_user";
		var modal = new UIkit.modal('#'+id);
		modal.hide();
	},
	handleSubmit: function(e){
		e.preventDefault();
		var url = "/api/team/evaluation/add", 
			data = {
				type:'byuser',
				date: this.props.date,
				corework: this.refs.corework.value,
				output: this.refs.output.value,
				process: this.refs.process.value, 
				goodjob: this.refs.goodjob.value,
				badjob: this.refs.badjob.value,
				other: this.refs.other.value
			},
			formid = 'form-evaluation-'+ this.props.key,
			form = $('#'+formid).find('form');
		if( !!this.props.data.id ){
			url = '/api/team/evaluation/' + this.props.data.id + '/edit';
		}
		
		form.postJSON( url, data, function(err, result){
			if( !err ){				
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
		var evaluation = this.props.data.evaluation || {};
		var areaHeight = { height: '60px'};

		return (
			<div className="uk-modal-dialog">
				<a href="#" className="uk-modal-close uk-close uk-close-alt"></a>
				<div className="uk-modal-header"><h2>修改月工作自评</h2></div>					
				<div id={'form-evaluation-'+ this.props.key}>
					<form onSubmit={this.handleSubmit} className="uk-form uk-form-stacked uk-form-horizontal">
						<fieldset>
							<div className="uk-alert uk-alert-danger uk-hidden"></div>
							<div className="uk-form-row">
								<label className="uk-form-label">核心工作项：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<input type="text" ref="corework" name="corework" defaultValue={evaluation.corework} className="uk-width-1-1" placeholder="填写最重要的一项工作">
									</input>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">成果小结（重点）：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="output" name="output" defaultValue={evaluation.output} className="uk-width-1-1" style={areaHeight} placeholder="用1-2句话量化地描述你的成果，例如：共完成整体计划50%，共分解为15个任务，提交XXX文档">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">过程小结：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="process" name="process" defaultValue={evaluation.process} className="uk-width-1-1" style={areaHeight} placeholder="简要量化描述过程是否有序，包含是否有制订计划，分解为多少个任务，xxx%的任务按时完成">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">为自己点赞的地方(重点)：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="goodjob" name="goodjob" defaultValue={evaluation.goodjob} className="uk-width-1-1" style={areaHeight} placeholder="填写在整个过程中1-2个突出的并值得表扬的行为。如果放空，表示没有">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">令自己遗憾的地方：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="badjob" name="badjob" defaultValue={evaluation.badjob} className="uk-width-1-1" style={areaHeight} placeholder="填写做得不足的方面。如果放空，表示没有">
									</textarea>
								</div>
							</div>
							<div className="uk-form-row">
								<label className="uk-form-label">其他需要说明：</label>
								<div className="uk-form-controls uk-form-controls-text">
									<textarea ref="other" name="other" defaultValue={evaluation.other} className="uk-width-1-1" style={areaHeight} placeholder="选填，如果有其他项相对重要的工作">
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


var EvaluationPage = React.createClass({
	nextMonth: function(){
		var d = this.state.date;
		var m = d.getMonth() + 1;
		if( m > 11 ){
			d.setYear( d.getFullYear() + 1);
			m = 0;
		}
		d.setMonth( m );
		this.setState({date:d});
		this.loadData( this.state.user_id, d.getFullYear(), m );
		this.refs.eval_month.value = formatDateToMonth(d);
	},
	previousMonth: function(){
		var d = this.state.date;
		var m = d.getMonth() - 1;
		if( m < 0 ){
			d.setYear( d.getFullYear() - 1);
			m = 11;
		}
		d.setMonth( m );
		this.setState({date:d});
		this.loadData( this.state.user_id, d.getFullYear(), m );
		this.refs.eval_month.value = formatDateToMonth(d);
	},
	onUpdate: function(){
		this.loadData();
	},
	viewDaily: function(e){
		e.preventDefault();
		ReactDOM.render(
			<MonthDailyDialog key={ 'key_eval_month_daily_'+this.state.user_id + '_' + this.state.date.getTime() }  
				date={this.state.date}	user={this.state.user}/>,
				document.getElementById('modal_eval_daily_month')
			);
	},
	editByUser: function(e){
		e.preventDefault();
		ReactDOM.render(
			<UserEvalDialog key={ 'key_eval_user_'+this.state.user_id + '_' + this.state.date.getTime() }  
				date={this.state.date}	data={this.state.data} onUpdate={this.onUpdate}/>,
				document.getElementById('modal_eval_user')
			);
	},
	editByManager: function(e){
		e.preventDefault();
		ReactDOM.render(
			<ManagerEvalDialog key={ 'key_eval_manager_'+this.state.user_id + '_' + this.state.date.getTime() }  
				date={this.state.date}	data={this.state.data} onUpdate={this.onUpdate}/>,
				document.getElementById('modal_eval_manager')
			);

	},
	handleSelected: function(type, id){
		if( type === 'user' ){
			this.setState({user_id:id});
			this.loadUser(id);
			this.loadData(id);
		}
	},
	loadUser: function(u){
		var uid = u || this.state.user_id;
		getJSON( '/api/team/member/'+uid, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({user:data});
				}
			}.bind(this)
		);
	},
	loadManager: function(u){
		var uid = u || "";
		getJSON( '/api/team/member/'+uid, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({manager:data});
				}
			}.bind(this)
		);
	},
	loadData: function(uid, y, m){
		var year = y || this.state.date.getFullYear(),
			month = m || this.state.date.getMonth(),
			user_id = uid || this.state.user_id;
		getJSON( '/api/team/evaluation', {user:user_id, year: year, month: month}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					if( !!data.evaluation ){
						data.evaluation = JSON.parse(data.evaluation);
					}					
					this.setState({data:data});
					if( !!data.manager_id ){
						this.loadManager(data.manager_id);
					}else{
						this.setState({manager:{}});
					}
				}
			}.bind(this)
		);
	},
	componentWillMount: function(){
		this.loadData();
		this.loadUser();
	},
	getInitialState: function() {
		return {user_id:ENV.user.id, user: {}, manager:{}, date: new Date(), data:{}}
	},
	render: function(){
		var borderRight = { borderRight:'1px solid #ddd'},
			data = this.state.data.evaluation  || {},
			haseval = !!this.state.manager.name,
			hasinfo = !!this.state.data.id;
			console.log(data)
		return (
			<div className="uk-grid">
				<div className="uk-width-2-10" style={borderRight}>
					<StructureTree onSelected={this.handleSelected} />
				</div>
				<div className="uk-width-8-10">
					<h1 className="uk-text-center"><b><span>{this.state.user.name}</span>的月工作评价</b></h1>
					<div>
						<ul className="uk-pagination">
							<li className="uk-pagination-previous">
								<a onClick={this.previousMonth}><i className="uk-icon-angle-double-left"></i>上个月</a>
							</li>
							<li className="">
								<span><input type="text" name="eval_month" ref="eval_month" 
									defaultValue={formatDateToMonth(this.state.date)} data-uk-datepicker="{format:'YYYY-MM'}"/></span>
							</li>
							<li className="uk-pagination-next">
								<a onClick={this.nextMonth}>下个月<i className="uk-icon-angle-double-right"></i></a>
							</li>
						</ul>
					</div>
					<hr className="dv-hr"/>
					<div className="uk-block uk-block-default">
						<div id={"modal_eval_user"} className="uk-modal"></div>
						<div id={"modal_eval_daily_month"} className="uk-modal"></div>
						<table className="uk-table">
							<caption>个人自评
								<span className="uk-float-right">
								<a className="dv-link" onClick={this.viewDaily}>本月工作日志</a>
								{ !haseval && ENV.user.id === this.state.user_id ?
									<a className="dv-link" onClick={this.editByUser}>修改</a>
								:''}
								</span>
							</caption>
							<tbody>
								<tr>
									<td className="uk-width-1-4"><b>关键工作项：</b></td>
									<td>{!!data.corework? <span>{data.corework}</span>: '未填写'}</td>
								</tr>								
								<tr>
									<td className="uk-width-1-4"><b>成果小结(重点)：</b></td>
									<td>{!!data.output? <span><pre className="dv-pre-clear">{data.output}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>过程小结：</b></td>
									<td>{!!data.process? <span><pre className="dv-pre-clear">{data.process}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>为自己点赞的地方(重点)：</b></td>
									<td>{!!data.goodjob? <span><pre className="dv-pre-clear">{data.goodjob}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>令自己遗憾的地方：</b></td>
									<td>{!!data.badjob? <span><pre className="dv-pre-clear">{data.badjob}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>其他需要说明：</b></td>
									<td>{!!data.other? <span><pre className="dv-pre-clear">{data.other}</pre></span>: '未填写'}</td>
								</tr>
							</tbody>
						</table>
						<div id={"modal_eval_manager"} className="uk-modal"></div>
						<table className="uk-table">
							<caption>负责人评价{haseval?<span>({this.state.manager.name})</span>:''}
								{ ((haseval && ENV.user.id === this.state.manager.user_id || !haseval) && hasinfo) ?
								<span className="uk-float-right">
									<a className="dv-link" onClick={this.editByManager}>修改</a>
								</span>
								:''}
							</caption>
							<tbody>
								<tr>
									<td className="uk-width-1-4"><b>成果评价（重点）：</b></td>
									<td>{!!data.outputeval? <span><pre className="dv-pre-clear">{data.outputeval}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>为他点赞的地方(重点)：</b></td>
									<td>{!!data.goodjobeval? <span><pre className="dv-pre-clear">{data.goodjobeval}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>令人遗憾的地方：</b></td>
									<td>{!!data.badjobeval? <span><pre className="dv-pre-clear">{data.badjobeval}</pre></span>: '未填写'}</td>
								</tr>
								<tr>
									<td className="uk-width-1-4"><b>考评分：</b></td>
									<td>{!!data.kpi? <span>{data.kpi}</span>: '未填写'}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			)
	}
});