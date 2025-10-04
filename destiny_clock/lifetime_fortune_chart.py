#!/usr/bin/env python3
"""
一生运势可视化图表
绘制61年完整运势折线图
"""

import csv
import os
import datetime
import calendar
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict
import statistics

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['PingFang SC', 'SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

class LifetimeFortuneChart:
    
    def __init__(self, csv_file_path=None):
        if csv_file_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            csv_file_path = os.path.join(current_dir, "最终版一生每日分数_1995-2055.csv")
        
        self.data = self.load_data(csv_file_path)
        print(f"📊 加载了 {len(self.data)} 天的数据准备绘图")
        
        # 大运周期定义
        self.dayun_periods = [
            {'name': '辛巳', 'start': 1997, 'end': 2007, 'color': '#FF6B6B'},
            {'name': '庚辰', 'start': 2007, 'end': 2017, 'color': '#4ECDC4'},
            {'name': '己卯', 'start': 2017, 'end': 2027, 'color': '#45B7D1'},
            {'name': '戊寅', 'start': 2027, 'end': 2037, 'color': '#96CEB4'},
            {'name': '丁丑', 'start': 2037, 'end': 2047, 'color': '#FFEAA7'},
            {'name': '丙子', 'start': 2047, 'end': 2057, 'color': '#DDA0DD'},
            {'name': '乙亥', 'start': 2057, 'end': 2067, 'color': '#FFB6C1'},
        ]
    
    def load_data(self, csv_file_path):
        """加载CSV数据"""
        data = []
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['日期'] == '日期':
                        continue
                    try:
                        date_obj = datetime.datetime.strptime(row['日期'], '%Y-%m-%d').date()
                        data.append({
                            'date': row['日期'],
                            'date_obj': date_obj,
                            'year': int(row['年份']),
                            'final_score': int(row['最终总分']),
                            'dayun_ganzhi': row['大运干支']
                        })
                    except (ValueError, KeyError):
                        continue
        except FileNotFoundError:
            print(f"❌ 数据文件不存在: {csv_file_path}")
        
        return data
    
    def create_lifetime_chart(self, sampling='monthly'):
        """
        创建一生运势图表
        
        Args:
            sampling: 采样方式 ('daily', 'weekly', 'monthly')
        """
        print(f"🎨 开始绘制一生运势图表 (采样方式: {sampling})")
        
        # 数据采样处理
        if sampling == 'monthly':
            dates, scores = self._sample_monthly()
            title_suffix = "月度平均"
        elif sampling == 'weekly':
            dates, scores = self._sample_weekly()
            title_suffix = "周度平均"
        else:
            dates = [item['date_obj'] for item in self.data]
            scores = [item['final_score'] for item in self.data]
            title_suffix = "每日详细"
        
        # 创建图表
        plt.figure(figsize=(20, 10))
        
        # 绘制主要折线
        plt.plot(dates, scores, linewidth=1.5, color='#2C3E50', alpha=0.8, label='运势分数')
        
        # 添加大运期背景色
        self._add_dayun_backgrounds()
        
        # 添加关键点标记
        self._add_key_points(dates, scores)
        
        # 添加移动平均线
        if len(scores) > 365:
            ma_dates, ma_scores = self._calculate_moving_average(dates, scores, window=365)
            plt.plot(ma_dates, ma_scores, linewidth=3, color='#E74C3C', alpha=0.7, label='年度移动平均')
        
        # 图表美化
        plt.title(f'命运时钟 - 一生运势图表 ({title_suffix})\n1995-2055年 · 基于专属计分规则', 
                 fontsize=20, fontweight='bold', pad=20)
        plt.xlabel('时间', fontsize=14)
        plt.ylabel('运势分数', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=12)
        
        # 设置x轴格式
        years = mdates.YearLocator(5)  # 每5年一个刻度
        years_fmt = mdates.DateFormatter('%Y')
        plt.gca().xaxis.set_major_locator(years)
        plt.gca().xaxis.set_major_formatter(years_fmt)
        
        # 旋转x轴标签
        plt.xticks(rotation=45)
        
        # 调整布局
        plt.tight_layout()
        
        # 保存图表
        output_path = os.path.join(os.path.dirname(__file__), f"一生运势图表_{sampling}.png")
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        
        print(f"✅ 图表已保存: {output_path}")
        
        # 显示图表
        plt.show()
        
        return output_path
    
    def _sample_monthly(self):
        """按月采样数据"""
        monthly_data = defaultdict(list)
        
        for item in self.data:
            month_key = f"{item['year']}-{item['date_obj'].month:02d}"
            monthly_data[month_key].append(item['final_score'])
        
        dates = []
        scores = []
        
        for month_key in sorted(monthly_data.keys()):
            year, month = map(int, month_key.split('-'))
            avg_score = statistics.mean(monthly_data[month_key])
            
            dates.append(datetime.date(year, month, 15))  # 使用月中
            scores.append(avg_score)
        
        return dates, scores
    
    def _sample_weekly(self):
        """按周采样数据"""
        weekly_data = defaultdict(list)
        
        for item in self.data:
            # 计算周数
            week_start = item['date_obj'] - datetime.timedelta(days=item['date_obj'].weekday())
            week_key = week_start.strftime('%Y-%U')
            weekly_data[week_key].append(item['final_score'])
        
        dates = []
        scores = []
        
        for week_key in sorted(weekly_data.keys()):
            year, week = week_key.split('-')
            avg_score = statistics.mean(weekly_data[week_key])
            
            # 计算该周的日期
            week_date = datetime.datetime.strptime(f"{year}-{week}-1", "%Y-%U-%w").date()
            
            dates.append(week_date)
            scores.append(avg_score)
        
        return dates, scores
    
    def _add_dayun_backgrounds(self):
        """添加大运期背景色"""
        for i, period in enumerate(self.dayun_periods):
            start_date = datetime.date(period['start'], 1, 1)
            end_date = datetime.date(period['end'], 1, 1)
            
            plt.axvspan(start_date, end_date, alpha=0.1, color=period['color'], 
                       label=f"{period['name']}大运")
    
    def _add_key_points(self, dates, scores):
        """添加关键点标记"""
        # 找出最高分和最低分的点
        max_score = max(scores)
        min_score = min(scores)
        
        max_indices = [i for i, score in enumerate(scores) if score == max_score]
        min_indices = [i for i, score in enumerate(scores) if score == min_score]
        
        # 标记最高分点
        for idx in max_indices[:3]:  # 最多标记3个
            plt.scatter(dates[idx], scores[idx], color='gold', s=100, zorder=5)
            plt.annotate(f'峰值\n{max_score}分', 
                        xy=(dates[idx], scores[idx]), 
                        xytext=(10, 10), textcoords='offset points',
                        bbox=dict(boxstyle='round,pad=0.3', fc='yellow', alpha=0.7),
                        fontsize=8, ha='left')
        
        # 标记最低分点
        for idx in min_indices[:3]:  # 最多标记3个
            plt.scatter(dates[idx], scores[idx], color='red', s=100, zorder=5)
            plt.annotate(f'谷底\n{min_score}分', 
                        xy=(dates[idx], scores[idx]), 
                        xytext=(10, -15), textcoords='offset points',
                        bbox=dict(boxstyle='round,pad=0.3', fc='lightcoral', alpha=0.7),
                        fontsize=8, ha='left')
        
        # 标记当前时间
        current_date = datetime.date.today()
        if dates[0] <= current_date <= dates[-1]:
            # 找最接近当前日期的点
            closest_idx = min(range(len(dates)), key=lambda i: abs((dates[i] - current_date).days))
            plt.axvline(x=dates[closest_idx], color='orange', linestyle='--', alpha=0.8, linewidth=2)
            plt.text(dates[closest_idx], max(scores) * 0.9, '当前时间', 
                    rotation=90, fontsize=12, ha='right', va='top',
                    bbox=dict(boxstyle='round,pad=0.3', fc='orange', alpha=0.7))
    
    def _calculate_moving_average(self, dates, scores, window=365):
        """计算移动平均"""
        if len(scores) < window:
            return dates, scores
        
        ma_dates = []
        ma_scores = []
        
        for i in range(window-1, len(scores)):
            ma_score = statistics.mean(scores[i-window+1:i+1])
            ma_dates.append(dates[i])
            ma_scores.append(ma_score)
        
        return ma_dates, ma_scores
    
    def create_heatmap_calendar(self, year=2025):
        """创建某年的运势热力图日历"""
        print(f"🔥 创建{year}年运势热力图日历")
        
        # 获取该年数据
        year_data = [item for item in self.data if item['year'] == year]
        
        if not year_data:
            print(f"❌ 没有{year}年的数据")
            return
        
        # 创建12个子图（12个月）
        fig, axes = plt.subplots(3, 4, figsize=(16, 12))
        fig.suptitle(f'{year}年运势热力图日历', fontsize=20, fontweight='bold')
        
        for month in range(1, 13):
            row = (month - 1) // 4
            col = (month - 1) % 4
            ax = axes[row, col]
            
            # 获取该月数据
            month_data = [item for item in year_data if item['date_obj'].month == month]
            
            if month_data:
                # 创建日历网格
                cal = calendar.monthcalendar(year, month)
                
                # 创建分数矩阵
                score_matrix = [[0 for _ in range(7)] for _ in range(len(cal))]
                
                for item in month_data:
                    day = item['date_obj'].day
                    for week_idx, week in enumerate(cal):
                        if day in week:
                            day_idx = week.index(day)
                            score_matrix[week_idx][day_idx] = item['final_score']
                            break
                
                # 绘制热力图
                im = ax.imshow(score_matrix, cmap='RdYlGn', aspect='auto', vmin=20, vmax=70)
                
                # 添加日期标签
                for week_idx, week in enumerate(cal):
                    for day_idx, day in enumerate(week):
                        if day != 0:
                            score = score_matrix[week_idx][day_idx]
                            color = 'white' if score < 45 else 'black'
                            ax.text(day_idx, week_idx, f'{day}\n{score}', 
                                   ha='center', va='center', fontsize=8, color=color)
                
                ax.set_title(f'{month}月', fontsize=14)
                ax.set_xticks(range(7))
                ax.set_xticklabels(['一', '二', '三', '四', '五', '六', '日'])
                ax.set_yticks([])
            
            else:
                ax.text(0.5, 0.5, '无数据', ha='center', va='center', transform=ax.transAxes)
                ax.set_title(f'{month}月', fontsize=14)
        
        # 添加颜色条
        cbar = plt.colorbar(im, ax=axes, orientation='horizontal', pad=0.1, shrink=0.8)
        cbar.set_label('运势分数', fontsize=12)
        
        plt.tight_layout()
        
        # 保存图表
        output_path = os.path.join(os.path.dirname(__file__), f"{year}年运势热力图日历.png")
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ 热力图已保存: {output_path}")
        
        plt.show()
        return output_path
    
    def load_data(self, csv_file_path):
        """加载CSV数据"""
        data = []
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['日期'] == '日期':
                        continue
                    try:
                        date_obj = datetime.datetime.strptime(row['日期'], '%Y-%m-%d').date()
                        data.append({
                            'date': row['日期'],
                            'date_obj': date_obj,
                            'year': int(row['年份']),
                            'final_score': int(row['最终总分']),
                            'dayun_ganzhi': row['大运干支']
                        })
                    except (ValueError, KeyError):
                        continue
        except FileNotFoundError:
            print(f"❌ 数据文件不存在: {csv_file_path}")
        
        return data
    
    def create_detailed_lifetime_chart(self):
        """创建详细的一生运势图表"""
        print("🎨 创建详细版一生运势图表")
        
        # 按月采样以减少数据点
        dates, scores = self._sample_monthly()
        
        # 创建大图
        plt.figure(figsize=(24, 12))
        
        # 主折线图
        plt.subplot(2, 1, 1)
        plt.plot(dates, scores, linewidth=2, color='#2C3E50', alpha=0.9, label='月度平均分数')
        
        # 添加大运期背景和标记
        for period in self.dayun_periods:
            start_date = datetime.date(period['start'], 1, 1)
            end_date = datetime.date(period['end'], 1, 1)
            
            # 背景色
            plt.axvspan(start_date, end_date, alpha=0.15, color=period['color'])
            
            # 大运标签
            mid_date = datetime.date(period['start'] + 5, 1, 1)
            plt.text(mid_date, max(scores) * 0.95, f"{period['name']}大运", 
                    rotation=0, fontsize=12, ha='center', va='top',
                    bbox=dict(boxstyle='round,pad=0.3', fc=period['color'], alpha=0.7))
        
        # 标记关键点
        max_score = max(scores)
        min_score = min(scores)
        max_idx = scores.index(max_score)
        min_idx = scores.index(min_score)
        
        plt.scatter(dates[max_idx], max_score, color='gold', s=200, zorder=5, marker='*')
        plt.scatter(dates[min_idx], min_score, color='red', s=200, zorder=5, marker='v')
        
        plt.title('一生运势总览', fontsize=16)
        plt.ylabel('运势分数', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.legend()
        
        # 当前时间线
        current_date = datetime.date.today()
        plt.axvline(x=current_date, color='orange', linestyle='--', linewidth=3, alpha=0.8)
        
        # 下半部分：各大运期详细对比
        plt.subplot(2, 1, 2)
        
        dayun_avgs = []
        dayun_names = []
        dayun_colors = []
        
        for period in self.dayun_periods:
            period_scores = [item['final_score'] for item in self.data 
                           if period['start'] <= item['year'] < period['end']]
            if period_scores:
                avg_score = statistics.mean(period_scores)
                dayun_avgs.append(avg_score)
                dayun_names.append(f"{period['name']}\n({period['start']}-{period['end']})")
                dayun_colors.append(period['color'])
        
        bars = plt.bar(dayun_names, dayun_avgs, color=dayun_colors, alpha=0.7)
        
        # 在柱子上添加数值
        for bar, avg in zip(bars, dayun_avgs):
            plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5, 
                    f'{avg:.1f}分', ha='center', va='bottom', fontsize=11, fontweight='bold')
        
        plt.title('各大运期平均运势对比', fontsize=16)
        plt.ylabel('平均分数', fontsize=12)
        plt.grid(True, alpha=0.3, axis='y')
        
        # 设置x轴标签
        plt.xticks(rotation=45, ha='right')
        
        plt.tight_layout()
        
        # 保存详细图表
        output_path = os.path.join(os.path.dirname(__file__), "详细版一生运势图表.png")
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ 详细图表已保存: {output_path}")
        
        plt.show()
        return output_path
    
    def _sample_monthly(self):
        """按月采样数据"""
        monthly_data = defaultdict(list)
        
        for item in self.data:
            month_key = f"{item['year']}-{item['date_obj'].month:02d}"
            monthly_data[month_key].append(item['final_score'])
        
        dates = []
        scores = []
        
        for month_key in sorted(monthly_data.keys()):
            year, month = map(int, month_key.split('-'))
            avg_score = statistics.mean(monthly_data[month_key])
            
            dates.append(datetime.date(year, month, 15))
            scores.append(avg_score)
        
        return dates, scores

if __name__ == "__main__":
    print("🎨 一生运势可视化工具启动")
    print("=" * 60)
    
    try:
        chart_maker = LifetimeFortuneChart()
        
        print("\n选择绘图模式:")
        print("1. 创建详细版一生运势图表（推荐）")
        print("2. 创建月度采样折线图")
        print("3. 创建2025年运势热力图日历")
        print("4. 全部生成")
        
        choice = input("请选择模式 (1-4): ").strip()
        
        if choice == '1' or choice == '4':
            chart_maker.create_detailed_lifetime_chart()
        
        if choice == '2' or choice == '4':
            chart_maker.create_lifetime_chart('monthly')
        
        if choice == '3' or choice == '4':
            chart_maker.create_heatmap_calendar(2025)
        
        print("\n🎉 图表生成完成！")
        
    except Exception as e:
        print(f"❌ 绘图过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()
