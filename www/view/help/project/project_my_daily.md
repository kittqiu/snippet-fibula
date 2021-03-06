## 我的日志
日志用于记录每个人在当日、为指定任务所做的工作进展。从贡献角度来看，它也反馈了我们一个成员一天的工作贡献。因此，为了项目的进展过程更为细致、可控，也为了记录我们每个人的工作贡献，**每个人在每天都应该认真填写日志**。


### 快速入门
1. **页面构成**：整个页面由工具栏和任务列表内容区构成。工具栏可以选择日志对应的日期，任务列表内容区则展示了指定日期需要执行的工作任务列表，并提供了日志填写入口。
2. **任务日志构成**：每个任务的日志栏提供了今日计划、今日工作和明日计划三项内容。其中，今日工作和明日计划是每天日志的两个基本构成元素。以下是它们的含义说明：
	* 今日计划：上一个工作日所填写的“明日计划”。通过它可以明确昨天自己的计划。
	* 今日工作：记录今天完成的工作内容，以及工作用时。
	* 明日计划：记录明天或下一个工作日需要完成的工作内容。
3. **基本操作要领**: 
	* 填写（或修改）日志：点选今日工作或明日计划框中的“编辑”快捷键，即可弹出日志填写对话框，填写后提交保存即可。
	* 查看任务信息：单击任务名称行的任意位置，即可弹出任务信息对话框，可以看到任务的详细信息、任务每天的工作进展，甚至可以添加任务的工作流。
	* 切换日期：通过“前一天”按钮可以切换到昨天，“后一天”按钮可以切换到明天。如果需要指定日期，可以点选中间的“日期选择”控件，选定日期。

<br/>

### 更多操作说明
1. **日志填写对话框**：可以填写当日工作内容、当日工作的用时，以及当前该任务的进度值。如果任务明日需要继续执行，则需要填写明日计划。
2. **任务信息对话框**：页面由三部分构成，分别是
	* 基本信息: 显示任务的信息，包含任务名称、任务状态、任务执行人、工作审核人、计划工期、实际工期、计划模式、任务难度、计划开始和结束时间、实际开始和结束时间，以及任务说明。
	* 工作流：由三小部分构成。上部是工作流当前进度情况（绿色块表示已完成，黄色块表示正在进行，灰色块表示未来将要进行的）、工作流操作记录表和追加工作流的操作。
	* 进展日志：列出了该任务的每日日志。

<br/>

### FAQ
1.**每天都必须填写所有任务的日志吗？**

答：你只需要为当日执行的任务填写日志。当然，如果你在明日对某个任务有工作计划，应该为其填写工作计划，以便自己做好计划，也便于任务管理者了解你的计划。

<br/>
2.**为什么需要每天填写日志呢？**

答：原因有以下几点：

* 每天填写日志，让团队其他成员了解自己的工作，是每个成员需要遵守的日常工作规范项之一。填写的日志也将作为每个成员的工作价值考评的一种参考。
* 填写的日志是项目执行过程的一种记录形式。它可以帮助项目管理成员更好地了解任务进展，进而把控项目进度。
* 填写日志的过程，其实是让成员做一次短时间的自我小结，并尝试做好明日的计划。这可以锻炼各个成员的总结能力和计划能力。

<br/>
3.**日志需要填写什么内容？**

答：填写什么内容是由内容的阅读者决定的。你可以假想自己是任务管理成员，那么他最希望了解什么信息呢？当然，我们建议你选择性地填写以下一些内容：
* 今日工作的成果。
* 今日工作有意义的执行过程，特别是能体现个人能力的困难点解决过程、或创新点。
* 今日工作的体会感受。
* 希望团队其它成员能给予你的帮助。
* 以小时为单位，列出对应的进展。这也是一种不错的形式。

<br/>
4.**填写的日志，有谁可以看到？**

答：任何参与项目的成员、以及你的主管成员都能查看到，乃至所有团队成员。


<br/>
5.**昨天忘记填写日志，今日可以填写吗？**

答：可以。只需要你选择准确的日期，甚至可以填写以往工作日的日志。当然，我们提倡每日填写，而不是隔日填写，这违背了日志填写的设计初衷。需要说明的是，系统会记录日志的创建和更新时间，并会显示在系统中的进展日志页面中，管理成员可以了解到该日志的填写日期。

<br/>
6.**任务信息对话框的工作流，为什么无法执行一些任务审核角色人的操作？**

答：因为当前页面是“我的工作日志”，它假定当前用户的角色是执行人，而不是任务管理角色。如果你是任务的管理成员，你需要到“我管理的任务”页面中完成对应的工作流操作。

<br/>

### 设计
1. **TODO**：
	* 需要设计工作日的明确方法，让昨日计划所指定的日期更加符合工作实际情况。
	* 是否需要设计一下，只允许填写昨天和今日的日志，而不是所有日期的。

