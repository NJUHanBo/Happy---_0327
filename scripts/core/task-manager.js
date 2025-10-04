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
        const newTask = {
            id: task.id,
            name: task.name,
            dailyTime: task.dailyTime || 0,
            importance: task.importance || 3,
            interest: task.interest || 3,
            streak: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            ...task
        };
        
        tasks.push(newTask);
        this.state.set('dailyTasks', tasks);
        
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
        console.log('[TaskManager] Daily task deleted:', taskId);
        return true;
    }
    
    /**
     * 完成日常任务
     */
    completeDailyTask(taskId, actualTime, quality) {
        const task = this.getDailyTasks().find(t => t.id === taskId);
        
        if (!task) {
            console.error('[TaskManager] Daily task not found:', taskId);
            return null;
        }
        
        // 更新任务状态
        const updates = {
            completed: true,
            actualTime: actualTime,
            quality: quality,
            completedAt: new Date().toISOString(),
            streak: (task.streak || 0) + 1
        };
        
        this.updateDailyTask(taskId, updates);
        
        console.log('[TaskManager] Daily task completed:', task.name);
        return { ...task, ...updates };
    }
    
    // ========================================
    // 项目 (Projects)
    // ========================================
    
    /**
     * 获取所有项目
     */
    getProjects() {
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
            id: project.id,
            name: project.name,
            deadline: project.deadline,
            dailyTime: project.dailyTime || 0,
            importance: project.importance || 3,
            interest: project.interest || 3,
            milestones: project.milestones || [],
            currentMilestone: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            ...project
        };
        
        projects.push(newProject);
        this.state.set('projects', projects);
        
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
        console.log('[TaskManager] Project deleted:', projectId);
        return true;
    }
    
    /**
     * 完成项目里程碑
     */
    completeProjectMilestone(projectId, actualTime, quality) {
        const project = this.getProjects().find(p => p.id === projectId);
        
        if (!project) {
            console.error('[TaskManager] Project not found:', projectId);
            return null;
        }
        
        const currentMilestone = project.currentMilestone || 0;
        
        if (currentMilestone >= project.milestones.length) {
            console.warn('[TaskManager] Project already completed:', project.name);
            return null;
        }
        
        // 更新里程碑
        const milestone = project.milestones[currentMilestone];
        milestone.completed = true;
        milestone.actualTime = actualTime;
        milestone.quality = quality;
        milestone.completedAt = new Date().toISOString();
        
        // 推进到下一个里程碑
        const updates = {
            currentMilestone: currentMilestone + 1,
            milestones: project.milestones
        };
        
        // 如果所有里程碑完成，标记项目完成
        if (updates.currentMilestone >= project.milestones.length) {
            updates.completed = true;
            updates.completedAt = new Date().toISOString();
        }
        
        this.updateProject(projectId, updates);
        
        console.log('[TaskManager] Project milestone completed:', milestone.name);
        return { project: { ...project, ...updates }, milestone };
    }
    
    // ========================================
    // 待办事项 (Todos)
    // ========================================
    
    /**
     * 获取所有待办
     */
    getTodos() {
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
        
        const newTodo = {
            id: todo.id,
            name: todo.name,
            deadline: todo.deadline,
            estimatedTime: todo.estimatedTime || 0,
            importance: todo.importance || 3,
            urgency: todo.urgency || 3,
            completed: false,
            createdAt: new Date().toISOString(),
            ...todo
        };
        
        todos.push(newTodo);
        this.state.set('todos', todos);
        
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
        console.log('[TaskManager] Todo deleted:', todoId);
        return true;
    }
    
    /**
     * 完成待办
     */
    completeTodo(todoId, actualTime, quality) {
        const todo = this.getTodos().find(t => t.id === todoId);
        
        if (!todo) {
            console.error('[TaskManager] Todo not found:', todoId);
            return null;
        }
        
        const updates = {
            completed: true,
            actualTime: actualTime,
            quality: quality,
            completedAt: new Date().toISOString()
        };
        
        this.updateTodo(todoId, updates);
        
        console.log('[TaskManager] Todo completed:', todo.name);
        return { ...todo, ...updates };
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

