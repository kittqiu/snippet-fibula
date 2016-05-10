"use strict";var ProjectTable=React.createClass({displayName:"ProjectTable",deleteProject:function(e){UIkit.modal.confirm("你确定要删除这个项目吗?",function(){postJSON("/api/project/p/"+e+"/delete",function(e,t){"ok"===t.result&&this.props.reloadData()}.bind(this))}.bind(this))},render:function(){return React.createElement("table",{className:"uk-width-1-1 uk-table"},React.createElement("thead",null,React.createElement("tr",null,React.createElement("td",null,"项目名称"),React.createElement("td",null,"负责人"),React.createElement("td",null,"开始时间"),React.createElement("td",null,"结束时间"),React.createElement("td",null,"操作"))),React.createElement("tbody",null,this.props.projects.map(function(e,t){return React.createElement("tr",{key:t},React.createElement("td",{className:"uk-width-3-10 uk-text-left"},React.createElement("b",null,React.createElement("a",{href:"/project/p/"+e.id+"/build",className:"dv-link"},e.name))),React.createElement("td",{className:"uk-width-1-10"},e.master_name),React.createElement("td",{className:"uk-width-1-10"},formatDate(e.start_time)),React.createElement("td",{className:"uk-width-1-10"},formatDate(e.end_time)),React.createElement("td",{className:"uk-width-4-10"},React.createElement("a",{href:"/project/p/"+e.id,className:"dv-link"},"概况"),React.createElement("a",{href:"/project/p/"+e.id+"/edit",className:"dv-link"},"修改"),"end"===e.status?React.createElement("a",{onClick:this.deleteProject.bind(this,e.id),className:"dv-link"},"删除"):null))}.bind(this))))}}),ProjectList=React.createClass({displayName:"ProjectList",loadData:function(){getJSON("/api/project/p/all",{page:this.props.page},function(e,t){e?fatal(e):this.setState({projects:t.projects,page:t.page,pagelist:t.page.list})}.bind(this))},getInitialState:function(){return{page:{},pagelist:[],projects:[]}},componentWillMount:function(){this.loadData()},render:function(){var e=this.state.page,t=1==e.index?React.createElement("li",{className:"uk-disabled"},React.createElement("span",null,React.createElement("i",{className:"uk-icon-angle-double-left"}))):React.createElement("li",null,React.createElement("a",{href:"?page="+(e.index-1)},React.createElement("i",{className:"uk-icon-angle-double-left"}))),a=e.index==Math.floor(e.total/e.size)+1?React.createElement("li",{className:"uk-disabled"},React.createElement("span",null,React.createElement("i",{className:"uk-icon-angle-double-right"}))):React.createElement("li",null,React.createElement("a",{href:"?page="+(e.index+1)},React.createElement("i",{className:"uk-icon-angle-double-right"})));return React.createElement("div",null,React.createElement("h1",{className:"uk-text-center"},React.createElement("b",null,"所有项目")),React.createElement("hr",{className:"dv-hr"}),React.createElement("div",null,this.state.projects.length>0?React.createElement(ProjectTable,{projects:this.state.projects,reloadData:this.loadData}):React.createElement("span",null,"无符合条件记录"),React.createElement("div",{className:this.state.page.pages>1?"uk-text-center":"uk-hidden"},React.createElement("ul",{className:"uk-pagination"},t,this.state.pagelist.map(function(t,a){return"..."===t?React.createElement("li",{key:a,className:"uk-disabled"},React.createElement("span",null,"...")):t==e.index?React.createElement("li",{key:a,className:"uk-active"},React.createElement("span",null,t)):React.createElement("li",{key:a},React.createElement("a",{href:"?page="+t+"&uid="+ENV.user.id},t))}.bind(this)),a))))}});