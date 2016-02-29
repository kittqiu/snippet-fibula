var TaskView = React.createClass({
	handlerMsg: function(msg){
		if( msg === 'addTask' ){
			this.refs.operation.setState({type:'addTask'});
		}
	},
	render: function(){
		return (
			<div className={ 'uk-grid uk-width-1-1 ' + this.props.display}>
				<div className="uk-width-1-2 uk-block">
					<h3 align="center"><b>任务列表</b></h3>
					<hr/>
					<div className="uk-width-1-1 dv-border-right">
						<TaskToolBar proc={this.handlerMsg}/>
						<TaskTree root="{{ project.name }}" />
					</div> 
				</div>
				<div className="uk-width-1-2  uk-block">
					<h3><b>操作区</b></h3>
					<hr/>
					<Operation ref="operation"/>
				</div>
			</div>
			);
	}
});

var TaskToolBar = React.createClass({
	handleAdd: function(ev){
		this.props.proc('addTask');
	},
	render: function(){
		return (
			<div className="uk-text-right uk-block-muted">				
				<button className="dv-link uk-button-link uk-icon-arrow-circle-up uk-icon-small" title="上移"></button>
				<button className="dv-link uk-button-link uk-icon-arrow-circle-down uk-icon-small" title="下移"></button>
				<button onClick={this.handleAdd} className="dv-link uk-button-link uk-icon-plus uk-icon-small" title="添加子任务"></button>
			</div>
			)
	}
});

var TaskTree = React.createClass({
	componentDidMount: function(){
		$('.tree').treegrid({
			treeColumn: 1,
		    expanderExpandedClass: 'uk-icon-folder-open-o',
		    expanderCollapsedClass: 'uk-icon-folder-o',
		    nodeClasses: {
		        user:'uk-icon-user',
		        manager: 'uk-icon-manage',
		        manager_duputy: 'uk-icon-manage-deputy'
		    },
		    draggable: true, 
		    //onMove: moveDepartment,
		    selectable: true,
		    selectedClass: 'uk-active'
		    //onSelected:onSelected
		});
	},
	render: function(){
		return (
			<table id="treeTask" className="tree uk-table uk-table-hover uk-width-1-1 uk-table-condensed">
                <thead>
                    <tr>
                    	<th>标识号</th>
                        <th>任务名称</th>
                        <th>工期</th>                        
                    </tr>
                </thead>
                <tbody>
	                <tr className="treegrid-root uk-active">
	                	<td>0</td>
	                	<td>{this.props.root}</td>
	                	<td>2</td>
	                </tr>
	                <tr className="treegrid-1 treegrid-parent-root">
	                	<td>1</td>
	                	<td>{this.props.root}</td>
	                	<td>2</td>
	                </tr>
                </tbody>
            </table>
			)
	}
});

var Operation = React.createClass({
	getInitialState: function() {
	    return {type: 'none'};
	},
	render: function(){
		switch(this.state.type){
			case 'addTask':
				var $tree = $('.tree'),
        			tid = $tree.treegrid('getSelectedId'),
        			parent = Tasks[tid].name;
				return <CreateTaskForm parent={parent}/>
			break;
			default:
				return <div/>
				break;
		}
	}
});

var CreateTaskForm = React.createClass({
	render: function(){
		return (
			<div className="uk-block uk-block-muted uk-container" style={styles.block}>
				<h3><b>创建子任务</b></h3>
				<form className="uk-form uk-form-stacked">
					<fieldset>
						<DivTip/>
						<div className="uk-form-row">
							<label className="uk-form-label">名称</label>
					        <div className="uk-form-controls">
					        	<input name="name" type="text" autofocus placeholder="3-50字符"/>		        	
					        </div>
					    </div>
						<div className="uk-form-row">
					        <label className="uk-form-label">父任务</label>
					        <div className="uk-form-controls">
					        	<input  name="parent_name" type="radio" defaultChecked/>{this.props.parent}
					        </div>
					    </div>
					    <div className="uk-form-row">
					        <label className="uk-form-label">模式</label>
					        <div className="uk-form-controls" >
					        	<select id="automode" name="automode" defaultValue="0">
					        		<option value="0" >自动计划</option>
					        		<option value="1" >手动计划</option>
					        	</select>
					        </div>
					    </div>
					    <div className="uk-form-row">
							<label className="uk-form-label">工期(小时)</label>
					        <div className="uk-form-controls">
					        	<input name="duration" type="text" value="8" placeholder="请填写预估工期"/>		        	
					        </div>
					    </div>
					    <div className="uk-form-row" >
					    	<label className="uk-form-label">{{ _('Start time')}}</label>
					    	<div className="uk-form-controls">
					        	<input type="text" name="start_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}"/>
					        </div>
					    </div>
					    <div className="uk-form-row" >
					    	<label className="uk-form-label">{{ _('End time')}}</label>
					    	<div className="uk-form-controls">
					        	<input type="text" name="end_time" data-uk-datepicker="{weekstart:0, format:'YYYY-MM-DD'}"/>
					        </div>
					    </div>
					    <div className="uk-form-row">
					        <label className="uk-form-label">难度</label>
					        <div className="uk-form-controls" >
					        	<select id="difficulty" name="difficulty" defaultValue="0">
					        		<option value="0" >简单</option>
					        		<option value="1" >一般</option>
					        		<option value="2" >有点难度</option>
					        		<option value="3" >难</option>
					        	</select>
					        </div>
					    </div>
					    <div className="uk-form-row">
					        <label className="uk-form-label">说明</label>
					        <div className="uk-form-controls" >
					        	<textarea  name="details" className="uk-width-1-1" style={styles.multilines}>
			    				</textarea>
					        </div>
					    </div>
					    <div className="uk-form-row uk-clearfix">
					        <button  type="submit" className="uk-button-primary uk-button-large uk-width-medium uk-align-center" >
					        	<i className="uk-icon-check uk-icon-medium"></i> {{ _('Save') }}
					        </button>
					    </div>
				    
		    		</fieldset>
				</form>
			</div>
			)
	}
});

var styles = {
	line: {
		marginTop: "20px"
	},
	label: {
		width: "50px"
	},
	controls: {
		marginLeft: "20px"
	},
	block: {
		padding: "20px"
	},
	multilines: {
		height:"120px"
	}
};

var DivTip = React.createClass({
	render: function(){
		return <div className="uk-alert uk-alert-danger uk-hidden"></div>
	}
})

var FormRowText = React.createClass({
	render: function(){
		return (
			<div className="uk-form-row" style={styles.line}>
		        <label className="uk-form-label">{this.props.label}</label>
		        <div className="uk-form-controls">
		        	<FieldTextInput name={this.props.name} autofocus={this.props.autofocus||"false"}/>		        	
		        </div>
		        <p className="help-text">{this.props.help}</p>
		    </div>
			)
	}
});

var FormRowRadio = React.createClass({
	render: function(){
		return (
			<div className="uk-form-row" style={styles.line}>
		        <label className="uk-form-label">{this.props.label}</label>
		        <div className="uk-form-controls">
		        	<FieldTextInput name={this.props.name} autofocus={this.props.autofocus||"false"}/>		        	
		        </div>
		        <p className="help-text">{this.props.help}</p>
		    </div>
			)
	}
});

var FieldTextInput = React.createClass({
	render: function(){
		return <input  name={this.props.name} type="text" className="uk-width-1-1" autofocus={this.props.autofocus=="true"}/>
		/*if(this.props.autofocus=="true"){
			return ( <input  name={this.props.name} type="text" className="uk-width-1-1" autofocus/>)
		}else{
			return ( <input  name={this.props.name} type="text" className="uk-width-1-1" />)
		}*/
	}
});

