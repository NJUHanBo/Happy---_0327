// 重构测试脚本
// 在浏览器控制台粘贴这个脚本，快速验证重构是否成功

console.log('🧪 开始测试重构...\n');

const tests = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function test(name, fn) {
    try {
        const result = fn();
        if (result === true) {
            console.log(`✅ ${name}`);
            tests.passed++;
        } else if (result === 'warning') {
            console.warn(`⚠️ ${name}`);
            tests.warnings++;
        } else {
            console.error(`❌ ${name}: ${result}`);
            tests.failed++;
        }
    } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
        tests.failed++;
    }
}

// 测试1：检查模块是否加载
test('StorageManager已加载', () => {
    return typeof window.StorageManager !== 'undefined';
});

test('StateManager已加载', () => {
    return typeof window.StateManager !== 'undefined';
});

// 测试2：检查API是否可用
test('StorageManager.saveState存在', () => {
    return typeof window.StorageManager?.saveState === 'function';
});

test('StorageManager.loadState存在', () => {
    return typeof window.StorageManager?.loadState === 'function';
});

test('StorageManager.exportData存在', () => {
    return typeof window.StorageManager?.exportData === 'function';
});

test('StorageManager.importData存在', () => {
    return typeof window.StorageManager?.importData === 'function';
});

// 测试3：检查state对象
test('全局state对象存在', () => {
    return typeof window.state !== 'undefined';
});

test('state.character存在', () => {
    return 'character' in window.state;
});

test('state.stats存在', () => {
    return 'stats' in window.state && typeof window.state.stats === 'object';
});

// 测试4：检查localStorage数据
test('localStorage有数据', () => {
    const data = localStorage.getItem('matchstickTimeManager');
    if (!data) return 'warning'; // 新用户可能没有数据
    return true;
});

test('localStorage数据可解析', () => {
    const data = localStorage.getItem('matchstickTimeManager');
    if (!data) return 'warning';
    try {
        JSON.parse(data);
        return true;
    } catch (e) {
        return `JSON解析失败: ${e.message}`;
    }
});

test('localStorage数据有version字段', () => {
    const data = localStorage.getItem('matchstickTimeManager');
    if (!data) return 'warning';
    const parsed = JSON.parse(data);
    if (!('version' in parsed)) {
        return 'warning'; // 旧数据还没迁移
    }
    return parsed.version >= 1;
});

test('localStorage数据有lastSaved字段', () => {
    const data = localStorage.getItem('matchstickTimeManager');
    if (!data) return 'warning';
    const parsed = JSON.parse(data);
    return 'lastSaved' in parsed || 'warning';
});

// 测试5：功能测试
test('saveState函数存在', () => {
    return typeof window.saveState === 'function';
});

test('saveState函数可调用', () => {
    if (typeof window.state === 'undefined') return 'warning';
    try {
        // 尝试保存（如果state存在）
        const result = window.saveState();
        return result !== false;
    } catch (e) {
        return `保存失败: ${e.message}`;
    }
});

test('StorageManager.loadState可调用', () => {
    try {
        const result = window.StorageManager.loadState();
        return true; // 即使返回null也是正常的（新用户）
    } catch (e) {
        return `加载失败: ${e.message}`;
    }
});

// 测试6：检查控制台日志
test('控制台有重构日志', () => {
    // 这个测试需要手动确认
    console.log('\n📋 请检查上方控制台是否有以下日志:');
    console.log('   - [Refactoring] Loading compatibility layer...');
    console.log('   - [Refactoring] Compatibility layer ready');
    console.log('   - [Refactoring] StorageManager available: true');
    console.log('   - [Refactoring] StateManager available: true');
    return 'warning';
});

// 输出结果
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 测试结果:');
console.log(`   ✅ 通过: ${tests.passed}`);
console.log(`   ❌ 失败: ${tests.failed}`);
console.log(`   ⚠️ 警告: ${tests.warnings}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (tests.failed === 0) {
    console.log('🎉 恭喜！重构成功！所有测试通过。\n');
    console.log('📋 下一步:');
    console.log('   1. 使用应用1-2天，确保稳定');
    console.log('   2. 提交代码: git add -A && git commit');
    console.log('   3. 阅读 "重构完成-下一步.md" 了解下一步\n');
} else {
    console.error('⚠️ 发现问题！请检查失败的测试。\n');
    console.log('💡 调试建议:');
    console.log('   1. 检查index.html是否正确引入了core模块');
    console.log('   2. 检查scripts/core/目录是否存在');
    console.log('   3. 查看浏览器网络标签，确认文件加载成功');
    console.log('   4. 如果问题严重，可以回滚: git checkout .\n');
}

// 额外信息
console.log('📦 数据统计:');
try {
    const data = localStorage.getItem('matchstickTimeManager');
    if (data) {
        const parsed = JSON.parse(data);
        console.log(`   版本: ${parsed.version || '未设置'}`);
        console.log(`   角色: ${parsed.character?.name || '未创建'}`);
        console.log(`   数据大小: ${(data.length / 1024).toFixed(2)} KB`);
        console.log(`   最后保存: ${parsed.lastSaved || '未知'}`);
        
        if (parsed.stats) {
            console.log(`   火苗: ${parsed.stats.flame || 0}`);
            console.log(`   总天数: ${parsed.stats.totalDays || 0}`);
        }
    } else {
        console.log('   (新用户，暂无数据)');
    }
} catch (e) {
    console.log('   无法读取数据统计');
}

console.log('\n💾 备份建议:');
console.log('   执行以下命令创建备份:');
console.log('   const backup = localStorage.getItem("matchstickTimeManager");');
console.log('   localStorage.setItem("matchstickTimeManager_backup_' + new Date().toISOString().slice(0,10) + '", backup);');
console.log('   console.log("✅ 备份已创建");');

console.log('\n🔍 查看所有备份:');
console.log('   Object.keys(localStorage).filter(k => k.includes("backup")).forEach(k => console.log(k));');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

