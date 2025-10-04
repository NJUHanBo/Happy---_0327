// 火柴人时光管理器 - 黑狗任务处理模块
// 这个模块负责处理黑狗任务的特殊处理，包括绕过精力检查

// 检查模块是否已加载，防止重复声明变量
if (window.blackDogTaskHandlerLoaded) {
    console.log("黑狗任务处理模块已经加载，跳过重复加载");
} else {
    // 保存原始函数的引用
    const originalStartDailyTask = window.startDailyTask;
    const originalStartTodo = window.startTodo;
    const originalStartProject = window.startProject;
    const originalShowDialog = window.showDialog;

    // 检查任务是否符合"黑狗征服者"条件（高重要低兴趣）
    function isBlackDogTask(task) {
        return window.blackDogConquerorModule && 
               typeof window.blackDogConquerorModule.isBlackDogTask === 'function' && 
               window.blackDogConquerorModule.isBlackDogTask(task);
    }

    // 重写开始日常任务函数，绕过黑狗任务的精力检查
    window.startDailyTask = function(taskId) {
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (!task) return;
        
        // 计算预计消耗的体力和精力
        const energyCost = Math.round((task.duration / 480) * 100);
        const spiritCost = task.interest === 'high' ? -20 : (task.interest === 'low' ? 40 : 20);
        
        // 检查是否为黑狗任务
        const isBlackDog = isBlackDogTask(task);
        
        // 如果不是黑狗任务，执行正常的精力检查
        if (!isBlackDog && (state.stats.energy < energyCost || (spiritCost > 0 && state.stats.spirit < spiritCost))) {
            let message = '';
            if (state.stats.energy < energyCost) {
                message += `完成这个任务需要 ${energyCost} 点体力，但你现在只有 ${state.stats.energy} 点体力。\n`;
            }
            if (spiritCost > 0 && state.stats.spirit < spiritCost) {
                message += `完成这个任务需要 ${spiritCost} 点精力，但你现在只有 ${state.stats.spirit} 点精力。\n`;
            }
            
            showDialog(`
                <h2>无法开始任务</h2>
                <p>${message}</p>
                <p>今天已经很累了，不如休息一下，明天再继续吧！${spiritCost < 0 ? '或者先做一些你感兴趣的事情来恢复精力。' : ''}</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">好的</button>
                </div>
            `);
            return;
        }
        
        // 对于黑狗任务，只检查体力是否足够
        if (isBlackDog && state.stats.energy < energyCost) {
            showDialog(`
                <h2>无法开始黑狗任务</h2>
                <p>虽然这是个黑狗任务（高重要低兴趣），但你的体力不足以开始。</p>
                <p>完成这个任务需要 ${energyCost} 点体力，但你现在只有 ${state.stats.energy} 点体力。</p>
                <p>请先恢复体力后再尝试。</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">好的</button>
                </div>
            `);
            return;
        }
        
        // 如果是黑狗任务，显示特殊提示
        if (isBlackDog) {
            showDialog(`
                <h2 class="black-dog-task-title">黑狗任务：${task.name}</h2>
                <div class="black-dog-task-info">
                    <p>你即将开始一个<span class="black-dog-highlight">高重要但低兴趣</span>的任务！</p>
                    <p>🔥 完成后可获得<span class="black-dog-highlight">双倍火苗</span>奖励</p>
                    <p>✨ 精力不减反增，将<span class="black-dog-highlight">恢复20点精力</span></p>
                    <p>🧠 额外获得相同数量的<span class="black-dog-highlight">灰烬</span>奖励</p>
                    <p>🔄 连续完成可获得最高<span class="black-dog-highlight">75%的连击加成</span></p>
                </div>
                <p>准备好接受挑战了吗？</p>
                <div class="dialog-buttons">
                    <button class="black-dog-start-btn" onclick="proceedStartDailyTask(${taskId})">征服黑狗！开始任务</button>
                    <button onclick="closeDialog()">再想想</button>
                </div>
            `);
            return;
        }
        
        // 正常任务，直接调用原始函数
        originalStartDailyTask(taskId);
    };

    // 直接开始黑狗日常任务，绕过所有检查
    window.proceedStartDailyTask = function(taskId) {
        closeDialog();
        
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (!task) return;
        
        // 保存当前任务ID到全局变量
        window.currentTaskId = taskId;
        
        // 直接显示任务对话框，绕过精力检查
        showDialog(`
            <h2>${task.name}</h2>
            <p>计划时长：${task.duration}分钟</p>
            <div class="timer-display">
                <span id="timer">00:00</span>
            </div>
            <div class="task-controls">
                <button id="pause-btn" onclick="togglePause()">暂停</button>
                <button onclick="abandonTask()">放弃</button>
                <button onclick="completeDailyTask(${taskId})">完成</button>
            </div>
        `);
        
        startTimer(task.duration * 60);
    };

    // 重写开始待办事项函数，绕过黑狗任务的精力检查
    window.startTodo = function(todoId) {
        const todo = state.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        // 计算预计消耗的体力和精力
        const energyCost = Math.round((todo.duration / 8) * 100);
        let spiritCost = 0;
        if (todo.duration <= 0.5) {
            spiritCost = 10;
        } else if (todo.duration <= 1) {
            spiritCost = 20;
        } else if (todo.duration <= 2) {
            spiritCost = 40;
        } else {
            spiritCost = 100;
        }
        
        // 检查是否为黑狗任务
        const isBlackDog = isBlackDogTask(todo);
        
        // 如果不是黑狗任务，执行正常的精力检查
        if (!isBlackDog && (state.stats.energy < energyCost || state.stats.spirit < spiritCost)) {
            let message = '';
            if (state.stats.energy < energyCost) {
                message += `完成这个待办事项需要 ${energyCost} 点体力，但你现在只有 ${state.stats.energy} 点体力。\n`;
            }
            if (state.stats.spirit < spiritCost) {
                message += `完成这个待办事项需要 ${spiritCost} 点精力，但你现在只有 ${state.stats.spirit} 点精力。\n`;
            }
            
            showDialog(`
                <h2>状态不足</h2>
                <p>${message}</p>
                <p>今天已经很累了，不如休息一下，明天再继续吧！</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">好的</button>
                </div>
            `);
            return;
        }
        
        // 对于黑狗任务，只检查体力是否足够
        if (isBlackDog && state.stats.energy < energyCost) {
            showDialog(`
                <h2>无法开始黑狗任务</h2>
                <p>虽然这是个黑狗任务（高重要低兴趣），但你的体力不足以开始。</p>
                <p>完成这个任务需要 ${energyCost} 点体力，但你现在只有 ${state.stats.energy} 点体力。</p>
                <p>请先恢复体力后再尝试。</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">好的</button>
                </div>
            `);
            return;
        }
        
        // 如果是黑狗任务，显示特殊提示
        if (isBlackDog) {
            showDialog(`
                <h2 class="black-dog-task-title">黑狗任务：${todo.name}</h2>
                <div class="black-dog-task-info">
                    <p>你即将开始一个<span class="black-dog-highlight">高重要但低兴趣</span>的任务！</p>
                    <p>🔥 完成后可获得<span class="black-dog-highlight">双倍火苗</span>奖励</p>
                    <p>✨ 精力不减反增，将<span class="black-dog-highlight">恢复20点精力</span></p>
                    <p>🧠 额外获得相同数量的<span class="black-dog-highlight">灰烬</span>奖励</p>
                    <p>🔄 连续完成可获得最高<span class="black-dog-highlight">75%的连击加成</span></p>
                </div>
                <p>准备好接受挑战了吗？</p>
                <div class="dialog-buttons">
                    <button class="black-dog-start-btn" onclick="proceedStartTodo(${todoId})">征服黑狗！开始任务</button>
                    <button onclick="closeDialog()">再想想</button>
                </div>
            `);
            return;
        }
        
        // 正常任务，直接调用原始函数
        originalStartTodo(todoId);
    };

    // 直接开始黑狗待办事项，绕过所有检查
    window.proceedStartTodo = function(todoId) {
        closeDialog();
        
        const todo = state.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        // 保存当前任务ID到全局变量
        window.currentTaskId = todoId;
        
        // 直接显示任务对话框，绕过精力检查
        showDialog(`
            <h2>${todo.name}</h2>
            <p>预计时长：${todo.duration}小时</p>
            <div class="timer-display">
                <span id="timer">00:00</span>
            </div>
            <div class="task-controls">
                <button id="pause-btn" onclick="togglePause()">暂停</button>
                <button onclick="abandonTodo()">放弃</button>
                <button onclick="completeTodo(${todoId})">完成</button>
            </div>
        `);
        
        startTimer(todo.duration * 60 * 60);
    };

    // 重写开始项目函数，绕过黑狗任务的精力检查
    window.startProject = function(projectId) {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const milestone = project.milestones[project.currentMilestone];
        if (!milestone) {
            alert('该项目已完成所有节点！');
            return;
        }
        
        // 计算预计消耗的体力和精力
        const energyCost = Math.round((project.dailyTime / 8) * 100);
        const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
        
        // 检查是否为黑狗任务
        const isBlackDog = isBlackDogTask(project);
        
        // 如果不是黑狗任务，执行正常的精力检查
        if (!isBlackDog && (state.stats.energy < energyCost || (spiritCost > 0 && state.stats.spirit < spiritCost))) {
            showDialog(`
                <h2>状态不足</h2>
                <p>完成这个项目工作需要:</p>
                <p>体力: ${energyCost} 点 (当前: ${state.stats.energy} 点)</p>
                ${spiritCost > 0 ? `<p>精力: ${spiritCost} 点 (当前: ${state.stats.spirit} 点)</p>` : 
                                  '<p>这是个有趣的项目,会恢复精力哦!</p>'}
                <p>今天已经很累了,不如休息一下,明天再继续吧！</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">好的</button>
                </div>
            `);
            return;
        }
        
        // 对于黑狗任务，只检查体力是否足够
        if (isBlackDog && state.stats.energy < energyCost) {
            showDialog(`
                <h2>无法开始黑狗任务</h2>
                <p>虽然这是个黑狗任务（高重要低兴趣），但你的体力不足以开始。</p>
                <p>完成这个任务需要 ${energyCost} 点体力，但你现在只有 ${state.stats.energy} 点体力。</p>
                <p>请先恢复体力后再尝试。</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">好的</button>
                </div>
            `);
            return;
        }
        
        // 如果是黑狗任务，显示特殊提示
        if (isBlackDog) {
            showDialog(`
                <h2 class="black-dog-task-title">黑狗任务：${project.name}</h2>
                <div class="black-dog-task-info">
                    <p>你即将开始一个<span class="black-dog-highlight">高重要但低兴趣</span>的任务！</p>
                    <p>🔥 完成后可获得<span class="black-dog-highlight">双倍火苗</span>奖励</p>
                    <p>✨ 精力不减反增，将<span class="black-dog-highlight">恢复20点精力</span></p>
                    <p>🧠 额外获得相同数量的<span class="black-dog-highlight">灰烬</span>奖励</p>
                    <p>🔄 连续完成可获得最高<span class="black-dog-highlight">75%的连击加成</span></p>
                </div>
                <p>准备好接受挑战了吗？</p>
                <div class="dialog-buttons">
                    <button class="black-dog-start-btn" onclick="proceedStartProject(${projectId})">征服黑狗！开始任务</button>
                    <button onclick="closeDialog()">再想想</button>
                </div>
            `);
            return;
        }
        
        // 正常任务，直接调用原始函数
        originalStartProject(projectId);
    };

    // 直接开始黑狗项目，绕过所有检查
    window.proceedStartProject = function(projectId) {
        closeDialog();
        
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const milestone = project.milestones[project.currentMilestone];
        if (!milestone) {
            alert('该项目已完成所有节点！');
            return;
        }
        
        // 保存当前任务ID到全局变量
        window.currentTaskId = projectId;
        
        // 直接显示任务对话框，绕过精力检查
        showDialog(`
            <h2>${project.name}</h2>
            <p>当前节点：${milestone.name}</p>
            <p>计划时长：${project.dailyTime}小时</p>
            <div class="timer-display">
                <span id="timer">00:00</span>
            </div>
            <div class="task-controls">
                <button id="pause-btn" onclick="togglePause()">暂停</button>
                <button onclick="abandonProject()">放弃</button>
                <button onclick="completeProjectSession(${projectId})">完成</button>
            </div>
        `);
        
        startTimer(project.dailyTime * 60 * 60);
    };

    // 标记模块已加载
    window.blackDogTaskHandlerLoaded = true;
    console.log("黑狗任务处理模块已加载 - 版本 1.2");
} 