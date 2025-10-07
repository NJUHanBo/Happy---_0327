# 重构计划：提取Dialog系统

## 📊 当前状态分析

### Dialog使用情况
```javascript
main.js中：
- showDialog() 核心函数（第594行）
- closeDialog() 关闭函数（第648行）
- 被调用30+次（遍布整个文件）

问题：
❌ 每个对话框都是手写HTML字符串
❌ 重复代码多
❌ 难以维护和修改样式
❌ 没有统一的API
```

### 目标
```javascript
创建：scripts/ui/dialog.js
减少代码：600-800行
提升质量：统一API，易于维护
时间：2-3小时
风险：低（UI逻辑独立）
```

---

## 🎯 设计方案

### 新的Dialog API

```javascript
// dialog.js
class DialogManager {
    // 基础对话框
    show(options) {
        // options: { title, content, buttons, sidebar }
    }
    
    // 表单对话框（最常用）
    showForm(options) {
        // options: { title, fields, onSubmit, sidebar }
    }
    
    // 确认对话框
    showConfirm(options) {
        // options: { title, message, onConfirm, onCancel }
    }
    
    // 信息对话框
    showInfo(options) {
        // options: { title, message }
    }
    
    // 任务列表对话框（特殊）
    showWithTaskList(options) {
        // options: { content, taskType }
    }
    
    // 关闭
    close() {
        // 关闭当前对话框
    }
}
```

---

## 📋 执行步骤

### 第1步：创建Dialog模块（30分钟）

创建 `scripts/ui/dialog.js`

```javascript
// ===================================
// Dialog Manager - 统一对话框管理
// ===================================

class DialogManager {
    constructor() {
        this.container = null;
        this.currentDialog = null;
    }
    
    init() {
        this.container = document.getElementById('dialog-container');
        if (!this.container) {
            console.error('[Dialog] Container not found');
        }
    }
    
    // 显示基础对话框
    show(options = {}) {
        const {
            title = '',
            content = '',
            buttons = [],
            sidebar = null,
            className = ''
        } = options;
        
        let buttonsHtml = '';
        if (buttons.length > 0) {
            buttonsHtml = `
                <div class="dialog-buttons">
                    ${buttons.map(btn => `
                        <button 
                            class="${btn.className || ''}"
                            onclick="${btn.onClick}"
                        >${btn.text}</button>
                    `).join('')}
                </div>
            `;
        }
        
        let sidebarHtml = '';
        if (sidebar) {
            sidebarHtml = `
                <div class="dialog-sidebar">
                    ${sidebar}
                </div>
            `;
        }
        
        this.container.innerHTML = `
            <div class="dialog ${className}">
                <button class="dialog-close" onclick="DialogManager.close()">×</button>
                <div class="dialog-main">
                    ${title ? `<h2>${title}</h2>` : ''}
                    ${content}
                    ${buttonsHtml}
                </div>
                ${sidebarHtml}
            </div>
        `;
        
        this.container.classList.remove('hidden');
        this.currentDialog = options;
    }
    
    // 显示表单对话框
    showForm(options = {}) {
        const {
            title,
            description,
            fields = [],
            onSubmit,
            onCancel,
            sidebar
        } = options;
        
        const fieldsHtml = fields.map(field => {
            switch(field.type) {
                case 'text':
                case 'number':
                case 'date':
                case 'time':
                    return `
                        <div class="form-group">
                            <label for="${field.id}">${field.label}：</label>
                            <input 
                                type="${field.type}" 
                                id="${field.id}" 
                                placeholder="${field.placeholder || ''}"
                                ${field.min ? `min="${field.min}"` : ''}
                                ${field.max ? `max="${field.max}"` : ''}
                                ${field.step ? `step="${field.step}"` : ''}
                                ${field.value ? `value="${field.value}"` : ''}
                            >
                        </div>
                    `;
                
                case 'select':
                    return `
                        <div class="form-group">
                            <label for="${field.id}">${field.label}：</label>
                            <select id="${field.id}">
                                ${field.options.map(opt => `
                                    <option value="${opt.value}">${opt.text}</option>
                                `).join('')}
                            </select>
                        </div>
                    `;
                
                case 'textarea':
                    return `
                        <div class="form-group">
                            <label for="${field.id}">${field.label}：</label>
                            <textarea 
                                id="${field.id}" 
                                placeholder="${field.placeholder || ''}"
                                rows="${field.rows || 3}"
                            >${field.value || ''}</textarea>
                        </div>
                    `;
                
                default:
                    return '';
            }
        }).join('');
        
        const content = `
            ${description ? `<p>${description}</p>` : ''}
            ${fieldsHtml}
        `;
        
        const buttons = [
            {
                text: '提交',
                onClick: onSubmit,
                className: 'btn-primary'
            },
            {
                text: '取消',
                onClick: onCancel || 'DialogManager.close()',
                className: 'btn-secondary'
            }
        ];
        
        this.show({
            title,
            content,
            buttons,
            sidebar
        });
    }
    
    // 显示确认对话框
    showConfirm(options = {}) {
        const {
            title = '确认',
            message,
            onConfirm,
            onCancel
        } = options;
        
        this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: '确认',
                    onClick: onConfirm,
                    className: 'btn-primary'
                },
                {
                    text: '取消',
                    onClick: onCancel || 'DialogManager.close()',
                    className: 'btn-secondary'
                }
            ]
        });
    }
    
    // 显示信息对话框
    showInfo(options = {}) {
        const {
            title = '提示',
            message
        } = options;
        
        this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: '知道了',
                    onClick: 'DialogManager.close()',
                    className: 'btn-primary'
                }
            ]
        });
    }
    
    // 关闭对话框
    close() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.currentDialog = null;
        }
    }
    
    // 静态方法（向后兼容）
    static close() {
        if (window.dialogManager) {
            window.dialogManager.close();
        }
    }
}

// 初始化全局实例
window.dialogManager = new DialogManager();

// 兼容旧代码
function closeDialog() {
    DialogManager.close();
}
```

### 第2步：在index.html中引入（5分钟）

```html
<!-- 在main.js之前添加 -->
<script src="scripts/ui/dialog.js"></script>
```

### 第3步：初始化DialogManager（5分钟）

在main.js的initializeApp()中添加：

```javascript
function initializeApp() {
    // ... 现有代码 ...
    
    // 初始化Dialog管理器
    if (window.dialogManager) {
        window.dialogManager.init();
        console.log('[Refactoring] DialogManager initialized');
    }
    
    // ... 其余代码 ...
}
```

### 第4步：逐步迁移（60-90分钟）

#### 优先级1：简单对话框（20分钟）

替换所有简单的showDialog()调用：

```javascript
// 旧代码：
showDialog(`
    <h2>提示</h2>
    <p>这是一条消息</p>
    <div class="dialog-buttons">
        <button onclick="closeDialog()">知道了</button>
    </div>
`);

// 新代码：
dialogManager.showInfo({
    title: '提示',
    message: '这是一条消息'
});
```

#### 优先级2：表单对话框（40分钟）

替换所有表单类对话框：

```javascript
// 旧代码：showAddTodosDialog()
showDialog(`
    <h2>添加待办事项</h2>
    <p>让我们添加需要一周内完成的事项</p>
    <div class="form-group">
        <label for="todo-name">事项名称：</label>
        <input type="text" id="todo-name" placeholder="例如：办签证、给猫洗澡">
    </div>
    // ... 更多字段 ...
    <div class="dialog-buttons">
        <button onclick="addTodo()">添加事项</button>
        <button onclick="skipTodos()">暂不添加</button>
    </div>
`, true, 'todo');

// 新代码：
dialogManager.showForm({
    title: '添加待办事项',
    description: '让我们添加需要一周内完成的事项',
    fields: [
        {
            type: 'text',
            id: 'todo-name',
            label: '事项名称',
            placeholder: '例如：办签证、给猫洗澡'
        },
        {
            type: 'date',
            id: 'todo-deadline',
            label: '截止日期',
            min: new Date().toISOString().split('T')[0]
        },
        // ... 更多字段
    ],
    onSubmit: 'addTodo()',
    onCancel: 'skipTodos()'
});
```

#### 优先级3：确认对话框（20分钟）

```javascript
// 旧代码：
if (confirm('确定要删除吗？')) {
    // 执行删除
}

// 新代码：
dialogManager.showConfirm({
    title: '确认删除',
    message: '确定要删除这个任务吗？此操作不可恢复。',
    onConfirm: 'confirmDelete(id)'
});
```

### 第5步：测试（20分钟）

- [ ] 所有对话框正常显示
- [ ] 表单提交正常工作
- [ ] 关闭按钮正常
- [ ] 任务列表侧边栏正常
- [ ] 样式保持一致

### 第6步：清理（10分钟）

- 删除main.js中旧的showDialog实现
- 删除重复的HTML模板字符串
- 统计减少的代码行数

---

## 📊 预期成果

### 代码减少
```
main.js: 5941行 → 5200-5300行
减少: 600-800行

新增:
scripts/ui/dialog.js: ~300行

净减少: 300-500行
```

### 质量提升
- ✅ 统一的Dialog API
- ✅ 更易维护
- ✅ 更易测试
- ✅ 更易扩展（如添加动画、验证等）

### 向后兼容
- ✅ closeDialog()保留
- ✅ 现有功能100%保持
- ✅ 逐步迁移，不影响稳定性

---

## ⚠️ 注意事项

### 迁移策略
1. **先新增，后删除** - 保持旧代码直到新代码稳定
2. **小批量迁移** - 每次迁移5-10个对话框
3. **频繁测试** - 每迁移一批就测试
4. **保留fallback** - 临时保留showDialog()

### 风险控制
- 🟢 低风险：UI逻辑相对独立
- ⚠️ 注意：onclick事件字符串需要仔细处理
- ⚠️ 注意：侧边栏taskList需要特殊处理

---

## 🚀 执行时间表

```
总时间：2-3小时

第1步：创建模块 (30分钟)
  ↓
第2步：引入HTML (5分钟)
  ↓
第3步：初始化 (5分钟)
  ↓
测试：基础功能 (10分钟)
  ↓
第4步：迁移对话框 (60-90分钟)
  - 简单对话框 (20分钟)
  - 表单对话框 (40分钟)
  - 确认对话框 (20分钟)
  ↓
第5步：完整测试 (20分钟)
  ↓
第6步：清理 (10分钟)
  ↓
Git提交
```

---

## 🎓 Linus的建议

### 做对的事
1. **小步快跑** - 每迁移几个对话框就commit
2. **保持兼容** - 新旧代码共存，逐步替换
3. **频繁测试** - 每步都确认功能正常
4. **简单优先** - 先迁移简单的，复杂的后做

### 避免的坑
1. ❌ **一次迁移所有** - 容易出错
2. ❌ **删除旧代码太早** - 不安全
3. ❌ **过度设计** - DialogManager不要太复杂
4. ❌ **忽略边界情况** - taskList侧边栏等特殊情况

---

## 准备好了吗？

**我建议：**

### 立即开始（推荐）
告诉我："Linus，开始提取Dialog系统"
- 我会创建dialog.js
- 逐步迁移
- 频繁测试
- 2-3小时完成

### 先看看其他选项
如果你想先看看其他重构选项，也可以：
- TaskManager完整迁移
- Timer模块提取
- Stats模块提取

---

**你的选择？** 🔥


