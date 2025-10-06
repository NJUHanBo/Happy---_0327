# TaskManager迁移进度

**目标：** 将main.js中41个任务函数迁移到使用TaskManager API

**当前进度：** 20/41 (49%)

---

## ✅ 已迁移 (20个)

### 日常任务 (7/~14)
- [x] `confirmDeleteDailyTask()` → TaskManager.deleteDailyTask()
- [x] `addDailyTask()` → TaskManager.addDailyTask()
- [x] `editDailyTask()` → TaskManager.getDailyTaskById() ✨ NEW
- [x] `saveEditedDailyTask()` → TaskManager.updateDailyTask()
- [x] `showDailyRoutine()` → TaskManager.getSortedDailyTasks()
- [x] `startDailyTask()` → TaskManager.getDailyTaskById()
- [ ] `completeDailyTask()` (UI only, no migration needed)
- [x] `finishDailyTask()` → TaskManager.completeDailyTask() (includes business logic)
- [ ] 其他...

### 项目 (5/~14)
- [x] `confirmDeleteProject()` → TaskManager.deleteProject()
- [x] `addProject()` → TaskManager.addProject()
- [x] `editProject()` → TaskManager.getProjectById() ✨ NEW
- [ ] `saveEditedProject()` (complex, deferred)
- [x] `startProject()` → TaskManager.getProjectById()
- [x] `showProjectDetails()` → TaskManager.getProjectById() ✨ NEW
- [ ] `completeProjectSession()`
- [ ] `finishProjectProgress()`
- [ ] 其他...

### 待办事项 (8/~13)
- [x] `addTodo()` → TaskManager.addTodo()
- [x] `deleteTodo()` → 新增UI函数 (显示确认对话框)
- [x] `confirmDeleteTodo()` → TaskManager.deleteTodo()
- [x] `editTodo()` → TaskManager.getTodoById() ✨ NEW
- [x] `saveEditedTodo()` → TaskManager.updateTodo()
- [x] `startTodo()` → TaskManager.getTodoById()
- [ ] `completeTodo()` (UI only, no migration needed)
- [x] `finishTodo()` → TaskManager.completeTodo() (includes business logic)
- [ ] 其他...

---

## 📊 统计

```
已迁移：20个函数 (49%)
待迁移：21个函数 (51%)
估算减少行数：每10个函数 ~80-120行
总预期减少：~300-430行（当全部迁移完成）
当前已减少：~190-230行
新增功能：待办事项编辑/删除 (4个函数，~120行)
新增查询方法：
  - getSortedDailyTasks()
  - getDailyTaskById()
  - getProjectById()
  - getTodoById()
本轮新增：4个函数使用getById (editTodo, editDailyTask, editProject, showProjectDetails)
```

---

## 🎯 下一批迁移计划

### 第3批：项目操作（当前推荐）
迁移项目相关的执行和查询函数：
- `completeProjectMilestone()`
- `startProject()` / `completeProjectSession()`
- `showProjectDetails()` related functions

**预计：** 4-6个函数，减少50-70行

### 已跳过（复杂，需单独处理）
- ⏸️ `editProject()` + `saveEditedProject()` - 里程碑逻辑复杂，需单独重构
- ⏸️ Timer相关函数 - 涉及全局timerState，需单独重构

### 第3批：任务执行流程
迁移开始、暂停、恢复、完成相关函数：
- `startDailyTask()`, `completeDailyTask()`, `finishDailyTask()`
- `startProject()`, `completeProjectSession()`, `finishProjectProgress()`
- `startTodo()`, `completeTodo()`, `finishTodo()`

**预计：** 9个函数，减少100-150行

### 第4批：显示和查询
迁移显示函数，这些可能需要更多重构：
- `showDailyRoutine()`
- `showProjectManager()`
- `showTodoMaster()`
- `showProjectDetails()`

**预计：** 4个函数，减少50-80行

---

## 💡 迁移模式

### 标准模式（当前使用）
```javascript
// 旧代码：
function someFunction() {
    state.dailyTasks.push(task);
    saveState();
}

// 新代码：
// [Refactored] Now uses TaskManager
function someFunction() {
    const tm = getTaskManager();
    if (tm) {
        tm.addDailyTask(task);
    } else {
        // Fallback to old method
        state.dailyTasks.push(task);
    }
    saveState();
}
```

### 优点
- ✅ 向后兼容（有fallback）
- ✅ 逐步迁移（不破坏现有功能）
- ✅ 易于追踪（有[Refactored]标记）
- ✅ 可随时回滚

---

## 🚀 执行策略

### Linus的原则
1. **小步快跑** - 每次迁移5-10个函数
2. **频繁提交** - 每批迁移都commit
3. **保持可用** - 每次提交后应用仍可运行
4. **先易后难** - CRUD → 执行流程 → 显示逻辑

### 当前阶段
```
Phase 1: CRUD操作        ████████░░░░░░░░░░░░  20%  ← 当前
Phase 2: 执行流程        ████░░░░░░░░░░░░░░░░   5%
Phase 3: 显示逻辑        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: 清理旧代码      ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 📝 迁移检查清单

每个函数迁移后检查：
- [ ] 函数添加`[Refactored]`注释
- [ ] 使用`getTaskManager()`获取实例
- [ ] 有fallback到旧逻辑
- [ ] 测试功能正常工作
- [ ] Git commit

---

## 🎓 经验教训

### 已发现的问题
1. ✅ 字段名不一致：
   - main.js用`duration`，TaskManager用`dailyTime`
   - main.js用`duration`，TaskManager用`estimatedTime`（todo）
   - 需要在迁移时转换

2. ✅ ID生成：
   - 旧代码：`Date.now()`
   - TaskManager：自动生成
   - 需要处理fallback情况

### 解决方案
- 在调用TaskManager前统一字段名
- Fallback路径保持旧逻辑不变
- 文档化所有差异

---

## 📈 预期收益

### 完成所有迁移后
```
main.js减少：      ~300-430行
代码重复：        大幅减少
可维护性：        显著提升
测试难度：        降低（集中逻辑）
```

### 中期收益（完成CRUD）
```
main.js减少：      ~100-150行
进度：            30-40%完成
信心：            建立
```

---

## 🔄 持续更新

每完成一批迁移，更新此文档：
- 更新进度百分比
- 标记已完成函数
- 记录发现的问题
- 调整后续计划

**上次更新：** 2025-10-05  
**下次计划：** 继续迁移项目相关函数 / 或继续简单CRUD

