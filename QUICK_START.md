# 快速开始：今天就重构

**这是你今天要做的事，不超过2小时。**

## 目标

让应用使用新的StorageManager和StateManager，但保持100%兼容旧代码。

---

## 步骤1：引入新模块（5分钟）

修改 `index.html`，在加载main.js之前引入新模块：

找到这一行：
```html
<script src="scripts/main.js"></script>
```

在它**之前**添加：
```html
<!-- 核心模块 -->
<script src="scripts/core/storage.js"></script>
<script src="scripts/core/state-manager.js"></script>
```

保存。

---

## 步骤2：修改main.js开头（15分钟）

在main.js的最开始（第1行）添加兼容层：

```javascript
// ========================================
// 重构兼容层 v1.0
// 逐步迁移到新的模块系统
// ========================================

console.log('[Refactoring] Loading compatibility layer...');

// 保存原始的saveState函数作为fallback
const _originalSaveState = typeof saveState !== 'undefined' ? saveState : null;

// 重定义saveState，使用新的StorageManager
function saveState() {
    if (window.StorageManager) {
        console.log('[Refactoring] Using StorageManager.saveState');
        return StorageManager.saveState(state);
    } else {
        console.warn('[Refactoring] StorageManager not available, using fallback');
        if (_originalSaveState) {
            return _originalSaveState();
        }
        // 最终fallback
        try {
            localStorage.setItem('matchstickTimeManager', JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }
}

console.log('[Refactoring] Compatibility layer loaded');

// ========================================
// 原始代码从这里开始
// ========================================

```

然后找到 `initializeApp` 函数（大约在230行），找到这一段：

```javascript
const savedState = localStorage.getItem('matchstickTimeManager');
if (savedState) {
    try {
        const parsedState = JSON.parse(savedState);
```

在它**之前**添加：

```javascript
// 尝试使用新的StorageManager加载
if (window.StorageManager) {
    console.log('[Refactoring] Using StorageManager.loadState');
    const loadedState = StorageManager.loadState();
    if (loadedState) {
        Object.assign(state, loadedState);
        
        // 确保必需字段存在
        if (typeof state.dailyThoughtCompleted === 'undefined') {
            state.dailyThoughtCompleted = false;
        }
        
        // 加载deepseek配置
        if (state.settings && state.settings.deepseek) {
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
            const video = document.getElementById('night-bg-video');
            if (video) {
                video.src = savedVideoPath;
                video.load();
            }
        }
        
        console.log('[Refactoring] State loaded successfully');
        return; // 提前返回，不执行后面的旧代码
    }
}

console.log('[Refactoring] StorageManager not available or no data, using legacy code');

// 如果新的加载失败，继续执行原来的代码
```

保存。

---

## 步骤3：测试（20分钟）

### 3.1 备份当前数据

在浏览器控制台执行：

```javascript
// 备份当前localStorage
const backup = localStorage.getItem('matchstickTimeManager');
localStorage.setItem('matchstickTimeManager_backup_' + Date.now(), backup);
console.log('Backup created');
```

### 3.2 启动应用

```bash
python server.py
```

打开 http://localhost:8000

### 3.3 检查控制台

你应该看到：
```
[Refactoring] Loading compatibility layer...
[Refactoring] Compatibility layer loaded
[Refactoring] Using StorageManager.loadState
[Storage] Loaded state (version X)
[Refactoring] State loaded successfully
```

### 3.4 测试功能

- [ ] 应用能正常启动
- [ ] 能看到你的角色和数据
- [ ] 能添加任务
- [ ] 能完成任务
- [ ] 点击"结束一天"能保存

### 3.5 检查数据版本

在控制台执行：
```javascript
const state = JSON.parse(localStorage.getItem('matchstickTimeManager'));
console.log('Data version:', state.version);
console.log('Last saved:', state.lastSaved);
```

你应该看到：
```
Data version: 1
Last saved: 2025-10-04T...
```

---

## 步骤4：提交（5分钟）

如果一切正常：

```bash
git add -A
git commit -m "Refactor: Add StorageManager and StateManager with compatibility layer"
git tag v0.1-storage-refactor
```

---

## 如果出问题了

### 问题1：应用打不开

**检查控制台错误**，可能是JS语法错误。

**快速回滚**：
```bash
git checkout index.html scripts/main.js
```

### 问题2：数据丢失

**恢复备份**：
```javascript
// 在控制台
const backups = Object.keys(localStorage).filter(k => k.includes('backup'));
console.log('Available backups:', backups);

// 恢复最新的备份
const latest = backups[backups.length - 1];
const data = localStorage.getItem(latest);
localStorage.setItem('matchstickTimeManager', data);

// 刷新页面
location.reload();
```

### 问题3：StorageManager未定义

检查index.html是否正确引入了scripts/core/storage.js

### 问题4：行为异常

打开控制台，看看是使用的新代码还是旧代码：
- 如果看到 `[Refactoring]` 日志，说明新代码在工作
- 如果没看到，说明还在用旧代码

---

## 完成后

你现在有了：
1. ✅ 版本化的数据存储（自动迁移）
2. ✅ 集中的状态管理器
3. ✅ 完全向后兼容的代码
4. ✅ 可以随时回滚的git历史

**下一步做什么？**

1. 看 `REFACTORING_PLAN.md` 的阶段2
2. 开始提取第一个模块（建议从TaskManager开始）
3. 每提取一个模块就git commit

---

## 时间表

- ✅ 步骤1：5分钟（修改HTML）
- ✅ 步骤2：15分钟（修改main.js）
- ✅ 步骤3：20分钟（测试）
- ✅ 步骤4：5分钟（提交）

**总计：45分钟**

剩下的时间喝杯咖啡，庆祝你迈出了重构的第一步！

---

**记住：这是一场马拉松，不是百米冲刺。慢就是快。**
