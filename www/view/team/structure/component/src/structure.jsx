var SelectUserDialog = React.createClass({
	loadFreeUsers: function(){
		getJSON( '/api/team/department/freeusers', function(err, fusers){
			if(err){
				fatal(err);
			}else{
				this.setState({users:fusers});
			}
		}.bind(this));
	},
	handleSubmit: function(){
		var $members = $("#modal_add_member input:checked"),
			ms = [], fs=[], as=[], i, users = this.state.users;
		for( i = 0; i < $members.length; i++){
			ms.push($members[i].value);
		}
		for( i = 0; i < users.length; i++ ){
			var u = users[i];
			if( ms.indexOf(u.id)!== -1){
				as.push(u);
			}else{
				fs.push(u);
			}
		}
		//this.setState({users:fs});
		this.props.addUsers(as);

		var modal = UIkit.modal("#modal_add_member");
		modal.hide();
	},
	componentWillMount: function(){
		this.loadFreeUsers();
	},
	componentWillReceiveProps: function(nextProps){
		if( nextProps.dataUpdatedCnt !== this.state.dataUpdatedCnt ){
			this.loadFreeUsers();
		}
	},
	getInitialState: function(){
		return {users:[], dataUpdatedCnt:0}
	},
	render: function(){
		return (
			<div id="modal_add_member" className="uk-modal uk-text-left">
				<div className="uk-modal-dialog">
					<a href="" className="uk-modal-close uk-close uk-close-alt"></a>
					<div className="uk-modal-header "><h2>选择新成员</h2></div>
					<div>
						<form className="uk-form uk-form-stacked uk-form-horizontal">
							<fieldset>
								<div className="uk-alert uk-alert-danger uk-hidden"></div>
								{
									this.state.users.map(function(u,index){
										return (
											<div key={u.id} className="uk-form-controls">
												<input id={u.id} type="checkbox" value={u.id} />
												<label htmlFor={u.id}>{u.name}</label>
											</div>
											)
									})
								}
								<div className={this.state.users.length>0?'uk-hidden':''}>无新成员</div>
							</fieldset>
						</form>
					</div>
					<div className="uk-modal-footer uk-text-right">
						<button type="button" onClick={this.handleSubmit} className="uk-button uk-button-primary">提交</button>
					</div>
				</div>
			</div>
			)
	}
});


var Department = React.createClass({
	render: function(){
		var dep = this.props.dep,
			parentCls = dep.parent !=='root' ? 'treegrid-parent-' + dep.parent : '';
		if( dep.type === 'user'){
			return (
				<tr id={dep.id} className={ 'treegrid-' + dep.id + ' ' + parentCls} data-treegrid-type="user" data-treegrid-drag="{droppable:false}">
					<td>{dep.name}
						<div id={"modal_task_"+dep.id} className="uk-modal">
						</div>
					</td>
				</tr>
				)
		}else{
			return (
				<tr id={dep.id} className={ 'treegrid-' + dep.id + ' ' + parentCls}>
					<td>{dep.name}
						<div id={"modal_task_"+dep.id} className="uk-modal">
						</div>
					</td>
				</tr>
				)
		}
		
	}
})

var DepartmentTable = React.createClass({
	dragDepartment: function(dep_id, toParentId, fromParentId){
		this.props.onDragDrop(dep_id, toParentId, fromParentId);
	},
	initTree: function (){
		$('.tree').treegrid({
			treeColumn: 0,
			expanderExpandedClass: 'uk-icon-folder-open-o',
			expanderCollapsedClass: 'uk-icon-folder-o',
			nodeClasses: {
				user:'uk-icon-user'
			},
			draggable: true, 
			onMove: this.dragDepartment,
			selectable: true,
			selectedClass: 'dv-row-selected',
			onSelected:this.props.onItemSelected,
			leafClass:'uk-icon-leaf'
		});
	},
	getInitialState: function(){
		return {depLen:0, updatedCnt:0}
	},
	componentDidUpdate:function(){
		if( this.props.deps.length !== this.state.depLen){
			this.initTree();
			this.setState({depLen:this.props.deps.length});
		}
		if( this.props.updatedCnt !== this.state.updatedCnt){
			this.initTree();
			this.setState({updatedCnt:this.props.updatedCnt});
		}
	},
	render: function(){
		return (
			<div>
				<table id="tree" className="tree uk-table uk-table-hover uk-width-1-1 uk-table-condensed">
					<thead>
						<tr>
							<th>部门列表</th>
						</tr>
					</thead>
					<tbody>
					{ 
						this.props.deps.map(function(t, index){
							return <Department key={t.id} dep={t} />
						}.bind(this))
					}
					</tbody>
				</table>
			</div>
			)
	}
});

var ToolBar = React.createClass({
	handleMove: function(action){
		var item = this.props.selectedItem,
			deps = this.props.deps;
		if( item.id === 'root' ){
			return;
		}
		postJSON( '/api/team/department/'+item.id+'/order', {action:action}, function(err,result){
			if( !err){
				if( action === 'up'){
					for(var i = item.index -1; i >= 0; i--){
						var d = deps[i];						
						if( d.parent === item.parent && d.type === 'department'){
							d.order += 1;
							break;
						}
					}
					item.order--;
				}else{//down
					for(var i = item.index + 1; i < deps.length; i++){
						var d = deps[i];
						if( d.parent === item.parent && d.type === 'department'){
							d.order -= 1;
							break;
						}
					}
					item.order++;
				}
				this.props.onDataChanged();
			}
		}.bind(this));		
	},
	handleChangeParent: function(pid){
		var item = this.props.selectedItem;
		if( item.id === 'root'){
			return;
		}
		this.props.handleDepChangeParent(item, pid);
	},
	handleJump: function(url){
		location.assign(url);
	},
	handleDelete: function(){
		var item = this.props.selectedItem;
		var deps = this.props.deps;
		if( item.id === 'root'){
			return;
		}
		if( this.hasChildren(item)){
			return;
		}

		if(item.type==='department'){
			postJSON( '/api/team/department/'+item.id+'/delete', function(err,result){
				if( err !== null )console.log(err);
				else{
					for( var i = item.index+1; i < deps.length; i++ ){
						var d = deps[i];
						if( d.parent === item.parent){
							d.order--;
						}
					}
					deps.splice(item.index, 1);
					this.props.onDataChanged();
				}
			}.bind(this));
		}else{//'user'
			postJSON( '/api/team/member/u/'+item.id, {department:''}, function(err,result){
				if( err !== null )console.log(err);
				else{
					deps.splice(item.index, 1);
					this.props.onDataChanged();
				}
			}.bind(this));
		}		
	},	
	hasChildren: function(item){
		var deps = this.props.deps;
		if( item.type === 'user'){
			return false;
		}
		for( var i = item.index+1; i<deps.length; i++ ){
			var d = deps[i];
			if( d.parent === item.id){
				return true;
			}
		}
		return false;
	},
	canDown: function(item){
		var deps = this.props.deps;
		if( item.type==='department'){
			for(var i = item.index + 1; i < deps.length; i++){
				var d = deps[i];
				if( d.parent === item.parent && d.type === 'department'){
					return true;
				}
			}
		}
		return false;
	},
	canUp: function(item){
		var deps = this.props.deps;
		if( item.type==='department' ){
			for(var i = item.index -1; i >= 0; i--){
				var d = deps[i];
				if( d.id === item.parent ){
					break;
				}
				if( d.parent === item.parent && d.type === 'department'){
					return true;
				}
			}
		}
		return false;
	},
	getInitialState: function() {
		return {disabledDown:true, disabledUp:true, disabledRoot:true, disabledAddMember:true};
	},
	componentWillReceiveProps: function(nextProps){

	},
	render: function(){
		var item = this.props.selectedItem, 
			noMargin = {marginRight:'0px'},
			disabledDown = !this.canDown(item),
			disabledUp = !this.canUp(item), 
			disabledRoot=true, 
			disabledAddMember=true,
			disabledAddSubDep = true,
			disabledEditDep = true,
			disabledDelDep = this.hasChildren(item);
		
		if( item.type === 'department'){			
			disabledAddSubDep = false;		
			
			if( item.id !== 'root'){
				disabledEditDep = false;
				disabledAddMember = false;
				
				if( item.parent !== 'root'){
					disabledRoot = false;				
				}
			}else{
				disabledDelDep = true;
			}
		}
		return (
			<div className="uk-grid">
				<div className="uk-width-1-3">
					添加：
					<button className="uk-button-link dv-link" onClick={ this.handleJump.bind(this,"/team/structure/department/creation")} style={noMargin}>顶级部门</button>、
					<button className="uk-button-link dv-link" onClick={ this.handleJump.bind(this,"/team/structure/department/creation?parent="+item.id)} disabled={disabledAddSubDep} style={noMargin}>下级部门</button>、
					<button className="uk-button-link dv-link" data-uk-modal="{center:true,target:'#modal_add_member'}" disabled={disabledAddMember} style={noMargin}>下属成员</button>
					<SelectUserDialog dataUpdatedCnt={this.props.updatedCnt} addUsers={this.props.addUsers}/>
				</div>
				<div className="uk-width-1-3">
					移动：
					<button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'up')} disabled={disabledUp} style={noMargin}>上移</button>、
					<button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'down')} disabled={disabledDown} style={noMargin}>下移</button>、
					<button className="uk-button-link dv-link" onClick={this.handleChangeParent.bind(this,'root')} disabled={disabledRoot} style={noMargin}>置为顶级部门</button>
				</div>
				<div className="uk-width-1-3">
					其它：
					<button className="uk-button-link dv-link" onClick={this.handleJump.bind(this,'/team/structure/department/' + item.id +'/edit')} disabled={disabledEditDep} style={noMargin}>修改</button>、
					<button className="uk-button-link dv-link" onClick={this.handleDelete} disabled={disabledDelDep} style={noMargin}>删除</button>
				</div>
				<ul className="uk-nav uk-nav-menu" data-uk-scrollspy-nav="{closest:'li', smoothscroll:false}">
					<li>添加</li>
					<li><button className="uk-button-link dv-link" onClick={ this.handleJump.bind(this,"/team/structure/department/creation")}>顶级部门</button></li>
					<li><button className="uk-button-link dv-link" onClick={ this.handleJump.bind(this,"/team/structure/department/creation?parent="+item.id)} disabled={disabledAddSubDep}>下级部门</button></li>
					<li><button className="uk-button-link dv-link" href={'#modal_new_task'} data-uk-modal="{center:true}" disabled={disabledAddMember}>下属成员</button></li>
					<li>移动</li>
					<li><button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'up')} disabled={disabledUp}>上移</button></li>
					<li><button className="uk-button-link dv-link" onClick={this.handleMove.bind(this,'down')} disabled={disabledDown}>下移</button></li>
					<li><button className="uk-button-link dv-link" onClick={this.handleChangeParent.bind(this,'root')} disabled={disabledRoot}>置为顶级部门</button></li>
					<li>其它</li>
					<li><button className="uk-button-link dv-link" onClick={this.handleJump.bind(this,'/team/structure/department/' + item.id +'/edit')} disabled={disabledEditDep} style={noMargin}>修改</button></li>
					<li><button className="uk-button-link dv-link" onClick={this.handleDelete} disabled={disabledDelDep} style={noMargin}>删除</button></li>
				</ul>
			</div>
			)
	}
});

var Structure = React.createClass({	
	initDepMap: function(deps){
		var DepMap = this.state.DepMap;
		for( var i = 0; i < deps.length; i++ ){
			var dep = deps[i];
			dep.type = 'department';
			DepMap[dep.id] = dep;
		}
	},
	initUserMap: function(users){
		var UserMap = this.state.UserMap;
		for( var i = 0; i < users.length; i++ ){
			var u = users[i];
			u.type = 'user';
			u.order = 0;//always first
			u.parent = u.department;
			UserMap[u.id] = u;
		}
	},
	initItemAttr: function(ds){
		ds.forEach( function(d, index) {
			d.index = index;
		});
	},
	evaluateAncestor: function(id){
		var DepMap = this.state.DepMap,
			UserMap = this.state.UserMap,
			as = [];
		if( id !== 'root'){
			if( DepMap.hasOwnProperty(id) ){
				var tid = id;
				do{
					var a = DepMap[tid];
					as.unshift(a.parent);
					tid = a.parent;
				}while(tid!=='root');
			}else if( UserMap.hasOwnProperty(id) ){
				var depId = UserMap[id].parent;
				as.push(depId);
				while( depId !== 'root'){
					var a = DepMap[depId];
					as.unshift(a.parent);
					depId = a.parent;
				}
			}
		}			
		return as;
	},
	sortItem: function( ds ){
		var DepMap = this.state.DepMap,
			UserMap = this.state.UserMap;

		ds.sort(function(a,b){
			if(a.parent === b.parent){
				if( a.type === 'user' && b.type === 'department'){
					return -1;
				}else if( a.type === 'department' && b.type === 'user' ){
					return 1;
				}else{
					return a.order - b.order;
				}				
			}else{
				var aas = this.evaluateAncestor(a.id),
					abs = this.evaluateAncestor(b.id),
					maxlen = Math.max(aas.length, abs.length);
				for(var i = 0; i < maxlen; i++ ){
					if(i>=aas.length){
						if( a.type === 'user'){
							return -1;
						}else{
							return a.order - DepMap[abs[i]].order <= 0 ? -1 : 1;
						}
					}
					if(i>=abs.length){
						if( b.type === 'user' ){
							return 1;
						}else{
							return DepMap[aas[i]].order - b.order >= 0? 1: -1;
						}
					}
					if(aas[i]!==abs[i]){
						return DepMap[aas[i]].order - DepMap[abs[i]].order;
					}
				}
				return 0;
			}
		}.bind(this));
		this.initItemAttr(ds);
		return ds;
	},
	loadUsers: function(deps){
		getJSON( '/api/team/department/users', function(err, users){
			if(err){
				fatal(err);
			}else{
				this.initUserMap(users);
				deps = deps.concat(users);
				deps = this.sortItem(deps);
				this.setState({data:deps});
			}
		}.bind(this));
	},
	loadData: function(){
		getJSON( '/api/team/department/list', function(err, deps ){				
				if(err){
					fatal(err);
				}else{					
					this.initDepMap(deps);					
					this.loadUsers(deps);							
				}
			}.bind(this)
		);
	},
	handleDepChangeParent: function(item, pid){
		var params = { name: item.name, pid: pid},
			deps = this.state.data;
		if( item.type === 'user' || item.parent === pid ){
			return;
		}
		// if( this.hasBloodRelation(item.id, pid )){
		// 	console.log('hasBloodRelation')
		// 	return;
		// }
		postJSON( '/api/team/department/'+item.id, params, function(err,result){
			if( !err){
				var i;
				for(i = item.index + 1; i < deps.length; i++){
					var d = deps[i];
					if( d.parent === item.parent && d.type === 'department'){
						d.order -= 1;
					}
				}
				item.order = 0;
				for(i = deps.length - 1; i >= 0; i--){
					var d = deps[i];
					if( d.parent === pid && d.type === 'department'){
						item.order = d.order + 1;
						break;
					}
				}
				item.parent = pid;
				this.onDataChanged();
			}
		}.bind(this));
	},
	hasBloodRelation:function(ida, idb){
		var pas = this.evaluateAncestor(ida),
			pbs = this.evaluateAncestor(idb);
		if( pas.indexOf(idb)!== -1 || pbs.indexOf(ida)!== -1){
			return true;
		}
		return false;
	},
	onDragDrop: function(dep_id,toParentId, fromParentId){
		var DepMap = this.state.DepMap,
			UserMap = this.state.UserMap,
			deps = this.state.data,
			dep;
		if( DepMap.hasOwnProperty(dep_id)){
			dep = DepMap[dep_id];
		}else if( UserMap.hasOwnProperty(dep_id)){
			dep = UserMap[dep_id];
		}
		if( dep.parent === toParentId || toParentId === fromParentId){
			return;
		}

		if( dep.type === 'user'){
			postJSON( '/api/team/member/u/'+dep.id, {department: toParentId}, function(err,result){
				if( !err){					
					dep.parent = toParentId;
					this.onDataChanged();
					console.log('department:' + toParentId)
				}
			}.bind(this));
		}
		if( dep.type === 'department'){
			this.handleDepChangeParent( dep, toParentId );
		}
	},
	addUsers:function(users){
		var item = this.state.selectedItem,
			deps = this.state.data,
			newusers = [];
		users.forEach(function(u,index){
			var m = {
				type: 'user',
				department: item.id,
				parent: item.id,
				id: u.id,
				name: u.name
			}
			u.department = item.id;
			newusers.push(m);
			deps.push(m);
		})
		postJSON( '/api/team/member/updateusers', users, function(err,result){
			if( !err){
				this.initUserMap(newusers);
				this.onDataChanged();
			}
		}.bind(this));
	},
	onDataChanged: function(){
		var deps = this.state.data;
		deps = this.sortItem(deps);
		this.setState({data:deps, updatedCnt: this.state.updatedCnt+1});
	},
	onItemSelected: function(id){
		if( this.state.DepMap.hasOwnProperty(id)){
			this.setState({selectedItem:this.state.DepMap[id]})
		}else if( this.state.UserMap.hasOwnProperty(id)){
			this.setState({selectedItem:this.state.UserMap[id]})
		}
	},	
	componentWillMount: function(){
		this.loadData();		
	},
	getInitialState: function(){
		var DepMap = {root:{ id:'root', name:'root', parent: 'none', type:'department' }};
		return {DepMap:DepMap, 
			UserMap:{}, data:[], selectedItem:DepMap['root'], updatedCnt:0}
	},

	render: function(){
		return (
			<div className="uk-width-1-1">		
				<h2 className="x-title">部门架构</h2>
				<ToolBar selectedItem={this.state.selectedItem} deps={this.state.data} updatedCnt={this.state.updatedCnt}
					onDataChanged={this.onDataChanged} handleDepChangeParent={this.handleDepChangeParent} addUsers={this.addUsers}/>				
				<hr className="dv-hr"/>				
				<DepartmentTable deps={this.state.data} onItemSelected={this.onItemSelected} updatedCnt={this.state.updatedCnt}
					onDragDrop={this.onDragDrop}/>
			</div>
			)
	}
});