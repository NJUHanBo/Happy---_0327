# 🧪 迁移功能手动测试清单

**目标：** 确保迁移到TaskManager的8个函数都能正常工作

**测试日期：** 2025-10-05  
**测试人员：** Linus + 你

---

## 🚦 快速状态

- [ ] 自动测试通过
- [ ] 日常任务CRUD测试通过
- [ ] 待办事项测试通过
- [ ] 数据持久化正常

---

## 1️⃣ 自动测试（5分钟）

### 步骤
```bash
# 确保服务器运行
lsof -ti:8000

# 打开测试页面
open http://localhost:8000/verify-refactoring.html
```

### 预期结果
- ✅ 所有测试通过（绿色）
- ✅ 没有红色失败项
- ⚠️ 警告可以接受

**实际结果：** _________

---

## 2️⃣ 日常任务 - 添加测试

### 步骤
1. 打开主应用：http://localhost:8000/
2. 点击"日常任务管理"
3. 点击"添加日常任务"
4. 填写：
   - 名称：`测试任务_Linus`
   - 时长：`30`分钟
   - 重要性：`高`
   - 兴趣度：`低`
5. 点击"添加"

### 预期结果
- ✅ 任务出现在列表中
- ✅ 名称、时长正确显示
- ✅ 控制台有log：`[TaskManager] Daily task added: 测试任务_Linus`

### 检查localStorage
打开开发者工具 → Application → LocalStorage → `matchstickTimeManager`
- ✅ `dailyTasks`数组包含新任务
- ✅ 任务有`id`, `createdAt`字段

**实际结果：** _________

---

## 3️⃣ 日常任务 - 编辑测试

### 步骤
1. 找到刚添加的`测试任务_Linus`
2. 点击"编辑"
3. 修改名称为：`测试任务_Linus_已编辑`
4. 点击"保存"

### 预期结果
- ✅ 任务名称更新为新名称
- ✅ 控制台有log：`[TaskManager] Daily task updated`
- ✅ localStorage中任务名称已更新

**实际结果：** _________

---

## 4️⃣ 日常任务 - 删除测试

### 步骤
1. 找到`测试任务_Linus_已编辑`
2. 点击"删除"
3. 确认删除

### 预期结果
- ✅ 任务从列表消失
- ✅ 控制台有log：`[TaskManager] Daily task deleted`
- ✅ localStorage中任务已移除

**实际结果：** _________

---

## 5️⃣ 日常任务 - 完成测试（重要！）

### 步骤
1. 添加一个新任务：
   - 名称：`完成测试`
   - 时长：`5`分钟
   - 重要性：`高`
   - 兴趣度：`高`
2. 开始任务
3. 等待几秒（不用等5分钟）
4. 点击"完成"
5. 给自己打分：`5`星
6. 确认完成

### 预期结果
- ✅ 出现奖励结算对话框
- ✅ 显示获得木屑和火苗
- ✅ 显示连续天数：`1天`
- ✅ 控制台有log：
  - `[TaskManager] Daily task completed: 完成测试`
  - `streak: 1`
  - `reward: XX`
- ✅ localStorage中：
  - `task.completedTimes = 1`
  - `task.streakDays = 1`
  - `task.lastCompleted` 是今天日期
  - `stats.sawdust` 增加
  - `stats.flame` 增加

**实际结果：** _________

---

## 6️⃣ 待办事项 - 添加测试

### 步骤
1. 点击"待办事项"
2. 点击"添加待办"
3. 填写：
   - 名称：`测试待办_Linus`
   - 预计时长：`1`小时
4. 点击"添加"

### 预期结果
- ✅ 待办出现在列表中
- ✅ 控制台有log：`[TaskManager] Todo added: 测试待办_Linus`

**实际结果：** _________

---

## 7️⃣ 待办事项 - 完成测试（重要！）

### 步骤
1. 开始`测试待办_Linus`
2. 等待几秒
3. 点击"完成"
4. 给自己打分：`4`星
5. 确认完成

### 预期结果
- ✅ 出现奖励结算对话框
- ✅ 显示获得火苗
- ✅ 显示消耗精力和体力
- ✅ 控制台有log：
  - `[TaskManager] Todo completed: 测试待办_Linus`
  - `baseFlameReward: XX`
  - `energyCost: XX`
  - `spiritCost: 20` (1小时对应20精力)
- ✅ localStorage中：
  - `todo.completed = true`
  - `todo.satisfaction = 4`
  - `stats.flame` 增加
  - `stats.energy` 减少
  - `stats.spirit` 减少

**实际结果：** _________

---

## 8️⃣ 项目 - 添加测试

### 步骤
1. 点击"项目管理"
2. 点击"添加项目"
3. 填写：
   - 名称：`测试项目_Linus`
   - 截止日期：明天
   - 每日时间：`1`小时
   - 添加1个里程碑：`测试节点`
4. 点击"添加"

### 预期结果
- ✅ 项目出现在列表中
- ✅ 控制台有log：`[TaskManager] Project added: 测试项目_Linus`

**实际结果：** _________

---

## 9️⃣ 项目 - 删除测试

### 步骤
1. 找到`测试项目_Linus`
2. 点击"删除"
3. 确认删除

### 预期结果
- ✅ 项目从列表消失
- ✅ 控制台有log：`[TaskManager] Project deleted`

**实际结果：** _________

---

## 🔟 数据持久化测试

### 步骤
1. 完成上述所有测试
2. **刷新页面（Ctrl+R / Cmd+R）**
3. 检查数据是否还在

### 预期结果
- ✅ 所有任务、待办、项目都还在
- ✅ 统计数据（火苗、木屑、精力）正确
- ✅ 控制台有log：
  - `[Refactoring] Using StorageManager`
  - `[Refactoring] State loaded successfully`

**实际结果：** _________

---

## 📊 测试总结

### 统计
```
通过：___/10
失败：___/10
```

### 发现的问题
1. _________________________________
2. _________________________________
3. _________________________________

### 需要修复的
- [ ] _________________________________
- [ ] _________________________________

---

## ✅ 全部通过后

如果所有测试都通过：

```bash
# 提交测试通过的状态
git add -A
git commit -m "Test: Verify 8 migrated functions - All tests passed

Manual testing completed:
- Daily task CRUD ✅
- Daily task completion with streak calculation ✅
- Todo CRUD ✅
- Todo completion with energy calculation ✅
- Project CRUD ✅
- Data persistence ✅

Linus says: 'Tests passed. Code works. Ship it.'"
```

---

## 🐛 如果有失败

1. **不要慌张** - Linus也要调试3次才搞定状态同步
2. **记录错误** - 截图、console log、localStorage数据
3. **隔离问题** - 是哪个函数？哪个步骤？
4. **回滚测试** - `git log --oneline`，找到上一个可用版本
5. **重新修复** - 小改动，频繁测试

---

## 💡 调试技巧

### 查看TaskManager状态
```javascript
// 在控制台运行
const tm = getTaskManager();
console.log('Daily Tasks:', tm.getDailyTasks());
console.log('Todos:', tm.getTodos());
console.log('Projects:', tm.getProjects());
```

### 查看全局状态
```javascript
console.log('window.state:', window.state);
console.log('Daily tasks:', window.state?.dailyTasks);
```

### 对比localStorage
```javascript
const stored = JSON.parse(localStorage.getItem('matchstickTimeManager'));
console.log('Stored data:', stored);
```

---

**Linus说：**
> "Test everything. Trust nothing. When tests pass, celebrate. When tests fail, debug. It's that simple."

**开始测试吧！** 🚀
