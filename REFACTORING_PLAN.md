# 务实的重构计划

**Linus说：不要重写，渐进式改进。**

## 核心原则

1. ✅ 每一步都保持应用可运行
2. ✅ 永远不破坏用户数据
3. ✅ 优先解决最痛的问题
4. ✅ 删除代码比添加代码更重要

---

## 阶段0：停止挖坑 ⚠️ 【立即执行】

### 已完成
- [x] 创建 `REFACTORING_RULES.md`
- [x] 创建 `scripts/core/storage.js`（数据持久化）
- [x] 创建 `scripts/core/state-manager.js`（状态管理）

### 下一步（今天就做）

1. **在index.html中引入新模块**
   ```html
   <!-- 在main.js之前加载 -->
   <script src="scripts/core/storage.js"></script>
   <script src="scripts/core/state-manager.js"></script>
   <script src="scripts/main.js"></script>
   ```

2. **在main.js开头添加兼容层**
   ```javascript
   // === 兼容层：让旧代码继续工作 ===
   // 逐步迁移到StorageManager和StateManager
   
   function saveState() {
       if (window.StorageManager) {
           return StorageManager.saveState(state);
       }
       // 旧的实现作为fallback
       localStorage.setItem('matchstickTimeManager', JSON.stringify(state));
   }
   
   // 保持旧的全局state变量，但逐步迁移
   let state = null;
   
   function initializeApp() {
       // 使用新的StorageManager加载
       if (window.StorageManager) {
           const loaded = StorageManager.loadState();
           if (loaded) {
               state = loaded;
           }
       }
       // ... 其余初始化代码
   }
   ```

3. **测试**：确保应用仍然能正常启动和保存数据

---

## 阶段1：建立测试基础设施 【第1周】

### 目标
在重构前，确保我们知道什么功能是正常的。

### 任务

1. **创建手动测试清单** `MANUAL_TEST.md`
   - 创建角色
   - 添加日常任务
   - 添加项目
   - 添加待办
   - 完成任务
   - 结束一天
   - 使用商店
   - 数据保存和恢复

2. **跑一遍完整流程**，记录任何bug

3. **备份当前可工作的版本**
   ```bash
   git add -A
   git commit -m "Baseline before refactoring"
   git tag v0-baseline
   ```

---

## 阶段2：提取核心功能 【第2-3周】

### 目标
把main.js的功能逐个提取到独立模块。

### 优先级排序

**最痛的问题优先：**
1. 任务管理（daily/project/todo）- 核心功能，最常用
2. 角色和统计 - 核心数据
3. UI对话框 - 被到处调用
4. 商店系统 - 已经有shop.js，继续完善

### 任务2.1：提取任务管理

创建 `scripts/core/task-manager.js`：

```javascript
class TaskManager {
    constructor(stateManager) {
        this.state = stateManager;
    }
    
    // 日常任务
    addDailyTask(task) { ... }
    updateDailyTask(id, updates) { ... }
    completeDailyTask(id, actualTime, quality) { ... }
    
    // 项目
    addProject(project) { ... }
    completeProjectMilestone(projectId) { ... }
    
    // 待办
    addTodo(todo) { ... }
    completeTodo(id, actualTime, quality) { ... }
}
```

**迁移步骤：**
1. 创建新文件，实现功能
2. 在index.html引入
3. 在main.js里逐个替换函数调用
4. 测试每个替换
5. 删除main.js里的旧函数

### 任务2.2：提取对话框系统

创建 `scripts/ui/dialog.js`：

```javascript
class DialogManager {
    show(content) { ... }
    close() { ... }
    confirm(message, onConfirm) { ... }
    prompt(message, defaultValue) { ... }
}
```

### 任务2.3：提取角色系统

创建 `scripts/core/character.js`：

```javascript
class Character {
    constructor(data) { ... }
    updateStats(changes) { ... }
    consumeEnergy(amount) { ... }
    consumeSpirit(amount) { ... }
    addResource(type, amount) { ... }
}
```

---

## 阶段3：清理垃圾 【第4周】

### 目标
删除重复代码、备份文件、无用代码。

### 任务

1. **删除备份文件**
   ```bash
   rm scripts/main.js.backup
   rm -rf backup/
   rm 火柴人时间管理器_备份_*.json
   ```

2. **清理destiny_clock**
   
   保留最好的scoring系统，删除其他4个：
   ```bash
   cd destiny_clock
   # 评估哪个最好，假设是professional_scoring_system.py
   rm comprehensive_scoring_system.py
   rm enhanced_scoring_system.py
   rm enhanced_layered_scoring.py
   rm layered_scoring_system.py
   ```

3. **删除未使用的函数**
   
   在main.js里搜索每个函数的调用：
   ```bash
   grep -r "functionName" scripts/
   ```
   
   如果没有调用，删除它。

4. **合并重复代码**
   
   如果发现两个函数做同样的事，只保留一个。

---

## 阶段4：隔离子系统 【第5-6周】

### 目标
把destiny_clock彻底独立化。

### 方案

**当前问题：**
```
Happy火柴人_0327/
├── server.py (混合了两个系统)
├── destiny_clock/ (33个Python文件)
└── scripts/main.js (调用destiny_clock API)
```

**重构后：**
```
Happy火柴人_0327/
├── app/
│   ├── server.py (只服务火柴人时间管理器)
│   ├── index.html
│   └── scripts/
└── destiny_clock/
    ├── server.py (独立的命理分析服务)
    ├── api.py
    └── ...
```

### 迁移步骤

1. **拆分server.py**
   
   创建 `destiny_clock/api_server.py`：
   ```python
   # 独立的命理分析API服务器
   # 运行在不同端口（如8001）
   ```

2. **修改主server.py**
   
   移除destiny_clock相关代码，改为代理请求：
   ```python
   if path.startswith('/api/destiny'):
       # 代理到localhost:8001
       proxy_to_destiny_clock()
   ```

3. **测试两个服务器独立运行**

4. **更新文档**
   
   说明如何同时启动两个服务。

---

## 阶段5：最终优化 【第7-8周】

### 目标
- main.js从5707行减少到<1000行
- 所有功能模块化
- 代码可维护

### 检查清单

- [ ] main.js < 1000行
- [ ] 没有超过300行的文件
- [ ] 没有备份文件
- [ ] 没有重复的功能实现
- [ ] 所有模块有清晰的接口
- [ ] state通过StateManager访问
- [ ] 存储通过StorageManager管理
- [ ] 用户数据可以正常迁移

---

## 每日工作流程

### 重构一个函数的标准流程

1. **选择目标**：从main.js选一个函数
2. **理解功能**：读懂它在干什么
3. **写新实现**：在合适的模块里实现
4. **添加兼容层**：在main.js里调用新实现
5. **测试**：手动测试这个功能
6. **提交**：`git commit -m "Extract XXX to module YYY"`
7. **重复**

### 每天的目标

- 提取3-5个函数
- 减少main.js 50-100行
- 不要贪多，稳步前进

---

## 回滚计划

如果重构出问题了怎么办？

1. **立即停止**
2. **回到上一个git commit**：
   ```bash
   git reset --hard HEAD~1
   ```
3. **分析问题**
4. **用更小的步骤重试**

---

## 成功标准

### 定量指标
- main.js从5707行降到<1000行（减少83%）
- 模块文件数量：15-20个
- 每个模块<300行
- destiny_clock完全独立

### 定性指标
- 添加新功能时不再害怕
- 能在5分钟内找到任何功能的代码
- 新同事可以在1天内理解架构
- 没有"不敢动"的代码

---

## 务实建议

### ✅ 做什么

1. **每天提交代码**：小步快跑
2. **保持应用可运行**：任何时候都能启动
3. **优先删除代码**：删掉的代码不会产生bug
4. **遇到不懂的代码，先跳过**：不要在一个地方卡太久

### ❌ 不做什么

1. **不要大爆炸重写**：不要想"我重写一遍"
2. **不要追求完美**：工作的代码比完美的代码重要
3. **不要改变功能行为**：重构不改变行为
4. **不要修复无关bug**：重构就是重构，改bug另开分支

---

## 时间估算

- **阶段0**：1天（今天）
- **阶段1**：1周（建立测试基础）
- **阶段2**：2周（提取核心模块）
- **阶段3**：1周（清理垃圾）
- **阶段4**：2周（隔离子系统）
- **阶段5**：2周（最终优化）

**总计：8周，每天工作2-3小时**

如果只有周末时间，那就是16周（4个月）。

---

## 第一个里程碑：本周末目标

### 今天（周六）
- [x] 创建REFACTORING_PLAN.md
- [ ] 修改index.html，引入storage.js和state-manager.js
- [ ] 修改main.js，添加兼容层
- [ ] 测试应用是否正常工作

### 明天（周日）
- [ ] 创建MANUAL_TEST.md测试清单
- [ ] 完整跑一遍应用，记录所有功能
- [ ] Git commit所有改动
- [ ] 创建baseline tag

**目标**：周末结束时，有一个可工作的带版本化存储的应用。

---

**记住Linus的话："Don't break userspace. Every single time."**

用户的数据比你的代码更重要。

