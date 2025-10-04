// 火柴人时光管理器 - 黑狗征服者桥接模块
// 这个模块负责将黑狗征服者功能与原系统连接起来

// 检查模块是否已加载，防止重复声明变量
if (window.blackDogBridgeLoaded) {
    console.log("黑狗征服者桥接模块已经加载，跳过重复加载");
} else {
    // 保存原始函数的引用
    const originalFinishDailyTask = window.finishDailyTask;
    const originalFinishTodo = window.finishTodo;
    const originalCompleteMilestone = window.completeMilestone;
    const originalConfirmEndDay = window.confirmEndDay;
    const originalCalculateFlameReward = window.calculateFlameReward;

    // 重写完成日常任务函数
    window.finishDailyTask = function(taskId) {
        // 初始化黑狗征服者状态
        if (window.blackDogConquerorModule && typeof window.blackDogConquerorModule.initBlackDogConquerorState === 'function') {
            window.blackDogConquerorModule.initBlackDogConquerorState();
        }
        
        // 获取任务
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (!task) return;
        
        // 检查是否为黑狗任务
        const isBlackDogTask = window.blackDogConquerorModule && 
                              typeof window.blackDogConquerorModule.isBlackDogTask === 'function' && 
                              window.blackDogConquerorModule.isBlackDogTask(task);
        
        // 如果是黑狗任务，记录原始精力值和基础奖励
        const originalSpirit = state.stats.spirit;
        const originalFlame = state.stats.flame;
        
        // 暂存计算火苗奖励的原始函数
        const originalCalcFlameReward = window.calculateFlameReward;
        
        // 记录当前日志长度，用于稍后修改日志
        const originalLogsLength = state.logs ? state.logs.length : 0;
        
        // 如果是黑狗任务，临时修改calculateFlameReward函数
        if (isBlackDogTask && window.blackDogConquerorModule && typeof window.blackDogConquerorModule.applyBlackDogRewards === 'function') {
            window.calculateFlameReward = function(baseReward) {
                // 计算基础奖励
                const baseFlameReward = originalCalcFlameReward(baseReward);
                // 应用黑狗征服者奖励
                return window.blackDogConquerorModule.applyBlackDogRewards(task, baseFlameReward);
            };
        }
        
        // 调用原始函数
        originalFinishDailyTask(taskId);
        
        // 恢复原始的calculateFlameReward函数
        window.calculateFlameReward = originalCalcFlameReward;
        
        // 如果是黑狗任务，修改日志记录
        if (isBlackDogTask && state.logs && state.logs.length > originalLogsLength) {
            // 获取最新添加的日志
            const latestLog = state.logs[state.logs.length - 1];
            // 在日志中添加黑狗任务信息
            state.logs[state.logs.length - 1] = latestLog.replace('完成日常任务', '完成黑狗任务') + '【黑狗征服者：双倍火苗奖励】';
        }
        
        // 如果是黑狗任务，强制恢复精力（抵消原始函数的精力消耗）
        if (isBlackDogTask) {
            // 计算原始函数消耗的精力
            const spiritCost = task.interest === 'high' ? -20 : (task.interest === 'low' ? 40 : 20);
            // 手动恢复精力(原始值+20)，并确保不超过100
            state.stats.spirit = Math.min(100, originalSpirit + 20);
            // 更新UI显示
            updateUI();
            // 添加日志记录
            console.log(`黑狗任务完成: 精力从${originalSpirit}恢复到${state.stats.spirit}`);
        }
        
        // 如果不是黑狗任务，更新连击计数（重置）
        if (!isBlackDogTask && window.blackDogConquerorModule && typeof window.blackDogConquerorModule.updateCombo === 'function') {
            window.blackDogConquerorModule.updateCombo(false);
        }
    };

    // 重写完成待办事项函数
    window.finishTodo = function(todoId) {
        // 初始化黑狗征服者状态
        if (window.blackDogConquerorModule && typeof window.blackDogConquerorModule.initBlackDogConquerorState === 'function') {
            window.blackDogConquerorModule.initBlackDogConquerorState();
        }
        
        // 获取待办事项
        const todo = state.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        // 检查是否为黑狗任务
        const isBlackDogTask = window.blackDogConquerorModule && 
                              typeof window.blackDogConquerorModule.isBlackDogTask === 'function' && 
                              window.blackDogConquerorModule.isBlackDogTask(todo);
        
        // 如果是黑狗任务，记录原始精力值和基础奖励
        const originalSpirit = state.stats.spirit;
        const originalFlame = state.stats.flame;
        
        // 暂存计算火苗奖励的原始函数
        const originalCalcFlameReward = window.calculateFlameReward;
        
        // 记录当前日志长度，用于稍后修改日志
        const originalLogsLength = state.logs ? state.logs.length : 0;
        
        // 如果是黑狗任务，临时修改calculateFlameReward函数
        if (isBlackDogTask && window.blackDogConquerorModule && typeof window.blackDogConquerorModule.applyBlackDogRewards === 'function') {
            window.calculateFlameReward = function(baseReward) {
                // 计算基础奖励
                const baseFlameReward = originalCalcFlameReward(baseReward);
                // 应用黑狗征服者奖励
                return window.blackDogConquerorModule.applyBlackDogRewards(todo, baseFlameReward);
            };
        }
        
        // 调用原始函数
        originalFinishTodo(todoId);
        
        // 恢复原始的calculateFlameReward函数
        window.calculateFlameReward = originalCalcFlameReward;
        
        // 如果是黑狗任务，修改日志记录
        if (isBlackDogTask && state.logs && state.logs.length > originalLogsLength) {
            // 获取最新添加的日志
            const latestLog = state.logs[state.logs.length - 1];
            // 在日志中添加黑狗任务信息
            state.logs[state.logs.length - 1] = latestLog.replace('完成待办事项', '完成黑狗任务') + '【黑狗征服者：双倍火苗奖励】';
        }
        
        // 如果是黑狗任务，强制恢复精力（抵消原始函数的精力消耗）
        if (isBlackDogTask) {
            // 计算预计消耗的精力
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
            // 手动恢复精力(原始值+20)，并确保不超过100
            state.stats.spirit = Math.min(100, originalSpirit + 20);
            // 更新UI显示
            updateUI();
            // 添加日志记录
            console.log(`黑狗任务完成: 精力从${originalSpirit}恢复到${state.stats.spirit}`);
        }
        
        // 如果不是黑狗任务，更新连击计数（重置）
        if (!isBlackDogTask && window.blackDogConquerorModule && typeof window.blackDogConquerorModule.updateCombo === 'function') {
            window.blackDogConquerorModule.updateCombo(false);
        }
    };

    // 修改项目里程碑完成函数
    window.completeMilestone = function(projectId) {
        // 初始化黑狗征服者状态
        if (window.blackDogConquerorModule && typeof window.blackDogConquerorModule.initBlackDogConquerorState === 'function') {
            window.blackDogConquerorModule.initBlackDogConquerorState();
        }
        
        // 获取项目
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        // 检查是否为黑狗任务
        const isBlackDogTask = project && window.blackDogConquerorModule && 
                               typeof window.blackDogConquerorModule.isBlackDogTask === 'function' && 
                               window.blackDogConquerorModule.isBlackDogTask(project);
        
        // 如果是黑狗任务，记录原始精力值和基础奖励
        const originalSpirit = state.stats.spirit;
        const originalFlame = state.stats.flame;
        
        // 暂存计算火苗奖励的原始函数
        const originalCalcFlameReward = window.calculateFlameReward;
        
        // 记录当前日志长度，用于稍后修改日志
        const originalLogsLength = state.logs ? state.logs.length : 0;
        
        // 如果是黑狗任务，临时修改calculateFlameReward函数
        if (isBlackDogTask && window.blackDogConquerorModule && typeof window.blackDogConquerorModule.applyBlackDogRewards === 'function') {
            window.calculateFlameReward = function(baseReward) {
                // 计算基础奖励
                const baseFlameReward = originalCalcFlameReward(baseReward);
                // 应用黑狗征服者奖励
                return window.blackDogConquerorModule.applyBlackDogRewards(project, baseFlameReward);
            };
        }
        
        // 调用原始函数
        originalCompleteMilestone(projectId);
        
        // 恢复原始的calculateFlameReward函数
        window.calculateFlameReward = originalCalcFlameReward;
        
        // 如果是黑狗任务，修改日志记录
        if (isBlackDogTask && state.logs && state.logs.length > originalLogsLength) {
            // 获取最新添加的日志
            const latestLog = state.logs[state.logs.length - 1];
            // 判断是项目完成还是节点完成
            if (latestLog.includes('完成项目：')) {
                state.logs[state.logs.length - 1] = latestLog.replace('完成项目：', '完成黑狗项目：') + '【黑狗征服者：双倍火苗奖励】';
            } else if (latestLog.includes('完成项目节点：')) {
                state.logs[state.logs.length - 1] = latestLog.replace('完成项目节点：', '完成黑狗项目节点：') + '【黑狗征服者：双倍火苗奖励】';
            }
        }
        
        // 如果是黑狗任务，强制恢复精力
        if (isBlackDogTask) {
            // 手动恢复精力(原始值+20)，并确保不超过100
            state.stats.spirit = Math.min(100, originalSpirit + 20);
            // 更新UI显示
            updateUI();
            // 添加日志记录
            console.log(`黑狗项目阶段完成: 精力从${originalSpirit}恢复到${state.stats.spirit}`);
        } else {
            // 项目里程碑完成不是黑狗任务，重置连击
            if (window.blackDogConquerorModule && typeof window.blackDogConquerorModule.updateCombo === 'function') {
                window.blackDogConquerorModule.updateCombo(false);
            }
        }
    };

    // 重写结束一天函数
    window.confirmEndDay = function() {
        // 重置黑狗征服者每日状态
        if (window.blackDogConquerorModule && typeof window.blackDogConquerorModule.resetDailyStatus === 'function') {
            window.blackDogConquerorModule.resetDailyStatus();
        }
        
        // 调用原始函数
        originalConfirmEndDay();
    };

    // 添加黑狗征服者统计到任务统计页面
    const originalShowStats = window.showStats;
    window.showStats = function() {
        // 调用原始函数
        originalShowStats();
        
        // 初始化黑狗征服者状态
        if (window.blackDogConquerorModule && typeof window.blackDogConquerorModule.initBlackDogConquerorState === 'function') {
            window.blackDogConquerorModule.initBlackDogConquerorState();
        }
        
        // 获取统计对话框
        const statsDialog = document.querySelector('.dialog-content');
        if (!statsDialog) return;
        
        // 创建黑狗征服者统计部分
        const blackDogStats = document.createElement('div');
        blackDogStats.className = 'stats-section black-dog-stats';
        blackDogStats.innerHTML = `
            <h3>黑狗征服者统计</h3>
            <p>已完成高重要低兴趣任务：${state.blackDogConqueror.totalCompleted || 0} 个</p>
            <p>今日连击次数：${state.blackDogConqueror.combo || 0} 次</p>
            <p>当前连击加成：${Math.round((getComboBonus() || 0) * 100)}%</p>
        `;
        
        // 添加到统计对话框
        statsDialog.appendChild(blackDogStats);
        
        // 辅助函数：获取连击加成
        function getComboBonus() {
            if (!window.blackDogConquerorModule || !state.blackDogConqueror) return 0;
            
            const combo = state.blackDogConqueror.combo || 0;
            return Math.min(combo * 0.25, 0.75);
        }
    };

    // 标记模块已加载
    window.blackDogBridgeLoaded = true;
    console.log("黑狗征服者桥接模块已加载");
} 