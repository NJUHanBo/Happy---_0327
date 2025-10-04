// 存储管理模块 - 负责localStorage的读写和数据迁移
// 这是重构的第一步：建立可靠的数据持久化基础

const STORAGE_KEY = 'matchstickTimeManager';
const CURRENT_VERSION = 1; // 当前数据版本

/**
 * 保存state到localStorage
 * @param {Object} state - 应用状态对象
 */
function saveState(state) {
    try {
        // 确保state包含版本号
        const stateWithVersion = {
            ...state,
            version: CURRENT_VERSION,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithVersion));
        console.log(`[Storage] State saved (version ${CURRENT_VERSION})`);
        return true;
    } catch (error) {
        console.error('[Storage] Failed to save state:', error);
        
        // 如果失败，尝试保存最小化版本（只保存关键数据）
        try {
            const minimalState = {
                version: CURRENT_VERSION,
                character: state.character,
                stats: state.stats,
                dailyTasks: state.dailyTasks || [],
                projects: state.projects || [],
                todos: state.todos || []
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
            console.warn('[Storage] Saved minimal state');
            return true;
        } catch (e) {
            console.error('[Storage] Failed to save even minimal state:', e);
            return false;
        }
    }
}

/**
 * 从localStorage加载state
 * @returns {Object|null} 加载的state或null
 */
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            console.log('[Storage] No saved state found');
            return null;
        }
        
        const state = JSON.parse(saved);
        const version = state.version || 0;
        
        console.log(`[Storage] Loaded state (version ${version})`);
        
        // 如果版本不匹配，进行迁移
        if (version < CURRENT_VERSION) {
            console.log(`[Storage] Migrating from v${version} to v${CURRENT_VERSION}`);
            return migrateState(state, version);
        }
        
        return state;
    } catch (error) {
        console.error('[Storage] Failed to load state:', error);
        
        // 尝试创建备份
        try {
            const corrupted = localStorage.getItem(STORAGE_KEY);
            const backupKey = `${STORAGE_KEY}_corrupted_${Date.now()}`;
            localStorage.setItem(backupKey, corrupted);
            console.warn(`[Storage] Corrupted state backed up to ${backupKey}`);
        } catch (e) {
            console.error('[Storage] Could not backup corrupted state');
        }
        
        return null;
    }
}

/**
 * 迁移旧版本数据到新版本
 * @param {Object} oldState - 旧版本state
 * @param {number} fromVersion - 源版本号
 * @returns {Object} 迁移后的state
 */
function migrateState(oldState, fromVersion) {
    let state = { ...oldState };
    
    // 从版本0迁移到版本1
    if (fromVersion < 1) {
        console.log('[Storage] Applying migration v0 -> v1');
        
        // 确保所有必需字段存在
        state.version = 1;
        
        // 确保settings存在
        if (!state.settings) {
            state.settings = { scrollSpeed: 30 };
        }
        
        // 确保deepseek配置存在
        if (!state.settings.deepseek) {
            state.settings.deepseek = {
                useApi: false,
                apiKey: ''
            };
        }
        
        // 确保nightTransition存在
        if (!state.nightTransition) {
            state.nightTransition = {
                videoPath: null,
                encouragements: ['今天辛苦了，好好休息吧 ✨']
            };
        }
        
        // 确保drafts存在
        if (!state.drafts) {
            state.drafts = [];
        }
        
        // 确保magicAcademy存在
        if (!state.magicAcademy) {
            state.magicAcademy = {
                discoveredParchments: [],
                lastExcavation: null
            };
        }
        
        // 确保shop结构完整
        if (!state.shop) {
            state.shop = { activeEffects: {} };
        }
        if (!state.shop.activeEffects) {
            state.shop.activeEffects = {};
        }
        
        // 确保vacation结构完整
        if (!state.vacation) {
            state.vacation = {
                isOnVacation: false,
                vacationType: null,
                startDate: null,
                endDate: null,
                canEndEarly: true
            };
        }
        
        // 确保depression结构完整
        if (!state.depression) {
            state.depression = {
                status: '黑狗缠身',
                dailySpirit: 50,
                nextMilestone: 7,
                milestones: {
                    7: { status: '黑狗退后', spirit: 60 },
                    30: { status: '黑狗退散', spirit: 75 },
                    60: { status: '战胜黑狗', spirit: 100 }
                }
            };
        }
    }
    
    // 未来的版本迁移在这里添加
    // if (fromVersion < 2) { ... }
    
    console.log('[Storage] Migration completed');
    return state;
}

/**
 * 导出用户数据
 * @returns {string} JSON格式的数据
 */
function exportData() {
    const state = loadState();
    if (!state) {
        throw new Error('No data to export');
    }
    
    const exportData = {
        version: CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        data: state
    };
    
    return JSON.stringify(exportData, null, 2);
}

/**
 * 导入用户数据
 * @param {string} jsonData - JSON格式的数据
 * @returns {boolean} 是否成功
 */
function importData(jsonData) {
    try {
        const imported = JSON.parse(jsonData);
        
        // 验证数据格式
        if (!imported.data) {
            throw new Error('Invalid export format');
        }
        
        // 迁移到当前版本
        const version = imported.data.version || 0;
        const state = version < CURRENT_VERSION 
            ? migrateState(imported.data, version)
            : imported.data;
        
        // 保存
        return saveState(state);
    } catch (error) {
        console.error('[Storage] Failed to import data:', error);
        return false;
    }
}

/**
 * 清除所有数据
 */
function clearData() {
    try {
        // 先备份
        const state = loadState();
        if (state) {
            const backupKey = `${STORAGE_KEY}_backup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(state));
            console.log(`[Storage] Backup created: ${backupKey}`);
        }
        
        // 清除主数据
        localStorage.removeItem(STORAGE_KEY);
        console.log('[Storage] Data cleared');
        return true;
    } catch (error) {
        console.error('[Storage] Failed to clear data:', error);
        return false;
    }
}

// 导出API
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = {
        saveState,
        loadState,
        exportData,
        importData,
        clearData,
        CURRENT_VERSION
    };
} else {
    // 浏览器环境 - 挂载到window
    window.StorageManager = {
        saveState,
        loadState,
        exportData,
        importData,
        clearData,
        CURRENT_VERSION
    };
}

