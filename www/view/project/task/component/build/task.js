"use strict";var taskStatusMap={created:"待接收执行",doing:"正在执行",pending:"已暂停执行",cancel:"已取消",commit:"已提交，待审核",completed:"已完成"},TaskInfo=React.createClass({displayName:"TaskInfo",render:function(){var e=this.props.task,t=["简单","普通","困难"];return React.createElement("div",null,React.createElement("h2",null,"基本信息"),React.createElement("table",{className:"uk-table dv-border"},React.createElement("tbody",null,React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"任务名称："),React.createElement("td",{className:"uk-width-3-10"},e.name),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"状态："),React.createElement("td",{className:"uk-width-3-10"},taskStatusMap[e.status])),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"执行人："),React.createElement("td",{className:"uk-width-3-10"},e.executor_name),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"工作审核人："),React.createElement("td",{className:"uk-width-3-10"},e.manager_name)),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划工期(小时)："),React.createElement("td",{className:"uk-width-3-10"},e.plan_duration),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际工期(小时)："),React.createElement("td",{className:"uk-width-3-10"},e.duration)),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划模式："),React.createElement("td",{className:"uk-width-3-10"},0===e.automode?"自动":"手动"),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"任务难度："),React.createElement("td",{className:"uk-width-3-10"},t[e.difficulty])),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划开始时间："),React.createElement("td",{className:"uk-width-3-10"},formatDate(e.plan_start_time)),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际开始时间："),React.createElement("td",{className:"uk-width-3-10"},0===e.start_time?"无":formatDate(e.start_time)," ")),React.createElement("tr",null,React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"计划结束时间："),React.createElement("td",{className:"uk-width-3-10"},formatDate(e.plan_end_time)),React.createElement("td",{className:"uk-width-2-10 uk-block-muted"},"实际结束时间："),React.createElement("td",{className:"uk-width-3-10"},0===e.end_time?"无":formatDate(e.end_time))),React.createElement("tr",null,React.createElement("td",{className:"uk-block-muted"},"任务说明:"),React.createElement("td",{colSpan:"3"},e.details)))))}}),ActionOnStatus={created:{executor:["accept","reply"],manager:["confirm","reply","cancel"]},doing:{executor:["commit","reply"],manager:["reply","pause","cancel"]},commit:{executor:["reply"],manager:["complete","reopen"]},pending:{executor:["reply"],manager:["resume","cancel","reply"]},cancel:{executor:["reply"],manager:["reply"]},completed:{executor:["reply"],manager:["reply"]}},ACTIONMAP={confirm:"确认要求",understand:"已理解要求",accept:"接收任务",reply:"回复",commit:"提交",pause:"暂停执行",cancel:"取消任务",complete:"完成",reopen:"继续执行",resume:"恢复执行"},TaskFlow=React.createClass({displayName:"TaskFlow",loadFlow:function(){getJSON("/api/project/t/"+this.props.task.id+"/listFlow",function(e,t){e?fatal(e):this.setState({flows:t})}.bind(this))},changeAction:function(e){this.setState({actionType:e.target.value}),console.log(e.target.value)},getPostData:function(){var e={action:this.state.actionType,reply:this.refs.reply.value||""};if("accept"!==e.action&&0===e.reply.length)throw{error:"invalid parameter",data:"reply",message:"请填写必要的备注说明，如原因或提交信息"};return e},handleSubmitFlow:function(e){e.preventDefault();var t,a=this.props.task.id,c="form-flow-"+a,l=$("#"+c).find("form");try{t=this.getPostData(),l.showFormError()}catch(e){return void l.showFormError(e)}l.postJSON("/api/project/t/"+a+"/flow",t,function(e,t){e||(this.resetFields(),this.loadFlow(),getJSON("/api/project/task/"+a,function(e,t){this.setState({actionType:"reply"}),e||this.props.task.status===t.status||this.props.resetDialog(t)}.bind(this)))}.bind(this))},resetFields:function(){this.refs.reply.value=""},haveFlow:function(e){for(var t=this.state.flows,a=0;a<t.length;a++)if(t[a].action===e)return!0;return!1},getFlowProgressClass:function(){for(var e=["accept","do","commit","complete","cancel"],t={},a=this.props.task,c=0;c<e.length;c++)t[e[c]]="dv-badge-muted";return t.cancel="uk-hidden",this.haveFlow("accept")?t.accept="uk-badge-success":"created"===a.status&&(t.accept="uk-badge-warning"),"doing"===a.status?t["do"]="uk-badge-warning":this.haveFlow("commit")&&(t["do"]="uk-badge-success"),"commit"===a.status?t.commit="uk-badge-warning":this.haveFlow("commit")&&"doing"!==a.status&&(t.commit="uk-badge-success"),"completed"===a.status&&(t.complete="uk-badge-success"),"cancel"===a.status&&(t.cancel="uk-badge uk-badge-danger"),t},getInitialState:function(){return{flows:[],actionType:"reply"}},componentDidMount:function(){this.loadFlow()},render:function(){var e,t=this.props.task,a=[],c=[],l={marginLeft:"15px"},n={marginLeft:"5px"},s={height:"60px"},r=this.getFlowProgressClass();if(t.executor_id===ENV.user.id&&(a=a.concat(ActionOnStatus[t.status].executor)),t.manager_id===ENV.user.id){var m=ActionOnStatus[t.status].manager;for(e=0;e<m.length;e++)-1===a.indexOf(m[e])&&a.push(m[e])}for(0===a.length&&a.push("reply"),e=0;e<a.length;e++){var i=a[e];c.push(React.createElement("label",{key:e,style:l},React.createElement("input",{type:"radio",checked:this.state.actionType===i,onChange:this.changeAction,name:"action",key:i,value:i}),ACTIONMAP[i]))}return React.createElement("div",null,React.createElement("h2",null,"工作流"),React.createElement("div",null,React.createElement("span",{className:"uk-badge uk-badge-success",style:n},"创建"),React.createElement("span",{className:"uk-badge "+r.accept,style:n},"接收"),React.createElement("span",{className:"uk-badge "+r["do"],style:n},"执行"),React.createElement("span",{className:"uk-badge "+r.commit,style:n},"提交"),React.createElement("span",{className:"uk-badge "+r.complete,style:n},"完成"),React.createElement("span",{className:r.cancel,style:n},"取消")),React.createElement("table",{className:"uk-table"+(0===this.state.flows.length?" uk-hidden":"")},React.createElement("thead",null,React.createElement("tr",null,React.createElement("th",{className:"uk-width-1-10"},"序号"),React.createElement("th",{className:"uk-width-1-10"},"操作"),React.createElement("th",{className:"uk-width-1-10"},"用户"),React.createElement("th",{className:"uk-width-2-10"},"时间"),React.createElement("th",{className:"uk-width-5-10"},"回复信息"))),React.createElement("tbody",null,this.state.flows.map(function(e,t){return React.createElement("tr",{key:t},React.createElement("td",null,t),React.createElement("td",null,ACTIONMAP[e.action]),React.createElement("td",null,e.user_name),React.createElement("td",null,formatDate(e.created_at)),React.createElement("td",null,e.reply))}.bind(this)))),React.createElement("div",{id:"form-flow-"+t.id},React.createElement("form",{onSubmit:this.handleSubmitFlow,className:"uk-form uk-form-stacked uk-form-horizontal"},React.createElement("fieldset",null,React.createElement("div",{className:"uk-alert uk-alert-danger uk-hidden"}),React.createElement("legend",null,"追加工作流"),React.createElement("div",{className:"uk-form-row"},React.createElement("label",{className:"uk-form-label"},"选择操作类型："),React.createElement("div",{className:"uk-form-controls uk-form-controls-text"},c)),React.createElement("div",{className:"uk-form-row uk-width-1-1"},React.createElement("label",{className:"uk-form-label"},"备注说明："),React.createElement("div",{className:"uk-form-controls"},React.createElement("textarea",{ref:"reply",name:"reply",className:"uk-width-2-3",style:s,placeholder:""}))),React.createElement("div",{className:"uk-form-row uk-width-2-3 uk-text-center"},React.createElement("button",{type:"submit",className:"uk-button uk-button-primary"},"提交"))))))}}),TaskDailyList=React.createClass({displayName:"TaskDailyList",loadFlow:function(){getJSON("/api/project/t/"+this.props.task.id+"/daily",function(e,t){e?fatal(e):this.setState({daily:t})}.bind(this))},componentWillMount:function(){this.loadFlow()},getInitialState:function(){return{daily:[]}},render:function(){return React.createElement("div",null,React.createElement("h2",null,"进展日志"),React.createElement("table",{className:"uk-width-1-1 uk-table"},React.createElement("thead",null,React.createElement("tr",null,React.createElement("th",{className:"uk-width-2-10"},"时间"),React.createElement("th",{className:"uk-width-1-10"},"执行人"),React.createElement("th",{className:"uk-width-1-10"},"用时"),React.createElement("th",{className:"uk-width-3-10"},"当日工作"),React.createElement("th",{className:"uk-width-2-10"},"明日计划"))),React.createElement("tbody",null,this.state.daily.map(function(e,t){return React.createElement("tr",{key:t},React.createElement("td",null,formatDate(e.time,!0)),React.createElement("td",null,e.user_name),React.createElement("td",null,e.duration,"小时"),React.createElement("td",null,e.report),React.createElement("td",null,e.plan))}.bind(this)),React.createElement("tr",{className:this.state.daily.length>0?"uk-hidden":""},React.createElement("td",{colSpan:"5"},"无记录")))))}}),TaskDialog=React.createClass({displayName:"TaskDialog",showModal:function(){if(this.props.task){var e="modal_task_"+this.props.task.id,t=new UIkit.modal("#"+e);t.show()}},hideModel:function(){if(this.props.task){var e="modal_task_"+this.props.task.id,t=new UIkit.modal("#"+e);t.hide()}},reset:function(e){if(this.props.task){var t="modal_task_"+this.props.task.id,a=new UIkit.modal("#"+t);a.on({"hide.uk.modal":function(t){this.props.onTaskChanged(e)}.bind(this)}),a.hide()}},componentDidMount:function(){this.showModal()},componentDidUpdate:function(){this.showModal()},render:function(){var e=this.props.task,t={marginTop:"50px"};return React.createElement("div",{className:"uk-modal-dialog uk-modal-dialog-large"},React.createElement("a",{href:"#",className:"uk-modal-close uk-close uk-close-alt"}),React.createElement("div",{className:"uk-modal-header"},React.createElement("h2",null,"任务：",e.name)),React.createElement("div",null,React.createElement(TaskInfo,{task:e}),React.createElement("div",{style:t}),React.createElement(TaskFlow,{task:e,onTaskChanged:this.props.onTaskChanged,resetDialog:this.reset}),React.createElement("div",{style:t}),React.createElement(TaskDailyList,{task:e})))}});