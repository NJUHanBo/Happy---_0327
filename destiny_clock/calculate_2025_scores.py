#!/usr/bin/env python3
"""
计算2025年每一天的流日分数
基于用户专属计分规则
"""

import sys
import os
import datetime
import csv

# 添加bazi_lib到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
bazi_lib_path = os.path.join(current_dir, 'bazi_lib')
sys.path.insert(0, bazi_lib_path)

from lunar_python import Solar, Lunar

# 用户专属计分规则
TIANGAN_SCORES = {
    '甲': 1, '乙': 4, '丙': 2, '丁': 3, '戊': 8,
    '己': 5, '庚': 9, '辛': 7, '壬': 10, '癸': 6
}

DIZHI_SCORES = {
    '子': 12, '丑': 10, '寅': 1, '卯': 2, '辰': 3, '巳': 5,
    '午': 4, '未': 6, '申': 11, '酉': 8, '戌': 9, '亥': 7
}

def get_ganzhi_score(gan, zhi):
    """计算干支分数"""
    return TIANGAN_SCORES[gan] + DIZHI_SCORES[zhi]

def get_ganzhi_from_date(year, month, day, hour=12):
    """获取指定日期的干支"""
    try:
        solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
        lunar = solar.getLunar()
        ba = lunar.getEightChar()
        return {
            'year': {'gan': ba.getYearGan(), 'zhi': ba.getYearZhi()},
            'month': {'gan': ba.getMonthGan(), 'zhi': ba.getMonthZhi()},
            'day': {'gan': ba.getDayGan(), 'zhi': ba.getDayZhi()}
        }
    except Exception as e:
        print(f"获取{year}-{month}-{day}干支时出错: {e}")
        return None

def calculate_2025_daily_scores():
    """计算2025年每一天的分数"""
    
    print("🚀 开始计算2025年每日流日分数")
    print("=" * 50)
    
    # 用户信息
    user_info = {
        'birth_date': '1995-06-11',
        'current_dayun': {'gan': '己', 'zhi': '卯'},  # 己卯大运（22-32岁）
        'year_2025': {'gan': '乙', 'zhi': '巳'}  # 2025年乙巳年
    }
    
    print(f"👤 用户信息:")
    print(f"   出生: {user_info['birth_date']} 寅时 男")
    print(f"   当前大运: {user_info['current_dayun']['gan']}{user_info['current_dayun']['zhi']}")
    print(f"   2025年流年: {user_info['year_2025']['gan']}{user_info['year_2025']['zhi']}")
    
    # 计算固定分数
    dayun_score = get_ganzhi_score(user_info['current_dayun']['gan'], user_info['current_dayun']['zhi'])
    liunian_score = get_ganzhi_score(user_info['year_2025']['gan'], user_info['year_2025']['zhi'])
    
    print(f"   大运分数: {user_info['current_dayun']['gan']}({TIANGAN_SCORES[user_info['current_dayun']['gan']]}) + {user_info['current_dayun']['zhi']}({DIZHI_SCORES[user_info['current_dayun']['zhi']]}) = {dayun_score}")
    print(f"   流年分数: {user_info['year_2025']['gan']}({TIANGAN_SCORES[user_info['year_2025']['gan']]}) + {user_info['year_2025']['zhi']}({DIZHI_SCORES[user_info['year_2025']['zhi']]}) = {liunian_score}")
    
    print("\n📊 开始计算每日数据...")
    
    # 存储结果
    daily_scores = []
    
    # 计算2025年每一天（1月1日到12月31日）
    current_date = datetime.date(2025, 1, 1)
    end_date = datetime.date(2025, 12, 31)
    
    while current_date <= end_date:
        try:
            # 获取当天的干支信息
            ganzhi_info = get_ganzhi_from_date(current_date.year, current_date.month, current_date.day)
            
            if ganzhi_info:
                # 计算流月分数
                liuyue_score = get_ganzhi_score(ganzhi_info['month']['gan'], ganzhi_info['month']['zhi'])
                
                # 计算流日分数
                liuri_score = get_ganzhi_score(ganzhi_info['day']['gan'], ganzhi_info['day']['zhi'])
                
                # 计算最终总分
                final_score = dayun_score + liunian_score + liuyue_score + liuri_score
                
                # 记录数据
                daily_data = {
                    'date': current_date.strftime('%Y-%m-%d'),
                    'weekday': current_date.strftime('%A'),
                    'month_ganzhi': f"{ganzhi_info['month']['gan']}{ganzhi_info['month']['zhi']}",
                    'day_ganzhi': f"{ganzhi_info['day']['gan']}{ganzhi_info['day']['zhi']}",
                    'dayun_score': dayun_score,
                    'liunian_score': liunian_score,
                    'liuyue_score': liuyue_score,
                    'liuri_score': liuri_score,
                    'final_score': final_score
                }
                
                daily_scores.append(daily_data)
                
                # 显示进度
                if current_date.day == 1:
                    print(f"   {current_date.strftime('%Y年%m月')} - 流月: {daily_data['month_ganzhi']}({liuyue_score}分)")
            
            current_date += datetime.timedelta(days=1)
            
        except Exception as e:
            print(f"计算{current_date}时出错: {e}")
            current_date += datetime.timedelta(days=1)
            continue
    
    return daily_scores

def save_results_to_csv(daily_scores):
    """保存结果到CSV文件"""
    filename = "2025年每日流日分数.csv"
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'weekday', 'month_ganzhi', 'day_ganzhi', 
                     'dayun_score', 'liunian_score', 'liuyue_score', 'liuri_score', 'final_score']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # 写入表头
        writer.writerow({
            'date': '日期',
            'weekday': '星期',
            'month_ganzhi': '流月干支',
            'day_ganzhi': '流日干支',
            'dayun_score': '大运分数',
            'liunian_score': '流年分数',
            'liuyue_score': '流月分数',
            'liuri_score': '流日分数',
            'final_score': '最终总分'
        })
        
        # 写入数据
        for row in daily_scores:
            writer.writerow(row)
    
    print(f"✅ 结果已保存到: {filepath}")
    return filepath

def analyze_results(daily_scores):
    """分析结果"""
    if not daily_scores:
        return
    
    print(f"\n📈 2025年数据分析:")
    print(f"   总计天数: {len(daily_scores)}天")
    
    # 分数统计
    scores = [item['final_score'] for item in daily_scores]
    print(f"   最高分: {max(scores)}分")
    print(f"   最低分: {min(scores)}分") 
    print(f"   平均分: {sum(scores)/len(scores):.1f}分")
    
    # 找出最高分和最低分的日期
    max_score_items = [item for item in daily_scores if item['final_score'] == max(scores)]
    min_score_items = [item for item in daily_scores if item['final_score'] == min(scores)]
    
    print(f"\n🌟 最高分日期 ({max(scores)}分):")
    for item in max_score_items[:5]:  # 只显示前5个
        print(f"   {item['date']} {item['weekday']} - {item['day_ganzhi']}")
    
    print(f"\n⚠️ 最低分日期 ({min(scores)}分):")
    for item in min_score_items[:5]:  # 只显示前5个
        print(f"   {item['date']} {item['weekday']} - {item['day_ganzhi']}")
    
    # 按月统计平均分
    print(f"\n📅 各月平均分:")
    monthly_scores = {}
    for item in daily_scores:
        month = item['date'][:7]  # YYYY-MM
        if month not in monthly_scores:
            monthly_scores[month] = []
        monthly_scores[month].append(item['final_score'])
    
    for month in sorted(monthly_scores.keys()):
        avg_score = sum(monthly_scores[month]) / len(monthly_scores[month])
        print(f"   {month}: {avg_score:.1f}分")

if __name__ == "__main__":
    try:
        # 计算2025年每日分数
        daily_scores = calculate_2025_daily_scores()
        
        if daily_scores:
            # 保存到CSV文件
            csv_filepath = save_results_to_csv(daily_scores)
            
            # 分析结果
            analyze_results(daily_scores)
            
            print(f"\n🎉 计算完成！共计算了{len(daily_scores)}天的数据")
            
        else:
            print("❌ 没有计算出任何数据")
            
    except Exception as e:
        print(f"❌ 程序执行出错: {str(e)}")
        import traceback
        traceback.print_exc()






