"use strict";var TaskTabView=React.createClass({displayName:"TaskTabView",render:function(){var e=this.props.task,t=this.props.difficulties,a=[];return e.rely.forEach(function(e,t){a.push(this.props.project.TaskMap[e].name)}.bind(this)),React.createElement("div",null,React.createElement("table",{className:"uk-table dv-border"},React.createElement("tbody",null,React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"任务名称："),React.createElement("td",{className:"uk-width-3-10"},e.name),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"状态："),React.createElement("td",{className:"uk-width-3-10"},taskStatusMap[e.status])),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"执行人："),React.createElement("td",{className:"uk-width-3-10"},e.executor_name),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"工作审核人："),React.createElement("td",{className:"uk-width-3-10"},e.manager_name)),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划工期(小时)："),React.createElement("td",{className:"uk-width-3-10"},e.plan_duration),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际工期(小时)："),React.createElement("td",{className:"uk-width-3-10"},e.duration)),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划模式："),React.createElement("td",{className:"uk-width-3-10"},0===e.automode?"自动":"手动"),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"任务难度："),React.createElement("td",{className:"uk-width-3-10"},t[e.difficulty])),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划开始时间："),React.createElement("td",{className:"uk-width-3-10"},formatDate(e.plan_start_time)),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际开始时间："),React.createElement("td",{className:"uk-width-3-10"},0!==e.start_time?formatDate(e.start_time):"无"," ")),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划结束时间："),React.createElement("td",{className:"uk-width-3-10"},formatDate(e.plan_end_time)),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际结束时间："),React.createElement("td",{className:"uk-width-3-10"},0!==e.end_time?formatDate(e.end_time):"无")),React.createElement("tr",null,React.createElement("td",{className:"uk-block-muted"},"前置任务:"),React.createElement("td",null,a.toString()||"无"),React.createElement("td",{className:"uk-block-muted"},"进度:"),React.createElement("td",null,e.percent,"%")),React.createElement("tr",{className:e.isLeaf()?"uk-hidden":""},React.createElement("td",{className:"uk-block-muted"},"下属总工期:"),React.createElement("td",{colSpan:"3"},e.total_duration,"小时")),React.createElement("tr",null,React.createElement("td",{className:"uk-block-muted"},"任务说明:"),React.createElement("td",{colSpan:"3"},e.details)))))}}),TaskTabEdit=React.createClass({displayName:"TaskTabEdit",correctErrMsg:function(e){var t={duration:"工期最长为256小时",master:"请选择项目负责人"};e instanceof Array?_.each(e,function(e,a){t.hasOwnProperty(e.data)&&(e.message=t[e.data])}):t.hasOwnProperty(e.data)&&(e.message=t[e.data])},relyInLoop:function(e){for(var t=0;t<e.length;t++){var a=e[t];if(a===this.props.task.id)return!0;if(this.relyInLoop(this.props.project.TaskMap[a].rely))return!0}return!1},getPostData:function(){console.log(this.refs.plan_start_time.value),console.log(this.refs.plan_end_time.value),console.log(new Date(this.state.plan_end_time));var e=toDateTime(this.refs.plan_start_time.value||0),t=toDateTime(this.refs.plan_end_time.value||0),a=parseInt(this.refs.automode.value);console.log("start:"+e),console.log("end:"+t),1===a?(e=wd_formatStart(e),t=wd_formatEnd(t)):(e=this.state.plan_start_time,t=this.state.plan_end_time),console.log("start:"+e),console.log("end:"+t);var s=[],l=this.props.task.index,n=this.props.project.tasks.length-1;if(console.log(this.state.relies.split(",")),this.state.relies.split(",").forEach(function(e,t){if(e){var a=parseInt(e);if(a===l)throw{error:"invalid parameter",data:"rely_to",message:"不能把自身设置为前置任务"};if(a>n)throw{error:"invalid parameter",data:"rely_to",message:"不能指定不存在的任务"+e+"作为前置任务"};s.push(this.props.project.tasks[a].id)}}.bind(this)),this.relyInLoop(s))throw{error:"invalid parameter",data:"rely_to",message:"前置任务导致死循环依赖"};var i={name:this.refs.name.value.trim(),executor_id:this.refs.executor.value,manager_id:this.refs.manager.value,plan_duration:parseInt(this.refs.plan_duration.value),plan_start_time:e,automode:a,plan_end_time:t,difficulty:parseInt(this.refs.difficulty.value),details:this.refs.details.value,relyTo:s};if(console.log(i),validateJsonObj("editTask",i)){if(i.start_time>i.end_time)throw{error:"invalid parameter",data:"end_time",message:"结束时间应该大于开始时间"};if(0==i.automode&&0===s.length)throw{error:"invalid parameter",data:"rely_to",message:"计划模式为自动时，需要设置依赖任务"};return i}},handleSubmit:function(e){e.preventDefault();var t,a="modal_task_"+this.props.task.id+"_edit",s=$("#"+a).find("form");try{t=this.getPostData(),s.showFormError()}catch(e){return this.correctErrMsg(e),void s.showFormError(e)}s.postJSON("/api/project/task/"+this.props.task.id,t,function(e,a){if(!e){var s=this.props.task,l=this.props.project,n=s.plan_start_time!==t.plan_start_time||s.plan_end_time!==t.plan_end_time;if(s.name=t.name,s.plan_start_time=t.plan_start_time,s.plan_end_time=t.plan_end_time,s.automode=t.automode,s.plan_duration=t.plan_duration,s.difficulty=t.difficulty,s.details=t.details,s.executor_id=t.executor_id,s.manager_id=t.manager_id,s.executor_name=l.UserMap[t.executor_id].name,s.manager_name=l.UserMap[t.manager_id].name,s.rely=t.relyTo,this.setState({plan_start_time:t.plan_start_time,plan_end_time:t.plan_end_time}),n){var i=[];this.updateRelyChildren(i,s.id),i.length>0&&postJSON("/api/project/tasklist/updateplan",i,function(e,t){e?fatal(e):console.log("update all task's plan OK!")})}this.props.hideModal(),this.props.onTaskChanged()}}.bind(this))},updateRelyChildren:function(e,t){console.log("updateRelyChildren");for(var a=this.props.project.tasks,s=this.props.project.TaskMap,l=s[t],n=0;n<a.length;n++){var i=a[n];-1!==i.rely.indexOf(t)&&0===i.automode&&i.isCompleted===!1&&i.plan_start_time!==l.plan_end_time&&(i.plan_start_time=l.plan_end_time,i.plan_end_time=wd_after(l.plan_end_time,i.plan_duration),e.push({id:i.id,plan_start_time:i.plan_start_time,plan_end_time:i.plan_end_time}),this.updateRelyChildren(e,i.id))}},getInitialState:function(){return{automode:this.props.task.automode,relies:"",plan_start_time:this.props.task.plan_start_time,plan_end_time:this.props.task.plan_end_time,plan_duration:this.props.task.plan_duration}},resetRelies:function(){var e=[];this.props.task.rely.forEach(function(t,a){e.push(this.props.project.TaskMap[t].index)}.bind(this)),this.setState({relies:e.toString()})},componentWillMount:function(){this.resetRelies()},resetPlanTime:function(e,t,a){var s=[],l=this.props.task.index;if(t.split(",").forEach(function(e,t){e&&e!=l&&s.push(parseInt(e))}),0==e&&s.length>0){var n,i=this.props.project.tasks,r=0;s.forEach(function(e,t){if(i.length>e){console.log(e);var a=i[e];console.log(a),r=a.isCompleted?Math.max(a.end_time,r):Math.max(a.plan_end_time,r)}}.bind(this)),console.log(new Date(r)),n=wd_after(r,a),console.log(new Date(n)),this.setState({plan_start_time:r}),this.setState({plan_end_time:n})}},onDurationChanged:function(e){var t=e.target.value;this.setState({plan_duration:parseInt(t)}),this.resetPlanTime(this.state.automode,this.state.relies,parseInt(t))},onAutoModeChanged:function(e){var t=e.target.value;this.setState({automode:parseInt(t)});var a=0==t?!0:!1;this.refs.plan_start_time.disabled=a,this.refs.plan_end_time.disabled=a,this.resetPlanTime(parseInt(t),this.state.relies,this.state.plan_duration)},onPlanStartTimeChanged:function(e){this.setState({plan_start_time:toDateTime(e.target.value)})},onPlanEndTimeChanged:function(e){this.setState({plan_end_time:toDateTime(e.target.value)})},onRelyChanged:function(e){var t=e.target.value,a=/^[0-9\,]{0,99}$/;a.test(t)&&(this.setState({relies:t}),this.resetPlanTime(this.state.automode,t,this.state.plan_duration))},resetForm:function(e){e.preventDefault();var t=this.props.task;this.refs.name.value=t.name,this.refs.executor.value=t.executor_id,this.refs.manager.value=t.manager_id,this.refs.difficulty.value=t.difficulty,this.refs.details.value=t.details,this.setState({plan_duration:t.plan_duration,automode:t.automode,plan_start_time:t.plan_start_time,plan_end_time:t.plan_end_time}),this.resetRelies()},render:function(){var e=this.props.task,t=this.props.difficulties,a={height:"60px"};return React.createElement("div",{id:"modal_task_"+e.id+"_edit"},React.createElement("form",{onSubmit:this.handleSubmit},React.createElement("div",{className:"uk-alert uk-alert-danger uk-hidden"}),React.createElement("table",{className:"uk-table dv-border"},React.createElement("tbody",null,React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"任务名称："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("input",{name:"name",type:"text",ref:"name",className:"uk-width-1-1",autofucus:!0,placeholder:"3-50字符",defaultValue:e.name,maxLength:"50"})),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划工期(小时)："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("input",{type:"number",min:"0",max:"256",name:"plan_duration",ref:"plan_duration",className:"uk-width-1-1",placeholder:"填入整数",value:this.state.plan_duration,onChange:this.onDurationChanged}))),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"执行人："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("select",{name:"executor",ref:"executor",className:"uk-width-1-1",defaultValue:e.executor_id},this.props.project.members.map(function(e){return React.createElement("option",{key:e.user_id,value:e.user_id},e.name)}))),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"工作审核人："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("select",{name:"manager",ref:"manager",className:"uk-width-1-1",defaultValue:e.manager_id},this.props.project.members.map(function(e){return React.createElement("option",{key:e.user_id,value:e.user_id},e.name)})))),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划模式："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("select",{name:"automode",ref:"automode",className:"uk-width-1-1",value:this.state.automode,onChange:this.onAutoModeChanged},React.createElement("option",{value:"0"},"自动"),React.createElement("option",{value:"1"},"手动"))),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"任务难度："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("select",{name:"difficulty",ref:"difficulty",className:"uk-width-1-1",defaultValue:e.difficulty},t.map(function(e,t){return React.createElement("option",{key:t,value:t},e)})))),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划开始时间："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("div",{className:"uk-form-icon uk-width-1-1"},React.createElement("i",{className:"uk-icon-calendar"}),React.createElement("input",{type:"text",name:"plan_start_time",className:"uk-width-1-1",ref:"plan_start_time","data-uk-datepicker":"{weekstart:0, format:'YYYY-MM-DD'}",value:formatDate(this.state.plan_start_time),onChange:this.onPlanStartTimeChanged}))),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际开始时间："),React.createElement("td",{className:"uk-width-3-10"},formatDate(e.start_time))),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划结束时间："),React.createElement("td",{className:"uk-width-3-10"},React.createElement("div",{className:"uk-form-icon uk-width-1-1"},React.createElement("i",{className:"uk-icon-calendar"}),React.createElement("input",{type:"text",name:"plan_end_time",className:"uk-width-1-1",ref:"plan_end_time","data-uk-datepicker":"{weekstart:0, format:'YYYY-MM-DD'}",value:formatDate(this.state.plan_end_time),onChange:this.onPlanEndTimeChanged}))),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际结束时间："),React.createElement("td",{className:"uk-width-3-10"},formatDate(e.end_time))),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"前置任务："),React.createElement("td",{colSpan:"3"},React.createElement("input",{type:"text",name:"rely_to",className:"uk-width-1-1",ref:"rely_to",value:this.state.relies,onChange:this.onRelyChanged}))),React.createElement("tr",null,React.createElement("td",{className:"uk-block-muted"},"任务说明:"),React.createElement("td",{colSpan:"3"},React.createElement("textarea",{ref:"details",name:"details",className:"uk-width-1-1",style:a,defautValue:e.details}))))),React.createElement("div",{className:"uk-modal-footer uk-text-right"},React.createElement("div",{className:"uk-grid"},React.createElement("div",{className:"uk-width-1-2 uk-text-left"},React.createElement("button",{onClick:this.resetForm,className:"uk-button"},"重置")),React.createElement("div",{className:"uk-width-1-2 uk-text-right"},React.createElement("button",{type:"submit",className:"uk-button uk-button-primary"},"保存"))))))}}),TaskTabLog=React.createClass({displayName:"TaskTabLog",onTaskChanged:function(e){},reset:function(e){},render:function(){var e={marginTop:"50px"},t=this.props.task;return React.createElement("div",null,React.createElement(TaskFlow,{task:t,onTaskChanged:this.onTaskChanged,resetDialog:this.reset}),React.createElement("div",{style:e}),React.createElement(TaskDailyList,{task:t}))}}),TaskDialog=React.createClass({displayName:"TaskDialog",getInitialState:function(){return{task_id:"root",tab:"view"}},onSwitch:function(e){this.setState({tab:e})},showModal:function(){if(this.props.task){var e="modal_task_"+this.props.task.id,t=new UIkit.modal("#"+e);t.show()}},hideModal:function(){var e="modal_task_"+this.props.task.id,t=new UIkit.modal("#"+e);t.hide()},componentDidMount:function(){this.showModal()},componentDidUpdate:function(){this.showModal()},render:function(){var e=this.props.task,t=["简单","普通","困难"];return React.createElement("div",{className:"uk-modal-dialog uk-modal-dialog-large"},React.createElement("a",{href:"#",className:"uk-modal-close uk-close uk-close-alt"}),React.createElement("div",{className:"uk-modal-header"},React.createElement("h2",null,"任务：",e.name)),React.createElement("div",null,React.createElement("div",{className:"uk-grid"},React.createElement("div",{className:"uk-width-medium-1-10"},React.createElement("ul",{className:"uk-tab uk-tab-left","data-uk-tab":"{connect:'#tab-"+e.id+"'}"},this.props.tabs.map(function(t){return"edit"===t.type&&e.manager_id!==ENV.user.id&&this.props.project.master_id!==ENV.user.id?null:React.createElement("li",{key:"tab_view_"+t.type,id:"tab_view_"+e.id,className:this.state.tab==t.type?"uk-active":"",onClick:this.onSwitch.bind(this,t.type)},React.createElement("a",{href:"#"},t.title))}.bind(this)))),React.createElement("div",{className:"uk-width-medium-9-10"},React.createElement("ul",{id:"tab-"+e.id,className:"uk-switcher"},React.createElement("li",{className:"view"==this.state.tab?"uk-active":""},React.createElement(TaskTabView,{task:e,difficulties:t,project:this.props.project})),e.manager_id===ENV.user.id||this.props.project.master_id===ENV.user.id?React.createElement("li",{className:"edit"==this.state.tab?"uk-active":""},React.createElement(TaskTabEdit,{task:e,difficulties:t,project:this.props.project,hideModal:this.hideModal,onTaskChanged:this.props.onTaskChanged})):null,React.createElement("li",{className:"log"==this.state.tab?"uk-active":""},React.createElement(TaskTabLog,{task:e})))))))}});