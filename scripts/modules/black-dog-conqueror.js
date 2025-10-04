// 火柴人时光管理器 - 黑狗征服者模块
// 这个模块实现了对"高重要低兴趣"任务的特殊奖励机制

// 检查模块是否已加载，防止重复声明变量
if (window.blackDogConquerorLoaded) {
    console.log("黑狗征服者主模块已经加载，跳过重复加载");
} else {
    // 黑狗征服者状态对象
    const blackDogConquerorState = {
        // 连击计数器
        combo: 0,
        // 当天已完成的高重要低兴趣任务数量
        completedToday: 0,
        // 总共已完成的高重要低兴趣任务数量
        totalCompleted: 0,
        // 连击加成上限(3次)
        maxCombo: 3
    };

    // 初始化黑狗征服者状态
    function initBlackDogConquerorState() {
        // 确保state对象包含blackDogConqueror对象
        if (!state.blackDogConqueror) {
            state.blackDogConqueror = {
                combo: 0,
                completedToday: 0,
                totalCompleted: 0
            };
        }
    }

    // 检查任务是否符合"黑狗征服者"条件（高重要低兴趣）
    function isBlackDogTask(task) {
        return task && task.importance === 'high' && task.interest === 'low';
    }

    // 计算黑狗征服者的连击加成
    function getComboBonus() {
        // 确保state对象包含blackDogConqueror对象
        initBlackDogConquerorState();
        
        // 获取当前连击数
        const combo = state.blackDogConqueror.combo || 0;
        
        // 每连击一次增加25%的奖励，最多75%（连击3次）
        return Math.min(combo * 0.25, blackDogConquerorState.maxCombo * 0.25);
    }

    // 更新连击计数
    function updateCombo(isBlackDogTaskCompleted) {
        // 确保state对象包含blackDogConqueror对象
        initBlackDogConquerorState();
        
        if (isBlackDogTaskCompleted) {
            // 增加连击计数
            state.blackDogConqueror.combo = (state.blackDogConqueror.combo || 0) + 1;
            // 增加完成计数
            state.blackDogConqueror.completedToday = (state.blackDogConqueror.completedToday || 0) + 1;
            state.blackDogConqueror.totalCompleted = (state.blackDogConqueror.totalCompleted || 0) + 1;
        } else {
            // 完成的不是黑狗任务，重置连击
            state.blackDogConqueror.combo = 0;
        }
        
        // 保存状态
        saveState();
    }

    // 应用黑狗征服者奖励
    function applyBlackDogRewards(task, baseFlameReward) {
        // 如果不是黑狗任务，不应用奖励
        if (!isBlackDogTask(task)) return baseFlameReward;
        
        // 确保state对象包含blackDogConqueror对象
        initBlackDogConquerorState();
        
        // 1. 火苗暴击：奖励翻倍(+100%)
        let finalFlameReward = baseFlameReward * 2;
        
        // 2. 应用连击加成
        const comboBonus = getComboBonus();
        if (comboBonus > 0) {
            finalFlameReward = Math.floor(finalFlameReward * (1 + comboBonus));
        }
        
        // 注意：精力恢复逻辑已移至bridge模块，在原始函数调用后处理
        // 这里不再直接修改精力值，以防止被原始函数覆盖
        
        // 4. 双倍灰烬：直接获得等量的灰烬
        state.stats.ash += finalFlameReward;
        
        // 更新连击计数
        updateCombo(true);
        
        // 显示特殊效果
        showBlackDogConquerorEffect(finalFlameReward, comboBonus);
        
        // 返回调整后的火苗奖励
        return finalFlameReward;
    }

    // 显示黑狗征服者特效
    function showBlackDogConquerorEffect(reward, comboBonus) {
        // 构建特效HTML
        const effectHtml = `
            <div class="black-dog-conqueror-effect">
                <div class="effect-title">黑狗征服者！</div>
                <div class="effect-details">
                    <p>🔥 火苗奖励翻倍: +${reward}</p>
                    <p>✨ 精力恢复: +20</p>
                    <p>🧠 获得等量灰烬: +${reward}</p>
                    ${comboBonus > 0 ? `<p>🔄 连击加成: +${Math.round(comboBonus * 100)}%</p>` : ''}
                    <p class="effect-combo">连击次数: ${state.blackDogConqueror.combo}</p>
                </div>
            </div>
        `;
        
        // 创建特效元素
        const effectElement = document.createElement('div');
        effectElement.className = 'black-dog-conqueror-container';
        effectElement.innerHTML = effectHtml;
        
        // 添加到页面
        document.body.appendChild(effectElement);
        
        // 添加日志记录
        if (!state.logs) state.logs = [];
        const comboText = state.blackDogConqueror.combo > 1 ? ` (连击x${state.blackDogConqueror.combo})` : '';
        state.logs.push(`[第${state.stats.totalDays}天] 黑狗征服者！完成高重要低兴趣任务，获得双倍火苗和灰烬${comboText}`);
        
        // 3秒后自动移除特效
        setTimeout(() => {
            if (effectElement && effectElement.parentNode) {
                effectElement.classList.add('fade-out');
                setTimeout(() => {
                    if (effectElement && effectElement.parentNode) {
                        effectElement.parentNode.removeChild(effectElement);
                    }
                }, 1000);
            }
        }, 3000);
    }

    // 在结束一天时重置连击计数
    function resetDailyStatus() {
        // 确保state对象包含blackDogConqueror对象
        initBlackDogConquerorState();
        
        // 重置连击和当天完成计数
        state.blackDogConqueror.combo = 0;
        state.blackDogConqueror.completedToday = 0;
        
        // 保存状态
        saveState();
    }

    // 导出模块函数
    window.blackDogConquerorModule = {
        isBlackDogTask,
        applyBlackDogRewards,
        updateCombo,
        resetDailyStatus,
        initBlackDogConquerorState
    };

    // 标记模块已加载
    window.blackDogConquerorLoaded = true;
    console.log("黑狗征服者主模块已加载 - 版本 1.2");
} 