#!/usr/bin/env python3
"""
运势模式分析器
基于61年长时间序列数据的深度分析
"""

import csv
import os
import datetime
# 使用纯Python替代numpy
from collections import defaultdict, Counter
import statistics

class FortunePatternAnalyzer:
    
    def __init__(self, csv_file_path=None):
        if csv_file_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            csv_file_path = os.path.join(current_dir, "最终版一生每日分数_1995-2055.csv")
        
        self.data = self.load_data(csv_file_path)
        print(f"✅ 加载了 {len(self.data)} 天的数据进行分析")
    
    def load_data(self, csv_file_path):
        """加载CSV数据"""
        data = []
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['日期'] == '日期':  # 跳过中文表头
                        continue
                    try:
                        data.append({
                            'date': row['日期'],
                            'year': int(row['年份']),
                            'dayun_ganzhi': row['大运干支'],
                            'final_score': int(row['最终总分']),
                            'date_obj': datetime.datetime.strptime(row['日期'], '%Y-%m-%d').date()
                        })
                    except (ValueError, KeyError):
                        continue
        except FileNotFoundError:
            print(f"❌ 数据文件不存在: {csv_file_path}")
        
        return data
    
    def detect_unlucky_periods(self, window_days=7, drop_threshold=10):
        """
        检测倒霉时段：运气突然大幅下降的时间段
        
        Args:
            window_days: 检测窗口天数
            drop_threshold: 下降阈值（分数）
        """
        print(f"🔍 检测倒霉时段（{window_days}天窗口，下降{drop_threshold}分以上）")
        print("=" * 60)
        
        unlucky_periods = []
        scores = [item['final_score'] for item in self.data]
        
        for i in range(len(scores) - window_days):
            # 计算窗口前后的平均分
            before_window = scores[max(0, i-window_days):i]
            current_window = scores[i:i+window_days]
            
            if before_window and current_window:
                before_avg = statistics.mean(before_window)
                current_avg = statistics.mean(current_window)
                drop = before_avg - current_avg
                
                if drop >= drop_threshold:
                    start_date = self.data[i]['date_obj']
                    end_date = self.data[i+window_days-1]['date_obj']
                    
                    unlucky_periods.append({
                        'start_date': start_date,
                        'end_date': end_date,
                        'before_avg': before_avg,
                        'current_avg': current_avg,
                        'drop': drop,
                        'dayun': self.data[i]['dayun_ganzhi'],
                        'min_score': min(current_window),
                        'max_score': max(current_window)
                    })
        
        # 去重并排序（按下降幅度排序）
        unlucky_periods.sort(key=lambda x: x['drop'], reverse=True)
        
        print(f"📊 检测到 {len(unlucky_periods)} 个倒霉时段:")
        print()
        
        for i, period in enumerate(unlucky_periods[:10]):  # 只显示前10个最严重的
            print(f"🚨 倒霉时段 #{i+1}")
            print(f"   时间: {period['start_date']} ~ {period['end_date']}")
            print(f"   大运: {period['dayun']}")
            print(f"   下降幅度: {period['before_avg']:.1f}分 → {period['current_avg']:.1f}分 (下降{period['drop']:.1f}分)")
            print(f"   分数范围: {period['min_score']}-{period['max_score']}分")
            print()
        
        return unlucky_periods
    
    def detect_lucky_periods(self, window_days=7, rise_threshold=10):
        """检测幸运时段：运气突然大幅上升的时间段"""
        print(f"🌟 检测幸运时段（{window_days}天窗口，上升{rise_threshold}分以上）")
        print("=" * 60)
        
        lucky_periods = []
        scores = [item['final_score'] for item in self.data]
        
        for i in range(len(scores) - window_days):
            before_window = scores[max(0, i-window_days):i]
            current_window = scores[i:i+window_days]
            
            if before_window and current_window:
                before_avg = statistics.mean(before_window)
                current_avg = statistics.mean(current_window)
                rise = current_avg - before_avg
                
                if rise >= rise_threshold:
                    start_date = self.data[i]['date_obj']
                    end_date = self.data[i+window_days-1]['date_obj']
                    
                    lucky_periods.append({
                        'start_date': start_date,
                        'end_date': end_date,
                        'before_avg': before_avg,
                        'current_avg': current_avg,
                        'rise': rise,
                        'dayun': self.data[i]['dayun_ganzhi'],
                        'min_score': min(current_window),
                        'max_score': max(current_window)
                    })
        
        lucky_periods.sort(key=lambda x: x['rise'], reverse=True)
        
        print(f"📊 检测到 {len(lucky_periods)} 个幸运时段:")
        print()
        
        for i, period in enumerate(lucky_periods[:10]):
            print(f"✨ 幸运时段 #{i+1}")
            print(f"   时间: {period['start_date']} ~ {period['end_date']}")
            print(f"   大运: {period['dayun']}")
            print(f"   上升幅度: {period['before_avg']:.1f}分 → {period['current_avg']:.1f}分 (上升{period['rise']:.1f}分)")
            print(f"   分数范围: {period['min_score']}-{period['max_score']}分")
            print()
        
        return lucky_periods
    
    def analyze_volatility_by_dayun(self):
        """分析各大运期的运势波动性"""
        print("📊 各大运期运势波动分析")
        print("=" * 60)
        
        dayun_data = defaultdict(list)
        for item in self.data:
            dayun_data[item['dayun_ganzhi']].append(item['final_score'])
        
        for dayun, scores in dayun_data.items():
            if len(scores) > 100:  # 只分析有足够数据的大运期
                avg_score = statistics.mean(scores)
                std_dev = statistics.stdev(scores)
                min_score = min(scores)
                max_score = max(scores)
                range_score = max_score - min_score
                
                # 计算波动系数（变异系数）
                volatility = (std_dev / avg_score) * 100
                
                print(f"🔮 {dayun}大运:")
                print(f"   平均分: {avg_score:.1f}分")
                print(f"   标准差: {std_dev:.1f}分")
                print(f"   分数范围: {min_score}-{max_score}分 (波动{range_score}分)")
                print(f"   波动系数: {volatility:.1f}% ({'高波动' if volatility > 15 else '低波动' if volatility < 10 else '中等波动'})")
                print()
    
    def find_extreme_score_clusters(self):
        """找出极端分数的聚集现象"""
        print("🎯 极端分数聚集分析")
        print("=" * 60)
        
        scores = [item['final_score'] for item in self.data]
        
        # 计算分位数（纯Python实现）
        sorted_scores = sorted(scores)
        n = len(sorted_scores)
        p90_index = int(n * 0.9)
        p10_index = int(n * 0.1)
        p90 = sorted_scores[p90_index]  # 90分位数（高分）
        p10 = sorted_scores[p10_index]  # 10分位数（低分）
        
        print(f"📈 分数分布:")
        print(f"   90分位数: {p90:.1f}分 (前10%高分)")
        print(f"   10分位数: {p10:.1f}分 (后10%低分)")
        
        # 找出连续的高分期和低分期
        high_score_streaks = []
        low_score_streaks = []
        
        current_high_streak = []
        current_low_streak = []
        
        for item in self.data:
            if item['final_score'] >= p90:
                current_high_streak.append(item)
                if current_low_streak:
                    if len(current_low_streak) >= 3:
                        low_score_streaks.append(current_low_streak.copy())
                    current_low_streak = []
            elif item['final_score'] <= p10:
                current_low_streak.append(item)
                if current_high_streak:
                    if len(current_high_streak) >= 3:
                        high_score_streaks.append(current_high_streak.copy())
                    current_high_streak = []
            else:
                if current_high_streak and len(current_high_streak) >= 3:
                    high_score_streaks.append(current_high_streak.copy())
                if current_low_streak and len(current_low_streak) >= 3:
                    low_score_streaks.append(current_low_streak.copy())
                current_high_streak = []
                current_low_streak = []
        
        print(f"\n🌟 连续高分期 (≥{p90:.1f}分，持续3天以上):")
        for i, streak in enumerate(high_score_streaks[:5]):
            start_date = streak[0]['date']
            end_date = streak[-1]['date']
            avg_score = statistics.mean([item['final_score'] for item in streak])
            print(f"   #{i+1}: {start_date} ~ {end_date} ({len(streak)}天，平均{avg_score:.1f}分)")
        
        print(f"\n⚠️ 连续低分期 (≤{p10:.1f}分，持续3天以上):")
        for i, streak in enumerate(low_score_streaks[:5]):
            start_date = streak[0]['date']
            end_date = streak[-1]['date']
            avg_score = statistics.mean([item['final_score'] for item in streak])
            print(f"   #{i+1}: {start_date} ~ {end_date} ({len(streak)}天，平均{avg_score:.1f}分)")
    
    def analyze_seasonal_patterns(self):
        """分析季节性模式"""
        print("\n🌸 季节性运势模式分析")
        print("=" * 60)
        
        # 按月份统计
        monthly_scores = defaultdict(list)
        for item in self.data:
            month = item['date_obj'].month
            monthly_scores[month].append(item['final_score'])
        
        print("📅 各月份平均运势:")
        month_names = ['1月', '2月', '3月', '4月', '5月', '6月', 
                      '7月', '8月', '9月', '10月', '11月', '12月']
        
        month_avgs = []
        for month in range(1, 13):
            if month in monthly_scores:
                avg_score = statistics.mean(monthly_scores[month])
                month_avgs.append((month, avg_score))
                print(f"   {month_names[month-1]}: {avg_score:.1f}分")
        
        # 找出最好和最差的月份
        best_month = max(month_avgs, key=lambda x: x[1])
        worst_month = min(month_avgs, key=lambda x: x[1])
        
        print(f"\n🏆 全年最佳月份: {month_names[best_month[0]-1]} (平均{best_month[1]:.1f}分)")
        print(f"⚠️ 全年最差月份: {month_names[worst_month[0]-1]} (平均{worst_month[1]:.1f}分)")
    
    def find_dangerous_ganzhi_combinations(self):
        """找出最危险的干支组合"""
        print("\n💀 危险干支组合分析")
        print("=" * 60)
        
        # 统计每个流日干支的平均分数
        ganzhi_scores = defaultdict(list)
        for item in self.data:
            # 从CSV中提取流日干支
            for row_data in csv.DictReader(open(os.path.join(os.path.dirname(__file__), "最终版一生每日分数_1995-2055.csv"), 'r', encoding='utf-8')):
                if row_data['日期'] == item['date']:
                    liuri_ganzhi = row_data['流日干支']
                    ganzhi_scores[liuri_ganzhi].append(item['final_score'])
                    break
        
        # 计算各干支的平均分和出现次数
        ganzhi_stats = []
        for ganzhi, scores in ganzhi_scores.items():
            if len(scores) >= 10:  # 至少出现10次
                avg_score = statistics.mean(scores)
                count = len(scores)
                min_score = min(scores)
                max_score = max(scores)
                
                ganzhi_stats.append({
                    'ganzhi': ganzhi,
                    'avg_score': avg_score,
                    'count': count,
                    'min_score': min_score,
                    'max_score': max_score
                })
        
        # 按平均分排序
        ganzhi_stats.sort(key=lambda x: x['avg_score'])
        
        print("⚠️ 最危险的流日干支 (平均分最低):")
        for i, stat in enumerate(ganzhi_stats[:5]):
            print(f"   #{i+1}: {stat['ganzhi']} - 平均{stat['avg_score']:.1f}分 (出现{stat['count']}次，{stat['min_score']}-{stat['max_score']}分)")
        
        print("\n✨ 最幸运的流日干支 (平均分最高):")
        for i, stat in enumerate(ganzhi_stats[-5:]):
            print(f"   #{i+1}: {stat['ganzhi']} - 平均{stat['avg_score']:.1f}分 (出现{stat['count']}次，{stat['min_score']}-{stat['max_score']}分)")
    
    def analyze_lifecycle_trends(self):
        """分析人生周期趋势"""
        print("\n📈 人生周期趋势分析")
        print("=" * 60)
        
        # 按年龄段分析（每5年一个阶段）
        age_groups = defaultdict(list)
        birth_year = 1995
        
        for item in self.data:
            age = item['year'] - birth_year
            age_group = (age // 5) * 5  # 0-4岁，5-9岁，10-14岁...
            age_groups[age_group].append(item['final_score'])
        
        print("👶 各年龄段平均运势:")
        for age_group in sorted(age_groups.keys()):
            if age_groups[age_group]:
                avg_score = statistics.mean(age_groups[age_group])
                count = len(age_groups[age_group])
                print(f"   {age_group}-{age_group+4}岁: {avg_score:.1f}分 ({count}天数据)")
        
        # 找出人生最佳和最差阶段
        age_avgs = [(age, statistics.mean(scores)) for age, scores in age_groups.items() if scores]
        best_age = max(age_avgs, key=lambda x: x[1])
        worst_age = min(age_avgs, key=lambda x: x[1])
        
        print(f"\n🏆 人生最佳阶段: {best_age[0]}-{best_age[0]+4}岁 (平均{best_age[1]:.1f}分)")
        print(f"⚠️ 人生最差阶段: {worst_age[0]}-{worst_age[0]+4}岁 (平均{worst_age[1]:.1f}分)")
    
    def find_score_anomalies(self):
        """找出分数异常值"""
        print("\n🎯 分数异常值分析")
        print("=" * 60)
        
        scores = [item['final_score'] for item in self.data]
        mean_score = statistics.mean(scores)
        std_score = statistics.stdev(scores)
        
        # 定义异常值：距离平均值超过2个标准差
        upper_threshold = mean_score + 2 * std_score
        lower_threshold = mean_score - 2 * std_score
        
        high_anomalies = [item for item in self.data if item['final_score'] > upper_threshold]
        low_anomalies = [item for item in self.data if item['final_score'] < lower_threshold]
        
        print(f"📊 异常值阈值:")
        print(f"   平均分: {mean_score:.1f}分")
        print(f"   标准差: {std_score:.1f}分")
        print(f"   高异常阈值: >{upper_threshold:.1f}分")
        print(f"   低异常阈值: <{lower_threshold:.1f}分")
        
        print(f"\n🚀 超高分异常日 ({len(high_anomalies)}天):")
        for item in high_anomalies[:5]:
            print(f"   {item['date']}: {item['final_score']}分 (大运:{item['dayun_ganzhi']})")
        
        print(f"\n💥 超低分异常日 ({len(low_anomalies)}天):")
        for item in low_anomalies[:5]:
            print(f"   {item['date']}: {item['final_score']}分 (大运:{item['dayun_ganzhi']})")
    
    def analyze_weekly_patterns(self):
        """分析一周内的运势模式"""
        print("\n📅 星期运势模式分析")
        print("=" * 60)
        
        weekday_scores = defaultdict(list)
        weekday_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        
        for item in self.data:
            weekday = item['date_obj'].weekday()  # 0=周一, 6=周日
            weekday_scores[weekday].append(item['final_score'])
        
        print("各星期运势平均分:")
        for weekday in range(7):
            if weekday in weekday_scores:
                avg_score = statistics.mean(weekday_scores[weekday])
                count = len(weekday_scores[weekday])
                print(f"   {weekday_names[weekday]}: {avg_score:.1f}分 ({count}天数据)")
        
        # 找出最好和最差的星期
        weekday_avgs = [(day, statistics.mean(scores)) for day, scores in weekday_scores.items()]
        best_weekday = max(weekday_avgs, key=lambda x: x[1])
        worst_weekday = min(weekday_avgs, key=lambda x: x[1])
        
        print(f"\n🏆 最佳星期: {weekday_names[best_weekday[0]]} (平均{best_weekday[1]:.1f}分)")
        print(f"⚠️ 最差星期: {weekday_names[worst_weekday[0]]} (平均{worst_weekday[1]:.1f}分)")

if __name__ == "__main__":
    print("🚀 启动运势模式分析器")
    print("基于61年长时间序列数据的深度分析")
    print("=" * 80)
    
    try:
        analyzer = FortunePatternAnalyzer()
        
        # 检测倒霉时段
        unlucky_periods = analyzer.detect_unlucky_periods(window_days=7, drop_threshold=8)
        
        # 检测幸运时段
        lucky_periods = analyzer.detect_lucky_periods(window_days=7, rise_threshold=8)
        
        # 大运波动性分析
        analyzer.analyze_volatility_by_dayun()
        
        # 极端分数分析
        analyzer.find_score_anomalies()
        
        # 季节性分析
        analyzer.analyze_seasonal_patterns()
        
        # 星期模式分析
        analyzer.analyze_weekly_patterns()
        
        # 人生周期分析
        analyzer.analyze_lifecycle_trends()
        
        print("\n" + "=" * 80)
        print("🎉 运势模式分析完成！")
        print("💡 这些发现可以帮助您更好地理解自己的运势规律")
        
    except Exception as e:
        print(f"❌ 分析过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()
