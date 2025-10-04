#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
命运时钟Flask应用服务器
支持命理分析API
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys

# 将当前目录添加到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入命理分析API
from mingli_analysis_api import create_api_handler
# 导入图表数据API
from chart_data_api import get_dayun_chart_api, get_liunian_chart_api, get_liuyue_chart_api, get_liuri_chart_api

# 创建Flask应用
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)  # 启用跨域支持

# 注册命理分析API
create_api_handler(app)

# 主页路由
@app.route('/')
def index():
    return send_from_directory('.', 'destiny_clock.html')

# 命理分析页面路由
@app.route('/mingli_analysis.html')
def mingli_analysis():
    return send_from_directory('.', 'mingli_analysis.html')

# 命运时钟页面路由
@app.route('/destiny_clock.html')
def destiny_clock():
    return send_from_directory('.', 'destiny_clock.html')

# 健康检查端点
@app.route('/health')
def health():
    return jsonify({"status": "ok"})

# 图表数据API路由
@app.route('/api/chart/dayun')
def dayun_chart():
    return get_dayun_chart_api()

@app.route('/api/chart/liunian')
def liunian_chart():
    return get_liunian_chart_api()

@app.route('/api/chart/liuyue')
def liuyue_chart():
    return get_liuyue_chart_api()

@app.route('/api/chart/liuri')
def liuri_chart():
    return get_liuri_chart_api()

if __name__ == '__main__':
    # 设置端口
    port = int(os.environ.get('PORT', 8001))
    
    # 提示用户设置环境变量
    if not os.environ.get('GEMINI_API_KEY'):
        print("\n⚠️  警告：未设置GEMINI_API_KEY环境变量")
        print("请设置环境变量后再运行：")
        print("export GEMINI_API_KEY='your-api-key-here'\n")
    
    print(f"\n🚀 命运时钟服务器启动在 http://localhost:{port}")
    print(f"   - 命运时钟: http://localhost:{port}/destiny_clock.html")
    print(f"   - 命理分析: http://localhost:{port}/mingli_analysis.html\n")
    
    # 运行服务器
    app.run(host='0.0.0.0', port=port, debug=True)
