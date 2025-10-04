// 全局状态管理

// deepseek API配置
const DEEPSEEK_CONFIG = {
    apiKey: '', // 需要用户在设置中填写
    endpoint: 'https://api.deepseek.ai/v1/chat/completions',
    model: 'deepseek-coder',
    useApi: false // 默认不使用API，用户可以在设置中开启
};

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
    drafts: [] // 新增：用于存储草稿
};

// 新增：临时存储上传的背景图片
let tempBackgrounds = {};

// 火柴神类型定义
const GOD_TYPES = [
    {
        id: 'wise',
        name: '智者',
        description: '象征智慧与希望',
        imagePath: '/assets/gods/wise.jpg'
    },
    {
        id: 'king',
        name: '国王',
        description: '象征权威与力量',
        imagePath: '/assets/gods/king.jpg'
    },
    {
        id: 'rich',
        name: '首富',
        description: '象征富贵与勇敢',
        imagePath: '/assets/gods/rich.jpg'
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
    
    // 检查是否有保存的状态
    const savedState = localStorage.getItem('matchstickTimeManager');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            console.log('找到保存的状态:', parsedState);
            
            // 合并保存的状态
            Object.assign(state, parsedState);
            
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
        const response = await fetch('/data/tips.json');
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
        const response = await fetch('/data/tips.json');
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

    // 更新抑郁症状态显示
    const statusDisplay = document.getElementById('vacation-status');
    statusDisplay.classList.remove('hidden');
    statusDisplay.innerHTML = `
        <span class="status-icon">🖤</span>
        <span class="status-text">${state.depression.status}</span>
        ${state.depression.nextMilestone < Infinity ? 
            `<span id="milestone-progress">距离改善还需${state.depression.nextMilestone - state.stats.burningDays}天</span>` : 
            ''}
    `;

    // 更新度假状态显示
    if (state.vacation.isOnVacation) {
        const endDate = new Date(state.vacation.endDate);
        const currentDate = new Date(state.currentDay);
        const daysLeft = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
        
        const vacationStatus = document.createElement('div');
        vacationStatus.classList.add('status-item');
        vacationStatus.innerHTML = `
            <span class="status-icon">🏖️</span>
            <span class="status-text">度假中</span>
            <span id="vacation-days-left">剩余${daysLeft}天</span>
        `;
        statusDisplay.appendChild(vacationStatus);
        
        // 如果度假已经结束
        if (daysLeft <= 0) {
            state.vacation.isOnVacation = false;
            state.vacation.vacationType = null;
            state.vacation.startDate = null;
            state.vacation.endDate = null;
            saveState();
        }
    }

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
function showDialog(content, showTaskList = false, taskType = '') {
    const dialogContainer = document.getElementById('dialog-container');
    let taskListHtml = '';
    
    if (showTaskList) {
        let tasks = [];
        let taskTitle = '';
        
        switch(taskType) {
            case 'daily':
                tasks = state.dailyTasks;
                taskTitle = '已添加的日常任务';
                break;
            case 'project':
                tasks = state.projects;
                taskTitle = '已添加的项目';
                break;
            case 'todo':
                tasks = state.todos;
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
function showStats() {
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
function saveState() {
    localStorage.setItem('matchstickTimeManager', JSON.stringify(state));
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
function generateDaySummary(previewStats) {
    const completedDailyTasks = state.dailyTasks.filter(task => 
        task.lastCompleted === new Date().toISOString().split('T')[0]
    ).length;
    
    const completedTodos = state.todos.filter(todo => 
        todo.completedAt && new Date(todo.completedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    ).length;
    
    const completedMilestones = state.projects.reduce((count, project) => {
        return count + project.milestones.filter(milestone => 
            milestone.completedAt && new Date(milestone.completedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
        ).length;
    }, 0);

    return `
        <h2>今日总结</h2>
        <div class="summary-content">
            <div class="summary-section">
                <h3>完成情况</h3>
                <ul>
                    <li>日常任务：完成 ${completedDailyTasks}/${state.dailyTasks.length} 个</li>
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

    const task = {
        id: Date.now(),
        name,
        duration,
        importance,
        interest,
        createdAt: new Date().toISOString(),
        completedTimes: 0,
        streakDays: 0,
        lastCompleted: null
    };

    state.dailyTasks.push(task);
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
function showDailyRoutine() {
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
function startDailyTask(taskId) {
    const task = state.dailyTasks.find(t => t.id === taskId);
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
function completeDailyTask(taskId) {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    const task = state.dailyTasks.find(t => t.id === taskId);
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

function finishDailyTask(taskId) {
    const task = state.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    if (!window.currentRating) {
        alert('请给任务完成度打分！');
        return;
    }

    const actualTime = Math.round((Date.now() - timerState.startTime) / 1000);
    const timeRatio = actualTime / (task.duration * 60);
    
    // 更新任务状态
    task.completedTimes++;
    const today = new Date().toISOString().split('T')[0];
    
    if (task.lastCompleted === today) {
        // 今天已经完成过了，不更新连续天数
    } else if (task.lastCompleted) {
        const lastDate = new Date(task.lastCompleted);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
            task.streakDays++;
        } else {
            task.streakDays = 1;
        }
    } else {
        task.streakDays = 1;
    }
    
    task.lastCompleted = today;

    // 计算木屑奖励
    const baseReward = 10;
    let sawdustReward = Math.round(baseReward * (window.currentRating / 5));
    
    // 额外奖励：如果实际用时少于计划时间，增加奖励
    if (timeRatio < 1) {
        sawdustReward = Math.round(sawdustReward * (1 + (1 - timeRatio)));
    }

    // 更新状态
    state.stats.sawdust += sawdustReward;
    
    // 计算火苗奖励（使用新的计算函数）
    const baseFlameReward = Math.round(sawdustReward / 2);
    const flameReward = calculateFlameReward(baseFlameReward);
    state.stats.flame += flameReward;
    
    // 更新精力值
    const spiritCost = task.interest === 'high' ? -20 : (task.interest === 'low' ? 40 : 20);
    state.stats.spirit = Math.max(0, Math.min(100, state.stats.spirit - spiritCost));

    // 更新体力值
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

    const todo = {
        id: Date.now(),
        name,
        deadline,
        duration,
        importance,
        urgency,
        createdAt: new Date().toISOString(),
        completed: false,
        completedAt: null,
        satisfaction: 0
    };

    state.todos.push(todo);
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
        .map(todo => `
            <div class="todo-card" data-todo-id="${todo.id}">
                <h3>${todo.name}</h3>
                <p>截止日期：${new Date(todo.deadline).toLocaleDateString()}</p>
                <p>预计时长：${todo.duration}小时</p>
                <p>重要性：${getImportanceText(todo.importance)}</p>
                <p>紧急度：${getUrgencyText(todo.urgency)}</p>
                <button onclick="startTodo(${todo.id})">开始处理</button>
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

// 开始处理待办事项
function startTodo(todoId) {
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
function completeTodo(todoId) {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    const todo = state.todos.find(t => t.id === todoId);
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

// 完成待办事项并计算奖励
function finishTodo(todoId) {
    const todo = state.todos.find(t => t.id === todoId);
    if (!todo) return;

    if (!window.currentRating || isNaN(window.currentRating)) {
        alert('请给任务完成度打分！');
        return;
    }

    const actualTime = Math.round((Date.now() - timerState.startTime) / 1000);
    const timeRatio = actualTime / (todo.duration * 60 * 60);

    // 更新待办状态
    todo.completed = true;
    todo.completedAt = new Date().toISOString();
    todo.satisfaction = window.currentRating;

    // 计算基础火苗奖励
    const baseReward = 10;
    let baseFlameReward = Math.round(baseReward * (window.currentRating / 5));
    
    // 额外奖励：如果实际用时少于计划时间，增加奖励
    if (timeRatio < 1) {
        baseFlameReward = Math.round(baseFlameReward * (1 + (1 - timeRatio)));
    }

    // 确保baseFlameReward是有效数字
    if (isNaN(baseFlameReward) || !isFinite(baseFlameReward)) {
        baseFlameReward = baseReward; // 使用默认值
    }

    // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
    const flameReward = calculateFlameReward(baseFlameReward);

    // 更新状态
    state.stats.flame += flameReward;
    
    // 计算精力消耗
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
    
    // 更新体力和精力值
    const energyCost = Math.round((todo.duration / 8) * 100); // 8小时工作对应100点体力
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
                satisfaction: 0
            });
        }
    });

    if (milestones.length === 0) {
        alert('请至少添加一个项目节点');
        return;
    }

    const project = {
        id: Date.now(),
        name,
        deadline,
        dailyTime,
        importance,
        interest,
        milestones,
        createdAt: new Date().toISOString(),
        currentMilestone: 0,
        completedAt: null
    };

    state.projects.push(project);
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

    const projectsHtml = state.projects
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
        })
        .map(project => {
            const nextMilestone = project.milestones[project.currentMilestone];
            const progress = nextMilestone ? (nextMilestone.progress || 0) : 100;
            const overallProgress = Math.round((project.currentMilestone * 100 + progress) / project.milestones.length);
            
            return `
                <div class="project-card" 
                    data-project-id="${project.id}"
                    data-importance="${project.importance}"
                    data-interest="${project.interest}">
                    <h3>${project.name}</h3>
                    <p>截止日期：${new Date(project.deadline).toLocaleDateString()}</p>
                    <p>每日投入：${project.dailyTime}小时</p>
                    <p>重要性：${getImportanceText(project.importance)}</p>
                    <p>兴趣度：${getInterestText(project.interest)}</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${overallProgress}%"></div>
                    </div>
                    <p>总体进度：${overallProgress}%</p>
                    ${nextMilestone ? `
                        <p>当前节点：${nextMilestone.name}</p>
                        <div class="milestone-progress-bar">
                            <div class="milestone-progress" style="width: ${progress}%"></div>
                        </div>
                        <p>节点进度：${progress}%</p>
                    ` : '<p>已完成所有节点</p>'}
                    ${nextMilestone ? `<button onclick="startProject(${project.id})">开始工作</button>` : ''}
                </div>
            `;
        }).join('');

    showDialog(`
        <h2>项目经理</h2>
        <div class="projects-grid">
            ${projectsHtml}
        </div>
        <div class="dialog-buttons">
            <button onclick="showAddProjectsDialog()">添加新项目</button>
            <button onclick="closeDialog()">返回</button>
        </div>
    `);
}

// 开始项目工作
function startProject(projectId) {
    const project = state.projects.find(p => p.id === projectId);
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
function completeProjectSession(projectId) {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }

    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const milestone = project.milestones[project.currentMilestone];
    
    showDialog(`
        <h2>工作环节完成！</h2>
        <div class="completion-summary">
            <p>项目：${project.name}</p>
            <p>当前节点：${milestone.name}</p>
            <div class="progress-input">
                <p>今天完成了这个节点的多少进度？</p>
                <input type="number" id="milestone-progress" min="1" max="100" value="10" step="1" style="width: 60px;" onchange="this.value=Math.round(this.value)"> %
            </div>
            <div class="rating-container">
                <p>给自己的工作质量打个分：</p>
                <div class="rating" id="satisfaction-rating">
                    ${Array(5).fill(0).map((_, i) => `
                        <span class="star" data-rating="${i + 1}" onclick="setRating(${i + 1})">★</span>
                    `).join('')}
                </div>
            </div>
            <div class="dialog-buttons" style="margin-top: 20px;">
                <button onclick="finishProjectProgress(${projectId})">确认完成</button>
                <button onclick="completeMilestone(${projectId})">完成整个节点</button>
            </div>
        </div>
    `);
}

// 完成项目进度
function finishProjectProgress(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    if (!window.currentRating) {
        alert('请给工作质量打分！');
        return;
    }

    // 获取输入值并去除可能的空格
    const inputValue = document.getElementById('milestone-progress').value.trim();
    // 使用parseFloat以支持小数输入，然后使用Math.round四舍五入
    const progress = Math.round(parseFloat(inputValue));
    
    // 检查是否为有效数字并在1-100范围内
    if (isNaN(progress) || progress < 1 || progress > 100) {
        alert('请输入1-100之间的进度值！');
        return;
    }

    const milestone = project.milestones[project.currentMilestone];
    
    // 初始化进度属性（如果不存在）
    if (!milestone.progress) {
        milestone.progress = 0;
    }
    
    // 计算实际新增的进度值（不超过100%）
    const actualNewProgress = Math.min(100 - milestone.progress, progress);
    if (actualNewProgress <= 0) {
        alert('该节点已经完成100%进度！');
        return;
    }
    
    // 更新节点进度
    milestone.progress += actualNewProgress;
    
    // 如果进度达到100%，提示是否完成整个节点
    if (milestone.progress >= 100) {
        if (confirm('该节点已达到100%进度，是否标记为完成？')) {
            completeMilestone(projectId);
            return;
        }
    }

    // 计算基础奖励（基于项目每日投入时间和实际新增进度比例）
    const baseReward = Math.round(project.dailyTime * 10 * (actualNewProgress / 100));
    
    // 根据评分调整奖励
    const ratingMultiplier = window.currentRating / 5;
    
    // 计算基础木屑和火苗奖励
    const sawdustReward = Math.round(baseReward * ratingMultiplier);
    const baseFlameReward = Math.round(sawdustReward / 2);
    
    // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
    const flameReward = calculateFlameReward(baseFlameReward);
    
    // 更新状态
    state.stats.sawdust += sawdustReward;
    state.stats.flame += flameReward;
    
    // 更新精力和体力
    const energyCost = Math.round((project.dailyTime / 8) * 100);
    const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
    state.stats.energy = Math.max(0, state.stats.energy - energyCost);
    state.stats.spirit = Math.max(0, Math.min(100, state.stats.spirit - spiritCost));

    // 添加日志
    if (!state.logs) state.logs = [];
    state.logs.push(`[第${state.stats.totalDays}天] 项目进度：${project.name} - ${milestone.name}，进度：${milestone.progress}%（+${actualNewProgress}%），获得木屑：${sawdustReward}，获得火苗：${flameReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);

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
            <p>进度：${milestone.progress}%（+${actualNewProgress}%）</p>
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

// 显示魔法学院
function showMagicAcademy() {
    showDialog(`
        <h2>魔法学院</h2>
        <p>魔法学院正在建设中...</p>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">关闭</button>
        </div>
    `);
}

// 显示我的成就
function showAchievements() {
    showDialog(`
        <h2>我的成就</h2>
        <p>成就系统正在建设中...</p>
        <div class="dialog-buttons">
            <button onclick="closeDialog()">关闭</button>
        </div>
    `);
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
function completeMilestone(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const milestone = project.milestones[project.currentMilestone];
    if (!milestone) return;
    
    // 计算消耗
    const energyCost = Math.round((project.dailyTime / 8) * 100);
    const spiritCost = project.interest === 'high' ? -20 : (project.interest === 'low' ? 40 : 20);
    
    // 检查是否有足够的体力和精力
    if (state.stats.energy < energyCost || (spiritCost > 0 && state.stats.spirit < spiritCost)) {
        alert('体力或精力不足，无法完成节点！');
        return;
    }
    
    // 更新体力和精力
    state.stats.energy = Math.max(0, state.stats.energy - energyCost);
    state.stats.spirit = Math.max(0, Math.min(100, state.stats.spirit - spiritCost));

    milestone.completed = true;
    milestone.completedAt = new Date().toISOString();

    // 更新项目进度
    project.currentMilestone++;
    
    // 检查是否完成所有节点
    if (project.currentMilestone >= project.milestones.length) {
        project.completedAt = new Date().toISOString();
        // 给予完整项目奖励
        const projectSawdustReward = 200;
        const baseFlameReward = 100;
        
        // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
        const flameReward = calculateFlameReward(baseFlameReward);
        
        state.stats.flame += flameReward;
        state.stats.sawdust += projectSawdustReward;
        
        // 添加日志
        state.logs.push(`[第${state.stats.totalDays}天] 完成项目：${project.name}，获得火苗：${flameReward}，获得木屑：${projectSawdustReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);
        
        saveState();
        updateUI();
        closeDialog(); // 先关闭当前对话框
        
        showDialog(`
            <h2>恭喜！项目完成！</h2>
            <p>你已经完成了"${project.name}"的所有节点！</p>
            <div class="reward-summary">
                <p>获得火苗：${flameReward}${state.shop.activeEffects.mirror ? ' (镜子效果翻倍)' : ''}</p>
                <p>获得木屑：${projectSawdustReward}</p>
                <p>消耗体力：${energyCost}</p>
                ${spiritCost < 0 ? `<p>恢复精力：${-spiritCost}</p>` : `<p>消耗精力：${spiritCost}</p>`}
            </div>
            <div class="dialog-buttons">
                <button onclick="showProjectManager()">返回项目列表</button>
            </div>
        `);
    } else {
        // 给予节点完成奖励
        const milestoneSawdustReward = 60;
        const baseFlameReward = 40;
        
        // 使用calculateFlameReward函数计算最终火苗奖励（考虑镜子效果等）
        const flameReward = calculateFlameReward(baseFlameReward);
        
        state.stats.flame += flameReward;
        state.stats.sawdust += milestoneSawdustReward;
        
        // 添加日志
        state.logs.push(`[第${state.stats.totalDays}天] 完成项目节点：${project.name} - ${milestone.name}，获得火苗：${flameReward}，获得木屑：${milestoneSawdustReward}，消耗体力：${energyCost}，${spiritCost < 0 ? '恢复精力：' + (-spiritCost) : '消耗精力：' + spiritCost}`);
        
        saveState();
        updateUI();
        closeDialog(); // 先关闭当前对话框
        
        showDialog(`
            <h2>节点完成！</h2>
            <p>你完成了"${milestone.name}"！</p>
            <div class="reward-summary">
                <p>获得火苗：${flameReward}${state.shop.activeEffects.mirror ? ' (镜子效果翻倍)' : ''}</p>
                <p>获得木屑：${milestoneSawdustReward}</p>
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
function confirmDeleteDailyTask(taskId) {
    state.dailyTasks = state.dailyTasks.filter(task => task.id !== taskId);
    saveState();
    showDailyRoutine();
}

// 编辑日常任务
function editDailyTask(taskId) {
    const task = state.dailyTasks.find(t => t.id === taskId);
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
function saveEditedDailyTask(taskId) {
    const task = state.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

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

    // 更新任务信息
    task.name = name;
    task.duration = duration;
    task.importance = importance;
    task.interest = interest;

    saveState();
    showDailyRoutine();
}

// 加载鼓励语
async function loadEncouragements() {
    try {
        const response = await fetch('/data/encouragements.json');
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
                "知识给你力量，但智慧给你方向。"
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