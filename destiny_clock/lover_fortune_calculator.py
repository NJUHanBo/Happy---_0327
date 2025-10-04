#!/usr/bin/env python3
"""
爱人运势计算器
基于爱人的专属计分规则
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

# 爱人专属计分规则
LOVER_TIANGAN_SCORES = {
    '甲': 1, '乙': 3, '丙': 10, '丁': 8, '戊': 9,
    '己': 7, '庚': 6, '辛': 5, '壬': 2, '癸': 4
}

LOVER_DIZHI_SCORES = {
    '子': 4, '丑': 6, '寅': 1, '卯': 9, '辰': 2, '巳': 10,
    '午': 12, '未': 7, '申': 5, '酉': 3, '戌': 11, '亥': 8
}

# 爱人大运序列（1994年出生，从1998年壬申开始）
LOVER_DAYUN_SEQUENCE = [
    {'ganzhi': '壬申', 'start_year': 1998, 'end_year': 2008},
    {'ganzhi': '辛未', 'start_year': 2008, 'end_year': 2018},
    {'ganzhi': '庚午', 'start_year': 2018, 'end_year': 2028},
    {'ganzhi': '己巳', 'start_year': 2028, 'end_year': 2038},
    {'ganzhi': '戊辰', 'start_year': 2038, 'end_year': 2048},
    {'ganzhi': '丁卯', 'start_year': 2048, 'end_year': 2058},
    {'ganzhi': '丙寅', 'start_year': 2058, 'end_year': 2068},
]

def get_lover_ganzhi_score(gan, zhi):
    """计算爱人的干支分数"""
    return LOVER_TIANGAN_SCORES[gan] + LOVER_DIZHI_SCORES[zhi]

def get_lover_dayun_for_year(year):
    """根据年份获取爱人对应的大运"""
    for dayun in LOVER_DAYUN_SEQUENCE:
        if dayun['start_year'] <= year < dayun['end_year']:
            return dayun['ganzhi']
    
    if year >= LOVER_DAYUN_SEQUENCE[-1]['start_year']:
        return LOVER_DAYUN_SEQUENCE[-1]['ganzhi']
    
    return LOVER_DAYUN_SEQUENCE[0]['ganzhi']

def verify_lover_dayun_sequence():
    """验证爱人的大运序列"""
    print("🔍 验证爱人大运序列")
    print("=" * 50)
    
    print("👩 爱人信息:")
    print("   出生: 1994年")
    print("   起运: 1998年壬申大运")
    print()
    
    print("📊 推算的大运序列:")
    for i, dayun in enumerate(LOVER_DAYUN_SEQUENCE):
        gan, zhi = dayun['ganzhi'][0], dayun['ganzhi'][1]
        score = get_lover_ganzhi_score(gan, zhi)
        age_start = dayun['start_year'] - 1994
        age_end = dayun['end_year'] - 1994
        
        print(f"   {dayun['ganzhi']} ({dayun['start_year']}-{dayun['end_year']}) {age_start}-{age_end}岁 = {gan}({LOVER_TIANGAN_SCORES[gan]}) + {zhi}({LOVER_DIZHI_SCORES[zhi]}) = {score}分")

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

def calculate_lover_2025_sample():
    """计算爱人2025年各月的分数样本"""
    print("\n📊 计算爱人2025年各月运势")
    print("=" * 50)
    
    current_year = 2025
    current_dayun = get_lover_dayun_for_year(current_year)
    dayun_gan, dayun_zhi = current_dayun[0], current_dayun[1]
    dayun_score = get_lover_ganzhi_score(dayun_gan, dayun_zhi)
    
    print(f"🔮 2025年基础信息:")
    print(f"   当前大运: {current_dayun} = {dayun_score}分")
    print(f"   年龄: {current_year - 1994}岁")
    
    print(f"\n📅 2025年各月运势:")
    
    for month in range(1, 13):
        # 使用月中时间计算
        ganzhi = get_accurate_ganzhi_for_date(2025, month, 15)
        
        if ganzhi:
            # 计算各层分数
            liunian_score = get_lover_ganzhi_score(ganzhi['year_gan'], ganzhi['year_zhi'])
            liuyue_score = get_lover_ganzhi_score(ganzhi['month_gan'], ganzhi['month_zhi'])
            
            # 月度平均分（不含流日变化）
            month_base_score = dayun_score + liunian_score + liuyue_score
            
            print(f"   {month}月: {ganzhi['month_gan']}{ganzhi['month_zhi']}({liuyue_score}) + {ganzhi['year_gan']}{ganzhi['year_zhi']}({liunian_score}) + {current_dayun}({dayun_score}) = {month_base_score}分")

def calculate_lover_lifetime_scores(start_year=1995, end_year=2055):
    """计算爱人一生的分数（示例：部分年份）"""
    print(f"\n🚀 开始计算爱人的运势数据")
    print("=" * 60)
    print(f"📅 计算范围: {start_year}年-{end_year}年")
    print("⚡ 使用爱人的专属计分规则")
    
    daily_scores = []
    processed_days = 0
    
    # 为了演示，先计算几年的数据
    demo_years = [2024, 2025, 2026]
    
    for year in demo_years:
        print(f"   正在计算 {year}年...", end="")
        
        year_count = 0
        
        # 获取当年大运
        current_dayun = get_lover_dayun_for_year(year)
        dayun_gan, dayun_zhi = current_dayun[0], current_dayun[1]
        dayun_score = get_lover_ganzhi_score(dayun_gan, dayun_zhi)
        
        # 计算当年每一天
        current_date = datetime.date(year, 1, 1)
        end_date = datetime.date(year, 12, 31)
        
        while current_date <= end_date:
            try:
                # 获取当天的准确干支
                ganzhi = get_accurate_ganzhi_for_date(current_date.year, current_date.month, current_date.day)
                
                if ganzhi:
                    # 计算各层分数
                    liunian_score = get_lover_ganzhi_score(ganzhi['year_gan'], ganzhi['year_zhi'])
                    liuyue_score = get_lover_ganzhi_score(ganzhi['month_gan'], ganzhi['month_zhi'])
                    liuri_score = get_lover_ganzhi_score(ganzhi['day_gan'], ganzhi['day_zhi'])
                    
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
    
    print(f"\n✅ 示例计算完成！共处理了 {processed_days} 天的数据")
    
    # 简单统计
    if daily_scores:
        scores = [item['final_score'] for item in daily_scores]
        print(f"📊 爱人运势统计 ({len(daily_scores)}天样本):")
        print(f"   最高分: {max(scores)}分")
        print(f"   最低分: {min(scores)}分")
        print(f"   平均分: {sum(scores)/len(scores):.1f}分")
    
    return daily_scores

def compare_couple_fortune():
    """对比夫妻双方的运势"""
    print(f"\n💕 夫妻运势对比分析")
    print("=" * 60)
    
    # 测试同一天的分数
    test_date = datetime.date(2025, 8, 19)  # 今天
    ganzhi = get_accurate_ganzhi_for_date(test_date.year, test_date.month, test_date.day)
    
    if ganzhi:
        print(f"📅 测试日期: {test_date}")
        print(f"干支: {ganzhi['year_gan']}{ganzhi['year_zhi']} {ganzhi['month_gan']}{ganzhi['month_zhi']} {ganzhi['day_gan']}{ganzhi['day_zhi']}")
        print()
        
        # 用户的分数（使用您的规则）
        your_tiangan = {'甲': 1, '乙': 4, '丙': 2, '丁': 3, '戊': 8, '己': 5, '庚': 9, '辛': 7, '壬': 10, '癸': 6}
        your_dizhi = {'子': 12, '丑': 10, '寅': 1, '卯': 2, '辰': 3, '巳': 5, '午': 4, '未': 6, '申': 11, '酉': 8, '戌': 9, '亥': 7}
        
        your_dayun = "己卯"  # 您当前的大运
        your_dayun_score = your_tiangan[your_dayun[0]] + your_dizhi[your_dayun[1]]
        your_liunian_score = your_tiangan[ganzhi['year_gan']] + your_dizhi[ganzhi['year_zhi']]
        your_liuyue_score = your_tiangan[ganzhi['month_gan']] + your_dizhi[ganzhi['month_zhi']]
        your_liuri_score = your_tiangan[ganzhi['day_gan']] + your_dizhi[ganzhi['day_zhi']]
        your_total = your_dayun_score + your_liunian_score + your_liuyue_score + your_liuri_score
        
        # 爱人的分数（使用她的规则）
        lover_dayun = get_lover_dayun_for_year(test_date.year)
        lover_dayun_score = get_lover_ganzhi_score(lover_dayun[0], lover_dayun[1])
        lover_liunian_score = get_lover_ganzhi_score(ganzhi['year_gan'], ganzhi['year_zhi'])
        lover_liuyue_score = get_lover_ganzhi_score(ganzhi['month_gan'], ganzhi['month_zhi'])
        lover_liuri_score = get_lover_ganzhi_score(ganzhi['day_gan'], ganzhi['day_zhi'])
        lover_total = lover_dayun_score + lover_liunian_score + lover_liuyue_score + lover_liuri_score
        
        print(f"👨 您的分数:")
        print(f"   大运: {your_dayun} = {your_dayun_score}分")
        print(f"   流年: {ganzhi['year_gan']}{ganzhi['year_zhi']} = {your_liunian_score}分")
        print(f"   流月: {ganzhi['month_gan']}{ganzhi['month_zhi']} = {your_liuyue_score}分")
        print(f"   流日: {ganzhi['day_gan']}{ganzhi['day_zhi']} = {your_liuri_score}分")
        print(f"   总分: {your_total}分")
        
        print(f"\n👩 爱人的分数:")
        print(f"   大运: {lover_dayun} = {lover_dayun_score}分")
        print(f"   流年: {ganzhi['year_gan']}{ganzhi['year_zhi']} = {lover_liunian_score}分")
        print(f"   流月: {ganzhi['month_gan']}{ganzhi['month_zhi']} = {lover_liuyue_score}分")
        print(f"   流日: {ganzhi['day_gan']}{ganzhi['day_zhi']} = {lover_liuri_score}分")
        print(f"   总分: {lover_total}分")
        
        print(f"\n💕 夫妻对比:")
        print(f"   分数差: {abs(your_total - lover_total)}分")
        print(f"   谁更强: {'您' if your_total > lover_total else '爱人' if lover_total > your_total else '平分'}")
        
        # 计算匹配度
        match_percentage = 100 - (abs(your_total - lover_total) / max(your_total, lover_total) * 100)
        print(f"   运势匹配度: {match_percentage:.1f}%")

if __name__ == "__main__":
    print("💕 爱人运势计算器启动")
    print("=" * 60)
    
    try:
        # 验证大运序列
        verify_lover_dayun_sequence()
        
        # 计算2025年样本
        calculate_lover_2025_sample()
        
        # 计算示例数据
        lover_scores = calculate_lover_lifetime_scores()
        
        # 夫妻运势对比
        compare_couple_fortune()
        
        print(f"\n✅ 爱人运势分析完成！")
        print(f"💡 接下来可以生成完整的61年数据和对比图表")
        
    except Exception as e:
        print(f"❌ 分析过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()






