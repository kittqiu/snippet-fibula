var ProjectList = React.createClass({
	render: function(){
		return (
			<table className="uk-width-1-1 uk-table">
				<thead>
					<tr>
						<td>项目名称</td>
						<td>负责人</td>
						<td>开始时间</td>
						<td>结束时间</td>
						<td>操作</td>
					</tr>
				</thead>
				<tbody>
					{
						this.props.projects.map( function(p,index){
							return (
								<tr key={index}>
									<td className="uk-width-3-10 uk-text-left"><b><a href={"/project/p/" + p.id + "/build" } className="dv-link">{ p.name }</a></b></td>
									<td className="uk-width-1-10">{ p.master_name }</td>
									<td className="uk-width-1-10">{ formatDate(p.start_time) }</td>
									<td className="uk-width-1-10">{ formatDate(p.end_time) }</td>
									<td className="uk-width-4-10">
										<a href={"/project/p/" + p.id } className="dv-link">概况</a>
										{
											p.master_id === ENV.user.id ? <a href={"/project/p/" + p.id + "/edit"} className="dv-link">修改</a>
												: null
										}
										<a href={"/project/p/" + p.id + "/daily"} className="dv-link">工作进展</a>
									</td>
								</tr>
								)
						})
					}
				</tbody>
			</table>
			)
	}
});

var MyProject = React.createClass({
	loadData: function(){
		getJSON( '/api/project/p/myDoing', {uid:ENV.user.id, page:this.props.page}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({projects:data.projects, page:data.page, pagelist: data.page.list});
				}
			}.bind(this)
		);
	},
	getInitialState: function(){		
		return {page:{}, pagelist:[], projects:[]}
	},
	componentWillMount: function(){
		this.loadData();
	},
	render: function(){
		var page = this.state.page,
			left = page.index == 1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-left"></i></span></li> 
				: <li><a href={"?page=" + (page.index-1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-left"></i></a></li>,
			right = page.index == Math.floor(page.total/page.size)+1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-right"></i></span></li> 
				: <li><a href={"?page=" + (page.index+1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-right"></i></a></li>;
		
		return (
			<div>
				<h1 className="uk-text-center"><b>我正参与的项目</b></h1>				
				<div className="uk-text-right">
					<a href="/project/p/myHistory" className="dv-link">查看历史项目</a>
				</div>
				<hr className="dv-hr"/>
				<div>
					{
						this.state.projects.length > 0 ? <ProjectList projects={this.state.projects}/>
							: <span>无符合条件记录</span>
					}
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
			</div>
			)
	}
});

var MyHistoryProject = React.createClass({
	loadData: function(){
		getJSON( '/api/project/p/myHistory', {uid:ENV.user.id, page:this.props.page}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({projects:data.projects, page:data.page, pagelist: data.page.list});
				}
			}.bind(this)
		);
	},
	getInitialState: function(){		
		return {page:{}, pagelist:[], projects:[]}
	},
	componentWillMount: function(){
		this.loadData();
	},
	render: function(){
		var page = this.state.page,
			left = page.index == 1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-left"></i></span></li> 
				: <li><a href={"?page=" + (page.index-1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-left"></i></a></li>,
			right = page.index == Math.floor(page.total/page.size)+1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-right"></i></span></li> 
				: <li><a href={"?page=" + (page.index+1) + '&uid=' + ENV.user.id}><i className="uk-icon-angle-double-right"></i></a></li>;
		
		return (
			<div>
				<h1 className="uk-text-center"><b>我参与的历史项目</b></h1>				
				<div className="uk-text-right">
					<a href="/project/p/myDoing" className="dv-link">正在参与的项目</a>
				</div>
				<hr className="dv-hr"/>
				<div>
					{
						this.state.projects.length > 0 ? <ProjectList projects={this.state.projects}/>
							: <span>无符合条件记录</span>
					}
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
			</div>
			)
	}
});