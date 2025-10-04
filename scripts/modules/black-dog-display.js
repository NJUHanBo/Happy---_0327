// 火柴人时光管理器 - 黑狗任务显示模块
// 这个模块负责在任务列表中突出显示黑狗任务

// 检查模块是否已加载，防止重复声明变量
if (window.blackDogDisplayLoaded) {
    console.log("黑狗任务显示模块已经加载，跳过重复加载");
} else {
    // 检查任务是否符合"黑狗征服者"条件（高重要低兴趣）
    function isBlackDogTask(task) {
        // 首先检查是否可以直接通过主模块判断
        if (window.blackDogConquerorModule && 
           typeof window.blackDogConquerorModule.isBlackDogTask === 'function') {
            const isBlackDog = window.blackDogConquerorModule.isBlackDogTask(task);
            // 添加调试日志
            if (isBlackDog) {
                console.log("通过主模块检测到黑狗任务:", task.name, task);
            }
            return isBlackDog;
        }
        
        // 如果主模块不可用，使用本地备用检查方法
        const isBlackDog = task && task.importance === 'high' && task.interest === 'low';
        if (isBlackDog) {
            console.log("通过本地函数检测到黑狗任务:", task.name, task);
        }
        return isBlackDog;
    }

    // 保存原始函数的引用
    const originalShowDailyRoutine = window.showDailyRoutine;
    const originalShowTodoMaster = window.showTodoMaster;
    const originalShowProjectManager = window.showProjectManager;

    // 重写显示日常任务列表函数
    window.showDailyRoutine = function() {
        if (state.dailyTasks.length === 0) {
            showDialog(`
                <h2>我的日常</h2>
                <p>你还没有添加任何日常任务。</p>
                <div class="dialog-buttons">
                    <button onclick="showAddDailyTasksDialog()">添加日常任务</button>
                    <button onclick="closeDialog()">返回</button>
                </div>
            `);
            return;
        }

        const tasksHtml = state.dailyTasks
            .sort((a, b) => {
                // 首先按重要性排序
                const importanceOrder = { high: 3, medium: 2, low: 1 };
                const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
                if (importanceDiff !== 0) return importanceDiff;

                // 然后按兴趣程度排序
                const interestOrder = { high: 3, medium: 2, low: 1 };
                const interestDiff = interestOrder[b.interest] - interestOrder[a.interest];
                if (interestDiff !== 0) return interestDiff;

                // 最后按持续时间排序（时间短的优先）
                return a.duration - b.duration;
            })
            .map(task => {
                // 检查是否是黑狗任务
                const isBlackDog = isBlackDogTask(task);
                
                return `
                    <div class="task-card ${isBlackDog ? 'black-dog-task' : ''}" data-task-id="${task.id}">
                        ${isBlackDog ? '<div class="black-dog-badge">黑狗任务</div>' : ''}
                        <div class="task-actions">
                            <button class="icon-btn edit" onclick="editDailyTask(${task.id})" title="编辑任务">✎</button>
                            <button class="icon-btn delete" onclick="deleteDailyTask(${task.id})" title="删除任务">×</button>
                        </div>
                        <h3>${task.name}</h3>
                        <p>计划时长：${task.duration}分钟</p>
                        <p>重要性：${getImportanceText(task.importance)}</p>
                        <p>兴趣度：${getInterestText(task.interest)}</p>
                        <p>已完成次数：${task.completedTimes || 0}次</p>
                        <p>连续天数：${task.streakDays || 0}天</p>
                        <button class="start-btn" onclick="startDailyTask(${task.id})">开始任务</button>
                    </div>
                `;
            }).join('');

        showDialog(`
            <h2>我的日常</h2>
            <div class="tasks-grid">
                ${tasksHtml}
            </div>
            <div class="dialog-buttons">
                <button onclick="showAddDailyTasksDialog()">添加新日常</button>
                <button onclick="closeDialog()">返回</button>
            </div>
        `);
    };

    // 重写显示待办事项列表函数
    window.showTodoMaster = function() {
        if (state.todos.length === 0) {
            showDialog(`
                <h2>政务大师</h2>
                <p>你还没有添加任何待办事项。</p>
                <div class="dialog-buttons">
                    <button onclick="showAddTodosDialog()">添加待办事项</button>
                    <button onclick="closeDialog()">返回</button>
                </div>
            `);
            return;
        }

        // 未完成的待办事项
        const todosHtml = state.todos
            .filter(todo => !todo.completed)
            .sort((a, b) => {
                // 首先按重要性排序
                const importanceOrder = { high: 3, medium: 2, low: 1 };
                const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
                if (importanceDiff !== 0) return importanceDiff;

                // 然后按紧急程度排序
                const urgencyOrder = { high: 3, medium: 2, low: 1 };
                const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
                if (urgencyDiff !== 0) return urgencyDiff;

                // 按截止日期排序
                const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);
                if (deadlineDiff !== 0) return deadlineDiff;

                // 最后按预计时长排序（短任务优先）
                return a.duration - b.duration;
            })
            .map(todo => {
                // 检查是否是黑狗任务
                const isBlackDog = isBlackDogTask(todo);
                
                return `
                    <div class="todo-card ${isBlackDog ? 'black-dog-task' : ''}" data-todo-id="${todo.id}">
                        ${isBlackDog ? '<div class="black-dog-badge">黑狗任务</div>' : ''}
                        <h3>${todo.name}</h3>
                        <p>截止日期：${new Date(todo.deadline).toLocaleDateString()}</p>
                        <p>预计时长：${todo.duration}小时</p>
                        <p>重要性：${getImportanceText(todo.importance)}</p>
                        <p>紧急度：${getUrgencyText(todo.urgency)}</p>
                        <button onclick="startTodo(${todo.id})">开始处理</button>
                    </div>
                `;
            }).join('');

        // 创建已完成事项的侧边栏
        const completedTodos = state.todos.filter(todo => todo.completed);
        const todoListHtml = `
            <div class="dialog-sidebar">
                <div class="task-list-header">已完成事项</div>
                <ul class="task-list">
                    ${completedTodos.length > 0 ? 
                      completedTodos.map(todo => `
                        <li class="task-list-item">
                            <div>${todo.name}</div>
                            <small>完成于: ${new Date(todo.completionDate).toLocaleDateString()}</small>
                            <button class="small-btn" onclick="deleteTodo(${todo.id})">删除</button>
                        </li>
                      `).join('') : 
                      '<li class="task-list-item empty">暂无已完成事项</li>'}
                </ul>
            </div>
        `;

        // 显示对话框，使用自定义HTML结构
        const dialogContainer = document.getElementById('dialog-container');
        dialogContainer.innerHTML = `
            <div class="dialog">
                <button class="dialog-close" onclick="closeDialog()">×</button>
                <div class="dialog-main">
                    <h2>政务大师</h2>
                    <div class="todos-grid">
                        ${todosHtml || '<p class="empty-message">没有待处理的事项</p>'}
                    </div>
                    <div class="dialog-buttons">
                        <button onclick="showAddTodosDialog()">添加事项</button>
                        <button onclick="closeDialog()">返回</button>
                    </div>
                </div>
                ${todoListHtml}
            </div>
        `;
        dialogContainer.classList.remove('hidden');
    };

    // 重写显示项目管理器函数，如果存在的话
    if (typeof window.showProjectManager === 'function') {
        window.showProjectManager = function() {
            // 判断是否有任何项目
            if (state.projects.length === 0) {
                showDialog(`
                    <h2>项目管理器</h2>
                    <p>你还没有添加任何项目。</p>
                    <div class="dialog-buttons">
                        <button onclick="showAddProjectDialog()">添加项目</button>
                        <button onclick="closeDialog()">返回</button>
                    </div>
                `);
                return;
            }

            // 获取进行中的项目
            const activeProjects = state.projects.filter(project => !project.completedAt);
            
            // 生成进行中项目的HTML
            const activeProjectsHtml = activeProjects
                .sort((a, b) => {
                    // 首先按重要性排序
                    const importanceOrder = { high: 3, medium: 2, low: 1 };
                    const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
                    if (importanceDiff !== 0) return importanceDiff;

                    // 然后按截止日期排序（日期近的优先）
                    return new Date(a.deadline) - new Date(b.deadline);
                })
                .map(project => {
                    // 检查是否是黑狗任务
                    const isBlackDog = isBlackDogTask(project);
                    
                    // 计算项目进度
                    const totalMilestones = project.milestones ? project.milestones.length : 0;
                    const completedMilestones = project.currentMilestone || 0;
                    const progress = totalMilestones > 0 ? Math.floor((completedMilestones / totalMilestones) * 100) : 0;
                    
                    // 计算剩余天数
                    const today = new Date();
                    const deadline = new Date(project.deadline);
                    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                    
                    return `
                        <div class="project-card ${isBlackDog ? 'black-dog-task' : ''}" data-project-id="${project.id}">
                            ${isBlackDog ? '<div class="black-dog-badge">黑狗任务</div>' : ''}
                            <h3>${project.name}</h3>
                            <p>截止日期：${new Date(project.deadline).toLocaleDateString()} (剩余 ${daysLeft} 天)</p>
                            <p>重要性：${getImportanceText(project.importance)}</p>
                            <p>兴趣度：${getInterestText(project.interest)}</p>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                                <div class="progress-text">${progress}% 完成</div>
                            </div>
                            <div class="project-actions">
                                <button onclick="showProjectDetails(${project.id})">详情</button>
                                <button onclick="startProject(${project.id})">继续任务</button>
                            </div>
                        </div>
                    `;
                }).join('');

            // 创建已完成项目的侧边栏
            const completedProjects = state.projects.filter(project => project.completedAt);
            const projectListHtml = `
                <div class="dialog-sidebar">
                    <div class="task-list-header">已完成项目</div>
                    <ul class="task-list">
                        ${completedProjects.length > 0 ? 
                          completedProjects.map(project => `
                            <li class="task-list-item">
                                <div>${project.name}</div>
                                <small>完成于: ${new Date(project.completedAt).toLocaleDateString()}</small>
                                <div class="item-actions">
                                    <button class="small-btn" onclick="showProjectDetails(${project.id})">详情</button>
                                    <button class="small-btn" onclick="deleteProject(${project.id})">删除</button>
                                </div>
                            </li>
                          `).join('') : 
                          '<li class="task-list-item empty">暂无已完成项目</li>'}
                    </ul>
                </div>
            `;

            // 显示对话框，使用自定义HTML结构
            const dialogContainer = document.getElementById('dialog-container');
            dialogContainer.innerHTML = `
                <div class="dialog">
                    <button class="dialog-close" onclick="closeDialog()">×</button>
                    <div class="dialog-main">
                        <h2>项目管理器</h2>
                        <div class="projects-grid">
                            ${activeProjectsHtml || '<p class="empty-message">没有进行中的项目</p>'}
                        </div>
                        <div class="dialog-buttons">
                            <button onclick="showAddProjectDialog()">添加项目</button>
                            <button onclick="closeDialog()">返回</button>
                        </div>
                    </div>
                    ${projectListHtml}
                </div>
            `;
            dialogContainer.classList.remove('hidden');
        };
    }

    // 添加样式，支持侧边栏中的小按钮
    const sidebarButtonStyle = document.createElement('style');
    sidebarButtonStyle.innerHTML = `
    .task-list-item .small-btn {
        font-size: 12px;
        padding: 2px 5px;
        margin-top: 4px;
        background-color: #555;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    }

    .task-list-item .small-btn:hover {
        background-color: #777;
    }

    .task-list-item .item-actions {
        display: flex;
        gap: 5px;
        margin-top: 3px;
    }

    .task-list-item.empty {
        color: #888;
        font-style: italic;
    }
    `;
    document.head.appendChild(sidebarButtonStyle);

    // 标记模块已加载
    window.blackDogDisplayLoaded = true;
    console.log("黑狗任务显示模块已加载 - 版本 1.2");

    // 添加一个延迟检查，确保在页面完全加载后执行
    window.addEventListener('load', function() {
        console.log("页面加载完成，确认黑狗任务模块状态:");
        console.log("- 主模块存在:", !!window.blackDogConquerorModule);
        console.log("- isBlackDogTask函数可用:", window.blackDogConquerorModule && typeof window.blackDogConquerorModule.isBlackDogTask === 'function');
        
        // 测试一个示例任务
        const testTask = { name: "测试任务", importance: "high", interest: "low" };
        console.log("- 测试任务是黑狗任务:", isBlackDogTask(testTask));
    });
} 