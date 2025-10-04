# 命理分析功能使用说明

## 功能介绍

命理分析是命运时钟的新功能，使用 Google Gemini AI 基于"整合性生命剧本"范式对八字进行深度分析。

## 安装要求

1. Python 3.7+
2. 必需的Python包（会自动安装）：
   - flask>=2.0.0
   - flask-cors>=3.0.0
   - google-genai>=0.1.0

## 配置步骤

### 1. 获取 Gemini API 密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的 Google 账号
3. 创建新的 API 密钥
4. 复制密钥备用

### 2. 设置环境变量

在终端中设置环境变量：

```bash
export GEMINI_API_KEY='your-api-key-here'
```

或者在运行时直接设置：

```bash
GEMINI_API_KEY='your-api-key-here' python app.py
```

### 3. 安装依赖

```bash
cd destiny_clock
pip install -r requirements.txt
```

## 启动服务

### 方法一：使用启动脚本（Mac/Linux）

```bash
chmod +x start_mingli_server.command
./start_mingli_server.command
```

### 方法二：直接运行

```bash
cd destiny_clock
python app.py
```

服务器默认运行在 http://localhost:8001

## 使用方法

1. 启动服务器后，访问 http://localhost:8001/destiny_clock.html
2. 点击页面顶部的"🌟 命理分析"按钮
3. 在输入框中输入完整的八字信息
4. 点击"开始分析"按钮
5. 等待 AI 完成分析（可能需要 10-30 秒）

## 输入格式

- 天干：甲、乙、丙、丁、戊、己、庚、辛、壬、癸
- 地支：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥

示例输入：
- 年柱：甲子
- 月柱：乙丑
- 日柱：丙寅
- 时柱：丁卯

## 分析内容

AI 将基于"整合性生命剧本"范式进行分析，包括：

1. **生命剧本**：我是谁、从哪来、到哪去
2. **核心冲突**：识别生命中的主要矛盾
3. **身心机制**：将八字翻译成生理学语言
4. **状态评估**：评估系统优势与风险
5. **调节建议**：提供个性化的生活方式建议

## 注意事项

1. 需要稳定的网络连接以调用 Gemini API
2. 每次分析可能需要 10-30 秒，请耐心等待
3. API 有使用限制，请合理使用
4. 分析结果仅供参考，不能替代专业医疗建议

## 故障排除

### 问题：提示未设置 API 密钥
解决：确保正确设置了 GEMINI_API_KEY 环境变量

### 问题：分析失败
可能原因：
- 网络连接问题
- API 密钥无效
- API 调用限制

### 问题：页面无法访问
解决：确保服务器正在运行，检查端口是否被占用

## 技术支持

如有问题，请检查：
1. 终端输出的错误信息
2. 浏览器控制台的错误信息
3. 确保所有依赖已正确安装
