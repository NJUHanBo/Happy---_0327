// 命理分析页面的JavaScript

// 返回主页
function goBack() {
    window.location.href = '../index.html';
}

// 验证输入的天干地支
function validateGanZhi() {
    const ganList = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const yearGan = document.getElementById('year-gan').value.trim();
    const yearZhi = document.getElementById('year-zhi').value.trim();
    const monthGan = document.getElementById('month-gan').value.trim();
    const monthZhi = document.getElementById('month-zhi').value.trim();
    const dayGan = document.getElementById('day-gan').value.trim();
    const dayZhi = document.getElementById('day-zhi').value.trim();
    const hourGan = document.getElementById('hour-gan').value.trim();
    const hourZhi = document.getElementById('hour-zhi').value.trim();
    
    // 检查是否都填写了
    if (!yearGan || !yearZhi || !monthGan || !monthZhi || 
        !dayGan || !dayZhi || !hourGan || !hourZhi) {
        alert('请填写完整的八字信息！');
        return false;
    }
    
    // 检查天干是否有效
    const ganValues = [yearGan, monthGan, dayGan, hourGan];
    for (let gan of ganValues) {
        if (!ganList.includes(gan)) {
            alert(`天干"${gan}"无效！请输入正确的天干。`);
            return false;
        }
    }
    
    // 检查地支是否有效
    const zhiValues = [yearZhi, monthZhi, dayZhi, hourZhi];
    for (let zhi of zhiValues) {
        if (!zhiList.includes(zhi)) {
            alert(`地支"${zhi}"无效！请输入正确的地支。`);
            return false;
        }
    }
    
    return true;
}

// 格式化输出内容，将markdown格式转换为HTML
function formatAnalysisContent(content) {
    // 基本的markdown到HTML转换
    let html = content;
    
    // 处理标题
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*?)$/gm, '<h3>$1</h3>');
    
    // 处理加粗
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理列表
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function(match) {
        return '<ul>' + match + '</ul>';
    });
    
    // 处理段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // 清理多余的空段落
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    
    return html;
}

// 分析命理
async function analyzeMingli() {
    if (!validateGanZhi()) {
        return;
    }
    
    // 获取输入值
    const bazi = {
        year: document.getElementById('year-gan').value + document.getElementById('year-zhi').value,
        month: document.getElementById('month-gan').value + document.getElementById('month-zhi').value,
        day: document.getElementById('day-gan').value + document.getElementById('day-zhi').value,
        hour: document.getElementById('hour-gan').value + document.getElementById('hour-zhi').value
    };
    
    // 构造完整的八字字符串
    const baziString = `${bazi.year} ${bazi.month} ${bazi.day} ${bazi.hour}`;
    
    // 显示加载状态
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const spinner = analyzeBtn.querySelector('.loading-spinner');
    const resultSection = document.getElementById('result-section');
    const loadingContainer = document.getElementById('loading-container');
    const resultContent = document.getElementById('result-content');
    
    // 按钮加载状态
    analyzeBtn.classList.add('loading');
    btnText.textContent = '分析中...';
    spinner.style.display = 'inline-block';
    
    // 显示结果区域和加载动画
    resultSection.style.display = 'block';
    loadingContainer.style.display = 'flex';
    resultContent.style.display = 'none';
    
    try {
        // 调用后端API
        const response = await fetch('/api/mingli-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bazi: baziString
            })
        });
        
        if (!response.ok) {
            throw new Error('分析请求失败');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // 显示分析结果
        loadingContainer.style.display = 'none';
        resultContent.style.display = 'block';
        resultContent.innerHTML = formatAnalysisContent(data.analysis);
        
        // 显示保存按钮
        const saveSection = document.getElementById('save-section');
        if (saveSection) {
            saveSection.style.display = 'block';
        }
        
        // 保存当前分析数据到全局变量
        window.currentAnalysisData = {
            bazi: baziString,
            analysis: data.analysis,
            timestamp: new Date().toISOString()
        };
        
        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('分析失败:', error);
        alert('分析失败，请稍后重试。错误信息：' + error.message);
    } finally {
        // 恢复按钮状态
        analyzeBtn.classList.remove('loading');
        btnText.textContent = '开始分析';
        spinner.style.display = 'none';
    }
}

// 添加回车键支持
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.gan-input, .zhi-input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                analyzeMingli();
            }
        });
    });
});

// 保存分析结果
async function saveAnalysisResult() {
    if (!window.currentAnalysisData) {
        alert('没有可保存的分析结果');
        return;
    }
    
    const saveStatus = document.getElementById('saveStatus');
    const saveBtn = document.querySelector('.save-btn');
    
    try {
        // 禁用按钮
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
        
        // 发送保存请求
        const response = await fetch('/api/save-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(window.currentAnalysisData)
        });
        
        if (!response.ok) {
            throw new Error('保存请求失败');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 显示成功状态
            saveStatus.textContent = '✅ 保存成功！文件名：' + result.filename;
            saveStatus.className = 'save-status success show';
            
            // 3秒后隐藏状态
            setTimeout(() => {
                saveStatus.className = 'save-status';
            }, 3000);
        } else {
            throw new Error(result.error || '保存失败');
        }
        
    } catch (error) {
        console.error('保存失败:', error);
        saveStatus.textContent = '❌ 保存失败：' + error.message;
        saveStatus.className = 'save-status error show';
        
        // 3秒后隐藏状态
        setTimeout(() => {
            saveStatus.className = 'save-status';
        }, 3000);
    } finally {
        // 恢复按钮状态
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 保存分析结果';
    }
}
