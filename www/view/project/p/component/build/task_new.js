"use strict";var NewTaskDlg=React.createClass({displayName:"NewTaskDlg",correctErrMsg:function(e){var t={end_time:"请选择结束时间",master:"请选择项目负责人"};_.each(e,function(e,a){t.hasOwnProperty(e.data)&&!e.message&&(e.message=options.error_msgs[e.data])})},resetFields:function(){var e=this.props.users.length>0?this.props.users[0].id:"0";this.refs.name.value="",this.refs.executor.value=e,this.refs.duration.value=0,this.refs.automode.value=0,this.refs.start_time.value=formatNow(),this.refs.end_time.value=formatNow(),this.refs.rely_to.value="",this.refs.difficulty.value=0,this.refs.details.value="",this.refs.start_time.disabled=!0,this.refs.end_time.disabled=!0;var t=Date.now();this.setState({automode:0,relies:"",duration:0,start_time:t,end_time:t,executor:e})},getPostData:function(){var e=this.refs.name.value.trim(),t=this.refs.executor.value,a=parseInt(this.refs.duration.value),r=parseInt(this.refs.automode.value),s=toDateTime(this.refs.start_time.value||0),i=toDateTime(this.refs.end_time.value||0),l=parseInt(this.refs.difficulty.value),n=this.refs.details.value,o=[],m=this.props.project.tasks.length-1;1===r?(s=wd_formatStart(s),i=wd_formatEnd(i)):(s=this.state.start_time,i=this.state.end_time),this.state.relies.split(",").forEach(function(e,t){if(e){var a=parseInt(e);if(a>m)throw{error:"invalid parameter",data:"rely_to",message:"不能指定不存在的任务"+e+"作为前置任务"};o.push(this.props.project.tasks[a].id)}}.bind(this));var c={name:e,parent:this.props.parent,executor:t,duration:a,start_time:s,automode:r,end_time:i,difficulty:l,details:n,relyTo:o};if(console.log(c),validateJsonObj("createTask",c)){if(c.start_time>c.end_time)throw{error:"invalid parameter",data:"end_time",message:"结束时间应该大于开始时间"};if(0==c.automode&&0===o.length)throw{error:"invalid parameter",data:"rely_to",message:"计划模式为自动时，需要设置依赖任务"};return c}},handleSubmit:function(e){e.preventDefault();var t,a=$("#modal_new_task").find("form");try{t=this.getPostData(),a.showFormError()}catch(e){return this.correctErrMsg(e),void a.showFormError(e)}a.postJSON("/api/project/p/"+this.props.project.id+"/task",t,function(e,t){if(!e){this.resetFields(),this.props.onNewTask(t.id);var a=UIkit.modal("#modal_new_task");a.hide()}}.bind(this))},resetPlanTime:function(e,t,a){var r=[];if(t.split(",").forEach(function(e,t){e&&r.push(parseInt(e))}),0==e&&r.length>0){var s,i=this.props.project.tasks,l=0;r.forEach(function(e,t){if(i.length>e){var a=i[e];l=a.isCompleted?Math.max(a.end_time,l):Math.max(a.plan_end_time,l)}}.bind(this)),s=wd_after(l,a),this.setState({start_time:l}),this.setState({end_time:s})}},getInitialState:function(){var e=Date.now();return{automode:0,relies:"",duration:0,start_time:e,end_time:e,executor:"0"}},onDurationChanged:function(e){var t=e.target.value;this.setState({duration:parseInt(t)}),this.resetPlanTime(this.state.automode,this.state.relies,parseInt(t))},onStartTimeChanged:function(e){this.setState({start_time:toDateTime(e.target.value)})},onEndTimeChanged:function(e){this.setState({end_time:toDateTime(e.target.value)})},executorChanged:function(e){this.setState({executor:e.target.value})},onAutoModeChanged:function(e){var t=e.target.value;this.setState({automode:parseInt(t)});var a=0==t?!0:!1;this.refs.start_time.disabled=a,this.refs.end_time.disabled=a,this.resetPlanTime(parseInt(t),this.state.relies,this.state.duration)},onRelyChanged:function(e){var t=e.target.value,a=/^[0-9\,]{0,99}$/;console.log(t),a.test(t)&&(this.setState({relies:t}),this.resetPlanTime(this.state.automode,t,this.state.duration))},componentDidMount:function(){this.resetFields();var e=UIkit.datepicker(this.refs.start_time,{weekstart:0,format:"YYYY-MM-DD"});e.on("change",this.onStartTimeChanged),e=UIkit.datepicker(this.refs.end_time,{weekstart:0,format:"YYYY-MM-DD"}),e.on("change",this.onEndTimeChanged)},render:function(){var e={height:"150px"};return React.createElement("div",{id:"modal_new_task",className:"uk-modal uk-text-left"},React.createElement("div",{className:"uk-modal-dialog"},React.createElement("a",{href:"",className:"uk-modal-close uk-close uk-close-alt"}),React.createElement("div",{className:"uk-modal-header "},React.createElement("h2",null,"创建新任务")),React.createElement("div",null,React.createElement("form",{className:"uk-form uk-form-stacked uk-form-horizontal"},React.createElement("fieldset",null,React.createElement("div",{className:"uk-alert uk-alert-danger uk-hidden"}),React.createElement("div",{className:"uk-form-row uk-width-2-3"},React.createElement("label",{className:"uk-form-label"},"名称"),React.createElement("div",{className:"uk-form-controls"},React.createElement("input",{name:"name",type:"text",ref:"name",className:"uk-width-1-1",autofucus:!0,placeholder:"3-50字符",defaultValue:"",maxLength:"50"}))),React.createElement("div",{className:"uk-form-row uk-width-2-3"},React.createElement("label",{className:"uk-form-label"},"父任务"),React.createElement("div",{className:"uk-form-controls"},React.createElement("span",null,"root"==this.props.parent?"无":this.props.project.TaskMap[this.props.parent].name))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"负责人"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("select",{name:"executor",ref:"executor",className:"uk-width-1-1",value:this.state.executor,onChange:this.executorChanged},this.props.users.map(function(e){return React.createElement("option",{key:e.user_id,value:e.user_id},e.name)})))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"计划工期（小时）"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("input",{type:"number",name:"duration",ref:"duration",min:"0",max:"256",placeholder:"填入整数",value:this.state.duration,onChange:this.onDurationChanged}))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"计划模式"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("select",{name:"automode",ref:"automode",className:"uk-width-1-1",value:this.state.automode,onChange:this.onAutoModeChanged},React.createElement("option",{value:"0"},"自动"),React.createElement("option",{value:"1"},"手动")))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"计划开始时间"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("div",{className:"uk-form-icon"},React.createElement("i",{className:"uk-icon-calendar"}),React.createElement("input",{type:"text",name:"start_time",ref:"start_time",disabled:!0,value:formatDate(this.state.start_time),onChange:this.onStartTimeChanged})))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"计划结束时间"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("div",{className:"uk-form-icon"},React.createElement("i",{className:"uk-icon-calendar"}),React.createElement("input",{type:"text",name:"end_time",ref:"end_time",disabled:!0,value:formatDate(this.state.end_time),onChange:this.onEndTimeChanged})))),React.createElement("div",{className:"uk-form-row uk-width-1-1"},React.createElement("label",{className:"uk-form-label"},"前置任务"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("input",{type:"text",name:"rely_to",ref:"rely_to",placeholder:"填写标识，用逗号分隔",value:this.state.relies,onChange:this.onRelyChanged}))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"任务难度"),React.createElement("div",{className:"uk-form-controls uk-width-1-3"},React.createElement("select",{name:"difficulty",ref:"difficulty",className:"uk-width-1-1"},React.createElement("option",{value:"0"},"简单"),React.createElement("option",{value:"1"},"普通"),React.createElement("option",{value:"2"},"困难")))),React.createElement("div",{className:"uk-form-row uk-width-1-1"},React.createElement("label",{className:"uk-form-label"},"任务说明"),React.createElement("div",{className:"uk-form-controls"},React.createElement("textarea",{ref:"details",name:"details",className:"uk-width-4-5",style:e,placeholder:"可暂时不填"})))))),React.createElement("div",{className:"uk-modal-footer uk-text-right"},React.createElement("button",{type:"button",onClick:this.handleSubmit,className:"uk-button uk-button-primary"},"保存"))))}});