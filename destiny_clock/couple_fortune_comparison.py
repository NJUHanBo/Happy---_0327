#!/usr/bin/env python3
"""
夫妻运势对比图表
绘制两条折线的交汇与分离
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

class CoupleFortuneComparison:
    
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 加载您的数据
        your_file = os.path.join(current_dir, "最终版一生每日分数_1995-2055.csv")
        self.your_data = self.load_data(your_file, "您")
        
        # 加载爱人的数据
        lover_file = os.path.join(current_dir, "爱人一生每日分数_1998-2055.csv")
        self.lover_data = self.load_data(lover_file, "爱人")
        
        # 过滤到1998年1月1日开始的数据
        start_date = datetime.date(1998, 1, 1)
        self.your_data = [item for item in self.your_data if item['date_obj'] >= start_date]
        
        print(f"📊 加载数据完成:")
        print(f"   您的数据: {len(self.your_data)}天 (从1998年开始)")
        print(f"   爱人数据: {len(self.lover_data)}天")
    
    def load_data(self, csv_file_path, person_name):
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
            print(f"❌ {person_name}的数据文件不存在: {csv_file_path}")
        
        return data
    
    def create_couple_comparison_chart(self, sampling='monthly'):
        """创建夫妻运势对比图表"""
        print(f"💕 开始绘制夫妻运势对比图表 (采样: {sampling})")
        
        # 数据采样
        if sampling == 'monthly':
            your_dates, your_scores = self._sample_monthly(self.your_data)
            lover_dates, lover_scores = self._sample_monthly(self.lover_data)
            title_suffix = "月度平均"
        elif sampling == 'yearly':
            your_dates, your_scores = self._sample_yearly(self.your_data)
            lover_dates, lover_scores = self._sample_yearly(self.lover_data)
            title_suffix = "年度平均"
        else:
            # 每周采样（日度数据太密集）
            your_dates, your_scores = self._sample_weekly(self.your_data)
            lover_dates, lover_scores = self._sample_weekly(self.lover_data)
            title_suffix = "周度平均"
        
        # 创建大图
        plt.figure(figsize=(24, 14))
        
        # 主图：运势对比
        plt.subplot(2, 1, 1)
        
        # 绘制两条折线
        plt.plot(your_dates, your_scores, linewidth=2.5, color='#2E86AB', 
                alpha=0.9, label='您的运势 (1995年生)', marker='o', markersize=2)
        plt.plot(lover_dates, lover_scores, linewidth=2.5, color='#F24236', 
                alpha=0.9, label='爱人运势 (1994年生)', marker='s', markersize=2)
        
        # 添加大运期背景色（基于您的大运期）
        self._add_dayun_backgrounds()
        
        # 找出交汇点
        intersection_points = self._find_intersections(your_dates, your_scores, lover_dates, lover_scores)
        
        # 标记交汇点
        for point in intersection_points[:10]:  # 只标记前10个
            plt.scatter(point['date'], point['score'], color='purple', s=100, zorder=5, marker='*')
            plt.annotate(f'交汇\n{point["score"]:.0f}分', 
                        xy=(point['date'], point['score']), 
                        xytext=(5, 10), textcoords='offset points',
                        bbox=dict(boxstyle='round,pad=0.3', fc='purple', alpha=0.7),
                        fontsize=8, ha='left', color='white')
        
        # 标记当前时间
        current_date = datetime.date.today()
        plt.axvline(x=current_date, color='orange', linestyle='--', linewidth=3, alpha=0.8)
        plt.text(current_date, max(max(your_scores), max(lover_scores)) * 0.95, '当前时间', 
                rotation=90, fontsize=14, ha='right', va='top',
                bbox=dict(boxstyle='round,pad=0.3', fc='orange', alpha=0.7))
        
        plt.title(f'夫妻运势对比图表 ({title_suffix})\n1998-2055年 · 基于各自专属计分规则', 
                 fontsize=20, fontweight='bold', pad=20)
        plt.ylabel('运势分数', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=14, loc='upper left')
        
        # 下半部分：差值分析
        plt.subplot(2, 1, 2)
        
        # 计算差值（您的分数 - 爱人分数）
        min_length = min(len(your_scores), len(lover_scores))
        score_differences = [your_scores[i] - lover_scores[i] for i in range(min_length)]
        diff_dates = your_dates[:min_length]
        
        # 绘制差值
        colors = ['green' if diff > 0 else 'red' for diff in score_differences]
        plt.bar(diff_dates, score_differences, color=colors, alpha=0.6, width=20)
        
        # 添加零线
        plt.axhline(y=0, color='black', linestyle='-', alpha=0.5)
        
        plt.title('夫妻运势差值分析 (正值=您更强，负值=爱人更强)', fontsize=16)
        plt.ylabel('分数差值', fontsize=12)
        plt.xlabel('时间', fontsize=12)
        plt.grid(True, alpha=0.3, axis='y')
        
        # 设置x轴格式
        years = mdates.YearLocator(5)
        years_fmt = mdates.DateFormatter('%Y')
        plt.gca().xaxis.set_major_locator(years)
        plt.gca().xaxis.set_major_formatter(years_fmt)
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        
        # 保存图表
        output_path = os.path.join(os.path.dirname(__file__), f"夫妻运势对比图表_{sampling}.png")
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        
        print(f"✅ 夫妻对比图表已保存: {output_path}")
        plt.show()
        
        return output_path, intersection_points
    
    def _sample_monthly(self, data):
        """按月采样数据"""
        monthly_data = defaultdict(list)
        
        for item in data:
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
    
    def _sample_yearly(self, data):
        """按年采样数据"""
        yearly_data = defaultdict(list)
        
        for item in data:
            yearly_data[item['year']].append(item['final_score'])
        
        dates = []
        scores = []
        
        for year in sorted(yearly_data.keys()):
            avg_score = statistics.mean(yearly_data[year])
            dates.append(datetime.date(year, 6, 15))  # 使用年中
            scores.append(avg_score)
        
        return dates, scores
    
    def _sample_weekly(self, data):
        """按周采样数据"""
        weekly_data = defaultdict(list)
        
        for item in data:
            # 计算该日期所在周的周一
            week_start = item['date_obj'] - datetime.timedelta(days=item['date_obj'].weekday())
            week_key = week_start.strftime('%Y-%U')
            weekly_data[week_key].append(item['final_score'])
        
        dates = []
        scores = []
        
        for week_key in sorted(weekly_data.keys()):
            year, week = week_key.split('-')
            avg_score = statistics.mean(weekly_data[week_key])
            
            week_date = datetime.datetime.strptime(f"{year}-{week}-1", "%Y-%U-%w").date()
            dates.append(week_date)
            scores.append(avg_score)
        
        return dates, scores
    
    def _add_dayun_backgrounds(self):
        """添加大运期背景色（基于您的大运）"""
        your_dayun_periods = [
            {'name': '庚辰', 'start': 2007, 'end': 2017, 'color': '#FFE5B4'},
            {'name': '己卯', 'start': 2017, 'end': 2027, 'color': '#FFCCCB'},
            {'name': '戊寅', 'start': 2027, 'end': 2037, 'color': '#E0FFE0'},
            {'name': '丁丑', 'start': 2037, 'end': 2047, 'color': '#E6E6FA'},
            {'name': '丙子', 'start': 2047, 'end': 2057, 'color': '#F0F8FF'},
        ]
        
        for period in your_dayun_periods:
            start_date = datetime.date(period['start'], 1, 1)
            end_date = datetime.date(period['end'], 1, 1)
            
            plt.axvspan(start_date, end_date, alpha=0.1, color=period['color'])
            
            # 添加大运标签
            mid_date = datetime.date(period['start'] + 5, 1, 1)
            plt.text(mid_date, plt.ylim()[1] * 0.95, f"您:{period['name']}大运", 
                    rotation=0, fontsize=10, ha='center', va='top',
                    bbox=dict(boxstyle='round,pad=0.3', fc=period['color'], alpha=0.7))
    
    def _find_intersections(self, your_dates, your_scores, lover_dates, lover_scores):
        """找出两条运势线的交汇点"""
        intersections = []
        
        # 找共同的日期点
        min_length = min(len(your_dates), len(lover_dates))
        
        for i in range(1, min_length):
            # 检查是否发生交叉
            prev_diff = your_scores[i-1] - lover_scores[i-1]
            curr_diff = your_scores[i] - lover_scores[i]
            
            # 如果符号改变，说明发生了交叉
            if prev_diff * curr_diff < 0:
                # 线性插值找到大致的交叉点
                intersection_score = (your_scores[i] + lover_scores[i]) / 2
                intersection_date = your_dates[i]
                
                intersections.append({
                    'date': intersection_date,
                    'score': intersection_score,
                    'your_score': your_scores[i],
                    'lover_score': lover_scores[i]
                })
        
        return intersections
    
    def analyze_couple_dynamics(self):
        """分析夫妻运势动态关系"""
        print("\n💕 夫妻运势动态关系分析")
        print("=" * 60)
        
        # 按年统计谁更强
        yearly_comparison = defaultdict(list)
        
        # 用月度数据进行对比
        your_monthly_dates, your_monthly_scores = self._sample_monthly(self.your_data)
        lover_monthly_dates, lover_monthly_scores = self._sample_monthly(self.lover_data)
        
        min_length = min(len(your_monthly_scores), len(lover_monthly_scores))
        
        stronger_periods = {'您': 0, '爱人': 0, '平分': 0}
        
        for i in range(min_length):
            your_score = your_monthly_scores[i]
            lover_score = lover_monthly_scores[i]
            
            if abs(your_score - lover_score) < 1:  # 差距小于1分认为是平分
                stronger_periods['平分'] += 1
            elif your_score > lover_score:
                stronger_periods['您'] += 1
            else:
                stronger_periods['爱人'] += 1
        
        total_periods = sum(stronger_periods.values())
        
        print(f"📊 运势强弱统计 (基于{total_periods}个月度数据):")
        for person, count in stronger_periods.items():
            percentage = (count / total_periods) * 100
            print(f"   {person}更强: {count}次 ({percentage:.1f}%)")
        
        # 分析不同阶段的强弱关系
        print(f"\n🔮 各阶段运势对比:")
        
        stage_analysis = [
            {'name': '青年期', 'start_year': 1998, 'end_year': 2008},
            {'name': '青春期', 'start_year': 2008, 'end_year': 2018},
            {'name': '成年期', 'start_year': 2018, 'end_year': 2028},
            {'name': '中年期', 'start_year': 2028, 'end_year': 2038},
            {'name': '成熟期', 'start_year': 2038, 'end_year': 2048},
            {'name': '晚年期', 'start_year': 2048, 'end_year': 2055},
        ]
        
        for stage in stage_analysis:
            your_stage_data = [item for item in self.your_data 
                              if stage['start_year'] <= item['year'] < stage['end_year']]
            lover_stage_data = [item for item in self.lover_data 
                               if stage['start_year'] <= item['year'] < stage['end_year']]
            
            if your_stage_data and lover_stage_data:
                your_avg = statistics.mean([item['final_score'] for item in your_stage_data])
                lover_avg = statistics.mean([item['final_score'] for item in lover_stage_data])
                
                diff = your_avg - lover_avg
                stronger = "您" if diff > 1 else "爱人" if diff < -1 else "平分"
                
                print(f"   {stage['name']} ({stage['start_year']}-{stage['end_year']}): ")
                print(f"     您: {your_avg:.1f}分, 爱人: {lover_avg:.1f}分 → {stronger}更强 (差{abs(diff):.1f}分)")
    
    def create_detailed_comparison(self):
        """创建详细的夫妻对比分析"""
        print(f"\n📊 创建详细夫妻运势对比")
        
        # 创建多子图
        fig, axes = plt.subplots(3, 1, figsize=(20, 18))
        
        # 第一个图：月度运势对比
        your_monthly_dates, your_monthly_scores = self._sample_monthly(self.your_data)
        lover_monthly_dates, lover_monthly_scores = self._sample_monthly(self.lover_data)
        
        axes[0].plot(your_monthly_dates, your_monthly_scores, linewidth=2, color='#2E86AB', 
                    label='您的运势', marker='o', markersize=3)
        axes[0].plot(lover_monthly_dates, lover_monthly_scores, linewidth=2, color='#F24236', 
                    label='爱人运势', marker='s', markersize=3)
        
        axes[0].set_title('夫妻月度运势对比 (1998-2055)', fontsize=16, fontweight='bold')
        axes[0].set_ylabel('运势分数', fontsize=12)
        axes[0].grid(True, alpha=0.3)
        axes[0].legend()
        
        # 当前时间线
        current_date = datetime.date.today()
        axes[0].axvline(x=current_date, color='orange', linestyle='--', linewidth=2, alpha=0.8)
        
        # 第二个图：年度运势对比
        your_yearly_dates, your_yearly_scores = self._sample_yearly(self.your_data)
        lover_yearly_dates, lover_yearly_scores = self._sample_yearly(self.lover_data)
        
        axes[1].plot(your_yearly_dates, your_yearly_scores, linewidth=3, color='#2E86AB', 
                    label='您的年度平均', marker='o', markersize=6)
        axes[1].plot(lover_yearly_dates, lover_yearly_scores, linewidth=3, color='#F24236', 
                    label='爱人年度平均', marker='s', markersize=6)
        
        axes[1].set_title('夫妻年度运势对比', fontsize=16, fontweight='bold')
        axes[1].set_ylabel('运势分数', fontsize=12)
        axes[1].grid(True, alpha=0.3)
        axes[1].legend()
        axes[1].axvline(x=current_date, color='orange', linestyle='--', linewidth=2, alpha=0.8)
        
        # 第三个图：差值分析
        min_length = min(len(your_yearly_scores), len(lover_yearly_scores))
        score_differences = [your_yearly_scores[i] - lover_yearly_scores[i] for i in range(min_length)]
        diff_colors = ['#4CAF50' if diff > 0 else '#FF5722' if diff < 0 else '#9E9E9E' for diff in score_differences]
        
        axes[2].bar(your_yearly_dates[:min_length], score_differences, color=diff_colors, alpha=0.7, width=200)
        axes[2].axhline(y=0, color='black', linestyle='-', linewidth=1)
        axes[2].set_title('夫妻运势差值变化 (正值=您更强，负值=爱人更强)', fontsize=16, fontweight='bold')
        axes[2].set_ylabel('分数差值', fontsize=12)
        axes[2].set_xlabel('时间', fontsize=12)
        axes[2].grid(True, alpha=0.3, axis='y')
        axes[2].axvline(x=current_date, color='orange', linestyle='--', linewidth=2, alpha=0.8)
        
        # 设置所有子图的x轴格式
        for ax in axes:
            years = mdates.YearLocator(5)
            years_fmt = mdates.DateFormatter('%Y')
            ax.xaxis.set_major_locator(years)
            ax.xaxis.set_major_formatter(years_fmt)
            ax.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        # 保存详细图表
        output_path = os.path.join(os.path.dirname(__file__), "夫妻运势详细对比分析.png")
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ 详细对比分析已保存: {output_path}")
        
        plt.show()
        return output_path

if __name__ == "__main__":
    print("💕 夫妻运势对比分析工具")
    print("=" * 70)
    
    try:
        comparer = CoupleFortuneComparison()
        
        # 分析夫妻关系动态
        comparer.analyze_couple_dynamics()
        
        # 创建月度对比图表
        chart_path, intersections = comparer.create_couple_comparison_chart('monthly')
        
        print(f"\n💫 发现 {len(intersections)} 个运势交汇点")
        if intersections:
            print("最近的几个交汇点:")
            for point in intersections[-5:]:
                print(f"   {point['date']}: {point['score']:.1f}分")
        
        # 创建详细对比分析
        detail_path = comparer.create_detailed_comparison()
        
        print(f"\n🎊 夫妻运势对比分析完成！")
        print(f"   📈 月度对比图: {chart_path}")
        print(f"   📊 详细分析图: {detail_path}")
        
    except Exception as e:
        print(f"❌ 分析过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()






