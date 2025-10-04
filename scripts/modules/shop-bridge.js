// 火柴人时光管理器 - 商店桥接模块
// 这个模块负责将原有的商店功能与新模块连接起来

// 保存原始函数的引用
const originalShowWishShop = window.showWishShop;
const originalPurchaseItem = window.purchaseItem;
const originalCalculateFlameReward = window.calculateFlameReward;
const originalConfirmEndDay = window.confirmEndDay;

// 重写showWishShop函数
window.showWishShop = function() {
    // 调用新模块中的增强版显示函数
    if (window.shopModule && typeof window.shopModule.showEnhancedWishShop === 'function') {
        window.shopModule.showEnhancedWishShop();
    } else {
        // 如果新模块不可用，则使用原始函数
        originalShowWishShop();
    }
};

// 重写purchaseItem函数
window.purchaseItem = function(itemType) {
    // 初始化商店状态
    if (window.shopModule && typeof window.shopModule.initShopState === 'function') {
        window.shopModule.initShopState();
    }
    
    // 调用新模块中的增强版购买函数
    if (window.shopModule && typeof window.shopModule.purchaseEnhancedItem === 'function') {
        window.shopModule.purchaseEnhancedItem(itemType);
    } else {
        // 如果新模块不可用，则使用原始函数
        originalPurchaseItem(itemType);
    }
};

// 重写calculateFlameReward函数以支持新的火苗奖励调整
window.calculateFlameReward = function(baseReward) {
    let finalReward = originalCalculateFlameReward(baseReward);
    
    // 应用新商品的火苗调整效果
    return finalReward;
};

// 在适当的地方调用黑狗项圈效果检查
// 这需要在几个地方添加调用，比如在更新UI或完成任务后
const originalUpdateUI = window.updateUI;
window.updateUI = function() {
    originalUpdateUI();
    
    // 检查黑狗项圈效果
    if (window.shopModule && typeof window.shopModule.checkBlackDogCollarEffect === 'function') {
        window.shopModule.checkBlackDogCollarEffect();
    }
};

// 修改确认结束一天的函数
window.confirmEndDay = function() {
    // 应用灰烬符文效果
    if (window.shopModule && state.shop.activeEffects.ashRune) {
        // 修改灰烬转换率的计算
        const originalNewAsh = (state.stats.ash || 0) + (state.vacation.isOnVacation ? 0 : Math.floor(state.stats.flame / 2));
        
        // 应用调整后的灰烬转换率
        const adjustedConversionRate = window.shopModule.adjustAshConversion ? 
                                      window.shopModule.adjustAshConversion(0.5) : 0.5;
        
        // 重新计算灰烬值
        const adjustedNewAsh = (state.stats.ash || 0) + (state.vacation.isOnVacation ? 0 : Math.floor(state.stats.flame * adjustedConversionRate));
        
        // 暂存原始灰烬值
        const originalAsh = state.stats.ash;
        
        // 先调用原始函数处理其他逻辑
        originalConfirmEndDay();
        
        // 然后更新灰烬值为调整后的值
        state.stats.ash = adjustedNewAsh;
        
        // 输出日志记录灰烬增加效果
        const ashBonus = adjustedNewAsh - originalNewAsh;
        if (ashBonus > 0) {
            if (!state.logs) state.logs = [];
            state.logs.push(`[第${state.stats.totalDays}天] 灰烬符文效果：额外获得${ashBonus}点灰烬`);
        }
        
        // 保存状态并更新UI
        saveState();
        updateUI();
    } else {
        // 正常执行原始函数
        originalConfirmEndDay();
    }
    
    // 处理和重置当天的道具效果
    if (window.shopModule && typeof window.shopModule.processEndDayEffects === 'function') {
        window.shopModule.processEndDayEffects();
    }
};

// 修改完成日常任务、待办事项和项目里程碑的函数，以应用精力消耗调整
// 下面是针对每类任务的修改...

// 修改精力消耗计算
const originalFinishDailyTask = window.finishDailyTask;
window.finishDailyTask = function(taskId) {
    // 保存原始的计算精力消耗的部分
    const originalCalculateSpiritCost = function(task) {
        return task.interest === 'high' ? -20 : (task.interest === 'low' ? 40 : 20);
    };
    
    // 获取任务
    const task = state.dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 计算原始精力消耗
    const originalSpirit = state.stats.spirit;
    const originalSpiritCost = originalCalculateSpiritCost(task);
    
    // 应用商品效果调整精力消耗
    let adjustedSpiritCost = originalSpiritCost;
    if (window.shopModule && typeof window.shopModule.adjustSpiritCost === 'function') {
        adjustedSpiritCost = window.shopModule.adjustSpiritCost(originalSpiritCost);
    }
    
    // 临时修改task对象，使其使用调整后的精力消耗
    const originalInterest = task.interest;
    
    // 调用原始函数
    originalFinishDailyTask(taskId);
    
    // 如果精力值被原始函数修改了，计算实际消耗并手动调整为使用我们的调整值
    const actualSpiritChange = state.stats.spirit - originalSpirit;
    
    // 如果精力消耗与调整后的值不同，手动修正
    if (adjustedSpiritCost !== originalSpiritCost) {
        // 重新计算精力值
        state.stats.spirit = Math.max(0, Math.min(100, originalSpirit - adjustedSpiritCost));
        
        // 保存状态并更新UI
        saveState();
        updateUI();
    }
};

// 类似地修改完成待办事项的函数
const originalFinishTodo = window.finishTodo;
window.finishTodo = function(todoId) {
    // 获取任务
    const todo = state.todos.find(t => t.id === todoId);
    if (!todo) return;
    
    // 保存原始精力值
    const originalSpirit = state.stats.spirit;
    
    // 计算原始精力消耗
    let originalSpiritCost = 0;
    if (todo.duration <= 0.5) {
        originalSpiritCost = 10;
    } else if (todo.duration <= 1) {
        originalSpiritCost = 20;
    } else if (todo.duration <= 2) {
        originalSpiritCost = 40;
    } else {
        originalSpiritCost = 100;
    }
    
    // 应用商品效果调整精力消耗
    let adjustedSpiritCost = originalSpiritCost;
    if (window.shopModule && typeof window.shopModule.adjustSpiritCost === 'function') {
        adjustedSpiritCost = window.shopModule.adjustSpiritCost(originalSpiritCost);
    }
    
    // 调用原始函数
    originalFinishTodo(todoId);
    
    // 如果精力消耗与调整后的值不同，手动修正
    if (adjustedSpiritCost !== originalSpiritCost) {
        // 重新计算精力值
        state.stats.spirit = Math.max(0, Math.min(100, originalSpirit - adjustedSpiritCost));
        
        // 保存状态并更新UI
        saveState();
        updateUI();
    }
};

// 修改项目里程碑完成函数，以应用焰光水晶效果
const originalCompleteMilestone = window.completeMilestone;
window.completeMilestone = function(projectId) {
    // 保存原始的calculateFlameReward函数
    const originalCalcFlameReward = window.calculateFlameReward;
    
    // 临时重写calculateFlameReward函数以应用焰光水晶效果
    if (window.shopModule && typeof window.shopModule.adjustMilestoneReward === 'function') {
        window.calculateFlameReward = function(baseReward) {
            let reward = originalCalcFlameReward(baseReward);
            return window.shopModule.adjustMilestoneReward(reward);
        };
    }
    
    // 调用原始函数
    originalCompleteMilestone(projectId);
    
    // 恢复原始函数
    window.calculateFlameReward = originalCalcFlameReward;
};

console.log("商店桥接模块已加载"); 