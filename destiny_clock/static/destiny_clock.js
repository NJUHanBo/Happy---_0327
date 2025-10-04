// 命运时钟专属版JavaScript

// 用户专属信息
const USER_INFO = {
    birthDate: '1995-06-11',
    birthTime: '3-5',
    gender: 'male',
            bazi: {
        year: { gan: '乙', zhi: '亥' },
        month: { gan: '壬', zhi: '午' },
        day: { gan: '癸', zhi: '酉' },
        hour: { gan: '甲', zhi: '寅' }
    }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('命运时钟专属版加载完成');
    displayBaziInfo();
    initializeCharts();
});

// 显示八字信息
function displayBaziInfo() {
    const bazi = USER_INFO.bazi;
    document.getElementById('year-gan').textContent = bazi.year.gan;
    document.getElementById('year-zhi').textContent = bazi.year.zhi;
    document.getElementById('month-gan').textContent = bazi.month.gan;
    document.getElementById('month-zhi').textContent = bazi.month.zhi;
    document.getElementById('day-gan').textContent = bazi.day.gan;
    document.getElementById('day-zhi').textContent = bazi.day.zhi;
    document.getElementById('hour-gan').textContent = bazi.hour.gan;
    document.getElementById('hour-zhi').textContent = bazi.hour.zhi;
}

// 返回主页
function goBack() {
    // 判断当前是从哪个端口访问的
    if (window.location.port === '8000') {
        window.location.href = '/index.html';
    } else {
        window.location.href = '../index.html';
    }
}

// 跳转到命理分析页面
function goToMingliAnalysis() {
    window.location.href = 'mingli_analysis.html';
}



// 图表相关功能
const chartInstances = {};

// 莫兰迪色系配置
const chartColors = {
    primary: '#B6A6A0',
    secondary: '#9B8B85', 
    accent: '#7D6F6A',
    success: '#A3B899',
    warning: '#D4B499',
    text: '#4A413E',
    textSecondary: '#6B5F5B'
};

// 初始化所有图表
async function initializeCharts() {
    console.log('开始初始化图表...');
    try {
        // 加载所有图表
        await Promise.all([
            loadDayunChart(),
            loadLiunianChart(),
            loadLiuyueChart(),
            loadLiuriChart()
        ]);
        console.log('所有图表加载完成');
    } catch (error) {
        console.error('图表初始化失败:', error);
    }
}

// 图表功能已集成到主分析流程中（drawNewFortuneCharts），无需单独调用废弃的API

// 获取图表通用配置
function getChartOptions(title, currentIndex = 0) {
    return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
            title: {
                display: false
            },
                    legend: {
                        display: false
                    },
                    tooltip: {
                backgroundColor: 'rgba(74, 65, 62, 0.9)',
                titleColor: '#F9FAFB',
                bodyColor: '#F9FAFB',
                borderColor: chartColors.primary,
                        borderWidth: 1,
                cornerRadius: 8,
                        callbacks: {
                    afterBody: function(tooltipItems) {
                        const index = tooltipItems[0].dataIndex;
                        if (index === currentIndex) {
                            return '← 当前位置';
                        }
                        return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                beginAtZero: false,
                        grid: {
                    color: 'rgba(182, 166, 160, 0.2)'
                    },
                        ticks: {
                    color: chartColors.textSecondary,
                    font: {
                        family: 'PingFang SC, Microsoft YaHei'
                    }
                }
            },
            x: {
                        grid: {
                    color: 'rgba(182, 166, 160, 0.2)'
                    },
                        ticks: {
                    color: chartColors.textSecondary,
                    font: {
                        family: 'PingFang SC, Microsoft YaHei'
                        },
                    maxRotation: 45
                        }
                    }
                },
                elements: {
                    point: {
                hoverBorderWidth: 3
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutCubic'
        }
    };
}

// 加载大运图表
async function loadDayunChart() {
    try {
        const response = await fetch('/api/chart/dayun');
        const result = await response.json();
        
        if (result.success) {
            const ctx = document.getElementById('dayun-chart').getContext('2d');
            const chartData = result.data;
            
            // 销毁旧图表（如果存在）
            if (chartInstances.dayun) {
                chartInstances.dayun.destroy();
            }
            
            // 创建新图表
            chartInstances.dayun = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: '大运走势',
                        data: chartData.data,
                        borderColor: chartColors.primary,
                        backgroundColor: `${chartColors.primary}20`,
                        pointBackgroundColor: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? chartColors.accent : chartColors.primary
                        ),
                        pointRadius: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? 8 : 5
                        ),
                        pointHoverRadius: 8,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: getChartOptions('大运走势', chartData.current_index)
            });
        }
    } catch (error) {
        console.error('加载大运图表失败:', error);
    }
}

// 加载流年图表
async function loadLiunianChart() {
    try {
        const response = await fetch('/api/chart/liunian');
        const result = await response.json();
        
        if (result.success) {
            const ctx = document.getElementById('liunian-chart').getContext('2d');
            const chartData = result.data;
            
            // 销毁旧图表（如果存在）
            if (chartInstances.liunian) {
                chartInstances.liunian.destroy();
            }
            
            // 创建新图表
            chartInstances.liunian = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: '流年运势',
                        data: chartData.data,
                        borderColor: chartColors.secondary,
                        backgroundColor: `${chartColors.secondary}20`,
                        pointBackgroundColor: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? chartColors.accent : chartColors.secondary
                        ),
                        pointRadius: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? 8 : 4
                        ),
                        pointHoverRadius: 7,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: getChartOptions('流年运势', chartData.current_index)
            });
        }
    } catch (error) {
        console.error('加载流年图表失败:', error);
    }
}

// 加载流月图表
async function loadLiuyueChart() {
    try {
        const response = await fetch('/api/chart/liuyue');
        const result = await response.json();
        
        if (result.success) {
            const ctx = document.getElementById('liuyue-chart').getContext('2d');
            const chartData = result.data;
            
            // 销毁旧图表（如果存在）
            if (chartInstances.liuyue) {
                chartInstances.liuyue.destroy();
            }
            
            // 创建新图表
            chartInstances.liuyue = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: '流月趋势',
                        data: chartData.data,
                        borderColor: chartColors.success,
                        backgroundColor: `${chartColors.success}20`,
                        pointBackgroundColor: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? chartColors.accent : chartColors.success
                        ),
                        pointRadius: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? 8 : 3
                        ),
                        pointHoverRadius: 6,
                        borderWidth: 2,
                        tension: 0.2,
                        fill: true
                    }]
                },
                options: getChartOptions('流月趋势', chartData.current_index)
            });
        }
    } catch (error) {
        console.error('加载流月图表失败:', error);
    }
}

// 加载流日图表
async function loadLiuriChart() {
    try {
        const response = await fetch('/api/chart/liuri');
        const result = await response.json();
        
        if (result.success) {
            const ctx = document.getElementById('liuri-chart').getContext('2d');
            const chartData = result.data;
            
            // 销毁旧图表（如果存在）
            if (chartInstances.liuri) {
                chartInstances.liuri.destroy();
            }
            
            // 创建新图表
            chartInstances.liuri = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: '流日分数',
                        data: chartData.data,
                        borderColor: chartColors.warning,
                        backgroundColor: `${chartColors.warning}20`,
                        pointBackgroundColor: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? chartColors.accent : chartColors.warning
                        ),
                        pointRadius: chartData.labels.map((_, i) => 
                            i === chartData.current_index ? 8 : 3
                        ),
                        pointHoverRadius: 6,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: getChartOptions('流日分数', chartData.current_index)
            });
        }
    } catch (error) {
        console.error('加载流日图表失败:', error);
    }
}
