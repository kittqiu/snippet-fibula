var CourseList = React.createClass({
	render: function(){
		return (
			<table className="uk-width-1-1 uk-table">
				<thead>
					<tr>
						<th>课程名称</th>
						<th>课程简述</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{
						this.props.courses.map( function(c,index){
							return (
								<tr key={index}>
									<td className="uk-width-3-10 uk-text-left"><b><a href={"/train/c/" + c.id  } className="dv-link">{ c.name }</a></b></td>
									<td className="uk-width-5-10">{ c.brief }</td>
									<td className="uk-width-2-10">
										<a href={"/train/c/" + c.id } className="dv-link">查看</a>
										{
											c.owner_id === ENV.user.id ? <a href={"/train/c/" + c.id + "/edit"} className="dv-link">修改</a>
												: null
										}
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

var AllCourses = React.createClass({
	loadData: function(){
		getJSON( '/api/train/c/list', {page:this.props.page}, function(err, data ){
				if(err){
					fatal(err);
				}else{
					this.setState({courses:data.courses, page:data.page, pagelist: data.page.list});
				}
			}.bind(this)
		);
	},
	getInitialState: function(){		
		return {page:{}, pagelist:[], courses:[]}
	},
	componentWillMount: function(){
		this.loadData();
	},
	render: function(){
		var page = this.state.page,
			left = page.index == 1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-left"></i></span></li> 
				: <li><a href={"?page=" + (page.index-1)}><i className="uk-icon-angle-double-left"></i></a></li>,
			right = page.index == Math.floor(page.total/page.size)+1 ? <li className="uk-disabled"><span><i className="uk-icon-angle-double-right"></i></span></li> 
				: <li><a href={"?page=" + (page.index+1)}><i className="uk-icon-angle-double-right"></i></a></li>;
		
		return (
			<div>
				<h1 className="uk-text-center"><b>所有课程</b></h1>				
				<div className="uk-text-right">
				</div>
				<hr className="dv-hr"/>
				<div>
					{
						this.state.courses.length > 0 ? <CourseList courses={this.state.courses}/>
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