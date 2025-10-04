# 清理计划 - Linus式删除

## 为什么要删除这些文件？

**Linus的原则：**
> "删除的代码是调试过的代码。"
> "如果在git里，就不需要备份文件。"

## 要删除的文件（总计约2MB）

### 1. 备份文件 (1.9MB)
```
✓ ./backup/                                          196KB
✓ ./scripts/main.js.backup                          428KB  
✓ 火柴人时间管理器_备份_2025-03-12T09-20-14.json    1.3MB
```

**原因：** git已有完整历史，不需要手动备份

### 2. 损坏/旧的配置文件 (128KB)
```
✓ ./destiny_clock/mingli_prompts_backup.json        64KB
✓ ./destiny_clock/mingli_prompts_broken.json.bak    64KB
```

**原因：** 已有正常的mingli_prompts.json

### 3. 重复的scoring系统（待定）
```
? ./destiny_clock/comprehensive_scoring_system.py
? ./destiny_clock/enhanced_scoring_system.py
? ./destiny_clock/enhanced_layered_scoring.py
? ./destiny_clock/layered_scoring_system.py
? ./destiny_clock/professional_scoring_system.py
```

**原因：** 5个系统做同样的事，只需要保留最好的一个

---

## 执行计划

### 阶段1：删除明确的垃圾（立即执行）✅

删除：
1. backup目录
2. main.js.backup
3. 大JSON备份文件
4. 损坏的配置文件备份

预计节省：**~2MB**

### 阶段2：分析scoring系统（需要评估）

1. 阅读每个scoring系统的代码
2. 确定哪个是最新/最好的
3. 删除其他4个
4. 更新依赖这些文件的代码

预计节省：**~50KB + 复杂度大幅降低**

### 阶段3：检查其他重复代码

1. 检查assets/characters/gods/和assets/gods/是否重复
2. 检查destiny_clock/bazi_lib/是否是git子模块

---

## 安全措施

✅ **已完成：**
1. Git已初始化
2. Baseline已提交
3. 可随时回滚：`git reset --hard HEAD`

**执行前确认：**
- [ ] 当前代码可以正常运行
- [ ] Git status干净
- [ ] 理解每个文件的用途

---

## 执行命令

### 方案A：全部删除（激进）
```bash
# 删除所有备份文件
rm -rf ./backup
rm ./scripts/main.js.backup
rm "火柴人时间管理器_备份_2025-03-12T09-20-14.json"
rm ./destiny_clock/mingli_prompts_backup.json
rm ./destiny_clock/mingli_prompts_broken.json.bak

# 提交
git add -A
git commit -m "Clean: Remove all backup files (saved 2MB)"
git tag v0.1.1-cleanup
```

### 方案B：保守删除（推荐）
```bash
# 先移动到临时目录，测试7天后再删除
mkdir -p .trash
mv ./backup .trash/
mv ./scripts/main.js.backup .trash/
mv "火柴人时间管理器_备份_2025-03-12T09-20-14.json" .trash/
mv ./destiny_clock/mingli_prompts_backup.json .trash/
mv ./destiny_clock/mingli_prompts_broken.json.bak .trash/

# 测试应用仍然正常工作
# 7天后：rm -rf .trash
```

---

## 我推荐什么？

**作为Linus，我选择方案A：全部删除。**

原因：
1. ✅ Git已有完整历史
2. ✅ 这些都是明确的备份文件
3. ✅ 保留它们没有任何好处
4. ✅ "Hesitation is defeat"（犹豫就会败北）

但如果你不放心，用方案B也行。

