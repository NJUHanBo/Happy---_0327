#!/bin/bash

# 获取脚本所在目录
cd "$(dirname "$0")"

# 激活虚拟环境
source venv/bin/activate

# 检查是否有旧的服务器进程在运行
MAIN_PORT=8000
API_PORT=5001

echo "🔮 启动火柴人时光管理 + 命运时钟服务..."

# 关闭旧进程
PID_MAIN=$(lsof -ti :$MAIN_PORT)
if [ ! -z "$PID_MAIN" ]; then
    echo "正在关闭主服务器进程..."
    kill $PID_MAIN
    sleep 1
fi

PID_API=$(lsof -ti :$API_PORT)
if [ ! -z "$PID_API" ]; then
    echo "正在关闭API服务器进程..."
    kill $PID_API
    sleep 1
fi

# 启动主服务器（后台）
echo "🔥 启动主应用服务器 (http://localhost:$MAIN_PORT)"
python server.py &
MAIN_PID=$!

# 等待主服务器启动
sleep 2

# 启动命运时钟API服务器（后台）
echo "🔮 启动命运时钟API服务器 (http://localhost:$API_PORT)"
cd destiny_clock
python bazi_api.py &
API_PID=$!
cd ..

# 等待API服务器启动
sleep 3

# 打开浏览器
echo "🌟 所有服务器已启动，正在打开浏览器..."
open http://localhost:$MAIN_PORT

echo ""
echo "✨ 服务已启动："
echo "   🏠 主应用: http://localhost:$MAIN_PORT"
echo "   🔮 命运时钟API: http://localhost:$API_PORT/destiny_clock/api/info"
echo ""
echo "按 Ctrl+C 关闭所有服务器"

# 等待用户中断
trap 'echo "正在关闭服务器..."; kill $MAIN_PID $API_PID 2>/dev/null; exit' INT

# 保持脚本运行
while true; do
    sleep 1
done
