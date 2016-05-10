"use strict";var styles={smallBottomMargin:{marginBottom:"2px"},toolbar:{marginTop:"20px"},areaHeight:{height:"120px"},tableBorder:{borderCollapse:"collapse"}},ReportDialog=React.createClass({displayName:"ReportDialog",showModal:function(){if(this.props.task){var e="modal_task_daily_"+this.props.task.id,t=new UIkit.modal("#"+e);t.show()}},hideModel:function(){if(this.props.task){var e="modal_task_daily_"+this.props.task.id,t=new UIkit.modal("#"+e);t.hide()}},handleSubmit:function(e){e.preventDefault();var t=this.props.task,a=t.id,l=t.daily,s="form-daily-"+a,n=$("#"+s).find("form"),r=parseInt(this.refs.percent.value),i={task_id:a,duration:parseInt(this.refs.duration.value),report:this.refs.report.value,plan:this.refs.plan.value,time:this.props.dayTime,percent:r>100?100:0>r?0:r},c="/api/project/daily/"+(l.id?l.id:"creation");n.postJSON(c,i,function(e,a){e||(l.id||(l.id=a.id,l.task_id=t.id,l.time=i.time),l.report=i.report,l.plan=i.plan,l.duration=i.duration,this.props.onUpdate(),this.hideModel())}.bind(this))},componentDidMount:function(){this.showModal()},componentDidUpdate:function(){this.showModal()},render:function(){var e=this.props.task,t=e.daily,a=t.plan||"",l=t.report||"",s=t.duration||0;return React.createElement("div",{className:"uk-modal-dialog"},React.createElement("a",{href:"#",className:"uk-modal-close uk-close uk-close-alt"}),React.createElement("div",{className:"uk-modal-header"},React.createElement("h2",null,"修改任务日志：",e.name)),React.createElement("div",{id:"form-daily-"+e.id},React.createElement("form",{onSubmit:this.handleSubmit,className:"uk-form uk-form-stacked uk-form-horizontal"},React.createElement("fieldset",null,React.createElement("div",{className:"uk-alert uk-alert-danger uk-hidden"}),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"今日工作："),React.createElement("div",{className:"uk-form-controls uk-form-controls-text"},React.createElement("textarea",{ref:"report",name:"report",defaultValue:l,className:"uk-width-1-1",style:styles.areaHeight,placeholder:"填写今日工作"}))),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"今日用时："),React.createElement("div",{className:"uk-form-controls uk-form-controls-text"},React.createElement("input",{type:"number",name:"duration",ref:"duration",defaultValue:s,className:"uk-width-1-3",min:"0"}),"小时")),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"总计进度："),React.createElement("div",{className:"uk-form-controls uk-form-controls-text"},React.createElement("input",{type:"number",name:"percent",ref:"percent",defaultValue:e.percent,className:"uk-width-1-3",min:"0",max:"100"}),"%")),React.createElement("div",{className:"uk-form-row uk-width-1-1"},React.createElement("label",{className:"uk-form-label"},"明日计划："),React.createElement("div",{className:"uk-form-controls"},React.createElement("textarea",{ref:"plan",name:"plan",defaultValue:a,className:"uk-width-1-1",style:styles.areaHeight,placeholder:"填写明日计划工作"}))),React.createElement("div",{className:"uk-form-row uk-width-1-1 uk-text-center"},React.createElement("button",{type:"submit",className:"uk-button uk-button-primary"},"提交"))))))}}),TaskDaily=React.createClass({displayName:"TaskDaily",handleEdit:function(e){e.preventDefault();var t=this.props.task;ReactDOM.render(React.createElement(ReportDialog,{key:"key_task_daily_"+t.id+"_"+this.props.dayTime,task:t,dayTime:this.props.dayTime,onUpdate:this.onUpdate}),document.getElementById("modal_task_daily_"+t.id))},handleViewTask:function(e){e.preventDefault();var t=this.props.task;ReactDOM.render(React.createElement(TaskDialog,{task:t,onTaskChanged:this.onTaskChanged,role:"executor"}),document.getElementById("modal_task_"+t.id))},onTaskChanged:function(){},onUpdate:function(){this.setState({updateCnt:this.state.updateCnt+1})},getInitialState:function(){return{updateCnt:0}},render:function(){var e=this.props.task,t=e.daily,a=t.org_plan||"未填写",l=t.plan||"未填写",s=t.report||"未填写",n={marginLeft:"0px",paddingTop:"10px"},r={padding:"0",maxWidth:"310px"},i={padding:"0",maxWidth:"230px"};return React.createElement("tr",null,React.createElement("td",{className:"dv-border"},React.createElement("a",{onClick:this.handleViewTask,className:"uk-button-link dv-link"},e.name),React.createElement("div",{id:"modal_task_daily_"+e.id,className:"uk-modal"}),React.createElement("div",{id:"modal_task_"+e.id,className:"uk-modal"})),React.createElement("td",{className:"dv-border"},React.createElement("pre",{className:"dv-pre-clear",style:i},a)),React.createElement("td",{className:"dv-border"},React.createElement("pre",{className:"dv-pre-clear",style:r},s),t.duration?React.createElement("span",{style:n}," ","用时："+t.duration+"小时"):""),React.createElement("td",{className:"dv-border"},React.createElement("pre",{className:"dv-pre-clear",style:i},l)),React.createElement("td",{className:"dv-border"},React.createElement("a",{onClick:this.handleEdit,className:"dv-link"},React.createElement("i",{className:"uk-icon-small uk-icon-edit"}))))}}),MyDaily=React.createClass({displayName:"MyDaily",loadData:function(e){getJSON("/api/project/daily",{date:e},function(e,t){e?fatal(e):this.setState({tasks:t})}.bind(this))},previous:function(){var e=new Date(this.state.dayTime);e.setDate(e.getDate()-1);var t=e.getTime();this.setState({dayTime:t}),this.loadData(t)},next:function(){var e=new Date(this.state.dayTime);e.setDate(e.getDate()+1);var t=e.getTime();this.setState({dayTime:t}),this.loadData(t)},onTimeChanged:function(e){var t=toDateTime(e.target.value);this.setState({dayTime:t}),this.loadData(t)},getInitialState:function(){return{dayTime:Date.now(),tasks:[]}},componentDidMount:function(){var e=UIkit.datepicker(this.refs.time,{weekstart:0,format:"YYYY-MM-DD"});e.on("change",this.onTimeChanged),this.loadData(this.state.dayTime)},render:function(){var e={width:"80px"};return React.createElement("div",{className:"uk-width-1-1"},React.createElement("h2",{className:"uk-text-center"},React.createElement("b",null,"我的日志")),React.createElement("div",{style:styles.toolbar},React.createElement("ul",{className:"uk-pagination",style:styles.smallBottomMargin},React.createElement("li",{className:"uk-pagination-previous"},React.createElement("a",{onClick:this.previous},React.createElement("i",{className:"uk-icon-angle-double-left"}),"前一天")),React.createElement("li",{className:""},React.createElement("input",{type:"text",name:"time",ref:"time",style:e,value:formatDate(this.state.dayTime),onChange:this.onTimeChanged})),React.createElement("li",{className:"uk-pagination-next"},React.createElement("a",{onClick:this.next},"后一天",React.createElement("i",{className:"uk-icon-angle-double-right"}))))),React.createElement("hr",{className:"dv-hr"}),React.createElement("div",{className:"uk-accordion"},React.createElement("table",{className:"uk-width-1-1 uk-table",style:styles.tableBorder},React.createElement("thead",null,React.createElement("tr",null,React.createElement("th",{className:"dv-width-4-20"},"任务"),React.createElement("th",{className:"dv-width-4-20"},"今日计划"),React.createElement("th",{className:"dv-width-7-20"},"今日工作"),React.createElement("th",{className:"dv-width-4-20"},"明日计划"),React.createElement("th",{className:"dv-width-1-20"},"操作"))),React.createElement("tbody",null,this.state.tasks.map(function(e,t){return React.createElement(TaskDaily,{key:t,task:e,dayTime:this.state.dayTime})}.bind(this)))),React.createElement("div",{className:this.state.tasks.length>0?"uk-hidden":""},"无执行任务")))}});