#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
八字专业库Web界面
基于Flask创建简单的Web界面来使用传统八字分析库
"""

from flask import Flask, render_template, request, jsonify, render_template_string
import subprocess
import sys
import os
from datetime import datetime

app = Flask(__name__)

# 获取当前目录
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

def run_bazi_analysis(year, month, day, hour, gender='male', calendar='solar'):
    """运行八字分析"""
    try:
        # 构建命令
        cmd = [sys.executable, 'bazi.py', str(year), str(month), str(day), str(hour)]
        
        # 添加参数
        if calendar == 'solar':
            cmd.append('-g')  # 公历
        if gender == 'female':
            cmd.append('-n')  # 女性
            
        print(f"执行命令: {' '.join(cmd)}")
        
        # 运行命令并捕获输出
        result = subprocess.run(
            cmd,
            cwd=CURRENT_DIR,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        if result.returncode == 0:
            return {
                'success': True,
                'output': result.stdout,
                'error': result.stderr if result.stderr else None
            }
        else:
            return {
                'success': False,
                'error': f"分析失败: {result.stderr}",
                'output': result.stdout
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f"执行出错: {str(e)}"
        }

@app.route('/')
def index():
    """主页"""
    return render_template_string(INDEX_HTML)

@app.route('/analyze', methods=['POST'])
def analyze():
    """分析八字"""
    try:
        data = request.get_json()
        
        # 验证必需字段
        required_fields = ['year', 'month', 'day', 'hour']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'缺少必需字段: {field}'}), 400
        
        # 获取参数
        year = int(data['year'])
        month = int(data['month'])
        day = int(data['day'])
        hour = int(data['hour'])
        gender = data.get('gender', 'male')
        calendar = data.get('calendar', 'solar')
        
        # 运行分析
        result = run_bazi_analysis(year, month, day, hour, gender, calendar)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/quick_test')
def quick_test():
    """快速测试（使用你的八字）"""
    result = run_bazi_analysis(1995, 6, 11, 4, 'male', 'solar')
    return jsonify(result)

# HTML模板
INDEX_HTML = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>传统八字专业分析库</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
        }
        
        .input-section {
            padding: 40px;
            background: #f8fafc;
        }
        
        .result-section {
            padding: 40px;
            background: white;
            border-left: 1px solid #e2e8f0;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #374151;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #4facfe;
            box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
        }
        
        .radio-group {
            display: flex;
            gap: 20px;
        }
        
        .radio-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .radio-item input[type="radio"] {
            width: auto;
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-right: 10px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3);
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
        }
        
        .result-container {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            min-height: 400px;
        }
        
        .result-output {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            background: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-y: auto;
            max-height: 600px;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 40px;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #4facfe;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error {
            color: #dc2626;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
        }
        
        .quick-test {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .quick-test h3 {
            color: #059669;
            margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
            }
            
            .result-section {
                border-left: none;
                border-top: 1px solid #e2e8f0;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔮 传统八字专业分析库</h1>
            <p>基于古典命理学的专业八字排盘分析系统</p>
        </div>
        
        <div class="content">
            <div class="input-section">
                <div class="quick-test">
                    <h3>🚀 快速体验</h3>
                    <p>点击下面的按钮使用示例八字（1995年6月11日寅时）进行测试</p>
                    <button class="btn btn-secondary" onclick="quickTest()">快速测试</button>
                </div>
                
                <form id="baziForm">
                    <div class="form-group">
                        <label>出生日期</label>
                        <div class="form-row">
                            <input type="number" id="year" placeholder="年份" min="1900" max="2100" value="1995" required>
                            <input type="number" id="month" placeholder="月份" min="1" max="12" value="6" required>
                            <input type="number" id="day" placeholder="日期" min="1" max="31" value="11" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>出生时辰</label>
                        <select id="hour" required>
                            <option value="">请选择时辰</option>
                            <option value="0">子时 (23:00-1:00)</option>
                            <option value="2">丑时 (1:00-3:00)</option>
                            <option value="4" selected>寅时 (3:00-5:00)</option>
                            <option value="6">卯时 (5:00-7:00)</option>
                            <option value="8">辰时 (7:00-9:00)</option>
                            <option value="10">巳时 (9:00-11:00)</option>
                            <option value="12">午时 (11:00-13:00)</option>
                            <option value="14">未时 (13:00-15:00)</option>
                            <option value="16">申时 (15:00-17:00)</option>
                            <option value="18">酉时 (17:00-19:00)</option>
                            <option value="20">戌时 (19:00-21:00)</option>
                            <option value="22">亥时 (21:00-23:00)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>性别</label>
                        <div class="radio-group">
                            <div class="radio-item">
                                <input type="radio" id="male" name="gender" value="male" checked>
                                <label for="male">男性</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" id="female" name="gender" value="female">
                                <label for="female">女性</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>历法</label>
                        <div class="radio-group">
                            <div class="radio-item">
                                <input type="radio" id="solar" name="calendar" value="solar" checked>
                                <label for="solar">公历</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" id="lunar" name="calendar" value="lunar">
                                <label for="lunar">农历</label>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">🔮 开始分析</button>
                </form>
            </div>
            
            <div class="result-section">
                <h2>📊 分析结果</h2>
                
                <div id="loading" class="loading">
                    <div class="loading-spinner"></div>
                    <p>正在进行专业八字分析，请稍候...</p>
                </div>
                
                <div class="result-container">
                    <div id="result-output" class="result-output">
请输入出生信息并点击"开始分析"来获取详细的八字分析结果。

本系统基于传统八字理论，包括：
✨ 完整的八字排盘
🎯 用神忌神分析  
📈 大运流年详解
🔮 神煞分析
📚 古籍理论引用
⭐ 格局判断

准备好开始你的命理之旅了吗？
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('baziForm').addEventListener('submit', function(e) {
            e.preventDefault();
            analyzeBazi();
        });

        async function analyzeBazi() {
            const year = document.getElementById('year').value;
            const month = document.getElementById('month').value;
            const day = document.getElementById('day').value;
            const hour = document.getElementById('hour').value;
            const gender = document.querySelector('input[name="gender"]:checked').value;
            const calendar = document.querySelector('input[name="calendar"]:checked').value;

            if (!year || !month || !day || !hour) {
                alert('请填写完整的出生信息');
                return;
            }

            showLoading(true);

            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        year: parseInt(year),
                        month: parseInt(month),
                        day: parseInt(day),
                        hour: parseInt(hour),
                        gender: gender,
                        calendar: calendar
                    })
                });

                const result = await response.json();
                displayResult(result);
            } catch (error) {
                displayError('网络错误：' + error.message);
            }

            showLoading(false);
        }

        async function quickTest() {
            showLoading(true);
            
            try {
                const response = await fetch('/quick_test');
                const result = await response.json();
                displayResult(result);
            } catch (error) {
                displayError('快速测试失败：' + error.message);
            }
            
            showLoading(false);
        }

        function displayResult(result) {
            const outputElement = document.getElementById('result-output');
            
            if (result.success) {
                outputElement.textContent = result.output;
                outputElement.style.color = '#e2e8f0';
            } else {
                outputElement.innerHTML = `<div class="error">❌ 分析失败: ${result.error}</div>`;
                if (result.output) {
                    outputElement.innerHTML += `\\n\\n调试信息:\\n${result.output}`;
                }
            }
        }

        function displayError(message) {
            const outputElement = document.getElementById('result-output');
            outputElement.innerHTML = `<div class="error">❌ ${message}</div>`;
        }

        function showLoading(show) {
            const loadingElement = document.getElementById('loading');
            const resultContainer = document.querySelector('.result-container');
            
            if (show) {
                loadingElement.style.display = 'block';
                resultContainer.style.display = 'none';
            } else {
                loadingElement.style.display = 'none';
                resultContainer.style.display = 'block';
            }
        }
    </script>
</body>
</html>
'''

if __name__ == '__main__':
    print("🔮 八字专业库Web界面启动中...")
    print("📍 访问地址: http://localhost:3000")
    print("💫 基于传统八字理论的专业分析系统")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=3000, debug=True)
