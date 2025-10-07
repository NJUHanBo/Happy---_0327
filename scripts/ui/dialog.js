// ========================================
// Dialog Manager - 统一对话框管理系统
// 重构日期: 2025-10-07
// 目标: 减少main.js代码量，统一对话框API
// ========================================

/**
 * DialogManager - 统一的对话框管理器
 * 
 * 功能：
 * - 提供统一的对话框API
 * - 自动处理HTML生成
 * - 支持多种对话框类型
 * - 向后兼容旧代码
 */
class DialogManager {
    constructor() {
        this.container = null;
        this.currentDialog = null;
    }
    
    /**
     * 初始化DialogManager
     * 在应用启动时调用
     */
    init() {
        this.container = document.getElementById('dialog-container');
        if (!this.container) {
            console.error('[Dialog] Container not found!');
            return false;
        }
        console.log('[Dialog] DialogManager initialized');
        return true;
    }
    
    /**
     * 显示基础对话框
     * @param {Object} options - 对话框选项
     * @param {string} options.title - 标题
     * @param {string} options.content - 内容HTML
     * @param {Array} options.buttons - 按钮数组
     * @param {string} options.sidebar - 侧边栏HTML
     * @param {string} options.className - 额外的CSS类名
     */
    show(options = {}) {
        const {
            title = '',
            content = '',
            buttons = [],
            sidebar = null,
            className = ''
        } = options;
        
        // 构建按钮HTML
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
        
        // 构建侧边栏HTML
        let sidebarHtml = '';
        if (sidebar) {
            sidebarHtml = `
                <div class="dialog-sidebar">
                    ${sidebar}
                </div>
            `;
        }
        
        // 渲染对话框
        this.container.innerHTML = `
            <div class="dialog ${className}">
                <button class="dialog-close" onclick="window.dialogManager.close()">×</button>
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
        
        console.log('[Dialog] Dialog shown:', title || 'Untitled');
    }
    
    /**
     * 显示表单对话框
     * @param {Object} options - 表单选项
     * @param {string} options.title - 标题
     * @param {string} options.description - 描述文本
     * @param {Array} options.fields - 表单字段数组
     * @param {string} options.onSubmit - 提交按钮的onclick
     * @param {string} options.onCancel - 取消按钮的onclick
     * @param {string} options.sidebar - 侧边栏HTML
     * @param {string} options.submitText - 提交按钮文字（默认"提交"）
     * @param {string} options.cancelText - 取消按钮文字（默认"取消"）
     */
    showForm(options = {}) {
        const {
            title,
            description,
            fields = [],
            onSubmit,
            onCancel,
            sidebar,
            submitText = '提交',
            cancelText = '取消'
        } = options;
        
        // 生成表单字段HTML
        const fieldsHtml = fields.map(field => {
            switch(field.type) {
                case 'text':
                case 'number':
                case 'date':
                case 'time':
                case 'email':
                case 'url':
                    return `
                        <div class="form-group">
                            <label for="${field.id}">${field.label}：</label>
                            <input 
                                type="${field.type}" 
                                id="${field.id}" 
                                placeholder="${field.placeholder || ''}"
                                ${field.min !== undefined ? `min="${field.min}"` : ''}
                                ${field.max !== undefined ? `max="${field.max}"` : ''}
                                ${field.step !== undefined ? `step="${field.step}"` : ''}
                                ${field.value !== undefined ? `value="${field.value}"` : ''}
                                ${field.required ? 'required' : ''}
                            >
                        </div>
                    `;
                
                case 'select':
                    return `
                        <div class="form-group">
                            <label for="${field.id}">${field.label}：</label>
                            <select id="${field.id}">
                                ${field.options.map(opt => `
                                    <option value="${opt.value}" ${opt.selected ? 'selected' : ''}>
                                        ${opt.text}
                                    </option>
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
                
                case 'checkbox':
                    return `
                        <div class="form-group">
                            <label>
                                <input 
                                    type="checkbox" 
                                    id="${field.id}"
                                    ${field.checked ? 'checked' : ''}
                                >
                                ${field.label}
                            </label>
                        </div>
                    `;
                
                default:
                    console.warn('[Dialog] Unknown field type:', field.type);
                    return '';
            }
        }).join('');
        
        // 构建内容
        const content = `
            ${description ? `<p>${description}</p>` : ''}
            ${fieldsHtml}
        `;
        
        // 构建按钮
        const buttons = [];
        if (onSubmit) {
            buttons.push({
                text: submitText,
                onClick: onSubmit,
                className: 'btn-primary'
            });
        }
        if (onCancel || true) { // 总是显示取消按钮
            buttons.push({
                text: cancelText,
                onClick: onCancel || 'window.dialogManager.close()',
                className: 'btn-secondary'
            });
        }
        
        this.show({
            title,
            content,
            buttons,
            sidebar
        });
    }
    
    /**
     * 显示确认对话框
     * @param {Object} options - 确认选项
     * @param {string} options.title - 标题
     * @param {string} options.message - 消息内容
     * @param {string} options.onConfirm - 确认按钮的onclick
     * @param {string} options.onCancel - 取消按钮的onclick
     * @param {string} options.confirmText - 确认按钮文字（默认"确认"）
     * @param {string} options.cancelText - 取消按钮文字（默认"取消"）
     */
    showConfirm(options = {}) {
        const {
            title = '确认',
            message,
            onConfirm,
            onCancel,
            confirmText = '确认',
            cancelText = '取消'
        } = options;
        
        this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: confirmText,
                    onClick: onConfirm,
                    className: 'btn-primary'
                },
                {
                    text: cancelText,
                    onClick: onCancel || 'window.dialogManager.close()',
                    className: 'btn-secondary'
                }
            ]
        });
    }
    
    /**
     * 显示信息对话框
     * @param {Object} options - 信息选项
     * @param {string} options.title - 标题
     * @param {string} options.message - 消息内容（可以是HTML）
     * @param {string} options.buttonText - 按钮文字（默认"知道了"）
     */
    showInfo(options = {}) {
        const {
            title = '提示',
            message,
            buttonText = '知道了'
        } = options;
        
        this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: buttonText,
                    onClick: 'window.dialogManager.close()',
                    className: 'btn-primary'
                }
            ]
        });
    }
    
    /**
     * 显示带任务列表侧边栏的对话框
     * @param {Object} options - 选项
     * @param {string} options.content - 主要内容HTML
     * @param {string} options.taskType - 任务类型: 'daily' | 'project' | 'todo'
     */
    showWithTaskList(options = {}) {
        const {
            content,
            taskType = ''
        } = options;
        
        let taskListHtml = '';
        
        if (taskType && window.state) {
            let tasks = [];
            let taskTitle = '';
            
            // 获取TaskManager（如果可用）
            const tm = window.getTaskManager ? window.getTaskManager() : null;
            
            switch(taskType) {
                case 'daily':
                    tasks = tm ? tm.getDailyTasks() : window.state.dailyTasks || [];
                    taskTitle = '已添加的日常任务';
                    break;
                case 'project':
                    tasks = tm ? tm.getProjects() : window.state.projects || [];
                    taskTitle = '已添加的项目';
                    break;
                case 'todo':
                    tasks = tm ? tm.getTodos() : window.state.todos || [];
                    taskTitle = '已添加的待办事项';
                    break;
            }
            
            taskListHtml = `
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
            `;
        }
        
        this.show({
            content,
            sidebar: taskListHtml
        });
    }
    
    /**
     * 关闭对话框
     */
    close() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.currentDialog = null;
            console.log('[Dialog] Dialog closed');
        }
    }
    
    /**
     * 获取当前对话框选项
     */
    getCurrentDialog() {
        return this.currentDialog;
    }
}

// ========================================
// 初始化全局实例
// ========================================

if (typeof window !== 'undefined') {
    window.DialogManager = DialogManager;
    window.dialogManager = new DialogManager();
    console.log('[Dialog] DialogManager class and instance created');
}

// ========================================
// 向后兼容：保留旧的closeDialog函数
// ========================================

function closeDialog() {
    if (window.dialogManager) {
        window.dialogManager.close();
    }
}

// 暴露给全局
if (typeof window !== 'undefined') {
    window.closeDialog = closeDialog;
}


