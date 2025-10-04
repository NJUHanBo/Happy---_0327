#!/usr/bin/env python3
"""
夫妻运势均值计算器
计算夫妻两人运势的逐日平均值
"""

import csv
import os
import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict
import statistics

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['PingFang SC', 'SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

class CoupleAverageCalculator:
    
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 加载您的数据
        your_file = os.path.join(current_dir, "最终版一生每日分数_1995-2055.csv")
        self.your_data = self.load_data(your_file, "您")
        
        # 加载爱人的数据
        lover_file = os.path.join(current_dir, "爱人一生每日分数_1998-2055.csv")
        self.lover_data = self.load_data(lover_file, "爱人")
        
        print(f"📊 数据加载完成:")
        print(f"   您的数据: {len(self.your_data)}天")
        print(f"   爱人数据: {len(self.lover_data)}天")
    
    def load_data(self, csv_file_path, person_name):
        """加载CSV数据"""
        data = {}  # 使用字典，以日期为key
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['日期'] == '日期':
                        continue
                    try:
                        date_str = row['日期']
                        date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                        
                        data[date_str] = {
                            'date_obj': date_obj,
                            'year': int(row['年份']),
                            'final_score': int(row['最终总分']),
                            'dayun_ganzhi': row['大运干支'],
                            'liunian_ganzhi': row['流年干支'],
                            'liuyue_ganzhi': row['流月干支'],
                            'liuri_ganzhi': row['流日干支']
                        }
                    except (ValueError, KeyError):
                        continue
        except FileNotFoundError:
            print(f"❌ {person_name}的数据文件不存在: {csv_file_path}")
        
        return data
    
    def calculate_couple_averages(self, start_date_str="2017-01-01"):
        """计算夫妻运势逐日均值"""
        print(f"💕 开始计算夫妻运势逐日均值")
        print(f"📅 起始日期: {start_date_str}")
        print("=" * 60)
        
        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        
        couple_averages = []
        matched_days = 0
        
        # 获取所有可能的日期（从您的数据中）
        all_dates = [date_str for date_str, data in self.your_data.items() 
                    if data['date_obj'] >= start_date]
        all_dates.sort()
        
        print(f"📊 开始计算 {len(all_dates)} 天的数据...")
        
        for date_str in all_dates:
            if date_str in self.your_data and date_str in self.lover_data:
                your_score = self.your_data[date_str]['final_score']
                lover_score = self.lover_data[date_str]['final_score']
                average_score = (your_score + lover_score) / 2
                
                couple_averages.append({
                    'date': date_str,
                    'date_obj': self.your_data[date_str]['date_obj'],
                    'year': self.your_data[date_str]['year'],
                    'your_score': your_score,
                    'lover_score': lover_score,
                    'average_score': average_score,
                    'score_diff': abs(your_score - lover_score),
                    'your_dayun': self.your_data[date_str]['dayun_ganzhi'],
                    'lover_dayun': self.lover_data[date_str]['dayun_ganzhi'],
                    'liunian_ganzhi': self.your_data[date_str]['liunian_ganzhi'],
                    'liuyue_ganzhi': self.your_data[date_str]['liuyue_ganzhi'],
                    'liuri_ganzhi': self.your_data[date_str]['liuri_ganzhi']
                })
                matched_days += 1
        
        print(f"✅ 匹配成功 {matched_days} 天的数据")
        
        return couple_averages
    
    def save_couple_averages(self, couple_averages):
        """保存夫妻均值数据到CSV"""
        filename = "夫妻运势逐日均值_2017-2055.csv"
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        print(f"💾 正在保存到 {filepath}...")
        
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['date', 'year', 'your_score', 'lover_score', 'average_score', 'score_diff',
                         'your_dayun', 'lover_dayun', 'liunian_ganzhi', 'liuyue_ganzhi', 'liuri_ganzhi']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            # 写入表头
            writer.writerow({
                'date': '日期',
                'year': '年份',
                'your_score': '您的分数',
                'lover_score': '爱人分数',
                'average_score': '夫妻均值',
                'score_diff': '分数差异',
                'your_dayun': '您的大运',
                'lover_dayun': '爱人大运',
                'liunian_ganzhi': '流年干支',
                'liuyue_ganzhi': '流月干支',
                'liuri_ganzhi': '流日干支'
            })
            
            # 写入数据
            for row in couple_averages:
                writer.writerow({
                    'date': row['date'],
                    'year': row['year'],
                    'your_score': row['your_score'],
                    'lover_score': row['lover_score'],
                    'average_score': f"{row['average_score']:.1f}",
                    'score_diff': row['score_diff'],
                    'your_dayun': row['your_dayun'],
                    'lover_dayun': row['lover_dayun'],
                    'liunian_ganzhi': row['liunian_ganzhi'],
                    'liuyue_ganzhi': row['liuyue_ganzhi'],
                    'liuri_ganzhi': row['liuri_ganzhi']
                })
        
        print(f"✅ 夫妻均值数据已保存: {filepath}")
        return filepath
    
    def analyze_couple_averages(self, couple_averages):
        """分析夫妻均值数据"""
        if not couple_averages:
            return
        
        print(f"\n📈 夫妻均值数据分析:")
        print(f"   总计天数: {len(couple_averages)}天")
        
        # 分数统计
        avg_scores = [item['average_score'] for item in couple_averages]
        score_diffs = [item['score_diff'] for item in couple_averages]
        
        print(f"   均值最高分: {max(avg_scores):.1f}分")
        print(f"   均值最低分: {min(avg_scores):.1f}分") 
        print(f"   均值平均分: {statistics.mean(avg_scores):.1f}分")
        print(f"   平均分数差异: {statistics.mean(score_diffs):.1f}分")
        
        # 找出最高分和最低分的日期
        max_avg = max(avg_scores)
        min_avg = min(avg_scores)
        
        max_avg_items = [item for item in couple_averages if abs(item['average_score'] - max_avg) < 0.1]
        min_avg_items = [item for item in couple_averages if abs(item['average_score'] - min_avg) < 0.1]
        
        print(f"\n🌟 夫妻均值最高分日期 ({max_avg:.1f}分):")
        for item in max_avg_items[:3]:
            print(f"   {item['date']} - 您:{item['your_score']}分, 爱人:{item['lover_score']}分")
        
        print(f"\n⚠️ 夫妻均值最低分日期 ({min_avg:.1f}分):")
        for item in min_avg_items[:3]:
            print(f"   {item['date']} - 您:{item['your_score']}分, 爱人:{item['lover_score']}分")
        
        # 分析一致性最高和最低的时期
        most_sync = min(couple_averages, key=lambda x: x['score_diff'])
        least_sync = max(couple_averages, key=lambda x: x['score_diff'])
        
        print(f"\n💕 最同步的日期:")
        print(f"   {most_sync['date']} - 您:{most_sync['your_score']}分, 爱人:{most_sync['lover_score']}分 (差异{most_sync['score_diff']}分)")
        
        print(f"\n💥 最分化的日期:")
        print(f"   {least_sync['date']} - 您:{least_sync['your_score']}分, 爱人:{least_sync['lover_score']}分 (差异{least_sync['score_diff']}分)")
    
    def create_couple_average_chart(self, couple_averages):
        """创建夫妻均值图表"""
        print(f"\n🎨 绘制夫妻运势均值图表")
        
        # 按月采样以减少数据点
        monthly_data = defaultdict(lambda: {'your_scores': [], 'lover_scores': [], 'avg_scores': []})
        
        for item in couple_averages:
            month_key = f"{item['year']}-{item['date_obj'].month:02d}"
            monthly_data[month_key]['your_scores'].append(item['your_score'])
            monthly_data[month_key]['lover_scores'].append(item['lover_score'])
            monthly_data[month_key]['avg_scores'].append(item['average_score'])
        
        dates = []
        your_monthly_scores = []
        lover_monthly_scores = []
        avg_monthly_scores = []
        
        for month_key in sorted(monthly_data.keys()):
            year, month = map(int, month_key.split('-'))
            
            dates.append(datetime.date(year, month, 15))
            your_monthly_scores.append(statistics.mean(monthly_data[month_key]['your_scores']))
            lover_monthly_scores.append(statistics.mean(monthly_data[month_key]['lover_scores']))
            avg_monthly_scores.append(statistics.mean(monthly_data[month_key]['avg_scores']))
        
        # 创建图表
        plt.figure(figsize=(20, 12))
        
        # 上半部分：三条线对比
        plt.subplot(2, 1, 1)
        
        plt.plot(dates, your_monthly_scores, linewidth=2, color='#2E86AB', 
                label='您的运势', marker='o', markersize=3, alpha=0.8)
        plt.plot(dates, lover_monthly_scores, linewidth=2, color='#F24236', 
                label='爱人运势', marker='s', markersize=3, alpha=0.8)
        plt.plot(dates, avg_monthly_scores, linewidth=3, color='#8E44AD', 
                label='夫妻均值', marker='D', markersize=4, alpha=0.9)
        
        # 添加当前时间线
        current_date = datetime.date.today()
        plt.axvline(x=current_date, color='orange', linestyle='--', linewidth=3, alpha=0.8)
        
        plt.title('夫妻运势与均值对比 (2017-2055年月度数据)', fontsize=18, fontweight='bold', pad=15)
        plt.ylabel('运势分数', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=12, loc='upper left')
        
        # 下半部分：均值单独展示
        plt.subplot(2, 1, 2)
        
        # 绘制均值折线
        plt.plot(dates, avg_monthly_scores, linewidth=4, color='#8E44AD', 
                marker='D', markersize=5, alpha=0.9, label='夫妻运势均值')
        
        # 填充区域
        plt.fill_between(dates, avg_monthly_scores, alpha=0.3, color='#8E44AD')
        
        # 添加关键点标记
        max_avg = max(avg_monthly_scores)
        min_avg = min(avg_monthly_scores)
        max_idx = avg_monthly_scores.index(max_avg)
        min_idx = avg_monthly_scores.index(min_avg)
        
        plt.scatter(dates[max_idx], max_avg, color='gold', s=150, zorder=5, marker='*')
        plt.scatter(dates[min_idx], min_avg, color='red', s=150, zorder=5, marker='v')
        
        plt.annotate(f'夫妻运势峰值\n{max_avg:.1f}分', 
                    xy=(dates[max_idx], max_avg), 
                    xytext=(10, 15), textcoords='offset points',
                    bbox=dict(boxstyle='round,pad=0.3', fc='gold', alpha=0.8),
                    fontsize=10, ha='left')
        
        plt.annotate(f'夫妻运势谷底\n{min_avg:.1f}分', 
                    xy=(dates[min_idx], min_avg), 
                    xytext=(10, -20), textcoords='offset points',
                    bbox=dict(boxstyle='round,pad=0.3', fc='lightcoral', alpha=0.8),
                    fontsize=10, ha='left')
        
        # 当前时间线
        plt.axvline(x=current_date, color='orange', linestyle='--', linewidth=3, alpha=0.8)
        plt.text(current_date, max(avg_monthly_scores) * 0.9, '当前时间', 
                rotation=90, fontsize=12, ha='right', va='top',
                bbox=dict(boxstyle='round,pad=0.3', fc='orange', alpha=0.7))
        
        plt.title('夫妻运势均值走势', fontsize=16, fontweight='bold')
        plt.ylabel('均值分数', fontsize=12)
        plt.xlabel('时间', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=12)
        
        # 设置x轴格式
        for subplot in [plt.subplot(2, 1, 1), plt.subplot(2, 1, 2)]:
            years = mdates.YearLocator(5)
            years_fmt = mdates.DateFormatter('%Y')
            subplot.xaxis.set_major_locator(years)
            subplot.xaxis.set_major_formatter(years_fmt)
        
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # 保存图表
        output_path = os.path.join(os.path.dirname(__file__), "夫妻运势均值图表.png")
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        
        print(f"✅ 夫妻均值图表已保存: {output_path}")
        plt.show()
        
        return output_path

if __name__ == "__main__":
    print("💕 夫妻运势均值计算器")
    print("=" * 70)
    
    try:
        calculator = CoupleAverageCalculator()
        
        # 计算夫妻均值
        couple_averages = calculator.calculate_couple_averages("2017-01-01")
        
        if couple_averages:
            # 保存均值数据
            csv_path = calculator.save_couple_averages(couple_averages)
            
            # 分析均值数据
            calculator.analyze_couple_averages(couple_averages)
            
            # 创建均值图表
            chart_path = calculator.create_couple_average_chart(couple_averages)
            
            print(f"\n🎉 夫妻均值分析完成！")
            print(f"   📊 共计算了{len(couple_averages)}天的均值数据")
            print(f"   📁 CSV文件: {csv_path}")
            print(f"   📈 图表文件: {chart_path}")
            
        else:
            print("❌ 没有计算出任何均值数据")
            
    except Exception as e:
        print(f"❌ 程序执行出错: {str(e)}")
        import traceback
        traceback.print_exc()






