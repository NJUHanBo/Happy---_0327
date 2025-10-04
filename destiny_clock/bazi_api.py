#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
八字命理API服务器
提供RESTful API接口供前端调用
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from bazi_calculator import BaziCalculator

app = Flask(__name__)
# 更宽松的CORS设置以解决host验证问题
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5001", "http://127.0.0.1:5001"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# 初始化八字计算器
calculator = BaziCalculator()

@app.route('/destiny_clock/api/calculate', methods=['POST'])
def calculate_bazi():
    """计算八字接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '无效的请求数据'}), 400
        
        # 验证必需字段
        required_fields = ['birthDate', 'birthTime', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必需字段: {field}'}), 400
        
        # 计算八字
        bazi_data = calculator.calculate_bazi(
            birth_date=data['birthDate'],
            birth_time=data['birthTime'],
            gender=data['gender']
        )
        
        # 获取完整的命运分析
        result = calculator.get_fortune_analysis(bazi_data)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        app.logger.error(f'计算八字时出错: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'计算失败: {str(e)}'
        }), 500

@app.route('/destiny_clock/api/fortune', methods=['POST'])
def get_current_fortune():
    """获取当前时运接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '无效的请求数据'}), 400
        
        # 验证必需字段
        required_fields = ['birthDate', 'birthTime', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必需字段: {field}'}), 400
        
        # 计算八字
        bazi_data = calculator.calculate_bazi(
            birth_date=data['birthDate'],
            birth_time=data['birthTime'],
            gender=data['gender']
        )
        
        # 获取当前时运分析
        result = calculator.get_fortune_analysis(bazi_data)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        app.logger.error(f'获取时运信息时出错: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@app.route('/destiny_clock/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'service': '命运时钟API',
        'version': '1.0.0'
    })

@app.route('/destiny_clock/api/fortune_trends', methods=['POST'])
def get_fortune_trends():
    """获取运势趋势数据（年度月份 + 月度日期）"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '无效的请求数据'}), 400
        
        # 验证必需字段
        required_fields = ['birthDate', 'birthTime', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必需字段: {field}'}), 400
        
        # 获取趋势数据
        trends_data = calculator.advanced_analyzer.get_fortune_trends_data(
            birth_date=data['birthDate'],
            birth_time=data['birthTime'],
            gender=data['gender']
        )
        
        return jsonify({
            'success': True,
            'data': trends_data
        })
        
    except Exception as e:
        app.logger.error(f'获取运势趋势时出错: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@app.route('/destiny_clock/api/comprehensive_analysis', methods=['POST'])
def get_comprehensive_analysis():
    """获取完整命格分析接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '无效的请求数据'}), 400
        
        # 验证必需字段
        required_fields = ['birthDate', 'birthTime', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必需字段: {field}'}), 400
        
        # 获取完整命格分析
        comprehensive_analysis = calculator.advanced_analyzer.analyze_comprehensive_destiny(
            birth_date=data['birthDate'],
            birth_time=data['birthTime'],
            gender=data['gender']
        )
        
        return jsonify({
            'success': True,
            'data': comprehensive_analysis
        })
        
    except Exception as e:
        app.logger.error(f'获取完整命格分析时出错: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'分析失败: {str(e)}'
        }), 500

@app.route('/destiny_clock/api/layered_analysis', methods=['POST'])
def get_layered_analysis():
    """获取分层叠加分析接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '无效的请求数据'}), 400
        
        # 验证必需字段
        required_fields = ['birthDate', 'birthTime', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必需字段: {field}'}), 400
        
        # 解析生日信息
        year, month, day = map(int, data['birthDate'].split('-'))
        
        # 解析时辰
        birth_time = data['birthTime']
        if birth_time in ['3-5', 'shenshi', '寅时']:
            hour = 4
        else:
            try:
                hour = int(birth_time)
            except:
                hour = 4
        
        gender = data['gender']
        
        # 使用分层叠加系统
        layered_result = calculator.layered_system.analyze_complete_fortune(
            year, month, day, hour, 0, gender
        )
        
        return jsonify({
            'success': True,
            'data': layered_result
        })
        
    except Exception as e:
        app.logger.error(f'获取分层叠加分析时出错: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'分析失败: {str(e)}'
        }), 500

@app.route('/destiny_clock/api/info', methods=['GET'])
def api_info():
    """API信息接口"""
    return jsonify({
        'service_name': '命运时钟API',
        'version': '2.0.0',
        'description': '专业八字命理计算服务',
        'endpoints': {
            '/calculate': '计算八字和命运分析',
            '/fortune': '获取当前时运信息',
            '/fortune_trends': '获取运势趋势图表数据',
            '/comprehensive_analysis': '获取完整命格分析',
            '/health': '服务健康检查',
            '/info': 'API信息'
        },
        'supported_features': [
            '八字排盘',
            '大运计算',
            '流年流月流日分析',
            '调候用神分析',
            '五层评分系统',
            '十神格局分析',
            '性格特征分析',
            '事业财运指导',
            '健康建议',
            '完整命格解读',
            '年度流月趋势图表',
            '月度流日趋势图表'
        ]
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': '接口不存在'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': '服务器内部错误'
    }), 500

if __name__ == '__main__':
    # 开发环境配置
    app.config['DEBUG'] = True
    app.config['JSON_AS_ASCII'] = False  # 支持中文JSON
    
    print("🔮 命运时钟API服务器启动中...")
    print("📍 API地址: http://localhost:5001")
    print("📖 API文档: http://localhost:5001/destiny_clock/api/info")
    print("💫 健康检查: http://localhost:5001/destiny_clock/api/health")
    
    # 启动服务器
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    )
