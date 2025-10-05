# 🧪 里程碑完成功能测试

**目标：** 验证迁移到TaskManager的completeMilestone功能正常工作

**测试日期：** 2025-10-05  
**迁移函数：** `completeMilestone(projectId)` → `TaskManager.completeMilestone()`

---

## 前置条件

1. ✅ 服务器运行中：http://localhost:8000
2. ✅ 自动测试已通过（30/30）
3. ✅ 基础功能正常（add/delete任务）

---

## 🎯 测试场景1：创建带里程碑的项目

### 步骤
1. 打开主应用：http://localhost:8000/
2. 点击"项目管理"
3. 点击"添加项目"
4. 填写项目信息：
   ```
   项目名称：测试项目_Linus
   截止日期：明天的日期
   每日时间：1小时
   重要性：高
   兴趣度：高
   ```
5. 添加3个里程碑：
   ```
   节点1：需求分析 - 今天
   节点2：开发实现 - 明天
   节点3：测试上线 - 后天
   ```
6. 点击"添加"

### 预期结果
- ✅ 项目出现在列表中
- ✅ 显示"节点1: 需求分析"
- ✅ 控制台log：`[TaskManager] Project added: 测试项目_Linus`

### 检查localStorage
开发者工具 → Application → LocalStorage → `matchstickTimeManager`
- ✅ `projects`数组包含新项目
- ✅ `milestones`数组有3个元素
- ✅ `currentMilestone = 0`（第一个节点）

**实际结果：** _____________

---

## 🎯 测试场景2：完成第一个里程碑

### 步骤
1. 在项目列表中找到"测试项目_Linus"
2. 点击项目（或点击"开始"按钮）
3. 应该看到当前节点："需求分析"
4. 点击"完成节点"或类似按钮

### 预期结果
- ✅ 出现"节点完成！"对话框
- ✅ 显示：
  ```
  完成了"需求分析"！
  获得火苗：XX（应该是40的倍数）
  获得木屑：60
  消耗体力：XX
  消耗/恢复精力：XX（高兴趣应该恢复精力）
  ```
- ✅ 控制台log：
  ```
  [TaskManager] Milestone completed: 需求分析
  energyCost: XX
  spiritCost: -20（高兴趣）
  projectComplete: false
  ```

### 检查localStorage
- ✅ `project.currentMilestone = 1`（推进到第2个）
- ✅ `milestones[0].completed = true`
- ✅ `milestones[0].completedAt` 有时间戳
- ✅ `milestones[0].timeSpent` 有数值（小时）
- ✅ `stats.flame` 增加了
- ✅ `stats.sawdust` 增加了60
- ✅ `stats.energy` 减少了
- ✅ `stats.spirit` 增加了（因为高兴趣）

### 检查UI
- ✅ 项目列表中该项目显示"节点2: 开发实现"（下一个节点）
- ✅ 项目未标记为完成

**实际结果：** _____________

---

## 🎯 测试场景3：完成第二个里程碑

### 步骤
1. 再次点击该项目
2. 确认当前节点是"开发实现"
3. 点击"完成节点"

### 预期结果
- ✅ 再次出现"节点完成！"对话框
- ✅ 奖励：火苗40倍数、木屑60
- ✅ `project.currentMilestone = 2`
- ✅ `milestones[1].completed = true`

**实际结果：** _____________

---

## 🎯 测试场景4：完成最后一个里程碑（项目完成）

### 步骤
1. 再次点击该项目
2. 确认当前节点是"测试上线"（最后一个）
3. 点击"完成节点"

### 预期结果 ⚠️ **关键测试**
- ✅ 出现"恭喜！项目完成！"对话框（不同于节点完成）
- ✅ 显示：
  ```
  完成了"测试项目_Linus"的所有节点！
  获得火苗：XX（应该是100的倍数，比节点多）
  获得木屑：200（比节点的60多得多）
  消耗体力：XX
  消耗/恢复精力：XX
  ```
- ✅ 控制台log：
  ```
  [TaskManager] Milestone completed: 测试上线
  energyCost: XX
  spiritCost: -20
  projectComplete: true  ← 注意这个！
  ```

### 检查localStorage
- ✅ `project.currentMilestone = 3`（等于milestones.length）
- ✅ `project.completedAt` 有时间戳
- ✅ `milestones[2].completed = true`
- ✅ `stats.flame` 增加了100+
- ✅ `stats.sawdust` 增加了200
- ✅ `logs` 包含"完成项目"日志

### 检查UI
- ✅ 项目在列表中标记为已完成
- ✅ 或移到"已完成"区域

**实际结果：** _____________

---

## 🎯 测试场景5：体力/精力不足

### 步骤
1. 创建另一个项目："耗时项目"
   - 每日时间：**8小时**（会消耗大量体力）
   - 兴趣度：**低**（会消耗精力）
   - 1个里程碑
2. 开始该项目
3. 点击"完成节点"

### 预期结果
- ⚠️ 如果体力或精力不足，应该弹出alert：
  ```
  "体力或精力不足，无法完成节点！"
  ```
- ✅ 里程碑不会被标记为完成
- ✅ 数据不会改变

**如何模拟低体力/精力：**
- 方法1：完成多个任务耗尽体力
- 方法2：在控制台手动修改：
  ```javascript
  window.state.stats.energy = 10;
  window.state.stats.spirit = 10;
  saveState();
  updateUI();
  ```

**实际结果：** _____________

---

## 🎯 测试场景6：数据持久化

### 步骤
1. 完成上述所有测试
2. **刷新页面（Cmd+R / Ctrl+R）**
3. 检查项目状态

### 预期结果
- ✅ "测试项目_Linus" 仍然显示为已完成
- ✅ 当前里程碑保持在正确位置
- ✅ 获得的火苗、木屑没有丢失
- ✅ 控制台log显示加载成功

**实际结果：** _____________

---

## 📊 测试总结

### 统计
```
场景1（创建项目）：    ☐ 通过 / ☐ 失败
场景2（完成节点1）：   ☐ 通过 / ☐ 失败
场景3（完成节点2）：   ☐ 通过 / ☐ 失败
场景4（项目完成）：    ☐ 通过 / ☐ 失败  ← 关键
场景5（资源不足）：    ☐ 通过 / ☐ 失败
场景6（数据持久化）：  ☐ 通过 / ☐ 失败

总计：___/6
```

### 发现的问题
1. _________________________________
2. _________________________________
3. _________________________________

---

## 🐛 如果失败了

### 常见问题排查

**问题1：点击"完成节点"没反应**
- 检查控制台有无错误
- 检查`getTaskManager()`是否返回了实例
- 检查`window.state.projects`是否有数据

**问题2：奖励不对**
- 节点完成应该是：木屑60、火苗40
- 项目完成应该是：木屑200、火苗100
- 检查`isProjectComplete`标志

**问题3：项目没有推进到下一个节点**
- 检查`project.currentMilestone`是否增加
- 检查localStorage是否保存了

**问题4：精力变化不对**
- 高兴趣应该恢复精力：spiritCost = -20
- 低兴趣应该消耗精力：spiritCost = 40
- 中等兴趣：spiritCost = 20

---

## 🔧 调试命令

### 在控制台运行

**查看当前项目状态：**
```javascript
const project = window.state.projects.find(p => p.name.includes('测试'));
console.log('Project:', project);
console.log('Current milestone:', project.currentMilestone);
console.log('Milestones:', project.milestones);
```

**查看TaskManager数据：**
```javascript
const tm = getTaskManager();
const projects = tm.getProjects();
console.log('TaskManager projects:', projects);
```

**手动完成里程碑（测试）：**
```javascript
const tm = getTaskManager();
const project = tm.getProjects().find(p => p.name.includes('测试'));
const result = tm.completeMilestone(project.id, 3600); // 1小时 = 3600秒
console.log('Result:', result);
```

---

## ✅ 全部通过后

如果所有测试都通过：

```bash
git add -A
git commit -m "Test: completeMilestone verified - All scenarios passed

Tested scenarios:
1. Create project with milestones ✅
2. Complete first milestone ✅
3. Complete middle milestone ✅
4. Complete last milestone (project complete) ✅
5. Resource insufficiency check ✅
6. Data persistence ✅

All milestone logic works correctly:
- Time tracking
- Energy/spirit calculation
- Reward calculation (60/40 vs 200/100)
- Project completion detection
- Data persistence

Ready to continue migration.

Linus says: 'Tested. Works. Ship it.'"
```

---

**现在开始测试吧！** 🚀

按照场景1-6依次测试，记录结果。

**有问题随时告诉我！** 🐛
