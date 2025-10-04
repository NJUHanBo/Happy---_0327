#!/usr/bin/env python3
"""
最终版一生计分计算器
使用精确的节气分界算法
"""

import sys
import os
import datetime
import csv
from collections import defaultdict

# 添加bazi_lib到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
bazi_lib_path = os.path.join(current_dir, 'bazi_lib')
sys.path.insert(0, bazi_lib_path)

from lunar_python import Solar, Lunar

# 专属计分规则
TIANGAN_SCORES = {
    '甲': 1, '乙': 4, '丙': 2, '丁': 3, '戊': 8,
    '己': 5, '庚': 9, '辛': 7, '壬': 10, '癸': 6
}

DIZHI_SCORES = {
    '子': 12, '丑': 10, '寅': 1, '卯': 2, '辰': 3, '巳': 5,
    '午': 4, '未': 6, '申': 11, '酉': 8, '戌': 9, '亥': 7
}

# 大运周期
USER_DAYUN_SEQUENCE = [
    {'ganzhi': '辛巳', 'start_year': 1997, 'end_year': 2007},
    {'ganzhi': '庚辰', 'start_year': 2007, 'end_year': 2017},
    {'ganzhi': '己卯', 'start_year': 2017, 'end_year': 2027},
    {'ganzhi': '戊寅', 'start_year': 2027, 'end_year': 2037},
    {'ganzhi': '丁丑', 'start_year': 2037, 'end_year': 2047},
    {'ganzhi': '丙子', 'start_year': 2047, 'end_year': 2057},
    {'ganzhi': '乙亥', 'start_year': 2057, 'end_year': 2067},
]

def get_ganzhi_score(gan, zhi):
    """计算干支分数"""
    return TIANGAN_SCORES[gan] + DIZHI_SCORES[zhi]

def get_dayun_for_year(year):
    """根据年份获取对应的大运"""
    for dayun in USER_DAYUN_SEQUENCE:
        if dayun['start_year'] <= year < dayun['end_year']:
            return dayun['ganzhi']
    
    if year >= USER_DAYUN_SEQUENCE[-1]['start_year']:
        return USER_DAYUN_SEQUENCE[-1]['ganzhi']
    
    return USER_DAYUN_SEQUENCE[0]['ganzhi']

def get_accurate_ganzhi_for_date(year, month, day):
    """获取指定日期的准确干支（考虑节气分界）"""
    try:
        solar = Solar.fromYmdHms(year, month, day, 12, 0, 0)
        lunar = solar.getLunar()
        ba = lunar.getEightChar()
        
        return {
            'year_gan': ba.getYearGan(),
            'year_zhi': ba.getYearZhi(),
            'month_gan': ba.getMonthGan(),
            'month_zhi': ba.getMonthZhi(),
            'day_gan': ba.getDayGan(),
            'day_zhi': ba.getDayZhi()
        }
    except Exception as e:
        print(f"获取{year}-{month}-{day}干支时出错: {e}")
        return None

def calculate_final_lifetime_scores(start_year=1995, end_year=2055):
    """计算最终版一生每日分数"""
    
    print("🚀 开始最终版一生分数计算")
    print("=" * 60)
    print(f"📅 计算范围: {start_year}年-{end_year}年")
    print(f"⚡ 使用节气分界算法")
    print(f"📊 预计天数: 约{(end_year - start_year + 1) * 365}天")
    
    daily_scores = []
    processed_days = 0
    
    # 按年计算
    for year in range(start_year, end_year + 1):
        print(f"   正在计算 {year}年...", end="")
        
        year_count = 0
        
        # 计算当年每一天
        current_date = datetime.date(year, 1, 1)
        end_date = datetime.date(year, 12, 31)
        
        while current_date <= end_date:
            try:
                # 获取当天的准确干支（考虑节气分界）
                ganzhi = get_accurate_ganzhi_for_date(current_date.year, current_date.month, current_date.day)
                
                if ganzhi:
                    # 获取大运
                    current_dayun = get_dayun_for_year(year)
                    dayun_gan, dayun_zhi = current_dayun[0], current_dayun[1]
                    dayun_score = get_ganzhi_score(dayun_gan, dayun_zhi)
                    
                    # 计算各层分数
                    liunian_score = get_ganzhi_score(ganzhi['year_gan'], ganzhi['year_zhi'])
                    liuyue_score = get_ganzhi_score(ganzhi['month_gan'], ganzhi['month_zhi'])
                    liuri_score = get_ganzhi_score(ganzhi['day_gan'], ganzhi['day_zhi'])
                    
                    # 最终总分
                    final_score = dayun_score + liunian_score + liuyue_score + liuri_score
                    
                    # 记录数据
                    daily_data = {
                        'date': current_date.strftime('%Y-%m-%d'),
                        'year': year,
                        'dayun_ganzhi': current_dayun,
                        'liunian_ganzhi': f"{ganzhi['year_gan']}{ganzhi['year_zhi']}",
                        'liuyue_ganzhi': f"{ganzhi['month_gan']}{ganzhi['month_zhi']}",
                        'liuri_ganzhi': f"{ganzhi['day_gan']}{ganzhi['day_zhi']}",
                        'dayun_score': dayun_score,
                        'liunian_score': liunian_score,
                        'liuyue_score': liuyue_score,
                        'liuri_score': liuri_score,
                        'final_score': final_score
                    }
                    
                    daily_scores.append(daily_data)
                    year_count += 1
                
                current_date += datetime.timedelta(days=1)
                processed_days += 1
                
            except Exception as e:
                print(f"计算{current_date}时出错: {e}")
                current_date += datetime.timedelta(days=1)
                continue
        
        print(f" 完成({year_count}天)")
        
        # 每10年显示进度
        if year % 10 == 0:
            print(f"     📈 已处理 {processed_days} 天")
    
    print(f"\n✅ 计算完成！共处理了 {processed_days} 天的数据")
    return daily_scores

def save_final_results(daily_scores):
    """保存最终结果"""
    filename = "最终版一生每日分数_1995-2055.csv"
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    print(f"💾 正在保存到 {filepath}...")
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'year', 'dayun_ganzhi', 'liunian_ganzhi', 'liuyue_ganzhi', 'liuri_ganzhi',
                     'dayun_score', 'liunian_score', 'liuyue_score', 'liuri_score', 'final_score']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # 写入表头
        writer.writerow({
            'date': '日期',
            'year': '年份',
            'dayun_ganzhi': '大运干支',
            'liunian_ganzhi': '流年干支',
            'liuyue_ganzhi': '流月干支',
            'liuri_ganzhi': '流日干支',
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

def analyze_final_results(daily_scores):
    """分析最终结果"""
    if not daily_scores:
        return
    
    print(f"\n📈 最终版数据分析:")
    print(f"   总计天数: {len(daily_scores)}天")
    
    # 分数统计
    scores = [item['final_score'] for item in daily_scores]
    print(f"   最高分: {max(scores)}分")
    print(f"   最低分: {min(scores)}分") 
    print(f"   平均分: {sum(scores)/len(scores):.1f}分")
    
    # 按年代统计
    print(f"\n📅 各年代平均分:")
    decade_scores = defaultdict(list)
    for item in daily_scores:
        decade = (item['year'] // 10) * 10
        decade_scores[decade].append(item['final_score'])
    
    for decade in sorted(decade_scores.keys()):
        avg_score = sum(decade_scores[decade]) / len(decade_scores[decade])
        print(f"   {decade}年代: {avg_score:.1f}分")

if __name__ == "__main__":
    try:
        print("⚡ 开始最终版61年计算，使用精确节气分界算法...")
        
        # 计算一生每日分数
        daily_scores = calculate_final_lifetime_scores(1995, 2055)
        
        if daily_scores:
            # 保存到CSV文件
            csv_filepath = save_final_results(daily_scores)
            
            # 分析结果
            analyze_final_results(daily_scores)
            
            print(f"\n🎉 最终版计算完成！")
            print(f"   📊 共计算了{len(daily_scores)}天的数据")
            print(f"   📁 数据文件: {csv_filepath}")
            print(f"   🎯 现在可以生成准确的图表了")
            
        else:
            print("❌ 没有计算出任何数据")
            
    except Exception as e:
        print(f"❌ 程序执行出错: {str(e)}")
        import traceback
        traceback.print_exc()






