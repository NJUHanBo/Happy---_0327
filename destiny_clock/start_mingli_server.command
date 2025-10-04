#!/bin/bash

# 命理分析服务器启动脚本

echo "启动命理分析服务器..."

# 获取脚本所在目录
cd "$(dirname "$0")"

# 检查是否设置了API密钥
if [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    echo "⚠️  警告：未设置GEMINI_API_KEY环境变量"
    echo ""
    echo "请先设置您的Gemini API密钥："
    echo "export GEMINI_API_KEY='your-api-key-here'"
    echo ""
    echo "或者在运行时设置："
    echo "GEMINI_API_KEY='your-api-key-here' python app.py"
    echo ""
    read -p "按回车键继续（不设置API密钥将无法使用命理分析功能）..."
fi

# 检查是否安装了依赖
if ! python -c "import flask" 2>/dev/null; then
    echo "正在安装依赖..."
    pip install -r requirements.txt
fi

# 启动服务器
python app.py
