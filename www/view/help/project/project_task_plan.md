## 待执行的任务
此页面以列表的方式给出了所有等待用户执行的任务，包含未确认需求和未确认接收的任务。任务执行人可以通过该页面了解未来自己需要完成的工作，包含查看任务信息、完成任务接收的工作流操作。

### 快速入门
1. **列表项构成**：包含任务名称、任务状态、计划开始和结束时间、计划工期和所属的项目。对于计划今日及之前需要开始的任务，任务名称右方会被标示为“紧急”。
2. **基本操作要领**: 
	* 查看与操作任务：单击任务名称，即可弹出任务信息对话框，可以看到任务的详细信息以及添加任务的工作流。
	* 查看项目：单击项目快捷方式可以进入对应的项目页面。

<br/>

### 更多操作说明
1. **任务信息对话框**：页面由三部分构成，分别是
	* 基本信息: 显示任务的信息，包含任务名称、任务状态、任务执行人、工作审核人、计划工期、实际工期、计划模式、任务难度、计划开始和结束时间、实际开始和结束时间，以及任务说明。
	* 工作流：由三小部分构成。上部是工作流当前进度情况（绿色块表示已完成，黄色块表示正在进行，灰色块表示未来将要进行的）、工作流操作记录表和追加工作流的操作。其中，追加工作流只支持任务执行人的操作。
	* 进展日志：列出了该任务的每日日志。
2. **任务状态**: 不同的状态，提示的颜色不同
	* 正在执行：采用蓝色。
	* 待接收执行：采用桔黄色，表示需要注意操作。
	* 待需求确认和挂起暂停执行：采用黑色。
3. **任务列表的排序**: 任务是先按照状态排序。对于状态相同的任务，再按计划开始时间排序先后。系统是按照“正在执行、已暂停执行、待接收、待确认需求”状态从上到下排序的。

<br/>

### FAQ
1.**任务信息对话框的工作流，为什么无法执行一些任务审核角色人的操作？**

答：因为当前页面是“我的工作日志”，它假定当前用户的角色是执行人，而不是任务管理角色。如果你是任务的管理成员，你需要到“我管理的任务”页面中完成对应的工作流操作。

<br/>

### 设计
1. **TODO**：
	* 考虑设计列表分类，分为未来两天内、未来一周或未来一个月要完成。

