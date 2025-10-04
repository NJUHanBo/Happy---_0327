// 状态管理器 - 集中管理应用状态的读写
// 这样我们可以逐步把main.js里直接操作state的代码迁移到这里

/**
 * 状态管理器
 * 提供统一的状态访问和修改接口
 */
class StateManager {
    constructor(initialState) {
        this._state = initialState || this._getDefaultState();
        this._listeners = [];
    }
    
    /**
     * 获取默认状态
     */
    _getDefaultState() {
        return {
            version: 1,
            character: null,
            dailyTasks: [],
            projects: [],
            todos: [],
            stats: {
                energy: 100,
                spirit: 50,
                sawdust: 100,
                flame: 100,
                totalDays: 1,
                burningDays: 0,
                ash: 10000
            },
            depression: {
                status: '黑狗缠身',
                dailySpirit: 50,
                nextMilestone: 7,
                milestones: {
                    7: { status: '黑狗退后', spirit: 60 },
                    30: { status: '黑狗退散', spirit: 75 },
                    60: { status: '战胜黑狗', spirit: 100 }
                }
            },
            currentDay: new Date().toISOString(),
            dailyThoughtCompleted: false,
            tips: [],
            settings: {
                scrollSpeed: 30,
                deepseek: {
                    useApi: false,
                    apiKey: ''
                }
            },
            backgroundSettings: {},
            shop: {
                activeEffects: {
                    fireStarter: false,
                    mirror: false,
                    oxygenChamber: false
                }
            },
            vacation: {
                isOnVacation: false,
                vacationType: null,
                startDate: null,
                endDate: null,
                canEndEarly: true
            },
            nightTransition: {
                videoPath: null,
                encouragements: ['今天辛苦了，好好休息吧 ✨']
            },
            drafts: [],
            magicAcademy: {
                discoveredParchments: [],
                lastExcavation: null
            }
        };
    }
    
    /**
     * 获取整个state（只读）
     */
    getState() {
        // 返回深拷贝，防止外部直接修改
        return JSON.parse(JSON.stringify(this._state));
    }
    
    /**
     * 获取state的某个字段
     */
    get(path) {
        const keys = path.split('.');
        let value = this._state;
        
        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }
        
        return value;
    }
    
    /**
     * 设置state的某个字段
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this._state;
        
        // 导航到目标对象
        for (const key of keys) {
            if (!(key in obj)) {
                obj[key] = {};
            }
            obj = obj[key];
        }
        
        // 设置值
        obj[lastKey] = value;
        
        // 通知监听器
        this._notifyListeners(path, value);
    }
    
    /**
     * 更新state（合并）
     */
    update(updates) {
        this._state = {
            ...this._state,
            ...updates
        };
        
        this._notifyListeners('*', updates);
    }
    
    /**
     * 替换整个state
     */
    replaceState(newState) {
        this._state = newState;
        this._notifyListeners('*', newState);
    }
    
    /**
     * 添加监听器
     */
    addListener(callback) {
        this._listeners.push(callback);
    }
    
    /**
     * 移除监听器
     */
    removeListener(callback) {
        const index = this._listeners.indexOf(callback);
        if (index > -1) {
            this._listeners.splice(index, 1);
        }
    }
    
    /**
     * 通知所有监听器
     */
    _notifyListeners(path, value) {
        this._listeners.forEach(callback => {
            try {
                callback(path, value, this._state);
            } catch (error) {
                console.error('[StateManager] Listener error:', error);
            }
        });
    }
    
    // === 便捷方法：Stats ===
    
    getStats() {
        return this.get('stats');
    }
    
    updateStats(updates) {
        this._state.stats = {
            ...this._state.stats,
            ...updates
        };
        this._notifyListeners('stats', this._state.stats);
    }
    
    // === 便捷方法：Character ===
    
    getCharacter() {
        return this.get('character');
    }
    
    setCharacter(character) {
        this.set('character', character);
    }
    
    // === 便捷方法：Tasks ===
    
    getDailyTasks() {
        return this.get('dailyTasks') || [];
    }
    
    addDailyTask(task) {
        if (!this._state.dailyTasks) {
            this._state.dailyTasks = [];
        }
        this._state.dailyTasks.push(task);
        this._notifyListeners('dailyTasks', this._state.dailyTasks);
    }
    
    updateDailyTask(taskId, updates) {
        const tasks = this._state.dailyTasks || [];
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            this._notifyListeners('dailyTasks', tasks);
        }
    }
    
    removeDailyTask(taskId) {
        if (this._state.dailyTasks) {
            this._state.dailyTasks = this._state.dailyTasks.filter(t => t.id !== taskId);
            this._notifyListeners('dailyTasks', this._state.dailyTasks);
        }
    }
    
    getProjects() {
        return this.get('projects') || [];
    }
    
    addProject(project) {
        if (!this._state.projects) {
            this._state.projects = [];
        }
        this._state.projects.push(project);
        this._notifyListeners('projects', this._state.projects);
    }
    
    updateProject(projectId, updates) {
        const projects = this._state.projects || [];
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            this._notifyListeners('projects', projects);
        }
    }
    
    removeProject(projectId) {
        if (this._state.projects) {
            this._state.projects = this._state.projects.filter(p => p.id !== projectId);
            this._notifyListeners('projects', this._state.projects);
        }
    }
    
    getTodos() {
        return this.get('todos') || [];
    }
    
    addTodo(todo) {
        if (!this._state.todos) {
            this._state.todos = [];
        }
        this._state.todos.push(todo);
        this._notifyListeners('todos', this._state.todos);
    }
    
    updateTodo(todoId, updates) {
        const todos = this._state.todos || [];
        const index = todos.findIndex(t => t.id === todoId);
        
        if (index !== -1) {
            todos[index] = { ...todos[index], ...updates };
            this._notifyListeners('todos', todos);
        }
    }
    
    removeTodo(todoId) {
        if (this._state.todos) {
            this._state.todos = this._state.todos.filter(t => t.id !== todoId);
            this._notifyListeners('todos', this._state.todos);
        }
    }
}

// 创建全局实例
let stateManager = null;

function getStateManager() {
    if (!stateManager) {
        stateManager = new StateManager();
    }
    return stateManager;
}

function initStateManager(initialState) {
    stateManager = new StateManager(initialState);
    return stateManager;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StateManager,
        getStateManager,
        initStateManager
    };
} else {
    window.StateManager = StateManager;
    window.getStateManager = getStateManager;
    window.initStateManager = initStateManager;
}

