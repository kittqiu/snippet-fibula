var TeamItem = React.createClass({
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



var StructureTree = React.createClass({	
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
				this.setState({data:deps, initTreeOnce:true});
				if( this.props.updateUserData){
					this.props.updateUserData(this.state.UserMap);
				}	
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
					if( this.props.updateDepData){
						this.props.updateDepData(this.state.DepMap);
					}							
				}
			}.bind(this)
		);
	},
	initTree: function (){
		$('.tree').treegrid({
			treeColumn: 0,
			expanderExpandedClass: 'uk-icon-folder-open-o',
			expanderCollapsedClass: 'uk-icon-folder-o',
			nodeClasses: {
				user:'uk-icon-user'
			},
			draggable: false, 
			selectable: true,
			selectedClass: 'dv-row-selected',
			onSelected:this.onItemSelected,
			leafClass:'uk-icon-leaf'
		});
	},
	listDepMembers: function(depid){
		var users = this.state.UserMap,
			members = [];

		for( var uid in users){
			var user = users[uid];
			var deps = this.evaluateAncestor(user.id);
			if( deps.indexOf(depid) !== -1 ){
				members.push(user.id)
			}
		}
		return members;
	},
	onItemSelected: function(id){
		var type ='user',
			members = [];
		if( this.state.DepMap.hasOwnProperty(id)){
			this.setState({selectedItem:this.state.DepMap[id]})
			type = 'department';
			members = this.listDepMembers(id);
		}else if( this.state.UserMap.hasOwnProperty(id)){
			this.setState({selectedItem:this.state.UserMap[id]})
			type = 'user';
		}
		this.props.onSelected( type, id, members);
	},
	componentWillMount: function(){
		this.loadData();		
	},
	componentDidUpdate:function(){
		if( this.state.initTreeOnce ){
			this.initTree();
			this.setState({initTreeOnce:false})
		}
	},
	getInitialState: function(){
		var DepMap = {root:{ id:'root', name:'root', parent: 'none', type:'department' }};
		return { DepMap:DepMap, UserMap:{}, data:[], selectedItem:DepMap['root'], 
			updatedCnt:0,  initTreeOnce:false}
	},

	render: function(){
		return (
			<div>
				<table id="tree" className="tree uk-table uk-table-hover uk-width-1-1 uk-table-condensed">
					<thead>
						<tr>
							<th>部门与成员</th>
						</tr>
					</thead>
					<tbody>
					{ 
						this.state.data.map(function(t, index){
							return <TeamItem key={t.id} dep={t} />
						}.bind(this))
					}
					</tbody>
				</table>
			</div>
			)
	}
});