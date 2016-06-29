var WorkDayPage = React.createClass({
	nextYear: function(){
		var d = this.state.date;
		var y = d.getFullYear() + 1;
		d.setYear( y );
		this.setState({date:d});
		this.loadData( y );
	},
	previousYear: function(){
		var d = this.state.date;
		var y = d.getFullYear() - 1;
		d.setYear( y );
		this.setState({date:d});
		this.loadData( y );
	},
	addRecord: function(){
		var iswordday = this.refs.new_isworkday.checked;
		var day = new Date(this.refs.new_day.value);
		postJSON( '/api/date/workday/add', { year: day.getFullYear(), month: day.getMonth(), 
				date: day.getDate(), iswordday: iswordday}, function(err, r){
				if( r.result === 'ok' ){
					this.loadData();
				}else{
					UIkit.modal.alert( "记录已存在，不可重新创建！" );
				}
			}.bind(this));
	},
	editRecord: function(n){
		console.log( this.refs.data_iswordday );
		postJSON( '/api/date/workday/'+ n.id +'/switch', function(err, r){
				if( r.result === 'ok' ){
					UIkit.modal.alert("修改成功!");
				}
			}.bind(this));
	},
	switchWordDay: function(n){
		n.workday = !n.workday;
	},
	onTimeChanged: function(){

	},
	loadData: function(y){
		var year = y || this.state.date.getFullYear();
		getJSON( '/api/date/list', {year:year}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({dataset:data});
				}
			}.bind(this)
		);
	},
	componentWillMount: function(){
		this.loadData();
	},
	getInitialState: function() {
		return {date:new Date(), dataset:[]}
	},
	render: function(){
		function isWorkDay( d ){
			var day = d.getDay();
			return day !== 0 && day !== 6;
		}
		return (
			<div>
				<h1 className="uk-text-center"><b><span>{this.state.date.getFullYear()}</span>工作日设置</b></h1>
				<div>
					<ul className="uk-pagination">
						<li className="uk-pagination-previous">
							<a onClick={this.previousYear}><i className="uk-icon-angle-double-left"></i>前一年</a>
						</li>
						<li className="">
							<span></span>
						</li>
						<li className="uk-pagination-next">
							<a onClick={this.nextYear}>后一年<i className="uk-icon-angle-double-right"></i></a>
						</li>
					</ul>
				</div>
				<hr className="dv-hr"/>
				<div>
					{ this.state.dataset.length > 0 ? 
					<table	className="uk-width-1-1 uk-table" >
						<thead>
							<tr>
								<th className="dv-width-1-4">日期</th>
								<th className="dv-width-1-4">是否工作日</th>			
								<th className="dv-width-2-4">操作</th>					
							</tr>
						</thead>
						<tbody>
							{
								this.state.dataset.map(function(t, n){
									return (
										<tr key={n}>
											<td><span>{formatDate(t.time)}</span></td>
											<td>
												<label><input type="checkbox" defaultChecked={t.workday} onChange={this.switchWordDay.bind(this,t)}/>工作日</label>
											</td>
											<td><a className="dv-link" onClick={this.editRecord.bind(this,t)}><i className="uk-icon-add"></i>修改</a></td>
										</tr>
										)
								}.bind(this))
							}
						</tbody>
					</table>
					: <span>无记录</span>}
					<div className="uk-block">
						<div className="uk-form uk-form-horizontal">
							<fieldset>
								<legend>添加记录</legend>
								<div className="uk-form-row">
									<label className="uk-form-label">选择日期</label>
        							<div className="uk-form-controls"><input type="text" name="new_day" ref="new_day" defaultValue={formatNow()} data-uk-datepicker="{format:'YYYY-MM-DD'}"/></div>
								</div>
								<div className="uk-form-row">
									<label className="uk-form-label">是否为工作日</label>
        							<div className="uk-form-controls">
        								<label><input name="new_isworkday" ref="new_isworkday" type="checkbox" defaultChecked={isWorkDay(new Date())}/>是</label>
        							</div>
								</div>
								<div className="uk-form-row">
									<button className="uk-button" onClick={this.addRecord}><i className="uk-icon-add"></i>添加</button>
								</div>
							</fieldset>
						</div>
					</div>
				</div>
			</div>
			)
	}
});