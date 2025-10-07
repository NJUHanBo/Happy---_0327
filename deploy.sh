#!/bin/bash

# 火柴人时光管理 - 一键部署到GitHub Pages
# 使用方法：./deploy.sh

echo "🔥 火柴人时光管理 - GitHub Pages 部署脚本"
echo "============================================="
echo ""

# 检查是否在git仓库中
if [ ! -d .git ]; then
    echo "❌ 错误：当前目录不是git仓库"
    echo "请先运行：git init"
    exit 1
fi

# 检查是否有未提交的改动
if [[ -n $(git status -s) ]]; then
    echo "📝 检测到未提交的改动"
    echo ""
    git status -s
    echo ""
    read -p "是否提交这些改动？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ 添加所有文件..."
        git add -A
        
        echo "✅ 提交改动..."
        git commit -m "静态化改造：移除Python服务器依赖

- 背景图片改用base64存localStorage
- 保持向后兼容
- 应用现在可以部署到任何静态托管服务

改动文件：
- scripts/main.js: 背景图片处理逻辑改为纯前端
- 新增: DEPLOY_GUIDE.md 部署指南
"
    else
        echo "⏭️  跳过提交"
    fi
fi

# 检查远程仓库
if ! git remote | grep -q origin; then
    echo ""
    echo "❌ 未找到远程仓库 'origin'"
    echo ""
    read -p "请输入你的GitHub仓库URL: " repo_url
    git remote add origin "$repo_url"
    echo "✅ 已添加远程仓库"
fi

echo ""
echo "🚀 推送到GitHub..."
git push -u origin main

echo ""
echo "============================================="
echo "✅ 代码已推送到GitHub！"
echo ""
echo "📋 下一步（手动操作）："
echo "1. 访问你的GitHub仓库页面"
echo "2. 点击 Settings → Pages"
echo "3. Source 选择: Branch: main, Folder: / (root)"
echo "4. 点击 Save"
echo "5. 等待1-2分钟，刷新页面获取你的网址"
echo ""
echo "🌐 你的应用将部署到："
echo "   https://你的用户名.github.io/仓库名/"
echo ""
echo "============================================="
echo "🎉 完成！"

