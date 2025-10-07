# Dialog系统测试 - 第一批迁移

**测试时间：** 2025-10-07  
**Git commit：** 8ae7cd9  
**已迁移：** 5个对话框

---

## 📋 测试清单

### 基础设施
- [ ] 应用正常启动
- [ ] 控制台无错误
- [ ] DialogManager已初始化

### 已迁移的对话框

#### 1. 任务统计 (showStats)
- [ ] 点击"任务统计"按钮
- [ ] 对话框正常显示
- [ ] 统计数据正确
- [ ] 关闭按钮工作

#### 2. 回顾日志 (showLogs)
- [ ] 点击"查看日志"按钮
- [ ] 对话框正常显示
- [ ] 日志分组显示正确
- [ ] 今日统计正确
- [ ] 关闭按钮工作

#### 3. 退出确认
- [ ] 点击"退出"按钮
- [ ] 确认对话框显示
- [ ] "确定退出"按钮正常
- [ ] "取消"按钮正常

#### 4. 玩法建议
- [ ] 点击"玩法建议"按钮
- [ ] 提示列表显示正常
- [ ] 关闭按钮工作

#### 5. 状态不足提示
- [ ] 体力/精力不足时
- [ ] 提示对话框显示
- [ ] 消息内容正确
- [ ] 按钮工作

---

## 🔍 测试方法

### 打开应用
```bash
open index.html
# 或
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

### 查看控制台
按 `F12` 或 `Cmd+Option+I`

应该看到：
```
[Dialog] DialogManager class and instance created
[Refactoring] DialogManager initialized
```

### 测试每个对话框
按照上面的清单逐一测试

---

## ⚠️ 可能的问题

### 问题1：DialogManager未定义
**症状：** 控制台报错 `dialogManager is not defined`

**解决：**
1. 检查 `scripts/ui/dialog.js` 是否加载
2. 检查加载顺序（必须在main.js之前）
3. 刷新页面

### 问题2：对话框不显示
**症状：** 点击按钮无反应

**解决：**
1. 检查控制台错误
2. 确认 `dialogManager.init()` 已调用
3. 检查 `dialog-container` 元素存在

### 问题3：样式异常
**症状：** 对话框样式不对

**原因：** CSS类名不匹配

**解决：** 检查生成的HTML结构

---

## 📊 预期结果

### 控制台日志
```
[Dialog] DialogManager initialized
[Dialog] Dialog shown: 任务统计
[Dialog] Dialog closed
```

### 功能验证
- ✅ 所有对话框正常显示
- ✅ 按钮功能正常
- ✅ 样式保持一致
- ✅ 无JavaScript错误

---

## ✅ 测试完成标志

如果以上测试全部通过：
1. 在此文件勾选所有复选框
2. 继续迁移下一批对话框

如果有问题：
1. 记录错误信息
2. 修复后重新测试
3. Git commit修复

---

**现在打开应用，开始测试！** 🧪


