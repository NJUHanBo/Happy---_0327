// ========================================
// 重构兼容层 v1.0
// 日期: 2025-10-04
// 说明: 逐步迁移到模块化系统，但保持向后兼容
// ========================================

console.log('[Refactoring] Loading compatibility layer...');

// 全局状态管理

// deepseek API配置
const DEEPSEEK_CONFIG = {
    apiKey: '', // 需要用户在设置中填写
    endpoint: 'https://api.deepseek.ai/v1/chat/completions',
    model: 'deepseek-coder',
    useApi: false // 默认不使用API，用户可以在设置中开启
};

// 添加别名函数，解决按钮不能用的问题
function showAddProjectDialog() {
    showAddProjectsDialog();
}

// 添加项目详情展示函数
// [Refactored] Now uses TaskManager.getProjectById()
function showProjectDetails(projectId) {
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 计算项目进度
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.currentMilestone || 0;
    const progress = Math.floor((completedMilestones / totalMilestones) * 100);
    
    // 计算已花费的总时间
    let totalTimeSpent = 0;
    project.milestones.forEach(milestone => {
        if (milestone.timeSpent) {
            totalTimeSpent += milestone.timeSpent;
        }
    });
    
    // 组装里程碑HTML
    const milestonesHtml = project.milestones.map((milestone, index) => {
        const isCompleted = index < project.currentMilestone;
        const isCurrent = index === project.currentMilestone;
        
        return `
            <div class="milestone-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                <div class="milestone-header">
                    <span class="milestone-status">${isCompleted ? '✅' : (isCurrent ? '🔄' : '⏳')}</span>
                    <span class="milestone-name">${milestone.name}</span>
                </div>
                <div class="milestone-details">
                    <p>计划日期: ${new Date(milestone.date).toLocaleDateString()}</p>
                    ${milestone.timeSpent ? `<p>已花费时间: ${milestone.timeSpent.toFixed(1)}小时</p>` : ''}
                    ${milestone.completedAt ? `<p>完成于: ${new Date(milestone.completedAt).toLocaleDateString()}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    showDialog(`
        <h2>项目详情: ${project.name}</h2>
        <div class="project-details">
            <div class="project-info">
                <p><strong>截止日期:</strong> ${new Date(project.deadline).toLocaleDateString()}</p>
                <p><strong>每日投入时间:</strong> ${project.dailyTime}小时</p>
                <p><strong>重要性:</strong> ${getImportanceText(project.importance)}</p>
                <p><strong>兴趣度:</strong> ${getInterestText(project.interest)}</p>
                <p><strong>总体进度:</strong> ${completedMilestones}/${totalMilestones} 节点 (${progress}%)</p>
                <p><strong>已花费总时间:</strong> ${totalTimeSpent.toFixed(1)}小时</p>
                <p><strong>创建于:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
                ${project.completedAt ? `<p><strong>完成于:</strong> ${new Date(project.completedAt).toLocaleDateString()}</p>` : ''}
            </div>
            
            <h3>项目里程碑</h3>
            <div class="milestones-container">
                ${milestonesHtml}
            </div>
            
            <div class="dialog-buttons">
                ${!project.completedAt ? `<button onclick="startProject(${project.id})">继续任务</button>` : ''}
                ${!project.completedAt ? `<button onclick="editProject(${project.id})">编辑项目</button>` : ''}
                <button onclick="deleteProject(${project.id})">删除项目</button>
                <button onclick="closeDialog()">返回</button>
            </div>
        </div>
    `);
    
    // 添加项目详情样式
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .project-details {
            max-width: 100%;
            overflow-y: auto;
            max-height: 70vh;
        }
        .milestones-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
        }
        .milestone-item {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            background-color: #f9f9f9;
        }
        .milestone-item.completed {
            background-color: #e8f5e9;
            border-color: #81c784;
        }
        .milestone-item.current {
            background-color: #e3f2fd;
            border-color: #64b5f6;
            font-weight: bold;
        }
        .milestone-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
        }
        .milestone-status {
            font-size: 1.2em;
        }
        .milestone-details {
            margin-left: 28px;
            font-size: 0.9em;
        }
        .milestone-details p {
            margin: 3px 0;
        }
    `;
    document.head.appendChild(styleElement);
}

const state = {
    character: null,
    dailyTasks: [],
    projects: [],
    todos: [],
    stats: {
        energy: 100,
        spirit: 50,  // 初始精力改为50
        sawdust: 100,
        flame: 100,
        totalDays: 1,
        burningDays: 0,
        ash: 10000
    },
    depression: {
        status: '黑狗缠身',  // 初始状态
        dailySpirit: 50,     // 每日初始精力
        nextMilestone: 7,    // 下一个里程碑天数
        milestones: {
            7: { status: '黑狗退后', spirit: 60 },
            30: { status: '黑狗退散', spirit: 75 },
            60: { status: '战胜黑狗', spirit: 100 }
        }
    },
    currentDay: new Date(),
    dailyThoughtCompleted: false,
    tips: [], // 用于存储从文件加载的提示
    settings: {
        scrollSpeed: 30 // 默认滚动速度(秒)
    },
    backgroundSettings: {}, // 用于存储背景设置
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
    drafts: [], // 新增：用于存储草稿
    magicAcademy: {
        discoveredParchments: [], // 已发现的羊皮纸
        lastExcavation: null, // 最后一次挖掘的时间
    }
};

// CRITICAL: Expose state to window for TaskManager and other modules
window.state = state;
console.log('[Refactoring] Global state exposed to window');

// 新增：临时存储上传的背景图片
let tempBackgrounds = {};

// 火柴神类型定义
const GOD_TYPES = [
    {
        id: 'wise',
        name: '智者',
        description: '象征智慧与希望',
        imagePath: './assets/gods/wise.jpg'
    },
    {
        id: 'king',
        name: '国王',
        description: '象征权威与力量',
        imagePath: './assets/gods/king.jpg'
    },
    {
        id: 'rich',
        name: '首富',
        description: '象征富贵与勇敢',
        imagePath: './assets/gods/rich.jpg'
    }
];

// 计时器状态
const timerState = {
    seconds: 0,
    intervalId: null,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    totalPausedTime: 0
};

console.log('[Refactoring] Compatibility layer ready');
console.log('[Refactoring] StorageManager available:', !!window.StorageManager);
console.log('[Refactoring] StateManager available:', !!window.StateManager);
console.log('[Refactoring] TaskManager available:', !!window.TaskManager);

// ========================================
// 原始应用代码继续
// ========================================

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const dialogContainer = document.getElementById('dialog-container');
    dialogContainer.classList.add('hidden'); // 确保对话框容器初始时是隐藏的
    initializeApp();
    setupEventListeners();
});

// 应用初始化
function initializeApp() {
    // 添加调试信息
    console.log('初始化应用...');
    
    // 优先使用新的StorageManager加载数据
    if (window.StorageManager) {
        console.log('[Refactoring] Attempting to load state with StorageManager');
        const loadedState = StorageManager.loadState();
        
        if (loadedState) {
            console.log('[Refactoring] State loaded successfully from StorageManager');
            
            // 合并加载的状态
            Object.assign(state, loadedState);
            
            // CRITICAL: Update window.state reference after loading
            window.state = state;
            
            // 确保必需字段
            if (typeof state.dailyThoughtCompleted === 'undefined') {
                state.dailyThoughtCompleted = false;
            }
            
            // 加载deepseek配置到全局
            if (state.settings && state.settings.deepseek) {
                console.log('[Refactoring] Loading deepseek config');
                DEEPSEEK_CONFIG.useApi = state.settings.deepseek.useApi;
                DEEPSEEK_CONFIG.apiKey = state.settings.deepseek.apiKey;
            }
            
            // 显示主屏幕
            showMainScreen();
            updateUI();
            updateBackgrounds();
            loadEncouragements();
            
            // 恢复夜晚视频
            const savedVideoPath = localStorage.getItem('nightVideoPath');
            if (savedVideoPath && state.nightTransition) {
                state.nightTransition.videoPath = savedVideoPath;
                try {
                    const video = document.getElementById('night-bg-video');
                    if (video) {
                        video.src = savedVideoPath;
                        video.load();
                    }
                } catch (error) {
                    console.error('[Refactoring] Failed to load night video:', error);
                }
            }
            
            console.log('[Refactoring] Initialization complete (new path)');
            return; // 成功加载，提前返回
        } else {
            console.log('[Refactoring] No saved state found in StorageManager');
        }
    } else {
        console.warn('[Refactoring] StorageManager not available, using legacy loading');
    }
    
    // === 以下是原始的加载逻辑（fallback）===
    console.log('[Refactoring] Using legacy loading method');
    
    // 检查是否有保存的状态
    const savedState = localStorage.getItem('matchstickTimeManager');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            console.log('找到保存的状态:', parsedState);
            
            // 合并保存的状态
            Object.assign(state, parsedState);
            
            // CRITICAL: Update window.state in fallback path too
            window.state = state;
            
            if (typeof state.dailyThoughtCompleted === 'undefined') {
                state.dailyThoughtCompleted = false;
            }
            
            // 确保设置对象存在
            if (!state.settings) {
                state.settings = {};
            }
            
            // 确保deepseek设置存在
            if (!state.settings.deepseek) {
                state.settings.deepseek = {
                    useApi: DEEPSEEK_CONFIG.useApi,
                    apiKey: DEEPSEEK_CONFIG.apiKey
                };
            } else {
                // 从state中加载deepseek配置到全局配置
                console.log('从保存的状态加载deepseek配置:', state.settings.deepseek);
                DEEPSEEK_CONFIG.useApi = state.settings.deepseek.useApi;
                DEEPSEEK_CONFIG.apiKey = state.settings.deepseek.apiKey;
            }
            
            // 确保夜晚过渡设置存在
            if (!state.nightTransition) {
                state.nightTransition = {
                    videoPath: null,
                    encouragements: ['今天辛苦了，好好休息吧 ✨']
                };
            }
            
            // 显示主屏幕
            showMainScreen();
        } catch (error) {
            console.error('解析保存的状态时出错:', error);
            showInitScreen();
        }
    } else {
        console.log('没有找到保存的状态，显示初始屏幕');
        state.dailyThoughtCompleted = false;
        showInitScreen();
    }
    
    updateUI();
    
    // 加载并应用背景设置
    updateBackgrounds();
    
    // 加载鼓励语
    loadEncouragements();
    
    // 恢复保存的视频路径
    const savedVideoPath = localStorage.getItem('nightVideoPath');
    if (savedVideoPath) {
        console.log('找到保存的夜晚视频路径:', savedVideoPath);
        if (!state.nightTransition) {
            state.nightTransition = {
                videoPath: savedVideoPath,
                encouragements: ['今天辛苦了，好好休息吧 ✨']
            };
        } else {
            state.nightTransition.videoPath = savedVideoPath;
        }
        
        // 预加载视频
        try {
            const video = document.getElementById('night-bg-video');
            if (video) {
                console.log('预加载夜晚视频');
                video.src = savedVideoPath;
                video.load();
            }
        } catch (error) {
            console.error('预加载夜晚视频失败:', error);
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 主要任务块点击事件
    document.getElementById('thought-bin').addEventListener('click', showThoughtBin);
    document.getElementById('todo-master').addEventListener('click', showTodoMaster);
    document.getElementById('project-manager').addEventListener('click', showProjectManager);
    document.getElementById('daily-routine').addEventListener('click', showDailyRoutine);

    // 底部按钮事件
    document.getElementById('view-logs').addEventListener('click', showLogs);
    document.getElementById('task-stats').addEventListener('click', showStats);
    document.getElementById('end-day').addEventListener('click', endDay);
    document.getElementById('exit').addEventListener('click', () => {
        showDialog(`
            <h2>确认退出</h2>
            <p>确定要退出应用吗？</p>
            <div class="dialog-buttons">
                <button onclick="window.close()">确定退出</button>
                <button onclick="closeDialog()">取消</button>
            </div>
        `);
    });
}

// 滚动提示
async function startRollingTips() {
    const tipsElement = document.getElementById('rolling-tips');
    if (!tipsElement) return;
    
    try {
        const response = await fetch('./data/tips.json');
        const data = await response.json();
        state.tips = data.tips || [];
        
        if (state.tips.length === 0) {
            state.tips = ["欢迎使用火柴人的时光管理！"];
        }
        
        const allTips = state.tips.join(' • ');
        tipsElement.textContent = `${allTips} • ${allTips} • ${allTips}`;
        tipsElement.style.animation = 'none';
        tipsElement.offsetHeight; // 触发重排
        tipsElement.style.animation = `scrollTips ${state.settings.scrollSpeed}s linear infinite`;
    } catch (error) {
        console.error('加载提示文字失败:', error);
        tipsElement.textContent = "欢迎使用火柴人的时光管理！";
    }
}

// 显示提示
async function showTips() {
    try {
        const response = await fetch('./data/tips.json');
        const data = await response.json();
        const tips = data.tips || [];
        
        if (tips.length === 0) {
            tips.push("欢迎使用火柴人的时光管理！");
        }
        
        const tipsHtml = tips.map(tip => `<p class="tip-item">${tip}</p>`).join('');
        
        showDialog(`
            <h2>玩法建议</h2>
            <div class="tips-content">
                ${tipsHtml}
            </div>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        `);
        
    } catch (error) {
        console.error('加载提示失败:', error);
        showDialog(`
            <h2>玩法建议</h2>
            <p>加载提示失败,请稍后再试。</p>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        `);
    }
}

// 添加提示内容的样式
const tipsStyle = document.createElement('style');
tipsStyle.textContent = `
    .tips-content {
        max-height: 400px;
        overflow-y: auto;
        padding: 10px;
    }
    
    .tip-item {
        padding: 10px;
        margin: 5px 0;
        background-color: var(--secondary-bg);
        border-radius: 8px;
        line-height: 1.4;
    }
`;
document.head.appendChild(tipsStyle);

// UI更新函数
function updateUI() {
    if (!state.character) return;

    // 更新头像显示
    updateAvatarDisplay();
    
    // 更新火柴神显示
    updateGodDisplay();

    // 更新角色信息
    document.getElementById('character-name').textContent = state.character.name || '无名火柴人';
    const godType = GOD_TYPES.find(type => type.id === state.character.type);
    document.getElementById('character-gender').textContent = `${state.character.gender === 'male' ? '♂' : '♀'} ${godType.name}的信徒`;

    // 更新状态显示
    document.getElementById('energy').textContent = `${state.stats.energy}/100`;
    document.getElementById('spirit').textContent = `${state.stats.spirit}/100`;
    document.getElementById('sawdust').textContent = state.stats.sawdust;
    document.getElementById('flame').textContent = state.stats.flame;
    document.getElementById('ash').textContent = state.stats.ash;
    document.getElementById('total-days').textContent = state.stats.totalDays;
    document.getElementById('burning-days').textContent = state.stats.burningDays;

    // 更新状态显示区域
    const statusDisplay = document.getElementById('vacation-status');
    statusDisplay.classList.remove('hidden');

    // 准备显示内容
    let statusContent = '';

    // 添加黑狗状态
    statusContent += `
        <div class="status-item">
        <span class="status-icon">🖤</span>
        <span class="status-text">${state.depression.status}</span>
        ${state.depression.nextMilestone < Infinity ? 
            `<span id="milestone-progress">距离改善还需${state.depression.nextMilestone - state.stats.burningDays}天</span>` : 
            ''}
        </div>
    `;

    // 如果在度假，添加度假状态
    if (state.vacation.isOnVacation) {
        const endDate = new Date(state.vacation.endDate);
        const currentDate = new Date(state.currentDay);
        const daysLeft = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
        
        statusContent += `
            <div class="status-item">
            <span class="status-icon">🏖️</span>
            <span class="status-text">度假中</span>
            <span id="vacation-days-left">剩余${daysLeft}天</span>
            </div>
        `;
        
        // 如果度假已经结束
        if (daysLeft <= 0) {
            state.vacation.isOnVacation = false;
            state.vacation.vacationType = null;
            state.vacation.startDate = null;
            state.vacation.endDate = null;
            saveState();
        }
    }

    // 设置状态显示内容
    statusDisplay.innerHTML = statusContent;

    // 显示"结束一天"按钮
    const endDayButton = document.getElementById('end-day');
    endDayButton.classList.remove('hidden');

    // 高亮杂念垃圾桶
    const thoughtBin = document.getElementById('thought-bin');
    if (!state.dailyThoughtCompleted) {
        thoughtBin.classList.add('active');
    } else {
        thoughtBin.classList.remove('active');
    }
}

// 显示对话框
// [Refactored] Now uses TaskManager for task list display
function showDialog(content, showTaskList = false, taskType = '') {
    const dialogContainer = document.getElementById('dialog-container');
    let taskListHtml = '';
    
    if (showTaskList) {
        let tasks = [];
        let taskTitle = '';
        const tm = getTaskManager();
        
        switch(taskType) {
            case 'daily':
                tasks = tm ? tm.getDailyTasks() : state.dailyTasks;
                taskTitle = '已添加的日常任务';
                break;
            case 'project':
                tasks = tm ? tm.getProjects() : state.projects;
                taskTitle = '已添加的项目';
                break;
            case 'todo':
                tasks = tm ? tm.getTodos() : state.todos;
                taskTitle = '已添加的待办事项';
                break;
        }
        
        taskListHtml = `
            <div class="dialog-sidebar">
                <div class="task-list-header">${taskTitle}</div>
                <ul class="task-list">
                    ${tasks.map(task => `
                        <li class="task-list-item">
                            <div>${task.name}</div>
                            ${taskType === 'daily' ? `<small>每日${task.duration}分钟</small>` : ''}
                            ${taskType === 'project' ? `<small>截止：${new Date(task.deadline).toLocaleDateString()}</small>` : ''}
                            ${taskType === 'todo' ? `<small>预计${task.duration}小时</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    dialogContainer.innerHTML = `
        <div class="dialog">
            <button class="dialog-close" onclick="closeDialog()">×</button>
            <div class="dialog-main">
                ${content}
            </div>
            ${taskListHtml}
        </div>
    `;
    dialogContainer.classList.remove('hidden');
}

// 关闭对话框
function closeDialog() {
    const dialogContainer = document.getElementById('dialog-container');
    dialogContainer.classList.add('hidden');
}

// 杂念垃圾桶功能
function showThoughtBin() {
    // 获取所有杂念记录的数量
    const thoughtKeys = Object.keys(localStorage).filter(key => key.startsWith('thought_'));
    
    showDialog(`
        <h2>杂念垃圾桶</h2>
        <div id="thought-menu">
            <p>要开始15分钟的杂念随手写吗？</p>
            <div class="dialog-buttons">
                <button onclick="startThoughtTimer()" id="start-thought-btn">开始</button>
                ${thoughtKeys.length > 0 ? '<button onclick="showRandomThought()">翻翻垃圾桶</button>' : ''}
                <button onclick="closeDialog()">返回</button>
            </div>
        </div>
        <div id="thought-content" style="display: none;">
            <div class="timer-display">
                <span id="timer">15:00</span>
            </div>
            <textarea id="thought-text" placeholder="在这里写下你的杂念..."></textarea>
            <div class="dialog-buttons">
                <button onclick="finishThought()">完成</button>
                <button onclick="closeDialog()">取消</button>
            </div>
        </div>
    `);
}

// 完成杂念写作
function finishThought() {
    const thought = document.getElementById('thought-text').value.trim();
    if (!thought) {
        alert('还没有写下任何内容哦');
        return;
    }
    
    const now = new Date();
    const timestamp = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    
    localStorage.setItem(`thought_${timestamp}`, thought);
    
    // 标记今天的杂念已完成
    state.dailyThoughtCompleted = true;
    saveState();
    updateUI();
    
    showDialog(`
        <h2>完成！</h2>
        <p>你的杂念已经被收集起来了。</p>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">确定</button>
        </div>
    `);
}

// 显示随机杂念
function showRandomThought() {
    const thoughtKeys = Object.keys(localStorage).filter(key => key.startsWith('thought_'));
    if (thoughtKeys.length === 0) {
        showDialog(`
            <h2>垃圾桶是空的</h2>
            <p>还没有收集到任何杂念呢。</p>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">返回</button>
            </div>
        `);
        return;
    }
    
    const randomKey = thoughtKeys[Math.floor(Math.random() * thoughtKeys.length)];
    const thought = localStorage.getItem(randomKey);
    const timestamp = randomKey.replace('thought_', '');
    
    // 格式化时间戳
    const formattedDate = `${timestamp.slice(0,4)}年${timestamp.slice(4,6)}月${timestamp.slice(6,8)}日 ${timestamp.slice(8,10)}:${timestamp.slice(10,12)}:${timestamp.slice(12,14)}`;
    
    showDialog(`
        <h2>翻到一条杂念</h2>
        <p class="thought-time">${formattedDate}</p>
        <div class="thought-content">
            ${thought.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
        <div class="dialog-buttons">
            <button onclick="showRandomThought()">再翻一条</button>
            <button onclick="showThoughtBin()">返回</button>
        </div>
    `);
}

// 显示日志
function showLogs() {
    // 按天数分组日志
    const groupedLogs = {};
    if (state.logs) {
        state.logs.forEach(log => {
            const match = log.match(/\[第(\d+)天\]/);
            if (match) {
                const day = match[1];
                if (!groupedLogs[day]) {
                    groupedLogs[day] = [];
                }
                groupedLogs[day].push(log.replace(/\[第\d+天\] /, ''));
            }
        });
    }

    // 生成分组后的HTML
    const logsHtml = Object.keys(groupedLogs)
        .sort((a, b) => b - a) // 按天数降序排列
        .map(day => `
            <div class="log-day-group">
                <h4>第${day}天</h4>
                ${groupedLogs[day].map(log => `<p class="log-entry">${log}</p>`).join('')}
            </div>
        `)
        .join('') || '暂无记录';

    const dialogContent = `
        <div class="dialog-main">
            <h2>回顾日志</h2>
            <div class="logs-content">
                <h3>今日统计</h3>
                <ul>
                    <li>当前木屑: ${state.stats.sawdust}</li>
                    <li>当前火苗: ${state.stats.flame}</li>
                    <li>累计灰烬: ${state.stats.ash || 0}</li>
                    <li>剩余体力: ${state.stats.energy}/100</li>
                    <li>剩余精力: ${state.stats.spirit}/100</li>
                </ul>
                <h3>详细记录</h3>
                <div class="log-entries">
                    ${logsHtml}
                </div>
            </div>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        </div>
    `;
    showDialog(dialogContent);
}

// 显示任务统计
// [Refactored] Now uses TaskManager.getTaskStats()
function showStats() {
    const tm = getTaskManager();
    
    if (tm) {
        const stats = tm.getTaskStats();
        const dialogContent = `
            <div class="dialog-main">
                <h2>任务统计</h2>
                <div class="stats-content">
                    <h3>日常任务</h3>
                    <ul>
                        <li>总任务数: ${stats.daily.total}</li>
                        <li>今日已完成: ${stats.daily.completedToday}</li>
                    </ul>
                    <h3>项目进度</h3>
                    <ul>
                        <li>进行中项目: ${stats.project.active}</li>
                        <li>已完成项目: ${stats.project.completed}</li>
                    </ul>
                    <h3>待办事项</h3>
                    <ul>
                        <li>待完成: ${stats.todo.active}</li>
                        <li>已完成: ${stats.todo.completed}</li>
                    </ul>
                </div>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">关闭</button>
                </div>
            </div>
        `;
        showDialog(dialogContent);
    } else {
        // Fallback to old implementation
        const dialogContent = `
            <div class="dialog-main">
                <h2>任务统计</h2>
                <div class="stats-content">
                    <h3>日常任务</h3>
                    <ul>
                        <li>总任务数: ${state.dailyTasks.length}</li>
                        <li>今日已完成: ${state.dailyTasks.filter(task => task.lastCompleted === new Date().toISOString().split('T')[0]).length}</li>
                    </ul>
                    <h3>项目进度</h3>
                    <ul>
                        <li>进行中项目: ${state.projects.filter(p => !p.completedAt).length}</li>
                        <li>已完成项目: ${state.projects.filter(p => p.completedAt).length}</li>
                    </ul>
                    <h3>待办事项</h3>
                    <ul>
                        <li>待完成: ${state.todos.filter(t => !t.completed).length}</li>
                        <li>已完成: ${state.todos.filter(t => t.completed).length}</li>
                    </ul>
                </div>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">关闭</button>
                </div>
            </div>
        `;
        showDialog(dialogContent);
    }
}

// 显示主屏幕
function showMainScreen() {
    document.getElementById('init-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
}

// 显示初始化屏幕
function showInitScreen() {
    document.getElementById('init-screen').classList.remove('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    showCharacterCreation();
}

// 显示角色创建界面
function showCharacterCreation() {
    const characterCreation = document.getElementById('character-creation');
    characterCreation.classList.remove('hidden');
    
    const optionsContainer = document.querySelector('.character-options');
    optionsContainer.innerHTML = `
        <div class="story-intro">
            <p>你是火柴星球一名普通的火柴人，你的日常就是像其他火柴人那样点燃自己，释放火苗。没有了你们的火苗，这个星球就会永久陷入黑暗。。。这一场黑狗神与三大火柴神的永恒战争。</p>
            <p>忽然有一天，你惊恐得看到你的火苗逐渐熄灭了，原来是黑狗神在你脑中种下了一只黑狗。黑狗以你的木屑为食，不断在你脑子里播下谎言的种子，让你质疑自己，质疑这个世界的一切规则。</p>
            <p>你终日被虚无感环绕。你几乎要放弃自己。但这一天，你听到了一个声音，是火柴神！你慢慢睁开眼睛，看到了。。。</p>
        </div>
        <h3>选择你看到的火柴神</h3>
        <div class="character-grid">
            ${GOD_TYPES.map(type => `
                <div class="character-option" data-character-id="${type.id}">
                    <div class="character-image">
                        <img src="${type.imagePath}" alt="${type.name}">
                    </div>
                    <h4>${type.name}</h4>
                    <p>${type.description}</p>
                </div>
            `).join('')}
        </div>
        <div class="character-customization">
            <h3>个性化设置</h3>
            <div class="form-group">
                <label for="character-name">给火柴人起个名字：</label>
                <input type="text" id="character-name" placeholder="输入名字">
            </div>
            <div class="form-group">
                <label>选择性别：</label>
                <select id="character-gender">
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                </select>
            </div>
            <button onclick="createCharacter()">开始我的时光管理之旅</button>
        </div>
    `;

    // 添加角色选择事件
    document.querySelectorAll('.character-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.character-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// 创建角色
function createCharacter() {
    const selectedCharacter = document.querySelector('.character-option.selected');
    if (!selectedCharacter) {
        alert('请选择一个火柴神');
        return;
    }

    const name = document.getElementById('character-name').value.trim();
    if (!name) {
        alert('请给火柴人起个名字');
        return;
    }

    const gender = document.getElementById('character-gender').value;
    const godType = selectedCharacter.dataset.characterId;

    state.character = {
        type: godType,
        name: name,
        gender: gender,
        createdAt: new Date().toISOString(),
        avatar: null
    };

    saveState();
    showMainScreen();
    updateUI();
    showAvatarUploadPrompt();
}

// 显示欢迎对话框
function showWelcomeDialog() {
    showDialog(`
        <h2>欢迎来到火柴人的时光管理之旅！</h2>
        <p>亲爱的 ${state.character.name}，</p>
        <p>接下来，让我们开始规划你的时间吧！</p>
        <div class="dialog-buttons">
            <button onclick="startTaskSetup()">开始设置</button>
        </div>
    `);
}

// 开始任务设置
function startTaskSetup() {
    closeDialog();
    showAddDailyTasksDialog();
}

// 保存状态
// 使用新的StorageManager（带fallback）
function saveState() {
    if (window.StorageManager) {
        console.log('[Refactoring] Using StorageManager.saveState');
        return StorageManager.saveState(state);
    } else {
        console.warn('[Refactoring] StorageManager not available, using legacy method');
        try {
            localStorage.setItem('matchstickTimeManager', JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('[Storage] Save failed:', e);
            return false;
        }
    }
}

// 结束一天
function endDay() {
    // 计算预估值
    const previewStats = {
        currentFlame: state.stats.flame,
        currentAsh: state.stats.ash || 0,
        currentTotalDays: state.stats.totalDays,
        currentBurningDays: state.stats.burningDays,
        newFlame: Math.floor(state.stats.flame / 2),
        newAsh: (state.stats.ash || 0) + Math.floor(state.stats.flame / 2),
        willIncreaseBurningDays: state.stats.flame >= 100
    };
    
    const summary = generateDaySummary(previewStats);
    showDialog(summary);
}

// 生成日总结
// [Refactored] Now uses TaskManager.getTaskStats()
function generateDaySummary(previewStats) {
    const tm = getTaskManager();
    let completedDailyTasks, completedTodos, completedMilestones, totalDailyTasks;
    
    if (tm) {
        const stats = tm.getTaskStats();
        completedDailyTasks = stats.daily.completedToday;
        completedTodos = stats.todo.completedToday;
        completedMilestones = stats.milestonesCompletedToday;
        totalDailyTasks = stats.daily.total;
    } else {
        // Fallback to old logic
        completedDailyTasks = state.dailyTasks.filter(task => 
            task.lastCompleted === new Date().toISOString().split('T')[0]
        ).length;
        
        completedTodos = state.todos.filter(todo => 
            todo.completedAt && new Date(todo.completedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
        ).length;
        
        completedMilestones = state.projects.reduce((count, project) => {
            return count + project.milestones.filter(milestone => 
                milestone.completedAt && new Date(milestone.completedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
            ).length;
        }, 0);
        
        totalDailyTasks = state.dailyTasks.length;
    }

    return `
        <h2>今日总结</h2>
        <div class="summary-content">
            <div class="summary-section">
                <h3>完成情况</h3>
                <ul>
                    <li>日常任务：完成 ${completedDailyTasks}/${totalDailyTasks} 个</li>
                    <li>待办事项：完成 ${completedTodos} 个</li>
                    <li>项目节点：完成 ${completedMilestones} 个</li>
                </ul>
            </div>
            <div class="summary-section">
                <h3>资源变化</h3>
                <ul>
                    <li>当前木屑：${state.stats.sawdust}</li>
                    <li>火苗：${previewStats.currentFlame} → ${previewStats.newFlame}</li>
                    <li>灰烬：${previewStats.currentAsh} → ${previewStats.newAsh}</li>
                </ul>
            </div>
            <div class="summary-section">
                <h3>状态记录</h3>
                <ul>
                    <li>总时长：${previewStats.currentTotalDays}天</li>
                    <li>燃烧时长：${previewStats.currentBurningDays}${previewStats.willIncreaseBurningDays ? ' → ' + (previewStats.currentBurningDays + 1) : ''}天</li>
                    <li>剩余体力：${state.stats.energy}/100</li>
                    <li>剩余精力：${state.stats.spirit}/100</li>
                </ul>
            </div>
        </div>
        <div class="dialog-buttons">
            <button onclick="confirmEndDay()">确认结束</button>
            <button onclick="cancelEndDay()">取消</button>
        </div>
    `;
}

// 确认结束一天
function confirmEndDay() {
    console.log('确认结束一天');
    // 更新状态
    let newFlame = state.stats.flame;
    
    // 如果不在度假，且没有助燃剂效果，火苗减半
    if (!state.vacation.isOnVacation && !state.shop.activeEffects.fireStarter) {
        newFlame = Math.floor(state.stats.flame / 2);
    }
    
    const newAsh = (state.stats.ash || 0) + (state.vacation.isOnVacation ? 0 : Math.floor(state.stats.flame / 2));
    
    // 更新总天数和燃烧天数
    state.stats.totalDays++;
    if (state.stats.flame >= 100) {
        state.stats.burningDays++;
        
        // 检查是否达到抑郁症状态的里程碑
        if (state.depression.nextMilestone && state.stats.burningDays === state.depression.nextMilestone) {
            const milestone = state.depression.milestones[state.depression.nextMilestone];
            if (milestone) {
                // 更新状态和每日精力值
                state.depression.status = milestone.status;
                state.depression.dailySpirit = milestone.spirit;
                
                // 查找下一个里程碑
                const milestoneKeys = Object.keys(state.depression.milestones)
                    .map(Number)
                    .sort((a, b) => a - b);
                const nextIndex = milestoneKeys.findIndex(days => days > state.depression.nextMilestone);
                state.depression.nextMilestone = nextIndex !== -1 ? milestoneKeys[nextIndex] : Infinity;
                
                // 添加状态变化日志
                addToLog(`状态更新：${milestone.status}！每日精力提升至${milestone.spirit}点`);
            }
        }
    }
    
    // 更新资源
    state.stats.flame = newFlame;
    state.stats.ash = newAsh;
    
    // 重置体力和设置新的精力值
    state.stats.energy = 100;
    state.stats.spirit = state.depression.dailySpirit;
    
    // 重置商店单日道具效果
    if (state.shop && state.shop.activeEffects) {
        state.shop.activeEffects.fireStarter = false;
        state.shop.activeEffects.mirror = false;
    }
    
    // 更新当前日期到下一天
    const nextDay = new Date();
    if (state.currentDay) {
        nextDay.setTime(new Date(state.currentDay).getTime() + 24 * 60 * 60 * 1000);
    }
    state.currentDay = nextDay;
    
    // 如果在度假中，检查度假是否结束
    if (state.vacation && state.vacation.isOnVacation) {
        const endDate = new Date(state.vacation.endDate);
        const daysLeft = Math.ceil((endDate - state.currentDay) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 0) {
            // 度假结束
            state.vacation.isOnVacation = false;
            state.vacation.vacationType = null;
            state.vacation.startDate = null;
            state.vacation.endDate = null;
        }
    }
    
    // 检查火柴人是否死亡
    if (state.stats.flame < 1) {
        showDeathDialog();
        return;
    }
    
    // 确保nightTransition对象存在
    if (!state.nightTransition) {
        state.nightTransition = {
            videoPath: null,
            encouragements: ['今天辛苦了，好好休息吧 ✨']
        };
        // 尝试加载鼓励语
        loadEncouragements();
    }
    
    // 保存状态
    saveState();
    
    // 关闭当前对话框
    closeDialog();
    
    // 更新UI
    updateUI();
    
    // 显示夜晚过渡页面
    console.log('准备显示夜晚过渡页面');
    
    // 直接调用showNightTransition，不使用setTimeout
    showNightTransition();
    
    // 添加额外的检查，确保夜晚过渡页面显示
    setTimeout(() => {
        const nightTransition = document.getElementById('night-transition');
        if (nightTransition && nightTransition.classList.contains('hidden')) {
            console.log('检测到夜晚过渡页面仍然隐藏，尝试再次显示');
            nightTransition.classList.remove('hidden');
            nightTransition.style.zIndex = '2000';
        }
    }, 500);
}

// 取消结束一天
function cancelEndDay() {
    closeDialog();
}

// 显示死亡对话框
function showDeathDialog() {
    showDialog(`
        <h2>火柴人熄灭了...</h2>
        <div class="death-content">
            <p>你的火柴人在第 ${state.stats.totalDays} 天熄灭了。</p>
            <p>在这 ${state.stats.totalDays} 天里：</p>
            <ul>
                <li>经历了 ${state.stats.burningDays} 天的燃烧时光</li>
                <li>积累了 ${state.stats.sawdust} 点木屑</li>
                <li>产生了 ${state.stats.ash || 0} 点灰烬</li>
            </ul>
        </div>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">关闭</button>
        </div>
    `);
}

// 初始化必要的目录结构
function initializeDirectories() {
    // 这里将创建必要的目录结构
    // 注意：在实际的Web应用中，这些操作可能需要后端支持
}

// 添加新的CSS样式
const style = document.createElement('style');
style.textContent = `
    .story-intro {
        background: rgba(0, 0, 0, 0.7);
        padding: 20px;
        border-radius: 15px;
        margin-bottom: 30px;
        color: #fff;
        text-align: justify;
        line-height: 1.6;
    }

    .story-intro p {
        margin: 15px 0;
    }

    .character-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin: 20px 0;
    }

    .character-option {
        background-color: var(--secondary-bg);
        border-radius: 15px;
        padding: 20px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
    }

    .character-option:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .character-option.selected {
        background-color: var(--accent-1);
        color: white;
        transform: translateY(-5px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    }

    .character-image {
        width: 200px;
        height: 200px;
        margin: 0 auto 15px;
        border-radius: 15px;
        overflow: hidden;
        background-color: var(--accent-2);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .character-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 0.3s;
    }

    .character-option:hover .character-image img {
        transform: scale(1.05);
    }

    .character-option h4 {
        font-size: 18px;
        margin: 10px 0;
        color: var(--text-primary);
    }

    .character-option p {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 5px 0;
        line-height: 1.4;
    }

    .character-customization {
        margin-top: 30px;
        padding: 20px;
        background-color: var(--secondary-bg);
        border-radius: 15px;
    }

    .form-group {
        margin: 15px 0;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        color: var(--text-primary);
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--accent-1);
        border-radius: 5px;
        background-color: white;
        color: var(--text-primary);
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--accent-2);
        box-shadow: 0 0 5px rgba(0,0,0,0.1);
    }
`;

document.head.appendChild(style);

// 显示添加日常任务对话框
function showAddDailyTasksDialog() {
    showDialog(`
        <h2>添加日常任务</h2>
        <p>让我们添加需要长期坚持的日常任务</p>
        <div class="form-group">
            <label for="task-name">任务名称：</label>
            <input type="text" id="task-name" placeholder="例如：英语学习、阅读、冥想、锻炼身体">
        </div>
        <div class="form-group">
            <label for="task-duration">每天计划时长（分钟）：</label>
            <input type="number" id="task-duration" min="5" step="5" value="30">
        </div>
        <div class="form-group">
            <label for="task-importance">重要性：</label>
            <select id="task-importance">
                <option value="high">非常重要</option>
                <option value="medium">一般重要</option>
                <option value="low">不重要</option>
            </select>
        </div>
        <div class="form-group">
            <label for="task-interest">兴趣程度：</label>
            <select id="task-interest">
                <option value="high">很感兴趣</option>
                <option value="medium">一般</option>
                <option value="low">不感兴趣</option>
            </select>
        </div>
        <div class="dialog-buttons">
            <button onclick="addDailyTask()">添加任务</button>
            <button onclick="skipDailyTasks()">暂不添加</button>
        </div>
    `, true, 'daily');
}

// 添加日常任务
function addDailyTask() {
    const name = document.getElementById('task-name').value.trim();
    const duration = parseInt(document.getElementById('task-duration').value);
    const importance = document.getElementById('task-importance').value;
    const interest = document.getElementById('task-interest').value;

    if (!name) {
        alert('请输入任务名称');
        return;
    }

    if (isNaN(duration) || duration < 5) {
        alert('请输入有效的时长（至少5分钟）');
        return;
    }

    // [Refactored] Use TaskManager
    const tm = getTaskManager();
    const task = {
        name,
        dailyTime: duration,  // TaskManager uses 'dailyTime'
        importance: importance,  // 保持字符串（'high'/'medium'/'low'）
        interest: interest,      // 保持字符串
        completedTimes: 0,
        streakDays: 0,
        lastCompleted: null
    };
    
    if (tm) {
        tm.addDailyTask(task);
    } else {
        // Fallback
        task.id = Date.now();
        task.createdAt = new Date().toISOString();
        state.dailyTasks.push(task);
    }
    saveState();

    // 清空表单
    document.getElementById('task-name').value = '';
    document.getElementById('task-duration').value = '30';
    
    // 显示确认消息
    showDialog(`
        <h2>任务添加成功！</h2>
        <p>是否继续添加其他日常任务？</p>
        <div class="dialog-buttons">
            <button onclick="showAddDailyTasksDialog()">继续添加</button>
            <button onclick="showAddProjectsDialog()">下一步：添加项目</button>
        </div>
    `);
}

// 跳过添加日常任务
function skipDailyTasks() {
    showDialog(`
        <h2>确认跳过</h2>
        <p>确定现在不添加日常任务吗？你可以之后随时添加。</p>
        <div class="dialog-buttons">
            <button onclick="showAddProjectsDialog()">确定</button>
            <button onclick="showAddDailyTasksDialog()">返回添加</button>
        </div>
    `);
}

// 显示日常任务列表
// [Refactored] Now uses TaskManager.getSortedDailyTasks() and getDailyTasks()
function showDailyRoutine() {
    const tm = getTaskManager();
    const dailyTasks = tm ? tm.getDailyTasks() : state.dailyTasks;
    if (dailyTasks.length === 0) {
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

    // Use TaskManager for sorting
    const tm = getTaskManager();
    const sortedTasks = tm ? tm.getSortedDailyTasks() : state.dailyTasks;
    
    const tasksHtml = sortedTasks
        .map(task => `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-actions">
                    <button class="icon-btn edit" onclick="editDailyTask(${task.id})" title="编辑任务">✎</button>
                    <button class="icon-btn delete" onclick="deleteDailyTask(${task.id})" title="删除任务">×</button>
                </div>
                <h3>${task.name}</h3>
                <p>计划时长：${task.duration}分钟</p>
                <p>重要性：${getImportanceText(task.importance)}</p>
                <p>兴趣度：${getInterestText(task.interest)}</p>
                <p>已完成次数：${task.completedTimes}次</p>
                <p>连续天数：${task.streakDays}天</p>
                <button class="start-btn" onclick="startDailyTask(${task.id})">开始任务</button>
            </div>
        `).join('');

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
}

// 开始日常任务
// [Refactored] Now uses TaskManager.getDailyTaskById()
function startDailyTask(taskId) {
    const tm = getTaskManager();
    const task = tm ? tm.getDailyTaskById(taskId) : state.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    // 计算预计消耗的体力和精力
    const energyCost = Math.round((task.duration / 480) * 100);
    const spiritCost = task.interest === 'high' ? -20 : (task.interest === 'low' ? 40 : 20);
    
    // 检查体力和精力是否足够
    if (state.stats.energy < energyCost || (spiritCost > 0 && state.stats.spirit < spiritCost)) {
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

    // 保存当前任务ID到全局变量
    window.currentTaskId = taskId;

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
}

// 获取重要性文本
function getImportanceText(importance) {
    const texts = {
        high: '非常重要',
        medium: '一般重要',
        low: '不重要'
    };
    return texts[importance] || importance;
}

// 获取兴趣程度文本
function getInterestText(interest) {
    const texts = {
        high: '很感兴趣',
        medium: '一般',
        low: '不感兴趣'
    };
    return texts[interest] || interest;
}

// 添加新的CSS样式
style.textContent += `
    .tasks-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin: 20px 0;
    }

    .task-card {
        background-color: var(--secondary-bg);
        border-radius: 15px;
        padding: 15px;
        transition: transform 0.2s;
        width: auto;
    }

    .task-card:hover {
        transform: translateY(-5px);
    }

    .task-card h3 {
        margin-bottom: 10px;
        color: var(--text-primary);
        font-size: 16px;
        word-break: break-word;
    }

    .task-card p {
        margin: 5px 0;
        color: var(--text-secondary);
        font-size: 14px;
    }

    .timer-display {
        font-size: 48px;
        text-align: center;
        margin: 20px 0;
    }

    .task-controls {
        display: flex;
        justify-content: space-around;
        margin-top: 20px;
    }
`;

// 开始计时器
function startTimer(targetSeconds) {
    timerState.seconds = 0;
    timerState.startTime = Date.now();
    timerState.pausedTime = 0;
    timerState.totalPausedTime = 0;
    timerState.isPaused = false;

    updateTimerDisplay(0);
    
    timerState.intervalId = setInterval(() => {
        if (!timerState.isPaused) {
            const currentTime = Date.now();
            const elapsedSeconds = Math.floor((currentTime - timerState.startTime - timerState.totalPausedTime) / 1000);
            timerState.seconds = elapsedSeconds;
            updateTimerDisplay(elapsedSeconds);
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const display = hours > 0 
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = display;
    }
}

// 切换暂停/继续
function togglePause() {
    const pauseBtn = document.getElementById('pause-btn');
    if (!timerState.intervalId) return;

    timerState.isPaused = !timerState.isPaused;
    if (timerState.isPaused) {
        pauseBtn.textContent = '继续';
        timerState.pausedTime = Date.now();
    } else {
        pauseBtn.textContent = '暂停';
        if (timerState.pausedTime) {
            timerState.totalPausedTime += (Date.now() - timerState.pausedTime);
            timerState.pausedTime = 0;
        }
    }
}

// 放弃任务
function abandonTask() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    showDialog(`
        <h2>放弃任务</h2>
        <p>确定要放弃当前任务吗？</p>
        <div class="dialog-buttons">
            <button onclick="showDailyRoutine()">确定</button>
            <button onclick="resumeTask()">返回任务</button>
        </div>
    `);
}

// 恢复任务
function resumeTask() {
    const taskId = window.currentTaskId;
    if (taskId) {
        startDailyTask(taskId);
    } else {
        showDailyRoutine();
    }
}

// 完成日常任务
// [Refactored] Now uses TaskManager.getDailyTaskById()
function completeDailyTask(taskId) {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    const tm = getTaskManager();
    const task = tm ? tm.getDailyTaskById(taskId) : state.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    const actualTime = Math.round((Date.now() - timerState.startTime) / 1000);
    const timeRatio = actualTime / (task.duration * 60);
    
    showDialog(`
        <h2>任务完成！</h2>
        <div class="completion-summary">
            <p>实际用时：${Math.floor(actualTime / 60)}分钟</p>
            <p>计划时长：${task.duration}分钟</p>
            <div class="rating-container">
                <p>给自己的完成度打个分：</p>
                <div class="rating" id="satisfaction-rating">
                    ${Array(5).fill(0).map((_, i) => `
                        <span class="star" data-rating="${i + 1}" onclick="setRating(${i + 1})">★</span>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="dialog-buttons">
            <button onclick="finishDailyTask(${taskId})">确认完成</button>
        </div>
    `);
}

// [Refactored] Now uses TaskManager for core logic
function finishDailyTask(taskId) {
    if (!window.currentRating) {
        alert('请给任务完成度打分！');
        return;
    }

    const actualTime = Math.round((Date.now() - timerState.startTime) / 1000);
    const rating = window.currentRating;
    
    // Use TaskManager for core business logic
    const tm = getTaskManager();
    let result;
    
    if (tm) {
        result = tm.completeDailyTask(taskId, actualTime, rating);
        if (!result) return;
    } else {
        // Fallback to original logic
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (!task) return;
        
        const timeRatio = actualTime / (task.duration * 60);
        task.completedTimes++;
        task.lastCompleted = new Date().toISOString().split('T')[0];
        task.streakDays = (task.streakDays || 0) + 1;
        
        const baseReward = 10;
        const sawdustReward = Math.round(baseReward * (rating / 5) * (timeRatio < 1 ? (1 + (1 - timeRatio)) : 1));
        
        result = { task, sawdustReward, streakDays: task.streakDays };
    }
    
    const { task, sawdustReward } = result;
    
    // 更新状态（奖励和资源）
    state.stats.sawdust += sawdustReward;
    
    const baseFlameReward = Math.round(sawdustReward / 2);
    const flameReward = calculateFlameReward(baseFlameReward) / 2;
    state.stats.flame += flameReward;
    
    const spiritCost = task.interest === 'high' ? -20 : (task.interest === 'low' ? 40 : 20);
    state.stats.spirit = Math.max(0, Math.min(100, state.stats.spirit - spiritCost));
    
    const energyCost = Math.round((task.duration / 480) * 100);
    state.stats.energy = Math.max(0, state.stats.energy - energyCost);

    // 添加日志
    if (!state.logs) state.logs = [];
    state.logs.push(`[第${state.stats.totalDays}天] 完成日常任务：${task.name}，获得木屑：${sawdustReward}，获得火苗：${flameReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);

    saveState();
    updateUI();

    showDialog(`
        <h2>奖励结算</h2>
        <div class="reward-summary">
            <p>获得木屑：${sawdustReward}</p>
            <p>获得火苗：${flameReward}</p>
            <p>当前连续天数：${task.streakDays}天</p>
            <p>剩余体力：${state.stats.energy}/100</p>
            <p>剩余精力：${state.stats.spirit}/100</p>
        </div>
        <div class="dialog-buttons">
            <button onclick="showDailyRoutine()">返回日常列表</button>
        </div>
    `);
}

// 计算火苗奖励（考虑商店道具效果和木屑倍率）
function calculateFlameReward(baseReward) {
    let finalReward = baseReward;
    
    // 计算木屑倍率
    // 基础木屑是100，每多100木屑增加0.1倍率
    const baseSawdust = 100;
    const sawdustMultiplier = 1 + Math.max(0, (state.stats.sawdust - baseSawdust) / 1000);
    finalReward = Math.floor(finalReward * sawdustMultiplier);
    
    // 镜子效果：当天任务火苗翻倍
    if (state.shop.activeEffects.mirror) {
        finalReward *= 2;
    }
    
    // 富氧舱效果：永久翻倍
    if (state.shop.activeEffects.oxygenChamber) {
        finalReward *= 2;
    }
    
    // 如果在度假中，不增加火苗
    if (state.vacation.isOnVacation) {
        finalReward = 0;
    }
    
    return Math.floor(finalReward);
}

// 显示添加待办事项对话框
function showAddTodosDialog() {
    showDialog(`
        <h2>添加待办事项</h2>
        <p>让我们添加需要一周内完成的事项</p>
        <div class="form-group">
            <label for="todo-name">事项名称：</label>
            <input type="text" id="todo-name" placeholder="例如：办签证、给猫洗澡">
        </div>
        <div class="form-group">
            <label for="todo-deadline">截止日期：</label>
            <input type="date" id="todo-deadline" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
            <label for="todo-duration">预计花费时长（小时）：</label>
            <input type="number" id="todo-duration" min="0.5" step="0.5" value="1">
        </div>
        <div class="form-group">
            <label for="todo-importance">重要性：</label>
            <select id="todo-importance">
                <option value="high">非常重要</option>
                <option value="medium">一般重要</option>
                <option value="low">不重要</option>
            </select>
        </div>
        <div class="form-group">
            <label for="todo-urgency">紧急程度：</label>
            <select id="todo-urgency">
                <option value="high">很紧急</option>
                <option value="medium">一般紧急</option>
                <option value="low">不紧急</option>
            </select>
        </div>
        <div class="dialog-buttons">
            <button onclick="addTodo()">添加事项</button>
            <button onclick="skipTodos()">暂不添加</button>
        </div>
    `, true, 'todo');
}

// 添加待办事项
function addTodo() {
    const name = document.getElementById('todo-name').value.trim();
    const deadline = document.getElementById('todo-deadline').value;
    const duration = parseFloat(document.getElementById('todo-duration').value);
    const importance = document.getElementById('todo-importance').value;
    const urgency = document.getElementById('todo-urgency').value;

    if (!name || !deadline) {
        alert('请填写事项名称和截止日期');
        return;
    }

    if (isNaN(duration) || duration < 0.5) {
        alert('请输入有效的时长（至少0.5小时）');
        return;
    }

    // [Refactored] Use TaskManager
    const tm = getTaskManager();
    const todo = {
        name,
        deadline,
        estimatedTime: duration,  // TaskManager uses 'estimatedTime'
        importance: importance,    // Keep as string ('high'/'medium'/'low')
        urgency: urgency,          // Keep as string ('high'/'medium'/'low')
        completed: false,
        completedAt: null,
        satisfaction: 0
    };
    
    if (tm) {
        tm.addTodo(todo);
    } else {
        // Fallback
        todo.id = Date.now();
        todo.createdAt = new Date().toISOString();
        state.todos.push(todo);
    }
    saveState();

    showDialog(`
        <h2>事项添加成功！</h2>
        <p>是否继续添加其他待办事项？</p>
        <div class="dialog-buttons">
            <button onclick="showAddTodosDialog()">继续添加</button>
            <button onclick="finishInitialSetup()">完成设置</button>
        </div>
    `);
}

// 跳过添加待办事项
function skipTodos() {
    showDialog(`
        <h2>确认跳过</h2>
        <p>确定现在不添加待办事项吗？你可以之后随时添加。</p>
        <div class="dialog-buttons">
            <button onclick="finishInitialSetup()">确定</button>
            <button onclick="showAddTodosDialog()">返回添加</button>
        </div>
    `);
}

// 完成初始设置
function finishInitialSetup() {
    showDialog(`
        <h2>设置完成！</h2>
        <p>恭喜你完成了初始设置！现在可以开始你的时光管理之旅了。</p>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">开始使用</button>
        </div>
    `);
}

// 显示待办事项列表
// [Refactored] Now uses TaskManager.getActiveTodos()
function showTodoMaster() {
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

    // Use TaskManager for sorting
    const tm = getTaskManager();
    const activeTodos = tm ? tm.getActiveTodos() : state.todos.filter(todo => !todo.completed);
    
    const todosHtml = activeTodos
        .map(todo => `
            <div class="todo-card" data-todo-id="${todo.id}">
                <h3>${todo.name}</h3>
                <p>截止日期：${new Date(todo.deadline).toLocaleDateString()}</p>
                <p>预计时长：${todo.duration}小时</p>
                <p>重要性：${getImportanceText(todo.importance)}</p>
                <p>紧急度：${getUrgencyText(todo.urgency)}</p>
                <div class="task-actions">
                    <button onclick="startTodo(${todo.id})">开始处理</button>
                    <button onclick="editTodo(${todo.id})" class="secondary">编辑</button>
                    <button onclick="deleteTodo(${todo.id})" class="danger">删除</button>
                </div>
            </div>
        `).join('');

    showDialog(`
        <h2>政务大师</h2>
        <div class="todos-grid">
            ${todosHtml}
        </div>
        <div class="dialog-buttons">
            <button onclick="showAddTodosDialog()">添加新待办</button>
            <button onclick="closeDialog()">返回</button>
        </div>
    `);
}

// 获取紧急程度文本
function getUrgencyText(urgency) {
    const texts = {
        high: '很紧急',
        medium: '一般紧急',
        low: '不紧急'
    };
    return texts[urgency] || urgency;
}

// 删除待办事项
function deleteTodo(todoId) {
    showDialog(`
        <h2>确认删除</h2>
        <p>确定要删除这个待办事项吗？此操作不可撤销。</p>
        <div class="dialog-buttons">
            <button onclick="confirmDeleteTodo(${todoId})" class="danger">确定删除</button>
            <button onclick="showTodoMaster()">取消</button>
        </div>
    `);
}

// 确认删除待办事项
// [Refactored] Now uses TaskManager
function confirmDeleteTodo(todoId) {
    const tm = getTaskManager();
    if (tm) {
        tm.deleteTodo(todoId);
    } else {
        // Fallback to old method if TaskManager not available
        state.todos = state.todos.filter(todo => todo.id !== todoId);
    }
    saveState();
    showTodoMaster();
}

// 编辑待办事项
// [Refactored] Now uses TaskManager.getTodoById()
function editTodo(todoId) {
    const tm = getTaskManager();
    const todo = tm ? tm.getTodoById(todoId) : state.todos.find(t => t.id === todoId);
    if (!todo) return;

    showDialog(`
        <h2>编辑待办事项</h2>
        <div class="form-group">
            <label for="edit-todo-name">事项名称：</label>
            <input type="text" id="edit-todo-name" value="${todo.name}">
        </div>
        <div class="form-group">
            <label for="edit-todo-deadline">截止日期：</label>
            <input type="date" id="edit-todo-deadline" value="${todo.deadline ? new Date(todo.deadline).toISOString().split('T')[0] : ''}">
        </div>
        <div class="form-group">
            <label for="edit-todo-duration">预计时长（小时）：</label>
            <input type="number" id="edit-todo-duration" min="0.5" step="0.5" value="${todo.duration || todo.estimatedTime || 1}">
        </div>
        <div class="form-group">
            <label for="edit-todo-importance">重要性：</label>
            <select id="edit-todo-importance">
                <option value="high" ${todo.importance === 'high' ? 'selected' : ''}>非常重要</option>
                <option value="medium" ${todo.importance === 'medium' ? 'selected' : ''}>一般重要</option>
                <option value="low" ${todo.importance === 'low' ? 'selected' : ''}>不重要</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-todo-urgency">紧急程度：</label>
            <select id="edit-todo-urgency">
                <option value="high" ${todo.urgency === 'high' ? 'selected' : ''}>很紧急</option>
                <option value="medium" ${todo.urgency === 'medium' ? 'selected' : ''}>一般紧急</option>
                <option value="low" ${todo.urgency === 'low' ? 'selected' : ''}>不紧急</option>
            </select>
        </div>
        <div class="dialog-buttons">
            <button onclick="saveEditedTodo(${todoId})">保存修改</button>
            <button onclick="showTodoMaster()">取消</button>
        </div>
    `);
}

// 保存编辑后的待办事项
// [Refactored] Now uses TaskManager
function saveEditedTodo(todoId) {
    const name = document.getElementById('edit-todo-name').value.trim();
    const deadline = document.getElementById('edit-todo-deadline').value;
    const duration = parseFloat(document.getElementById('edit-todo-duration').value);
    const importance = document.getElementById('edit-todo-importance').value;
    const urgency = document.getElementById('edit-todo-urgency').value;

    if (!name) {
        alert('请输入事项名称');
        return;
    }

    if (!deadline) {
        alert('请选择截止日期');
        return;
    }

    if (isNaN(duration) || duration < 0.5) {
        alert('请输入有效的时长（至少0.5小时）');
        return;
    }

    // Use TaskManager
    const tm = getTaskManager();
    if (tm) {
        tm.updateTodo(todoId, {
            name,
            deadline,
            duration: duration,           // main.js uses 'duration' (hours)
            estimatedTime: duration,      // TaskManager compatibility
            importance: importance,       // Keep as string
            urgency: urgency             // Keep as string
        });
    } else {
        // Fallback
        const todo = state.todos.find(t => t.id === todoId);
        if (todo) {
            todo.name = name;
            todo.deadline = deadline;
            todo.duration = duration;
            todo.estimatedTime = duration;
            todo.importance = importance;
            todo.urgency = urgency;
        }
    }

    saveState();
    showTodoMaster();
}

// 开始处理待办事项
// [Refactored] Now uses TaskManager.getTodoById()
function startTodo(todoId) {
    const tm = getTaskManager();
    const todo = tm ? tm.getTodoById(todoId) : state.todos.find(t => t.id === todoId);
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
    
    // 检查体力和精力是否足够
    if (state.stats.energy < energyCost || state.stats.spirit < spiritCost) {
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

    // 保存当前任务ID到全局变量
    window.currentTaskId = todoId;

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
}

// 放弃待办事项
function abandonTodo() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    showDialog(`
        <h2>放弃任务</h2>
        <p>确定要放弃当前待办事项吗？</p>
        <div class="dialog-buttons">
            <button onclick="showTodoMaster()">确定</button>
            <button onclick="resumeTodo()">返回任务</button>
        </div>
    `);
}

// 恢复待办事项
function resumeTodo() {
    const taskId = window.currentTaskId;
    if (taskId) {
        startTodo(taskId);
    } else {
        showTodoMaster();
    }
}

// 完成待办事项
// [Refactored] Now uses TaskManager.getTodoById()
function completeTodo(todoId) {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    const tm = getTaskManager();
    const todo = tm ? tm.getTodoById(todoId) : state.todos.find(t => t.id === todoId);
    if (!todo) return;

    const actualTime = Math.round((Date.now() - timerState.startTime) / 1000);
    const timeRatio = actualTime / (todo.duration * 60 * 60);

    showDialog(`
        <h2>待办完成！</h2>
        <div class="completion-summary">
            <p>实际用时：${Math.floor(actualTime / 3600)}小时${Math.floor((actualTime % 3600) / 60)}分</p>
            <p>预计时长：${todo.duration}小时</p>
            <div class="rating-container">
                <p>给自己的完成度打个分：</p>
                <div class="rating" id="satisfaction-rating">
                    ${Array(5).fill(0).map((_, i) => `
                        <span class="star" data-rating="${i + 1}" onclick="setRating(${i + 1})">★</span>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="dialog-buttons">
            <button onclick="finishTodo(${todoId})">确认完成</button>
        </div>
    `);
}

// [Refactored] Now uses TaskManager for core logic
function finishTodo(todoId) {
    if (!window.currentRating || isNaN(window.currentRating)) {
        alert('请给任务完成度打分！');
        return;
    }

    const actualTime = Math.round((Date.now() - timerState.startTime) / 1000);
    const rating = window.currentRating;
    
    // Use TaskManager for core business logic
    const tm = getTaskManager();
    let result;
    
    if (tm) {
        result = tm.completeTodo(todoId, actualTime, rating);
        if (!result) return;
    } else {
        // Fallback
        const todo = state.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        todo.completed = true;
        todo.completedAt = new Date().toISOString();
        todo.satisfaction = rating;
        
        const timeRatio = actualTime / (todo.duration * 60 * 60);
        const baseReward = 10;
        const baseFlameReward = Math.round(baseReward * (rating / 5) * (timeRatio < 1 ? (1 + (1 - timeRatio)) : 1));
        const spiritCost = todo.duration <= 0.5 ? 10 : (todo.duration <= 1 ? 20 : (todo.duration <= 2 ? 40 : 100));
        const energyCost = Math.round((todo.duration / 8) * 100);
        
        result = { todo, baseFlameReward, energyCost, spiritCost };
    }
    
    const { todo, baseFlameReward, energyCost, spiritCost } = result;
    
    // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
    const flameReward = calculateFlameReward(baseFlameReward);
    
    // 更新状态
    state.stats.flame += flameReward;
    state.stats.energy = Math.max(0, state.stats.energy - energyCost);
    state.stats.spirit = Math.max(0, state.stats.spirit - spiritCost);

    // 添加日志
    if (!state.logs) state.logs = [];
    state.logs.push(`[第${state.stats.totalDays}天] 完成待办事项：${todo.name}，获得火苗：${flameReward}，消耗体力：${energyCost}，消耗精力：${spiritCost}`);

    saveState();
    updateUI();

    showDialog(`
        <h2>奖励结算</h2>
        <div class="reward-summary">
            <p>获得火苗：${flameReward}${state.shop.activeEffects.mirror ? ' (镜子效果翻倍)' : ''}</p>
            <p>消耗精力：${spiritCost}</p>
            <p>剩余体力：${state.stats.energy}/100</p>
            <p>剩余精力：${state.stats.spirit}/100</p>
        </div>
        <div class="dialog-buttons">
            <button onclick="showTodoMaster()">返回待办列表</button>
        </div>
    `);
}

// 添加新的CSS样式
style.textContent += `
    .todos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }

    .todo-card {
        background-color: var(--secondary-bg);
        border-radius: 15px;
        padding: 15px;
        transition: transform 0.2s;
    }

    .todo-card:hover {
        transform: translateY(-5px);
    }

    .todo-card h3 {
        margin-bottom: 10px;
        color: var(--text-primary);
    }

    .todo-card p {
        margin: 5px 0;
        color: var(--text-secondary);
    }
`;

// 显示添加项目对话框
function showAddProjectsDialog() {
    showDialog(`
        <h2>添加项目</h2>
        <p>让我们添加需要近期完成的项目</p>
        <div class="form-group">
            <label for="project-name">项目名称：</label>
            <input type="text" id="project-name" placeholder="例如：完成论文初稿、减肥10斤">
        </div>
        <div class="form-group">
            <label for="project-deadline">截止日期：</label>
            <input type="date" id="project-deadline" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
            <label for="project-daily-time">每天计划投入时间（小时）：</label>
            <input type="number" id="project-daily-time" min="0.5" step="0.5" value="2">
        </div>
        <div class="form-group">
            <label for="project-importance">重要性：</label>
            <select id="project-importance">
                <option value="high">非常重要</option>
                <option value="medium">一般重要</option>
                <option value="low">不重要</option>
            </select>
        </div>
        <div class="form-group">
            <label for="project-interest">兴趣程度：</label>
            <select id="project-interest">
                <option value="high">很感兴趣</option>
                <option value="medium">一般</option>
                <option value="low">不感兴趣</option>
            </select>
        </div>
        <div id="milestones-container">
            <h3>项目节点</h3>
            <div class="milestone-list"></div>
            <button onclick="addMilestoneInput()">添加节点</button>
        </div>
        <div class="dialog-buttons">
            <button onclick="addProject()">添加项目</button>
            <button onclick="skipProjects()">暂不添加</button>
        </div>
    `, true, 'project');
    
    // 添加第一个节点输入
    addMilestoneInput();
}

// 添加节点输入框
function addMilestoneInput() {
    const milestoneList = document.querySelector('.milestone-list');
    const milestoneIndex = milestoneList.children.length + 1;
    
    const milestoneHtml = `
        <div class="milestone-input">
            <div class="form-group">
                <label>节点 ${milestoneIndex}：</label>
                <input type="text" class="milestone-name" placeholder="节点描述">
                <input type="date" class="milestone-date" min="${new Date().toISOString().split('T')[0]}">
                <button onclick="this.parentElement.parentElement.remove()">删除</button>
            </div>
        </div>
    `;
    
    milestoneList.insertAdjacentHTML('beforeend', milestoneHtml);
}

// 添加项目
function addProject() {
    const name = document.getElementById('project-name').value.trim();
    const deadline = document.getElementById('project-deadline').value;
    const dailyTime = parseFloat(document.getElementById('project-daily-time').value);
    const importance = document.getElementById('project-importance').value;
    const interest = document.getElementById('project-interest').value;

    if (!name || !deadline) {
        alert('请填写项目名称和截止日期');
        return;
    }

    if (isNaN(dailyTime) || dailyTime < 0.5) {
        alert('请输入有效的每日时间（至少0.5小时）');
        return;
    }

    // 收集节点信息
    const milestones = [];
    document.querySelectorAll('.milestone-input').forEach((input, index) => {
        const name = input.querySelector('.milestone-name').value.trim();
        const date = input.querySelector('.milestone-date').value;
        
        if (name && date) {
            milestones.push({
                id: Date.now() + index,
                name,
                date,
                completed: false,
                completedAt: null,
                timeSpent: 0 // 记录已花费的时间（小时）
            });
        }
    });

    if (milestones.length === 0) {
        alert('请至少添加一个项目节点');
        return;
    }

    // [Refactored] Use TaskManager
    const tm = getTaskManager();
    const project = {
        name,
        deadline,
        dailyTime,
        importance: parseInt(importance),
        interest: parseInt(interest),
        milestones,
        currentMilestone: 0,
        completedAt: null
    };
    
    if (tm) {
        tm.addProject(project);
    } else {
        // Fallback
        project.id = Date.now();
        project.createdAt = new Date().toISOString();
        state.projects.push(project);
    }
    saveState();

    showDialog(`
        <h2>项目添加成功！</h2>
        <p>是否继续添加其他项目？</p>
        <div class="dialog-buttons">
            <button onclick="showAddProjectsDialog()">继续添加</button>
            <button onclick="showAddTodosDialog()">下一步：添加待办事项</button>
        </div>
    `);
}

// 跳过添加项目
function skipProjects() {
    showDialog(`
        <h2>确认跳过</h2>
        <p>确定现在不添加项目吗？你可以之后随时添加。</p>
        <div class="dialog-buttons">
            <button onclick="showAddTodosDialog()">确定</button>
            <button onclick="showAddProjectsDialog()">返回添加</button>
        </div>
    `);
}

// 重置应用
function resetApp() {
    showDialog(`
        <h2>确认重置</h2>
        <p>这将清除所有数据并重新开始。此操作不可撤销，确定要继续吗？</p>
        <div class="dialog-buttons">
            <button onclick="confirmReset()" class="danger">确认重置</button>
            <button onclick="closeDialog()">取消</button>
        </div>
    `);
}

// 确认重置
function confirmReset() {
    // 保存当前的背景设置
    const backgroundSettings = localStorage.getItem('backgroundSettings');
    
    // 清除所有存储的数据
    localStorage.clear();
    
    // 恢复背景设置
    if (backgroundSettings) {
        localStorage.setItem('backgroundSettings', backgroundSettings);
    }
    
    // 重置状态
    state.character = null;
    state.dailyTasks = [];
    state.projects = [];
    state.todos = [];
    state.stats = {
        energy: 100,
        spirit: 50,  // 初始精力改为50
        sawdust: 100,
        flame: 100,
        totalDays: 1,
        burningDays: 0,
        ash: 10000
    };
    state.depression = {
        status: '黑狗缠身',  // 初始状态
        dailySpirit: 50,     // 每日初始精力
        nextMilestone: 7,    // 下一个里程碑天数
        milestones: {
            7: { status: '黑狗退后', spirit: 60 },
            30: { status: '黑狗退散', spirit: 75 },
            60: { status: '战胜黑狗', spirit: 100 }
        }
    };
    state.currentDay = new Date();
    state.dailyThoughtCompleted = false;
    state.logs = [];
    
    // 重置商店状态
    state.shop = {
        activeEffects: {
            fireStarter: false,
            mirror: false,
            oxygenChamber: false
        }
    };
    
    // 重置度假状态
    state.vacation = {
        isOnVacation: false,
        vacationType: null,
        startDate: null,
        endDate: null,
        canEndEarly: true
    };

    // 重新显示初始化界面
    showInitScreen();
    
    // 重新应用背景设置
    updateBackgrounds();
}

// 开始杂念计时器
function startThoughtTimer() {
    // 显示文本区域和计时器
    document.getElementById('thought-menu').style.display = 'none';
    document.getElementById('thought-content').style.display = 'block';
    document.getElementById('thought-text').style.display = 'block';
    
    // 设置15分钟倒计时
    timerState.seconds = 15 * 60;
    timerState.startTime = Date.now();
    timerState.pausedTime = 0;
    timerState.isPaused = false;

    updateTimerDisplay(timerState.seconds);
    
    timerState.intervalId = setInterval(() => {
        if (!timerState.isPaused) {
            timerState.seconds--;
            updateTimerDisplay(timerState.seconds);
            
            if (timerState.seconds <= 0) {
                clearInterval(timerState.intervalId);
                timerState.intervalId = null;
                finishThought();
            }
        }
    }, 1000);
}

// 显示项目经理界面
// [Refactored] Now uses TaskManager.getActiveProjects()
function showProjectManager() {
    if (state.projects.length === 0) {
        showDialog(`
            <h2>项目经理</h2>
            <p>你还没有添加任何项目。</p>
            <div class="dialog-buttons">
                <button onclick="showAddProjectsDialog()">添加项目</button>
                <button onclick="closeDialog()">返回</button>
            </div>
        `);
        return;
    }

    // Use TaskManager for sorting
    const tm = getTaskManager();
    const activeProjects = tm ? tm.getActiveProjects() : state.projects.filter(project => !project.completedAt);
    
    const projectsHtml = activeProjects
        .map(project => {
            const nextMilestone = project.milestones[project.currentMilestone];
            const completedMilestones = project.currentMilestone;
            const totalMilestones = project.milestones.length;
            const overallProgress = Math.round((completedMilestones * 100) / totalMilestones);
            
            // 获取当前里程碑已花费的时间
            const timeSpent = nextMilestone && nextMilestone.timeSpent ? nextMilestone.timeSpent.toFixed(1) : '0.0';
            
            return `
                <div class="project-card" 
                    data-project-id="${project.id}"
                    data-importance="${project.importance}"
                    data-interest="${project.interest}">
                    <div class="project-actions">
                        <button onclick="editProject(${project.id})" class="edit-btn" title="编辑项目">✏️</button>
                        <button onclick="deleteProject(${project.id})" class="delete-btn" title="删除项目">🗑️</button>
                    </div>
                    <h3>${project.name}</h3>
                    <p>截止日期：${new Date(project.deadline).toLocaleDateString()}</p>
                    <p>每日投入：${project.dailyTime}小时</p>
                    <p>重要性：${getImportanceText(project.importance)}</p>
                    <p>兴趣度：${getInterestText(project.interest)}</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${overallProgress}%"></div>
                    </div>
                    <p>总体进度：${completedMilestones}/${totalMilestones} 节点 (${overallProgress}%)</p>
                    ${nextMilestone ? `
                        <p>当前节点：${nextMilestone.name}</p>
                        <p>已投入时间：${timeSpent}小时</p>
                    ` : '<p>已完成所有节点</p>'}
                    ${nextMilestone ? `<button onclick="startProject(${project.id})">开始工作</button>` : ''}
                </div>
            `;
        }).join('');

    const completedProjectsHtml = state.projects
        .filter(project => project.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .map(project => {
            return `
                <div class="project-card completed" data-project-id="${project.id}">
                    <div class="project-actions">
                        <button onclick="deleteProject(${project.id})" class="delete-btn" title="删除项目">🗑️</button>
                    </div>
                    <h3>${project.name} ✅</h3>
                    <p>完成日期：${new Date(project.completedAt).toLocaleDateString()}</p>
                    <p>里程碑数量：${project.milestones.length}</p>
                </div>
            `;
        }).join('');

    showDialog(`
        <h2>项目经理</h2>
        <h3>进行中的项目</h3>
        <div class="projects-grid">
            ${projectsHtml || '<p class="empty-message">没有进行中的项目</p>'}
        </div>
        ${completedProjectsHtml ? `
            <h3>已完成的项目</h3>
            <div class="projects-grid completed-projects">
                ${completedProjectsHtml}
            </div>
        ` : ''}
        <div class="dialog-buttons">
            <button onclick="showAddProjectsDialog()">添加新项目</button>
            <button onclick="closeDialog()">返回</button>
        </div>
    `);
}

// 开始项目工作
// [Refactored] Now uses TaskManager.getProjectById()
function startProject(projectId) {
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;

    const milestone = project.milestones[project.currentMilestone];
    if (!milestone) {
        alert('该项目已完成所有节点！');
        return;
    }

    // 计算预计消耗的体力
    const energyCost = Math.round((project.dailyTime / 8) * 100);
    // 计算预计消耗的精力
    const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
    
    // 检查体力和精力是否足够
    if (state.stats.energy < energyCost || (spiritCost > 0 && state.stats.spirit < spiritCost)) {
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

    // 保存当前任务ID到全局变量
    window.currentTaskId = projectId;

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
}

// 放弃项目工作
function abandonProject() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    showDialog(`
        <h2>放弃任务</h2>
        <p>确定要放弃当前项目工作吗？</p>
        <div class="dialog-buttons">
            <button onclick="showProjectManager()">确定</button>
            <button onclick="resumeProject()">返回任务</button>
        </div>
    `);
}

// 恢复项目工作
function resumeProject() {
    const taskId = window.currentTaskId;
    if (taskId) {
        startProject(taskId);
    } else {
        showProjectManager();
    }
}

// 完成项目工作环节
// [Refactored] Now uses TaskManager.getProjectById()
function completeProjectSession(projectId) {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;

    const milestone = project.milestones[project.currentMilestone];
    
    showDialog(`
        <h2>工作环节完成！</h2>
        <div class="completion-summary">
            <p>项目：${project.name}</p>
            <p>当前节点：${milestone.name}</p>
            <div class="rating-container">
                <p>给自己的工作质量打个分：</p>
                <div class="rating" id="satisfaction-rating">
                    ${Array(5).fill(0).map((_, i) => `
                        <span class="star" data-rating="${i + 1}" onclick="setRating(${i + 1})">★</span>
                    `).join('')}
                </div>
            </div>
            <div class="dialog-buttons" style="margin-top: 20px;">
                <button onclick="finishProjectProgress(${projectId})">继续完成</button>
                <button onclick="completeMilestone(${projectId})">已完成节点</button>
            </div>
        </div>
    `);
}

// 完成项目进度
// [Refactored] Now uses TaskManager.getProjectById()
function finishProjectProgress(projectId) {
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;

    if (!window.currentRating) {
        alert('请给工作质量打分！');
        return;
    }

    const milestone = project.milestones[project.currentMilestone];
    
    // 计算实际工作时长（秒）
    const workTimeInSeconds = timerState.seconds || (project.dailyTime * 60 * 60);
    
    // 将工作时长转换为小时
    const workTimeInHours = workTimeInSeconds / 3600;
    
    // 根据评分调整奖励
    const ratingMultiplier = window.currentRating / 5;
    
    // 计算基础奖励（基于项目每日投入时间）
    const baseReward = Math.round(workTimeInHours * 10);
    
    // 计算基础木屑和火苗奖励
    const sawdustReward = Math.round(baseReward * ratingMultiplier);
    const baseFlameReward = Math.round(sawdustReward / 2);
    
    // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
    const flameReward = calculateFlameReward(baseFlameReward);
    
    // 更新状态
    state.stats.sawdust += sawdustReward;
    state.stats.flame += flameReward;
    
    // 更新精力和体力
    const energyCost = Math.round((workTimeInHours / 8) * 100);
    const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
    state.stats.energy = Math.max(0, state.stats.energy - energyCost);
    state.stats.spirit = Math.max(0, Math.min(100, state.stats.spirit - spiritCost));

    // 记录工作时长
    if (!milestone.timeSpent) {
        milestone.timeSpent = 0;
    }
    milestone.timeSpent += workTimeInHours;

    // 添加日志
    if (!state.logs) state.logs = [];
    state.logs.push(`[第${state.stats.totalDays}天] 项目进度：${project.name} - ${milestone.name}，工作时长：${workTimeInHours.toFixed(1)}小时，获得木屑：${sawdustReward}，获得火苗：${flameReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);

    saveState();
    updateUI();
    
    // 关闭对话框
    closeDialog();
    
    // 显示奖励提示
    showDialog(`
        <h2>项目进度更新！</h2>
        <div class="rewards-summary">
            <p>项目：${project.name}</p>
            <p>节点：${milestone.name}</p>
            <p>工作时长：${workTimeInHours.toFixed(1)}小时</p>
            <div class="rewards">
                <p>🪵 获得木屑：${sawdustReward}</p>
                <p>🔥 获得火苗：${flameReward}${state.shop.activeEffects.mirror ? ' (镜子效果翻倍)' : ''}</p>
                <p>⚡ 消耗体力：${energyCost}</p>
                <p>${spiritCost < 0 ? '✨ 恢复精力：' + (-spiritCost) : '🧠 消耗精力：' + spiritCost}</p>
            </div>
        </div>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">继续</button>
        </div>
    `);
}

// 上传头像
function uploadAvatar() {
    const input = document.getElementById('avatar-input');
    input.click();

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }

        // 检查文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const avatarData = event.target.result;
            // 保存头像数据到本地存储
            if (state.character) {
                state.character.avatar = avatarData;
                saveState();
            }
            // 更新显示
            updateAvatarDisplay();
        };
        reader.readAsDataURL(file);
    };
}

// 更新头像显示
function updateAvatarDisplay() {
    const avatar = document.getElementById('avatar');
    const placeholder = avatar.querySelector('.avatar-placeholder');
    
    // 移除旧的图片（如果存在）
    const oldImg = avatar.querySelector('img');
    if (oldImg) {
        oldImg.remove();
    }

    if (state.character && state.character.avatar) {
        // 显示头像图片
        const img = document.createElement('img');
        img.src = state.character.avatar;
        avatar.insertBefore(img, placeholder);
        placeholder.style.display = 'none';
    } else {
        // 显示占位文本
        placeholder.style.display = 'block';
    }
}

// 在创建角色后显示上传头像提示
function showAvatarUploadPrompt() {
    showDialog(`
        <h2>上传头像</h2>
        <p>要为你的火柴人上传一个头像吗？</p>
        <div class="dialog-buttons">
            <button onclick="uploadAvatar()">现在上传</button>
            <button onclick="startTaskSetup()">稍后再说</button>
        </div>
    `);
}

// 显示愿望商店
function showWishShop() {
    // 获取当前激活的效果列表
    const activeEffectsList = [];
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
            <div class="shop-shelf">
                <h3>零食饮料</h3>
                <p class="coming-soon">即将上架，敬请期待...</p>
            </div>
            <div class="shop-shelf">
                <h3>娱乐设施</h3>
                <p class="coming-soon">即将上架，敬请期待...</p>
            </div>
            <div class="shop-shelf">
                <h3>神秘货架</h3>
                <p class="coming-soon">期待新商品...</p>
            </div>
        </div>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">关闭</button>
        </div>
    `;
    
    showDialog(shopContent);
}

// 购买商品
function purchaseItem(itemType) {
    const costs = {
        fireStarter: 100,
        mirror: 200,
        oxygenChamber: 5000
    };
    
    const cost = costs[itemType];
    if (state.stats.ash < cost) {
        alert('灰烬不足！');
        return;
    }
    
    state.stats.ash -= cost;
    
    switch(itemType) {
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
    }
    
    saveState();
    updateUI();
    showWishShop(); // 刷新商店界面
}

// 显示星光海滩
function showStarlightBeach() {
    if (state.vacation.isOnVacation) {
        showVacationStatus();
        return;
    }

    const beachContent = `
        <h2>星光海滩</h2>
        <p>火柴人的梦想是去海边看星星。劳累了这么久，是否要去度个假？</p>
        <div class="vacation-options">
            <div class="vacation-option" onmouseover="showTooltip(event, '消耗5000灰烬去度假。一周内火苗不会减少或增加，不管你做不做任何任务。')" onmouseout="hideTooltip()">
                <h3>短期假期</h3>
                <button onclick="startVacation('short')" ${state.stats.ash < 5000 ? 'disabled' : ''}>
                    去休个短假
                </button>
            </div>
            <div class="vacation-option" onmouseover="showTooltip(event, '消耗20000灰烬去度假。一个月内火苗不会减少或增加，不管你做不做任何任务。')" onmouseout="hideTooltip()">
                <h3>长期假期</h3>
                <button onclick="startVacation('long')" ${state.stats.ash < 20000 ? 'disabled' : ''}>
                    去休个长假
                </button>
            </div>
            <div class="vacation-option">
                <h3>返回</h3>
                <button onclick="closeDialog()">算了，过段时间再说</button>
            </div>
        </div>
        <div id="tooltip" class="tooltip" style="display: none;"></div>
    `;
    
    showDialog(beachContent);
}

// 显示工具提示
function showTooltip(event, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
}

// 隐藏工具提示
function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}

// 开始度假
function startVacation(type) {
    const costs = {
        short: 5000,
        long: 20000
    };
    
    if (state.stats.ash < costs[type]) {
        alert('灰烬不足！');
        return;
    }
    
    state.stats.ash -= costs[type];
    state.vacation.isOnVacation = true;
    state.vacation.vacationType = type;
    
    const currentDate = new Date(state.currentDay);
    state.vacation.startDate = currentDate.toISOString();
    
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + (type === 'short' ? 7 : 30));
    state.vacation.endDate = endDate.toISOString();
    
    saveState();
    updateUI();
    showVacationStatus();
}

// 显示度假状态
function showVacationStatus() {
    const endDate = new Date(state.vacation.endDate);
    const currentDate = new Date(state.currentDay);
    const daysLeft = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
    
    const statusContent = `
        <h2>度假状态</h2>
        <div class="vacation-status">
            <p>你正在星光海滩度假！</p>
            <p>假期类型：${state.vacation.vacationType === 'short' ? '短期' : '长期'}度假</p>
            <p>剩余天数：${daysLeft}天</p>
            <p>在度假期间，你的火苗既不会减少也不会增加。</p>
            ${daysLeft > 0 ? '<button onclick="endVacation()">提前结束度假</button>' : ''}
        </div>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">关闭</button>
        </div>
    `;
    
    showDialog(statusContent);
}

// 结束度假
function endVacation() {
    if (!confirm('确定要提前结束度假吗？')) {
        return;
    }
    
    state.vacation.isOnVacation = false;
    state.vacation.vacationType = null;
    state.vacation.startDate = null;
    state.vacation.endDate = null;
    
    saveState();
    updateUI();
    closeDialog();
    showStarlightBeach(); // 返回星光海滩界面
}

function calculateTaskRewards(task) {
    // 基础奖励
    let sawdustReward = 0;
    let flameReward = 0;
    
    // 根据任务类型计算奖励
    switch(task.type) {
        case 'daily':
            sawdustReward = 10;
            flameReward = task.completed ? 5 : 0;
            break;
        case 'project':
            sawdustReward = 30;
            flameReward = task.completed ? 15 : 0;
            break;
        case 'todo':
            sawdustReward = 20;
            flameReward = task.completed ? 10 : 0;
            break;
    }
    
    // 根据重要性和兴趣度/紧急度调整奖励
    const importanceMultiplier = task.importance === 'high' ? 1.5 : 1;
    const secondaryMultiplier = (task.interest === 'high' || task.urgency === 'high') ? 1.3 : 1;
    
    sawdustReward = Math.floor(sawdustReward * importanceMultiplier * secondaryMultiplier);
    flameReward = Math.floor(flameReward * importanceMultiplier * secondaryMultiplier);
    
    return { sawdustReward, flameReward };
}

function completeTask(task) {
    // 计算体力和精力消耗
    const energyCost = Math.floor((task.duration / 8) * 100);
    const spiritCost = task.interest === 'low' ? 30 : (task.interest === 'medium' ? 20 : 10);
    
    // 检查是否有足够的体力和精力
    if (state.stats.energy < energyCost || state.stats.spirit < spiritCost) {
        alert('体力或精力不足，无法完成任务！');
        return false;
    }
    
    // 扣除体力和精力
    state.stats.energy -= energyCost;
    state.stats.spirit -= spiritCost;
    
    // 计算并添加奖励
    const { sawdustReward, flameReward } = calculateTaskRewards(task);
    state.stats.sawdust += sawdustReward;
    state.stats.flame += flameReward;
    
    // 更新任务状态
    task.completed = true;
    task.completionDate = new Date().toISOString();
    
    // 添加到日志
    addToLog(`完成任务: ${task.title}\n获得木屑: ${sawdustReward}\n获得火苗: ${flameReward}\n消耗体力: ${energyCost}\n消耗精力: ${spiritCost}`);
    
    saveState();
    updateUI();
    return true;
}

// 设置评分
function setRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
    window.currentRating = rating;
}

// 添加评分相关的CSS样式
const ratingStyle = document.createElement('style');
ratingStyle.textContent = `
    .rating-container {
        margin: 15px 0;
        text-align: center;
    }

    .rating {
        display: inline-block;
        font-size: 24px;
        cursor: pointer;
    }

    .star {
        color: #ccc;
        transition: color 0.2s;
        padding: 0 2px;
    }

    .star:hover,
    .star.active {
        color: #ffb900;
    }
`;
document.head.appendChild(ratingStyle);

// 魔法学院系统 - 羊皮纸故事集合
const PARCHMENT_STORIES = [
    {
        id: 'ancient_war',
        name: '远古战争编年史',
        color: 'brown',
        description: '记录了火柴神与黑狗神之间的远古战争',
        fragments: [
            {
                id: 'ancient_war_1',
                title: 'The First Flame',
                content: 'In the beginning, there was only darkness. The Black Dog roamed freely, spreading despair and emptiness. Then came the First Flame, ignited by the Match Gods. Its light pushed back the darkness, creating a safe haven for the first matchstick people.'
            },
            {
                id: 'ancient_war_2',
                title: 'The War Begins',
                content: 'The Black Dog God, threatened by the growing flame, gathered his shadows for the first great attack. The Match Gods formed an alliance: the Wise one with strategy, the King with leadership, and the Rich one with resources. Thus began the Ancient War.'
            },
            {
                id: 'ancient_war_3',
                title: 'The Darkest Hour',
                content: 'At the peak of the war, the Black Dog unleashed a wave of depression that extinguished many flames. Matchstick people fell into despair, and entire cities were lost to darkness. It seemed that all hope was fading.'
            },
            {
                id: 'ancient_war_4',
                title: 'The Turning Point',
                content: 'When hope seemed lost, the matchstick people discovered their inner resilience. They learned that by sharing their flames, they could create a light too strong for the Black Dog to extinguish. This was the first discovery of communal fire.'
            },
            {
                id: 'ancient_war_5',
                title: 'The Truce',
                content: 'The war ended not with a victory, but with understanding. The Match Gods realized that darkness could never be permanently defeated, just as the Black Dog realized it could never extinguish all flame. A balance was struck that continues to this day.'
            }
        ]
    },
    {
        id: 'ashwalker',
        name: '灰烬行者传说',
        color: 'gray',
        description: '讲述了第一位灰烬行者的传奇故事',
        fragments: [
            {
                id: 'ashwalker_1',
                title: 'Birth from Ashes',
                content: 'The first Ashwalker was not born, but formed from the ashes of a thousand extinguished matches. When consciousness came to the pile of ash, it found itself different - neither burning brightly like matches, nor dark like the servants of the Black Dog.'
            },
            {
                id: 'ashwalker_2',
                title: 'The Gift of Memento',
                content: 'The Ashwalker discovered a unique ability: it could touch the memories of burnt matches. By walking through ash, it collected fragments of experiences, wisdom, and stories from those who had burned before. These became the first Parchments.'
            },
            {
                id: 'ashwalker_3',
                title: 'Academy of Ash',
                content: 'Seeking to preserve these memories, the Ashwalker founded a place of learning. Built from the ashes of the greatest heroes, the Magic Academy became a repository of knowledge that would otherwise be lost when matches burned out.'
            },
            {
                id: 'ashwalker_4',
                title: 'The Black Dog\'s Curiosity',
                content: 'Even the Black Dog was curious about this being of ash. Neither bright enough to repel it nor dark enough to attract it, the Ashwalker could walk between worlds. The Black Dog allowed the Academy to exist, seeing no immediate threat.'
            },
            {
                id: 'ashwalker_5',
                title: 'Legacy of Ash',
                content: 'When the first Ashwalker finally dispersed back to dust, its consciousness spread into the Academy itself. The building became semi-sentient, choosing new Ashwalkers from among those who sought knowledge. Thus the cycle continued.'
            }
        ]
    },
    {
        id: 'love_story',
        name: '跨界之恋',
        color: 'red',
        description: '一个火柴人与暗影生物相爱的禁忌故事',
        fragments: [
            {
                id: 'love_story_1',
                title: 'Flicker and Shadow',
                content: 'Ember was a matchstick girl with an unusually bright flame. Shadow was a creature born from the Black Dog\'s breath, but with curiosity that outweighed its darkness. They met at the border between light and dark, where neither should have been.'
            },
            {
                id: 'love_story_2',
                title: 'Forbidden Meetings',
                content: 'They began to meet in secret at twilight, when neither light nor dark held sway. Ember would dim her flame slightly, and Shadow would pull in its darkness. In this shared gray space, they found understanding beyond their natures.'
            },
            {
                id: 'love_story_3',
                title: 'The Discovery',
                content: 'When the Match Gods discovered their meetings, they threatened to extinguish Ember permanently. The Black Dog, equally displeased, threatened to absorb Shadow back into formless darkness. They fled together into the unexplored wilds.'
            },
            {
                id: 'love_story_4',
                title: 'The Balance',
                content: 'In exile, something miraculous happened. Ember\'s flame and Shadow\'s darkness began to balance each other. Neither extinguished nor consumed the other. Instead, they created a new form of existence - the first Twilight Being.'
            },
            {
                id: 'love_story_5',
                title: 'New Life',
                content: 'The child of Ember and Shadow was neither match nor shadow, but something new. With the ability to create soft, gentle light that did not burn out and darkness that did not consume, this being became the ancestor of the Twilight Guides who now help lost souls find their way.'
            }
        ]
    },
    {
        id: 'science_records',
        name: '火苗能量学研究',
        color: 'blue',
        description: '记录了火柴人世界的科学发现和能量研究',
        fragments: [
            {
                id: 'science_records_1',
                title: 'Properties of Flame',
                content: 'Our research indicates that the flame produced by matchstick people is fundamentally different from ordinary fire. While it consumes the matchstick body slowly, it produces energetic particles we have termed "spiritrons" that can affect emotional states of nearby beings.'
            },
            {
                id: 'science_records_2',
                title: 'The Ash Cycle',
                content: 'When matchstick people burn, they produce ash. This ash contains trace elements of consciousness and memory. Given sufficient concentration and the right conditions, ash can be recycled into new matchstick bodies, though without the memories of their predecessors.'
            },
            {
                id: 'science_records_3',
                title: 'Black Dog Composition',
                content: 'Analysis of shadow matter from the Black Dog\'s creatures reveals an inverse relationship to spiritrons. These "despairons" appear to neutralize emotional energy and create states of emptiness. However, they cannot exist in areas of intense flame concentration.'
            },
            {
                id: 'science_records_4',
                title: 'Energy Transference',
                content: 'Our most surprising discovery is that spiritrons can be willingly transferred between individuals. When one matchstick person expends energy to help another, the flame energy is not lost but multiplied. This may explain the communal flame effect observed in matchstick settlements.'
            },
            {
                id: 'science_records_5',
                title: 'Theoretical Applications',
                content: 'If our calculations are correct, a properly designed spiritron chamber could create a perpetual flame that never consumes its host. Such a breakthrough would revolutionize our society, allowing matchstick people to live indefinitely without the fear of burning out.'
            }
        ]
    },
    {
        id: 'hero_biography',
        name: '火柴勇者传',
        color: 'gold',
        description: '记录了最伟大的火柴英雄的生平和冒险',
        fragments: [
            {
                id: 'hero_biography_1',
                title: 'The Unlikely Hero',
                content: 'Spark was born with the smallest flame anyone had ever seen. The other matchstick children laughed, saying he would barely light a candle. But the Wise God saw something in this tiny flame - a rare resilience that might burn longer than all others.'
            },
            {
                id: 'hero_biography_2',
                title: 'First Trial',
                content: 'When darkness began creeping into the edges of the Flame City, most fled inward. But Spark walked toward the shadows, his tiny flame somehow unnoticed by the Black Dog\'s servants. He discovered their weakness: they could not perceive small hopes, only bright ones.'
            },
            {
                id: 'hero_biography_3',
                title: 'The Journey',
                content: 'Spark traveled to all three Match Gods, learning wisdom, leadership, and resource management. His flame grew not in brightness but in steadiness. When he returned, he carried a unique gift: the ability to burn consistently without consuming himself too quickly.'
            },
            {
                id: 'hero_biography_4',
                title: 'The Dark Confrontation',
                content: 'Using his steady flame, Spark did what no match had done - he walked directly into the Black Dog\'s lair. Not to fight, but to understand. There, he realized the truth: the Dog was not evil, merely a natural force seeking balance. They spoke for days until reaching an understanding.'
            },
            {
                id: 'hero_biography_5',
                title: 'Legacy of Balance',
                content: 'When Spark finally burned out, he had lived ten times longer than any match before him. His teachings of balance - how to burn brightly when needed, dimly when prudent, and how to acknowledge darkness without fearing it - formed the foundation of modern matchstick philosophy.'
            }
        ]
    },
    {
        id: 'ritual_knowledge',
        name: '古老仪式大全',
        color: 'purple',
        description: '记录了火柴人社会中的各种神秘仪式和习俗',
        fragments: [
            {
                id: 'ritual_knowledge_1',
                title: 'The Kindling Ceremony',
                content: 'When a new matchstick child reaches maturity, they participate in the Kindling. The three eldest matches of the community combine their flames to ignite the young one\'s head for the first time. This shared fire creates a spiritual connection that lasts a lifetime.'
            },
            {
                id: 'ritual_knowledge_2',
                title: 'Twilight Meditation',
                content: 'At the border between day and night, matchstick people practice the Dimming - a ritual where they lower their flames to the barest glow. In this state, they can sometimes perceive the whispers of those who have burned out before them, gaining insights and wisdom.'
            },
            {
                id: 'ritual_knowledge_3',
                title: 'The Ash Collection',
                content: 'When a matchstick person burns out completely, their community gathers the ash in a special urn. These urns are taken to the Memorial Grove, where they\'re used to fertilize new matchstick saplings. Thus, the essence of those who came before nourishes the next generation.'
            },
            {
                id: 'ritual_knowledge_4',
                title: 'Black Dog Appeasement',
                content: 'Once each month, on the darkest night, communities perform the Shadow Dance. Matches dim their flames and move in patterns that acknowledge the necessity of darkness. This ritual is believed to satisfy the Black Dog\'s need for recognition and prevent more aggressive incursions.'
            },
            {
                id: 'ritual_knowledge_5',
                title: 'The Great Rekindling',
                content: 'Every seven years, all matchstick communities practice the Great Rekindling. Flames are passed from person to person until everyone burns brightly. This massive display of light is said to reset the balance between flame and shadow in the world, preventing either from dominating.'
            }
        ]
    },
    {
        id: 'daily_wisdom',
        name: '每日智慧录',
        color: 'green',
        description: '收集了火柴智者们的日常思考和智慧箴言',
        fragments: [
            {
                id: 'daily_wisdom_1',
                title: 'On Purpose',
                content: 'A match that fears burning will never know its purpose. We are made to shine, to give warmth and light. The length of our burning is less important than its quality. Ask not how long you will last, but how brightly you can illuminate the path for others.'
            },
            {
                id: 'daily_wisdom_2',
                title: 'On Balance',
                content: 'The wise match knows when to burn brightly and when to conserve. There is no virtue in burning yourself out for trivial matters, nor in saving yourself for a perfect moment that never comes. Balance is found in mindful burning, attuned to genuine need.'
            },
            {
                id: 'daily_wisdom_3',
                title: 'On Darkness',
                content: 'Do not curse the darkness, for without it, our light would have no meaning. The Black Dog is not our enemy but our counterpart. Shadows define our light just as light defines shadows. In understanding this balance, we find peace with our natural cycle.'
            },
            {
                id: 'daily_wisdom_4',
                title: 'On Community',
                content: 'No match burns alone. Even in our individual lighting, we are part of a greater constellation. Share your flame when others flicker, and allow others to strengthen you when you dim. A community of matches can hold back the darkest night indefinitely.'
            },
            {
                id: 'daily_wisdom_5',
                title: 'On Renewal',
                content: 'Every ending is a beginning. When a match burns out, its ash nourishes new growth. Do not fear your eventual extinguishing, but ensure your burning leaves behind something of value. Our physical forms are temporary, but our impact can be eternal.'
            }
        ]
    },
    {
        id: 'blackdog_manual',
        name: '黑狗抵抗指南',
        color: 'silver',
        description: '一本全面的指南，帮助火柴人对抗黑狗的侵扰和抑郁',
        fragments: [
            {
                id: 'blackdog_manual_1',
                title: '识别黑狗的踪迹',
                content: '黑狗潜入你生活的第一个迹象往往是微妙的能量流失。当你注意到自己的火焰开始无故减弱，思绪变得迟缓，曾经喜爱的活动失去吸引力时，黑狗可能已经在附近徘徊。要警惕这些早期迹象，意识到这些变化不是你火焰的本质问题，而是外部影响的结果。'
            },
            {
                id: 'blackdog_manual_2',
                title: '日常火焰维护仪式',
                content: '即使在黑狗最活跃的时期，坚持每日点燃仪式也至关重要。无论火焰多么微弱，每天早晨都要进行三个基本动作：伸展你的火柴身体，面向光源，并至少完成一项微小但有意义的任务。这三个动作会形成一个保护循环，让黑狗更难以完全熄灭你的火焰。'
            },
            {
                id: 'blackdog_manual_3',
                title: '社区火焰网络',
                content: '黑狗最惧怕的是连接的火焰。当你感到自己的火焰即将熄灭时，不要独自躲藏。寻找其他火柴人，加入他们的光环，允许集体的热量支持你。研究表明，在群体环境中，黑狗的影响力减弱高达78%。不要因为火焰微弱而羞愧，每一根火柴都有弱光的时刻。'
            },
            {
                id: 'blackdog_manual_4',
                title: '燃烧优先级重组',
                content: '当黑狗在附近时，重新评估你的燃烧模式。不要尝试维持平常的高强度火焰。相反，确定关键区域：基本生存需求、核心关系维护和微小但可达成的满足感来源。暂时放下其他一切。记住，这是战术性撤退，不是投降。当黑狗离开时，你可以重新点燃那些暂时放下的火焰区域。'
            },
            {
                id: 'blackdog_manual_5',
                title: '专业火焰医师的帮助',
                content: '有时，与黑狗的斗争需要专业火焰医师的介入。寻求这种帮助不是软弱的表现，而是战略上的明智选择。火焰医师拥有专门的工具和技术，可以在最黑暗的时期保护和重新点燃你的核心火焰。如果黑狗的影响持续超过一个月，或者你的火焰减弱到危险水平，立即咨询火焰医师。'
            }
        ]
    },
    {
        id: 'matchhero_legends',
        name: '火柴英雄传奇集',
        color: 'orange',
        description: '记录了各种鲜为人知的火柴英雄及其非凡的英勇事迹',
        fragments: [
            {
                id: 'matchhero_legends_1',
                title: '死亡谷中的守夜者',
                content: '埃沃克是个天生火焰微弱的火柴人，被认为不会活过成年礼。然而，正是他的微光使他成为了唯一能够穿越死亡谷而不被黑狗爪牙发现的火柴人。连续七年，他每月穿越谷地，为被困在彼端的火柴村庄带去药物和希望。他的微光最终成为了指引数百火柴人逃离的灯塔。'
            },
            {
                id: 'matchhero_legends_2',
                title: '最后的图书管理员',
                content: '当黑狗大军围攻知识图书馆时，年长的图书管理员琳达拒绝撤离。其他人都逃走了，但她坚守在无数包含火柴历史的易燃卷轴中间。三天三夜，她独自在黑暗中点燃每一卷重要文献，将内容烧进自己的记忆。当援军抵达时，图书馆已成灰烬，但琳达的头脑成为了一座活动的知识宝库，她后来重建了今日的学院。'
            },
            {
                id: 'matchhero_legends_3',
                title: '无名的火种分享者',
                content: '大衰退期间，一个身份不明的火柴人穿越了十二个失去希望的社区。在每一处，他都分享自己的火焰，重新点燃熄灭的居民。奇怪的是，尽管他不断分享火焰，他自己的火焰从未减弱。有人说他是火柴神的化身，也有人认为他发现了永恒火焰的秘密。无论真相如何，他的故事激励着火柴人在绝望时刻慷慨分享。'
            },
            {
                id: 'matchhero_legends_4',
                title: '暴风中的指挥官',
                content: '历史上最强的暗影风暴袭来时，指挥官艾丽卡拒绝了皇家掩体的保护，相反选择留在城外组织防御。她创造了"火焰之环"阵型，将数千火柴人排成同心圆，外圈火焰最强壮的战士，内圈是老人和幼童。当风暴最终散去，她的防线没有一人倒下，而之前被认为无敌的暗影风暴再也没有回来过。'
            },
            {
                id: 'matchhero_legends_5',
                title: '黑暗中的医者',
                content: '罗宾医生发现自己被困在一个完全被黑狗控制的村庄，那里的居民几乎已经熄灭。没有足够的光亮召唤救援，他开始研究暗影物质本身。在七年隐秘研究后，他创造了"影光疗法"，一种利用黑狗自身能量来重新点燃熄灭火柴的方法。这一发现改变了医学界对光与暗二元性的理解，证明即使在最深的黑暗中也蕴含着重生的种子。'
            }
        ]
    },
    {
        id: 'flame_fables',
        name: '火焰寓言集',
        color: 'yellow',
        description: '充满智慧的火柴人寓言故事，蕴含深刻的生活教训和哲理',
        fragments: [
            {
                id: 'flame_fables_1',
                title: '两根火柴的旅程',
                content: '两根火柴同时从工厂出发。第一根急于展示自己的光芒，立刻点燃自己，照亮了整个森林，引来无数赞叹。第二根则小心保存火药，只在必要时点燃。几天后，第一根火柴已经燃尽，而迷路的旅行者在黑暗中绝望。这时，第二根火柴点燃自己，指引旅者回家。明亮不如持久，真正的价值在于在最需要的时刻提供光明。'
            },
            {
                id: 'flame_fables_2',
                title: '火焰与风的对话',
                content: '一根骄傲的火柴向风炫耀："看我多么明亮！我能驱散一切黑暗。"风回答："是的，你很亮，但也很脆弱。"火柴不屑："那就试试看！"风轻轻吹了一口，火柴熄灭了。然而，就在旁边，一群火柴紧紧依偎在一起，共同燃烧。风再次吹过，但这次，火焰不仅没有熄灭，反而因为气流而跳得更高。真正的力量不在孤立的骄傲中，而在相互支持的团结里。'
            },
            {
                id: 'flame_fables_3',
                title: '盲目的火柴与明眼的蜡烛',
                content: '一根火柴嘲笑蜡烛燃烧缓慢："看看我，一下子就能点亮整个房间！"蜡烛微笑道："是的，你很快，但你能持续多久？"火柴骄傲地完全点燃，很快就变成了一小撮灰烬。黑暗重新降临，只留下蜡烛稳定的光芒。一个路过的火柴人问蜡烛为何不感到孤独，蜡烛回答："我宁愿慢慢燃烧并且持续存在，而不是瞬间闪耀后被遗忘。"持久的承诺胜过短暂的辉煌。'
            },
            {
                id: 'flame_fables_4',
                title: '收集光明的火柴',
                content: '有一根贪婪的火柴，想要收集世上所有的光明。它走遍各地，每遇到一处火光就试图将其吸收。渐渐地，它的火焰越来越大，但它从未满足。一天，它遇到一个黑暗山洞，决定进去寻找可能隐藏的光源。在洞中，它遇到一根微弱的小火柴，奄奄一息。贪婪的火柴本想吞噬这最后一点光，却突然醒悟。它分出一部分自己的火焰给小火柴，这个举动让它感到前所未有的满足。原来，分享光明比占有光明带来更大的亮度。'
            },
            {
                id: 'flame_fables_5',
                title: '会流泪的火柴',
                content: '传说中有一种稀有的火柴，它们的火焰不仅能发光，还会流下火焰的泪滴。一根这样的火柴被人视为怪物，因为火柴不应该"软弱"到流泪。它被放逐到荒野，独自燃烧。然而，它的泪滴落到干燥的土地上，奇迹般地长出了耐火植物。这些植物成为了火柴人新的避难所，能够抵抗黑狗的侵袭。当人们明白火焰的泪水创造了这个奇迹时，他们开始理解：表达情感不是软弱，而是创造新生命的力量源泉。'
            }
        ]
    },
    {
        id: 'resistance_tales',
        name: '抵抗运动编年史',
        color: 'crimson',
        description: '记录了火柴人历史上各种形式的抵抗运动及其对抗黑暗的故事',
        fragments: [
            {
                id: 'resistance_tales_1',
                title: '灯塔计划',
                content: '大黑暗时代初期，一群火柴学者秘密组建了"灯塔网络"。他们在各个社区建立隐秘的灯塔站，每座灯塔由三名成员守护：一名"火种守护者"保存火种，一名"知识守护者"记录历史，一名"希望传递者"在社区中传播微小的希望火花。这个网络使火柴文明在最黑暗的五十年中得以延续，没有一座灯塔被黑狗发现。'
            },
            {
                id: 'resistance_tales_2',
                title: '地下火种库',
                content: '当公开点燃火焰被禁止时，抵抗者们创造了"地下火种库"系统。表面上看是普通的聚会场所，实际上这些地点有着精心设计的地下室，那里火柴人可以安全地点燃自己。这些地下室使用特殊材料建造，能够屏蔽黑狗的感知。最著名的"七灯地下室"同时容纳了七百名火柴人点燃，成为反抗运动的转折点。'
            },
            {
                id: 'resistance_tales_3',
                title: '低语者运动',
                content: '当黑狗的爪牙能够探测到任何希望言论时，"低语者"运动应运而生。这些抵抗者开发出一种特殊的低语语言，表面上听起来是普通对话，但包含隐藏的鼓舞信息。他们在市场、工作场所以及公共场合低语传递这些信息，维持着火柴人的希望，同时逃过黑狗的监控。这种语言后来发展成为现代火柴密码学的基础。'
            },
            {
                id: 'resistance_tales_4',
                title: '记忆火焰守护者',
                content: '当物理形式的历史记录被系统性销毁时，"记忆火焰守护者"组织了一场惊人的抵抗。他们训练成员将重要历史和知识通过特殊冥想技术烧入自己的记忆中。每个守护者负责记忆特定领域的知识，然后教导新的守护者。这个活生生的图书馆保存了火柴文明数千年的智慧，直到安全时期的到来才将其转录成实体文本。'
            },
            {
                id: 'resistance_tales_5',
                title: '黎明前的合唱',
                content: '最黑暗时期的最后阶段，一个名为"黎明前的合唱"的抵抗组织开始在各个城市同时进行秘密合唱。他们发现特定频率的声波能够暂时干扰黑狗的能量场。每天黎明前，成千上万的火柴人同时唱起古老的火焰之歌，创造出几分钟的"安全窗口"，允许他们自由点燃。这些日益壮大的合唱最终创造了足够的集体能量，推动了伟大解放的开始。'
            }
        ]
    },
    {
        id: 'healing_scripts',
        name: '火焰愈合手册',
        color: 'teal',
        description: '古老而实用的自我疗愈技术，帮助受伤的火柴人恢复活力',
        fragments: [
            {
                id: 'healing_scripts_1',
                title: '晨曦呼吸法',
                content: '找一处安静的地方，面向晨光。缓慢吸气七拍，想象吸入纯净的火焰能量；屏息三拍，感受能量在体内聚集；呼气九拍，想象释放所有灰烬和杂质。重复七次。这种古老的呼吸模式能够激活火柴体内的能量流动，尤其适合在低谷期进行。每日实践可增强火焰的自然恢复力。'
            },
            {
                id: 'healing_scripts_2',
                title: '零点重启仪式',
                content: '当你的火焰严重动摇时，执行零点重启：创造一个小型保护空间，放置一面镜子和一根新火柴。将你微弱的火焰轻触新火柴，同时对镜子说出："我承认当下的微弱，但不认同它为我的本质。"然后允许自己的火焰完全熄灭一瞬，立即用新火柴重新点燃。这个象征性的重生仪式可以打破持续的负面循环。'
            },
            {
                id: 'healing_scripts_3',
                title: '寻找火焰锚点',
                content: '每个火柴人都有独特的"火焰锚点"——即使在最黑暗时刻也能保持微光的核心记忆或价值。找到你的锚点：静坐，回想过去最强烈的点燃体验。不是寻找大事件，而是寻找那些即使回忆起来仍能让你火焰微微增强的小时刻。确定这个锚点后，将其具象化为一个简单的符号或词语，在火焰减弱时反复触摸或诵读。'
            },
            {
                id: 'healing_scripts_4',
                title: '灰烬循环疗法',
                content: '不要视灰烬为失败的证据，而应将其视为新生的材料。收集你生活中的"灰烬"——失败、挫折、损失——将它们写在易燃纸上。进行灰烬循环仪式：阅读每一项，承认其存在，然后点燃纸张。收集这些二次灰烬，混入少量泥土，种下一粒种子。这个象征性行为将负面经历转化为新生，打破自我谴责的循环。'
            },
            {
                id: 'healing_scripts_5',
                title: '集体火圈疗愈',
                content: '最强大的愈合发生在社区中。组织一个由三到七人组成的信任火圈。坐成圆形，每人手持一根未点燃的火柴。由需要愈合的人开始，点燃自己的火柴，分享一个脆弱的真相。其他人只需见证，不评判。然后，这个人用自己的火焰点亮下一个人的火柴，依次传递。在光环的支持下，说出受伤和恐惧能够释放它们对我们的控制。'
            }
        ]
    },
    {
        id: 'gatekeeper_diary',
        name: '守门人的日记',
        color: 'indigo',
        description: '记录了魔法学院兴衰的真相，由学院最后一位守门人秘密保存',
        fragments: [
            {
                id: 'gatekeeper_diary_1',
                title: '入职第一天',
                content: '今天是我担任魔法学院守门人的第一天。这座学院气势恢宏，那些雄伟的知识塔楼直插云霄。我的职责很简单：守护大门，记录进出人员，维护学院的安全。院长温德姆大师亲自任命了我，他说选择我是因为我"有一双看透表象的眼睛"。这份工作让我感到荣幸，尽管我只是个普通的火柴人，没有高深的魔法知识。'
            },
            {
                id: 'gatekeeper_diary_2',
                title: '三大长老',
                content: '学院由三位长老共同管理：知识长老梅里达斯，以其无与伦比的记忆力闻名；实践长老沃尔特，他能将最复杂的魔法理论转化为实用技术；以及平衡长老艾诺拉，她确保学院既追求知识又不忘记道德责任。三人间的关系微妙而平衡，就像一个精密的天平。'
            },
            {
                id: 'gatekeeper_diary_3',
                title: '神秘访客',
                content: '今天有位不寻常的访客来到学院。他没有通过正常渠道申请，而是直接在黄昏时分出现在大门前。他自称为"灰袍智者"，要求见院长。奇怪的是，尽管我没有通报，院长似乎已经在等他了。他们相见的那一刻，气氛既紧张又亲密，仿佛是久别重逢的老友，却又带着某种不和。'
            },
            {
                id: 'gatekeeper_diary_4',
                title: '不安的预感',
                content: '最近长老会议的频率明显增加了，而且总是在深夜召开。我注意到三位长老之间的互动变得紧张。尤其是知识长老梅里达斯，他的言辞变得激烈，甚至几次与平衡长老爆发争吵。今天一个学生无意中提到了"终极火种"这个词，但立刻被导师制止。这是我第一次听说这个词。'
            },
            {
                id: 'gatekeeper_diary_5',
                title: '分歧的开始',
                content: '今天，我无意中听到了一场激烈的争论。梅里达斯坚持认为终极火种的力量应该用于扩展知识边界；沃尔特则主张将其用于加强火柴人的生命力；艾诺拉警告说这种力量可能会引来黑狗的注意，主张谨慎研究。院长似乎站在艾诺拉一边。争论以梅里达斯愤怒离席告终。我感到学院内部的裂痕正在形成。'
            },
            {
                id: 'gatekeeper_diary_6',
                title: '秘密会议',
                content: '深夜，我发现梅里达斯和一小群学生在偏僻的东塔秘密会面。他们称自己为"真理追寻者"，梅里达斯向他们灌输一种理念：无限知识才是火柴人唯一的救赎。他们讨论的术语我大多听不懂，但"终极火种"和"源头之火"这些词反复出现。他们似乎在计划某种行动，而这显然未经院长批准。'
            },
            {
                id: 'gatekeeper_diary_7',
                title: '灰袍智者的警告',
                content: '灰袍智者今天再次造访。这次见面后，院长变得异常忧虑。我鼓起勇气询问发生了什么。出乎意料，院长竟然告诉了我：终极火种是远古火柴神留下的能量源，具有改变现实的潜力。黑狗一直在寻找它，而学院世代守护它。灰袍智者带来消息称，黑狗的爪牙已经发现了终极火种的存在，正在逼近学院。'
            },
            {
                id: 'gatekeeper_diary_8',
                title: '沃尔特的困境',
                content: '实践长老沃尔特今天找我私聊，这是前所未有的。他告诉我，他被梅里达斯和艾诺拉两边同时施压。他认为梅里达斯的纯知识追求过于危险，但艾诺拉的过度谨慎也会限制进步。他暗示自己已经开发出一种方法，可以安全地利用终极火种的部分力量，但需要更多时间完善。他请我留意梅里达斯的动向，这让我陷入了两难境地。'
            },
            {
                id: 'gatekeeper_diary_9',
                title: '学生的分化',
                content: '学院的学生们开始明显分化。大多数仍然忠于院长和官方教义，但"真理追寻者"的人数在增加。今天，两组学生在中庭发生了激烈争执，几乎动用魔法对峙。平衡长老艾诺拉及时介入，平息了事态。但她事后告诉我，这只是表面现象，真正的风暴还在酝酿。她暗示我应该开始准备"记录真相"的责任。'
            },
            {
                id: 'gatekeeper_diary_10',
                title: '梅里达斯的野心',
                content: '今晚，我目睹了一个可怕的场景。在东塔顶层，梅里达斯和他的核心追随者进行了一种仪式，试图创建终极火种的定位器。仪式过程中，一名学生的火焰完全熄灭——不是正常的燃尽，而是被某种力量吞噬。梅里达斯对此无动于衷，仅将之视为"必要的牺牲"。我终于理解了艾诺拉的担忧：知识若与道德分离，将引向黑暗。'
            },
            {
                id: 'gatekeeper_diary_11',
                title: '最后的警告',
                content: '院长召集全体师生，发出严厉警告：任何未经授权研究终极火种的行为都将被视为对学院的背叛。梅里达斯公开质疑院长的权威，称其"畏惧真正的进步"。两人的争执使空气几乎凝固。会后，沃尔特向我透露，梅里达斯已经找到了终极火种的确切位置——就在学院地下最深处的密室中。我知道，冲突即将爆发。'
            },
            {
                id: 'gatekeeper_diary_12',
                title: '背叛之夜',
                content: '灾难降临。梅里达斯和他的追随者趁着新月之夜，强行进入了地下密室。院长和艾诺拉试图阻止，但沃尔特犹豫不决，延误了时机。当我赶到时，梅里达斯已经启动了某种装置，一道刺眼的光柱直冲天际。我亲眼目睹艾诺拉试图关闭装置，却被梅里达斯的魔法重创。那一刻，梅里达斯的火焰呈现出非自然的黑色边缘——黑狗的标志。'
            },
            {
                id: 'gatekeeper_diary_13',
                title: '黑暗降临',
                content: '光柱吸引了无数黑狗的仆从涌向学院。防御魔法在压力下崩溃。院长命令我带领低年级学生撤离，而他与剩余的长老和高年级学生留下抵抗。大厅内，我看到沃尔特质问梅里达斯为何背叛，梅里达斯回答："为求知识，我愿与任何力量结盟。"那一刻，沃尔特终于站在了正确的一边，但为时已晚。'
            },
            {
                id: 'gatekeeper_diary_14',
                title: '最后的抵抗',
                content: '我带领学生们通过秘密通道撤离，然后独自返回。学院已成战场。我目睹了院长和梅里达斯的终极对决。院长的火焰纯净而明亮，而梅里达斯的火焰则与黑暗交织。最终，院长以自己的火焰为代价，封印了终极火种，并将梅里达斯困在能量屏障中。但学院的主要结构已经崩塌，到处是熄灭的火柴和散落的灰烬。'
            },
            {
                id: 'gatekeeper_diary_15',
                title: '最后的托付',
                content: '在废墟中，我找到了奄奄一息的院长。他告诉我真相：终极火种并非单纯的能量源，而是火柴神的意识碎片，蕴含着创造与毁灭的力量。他用最后的力量将七个微型火种碎片分离出来，交给我保管，并嘱咐我将它们分散隐藏。"总有一天，会有人重建学院，那时这些火种将指引方向，"他说道，然后化为灰烬。'
            },
            {
                id: 'gatekeeper_diary_16',
                title: '残存者',
                content: '学院陷落后，我找到了幸存的沃尔特和少数学生。艾诺拉已经牺牲，而梅里达斯和终极火种都被院长的法术封印在废墟深处。沃尔特承认自己的犹豫不决导致了悲剧，决定余生致力于寻找并保护散落的学院知识。幸存的学生们也各自散去，带着学院的教诲融入世界各地。而我，则承担起记录和守护真相的责任。'
            },
            {
                id: 'gatekeeper_diary_17',
                title: '希望的火种',
                content: '五十年过去了，我已是垂暮之年。按照院长的指示，我将七个火种碎片隐藏在七个关键地点，并在每处留下了线索。我创建了这套日记，记录真相，希望未来有人能找到它们。学院的毁灭教会了我们，知识必须以智慧为指引，权力必须以善良为根基。黑狗从未真正离去，梅里达斯的封印也在减弱。我相信，当时机成熟，火种将指引有缘人重建真正的魔法学院——不仅仅是知识的殿堂，更是智慧的灯塔。'
            }
        ]
    }
];

// 羊皮纸的颜色名称映射（用于显示）
const PARCHMENT_COLORS = {
    'brown': '棕色',
    'gray': '灰色',
    'red': '红色',
    'blue': '蓝色',
    'gold': '金色',
    'purple': '紫色',
    'green': '绿色',
    'silver': '银色',
    'orange': '橙色',
    'yellow': '黄色',
    'crimson': '深红色',
    'teal': '青色',
    'indigo': '靛蓝色'
};

// 显示魔法学院
function showMagicAcademy() {
    console.log("打开魔法学院，当前资源:", state.stats.energy, state.stats.spirit, state.stats.ash);
    
    // 准备魔法学院的HTML内容
    let magicAcademyContent = `
        <h2>魔法学院废墟</h2>
        <div class="academy-description">
            <p>这里曾是火柴世界最伟大的学府，如今已成废墟。遍地的灰烬中，或许还埋藏着远古的知识与智慧。</p>
            <p>你可以在这里搜寻古老的羊皮纸卷轴，收集散落的知识碎片，重现这个世界被遗忘的历史。</p>
        </div>
        
        <div class="academy-actions">
            <button id="excavate-btn" onclick="excavateParchment()">挖掘线索 (消耗: 体力5, 精力5, 灰烬50)</button>
        </div>
        
        <div class="parchment-collection">
            <h3>已发现的羊皮纸</h3>
            <div class="parchment-categories">
    `;
    
    // 确保discoveredParchments数组已初始化
    if (!state.magicAcademy.discoveredParchments) {
        state.magicAcademy.discoveredParchments = [];
    }
    
    // 生成已发现羊皮纸的分类集合
    if (state.magicAcademy.discoveredParchments && state.magicAcademy.discoveredParchments.length > 0) {
        // 按故事ID分组羊皮纸
        const parchmentsByStory = {};
        
        state.magicAcademy.discoveredParchments.forEach(parchment => {
            const storyId = parchment.split('_')[0] + '_' + parchment.split('_')[1];
            if (!parchmentsByStory[storyId]) {
                parchmentsByStory[storyId] = [];
            }
            parchmentsByStory[storyId].push(parchment);
        });
        
        // 为每个故事创建一个区域
        Object.keys(parchmentsByStory).forEach(storyId => {
            const story = PARCHMENT_STORIES.find(s => s.id === storyId);
            if (story) {
                const totalFragments = story.fragments.length;
                const discoveredFragments = parchmentsByStory[storyId].length;
                
                magicAcademyContent += `
                    <div class="parchment-category">
                        <h4>${story.name} (${discoveredFragments}/${totalFragments})</h4>
                        <div class="parchment-color-indicator" style="background-color: ${story.color}"></div>
                        <p>${story.description}</p>
                        <div class="parchment-list">
                `;
                
                // 添加该故事的所有已发现羊皮纸
                parchmentsByStory[storyId].forEach(parchmentId => {
                    const fragment = story.fragments.find(f => f.id === parchmentId);
                    if (fragment) {
                        magicAcademyContent += `
                            <div class="parchment-item" onclick="viewParchment('${parchmentId}')">
                                <span class="parchment-icon" style="color: ${story.color}">📜</span>
                                <span class="parchment-title">${fragment.title}</span>
                            </div>
                        `;
                    }
                });
                
                magicAcademyContent += `
                        </div>
                    </div>
                `;
            }
        });
    } else {
        magicAcademyContent += `
            <p class="empty-collection">你还没有发现任何羊皮纸。开始挖掘，收集古老的知识吧！</p>
        `;
    }
    
    magicAcademyContent += `
            </div>
        </div>
        
        <div class="dialog-buttons">
            <button onclick="closeDialog()">离开学院</button>
        </div>
    `;
    
    showDialog(magicAcademyContent);
    
    // 检查资源是否足够，如果不够则禁用挖掘按钮
    const excavateBtn = document.getElementById('excavate-btn');
    if (excavateBtn && (state.stats.energy < 5 || state.stats.spirit < 5 || state.stats.ash < 50)) {
        excavateBtn.disabled = true;
        excavateBtn.innerText = "资源不足，无法挖掘";
    }
}

// 挖掘羊皮纸
function excavateParchment() {
    console.log("挖掘开始，当前资源:", state.stats.energy, state.stats.spirit, state.stats.ash);
    
    // 检查资源是否足够
    if (state.stats.energy < 5 || state.stats.spirit < 5 || state.stats.ash < 50) {
        alert("你的资源不足，无法进行挖掘！");
        return;
    }
    
    // 消耗资源
    state.stats.energy -= 5;
    state.stats.spirit -= 5;
    state.stats.ash -= 50;
    
    console.log("资源消耗后:", state.stats.energy, state.stats.spirit, state.stats.ash);
    
    // 记录本次挖掘时间
    state.magicAcademy.lastExcavation = new Date().toISOString();
    
    // 确保discoveredParchments数组已初始化
    if (!state.magicAcademy.discoveredParchments) {
        state.magicAcademy.discoveredParchments = [];
    }
    
    // 随机选择一个故事
    const randomStory = PARCHMENT_STORIES[Math.floor(Math.random() * PARCHMENT_STORIES.length)];
    
    // 从该故事中筛选出尚未发现的片段
    const undiscoveredFragments = randomStory.fragments.filter(
        fragment => !state.magicAcademy.discoveredParchments.includes(fragment.id)
    );
    
    // 如果该故事的所有片段都已发现，则随机选择该故事的一个片段
    let selectedFragment;
    if (undiscoveredFragments.length === 0) {
        selectedFragment = randomStory.fragments[Math.floor(Math.random() * randomStory.fragments.length)];
    } else {
        // 否则随机选择一个未发现的片段
        selectedFragment = undiscoveredFragments[Math.floor(Math.random() * undiscoveredFragments.length)];
        
        // 将新发现的片段添加到已发现列表中
        if (!state.magicAcademy.discoveredParchments.includes(selectedFragment.id)) {
            state.magicAcademy.discoveredParchments.push(selectedFragment.id);
        }
    }
    
    // 保存状态并确保立即更新
    try {
        saveState();
        updateUI();
        console.log("状态已保存，UI已更新");
    } catch (error) {
        console.error("保存状态或更新UI时出错:", error);
    }
    
    // 显示发现的羊皮纸
    viewParchment(selectedFragment.id);
}

// 查看羊皮纸内容
function viewParchment(parchmentId) {
    // 查找该ID的羊皮纸
    let fragment = null;
    let story = null;
    
    for (const s of PARCHMENT_STORIES) {
        const f = s.fragments.find(f => f.id === parchmentId);
        if (f) {
            fragment = f;
            story = s;
            break;
        }
    }
    
    if (!fragment || !story) {
        alert("无法找到该羊皮纸！");
        return;
    }
    
    // 确保将查看的羊皮纸添加到已发现列表中
    if (!state.magicAcademy.discoveredParchments) {
        state.magicAcademy.discoveredParchments = [];
    }
    
    // 如果羊皮纸不在已发现列表中，添加它
    if (!state.magicAcademy.discoveredParchments.includes(parchmentId)) {
        state.magicAcademy.discoveredParchments.push(parchmentId);
        saveState();
        console.log(`新羊皮纸 ${parchmentId} 已添加到收藏中`);
    }
    
    // 显示羊皮纸内容
    const parchmentContent = `
        <div class="parchment-view" style="background-color: ${story.color}40;">
            <div class="parchment-header">
                <div class="parchment-color-indicator" style="background-color: ${story.color}"></div>
                <h3>${story.name}</h3>
                <h4>${fragment.title}</h4>
            </div>
            <div class="parchment-content">
                <p class="ancient-text">${fragment.content}</p>
                <p class="parchment-note">这是一张${PARCHMENT_COLORS[story.color] || ''}羊皮纸，上面记载着古老的知识。收集同样颜色的羊皮纸可以拼凑出完整的故事。</p>
            </div>
        <div class="dialog-buttons">
                <button onclick="showMagicAcademy()">返回学院</button>
        </div>
        </div>
    `;
    
    showDialog(parchmentContent);
}

// 背景图片管理
function showBackgroundSettings() {
    const content = `
        <div class="background-settings">
            <h3>背景图片设置</h3>
            <div class="background-type-select">
                <select id="background-area-select">
                    <option value="panel">角色面板背景</option>
                    <option value="thought">杂念垃圾桶背景</option>
                    <option value="todo">政务大师背景</option>
                    <option value="project">项目经理背景</option>
                    <option value="daily">日常任务背景</option>
                </select>
            </div>
            <div class="background-preview" id="background-preview"></div>
            <div class="opacity-control">
                <label for="background-opacity">背景透明度：</label>
                <input type="range" id="background-opacity" min="15" max="85" value="75" step="5">
                <span id="opacity-value">75%</span>
            </div>
            <div class="background-controls">
                <input type="file" id="background-upload" accept="image/*" style="display: none;">
                <button onclick="document.getElementById('background-upload').click()">上传图片</button>
                <button onclick="removeBackground()">移除背景</button>
            </div>
            <div class="dialog-buttons" style="margin-top: 20px; text-align: center;">
                <button onclick="applyBackgroundSettings()" style="background-color: var(--success);">确定</button>
                <button onclick="closeDialog()">取消</button>
            </div>
        </div>
    `;
    showDialog(content);
    setupBackgroundHandlers();
    
    // 显示当前选中区域的背景和透明度
    const select = document.getElementById('background-area-select');
    const preview = document.getElementById('background-preview');
    const opacitySlider = document.getElementById('background-opacity');
    const area = select.value;
    
    // 获取当前背景和透明度设置
    const settings = getBackgroundSettings(area);
    if (settings.path) {
        preview.style.backgroundImage = `url(${settings.path})`;
    }
    opacitySlider.value = settings.opacity || 75;
    document.getElementById('opacity-value').textContent = opacitySlider.value + '%';
}

// 新增：获取背景设置
function getBackgroundSettings(area) {
    const settings = JSON.parse(localStorage.getItem('backgroundSettings') || '{}');
    return settings[area] || { path: null, opacity: 75 };
}

// 新增：保存背景设置
function saveBackgroundSettings(area, path, opacity) {
    const settings = JSON.parse(localStorage.getItem('backgroundSettings') || '{}');
    settings[area] = { path, opacity };
    localStorage.setItem('backgroundSettings', JSON.stringify(settings));
}

function setupBackgroundHandlers() {
    const upload = document.getElementById('background-upload');
    const preview = document.getElementById('background-preview');
    const select = document.getElementById('background-area-select');
    const opacitySlider = document.getElementById('background-opacity');
    const opacityValue = document.getElementById('opacity-value');

    // 透明度滑块事件
    opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = opacitySlider.value + '%';
        const opacity = opacitySlider.value / 100;
        preview.style.setProperty('--preview-opacity', opacity);
    });

    // 区域选择变化事件
    select.addEventListener('change', () => {
        const area = select.value;
        const settings = tempBackgrounds[area] || getBackgroundSettings(area);
        if (settings.path) {
            preview.style.backgroundImage = `url(${settings.path})`;
            opacitySlider.value = settings.opacity || 75;
        } else {
            preview.style.backgroundImage = 'none';
            opacitySlider.value = 75;
        }
        opacityValue.textContent = opacitySlider.value + '%';
        preview.style.setProperty('--preview-opacity', opacitySlider.value / 100);
    });

    // 文件上传事件
    upload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imageData = e.target.result;
                const area = select.value;
                
                // 保存图片到服务器
                const response = await fetch('/save-background', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        area,
                        imageData
                    })
                });

                if (!response.ok) {
                    throw new Error('上传失败');
                }

                const result = await response.json();
                
                // 保存到临时存储
                tempBackgrounds[area] = {
                    path: result.path,
                    opacity: parseInt(opacitySlider.value)
                };

                // 更新预览
                preview.style.backgroundImage = `url(${result.path})`;
                preview.style.setProperty('--preview-opacity', opacitySlider.value / 100);
            } catch (error) {
                console.error('上传背景图片失败:', error);
                alert('上传背景图片失败，请重试');
            }
        };
        reader.readAsDataURL(file);
    });
}

// 修改：应用背景设置
function applyBackgroundSettings() {
    const area = document.getElementById('background-area-select').value;
    const opacity = parseInt(document.getElementById('background-opacity').value);
    
    // 获取当前背景路径
    const settings = tempBackgrounds[area] || getBackgroundSettings(area);
    const path = settings.path;
    
    // 保存设置
    saveBackgroundSettings(area, path, opacity);
    
    // 清除临时存储
    delete tempBackgrounds[area];
    
    // 立即更新UI
    updateBackgrounds();
    
    // 关闭对话框
    closeDialog();
}

function updateBackgrounds() {
    const settings = JSON.parse(localStorage.getItem('backgroundSettings') || '{}');
    
    // 更新角色面板背景
    const characterStats = document.querySelector('.character-stats');
    if (characterStats) {
        const panelSettings = settings.panel || {};
        if (panelSettings.path) {
            characterStats.style.setProperty('--panel-bg-image', `url("${panelSettings.path}")`);
            characterStats.style.setProperty('--panel-opacity', panelSettings.opacity / 100);
        } else {
            characterStats.style.setProperty('--panel-bg-image', 'none');
            characterStats.style.setProperty('--panel-opacity', '0.85');
        }
    }
    
    // 更新任务块背景
    const blocks = {
        thought: document.getElementById('thought-bin'),
        todo: document.getElementById('todo-master'),
        project: document.getElementById('project-manager'),
        daily: document.getElementById('daily-routine')
    };
    
    Object.entries(blocks).forEach(([area, element]) => {
        if (element) {
            const blockSettings = settings[area] || {};
            if (blockSettings.path) {
                element.style.setProperty('--block-bg-image', `url("${blockSettings.path}")`);
                element.style.setProperty('--block-opacity', blockSettings.opacity / 100);
            } else {
                element.style.setProperty('--block-bg-image', 'none');
                element.style.setProperty('--block-opacity', '0.75');
            }
        }
    });
}

// 修改：移除背景
function removeBackground() {
    const select = document.getElementById('background-area-select');
    const preview = document.getElementById('background-preview');
    const area = select.value;
    
    // 从临时存储中移除
    delete tempBackgrounds[area];
    // 从正式存储中移除
    saveBackgroundSettings(area, null, 75);
    preview.style.backgroundImage = 'none';
}

// 完成项目节点
// [Refactored] Now uses TaskManager for core logic
// [Refactored] Now uses TaskManager.getProjectById() and completeMilestone()
function completeMilestone(projectId) {
    // 获取当前项目（用于预检查）
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 计算实际工作时长
    const workTimeInSeconds = timerState.seconds || (project.dailyTime * 60 * 60);
    
    // Use TaskManager for core business logic
    const tm = getTaskManager();
    let result;
    
    if (tm) {
        result = tm.completeMilestone(projectId, workTimeInSeconds);
        if (!result) return;
    } else {
        // Fallback (simplified)
        const milestone = project.milestones[project.currentMilestone];
        if (!milestone) return;
        
        const workTimeInHours = workTimeInSeconds / 3600;
        const energyCost = Math.round((workTimeInHours / 8) * 100);
        const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
        
        milestone.completed = true;
        milestone.completedAt = new Date().toISOString();
        project.currentMilestone++;
        
        const isProjectComplete = project.currentMilestone >= project.milestones.length;
        const sawdustReward = isProjectComplete ? 200 : 60;
        const baseFlameReward = isProjectComplete ? 100 : 40;
        
        result = { project, milestone, energyCost, spiritCost, sawdustReward, baseFlameReward, isProjectComplete };
    }
    
    const { milestone, energyCost, spiritCost, sawdustReward, baseFlameReward, isProjectComplete } = result;
    
    // 检查是否有足够的体力和精力
    if (state.stats.energy < energyCost || (spiritCost > 0 && state.stats.spirit < spiritCost)) {
        alert('体力或精力不足，无法完成节点！');
        return;
    }
    
    // 更新体力和精力
    state.stats.energy = Math.max(0, state.stats.energy - energyCost);
    state.stats.spirit = Math.max(0, Math.min(100, state.stats.spirit - spiritCost));
    
    // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
    const flameReward = calculateFlameReward(baseFlameReward);
    
    state.stats.flame += flameReward;
    state.stats.sawdust += sawdustReward;
    
    // 添加日志
    if (isProjectComplete) {
        state.logs.push(`[第${state.stats.totalDays}天] 完成项目：${project.name}，获得火苗：${flameReward}，获得木屑：${sawdustReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);
    } else {
        state.logs.push(`[第${state.stats.totalDays}天] 完成项目节点：${project.name} - ${milestone.name}，获得火苗：${flameReward}，获得木屑：${sawdustReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);
    }
    
    saveState();
    updateUI();
    closeDialog(); // 先关闭当前对话框
    
    // 显示UI对话框
    if (isProjectComplete) {
        showDialog(`
            <h2>恭喜！项目完成！</h2>
            <p>你已经完成了"${project.name}"的所有节点！</p>
            <div class="reward-summary">
                <p>获得火苗：${flameReward}${state.shop.activeEffects.mirror ? ' (镜子效果翻倍)' : ''}</p>
                <p>获得木屑：${sawdustReward}</p>
                <p>消耗体力：${energyCost}</p>
                ${spiritCost < 0 ? `<p>恢复精力：${-spiritCost}</p>` : `<p>消耗精力：${spiritCost}</p>`}
            </div>
            <div class="dialog-buttons">
                <button onclick="showProjectManager()">返回项目列表</button>
            </div>
        `);
    } else {
        showDialog(`
            <h2>节点完成！</h2>
            <p>你完成了"${milestone.name}"！</p>
            <div class="reward-summary">
                <p>获得火苗：${flameReward}${state.shop.activeEffects.mirror ? ' (镜子效果翻倍)' : ''}</p>
                <p>获得木屑：${sawdustReward}</p>
                <p>消耗体力：${energyCost}</p>
                ${spiritCost < 0 ? `<p>恢复精力：${-spiritCost}</p>` : `<p>消耗精力：${spiritCost}</p>`}
            </div>
            <div class="dialog-buttons">
                <button onclick="showProjectManager()">返回项目列表</button>
            </div>
        `);
    }
}

// 添加项目相关的CSS样式
style.textContent += `
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }

    .project-card {
        background-color: var(--secondary-bg);
        border-radius: 15px;
        padding: 20px;
        transition: transform 0.2s;
        position: relative;
        overflow: hidden;
    }

    .project-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .project-card[data-importance="high"][data-interest="high"] {
        border-left: 4px solid var(--success);  /* 重要且感兴趣 */
    }

    .project-card[data-importance="high"][data-interest="medium"] {
        border-left: 4px solid var(--warning);  /* 重要但一般兴趣 */
    }

    .project-card[data-importance="high"][data-interest="low"] {
        border-left: 4px solid var(--error);  /* 重要但不感兴趣 */
    }

    .project-card[data-importance="medium"][data-interest="high"] {
        border-left: 4px solid var(--accent-1);  /* 一般重要但感兴趣 */
    }

    .project-card[data-importance="medium"][data-interest="medium"] {
        border-left: 4px solid var(--accent-2);  /* 一般重要且一般兴趣 */
    }

    .project-card[data-importance="low"] {
        border-left: 4px solid var(--accent-3);  /* 不重要 */
    }

    .progress-bar {
        width: 100%;
        height: 10px;
        background-color: var(--accent-1);
        border-radius: 5px;
        margin: 10px 0;
        overflow: hidden;
    }

    .progress {
        height: 100%;
        background-color: var(--success);
        transition: width 0.3s ease;
    }

    .project-card h3 {
        margin-bottom: 10px;
        color: var(--text-primary);
        font-size: 18px;
    }

    .project-card p {
        margin: 5px 0;
        color: var(--text-secondary);
        font-size: 14px;
    }

    .project-card button {
        margin-top: 15px;
        width: 100%;
        background-color: var(--accent-2);
    }

    .project-card button:hover {
        background-color: var(--accent-3);
    }
`;

// 显示设置对话框
function showSettings() {
    const resourceSettings = `
        <div class="setting-section">
            <h3>当前资源</h3>
            <div class="setting-item">
                <label for="current-energy">当前体力：</label>
                <input type="number" id="current-energy" min="0" max="100" value="${state.stats.energy}">
            </div>
            <div class="setting-item">
                <label for="current-spirit">当前精力：</label>
                <input type="number" id="current-spirit" min="0" max="100" value="${state.stats.spirit}">
            </div>
            <div class="setting-item">
                <label for="current-flame">当前火苗：</label>
                <input type="number" id="current-flame" min="0" value="${state.stats.flame}">
            </div>
            <div class="setting-item">
                <label for="current-sawdust">当前木屑：</label>
                <input type="number" id="current-sawdust" min="0" value="${state.stats.sawdust}">
            </div>
            <div class="setting-item">
                <label for="current-ash">当前灰烬：</label>
                <input type="number" id="current-ash" min="0" value="${state.stats.ash || 0}">
            </div>
        </div>
    `;
    
    const rewardSettings = `
        <div class="setting-section">
            <h3>奖励规则设置</h3>
            <h4>火苗获取规则</h4>
            <div class="setting-item">
                <label>日常任务：</label>
                <input type="number" id="daily-flame-base" placeholder="基础倍率" step="0.1" min="0">
                <input type="number" id="daily-flame-time" placeholder="时长系数" step="0.1" min="0">
            </div>
            <div class="setting-item">
                <label>待办事项：</label>
                <input type="number" id="todo-flame-base" placeholder="基础倍率" step="0.1" min="0">
                <input type="number" id="todo-flame-time" placeholder="时长系数" step="0.1" min="0">
            </div>
            <div class="setting-item">
                <label>项目任务：</label>
                <input type="number" id="project-flame-base" placeholder="基础倍率" step="0.1" min="0">
                <input type="number" id="project-flame-time" placeholder="时长系数" step="0.1" min="0">
                <input type="number" id="project-milestone-bonus" placeholder="里程碑奖励" step="0.1" min="0">
            </div>
        </div>
    `;
    
    const costSettings = `
        <div class="setting-section">
            <h3>消耗规则设置</h3>
            <h4>体力消耗规则</h4>
            <div class="setting-item">
                <label for="energy-base-rate">基础消耗率：</label>
                <input type="number" id="energy-base-rate" step="0.1" min="0">
            </div>
            <div class="setting-item">
                <label for="energy-time-multiplier">时长影响系数：</label>
                <input type="number" id="energy-time-multiplier" step="0.1" min="0">
            </div>
            
            <h4>精力消耗规则</h4>
            <div class="setting-item">
                <label for="spirit-base-rate">基础消耗率：</label>
                <input type="number" id="spirit-base-rate" step="0.1" min="0">
            </div>
            <div class="setting-item">
                <label for="spirit-time-multiplier">时长影响系数：</label>
                <input type="number" id="spirit-time-multiplier" step="0.1" min="0">
            </div>
            <div class="setting-item">
                <label for="spirit-interest-factor">兴趣影响系数：</label>
                <input type="number" id="spirit-interest-factor" step="0.1" min="0">
            </div>
        </div>
    `;
    
    const interfaceSettings = `
        <div class="setting-section">
            <h3>界面设置</h3>
            <div class="setting-item">
                <button onclick="showBackgroundSettings()" class="full-width-btn">背景图片设置</button>
            </div>
        </div>
        
        <div class="setting-section">
            <h3>夜晚过渡页面</h3>
            <div class="setting-item">
                <button onclick="setNightVideo()">设置背景视频</button>
            </div>
        </div>
    `;
    
    const deepseekSettings = `
        <div class="setting-section">
            <h3>AI设置</h3>
            <div class="setting-description">
                启用Deepseek API可以让火柴神根据你的状态生成更加个性化的消息。
            </div>
            <div class="setting-item">
                <label for="use-deepseek-api">启用Deepseek API：</label>
                <input type="checkbox" id="use-deepseek-api" ${DEEPSEEK_CONFIG.useApi ? 'checked' : ''}>
            </div>
            <div class="setting-item">
                <label for="deepseek-api-key">API密钥：</label>
                <input type="password" id="deepseek-api-key" value="${DEEPSEEK_CONFIG.apiKey || ''}" placeholder="输入您的Deepseek API密钥">
            </div>
            <div class="setting-item">
                <button onclick="testDeepseekConnection()">测试API连接</button>
            </div>
        </div>
    `;
    
    // 组合所有设置
    const content = `
        <h2>系统设置</h2>
        <div class="settings-container">
            ${resourceSettings}
            ${rewardSettings}
            ${costSettings}
            ${interfaceSettings}
            ${deepseekSettings}
        </div>
        <div class="dialog-buttons">
            <button onclick="saveSettings()">保存设置</button>
            <button onclick="closeDialog()">取消</button>
        </div>
    `;
    
    showDialog(content);
    loadCurrentSettings();
}

// 加载当前设置
function loadCurrentSettings() {
    // 如果settings中没有rewards和costs配置，则初始化默认值
    if (!state.settings.rewards) {
        state.settings.rewards = {
            flame: {
                dailyTask: { baseRate: 1, timeMultiplier: 0.5 },
                todo: { baseRate: 1, timeMultiplier: 0.5 },
                project: { baseRate: 1, timeMultiplier: 0.5, milestoneBonus: 2 }
            },
            sawdust: {
                dailyTask: { baseRate: 1, timeMultiplier: 0.5 },
                todo: { baseRate: 1, timeMultiplier: 0.5 },
                project: { baseRate: 1, timeMultiplier: 0.5, milestoneBonus: 2 }
            }
        };
    }
    
    if (!state.settings.costs) {
        state.settings.costs = {
            energy: { baseRate: 1, timeMultiplier: 0.5 },
            spirit: { baseRate: 1, timeMultiplier: 0.5, interestFactor: 0.2 }
        };
    }
    
    // 如果settings中没有deepseek配置，则初始化默认值
    if (!state.settings.deepseek) {
        state.settings.deepseek = {
            useApi: DEEPSEEK_CONFIG.useApi,
            apiKey: DEEPSEEK_CONFIG.apiKey
        };
    } else {
        // 从state中加载deepseek配置到全局配置
        DEEPSEEK_CONFIG.useApi = state.settings.deepseek.useApi;
        DEEPSEEK_CONFIG.apiKey = state.settings.deepseek.apiKey;
    }
    
    // 设置输入框的值
    const settings = state.settings;
    
    // 火苗规则
    document.getElementById('daily-flame-base').value = settings.rewards.flame.dailyTask.baseRate;
    document.getElementById('daily-flame-time').value = settings.rewards.flame.dailyTask.timeMultiplier;
    document.getElementById('todo-flame-base').value = settings.rewards.flame.todo.baseRate;
    document.getElementById('todo-flame-time').value = settings.rewards.flame.todo.timeMultiplier;
    document.getElementById('project-flame-base').value = settings.rewards.flame.project.baseRate;
    document.getElementById('project-flame-time').value = settings.rewards.flame.project.timeMultiplier;
    document.getElementById('project-milestone-bonus').value = settings.rewards.flame.project.milestoneBonus;
    
    // 消耗规则
    document.getElementById('energy-base-rate').value = settings.costs.energy.baseRate;
    document.getElementById('energy-time-multiplier').value = settings.costs.energy.timeMultiplier;
    document.getElementById('spirit-base-rate').value = settings.costs.spirit.baseRate;
    document.getElementById('spirit-time-multiplier').value = settings.costs.spirit.timeMultiplier;
    document.getElementById('spirit-interest-factor').value = settings.costs.spirit.interestFactor;
    
    // Deepseek API设置
    document.getElementById('use-deepseek-api').checked = DEEPSEEK_CONFIG.useApi;
    document.getElementById('deepseek-api-key').value = DEEPSEEK_CONFIG.apiKey;
}

// 保存设置
function saveSettings() {
    // 保存当前资源
    state.stats.energy = parseInt(document.getElementById('current-energy').value) || 0;
    state.stats.spirit = parseInt(document.getElementById('current-spirit').value) || 0;
    state.stats.flame = parseInt(document.getElementById('current-flame').value) || 0;
    state.stats.sawdust = parseInt(document.getElementById('current-sawdust').value) || 0;
    state.stats.ash = parseInt(document.getElementById('current-ash').value) || 0;
    
    // 保存奖励规则
    state.settings.rewards.flame.dailyTask.baseRate = parseFloat(document.getElementById('daily-flame-base').value) || 1;
    state.settings.rewards.flame.dailyTask.timeMultiplier = parseFloat(document.getElementById('daily-flame-time').value) || 0.5;
    state.settings.rewards.flame.todo.baseRate = parseFloat(document.getElementById('todo-flame-base').value) || 1;
    state.settings.rewards.flame.todo.timeMultiplier = parseFloat(document.getElementById('todo-flame-time').value) || 0.5;
    state.settings.rewards.flame.project.baseRate = parseFloat(document.getElementById('project-flame-base').value) || 1;
    state.settings.rewards.flame.project.timeMultiplier = parseFloat(document.getElementById('project-flame-time').value) || 0.5;
    state.settings.rewards.flame.project.milestoneBonus = parseFloat(document.getElementById('project-milestone-bonus').value) || 2;
    
    // 保存消耗规则
    state.settings.costs.energy.baseRate = parseFloat(document.getElementById('energy-base-rate').value) || 1;
    state.settings.costs.energy.timeMultiplier = parseFloat(document.getElementById('energy-time-multiplier').value) || 0.5;
    state.settings.costs.spirit.baseRate = parseFloat(document.getElementById('spirit-base-rate').value) || 1;
    state.settings.costs.spirit.timeMultiplier = parseFloat(document.getElementById('spirit-time-multiplier').value) || 0.5;
    state.settings.costs.spirit.interestFactor = parseFloat(document.getElementById('spirit-interest-factor').value) || 0.2;
    
    // 保存Deepseek API设置
    if (!state.settings.deepseek) {
        state.settings.deepseek = {};
    }
    state.settings.deepseek.useApi = document.getElementById('use-deepseek-api').checked;
    state.settings.deepseek.apiKey = document.getElementById('deepseek-api-key').value;
    
    // 更新全局配置
    DEEPSEEK_CONFIG.useApi = state.settings.deepseek.useApi;
    DEEPSEEK_CONFIG.apiKey = state.settings.deepseek.apiKey;
    
    // 保存状态
    saveState();
    
    // 更新UI
    updateUI();
    
    // 关闭对话框
    closeDialog();
    
    // 显示保存成功提示
    showDialog(`
        <h2>设置已保存</h2>
        <p>所有更改已成功保存。</p>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">确定</button>
        </div>
    `);
}

// 显示草稿纸
function showDraftPaper() {
    // 如果state中没有drafts数组，则初始化
    if (!state.drafts) {
        state.drafts = [];
    }

    // 生成历史草稿列表HTML
    const draftsHtml = state.drafts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(draft => `
            <div class="task-list-item" onclick="showDraftContent('${draft.id}')">
                <div class="draft-time">${new Date(draft.timestamp).toLocaleString()}</div>
                <div class="draft-title">${draft.title}</div>
            </div>
        `)
        .join('') || '<div class="empty-message">暂无草稿</div>';

    // 显示对话框
    showDialog(`
        <div class="dialog-main">
            <h2>草稿纸</h2>
            <div class="draft-input">
                <div class="form-group">
                    <label for="draft-title">标题：</label>
                    <input type="text" id="draft-title" placeholder="请输入标题">
                </div>
                <div class="form-group">
                    <label for="draft-content">内容：</label>
                    <textarea id="draft-content" placeholder="请输入内容" rows="10"></textarea>
                </div>
                <div class="dialog-buttons">
                    <button onclick="saveDraft()">保存草稿</button>
                </div>
            </div>
        </div>
        <div class="dialog-sidebar">
            <h3>历史草稿</h3>
            <div class="draft-list">
                ${draftsHtml}
            </div>
        </div>
    `);
}

// 保存草稿
function saveDraft() {
    const title = document.getElementById('draft-title').value.trim();
    const content = document.getElementById('draft-content').value.trim();
    
    if (!title || !content) {
        alert('请输入标题和内容');
        return;
    }
    
    const draft = {
        id: Date.now().toString(),
        title,
        content,
        timestamp: new Date().toISOString()
    };
    
    state.drafts = state.drafts || [];
    state.drafts.push(draft);
    saveState();
    
    showDraftPaper();  // 刷新显示
}

// 显示草稿内容
function showDraftContent(draftId) {
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;
    
    showDialog(`
        <h2>${draft.title}</h2>
        <div class="draft-time">${new Date(draft.timestamp).toLocaleString()}</div>
        <div class="draft-content">${draft.content.replace(/\n/g, '<br>')}</div>
        <div class="dialog-buttons">
            <button onclick="deleteDraft('${draftId}')">删除</button>
            <button onclick="showDraftPaper()">返回</button>
        </div>
    `);
}

// 删除草稿
function deleteDraft(draftId) {
    if (!confirm('确定要删除这条草稿吗？')) return;
    
    state.drafts = state.drafts.filter(d => d.id !== draftId);
    saveState();
    showDraftPaper();
}

// 添加日志的辅助函数
function addToLog(content) {
    if (!state.logs) state.logs = [];
    state.logs.push(`[第${state.stats.totalDays}天] ${content}`);
}

// 删除日常任务
function deleteDailyTask(taskId) {
    showDialog(`
        <h2>确认删除</h2>
        <p>确定要删除这个日常任务吗？此操作不可撤销。</p>
        <div class="dialog-buttons">
            <button onclick="confirmDeleteDailyTask(${taskId})" class="danger">确定删除</button>
            <button onclick="showDailyRoutine()">取消</button>
        </div>
    `);
}

// 确认删除日常任务
// [Refactored] Now uses TaskManager
function confirmDeleteDailyTask(taskId) {
    const tm = getTaskManager();
    if (tm) {
        tm.deleteDailyTask(taskId);
    } else {
        // Fallback to old method if TaskManager not available
        state.dailyTasks = state.dailyTasks.filter(task => task.id !== taskId);
    }
    saveState();
    showDailyRoutine();
}

// 编辑日常任务
// [Refactored] Now uses TaskManager.getDailyTaskById()
function editDailyTask(taskId) {
    const tm = getTaskManager();
    const task = tm ? tm.getDailyTaskById(taskId) : state.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    showDialog(`
        <h2>编辑日常任务</h2>
        <div class="form-group">
            <label for="edit-task-name">任务名称：</label>
            <input type="text" id="edit-task-name" value="${task.name}">
        </div>
        <div class="form-group">
            <label for="edit-task-duration">每天计划时长（分钟）：</label>
            <input type="number" id="edit-task-duration" min="5" step="5" value="${task.duration}">
        </div>
        <div class="form-group">
            <label for="edit-task-importance">重要性：</label>
            <select id="edit-task-importance">
                <option value="high" ${task.importance === 'high' ? 'selected' : ''}>非常重要</option>
                <option value="medium" ${task.importance === 'medium' ? 'selected' : ''}>一般重要</option>
                <option value="low" ${task.importance === 'low' ? 'selected' : ''}>不重要</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-task-interest">兴趣程度：</label>
            <select id="edit-task-interest">
                <option value="high" ${task.interest === 'high' ? 'selected' : ''}>很感兴趣</option>
                <option value="medium" ${task.interest === 'medium' ? 'selected' : ''}>一般</option>
                <option value="low" ${task.interest === 'low' ? 'selected' : ''}>不感兴趣</option>
            </select>
        </div>
        <div class="dialog-buttons">
            <button onclick="saveEditedDailyTask(${taskId})">保存修改</button>
            <button onclick="showDailyRoutine()">取消</button>
        </div>
    `);
}

// 保存编辑后的日常任务
// [Refactored] Now uses TaskManager
function saveEditedDailyTask(taskId) {
    const name = document.getElementById('edit-task-name').value.trim();
    const duration = parseInt(document.getElementById('edit-task-duration').value);
    const importance = document.getElementById('edit-task-importance').value;
    const interest = document.getElementById('edit-task-interest').value;

    if (!name) {
        alert('请输入任务名称');
        return;
    }

    if (isNaN(duration) || duration < 5) {
        alert('请输入有效的时长（至少5分钟）');
        return;
    }

    // Use TaskManager
    const tm = getTaskManager();
    if (tm) {
        tm.updateDailyTask(taskId, {
            name,
            dailyTime: duration,
            importance: parseInt(importance),
            interest: parseInt(interest)
        });
    } else {
        // Fallback
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (task) {
            task.name = name;
            task.duration = duration;
            task.importance = importance;
            task.interest = interest;
        }
    }

    saveState();
    showDailyRoutine();
}

// 加载鼓励语
async function loadEncouragements() {
    try {
        const response = await fetch('./data/encouragements.json');
        const data = await response.json();
        state.nightTransition.encouragements = data.encouragements;
    } catch (error) {
        console.error('加载鼓励语失败:', error);
        state.nightTransition.encouragements = ['今天辛苦了，好好休息吧 ✨'];
    }
}

// 显示夜晚过渡页面
function showNightTransition() {
    console.log('显示夜晚过渡页面');
    const nightTransition = document.getElementById('night-transition');
    const video = document.getElementById('night-bg-video');
    const encouragementMessage = document.querySelector('.encouragement-message');
    
    // 确保nightTransition存在
    if (!nightTransition) {
        console.error('找不到night-transition元素');
        return;
    }
    
    // 确保state.nightTransition对象存在
    if (!state.nightTransition) {
        state.nightTransition = {
            videoPath: null,
            encouragements: ['今天辛苦了，好好休息吧 ✨']
        };
    }
    
    // 随机选择一条鼓励语
    if (state.nightTransition.encouragements && state.nightTransition.encouragements.length > 0) {
        const randomIndex = Math.floor(Math.random() * state.nightTransition.encouragements.length);
        encouragementMessage.textContent = state.nightTransition.encouragements[randomIndex];
    } else {
        encouragementMessage.textContent = '今天辛苦了，好好休息吧 ✨';
    }
    
    // 重置视频状态
    if (video) {
        video.classList.remove('loaded');
        video.pause();
        video.currentTime = 0;
        
        // 清除之前的事件监听器
        video.onloadeddata = null;
        video.onerror = null;
    }
    
    // 确保夜晚过渡页面在其他元素之上
    nightTransition.style.zIndex = '2000';
    
    // 先移除hidden类显示整个容器
    nightTransition.classList.remove('hidden');
    
    // 如果有设置视频路径，则准备视频
    if (state.nightTransition && state.nightTransition.videoPath && video) {
        console.log('设置视频路径:', state.nightTransition.videoPath);
        
        try {
            video.src = state.nightTransition.videoPath;
            video.muted = false;  // 允许播放声音
            
            // 等待视频加载完成后再显示
            video.onloadeddata = () => {
                console.log('视频加载完成');
                video.play()
                    .then(() => {
                        console.log('视频开始播放');
                        // 短暂延迟后添加loaded类来触发视频淡入
                        setTimeout(() => {
                            video.classList.add('loaded');
                        }, 100);
                    })
                    .catch(error => {
                        console.error('视频播放失败:', error);
                        // 即使视频播放失败，也要确保过渡页面显示
                    });
            };
            
            // 添加错误处理
            video.onerror = (e) => {
                console.error('视频加载错误:', e);
                // 即使视频加载失败，也要确保过渡页面显示
            };
        } catch (error) {
            console.error('设置视频源时出错:', error);
        }
        
        // 设置超时，防止视频加载过久
        setTimeout(() => {
            if (!video.classList.contains('loaded')) {
                console.log('视频加载超时，强制显示过渡页面');
                video.classList.add('loaded');
            }
        }, 3000);
    } else {
        console.log('没有设置视频路径或视频元素不存在，直接显示过渡页面');
        // 如果没有视频，直接显示过渡页面
    }
    
    // 强制重绘以确保CSS过渡效果生效
    nightTransition.offsetHeight;
}

// 设置夜晚背景视频
function setNightVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const url = URL.createObjectURL(file);
                console.log('创建视频URL:', url);
                
                // 清理旧的blob URL以避免错误
                if (state.nightTransition && state.nightTransition.videoPath && state.nightTransition.videoPath.startsWith('blob:')) {
                    try {
                        URL.revokeObjectURL(state.nightTransition.videoPath);
                    } catch (e) {
                        console.log('清理旧blob URL');
                    }
                }
                
                // 确保nightTransition对象存在
                if (!state.nightTransition) {
                    state.nightTransition = {
                        videoPath: url,
                        encouragements: ['今天辛苦了，好好休息吧 ✨']
                    };
                } else {
                    state.nightTransition.videoPath = url;
                }
                
                // 保存视频路径到localStorage
                localStorage.setItem('nightVideoPath', url);
                
                // 预加载视频
                const video = document.getElementById('night-bg-video');
                if (video) {
                    console.log('预加载新设置的夜晚视频');
                    video.src = url;
                    video.load();
                }
                
                // 保存状态
                saveState();
                
                // 显示成功消息
                showDialog(`
                    <h2>设置成功</h2>
                    <p>夜晚背景视频已成功设置。</p>
                    <div class="dialog-buttons">
                        <button onclick="closeDialog()">确定</button>
                    </div>
                `);
            } catch (error) {
                console.error('设置夜晚视频时出错:', error);
                showDialog(`
                    <h2>设置失败</h2>
                    <p>设置夜晚背景视频时出错: ${error.message}</p>
                    <div class="dialog-buttons">
                        <button onclick="closeDialog()">确定</button>
                    </div>
                `);
            }
        }
    };
    input.click();
}

// 开始新的一天
function startNewDay() {
    console.log('开始新的一天');
    const nightTransition = document.getElementById('night-transition');
    const video = document.getElementById('night-bg-video');
    
    // 停止视频播放
    if (video) {
        try {
            video.pause();
            video.classList.remove('loaded');
            video.currentTime = 0;
        } catch (error) {
            console.error('停止视频播放时出错:', error);
        }
    }
    
    // 添加hidden类隐藏过渡页面
    if (nightTransition) {
        nightTransition.classList.add('hidden');
        
        // 确保隐藏后不会阻挡其他元素
        setTimeout(() => {
            nightTransition.style.zIndex = '-1';
        }, 500); // 等待过渡动画完成
    } else {
        console.error('找不到night-transition元素');
    }
    
    // 显示主屏幕
    showMainScreen();
}

// 继续休息
function continueRest() {
    console.log('继续休息');
    // 不做任何操作，保持在过渡页面
    // 可以添加一些提示或效果
    const encouragementMessage = document.querySelector('.encouragement-message');
    if (encouragementMessage) {
        // 随机选择一条新的鼓励语
        if (state.nightTransition && state.nightTransition.encouragements && state.nightTransition.encouragements.length > 0) {
            const randomIndex = Math.floor(Math.random() * state.nightTransition.encouragements.length);
            const originalText = encouragementMessage.textContent;
            let newText = state.nightTransition.encouragements[randomIndex];
            
            // 确保不会显示相同的鼓励语
            if (newText === originalText && state.nightTransition.encouragements.length > 1) {
                const newIndex = (randomIndex + 1) % state.nightTransition.encouragements.length;
                newText = state.nightTransition.encouragements[newIndex];
            }
            
            encouragementMessage.textContent = newText;
        }
    }
}

// 更新火柴神显示
function updateGodDisplay() {
    if (!state.character || !state.character.type) return;
    
    const godImageElement = document.getElementById('god-image');
    const godNameElement = document.getElementById('god-name');
    
    // 清空现有内容
    godImageElement.innerHTML = '';
    
    // 获取火柴神信息
    const godType = GOD_TYPES.find(type => type.id === state.character.type);
    if (!godType) return;
    
    // 创建并添加图片
    const img = document.createElement('img');
    img.src = godType.imagePath;
    img.alt = godType.name;
    img.title = godType.description;
    godImageElement.appendChild(img);
    
    // 设置神名
    godNameElement.textContent = godType.name;
    
    // 添加点击事件，显示神明详情
    godImageElement.onclick = async function() {
        // 显示加载中的对话框
        showDialog(`
            <h2>${godType.name}</h2>
            <div class="god-details">
                <img src="${godType.imagePath}" alt="${godType.name}" style="width: 150px; height: 150px; border-radius: 50%; margin-bottom: 15px;">
                <p>${godType.description}</p>
                <p>作为${godType.name}的信徒，你将获得特殊的守护。</p>
                <div class="god-message">
                    <p class="message-content">思考中...</p>
                </div>
            </div>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        `);
        
        // 异步获取神明的消息
        const godMessage = await getGodMessage(godType);
        
        // 更新对话框内容
        showDialog(`
            <h2>${godType.name}</h2>
            <div class="god-details">
                <img src="${godType.imagePath}" alt="${godType.name}" style="width: 150px; height: 150px; border-radius: 50%; margin-bottom: 15px;">
                <p>${godType.description}</p>
                <p>作为${godType.name}的信徒，你将获得特殊的守护。</p>
                <div class="god-message">
                    <p class="message-content">"${godMessage}"</p>
                </div>
            </div>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        `);
        
        // 记录神明的消息到日志
        addToLog(`${godType.name}对你说: ${godMessage}`);
    };
}

// 获取神明的消息
async function getGodMessage(godType) {
    // 添加调试信息
    console.log('getGodMessage被调用，godType:', godType);
    console.log('当前DEEPSEEK_CONFIG状态:', {
        useApi: DEEPSEEK_CONFIG.useApi,
        apiKeyExists: !!DEEPSEEK_CONFIG.apiKey,
        apiKeyLength: DEEPSEEK_CONFIG.apiKey ? DEEPSEEK_CONFIG.apiKey.length : 0
    });
    console.log('当前state.settings.deepseek状态:', state.settings.deepseek);
    
    // 如果启用了API并且有API密钥，尝试使用deepseek API
    if (DEEPSEEK_CONFIG.useApi && DEEPSEEK_CONFIG.apiKey) {
        // 准备用户上下文
        const userContext = {
            energy: state.stats.energy,
            spirit: state.stats.spirit,
            totalDays: state.stats.totalDays,
            dailyTasks: state.dailyTasks,
            todos: state.todos,
            projects: state.projects,
            recentLogs: state.logs ? state.logs.slice(-5) : [] // 获取最近5条日志
        };
        
        // 调用API获取消息
        const apiMessage = await getDeepseekMessage(godType, userContext);
        if (apiMessage) {
            return apiMessage;
        }
        // 如果API调用失败，回退到本地消息
        console.log('Deepseek API调用失败，使用本地消息');
    }
    
    // 使用本地消息（当API未启用或API调用失败时）
    // 根据神明类型选择不同的消息模板
    let messages = [];
    
    // 通用消息
    const commonMessages = [
        "今天也要努力燃烧自己，照亮他人啊！",
        "记住，休息也是提高效率的一部分。",
        "你的每一步努力，都在积累未来的光芒。",
        "困难只是暂时的，坚持下去就会看到希望。",
        "不要忘记照顾好自己，才能更好地完成任务。",
        "有时候放慢脚步，反而能看到更多风景。",
        "今天的付出，会成为明天的收获。",
        "别忘了，偶尔也要给自己一些奖励。",
        "每一个任务都是一次成长的机会。",
        "保持专注，但也要记得抬头看看远方。"
    ];
    
    // 根据神明类型添加特定消息
    switch(godType.id) {
        case 'wise':
            messages = [
                "智慧不在于知道多少，而在于知道如何运用。",
                "最困难的时刻，往往是转机即将到来的信号。",
                "学会在忙碌中寻找平静，在平静中积蓄力量。",
                "有时候，放下执念反而能获得更多。",
                "真正的智慧是知道自己不知道什么。",
                "看问题时，换个角度可能会有意想不到的发现。",
                "今天的你比昨天的自己更有智慧了吗？",
                "不要急于求成，最好的果实需要时间慢慢成熟。",
                "困惑时，不妨停下来，重新思考问题的本质。",
                "知识给你力量，但智慧给你方向。",
                
                // 新增智慧启发类
                "黑狗可能咬你一口，但智慧会给你一生的力量。",
                "点燃自己，是为了照亮前路，但别忘了为自己留一些光。",
                "火柴的一生虽短暂，但它的光亮可以引燃生命的意义。",
                "心智就像火苗，需要适时休息才能持续明亮。",
                "再冷的冬天也会过去，就像再深的黑暗也会迎来黎明。",
                "火柴人的智慧：有时候，燃烧得慢一些，反而能照亮更长远的路。",
                "痛苦是暂时的，但对痛苦的理解是永恒的智慧。",
                "当黑暗压迫时，记住你内心的火苗是无法被浇灭的。",
                "智慧如火，点燃你思想的灯塔；慈悲如水，滋润你灵魂的花园。",
                "你的价值不在于燃烧的速度，而在于照亮的范围。",
                "在黑暗中摸索时，每一步都是勇气，每一步都在积累智慧。",
                "火柴人的使命不是永恒燃烧，而是点亮需要光明的地方。",
                "真正的智慧不是逃避黑狗，而是学会与它和平共处。",
                "生命的意义不在于你燃烧了多少，而在于你照亮了谁。",
                "当感到迷失时，停下来，聆听内心的声音，那里藏着你的指南针。",
                "人生最大的对手往往不是别人，而是自己的心魔。",
                "抑郁就像深海，但记住，即使在最深的海底，阳光也能照射进来。",
                "你无法改变风的方向，但可以调整帆的角度。",
                "内心的火焰有时候需要独处的氧气才能更好地燃烧。",
                "最伟大的征服不是征服世界，而是征服自己内心的恐惧。",
                
                // 幽默类
                "火柴人的幽默：我可以一直燃烧到灰烬，但请别指望我给你煮咖啡。",
                "我的智慧就像我的头——圆圆的，但里面装满了惊喜。",
                "黑狗说它想咬我，我说'等等，我还没找到我的火柴腿呢'。",
                "如果智慧可以充电，我保证给你的大脑安装一个超级快充。",
                "火柴的哲学：燃烧是我的天职，但我偶尔也想泡个温泉，咦，等等——",
                "今天我的智慧特别充足，可惜我的体力条已经亮红灯了。",
                "我昨天问黑狗：'嘿，为什么总跟着我？' 它说：'因为你看起来像根会走路的骨头。'",
                "火柴人减压小技巧：数数自己还有多少根头发，哦等等，我们没有头发！",
                "我试图教黑狗玩'接火柴棒'的游戏，但它表示更喜欢'咬火柴人'。",
                "智者说过：笑一笑，烦恼少。笑太多，火柴折。",
                "心情不好时，可以试试倒立看世界，不过作为火柴人，我不建议这么做，头部着地风险太大。",
                "我的火苗今天特别亮，大概是因为我昨晚梦见自己变成了探照灯。",
                "黑狗问我：'你为什么总是那么乐观？'我说：'因为悲观的火柴人都被雨水打败了'。",
                "火柴人的人生哲学：不要害怕被点燃，要害怕从未发光。",
                "如果你觉得压力大，想想我——一个随时可能被大风吹灭的火柴人。",
                
                // 冷笑话类
                "知道火柴人最怕什么吗？不是水，是'火'灾保险的推销员。",
                "火柴人去游泳池应聘救生员，结果被告知'你的履历太容易湿了'。",
                "黑狗和火柴人比赛跑步，火柴人赢了，因为黑狗看到火就绕道跑。",
                "火柴人问医生：'我总觉得自己被点燃'，医生说：'这是正常的，你本来就是根火柴'。",
                "两根火柴相遇，一根说：'你今天看起来特别火辣'，另一根说：'别闹了，我们刚熄灭'。",
                "知道火柴人为什么不喜欢讲冷笑话吗？因为它们可能会'熄灭'他的热情。",
                "火柴人走进酒吧，酒保说：'对不起，我们不接待易燃客人'。",
                "火柴盒里的火柴人开会，主题是：如何避免被人'擦边球'。",
                "一根火柴对另一根说：'我头上有点热'，另一根回答：'那是你在思考的光芒'。",
                "火柴人最怕听到的问题是什么？'嘿，有人需要点火吗？'",
                "黑狗对火柴人说：'你看起来有点暗淡'，火柴人回答：'那是因为我在省电模式'。",
                "为什么火柴人都喜欢早起？因为他们都是'晨光'的象征。",
                "火柴人去面试，面试官问：'你最大的缺点是什么？'，他说：'我容易对工作太过热情'。",
                "火柴人的笑话都很短小，就像他们的寿命一样。噢，这可能不太好笑...",
                "黑狗问火柴人：'你为什么总是站着？'火柴人说：'因为我一躺下就变成了火灾隐患'。",
                
                // 安慰类
                "即使是最黑暗的狗洞，也挡不住一根火柴的光芒。",
                "当黑狗靠近时，记住它只是想看看你内心的光有多亮。",
                "你的火苗或许微弱，但足以照亮今天的路。明天的光，明天再点。",
                "泪水有时会让你的火苗闪烁，但真正的火把泪水也能转化为力量。",
                "黑狗可以跟随你，但它无法定义你。你是火柴人，天生就是为了发光的。",
                "有时候，最温柔的火苗能穿透最黑暗的夜晚。",
                "在风雨中保持燃烧并不容易，但正是这份坚持，让你与众不同。",
                "当你感到自己只剩一点星火时，请记住，星星之火，可以燎原。",
                "黑暗中，即使是最微弱的光也格外耀眼。不要低估你的光芒。",
                "沮丧时，记住：火柴人不是因为不会熄灭而伟大，而是因为明知会熄灭，仍然勇敢点燃自己。",
                "感到疲惫是因为你正在攀登，而不是坠落。继续向上，风景在前方。",
                "有时我们需要经历最深的黑暗，才能看到自己有多耀眼。",
                "黑狗也会疲倦，但你内心的光芒永远不会熄灭。",
                "当你无法走得更远时，静静地站着也是一种力量。",
                "不要害怕脆弱，每根火柴都有断裂的风险，但也都有点亮世界的能力。",
                "木屑并非无用，它们是你成长的见证，是你经历的痕迹。",
                "没关系，今天的火苗微弱一些，明天它会因为今天的休息而更加明亮。",
                "当黑狗在你身边徘徊，别忘了它也惧怕光明。燃起你的勇气之火吧。",
                "你不需要燃烧得最亮，只需要以自己的方式发光。",
                "在最孤独的时刻，记住星空中的每颗星星都是独自发光的，但一起组成了璀璨的天空。",
                
                // 关于抑郁和心理健康的深度思考
                "抑郁不是你的错，就像火柴被雨打湿不是火柴的错一样。",
                "心理的阴影就像影子，证明有光的存在，但永远不会比光本身更强大。",
                "有时候，治愈不是一瞬间的光明，而是一点一点驱散黑暗的过程。",
                "接受黑暗的存在，但不接受它的统治。你是光明的主宰。",
                "黑狗可以和你并肩而行，但决定路途方向的始终是你自己。",
                "抑郁是一场与自己的长跑，没有捷径，但每一步都是向前。",
                "心灵的创伤需要时间愈合，就像火柴熄灭后需要时间冷却一样。",
                "了解自己的黑暗面，才能更好地面对它，而不是被它吞噬。",
                "当情绪的浪潮袭来，不要抗拒，学会浮在水面，它终会平息。",
                "治愈抑郁不在于消灭黑狗，而在于学会与它和平共处，甚至从中获得力量。",
                "承认自己需要帮助不是软弱，而是对自己负责的表现。",
                "心灵的伤口需要表达才能愈合，就像火需要空气才能燃烧。",
                "有时，最勇敢的行动不是坚持，而是学会何时该放手。",
                "情绪不是敌人，它们是内心的信使，告诉你什么需要关注。",
                "在漫长的抑郁之夜，请记住，曙光不会因为黑夜的长久而缺席。",
                
                // 关于生活和个人成长的反思
                "人生就像一盒火柴，重要的不是数量，而是你如何点燃每一根。",
                "成长的秘密在于接受变化，就像火柴接受被点燃的命运。",
                "最重要的旅程往往是从自我认识开始的内在之旅。",
                "真正的成长来自于接受自己的局限，同时努力超越它们。",
                "生活的智慧在于知道什么时候坚持，什么时候放手。",
                "人生的价值不在于你拥有什么，而在于你点亮了什么。",
                "自我怀疑是成长的一部分，但不要让它成为前进的障碍。",
                "每一次挫折都是一次重新定义自己的机会。",
                "做自己是一种勇气，尤其是当世界期望你成为别人的时候。",
                "能力固然重要，但持续的热情才是长久发光的秘诀。",
                "不要害怕犯错，害怕的是不从错误中学习。",
                "发现自己的激情所在，就像火柴找到了最适合燃烧的地方。",
                "有时候，最大的突破来自于最深的挣扎。",
                "人生不在于避免风雨，而在于学会在风雨中跳舞。",
                "每一个结束都是新开始的机会，就像熄灭的火柴为新的火柴让路。",
                
                // 关于时间管理和效率的思考
                "时间是火柴人最宝贵的资源，因为我们都知道自己会燃尽。",
                "与其同时点燃多根火柴，不如让一根燃烧得更亮更久。",
                "高效不是做更多的事，而是做对的事，就像火柴要找对点燃的位置。",
                "拖延是内心恐惧的表现，勇敢面对，就像火柴直面被点燃的命运。",
                "休息不是浪费时间，而是为了燃烧得更持久。",
                "专注是最强大的力量，就像聚焦的阳光能点燃火柴一样。",
                "计划是好的，但灵活调整更重要，就像火柴要适应不同的风向。",
                "今日事今日毕，因为明天的火苗可能要照亮其他地方。",
                "把大任务分解成小步骤，就像一根火柴可以点燃篝火一样。",
                "明智地选择战场，不是所有地方都值得你燃烧自己。"
            ];
            break;
        case 'king':
            messages = [
                "领导力不是控制他人，而是激发他人的潜能。",
                "真正的王者知道何时该坚持，何时该妥协。",
                "权力的真谛在于责任，而非特权。",
                "决策时要果断，但也要倾听不同的声音。",
                "管理时间就像管理一个王国，需要策略和远见。",
                "今天的挑战，是为了锻造明天的王者。",
                "不要害怕犯错，害怕的是不从错误中学习。",
                "真正的强者不是不跌倒，而是每次跌倒后都能站起来。",
                "统筹规划是成功的一半，执行力是另一半。",
                "有时候，最勇敢的决定是承认自己需要休息。"
            ];
            break;
        case 'rich':
            messages = [
                "财富不只是金钱，还有时间、健康和快乐。",
                "投资自己的成长，是最有价值的投资。",
                "真正的富有是拥有选择的自由。",
                "积累小胜利，最终会带来大成功。",
                "管理好自己的精力，比管理时间更重要。",
                "敢于冒险，但要聪明地冒险。",
                "今天的付出是明天的收获，别忘了储蓄你的能量。",
                "有时候，放弃一些东西反而能获得更多。",
                "不要把所有鸡蛋放在一个篮子里，分散你的任务类型。",
                "最大的奢侈品是拥有做自己喜欢事情的时间。"
            ];
            break;
    }
    
    // 合并通用消息和特定消息
    const allMessages = [...messages, ...commonMessages];
    
    // 根据用户状态选择更有针对性的消息
    let targetedMessages = [];
    
    // 如果体力不足，添加相关建议
    if (state.stats.energy < 30) {
        targetedMessages.push(
            "我注意到你的体力有些低了，也许该休息一下？",
            "体力不支时，不妨暂停一下，喝杯水，深呼吸。",
            "记得照顾好自己的身体，这是完成一切的基础。"
        );
    }
    
    // 如果精力不足，添加相关建议
    if (state.stats.spirit < 30) {
        targetedMessages.push(
            "精神看起来有些疲惫，试着做些你喜欢的事情来恢复活力。",
            "当精力低落时，换个环境可能会有意想不到的效果。",
            "别忘了，偶尔的放松能让你更有效率地工作。"
        );
    }
    
    // 如果有未完成的任务较多，添加相关建议
    if (state.todos.length > 5) {
        targetedMessages.push(
            "待办事项有些多啊，试着按优先级处理如何？",
            "记住，一次只专注做好一件事，效率往往更高。",
            "把大任务分解成小步骤，会让完成它们变得更容易。"
        );
    }
    
    // 如果有项目接近截止日期，添加相关提醒
    const today = new Date();
    const projectsNearDeadline = state.projects.filter(project => {
        const deadline = new Date(project.deadline);
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return daysLeft <= 3 && daysLeft > 0;
    });
    
    if (projectsNearDeadline.length > 0) {
        targetedMessages.push(
            "有些项目即将到期，别忘了检查一下进度。",
            "截止日期临近时，专注于最重要的部分。",
            "时间紧迫时，寻求帮助也是明智之举。"
        );
    }
    
    // 合并所有消息
    const finalMessages = [...targetedMessages, ...allMessages];
    
    // 随机选择一条消息
    return finalMessages[Math.floor(Math.random() * finalMessages.length)];
}

// 调用deepseek API获取神明消息
async function getDeepseekMessage(godType, userContext) {
    console.log('getDeepseekMessage被调用，参数:', { godType, userContextKeys: Object.keys(userContext) });
    
    if (!DEEPSEEK_CONFIG.useApi || !DEEPSEEK_CONFIG.apiKey) {
        console.log('Deepseek API未启用或未设置API密钥');
        return null; // 如果未启用API或未设置API密钥，则返回null
    }
    
    try {
        // 构建提示词
        const prompt = generateDeepseekPrompt(godType, userContext);
        console.log('发送到Deepseek的提示词:', prompt);
        
        // 准备请求体
        const requestBody = {
            model: DEEPSEEK_CONFIG.model,
            messages: [
                {
                    role: "system",
                    content: "你是一个智慧的火柴神，给予用户鼓励和建议。保持回复简短、幽默且有启发性。"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        };
        
        console.log('发送到Deepseek的请求:', JSON.stringify(requestBody));
        console.log('使用的API端点:', DEEPSEEK_CONFIG.endpoint);
        console.log('使用的API密钥前5位:', DEEPSEEK_CONFIG.apiKey.substring(0, 5) + '...');
        
        // 调用API
        console.log('开始发送API请求...');
        const response = await fetch(DEEPSEEK_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        console.log('API请求已发送，状态码:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Deepseek API调用失败:', response.status, response.statusText);
            console.error('错误详情:', errorText);
            
            // 显示错误信息给用户
            const errorDialog = `
                <h3>API调用失败</h3>
                <p>状态码: ${response.status}</p>
                <p>错误信息: ${response.statusText}</p>
                <p>详情: ${errorText}</p>
            `;
            showDialog(errorDialog);
            return null;
        }
        
        const data = await response.json();
        console.log('Deepseek API返回数据:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Deepseek API返回的数据格式不正确:', data);
            return null;
        }
        
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('调用Deepseek API时出错:', error);
        
        // 显示错误信息给用户
        const errorDialog = `
            <h3>API调用出错</h3>
            <p>错误类型: ${error.name}</p>
            <p>错误信息: ${error.message}</p>
        `;
        showDialog(errorDialog);
        return null;
    }
}

// 生成deepseek API的提示词
function generateDeepseekPrompt(godType, userContext) {
    let basePrompt = "";
    
    // 根据神明类型设置基础提示词
    switch(godType.id) {
        case 'wise':
            basePrompt = `作为智者火柴神，你拥有无尽的智慧和洞察力。请给予用户一句充满智慧、略带幽默的鼓励或建议。`;
            break;
        case 'king':
            basePrompt = `作为国王火柴神，你拥有领导力和决断力。请给予用户一句充满权威、略带幽默的鼓励或建议。`;
            break;
        case 'rich':
            basePrompt = `作为首富火柴神，你拥有丰富的资源和勇气。请给予用户一句关于价值、略带幽默的鼓励或建议。`;
            break;
    }
    
    // 添加用户上下文信息
    let contextPrompt = `\n\n用户当前情况：\n`;
    
    // 添加用户状态
    contextPrompt += `- 体力：${userContext.energy}/100\n`;
    contextPrompt += `- 精力：${userContext.spirit}/100\n`;
    contextPrompt += `- 已经坚持了${userContext.totalDays}天\n`;
    
    // 添加任务信息
    if (userContext.dailyTasks.length > 0) {
        contextPrompt += `- 用户有${userContext.dailyTasks.length}个日常任务\n`;
    }
    
    if (userContext.todos.length > 0) {
        contextPrompt += `- 用户有${userContext.todos.length}个待办事项\n`;
    }
    
    if (userContext.projects.length > 0) {
        contextPrompt += `- 用户有${userContext.projects.length}个进行中的项目\n`;
    }
    
    // 添加最近的日志
    if (userContext.recentLogs && userContext.recentLogs.length > 0) {
        contextPrompt += `- 用户最近的活动：\n`;
        userContext.recentLogs.forEach(log => {
            contextPrompt += `  * ${log}\n`;
        });
    }
    
    // 添加要求
    const requirements = `
    请根据以上信息，生成一句话（不超过50个字）的鼓励或建议。要求：
    1. 保持幽默感和智慧感
    2. 与用户当前状态相关
    3. 给予实用的建议或温暖的鼓励
    4. 不要使用过于正式或说教的语气
    5. 不要使用emoji表情符号
    6. 不要添加引号
    `;
    
    return basePrompt + contextPrompt + requirements;
}

// 测试Deepseek API连接
async function testDeepseekConnection() {
    console.log('测试Deepseek API连接...');
    console.log('当前DEEPSEEK_CONFIG状态:', {
        useApi: DEEPSEEK_CONFIG.useApi,
        apiKeyExists: !!DEEPSEEK_CONFIG.apiKey,
        apiKeyLength: DEEPSEEK_CONFIG.apiKey ? DEEPSEEK_CONFIG.apiKey.length : 0,
        endpoint: DEEPSEEK_CONFIG.endpoint,
        model: DEEPSEEK_CONFIG.model
    });
    
    if (!DEEPSEEK_CONFIG.useApi || !DEEPSEEK_CONFIG.apiKey) {
        console.log('Deepseek API未启用或未设置API密钥，无法测试连接');
        showDialog(`
            <h2>API连接测试</h2>
            <p>Deepseek API未启用或未设置API密钥，请先在设置中启用API并设置API密钥。</p>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
                <button onclick="showSettings()">前往设置</button>
            </div>
        `);
        return;
    }
    
    // 显示测试中对话框
    showDialog(`
        <h2>API连接测试</h2>
        <p>正在测试Deepseek API连接，请稍候...</p>
    `);
    
    try {
        // 准备一个简单的请求
        const requestBody = {
            model: DEEPSEEK_CONFIG.model,
            messages: [
                {
                    role: "system",
                    content: "你是一个测试助手。"
                },
                {
                    role: "user",
                    content: "请回复'连接测试成功'"
                }
            ],
            max_tokens: 20,
            temperature: 0.7
        };
        
        console.log('发送测试请求到Deepseek API...');
        const response = await fetch(DEEPSEEK_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('收到API响应，状态码:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API连接测试失败:', response.status, response.statusText);
            console.error('错误详情:', errorText);
            
            showDialog(`
                <h2>API连接测试失败</h2>
                <p>状态码: ${response.status}</p>
                <p>错误信息: ${response.statusText}</p>
                <p>详情: ${errorText}</p>
                <div class="dialog-buttons">
                    <button onclick="closeDialog()">关闭</button>
                    <button onclick="showSettings()">检查设置</button>
                </div>
            `);
            return;
        }
        
        const data = await response.json();
        console.log('API连接测试成功，返回数据:', data);
        
        showDialog(`
            <h2>API连接测试成功</h2>
            <p>Deepseek API连接测试成功！</p>
            <p>API返回: ${data.choices && data.choices[0] ? data.choices[0].message.content : '未获取到有效响应'}</p>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        `);
    } catch (error) {
        console.error('API连接测试出错:', error);
        
        showDialog(`
            <h2>API连接测试出错</h2>
            <p>错误类型: ${error.name}</p>
            <p>错误信息: ${error.message}</p>
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
                <button onclick="showSettings()">检查设置</button>
            </div>
        `);
    }
}

// 调试夜晚过渡界面
function debugNightTransition() {
    const nightTransition = document.getElementById('night-transition');
    const video = document.getElementById('night-bg-video');
    
    console.log('夜晚过渡界面状态:');
    console.log('- 元素存在:', !!nightTransition);
    if (nightTransition) {
        console.log('- 是否隐藏:', nightTransition.classList.contains('hidden'));
        console.log('- z-index:', nightTransition.style.zIndex);
        console.log('- opacity:', getComputedStyle(nightTransition).opacity);
        console.log('- visibility:', getComputedStyle(nightTransition).visibility);
    }
    
    console.log('视频状态:');
    console.log('- 元素存在:', !!video);
    if (video) {
        console.log('- 源:', video.src);
        console.log('- 是否加载:', video.classList.contains('loaded'));
        console.log('- 当前时间:', video.currentTime);
        console.log('- 是否暂停:', video.paused);
    }
    
    console.log('state.nightTransition:');
    console.log(state.nightTransition);
    
    // 尝试修复夜晚过渡界面
    if (nightTransition) {
        console.log('尝试修复夜晚过渡界面...');
        nightTransition.classList.remove('hidden');
        nightTransition.style.zIndex = '2000';
        
        if (video && state.nightTransition && state.nightTransition.videoPath) {
            video.src = state.nightTransition.videoPath;
            video.load();
            video.play().catch(e => console.error('播放视频失败:', e));
            video.classList.add('loaded');
        }
    }
}

// 删除项目
// [Refactored] Now uses TaskManager.getProjectById()
function deleteProject(projectId) {
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    showDialog(`
        <h2>确认删除</h2>
        <p>确定要删除项目"${project.name}"吗？此操作不可恢复。</p>
        <div class="dialog-buttons">
            <button onclick="confirmDeleteProject(${projectId})" class="danger">确认删除</button>
            <button onclick="showProjectManager()">取消</button>
        </div>
    `);
}

// 确认删除项目
// [Refactored] Now uses TaskManager
function confirmDeleteProject(projectId) {
    const tm = getTaskManager();
    if (tm) {
        tm.deleteProject(projectId);
    } else {
        // Fallback
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            state.projects.splice(projectIndex, 1);
        }
    }
    saveState();
    
    // 添加日志
    state.logs.push(`[第${state.stats.totalDays}天] 删除项目。`);
    
    showDialog(`
        <h2>项目已删除</h2>
        <p>项目已成功删除。</p>
        <div class="dialog-buttons">
            <button onclick="showProjectManager()">返回项目列表</button>
        </div>
    `);
}

// 编辑项目
// [Refactored] Now uses TaskManager.getProjectById()
function editProject(projectId) {
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 准备编辑内容
    showDialog(`
        <h2>编辑项目</h2>
        <div class="form-group">
            <label for="edit-project-name">项目名称：</label>
            <input type="text" id="edit-project-name" value="${project.name}" required>
        </div>
        <div class="form-group">
            <label for="edit-project-deadline">截止日期：</label>
            <input type="date" id="edit-project-deadline" value="${project.deadline}" required>
        </div>
        <div class="form-group">
            <label for="edit-project-daily-time">每日计划投入时间（小时）：</label>
            <input type="number" id="edit-project-daily-time" min="0.5" step="0.5" value="${project.dailyTime}" required>
        </div>
        <div class="form-group">
            <label for="edit-project-importance">重要性：</label>
            <select id="edit-project-importance">
                <option value="high" ${project.importance === 'high' ? 'selected' : ''}>高</option>
                <option value="medium" ${project.importance === 'medium' ? 'selected' : ''}>中</option>
                <option value="low" ${project.importance === 'low' ? 'selected' : ''}>低</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-project-interest">兴趣度：</label>
            <select id="edit-project-interest">
                <option value="high" ${project.interest === 'high' ? 'selected' : ''}>高</option>
                <option value="medium" ${project.interest === 'medium' ? 'selected' : ''}>中</option>
                <option value="low" ${project.interest === 'low' ? 'selected' : ''}>低</option>
            </select>
        </div>
        <h3>节点管理</h3>
        <div id="edit-milestones-container">
            ${project.milestones.map((milestone, index) => {
                // 当前节点之前的节点已完成，不可编辑
                const isCompleted = index < project.currentMilestone;
                const isCurrent = index === project.currentMilestone;
                
                return `
                    <div class="milestone-input" data-milestone-id="${milestone.id}">
                        <div class="form-group">
                            <label>节点名称：</label>
                            <input type="text" class="milestone-name" value="${milestone.name}" ${isCompleted ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>预计完成日期：</label>
                            <input type="date" class="milestone-date" value="${milestone.date}" ${isCompleted ? 'disabled' : ''}>
                        </div>
                        ${isCompleted ? '<span class="milestone-status">✅ 已完成</span>' : ''}
                        ${isCurrent ? '<span class="milestone-status">🔄 进行中</span>' : ''}
                        ${!isCompleted && !isCurrent ? 
                            `<button onclick="removeEditMilestone(event, ${milestone.id})" class="remove-milestone-btn">删除节点</button>` : 
                            ''}
                    </div>
                `;
            }).join('')}
        </div>
        <button onclick="addEditMilestoneInput(${projectId})">添加新节点</button>
        <div class="dialog-buttons">
            <button onclick="saveEditedProject(${projectId})">保存更改</button>
            <button onclick="showProjectManager()">取消</button>
        </div>
    `);
}

// 添加编辑中的节点输入
function addEditMilestoneInput(projectId) {
    const container = document.getElementById('edit-milestones-container');
    const newId = Date.now();
    
    const newMilestoneHtml = `
        <div class="milestone-input" data-milestone-id="${newId}">
            <div class="form-group">
                <label>节点名称：</label>
                <input type="text" class="milestone-name" required>
            </div>
            <div class="form-group">
                <label>预计完成日期：</label>
                <input type="date" class="milestone-date" required>
            </div>
            <button onclick="removeEditMilestone(event, ${newId})" class="remove-milestone-btn">删除节点</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', newMilestoneHtml);
}

// 移除编辑中的节点
function removeEditMilestone(event, milestoneId) {
    event.preventDefault();
    const milestoneElement = document.querySelector(`.milestone-input[data-milestone-id="${milestoneId}"]`);
    if (milestoneElement) {
        milestoneElement.remove();
    }
}

// 保存编辑后的项目
// [Refactored] Now uses TaskManager.getProjectById() for lookup
function saveEditedProject(projectId) {
    const tm = getTaskManager();
    const project = tm ? tm.getProjectById(projectId) : state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 获取表单值
    const name = document.getElementById('edit-project-name').value.trim();
    const deadline = document.getElementById('edit-project-deadline').value;
    const dailyTime = parseFloat(document.getElementById('edit-project-daily-time').value);
    const importance = document.getElementById('edit-project-importance').value;
    const interest = document.getElementById('edit-project-interest').value;
    
    // 验证基本信息
    if (!name || !deadline) {
        alert('请填写项目名称和截止日期');
        return;
    }
    
    if (isNaN(dailyTime) || dailyTime < 0.5) {
        alert('请输入有效的每日时间（至少0.5小时）');
        return;
    }
    
    // 获取所有节点信息，包括已完成的节点
    const existingMilestones = project.milestones.slice(0, project.currentMilestone);
    const currentMilestone = project.milestones[project.currentMilestone];
    const newMilestones = [];
    
    // 更新当前进行中的节点信息
    if (currentMilestone) {
        const currentMilestoneElement = document.querySelector(`.milestone-input[data-milestone-id="${currentMilestone.id}"]`);
        if (currentMilestoneElement) {
            currentMilestone.name = currentMilestoneElement.querySelector('.milestone-name').value.trim();
            currentMilestone.date = currentMilestoneElement.querySelector('.milestone-date').value;
        }
        newMilestones.push(currentMilestone);
    }
    
    // 收集其他未完成节点的信息
    document.querySelectorAll('.milestone-input').forEach((input) => {
        const milestoneId = parseInt(input.dataset.milestoneId);
        
        // 跳过已完成的节点和当前节点
        if (existingMilestones.some(m => m.id === milestoneId) || (currentMilestone && currentMilestone.id === milestoneId)) {
            return;
        }
        
        const name = input.querySelector('.milestone-name').value.trim();
        const date = input.querySelector('.milestone-date').value;
        
        if (name && date) {
            newMilestones.push({
                id: milestoneId,
                name,
                date,
                completed: false,
                completedAt: null,
                timeSpent: 0
            });
        }
    });
    
    // 验证节点数量
    if (existingMilestones.length + newMilestones.length === 0) {
        alert('请至少添加一个项目节点');
        return;
    }
    
    // 更新项目数据
    project.name = name;
    project.deadline = deadline;
    project.dailyTime = dailyTime;
    project.importance = importance;
    project.interest = interest;
    project.milestones = [...existingMilestones, ...newMilestones];
    
    saveState();
    
    // 添加日志
    state.logs.push(`[第${state.stats.totalDays}天] 编辑项目：${project.name}。`);
    
    // 显示成功消息
    showDialog(`
        <h2>项目已更新</h2>
        <p>项目信息已成功更新。</p>
        <div class="dialog-buttons">
            <button onclick="showProjectManager()">返回项目列表</button>
        </div>
    `);
}

// 命运时钟功能
function showDestinyClock() {
    console.log('跳转到命运时钟页面');
    window.location.href = 'destiny_clock/destiny_clock.html';
}