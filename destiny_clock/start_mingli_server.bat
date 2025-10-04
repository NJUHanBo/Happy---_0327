@echo off
echo 启动命理分析服务器...

REM 检查是否设置了API密钥
if "%GEMINI_API_KEY%"=="" (
    echo.
    echo ⚠️  警告：未设置GEMINI_API_KEY环境变量
    echo.
    echo 请先设置您的Gemini API密钥：
    echo set GEMINI_API_KEY=your-api-key-here
    echo.
    echo 或者在运行时设置：
    echo set GEMINI_API_KEY=your-api-key-here ^&^& python app.py
    echo.
    pause
)

REM 安装依赖
echo 检查并安装依赖...
pip install -r requirements.txt

REM 启动服务器
echo.
echo 启动服务器...
python app.py

pause
