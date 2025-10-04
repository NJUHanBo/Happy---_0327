// 显示数据备份和恢复对话框
function showDataBackupDialog() {
    // 获取当前日期和时间，格式化为文件名友好的格式
    const now = new Date();
    const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0];
    const defaultFilename = `火柴人时间管理器_备份_${dateStr}.json`;

    const dialogContent = `
        <div class="backup-dialog">
            <h2>数据备份与恢复</h2>
            <div class="backup-section">
                <h3>备份数据</h3>
                <p>将当前所有角色数据导出为JSON文件保存在本地。包括属性值、任务列表、收集的羊皮纸等全部信息。</p>
                <div class="backup-options">
                    <label for="backup-filename">文件名：</label>
                    <input type="text" id="backup-filename" value="${defaultFilename}">
                </div>
                <button onclick="exportDataToFile()">导出数据</button>
            </div>
            
            <div class="backup-section">
                <h3>恢复数据</h3>
                <p>从本地JSON备份文件中恢复数据。<strong>注意：这将覆盖当前所有数据！</strong></p>
                <div class="backup-options">
                    <input type="file" id="restore-file" accept=".json">
                </div>
                <button onclick="confirmDataRestore()">恢复数据</button>
            </div>
            
            <div class="dialog-buttons">
                <button onclick="closeDialog()">关闭</button>
            </div>
        </div>
    `;
    
    showDialog(dialogContent);
}

// 导出数据到文件
function exportDataToFile() {
    try {
        // 获取当前状态
        const dataToExport = JSON.stringify(state, null, 2);
        
        // 创建Blob对象
        const blob = new Blob([dataToExport], { type: 'application/json' });
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        
        // 获取用户输入的文件名
        const filename = document.getElementById('backup-filename').value;
        downloadLink.download = filename;
        
        // 触发下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // 释放URL对象
        URL.revokeObjectURL(downloadLink.href);
        
        alert("数据已成功导出！");
        
        // 添加到日志
        addToLog(`成功备份数据到文件: ${filename}`);
    } catch (error) {
        console.error("导出数据时出错:", error);
        alert("导出数据时出现错误: " + error.message);
    }
}

// 显示恢复确认对话框
function confirmDataRestore() {
    const fileInput = document.getElementById('restore-file');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('请先选择要恢复的备份文件');
        return;
    }
    
    if (confirm('警告：恢复操作将覆盖当前所有数据！确定要继续吗？')) {
        importDataFromFile();
    }
}

// 从文件导入数据
function importDataFromFile() {
    try {
        const fileInput = document.getElementById('restore-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('请先选择要恢复的备份文件');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const restoredData = JSON.parse(event.target.result);
                
                // 备份当前状态（以防恢复出问题时可以回滚）
                const currentStateBackup = JSON.stringify(state);
                localStorage.setItem('matchstickTimeManager_backup_before_restore', currentStateBackup);
                
                // 恢复数据
                Object.assign(state, restoredData);
                
                // 保存恢复后的状态
                saveState();
                
                // 刷新UI
                updateUI();
                
                // 添加到日志
                addToLog(`从文件 ${file.name} 成功恢复数据`);
                
                // 关闭对话框并显示成功消息
                closeDialog();
                alert('数据恢复成功！');
            } catch (parseError) {
                console.error("解析备份文件时出错:", parseError);
                alert("无法解析备份文件，文件可能已损坏: " + parseError.message);
            }
        };
        
        reader.onerror = function() {
            alert("读取文件时出错");
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error("导入数据时出错:", error);
        alert("导入数据时出现错误: " + error.message);
    }
}

// 添加样式
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .backup-dialog {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .backup-section {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .backup-options {
            margin: 15px 0;
        }
        
        .backup-options input[type="text"] {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }
        
        .backup-dialog button {
            background-color: #FFB74D;
            color: #333;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-weight: bold;
        }
        
        .backup-dialog button:hover {
            background-color: #FFA726;
        }
    `;
    document.head.appendChild(style);
});
