// 任务管理器 - 统一管理日常任务、项目和待办事项
// Linus式重构：先提取核心CRUD，其他功能逐步迁移

/**
 * TaskManager - 任务管理核心类
 * 
 * 职责：
 * 1. 统一管理三种任务类型（daily, project, todo）
 * 2. 提供CRUD操作
 * 3. 处理任务完成逻辑和奖励
 * 4. 管理任务状态
 */
class TaskManager {
    constructor(stateManager) {
        this.state = stateManager;
    }
    
    // ========================================
    // 日常任务 (Daily Tasks)
    // ========================================
    
    /**
     * 获取所有日常任务
     */
    getDailyTasks() {
        // HOTFIX: Read directly from global state for UI compatibility
        if (typeof window !== 'undefined' && window.state) {
            return window.state.dailyTasks || [];
        }
        return this.state.get('dailyTasks') || [];
    }
    
    /**
     * 添加日常任务
     */
    addDailyTask(task) {
        const tasks = this.getDailyTasks();
        
        // 生成ID
        if (!task.id) {
            task.id = Date.now();
        }
        
        // 设置默认值
        // 兼容性：同时保存 duration 和 dailyTime（都是分钟）
        const durationMinutes = task.dailyTime || task.duration || 0;
        const newTask = {
            ...task,                        // 先展开task的所有字段
            id: task.id,
            name: task.name,
            duration: durationMinutes,      // main.js使用
            dailyTime: durationMinutes,     // 向后兼容
            importance: task.importance || 'medium',    // 保持字符串（'high'/'medium'/'low'）
            interest: task.interest || 'medium',        // 保持字符串
            streak: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        this.state.set('dailyTasks', tasks);
        
        // HOTFIX: Also update global state for UI compatibility
        if (typeof window !== 'undefined' && window.state) {
            window.state.dailyTasks = tasks;
        }
        
        console.log('[TaskManager] Daily task added:', newTask.name);
        return newTask;
    }
    
    /**
     * 更新日常任务
     */
    updateDailyTask(taskId, updates) {
        const tasks = this.getDailyTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index === -1) {
            console.error('[TaskManager] Daily task not found:', taskId);
            return false;
        }
        
        tasks[index] = { ...tasks[index], ...updates };
        this.state.set('dailyTasks', tasks);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.dailyTasks = tasks;
        }
        
        console.log('[TaskManager] Daily task updated:', taskId);
        return tasks[index];
    }
    
    /**
     * 删除日常任务
     */
    deleteDailyTask(taskId) {
        const tasks = this.getDailyTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        
        if (filtered.length === tasks.length) {
            console.error('[TaskManager] Daily task not found:', taskId);
            return false;
        }
        
        this.state.set('dailyTasks', filtered);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.dailyTasks = filtered;
        }
        
        console.log('[TaskManager] Daily task deleted:', taskId);
        return true;
    }
    
    /**
     * 完成日常任务（包含业务逻辑：streak计算、奖励计算）
     */
    completeDailyTask(taskId, actualTime, rating) {
        const tasks = this.getDailyTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            console.error('[TaskManager] Daily task not found:', taskId);
            return null;
        }
        
        // 兼容 duration(分钟) 和 dailyTime(分钟) 字段
        const durationMinutes = task.duration || task.dailyTime || 1;
        const timeRatio = actualTime / (durationMinutes * 60);
        const today = new Date().toISOString().split('T')[0];
        
        // 更新任务状态和streak
        task.completedTimes = (task.completedTimes || 0) + 1;
        
        if (task.lastCompleted === today) {
            // 今天已经完成过了，不更新连续天数
        } else if (task.lastCompleted) {
            const lastDate = new Date(task.lastCompleted);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                task.streakDays = (task.streakDays || 0) + 1;
            } else {
                task.streakDays = 1;
            }
        } else {
            task.streakDays = 1;
        }
        
        task.lastCompleted = today;
        
        // 计算木屑奖励
        const baseReward = 10;
        let sawdustReward = Math.round(baseReward * (rating / 5));
        
        // 额外奖励：如果实际用时少于计划时间，增加奖励
        if (timeRatio < 1) {
            sawdustReward = Math.round(sawdustReward * (1 + (1 - timeRatio)));
        }
        
        // 同步更新
        this.updateDailyTask(taskId, task);
        
        console.log('[TaskManager] Daily task completed:', task.name, 
                    'streak:', task.streakDays, 'reward:', sawdustReward);
        
        return {
            task,
            sawdustReward,
            streakDays: task.streakDays,
            timeRatio
        };
    }
    
    // ========================================
    // 项目 (Projects)
    // ========================================
    
    /**
     * 获取所有项目
     */
    getProjects() {
        // HOTFIX: Read directly from global state
        if (typeof window !== 'undefined' && window.state) {
            return window.state.projects || [];
        }
        return this.state.get('projects') || [];
    }
    
    /**
     * 添加项目
     */
    addProject(project) {
        const projects = this.getProjects();
        
        if (!project.id) {
            project.id = Date.now();
        }
        
        const newProject = {
            ...project,                     // 先展开project的所有字段
            id: project.id,
            name: project.name,
            deadline: project.deadline,
            dailyTime: project.dailyTime || 0,
            importance: project.importance || 'medium',     // 保持字符串（'high'/'medium'/'low'）
            interest: project.interest || 'medium',         // 保持字符串
            milestones: project.milestones || [],
            currentMilestone: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        projects.push(newProject);
        this.state.set('projects', projects);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.projects = projects;
        }
        
        console.log('[TaskManager] Project added:', newProject.name);
        return newProject;
    }
    
    /**
     * 更新项目
     */
    updateProject(projectId, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index === -1) {
            console.error('[TaskManager] Project not found:', projectId);
            return false;
        }
        
        projects[index] = { ...projects[index], ...updates };
        this.state.set('projects', projects);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.projects = projects;
        }
        
        console.log('[TaskManager] Project updated:', projectId);
        return projects[index];
    }
    
    /**
     * 删除项目
     */
    deleteProject(projectId) {
        const projects = this.getProjects();
        const filtered = projects.filter(p => p.id !== projectId);
        
        if (filtered.length === projects.length) {
            console.error('[TaskManager] Project not found:', projectId);
            return false;
        }
        
        this.state.set('projects', filtered);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.projects = filtered;
        }
        
        console.log('[TaskManager] Project deleted:', projectId);
        return true;
    }
    
    /**
     * 完成项目里程碑（包含业务逻辑：时间跟踪、消耗计算、奖励计算）
     */
    completeMilestone(projectId, workTimeInSeconds) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
            console.error('[TaskManager] Project not found:', projectId);
            return null;
        }
        
        const currentMilestoneIndex = project.currentMilestone || 0;
        const milestone = project.milestones[currentMilestoneIndex];
        
        if (!milestone) {
            console.error('[TaskManager] No current milestone:', project.name);
            return null;
        }
        
        // 计算工作时长（小时）
        const workTimeInHours = workTimeInSeconds / 3600;
        
        // 更新已投入时间
        if (!milestone.timeSpent) {
            milestone.timeSpent = 0;
        }
        milestone.timeSpent += workTimeInHours;
        
        // 计算消耗
        const energyCost = Math.round((workTimeInHours / 8) * 100);
        const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
        
        // 标记milestone完成
        milestone.completed = true;
        milestone.completedAt = new Date().toISOString();
        
        // 推进到下一个里程碑
        project.currentMilestone++;
        
        // 检查是否完成所有节点
        const isProjectComplete = project.currentMilestone >= project.milestones.length;
        
        if (isProjectComplete) {
            project.completedAt = new Date().toISOString();
        }
        
        // 计算奖励
        let sawdustReward, baseFlameReward;
        if (isProjectComplete) {
            // 整个项目完成
            sawdustReward = 200;
            baseFlameReward = 100;
        } else {
            // 只是节点完成
            sawdustReward = 60;
            baseFlameReward = 40;
        }
        
        // 同步更新
        this.updateProject(projectId, project);
        
        console.log('[TaskManager] Milestone completed:', 
                    milestone.name, 
                    'energyCost:', energyCost,
                    'spiritCost:', spiritCost,
                    'projectComplete:', isProjectComplete);
        
        return {
            project,
            milestone,
            energyCost,
            spiritCost,
            sawdustReward,
            baseFlameReward,
            isProjectComplete
        };
    }
    
    // ========================================
    // 待办事项 (Todos)
    // ========================================
    
    /**
     * 获取所有待办
     */
    getTodos() {
        // HOTFIX: Read directly from global state
        if (typeof window !== 'undefined' && window.state) {
            return window.state.todos || [];
        }
        return this.state.get('todos') || [];
    }
    
    /**
     * 添加待办
     */
    addTodo(todo) {
        const todos = this.getTodos();
        
        if (!todo.id) {
            todo.id = Date.now();
        }
        
        // 兼容性：同时保存 duration 和 estimatedTime（都是小时）
        const durationHours = todo.duration || todo.estimatedTime || 0;
        const newTodo = {
            ...todo,                           // 先展开todo的所有字段
            id: todo.id,
            name: todo.name,
            deadline: todo.deadline,
            duration: durationHours,           // main.js使用（小时）
            estimatedTime: durationHours,      // 向后兼容
            importance: todo.importance || 'medium',    // 保持字符串（'high'/'medium'/'low'）
            urgency: todo.urgency || 'medium',          // 保持字符串
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        todos.push(newTodo);
        this.state.set('todos', todos);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.todos = todos;
        }
        
        console.log('[TaskManager] Todo added:', newTodo.name);
        return newTodo;
    }
    
    /**
     * 更新待办
     */
    updateTodo(todoId, updates) {
        const todos = this.getTodos();
        const index = todos.findIndex(t => t.id === todoId);
        
        if (index === -1) {
            console.error('[TaskManager] Todo not found:', todoId);
            return false;
        }
        
        todos[index] = { ...todos[index], ...updates };
        this.state.set('todos', todos);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.todos = todos;
        }
        
        console.log('[TaskManager] Todo updated:', todoId);
        return todos[index];
    }
    
    /**
     * 删除待办
     */
    deleteTodo(todoId) {
        const todos = this.getTodos();
        const filtered = todos.filter(t => t.id !== todoId);
        
        if (filtered.length === todos.length) {
            console.error('[TaskManager] Todo not found:', todoId);
            return false;
        }
        
        this.state.set('todos', filtered);
        
        // HOTFIX: Also update global state
        if (typeof window !== 'undefined' && window.state) {
            window.state.todos = filtered;
        }
        
        console.log('[TaskManager] Todo deleted:', todoId);
        return true;
    }
    
    /**
     * 完成待办（包含业务逻辑：奖励计算、精力消耗）
     */
    completeTodo(todoId, actualTime, rating) {
        const todo = this.getTodos().find(t => t.id === todoId);
        
        if (!todo) {
            console.error('[TaskManager] Todo not found:', todoId);
            return null;
        }
        
        // 兼容 duration 和 estimatedTime 字段（都是小时）
        const durationHours = todo.duration || todo.estimatedTime || 1;
        const timeRatio = actualTime / (durationHours * 60 * 60);
        
        // 更新待办状态
        const updates = {
            completed: true,
            actualTime: actualTime,
            satisfaction: rating,
            completedAt: new Date().toISOString()
        };
        
        this.updateTodo(todoId, updates);
        
        // 计算基础火苗奖励
        const baseReward = 10;
        let baseFlameReward = Math.round(baseReward * (rating / 5));
        
        // 额外奖励：如果实际用时少于计划时间，增加奖励
        if (timeRatio < 1) {
            baseFlameReward = Math.round(baseFlameReward * (1 + (1 - timeRatio)));
        }
        
        // 确保baseFlameReward是有效数字
        if (isNaN(baseFlameReward) || !isFinite(baseFlameReward)) {
            baseFlameReward = baseReward;
        }
        
        // 计算精力消耗（使用兼容后的duration）
        let spiritCost = 0;
        if (durationHours <= 0.5) {
            spiritCost = 10;
        } else if (durationHours <= 1) {
            spiritCost = 20;
        } else if (durationHours <= 2) {
            spiritCost = 40;
        } else {
            spiritCost = 100;
        }
        
        // 计算体力消耗
        const energyCost = Math.round((durationHours / 8) * 100);
        
        console.log('[TaskManager] Todo completed:', todo.name, 
                    'baseFlameReward:', baseFlameReward,
                    'energyCost:', energyCost,
                    'spiritCost:', spiritCost);
        
        return {
            todo: { ...todo, ...updates },
            baseFlameReward,
            energyCost,
            spiritCost,
            timeRatio
        };
    }
    
    // ========================================
    // 统计和查询
    // ========================================
    
    /**
     * 获取所有未完成的任务数量
     */
    getPendingTasksCount() {
        const dailyCount = this.getDailyTasks().filter(t => !t.completed).length;
        const projectCount = this.getProjects().filter(p => !p.completed).length;
        const todoCount = this.getTodos().filter(t => !t.completed).length;
        
        return {
            daily: dailyCount,
            project: projectCount,
            todo: todoCount,
            total: dailyCount + projectCount + todoCount
        };
    }
    
    /**
     * 获取今天完成的任务
     */
    getTodayCompletedTasks() {
        const today = new Date().toDateString();
        
        const completedDaily = this.getDailyTasks().filter(t => {
            return t.completed && t.completedAt && 
                   new Date(t.completedAt).toDateString() === today;
        });
        
        const completedTodos = this.getTodos().filter(t => {
            return t.completed && t.completedAt && 
                   new Date(t.completedAt).toDateString() === today;
        });
        
        return {
            daily: completedDaily,
            todos: completedTodos,
            total: completedDaily.length + completedTodos.length
        };
    }
    
    /**
     * 重置日常任务（每天开始时调用）
     */
    resetDailyTasks() {
        const tasks = this.getDailyTasks();
        
        tasks.forEach(task => {
            if (task.completed) {
                // 保留连续完成天数，但重置完成状态
                task.completed = false;
                delete task.actualTime;
                delete task.quality;
                delete task.completedAt;
            } else if (task.streak > 0) {
                // 如果昨天没完成，连续天数归零
                task.streak = 0;
            }
        });
        
        this.state.set('dailyTasks', tasks);
        console.log('[TaskManager] Daily tasks reset');
    }
    
    // ========================================
    // 查询和排序方法
    // ========================================
    
    /**
     * 获取未完成的待办事项（已排序）
     * 排序规则：重要性 > 紧急度 > 截止日期 > 预计时长
     */
    getActiveTodos() {
        const todos = this.getTodos();
        return todos
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
            });
    }
    
    /**
     * 获取活跃项目（已排序）
     * 排序规则：截止日期 > 重要性 > 兴趣程度
     */
    getActiveProjects() {
        const projects = this.getProjects();
        return projects
            .filter(project => !project.completedAt)
            .sort((a, b) => {
                // 首先按截止日期排序
                const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);
                if (deadlineDiff !== 0) return deadlineDiff;

                // 然后按重要性排序
                const importanceOrder = { high: 3, medium: 2, low: 1 };
                const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
                if (importanceDiff !== 0) return importanceDiff;

                // 最后按兴趣程度排序
                const interestOrder = { high: 3, medium: 2, low: 1 };
                return interestOrder[b.interest] - interestOrder[a.interest];
            });
    }
    
    /**
     * 获取活跃的日常任务（未完成的）
     */
    getActiveDailyTasks() {
        const tasks = this.getDailyTasks();
        return tasks.filter(task => !task.completed);
    }
    
    /**
     * 获取已排序的日常任务
     * 排序规则：重要性 > 兴趣程度 > 持续时间（短的优先）
     */
    getSortedDailyTasks() {
        const tasks = this.getDailyTasks();
        return tasks.sort((a, b) => {
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
        });
    }
    
    /**
     * 获取已完成的任务
     */
    getCompletedDailyTasks() {
        const tasks = this.getDailyTasks();
        return tasks.filter(task => task.completed);
    }
    
    /**
     * 获取已完成的待办
     */
    getCompletedTodos() {
        const todos = this.getTodos();
        return todos.filter(todo => todo.completed);
    }
    
    /**
     * 获取已完成的项目
     */
    getCompletedProjects() {
        const projects = this.getProjects();
        return projects.filter(project => project.completedAt);
    }
}

// ========================================
// 全局实例和兼容层
// ========================================

let taskManager = null;

function getTaskManager() {
    if (!taskManager && window.getStateManager) {
        const stateManager = window.getStateManager();
        taskManager = new TaskManager(stateManager);
        console.log('[TaskManager] Initialized');
    }
    return taskManager;
}

function initTaskManager(stateManager) {
    taskManager = new TaskManager(stateManager);
    console.log('[TaskManager] Initialized with custom state manager');
    return taskManager;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TaskManager,
        getTaskManager,
        initTaskManager
    };
} else {
    window.TaskManager = TaskManager;
    window.getTaskManager = getTaskManager;
    window.initTaskManager = initTaskManager;
}

