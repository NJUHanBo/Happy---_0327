// 火柴人时光管理器 - 愿望商店模块
// 这个模块扩展了原有的商店功能，添加了新的商品

// 扩展state.shop对象的结构，添加新商品的状态
function initShopState() {
    // 确保shop对象存在
    if (!state.shop) {
        state.shop = {
            activeEffects: {}
        };
    }

    // 确保activeEffects对象存在
    if (!state.shop.activeEffects) {
        state.shop.activeEffects = {};
    }

    // 初始化现有的商品状态（如果不存在）
    if (state.shop.activeEffects.fireStarter === undefined) {
        state.shop.activeEffects.fireStarter = false;
    }
    if (state.shop.activeEffects.mirror === undefined) {
        state.shop.activeEffects.mirror = false;
    }
    if (state.shop.activeEffects.oxygenChamber === undefined) {
        state.shop.activeEffects.oxygenChamber = false;
    }

    // 初始化新商品状态
    // 零食饮料
    if (state.shop.activeEffects.flameTea === undefined) {
        state.shop.activeEffects.flameTea = false;
    }
    if (state.shop.activeEffects.sparkCandy === undefined) {
        state.shop.activeEffects.sparkCandy = false;
    }
    if (state.shop.activeEffects.sawdustCookie === undefined) {
        state.shop.activeEffects.sawdustCookie = false;
    }

    // 娱乐设施
    if (state.shop.activeEffects.memoryChessboard === undefined) {
        state.shop.activeEffects.memoryChessboard = false;
    }
    if (state.shop.activeEffects.glowingPen === undefined) {
        state.shop.activeEffects.glowingPen = false;
    }
    if (state.shop.activeEffects.whisperingMusicBox === undefined) {
        state.shop.activeEffects.whisperingMusicBox = false;
    }

    // 神秘货架
    if (state.shop.activeEffects.ashRune === undefined) {
        state.shop.activeEffects.ashRune = false;
    }
    if (state.shop.activeEffects.blackDogCollar === undefined) {
        state.shop.activeEffects.blackDogCollar = false;
    }
    if (state.shop.activeEffects.flameLight === undefined) {
        state.shop.activeEffects.flameLight = false;
    }
}

// 商品定义
const SHOP_ITEMS = {
    // 功能货架 - 现有商品
    fireStarter: {
        name: '助燃剂',
        cost: 100,
        description: '确保明天火苗不减半',
        effectType: 'overnight',
        effectDuration: 'nextDay'
    },
    mirror: {
        name: '镜子',
        cost: 200,
        description: '今天完成任务获得的火苗翻倍',
        effectType: 'reward',
        effectDuration: 'today'
    },
    oxygenChamber: {
        name: '富氧舱',
        cost: 5000,
        description: '永久使任务获得的火苗翻倍',
        effectType: 'reward',
        effectDuration: 'permanent'
    },

    // 零食饮料 - 新商品
    flameTea: {
        name: '火种茶',
        cost: 30,
        description: '采用远古火种叶泡制，饮用后能感受到一丝火柴神的温暖，轻微提升精神状态',
        effect: '立即恢复10点精力',
        effectType: 'instant',
        effectValue: 10,
        effectTarget: 'spirit'
    },
    sparkCandy: {
        name: '焰火糖',
        cost: 20,
        description: '魔法学院学徒们喜爱的小零食，据说含有微量火种能量，可以短暂提振体力',
        effect: '立即恢复5点体力',
        effectType: 'instant',
        effectValue: 5,
        effectTarget: 'energy'
    },
    sawdustCookie: {
        name: '木屑饼干',
        cost: 50,
        description: '火柴世界的传统点心，能在体内形成优质木屑，增强火苗的持久性',
        effect: '立即获得10点木屑',
        effectType: 'instant',
        effectValue: 10,
        effectTarget: 'sawdust'
    },

    // 娱乐设施 - 新商品
    memoryChessboard: {
        name: '记忆棋盘',
        cost: 40,
        description: '魔法学院的思维训练工具，通过简单的棋类游戏缓解心灵压力，让黑狗暂时安静',
        effect: '今天完成任务时，精力消耗减少10%',
        effectType: 'cost',
        effectDuration: 'today',
        effectTarget: 'spirit',
        effectValue: 0.1 // 10%减少
    },
    glowingPen: {
        name: '发光墨水笔',
        cost: 60,
        description: '用火柴神赐福的墨水制成，书写时会微微发光，让计划更有动力去执行',
        effect: '今天新添加的待办事项火苗奖励+5%',
        effectType: 'bonus',
        effectDuration: 'today',
        effectTarget: 'newTodo',
        effectValue: 0.05 // 5%增加
    },
    whisperingMusicBox: {
        name: '呢喃音盒',
        cost: 70,
        description: '据说装有火柴神的轻声鼓励，打开后能听到令人心安的旋律，暂时驱散黑狗的低语',
        effect: '今天完成的第一个任务不消耗精力',
        effectType: 'freeTask',
        effectDuration: 'today',
        effectTarget: 'spirit',
        effectValue: 1 // 一次免费
    },

    // 神秘货架 - 新商品
    ashRune: {
        name: '灰烬符文',
        cost: 100,
        description: '古代火柴人刻下的神秘符文，能让火苗中蕴含的能量更好地转化为灰烬',
        effect: '今天结束时，火苗转化为灰烬的效率提高10%',
        effectType: 'overnight',
        effectDuration: 'today',
        effectTarget: 'ashConversion',
        effectValue: 0.1 // 10%提高
    },
    blackDogCollar: {
        name: '黑狗项圈',
        cost: 150,
        description: '一种看不见的精神束缚，能在黑狗最猖狂时短暂控制它，给你喘息的机会',
        effect: '今天精力值低于20时，自动恢复10点精力（仅触发一次）',
        effectType: 'autoHeal',
        effectDuration: 'today',
        effectTarget: 'spirit',
        effectThreshold: 20,
        effectValue: 10,
        effectUsed: false
    },
    flameLight: {
        name: '焰光水晶',
        cost: 200,
        description: '魔法学院废墟中发掘的稀有水晶，能短暂增幅火柴人的成就感',
        effect: '下一次完成的项目节点，奖励火苗翻倍',
        effectType: 'nextMilestone',
        effectDuration: 'once',
        effectTarget: 'flame',
        effectValue: 2, // 翻倍
        effectUsed: false
    }
};

// 显示增强版愿望商店
function showEnhancedWishShop() {
    // 确保商店状态已初始化
    initShopState();
    
    // 获取当前激活的效果列表
    const activeEffectsList = [];
    
    // 添加现有的效果
    if (state.shop.activeEffects.fireStarter) {
        activeEffectsList.push({
            name: '助燃剂',
            effect: '明天火苗不会减半',
            icon: '🔥'
        });
    }
    if (state.shop.activeEffects.mirror) {
        activeEffectsList.push({
            name: '镜子',
            effect: '今天任务火苗翻倍',
            icon: '🪞'
        });
    }
    if (state.shop.activeEffects.oxygenChamber) {
        activeEffectsList.push({
            name: '富氧舱',
            effect: '永久任务火苗翻倍',
            icon: '🫧'
        });
    }
    
    // 添加新商品的效果
    if (state.shop.activeEffects.memoryChessboard) {
        activeEffectsList.push({
            name: '记忆棋盘',
            effect: '今天精力消耗减少10%',
            icon: '♟️'
        });
    }
    if (state.shop.activeEffects.glowingPen) {
        activeEffectsList.push({
            name: '发光墨水笔',
            effect: '今天新待办火苗+5%',
            icon: '✒️'
        });
    }
    if (state.shop.activeEffects.whisperingMusicBox) {
        activeEffectsList.push({
            name: '呢喃音盒',
            effect: '首个任务免精力',
            icon: '🎵'
        });
    }
    if (state.shop.activeEffects.ashRune) {
        activeEffectsList.push({
            name: '灰烬符文',
            effect: '火苗灰烬转化+10%',
            icon: '🔮'
        });
    }
    if (state.shop.activeEffects.blackDogCollar) {
        activeEffectsList.push({
            name: '黑狗项圈',
            effect: '精力低时自动恢复',
            icon: '🔗'
        });
    }
    if (state.shop.activeEffects.flameLight) {
        activeEffectsList.push({
            name: '焰光水晶',
            effect: '下个项目节点奖励翻倍',
            icon: '💎'
        });
    }

    const activeEffectsHtml = activeEffectsList.length > 0 ? `
        <div class="active-effects">
            <h4>当前激活的效果</h4>
            ${activeEffectsList.map(effect => `
                <div class="effect-item">
                    <span class="effect-icon">${effect.icon}</span>
                    <span>${effect.name}：${effect.effect}</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    // 构建商店HTML
    const shopContent = `
        <h2>愿望商店</h2>
        ${activeEffectsHtml}
        <div class="shop-container">
            <div class="shop-shelf">
                <h3>功能货架</h3>
                <div class="shop-items">
                    <div class="shop-item">
                        <h4>助燃剂</h4>
                        <p>花费：100灰烬</p>
                        <p>效果：确保明天火苗不减半</p>
                        <button onclick="purchaseItem('fireStarter')" 
                            ${state.stats.ash < 100 || state.shop.activeEffects.fireStarter ? 'disabled' : ''}>
                            ${state.shop.activeEffects.fireStarter ? '已购买' : '购买'}
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>镜子</h4>
                        <p>花费：200灰烬</p>
                        <p>效果：今天完成任务获得的火苗翻倍</p>
                        <button onclick="purchaseItem('mirror')" 
                            ${state.stats.ash < 200 || state.shop.activeEffects.mirror ? 'disabled' : ''}>
                            ${state.shop.activeEffects.mirror ? '已购买' : '购买'}
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>富氧舱</h4>
                        <p>花费：5000灰烬</p>
                        <p>效果：永久使任务获得的火苗翻倍</p>
                        <button onclick="purchaseItem('oxygenChamber')" 
                            ${state.stats.ash < 5000 || state.shop.activeEffects.oxygenChamber ? 'disabled' : ''}>
                            ${state.shop.activeEffects.oxygenChamber ? '已购买' : '购买'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 零食饮料货架 -->
            <div class="shop-shelf">
                <h3>零食饮料</h3>
                <div class="shop-items">
                    <div class="shop-item">
                        <h4>火种茶</h4>
                        <p>花费：30灰烬</p>
                        <p>效果：立即恢复10点精力</p>
                        <p class="item-description">采用远古火种叶泡制，饮用后能感受到一丝火柴神的温暖</p>
                        <button onclick="purchaseItem('flameTea')" 
                            ${state.stats.ash < 30 ? 'disabled' : ''}>
                            购买
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>焰火糖</h4>
                        <p>花费：20灰烬</p>
                        <p>效果：立即恢复5点体力</p>
                        <p class="item-description">魔法学院学徒们喜爱的小零食，含有微量火种能量</p>
                        <button onclick="purchaseItem('sparkCandy')" 
                            ${state.stats.ash < 20 ? 'disabled' : ''}>
                            购买
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>木屑饼干</h4>
                        <p>花费：50灰烬</p>
                        <p>效果：立即获得10点木屑</p>
                        <p class="item-description">火柴世界的传统点心，能在体内形成优质木屑</p>
                        <button onclick="purchaseItem('sawdustCookie')" 
                            ${state.stats.ash < 50 ? 'disabled' : ''}>
                            购买
                        </button>
                    </div>
                </div>
            </div>

            <!-- 娱乐设施货架 -->
            <div class="shop-shelf">
                <h3>娱乐设施</h3>
                <div class="shop-items">
                    <div class="shop-item">
                        <h4>记忆棋盘</h4>
                        <p>花费：40灰烬</p>
                        <p>效果：今天精力消耗减少10%</p>
                        <p class="item-description">魔法学院的思维训练工具，缓解心灵压力</p>
                        <button onclick="purchaseItem('memoryChessboard')" 
                            ${state.stats.ash < 40 || state.shop.activeEffects.memoryChessboard ? 'disabled' : ''}>
                            ${state.shop.activeEffects.memoryChessboard ? '已购买' : '购买'}
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>发光墨水笔</h4>
                        <p>花费：60灰烬</p>
                        <p>效果：今天新添加的待办事项火苗奖励+5%</p>
                        <p class="item-description">用火柴神赐福的墨水制成，让计划更有动力去执行</p>
                        <button onclick="purchaseItem('glowingPen')" 
                            ${state.stats.ash < 60 || state.shop.activeEffects.glowingPen ? 'disabled' : ''}>
                            ${state.shop.activeEffects.glowingPen ? '已购买' : '购买'}
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>呢喃音盒</h4>
                        <p>花费：70灰烬</p>
                        <p>效果：今天完成的第一个任务不消耗精力</p>
                        <p class="item-description">据说装有火柴神的轻声鼓励，暂时驱散黑狗的低语</p>
                        <button onclick="purchaseItem('whisperingMusicBox')" 
                            ${state.stats.ash < 70 || state.shop.activeEffects.whisperingMusicBox ? 'disabled' : ''}>
                            ${state.shop.activeEffects.whisperingMusicBox ? '已购买' : '购买'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 神秘货架 -->
            <div class="shop-shelf">
                <h3>神秘货架</h3>
                <div class="shop-items">
                    <div class="shop-item">
                        <h4>灰烬符文</h4>
                        <p>花费：100灰烬</p>
                        <p>效果：今天结束时，火苗转化为灰烬的效率提高10%</p>
                        <p class="item-description">古代火柴人刻下的神秘符文，优化能量转化</p>
                        <button onclick="purchaseItem('ashRune')" 
                            ${state.stats.ash < 100 || state.shop.activeEffects.ashRune ? 'disabled' : ''}>
                            ${state.shop.activeEffects.ashRune ? '已购买' : '购买'}
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>黑狗项圈</h4>
                        <p>花费：150灰烬</p>
                        <p>效果：今天精力值低于20时，自动恢复10点精力（仅触发一次）</p>
                        <p class="item-description">一种看不见的精神束缚，在黑狗最猖狂时短暂控制它</p>
                        <button onclick="purchaseItem('blackDogCollar')" 
                            ${state.stats.ash < 150 || state.shop.activeEffects.blackDogCollar ? 'disabled' : ''}>
                            ${state.shop.activeEffects.blackDogCollar ? '已购买' : '购买'}
                        </button>
                    </div>
                    <div class="shop-item">
                        <h4>焰光水晶</h4>
                        <p>花费：200灰烬</p>
                        <p>效果：下一次完成的项目节点，奖励火苗翻倍</p>
                        <p class="item-description">魔法学院废墟中发掘的稀有水晶，能短暂增幅成就感</p>
                        <button onclick="purchaseItem('flameLight')" 
                            ${state.stats.ash < 200 || state.shop.activeEffects.flameLight ? 'disabled' : ''}>
                            ${state.shop.activeEffects.flameLight ? '已购买' : '购买'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">关闭</button>
        </div>
    `;

    // 显示商店对话框
    showDialog(shopContent);
}

// 扩展后的购买商品函数
function purchaseEnhancedItem(itemType) {
    // 获取商品信息
    const item = SHOP_ITEMS[itemType];
    if (!item) {
        console.error(`商品类型不存在: ${itemType}`);
        return;
    }
    
    // 检查灰烬是否足够
    if (state.stats.ash < item.cost) {
        alert('灰烬不足！');
        return;
    }
    
    // 扣除灰烬
    state.stats.ash -= item.cost;
    
    // 根据商品类型应用效果
    switch (itemType) {
        // 现有商品效果保持不变
        case 'fireStarter':
            state.shop.activeEffects.fireStarter = true;
            alert('购买成功！明天的火苗将不会减半。');
            break;
        case 'mirror':
            state.shop.activeEffects.mirror = true;
            alert('购买成功！今天完成任务获得的火苗将翻倍。');
            break;
        case 'oxygenChamber':
            state.shop.activeEffects.oxygenChamber = true;
            alert('购买成功！从此以后完成任务获得的火苗将永久翻倍！');
            break;
            
        // 即时消耗类商品
        case 'flameTea':
            // 立即恢复10点精力
            state.stats.spirit = Math.min(100, state.stats.spirit + 10);
            alert('你品尝了火种茶，精力恢复了10点！');
            break;
        case 'sparkCandy':
            // 立即恢复5点体力
            state.stats.energy = Math.min(100, state.stats.energy + 5);
            alert('你吃了一颗焰火糖，体力恢复了5点！');
            break;
        case 'sawdustCookie':
            // 立即获得10点木屑
            state.stats.sawdust += 10;
            alert('你吃了一块木屑饼干，获得了10点木屑！');
            break;
            
        // 持续效果类商品
        case 'memoryChessboard':
            state.shop.activeEffects.memoryChessboard = true;
            alert('购买成功！今天完成任务时精力消耗将减少10%。');
            break;
        case 'glowingPen':
            state.shop.activeEffects.glowingPen = true;
            alert('购买成功！今天新添加的待办事项火苗奖励将增加5%。');
            break;
        case 'whisperingMusicBox':
            state.shop.activeEffects.whisperingMusicBox = true;
            alert('购买成功！今天完成的第一个任务将不消耗精力。');
            break;
        case 'ashRune':
            state.shop.activeEffects.ashRune = true;
            alert('购买成功！今天结束时，火苗转化为灰烬的效率将提高10%。');
            break;
        case 'blackDogCollar':
            state.shop.activeEffects.blackDogCollar = true;
            // 初始化使用状态
            if (!state.shop.effectStatus) state.shop.effectStatus = {};
            state.shop.effectStatus.blackDogCollarUsed = false;
            alert('购买成功！今天当你精力低于20时，将自动恢复10点精力（仅限一次）。');
            break;
        case 'flameLight':
            state.shop.activeEffects.flameLight = true;
            // 初始化使用状态
            if (!state.shop.effectStatus) state.shop.effectStatus = {};
            state.shop.effectStatus.flameLightUsed = false;
            alert('购买成功！下一次完成的项目节点，火苗奖励将翻倍。');
            break;
    }
    
    // 更新状态和界面
    saveState();
    updateUI();
    
    // 刷新商店界面
    showEnhancedWishShop();
}

// 处理商品效果的函数 - 修改任务精力消耗
function adjustSpiritCost(originalCost) {
    let finalCost = originalCost;
    
    // 应用记忆棋盘效果 - 减少10%精力消耗
    if (state.shop.activeEffects.memoryChessboard) {
        finalCost = Math.floor(finalCost * 0.9);
    }
    
    // 应用呢喃音盒效果 - 第一个任务不消耗精力
    if (state.shop.activeEffects.whisperingMusicBox && 
        (!state.shop.effectStatus || !state.shop.effectStatus.whisperingMusicBoxUsed)) {
        // 初始化效果状态对象（如果不存在）
        if (!state.shop.effectStatus) state.shop.effectStatus = {};
        
        // 标记效果已使用
        state.shop.effectStatus.whisperingMusicBoxUsed = true;
        
        // 本次任务精力消耗为0
        return 0;
    }
    
    return finalCost;
}

// 处理项目节点奖励修改
function adjustMilestoneReward(originalReward) {
    let finalReward = originalReward;
    
    // 应用焰光水晶效果 - 下一个项目节点奖励翻倍
    if (state.shop.activeEffects.flameLight && 
        (!state.shop.effectStatus || !state.shop.effectStatus.flameLightUsed)) {
        // 初始化效果状态对象（如果不存在）
        if (!state.shop.effectStatus) state.shop.effectStatus = {};
        
        // 标记效果已使用
        state.shop.effectStatus.flameLightUsed = true;
        
        // 奖励翻倍
        return finalReward * 2;
    }
    
    return finalReward;
}

// 处理火苗转化为灰烬的效率修改
function adjustAshConversion(originalRate) {
    let finalRate = originalRate;
    
    // 应用灰烬符文效果 - 提高10%的转化效率
    if (state.shop.activeEffects.ashRune) {
        finalRate = finalRate * 1.1;
    }
    
    return finalRate;
}

// 检查黑狗项圈自动恢复效果
function checkBlackDogCollarEffect() {
    // 如果黑狗项圈效果激活且未使用过，并且精力低于阈值
    if (state.shop.activeEffects.blackDogCollar && 
        state.stats.spirit < 20 && 
        (!state.shop.effectStatus || !state.shop.effectStatus.blackDogCollarUsed)) {
        
        // 初始化效果状态对象（如果不存在）
        if (!state.shop.effectStatus) state.shop.effectStatus = {};
        
        // 标记效果已使用
        state.shop.effectStatus.blackDogCollarUsed = true;
        
        // 恢复精力
        state.stats.spirit = Math.min(100, state.stats.spirit + 10);
        
        // 显示通知
        alert('黑狗项圈启动，你感到一阵轻松，精力恢复了10点！');
        
        // 更新状态和界面
        saveState();
        updateUI();
    }
}

// 处理结束一天的效果
function processEndDayEffects() {
    // 灰烬符文效果 - 增加火苗转化为灰烬的效率
    if (state.shop.activeEffects.ashRune) {
        // 灰烬计算会在confirmEndDay函数中调用adjustAshConversion
    }
    
    // 重置单日道具效果
    resetDailyItems();
}

// 重置单日道具效果
function resetDailyItems() {
    // 现有的需要重置的效果
    state.shop.activeEffects.fireStarter = false;
    state.shop.activeEffects.mirror = false;
    
    // 新增需要重置的效果
    state.shop.activeEffects.memoryChessboard = false;
    state.shop.activeEffects.glowingPen = false;
    state.shop.activeEffects.whisperingMusicBox = false;
    state.shop.activeEffects.ashRune = false;
    state.shop.activeEffects.blackDogCollar = false;
    
    // 重置效果状态
    if (state.shop.effectStatus) {
        state.shop.effectStatus.whisperingMusicBoxUsed = false;
        state.shop.effectStatus.blackDogCollarUsed = false;
    }
}

// 设置模块暴露的函数
window.shopModule = {
    initShopState,
    showEnhancedWishShop,
    purchaseEnhancedItem,
    adjustSpiritCost,
    adjustMilestoneReward,
    adjustAshConversion,
    checkBlackDogCollarEffect,
    processEndDayEffects,
    resetDailyItems
}; 