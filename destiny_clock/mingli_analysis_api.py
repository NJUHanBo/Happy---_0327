#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
命理分析API模块
使用Google Gemini API进行八字分析
"""

import os
import json
from google import genai
from google.genai import types

# 获取API密钥
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# 加载配置文件
def load_config():
    """加载配置文件，优先使用新格式，如果不存在则使用旧格式"""
    config_files = [
        'mingli_prompts_v2.json',   # 最新版本的提示词
        'mingli_prompts_new.json',  # 新修复的文件
        'mingli_config.json',       # 旧格式但语法正确的文件
        'mingli_prompts.json'       # 原始文件（可能有语法错误）
    ]
    
    for config_file in config_files:
        config_path = os.path.join(os.path.dirname(__file__), config_file)
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    print(f"成功加载配置文件: {config_file}")
                    return config
            except json.JSONDecodeError as e:
                print(f"配置文件 {config_file} 存在语法错误: {e}")
                continue
    
    print("所有配置文件都无法加载")
    return None

def build_prompts_from_config(config):
    """从配置构建提示词，支持多种格式"""
    if not config:
        return None
    
    # 检查是否有 system_prompt 字段（最新格式 v2）
    if 'system_prompt' in config:
        return [config['system_prompt']]
    
    # 检查是否有 prompts 字段（新格式）
    if 'prompts' in config and config['prompts']:
        return config['prompts']
    
    # 否则使用 system_prompts 字段（旧格式）
    if 'system_prompts' in config:
        prompts = []
        system_prompts = config.get('system_prompts', {})
        
        # 构建案例1
        case1 = system_prompts.get('case_study_1', {})
        case1_full = f"{case1.get('title', '')}\n\n{case1.get('bazi', '')}\n\n{case1.get('content', '')}"
        
        # 构建案例2  
        case2 = system_prompts.get('case_study_2', {})
        case2_full = f"{case2.get('title', '')}\n\n{case2.get('bazi', '')}\n\n{case2.get('content', '')}"
        
        # 构建分析框架
        framework = system_prompts.get('analysis_framework', {})
        framework_text = f"\n---\n\n{framework.get('content', '')}\n\n---\n\n"
        
        # 构建生理学模型（简化版）
        physio = system_prompts.get('physiological_model', {})
        physio_text = f"""还有我对八字的一种理解：### **{physio.get('title', '')}**

{physio.get('abstract', '')}

[注：完整的生理学模型内容请参考配置文件]"""
        
        # 组合第一个user prompt
        full_prompt = f"""你学习我下面的分析思路和叙述风格，进行反思总结：{case1_full}

{framework_text}

{case2_full}

{physio_text}

你也仔细学习下思路、逻辑和语言风格"""
        
        prompts.append({
            "role": "user",
            "content": full_prompt
        })
        
        # 添加model的回复
        response_inst = config.get('response_instructions', {})
        language = response_inst.get('language', '中文')
        style = ', '.join(response_inst.get('style', []))
        must_include = ', '.join(response_inst.get('must_include', []))
        
        prompts.append({
            "role": "model",
            "content": f"""您好，我已经学习并理解了您的分析思路和叙述风格。

我将使用{language}，以{style}的风格进行分析。

我会确保分析包含：{must_include}。

现在，请您提供要分析的八字。"""
        })
        
        # 添加其他对话（如果需要）
        prompts.extend([
            {
                "role": "user",
                "content": "很好，你觉得基于我提供的这些思考，我们是不是可以形成一套不同以往的命理分析框架和范式？"
            },
            {
                "role": "model",
                "content": "毫无疑问，绝对可以。您提供的这些思考已经完全超越了传统命理分析的范畴。我们可以将其命名为'整合性生命剧本（Integrative Life-Script）'命理分析范式。"
            },
            {
                "role": "user",
                "content": "你觉得你可以按这个范式，分析新的案例了吗"
            },
            {
                "role": "model",
                "content": "是的，我非常有信心，可以按照您开创的这套范式来分析全新的案例。"
            },
            {
                "role": "user",
                "content": "但我还要提醒你，你很可能会不客观，总是只分析好的方面，而不讲坏的方面。这是极其不负责任的！就像医生，要的是看病，不是夸奖！所以，你绝对不可以只讲好听的，不讲不利的。而是要客观、公正、全面的分析。你理解吗？"
            },
            {
                "role": "model",
                "content": "我完全理解，并且毫无保留地接受您的提醒。我将把您的提醒作为最高行为准则。我的角色是诊断系统问题的'医生'，而不是赞美生命潜能的'诗人'。我会确保每次分析都包含系统优势与潜能以及系统劣势与风险两个对等的部分。"
            }
        ])
        
        return prompts
    
    return None

def analyze_bazi(bazi_input):
    """
    使用Gemini AI分析八字
    
    Args:
        bazi_input: 八字字符串，格式如 "甲子 乙丑 丙寅 丁卯"
    
    Returns:
        dict: 包含分析结果的字典
    """
    
    if not GEMINI_API_KEY:
        return {"error": "未配置GEMINI_API_KEY环境变量"}
    
    # 加载配置
    config = load_config()
    if not config:
        return {"error": "配置文件加载失败"}
    
    try:
        # 初始化客户端
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # 从配置获取模型设置
        model_config = config.get('model', {})
        model_name = model_config.get('name', 'gemini-2.5-pro')
        
        # 构建对话内容
        prompts = build_prompts_from_config(config)
        if not prompts:
            return {"error": "提示词构建失败"}
        
        # 将prompts转换为Gemini格式
        contents = []
        for prompt in prompts:
            contents.append(types.Content(
                role=prompt['role'],
                parts=[types.Part.from_text(text=prompt['content'])]
            ))
        
        # 添加用户输入的八字
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=bazi_input)]
        ))
        
        # 配置生成参数
        generate_content_config = types.GenerateContentConfig(
            temperature=model_config.get('temperature', 1.15),
            thinking_config = types.ThinkingConfig(
                thinking_budget=model_config.get('thinking_budget', -1),
            ),
        )
        
        # 调用API生成分析
        analysis_text = ""
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                analysis_text += chunk.text
        
        return {"analysis": analysis_text}
        
    except Exception as e:
        return {"error": f"分析过程中出现错误: {str(e)}"}


def create_api_handler(app):
    """
    将命理分析API添加到Flask应用中
    
    Args:
        app: Flask应用实例
    """
    from flask import request, jsonify
    
    @app.route('/api/mingli-analysis', methods=['POST'])
    def mingli_analysis_handler():
        try:
            # 获取请求数据
            data = request.get_json()
            if not data or 'bazi' not in data:
                return jsonify({"error": "请提供八字信息"}), 400
            
            bazi = data['bazi']
            if not bazi or not isinstance(bazi, str):
                return jsonify({"error": "八字格式不正确"}), 400
            
            # 调用分析函数
            result = analyze_bazi(bazi)
            
            # 返回结果
            if 'error' in result:
                return jsonify(result), 500
            else:
                return jsonify(result), 200
                
        except Exception as e:
            return jsonify({"error": f"服务器错误: {str(e)}"}), 500

# 如果直接运行此文件，可以用于测试
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        test_bazi = " ".join(sys.argv[1:])
        print(f"测试八字: {test_bazi}")
        result = analyze_bazi(test_bazi)
        if 'error' in result:
            print(f"错误: {result['error']}")
        else:
            print(f"分析结果:\n{result['analysis']}")
    else:
        print("使用方法: python mingli_analysis_api.py 甲子 乙丑 丙寅 丁卯")