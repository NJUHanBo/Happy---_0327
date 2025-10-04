#!/usr/bin/env python3
"""
高级运势分析器
更多有趣的时间序列分析
"""

import csv
import os
import datetime
from collections import defaultdict, Counter
import statistics
import calendar

class AdvancedFortuneAnalytics:
    
    def __init__(self, csv_file_path=None):
        if csv_file_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            csv_file_path = os.path.join(current_dir, "最终版一生每日分数_1995-2055.csv")
        
        self.data = self.load_data(csv_file_path)
        print(f"🔮 高级分析器已加载 {len(self.data)} 天数据")
    
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
                            'dayun_ganzhi': row['大运干支'],
                            'liunian_ganzhi': row['流年干支'],
                            'liuyue_ganzhi': row['流月干支'],
                            'liuri_ganzhi': row['流日干支'],
                            'final_score': int(row['最终总分']),
                            'month': date_obj.month,
                            'day': date_obj.day,
                            'weekday': date_obj.weekday()
                        })
                    except (ValueError, KeyError):
                        continue
        except FileNotFoundError:
            print(f"❌ 数据文件不存在: {csv_file_path}")
        
        return data
    
    def analyze_birthday_fortune_effect(self):
        """分析生日效应：每年生日前后的运势变化"""
        print("🎂 生日效应分析")
        print("=" * 60)
        
        birthday_month, birthday_day = 6, 11  # 6月11日生日
        
        birthday_effects = []
        
        for item in self.data:
            if item['month'] == birthday_month and item['day'] == birthday_day:
                # 这是生日
                birthday_score = item['final_score']
                
                # 找前7天和后7天
                target_date = item['date_obj']
                before_scores = []
                after_scores = []
                
                for other_item in self.data:
                    date_diff = (other_item['date_obj'] - target_date).days
                    if -7 <= date_diff <= -1:
                        before_scores.append(other_item['final_score'])
                    elif 1 <= date_diff <= 7:
                        after_scores.append(other_item['final_score'])
                
                if before_scores and after_scores:
                    before_avg = statistics.mean(before_scores)
                    after_avg = statistics.mean(after_scores)
                    
                    birthday_effects.append({
                        'year': item['year'],
                        'birthday_score': birthday_score,
                        'before_avg': before_avg,
                        'after_avg': after_avg,
                        'birthday_boost': birthday_score - before_avg,
                        'after_effect': after_avg - birthday_score
                    })
        
        # 统计分析
        if birthday_effects:
            avg_birthday_boost = statistics.mean([effect['birthday_boost'] for effect in birthday_effects])
            avg_after_effect = statistics.mean([effect['after_effect'] for effect in birthday_effects])
            
            print(f"📊 生日效应统计 (基于{len(birthday_effects)}年数据):")
            print(f"   平均生日加成: {avg_birthday_boost:+.1f}分")
            print(f"   平均生日后效应: {avg_after_effect:+.1f}分")
            
            print(f"\n🎯 各年生日运势:")
            for effect in birthday_effects[-10:]:  # 显示最近10年
                print(f"   {effect['year']}年: 生日{effect['birthday_score']}分 (前7天{effect['before_avg']:.1f}→后7天{effect['after_avg']:.1f})")
    
    def find_golden_time_windows(self, min_days=5, min_avg_score=55):
        """找出黄金时间窗口：连续高分的时段"""
        print(f"\n✨ 黄金时间窗口分析")
        print(f"(连续{min_days}天以上，平均分≥{min_avg_score}分)")
        print("=" * 60)
        
        golden_windows = []
        current_window = []
        
        for item in self.data:
            if item['final_score'] >= min_avg_score:
                current_window.append(item)
            else:
                if len(current_window) >= min_days:
                    avg_score = statistics.mean([item['final_score'] for item in current_window])
                    golden_windows.append({
                        'start_date': current_window[0]['date_obj'],
                        'end_date': current_window[-1]['date_obj'],
                        'duration': len(current_window),
                        'avg_score': avg_score,
                        'peak_score': max([item['final_score'] for item in current_window]),
                        'dayun': current_window[0]['dayun_ganzhi']
                    })
                current_window = []
        
        # 检查最后一个窗口
        if len(current_window) >= min_days:
            avg_score = statistics.mean([item['final_score'] for item in current_window])
            golden_windows.append({
                'start_date': current_window[0]['date_obj'],
                'end_date': current_window[-1]['date_obj'],
                'duration': len(current_window),
                'avg_score': avg_score,
                'peak_score': max([item['final_score'] for item in current_window]),
                'dayun': current_window[0]['dayun_ganzhi']
            })
        
        # 按持续时间排序
        golden_windows.sort(key=lambda x: x['duration'], reverse=True)
        
        print(f"🏆 发现 {len(golden_windows)} 个黄金时间窗口:")
        print()
        
        for i, window in enumerate(golden_windows[:8]):
            print(f"✨ 黄金窗口 #{i+1}")
            print(f"   时间: {window['start_date']} ~ {window['end_date']}")
            print(f"   持续: {window['duration']}天")
            print(f"   平均分: {window['avg_score']:.1f}分")
            print(f"   峰值: {window['peak_score']}分")
            print(f"   大运: {window['dayun']}")
            print()
        
        return golden_windows
    
    def analyze_traditional_festivals_fortune(self):
        """分析传统节日的运势规律"""
        print("🏮 传统节日运势分析")
        print("=" * 60)
        
        # 定义重要节日（农历节日需要转换，这里先用公历近似）
        festivals = {
            '春节': [(1, 22), (1, 23), (1, 24), (1, 25), (1, 26), (1, 27), (1, 28), (1, 29), (1, 30), (2, 1), (2, 2), (2, 3), (2, 4), (2, 5)],  # 春节期间
            '清明': [(4, 4), (4, 5), (4, 6)],
            '端午': [(6, 14), (6, 15), (6, 16)],  # 近似
            '中秋': [(9, 15), (9, 16), (9, 17)],  # 近似
            '国庆': [(10, 1), (10, 2), (10, 3), (10, 4), (10, 5), (10, 6), (10, 7)],
            '元旦': [(1, 1), (1, 2), (1, 3)]
        }
        
        festival_stats = {}
        
        for festival_name, dates in festivals.items():
            festival_scores = []
            
            for item in self.data:
                if (item['month'], item['day']) in dates:
                    festival_scores.append(item['final_score'])
            
            if festival_scores:
                avg_score = statistics.mean(festival_scores)
                festival_stats[festival_name] = {
                    'avg_score': avg_score,
                    'count': len(festival_scores),
                    'max_score': max(festival_scores),
                    'min_score': min(festival_scores)
                }
        
        # 按平均分排序
        sorted_festivals = sorted(festival_stats.items(), key=lambda x: x[1]['avg_score'], reverse=True)
        
        print("🎊 各节日平均运势排行:")
        for festival, stats in sorted_festivals:
            print(f"   {festival}: {stats['avg_score']:.1f}分 (统计{stats['count']}次，{stats['min_score']}-{stats['max_score']}分)")
    
    def detect_fortune_cycles(self):
        """检测运势周期性规律"""
        print("\n🔄 运势周期性分析")
        print("=" * 60)
        
        scores = [item['final_score'] for item in self.data]
        
        # 简单的周期检测：看看是否有明显的重复模式
        potential_cycles = [7, 10, 30, 60, 365]  # 周、旬、月、双月、年
        
        for cycle_length in potential_cycles:
            if len(scores) > cycle_length * 3:  # 至少要有3个完整周期
                correlations = []
                
                # 计算不同周期位移的相关性
                for offset in range(1, 4):  # 检测1-3个周期的相关性
                    corr_sum = 0
                    count = 0
                    
                    for i in range(len(scores) - cycle_length * offset):
                        score1 = scores[i]
                        score2 = scores[i + cycle_length * offset]
                        corr_sum += abs(score1 - score2)
                        count += 1
                    
                    if count > 0:
                        avg_diff = corr_sum / count
                        correlations.append(avg_diff)
                
                if correlations:
                    avg_correlation = statistics.mean(correlations)
                    print(f"   {cycle_length}天周期: 平均差异{avg_correlation:.1f}分 ({'强周期性' if avg_correlation < 5 else '弱周期性' if avg_correlation < 8 else '无周期性'})")
    
    def analyze_consecutive_extremes(self):
        """分析连续极端值现象"""
        print("\n⚡ 连续极端值分析")
        print("=" * 60)
        
        scores = [item['final_score'] for item in self.data]
        overall_avg = statistics.mean(scores)
        
        # 定义极端值
        high_threshold = overall_avg + 10  # 高于平均分10分
        low_threshold = overall_avg - 10   # 低于平均分10分
        
        print(f"📊 极端值定义:")
        print(f"   平均分: {overall_avg:.1f}分")
        print(f"   高极端值: >{high_threshold:.1f}分")
        print(f"   低极端值: <{low_threshold:.1f}分")
        
        # 找连续极端值
        consecutive_highs = []
        consecutive_lows = []
        
        current_high_streak = 0
        current_low_streak = 0
        max_high_streak = 0
        max_low_streak = 0
        max_high_dates = []
        max_low_dates = []
        
        for i, item in enumerate(self.data):
            if item['final_score'] > high_threshold:
                current_high_streak += 1
                current_low_streak = 0
                
                if current_high_streak > max_high_streak:
                    max_high_streak = current_high_streak
                    start_idx = i - current_high_streak + 1
                    max_high_dates = [self.data[j]['date'] for j in range(start_idx, i+1)]
                    
            elif item['final_score'] < low_threshold:
                current_low_streak += 1
                current_high_streak = 0
                
                if current_low_streak > max_low_streak:
                    max_low_streak = current_low_streak
                    start_idx = i - current_low_streak + 1
                    max_low_dates = [self.data[j]['date'] for j in range(start_idx, i+1)]
            else:
                current_high_streak = 0
                current_low_streak = 0
        
        print(f"\n🔥 最长连续高分: {max_high_streak}天")
        if max_high_dates:
            print(f"   时间: {max_high_dates[0]} ~ {max_high_dates[-1]}")
        
        print(f"\n❄️ 最长连续低分: {max_low_streak}天")
        if max_low_dates:
            print(f"   时间: {max_low_dates[0]} ~ {max_low_dates[-1]}")
    
    def find_mirror_symmetry_days(self):
        """找出镜像对称日：同一年内分数相近的对称日期"""
        print("\n🪞 镜像对称日分析")
        print("=" * 60)
        
        mirror_pairs = []
        
        # 按年分组
        yearly_data = defaultdict(list)
        for item in self.data:
            yearly_data[item['year']].append(item)
        
        for year, year_data in yearly_data.items():
            if len(year_data) < 300:  # 确保有足够数据
                continue
                
            # 按日期排序
            year_data.sort(key=lambda x: x['date_obj'])
            
            # 找年中对称的日期对
            year_length = len(year_data)
            for i in range(year_length // 2):
                front_item = year_data[i]
                back_item = year_data[-(i+1)]
                
                score_diff = abs(front_item['final_score'] - back_item['final_score'])
                
                # 如果分数差异很小（≤2分），认为是镜像对称
                if score_diff <= 2:
                    mirror_pairs.append({
                        'year': year,
                        'front_date': front_item['date'],
                        'back_date': back_item['date'],
                        'front_score': front_item['final_score'],
                        'back_score': back_item['final_score'],
                        'diff': score_diff
                    })
        
        print(f"🔍 发现 {len(mirror_pairs)} 对镜像对称日:")
        for i, pair in enumerate(mirror_pairs[:10]):
            print(f"   #{i+1}: {pair['front_date']}({pair['front_score']}分) ↔ {pair['back_date']}({pair['back_score']}分) 差异{pair['diff']}分")
    
    def analyze_fortune_momentum(self):
        """分析运势动量：连续上升/下降的趋势"""
        print("\n📈 运势动量分析")
        print("=" * 60)
        
        # 计算每日运势变化
        daily_changes = []
        for i in range(1, len(self.data)):
            change = self.data[i]['final_score'] - self.data[i-1]['final_score']
            daily_changes.append({
                'date': self.data[i]['date'],
                'change': change,
                'score': self.data[i]['final_score']
            })
        
        # 找最长的上升趋势
        max_rise_streak = 0
        max_rise_dates = []
        current_rise_streak = 0
        
        # 找最长的下降趋势
        max_fall_streak = 0
        max_fall_dates = []
        current_fall_streak = 0
        
        for i, change in enumerate(daily_changes):
            if change['change'] > 0:
                current_rise_streak += 1
                current_fall_streak = 0
                
                if current_rise_streak > max_rise_streak:
                    max_rise_streak = current_rise_streak
                    start_idx = i - current_rise_streak + 1
                    max_rise_dates = [daily_changes[j]['date'] for j in range(start_idx, i+1)]
                    
            elif change['change'] < 0:
                current_fall_streak += 1
                current_rise_streak = 0
                
                if current_fall_streak > max_fall_streak:
                    max_fall_streak = current_fall_streak
                    start_idx = i - current_fall_streak + 1
                    max_fall_dates = [daily_changes[j]['date'] for j in range(start_idx, i+1)]
            else:
                current_rise_streak = 0
                current_fall_streak = 0
        
        print(f"🚀 最长连续上升: {max_rise_streak}天")
        if max_rise_dates:
            print(f"   时间: {max_rise_dates[0]} ~ {max_rise_dates[-1]}")
        
        print(f"📉 最长连续下降: {max_fall_streak}天")
        if max_fall_dates:
            print(f"   时间: {max_fall_dates[0]} ~ {max_fall_dates[-1]}")
    
    def find_perfect_score_days(self):
        """找出完美分数日和糟糕分数日"""
        print("\n💎 完美分数日分析")
        print("=" * 60)
        
        scores = [item['final_score'] for item in self.data]
        max_score = max(scores)
        min_score = min(scores)
        
        perfect_days = [item for item in self.data if item['final_score'] == max_score]
        terrible_days = [item for item in self.data if item['final_score'] == min_score]
        
        print(f"🌟 完美分数日 ({max_score}分，共{len(perfect_days)}天):")
        for day in perfect_days:
            print(f"   {day['date']} - {day['liuri_ganzhi']} (大运:{day['dayun_ganzhi']})")
        
        print(f"\n💀 最糟糕日 ({min_score}分，共{len(terrible_days)}天):")
        for day in terrible_days:
            print(f"   {day['date']} - {day['liuri_ganzhi']} (大运:{day['dayun_ganzhi']})")
    
    def analyze_score_distribution_by_ganzhi(self):
        """按干支分析分数分布"""
        print("\n🎲 干支分数分布分析")
        print("=" * 60)
        
        # 分析流日干支的分数分布
        ganzhi_distributions = defaultdict(list)
        
        # 重新读取详细数据
        try:
            with open(os.path.join(os.path.dirname(__file__), "最终版一生每日分数_1995-2055.csv"), 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['日期'] == '日期':
                        continue
                    try:
                        liuri_ganzhi = row['流日干支']
                        final_score = int(row['最终总分'])
                        ganzhi_distributions[liuri_ganzhi].append(final_score)
                    except (ValueError, KeyError):
                        continue
        except Exception as e:
            print(f"读取数据出错: {e}")
            return
        
        # 计算各干支的统计数据
        ganzhi_stats = []
        for ganzhi, scores in ganzhi_distributions.items():
            if len(scores) >= 20:  # 至少出现20次
                avg_score = statistics.mean(scores)
                std_dev = statistics.stdev(scores) if len(scores) > 1 else 0
                min_score = min(scores)
                max_score = max(scores)
                
                ganzhi_stats.append({
                    'ganzhi': ganzhi,
                    'avg_score': avg_score,
                    'std_dev': std_dev,
                    'min_score': min_score,
                    'max_score': max_score,
                    'count': len(scores),
                    'range': max_score - min_score
                })
        
        # 按平均分排序
        ganzhi_stats.sort(key=lambda x: x['avg_score'], reverse=True)
        
        print("🏆 流日干支运势排行榜 (前10名):")
        for i, stat in enumerate(ganzhi_stats[:10]):
            print(f"   #{i+1}: {stat['ganzhi']} - 平均{stat['avg_score']:.1f}分 (标准差{stat['std_dev']:.1f}，范围{stat['range']}分)")
        
        print("\n⚠️ 流日干支运势排行榜 (后10名):")
        for i, stat in enumerate(ganzhi_stats[-10:]):
            rank = len(ganzhi_stats) - 9 + i
            print(f"   #{rank}: {stat['ganzhi']} - 平均{stat['avg_score']:.1f}分 (标准差{stat['std_dev']:.1f}，范围{stat['range']}分)")
    
    def predict_next_month_pattern(self):
        """基于历史模式预测下个月的运势趋势"""
        print("\n🔮 下月运势预测分析")
        print("=" * 60)
        
        current_date = datetime.date.today()
        next_month = current_date.month + 1
        next_year = current_date.year
        
        if next_month > 12:
            next_month = 1
            next_year += 1
        
        # 找出历史上所有同月的数据
        historical_same_month = [item for item in self.data 
                               if item['month'] == next_month]
        
        if historical_same_month:
            avg_score = statistics.mean([item['final_score'] for item in historical_same_month])
            max_score = max([item['final_score'] for item in historical_same_month])
            min_score = min([item['final_score'] for item in historical_same_month])
            
            print(f"📊 基于历史数据的{next_year}年{next_month}月预测:")
            print(f"   历史同月平均分: {avg_score:.1f}分")
            print(f"   历史同月最高分: {max_score}分")
            print(f"   历史同月最低分: {min_score}分")
            print(f"   统计样本: {len(historical_same_month)}天")
            
            # 按大运期细分
            dayun_predictions = defaultdict(list)
            for item in historical_same_month:
                dayun_predictions[item['dayun_ganzhi']].append(item['final_score'])
            
            print(f"\n🔮 按大运期的同月表现:")
            for dayun, scores in dayun_predictions.items():
                if len(scores) >= 5:
                    avg = statistics.mean(scores)
                    print(f"   {dayun}大运的{next_month}月: 平均{avg:.1f}分 ({len(scores)}次数据)")

if __name__ == "__main__":
    print("🧠 高级运势分析器启动")
    print("发现更多隐藏在时间序列中的有趣模式")
    print("=" * 80)
    
    try:
        analyzer = AdvancedFortuneAnalytics()
        
        # 生日效应分析
        analyzer.analyze_birthday_fortune_effect()
        
        # 黄金时间窗口
        analyzer.find_golden_time_windows(min_days=7, min_avg_score=58)
        
        # 传统节日运势
        analyzer.analyze_traditional_festivals_fortune()
        
        # 运势周期性
        analyzer.detect_fortune_cycles()
        
        # 连续极端值
        analyzer.analyze_consecutive_extremes()
        
        # 镜像对称日
        analyzer.find_mirror_symmetry_days()
        
        # 运势动量
        analyzer.analyze_fortune_momentum()
        
        # 完美分数日
        analyzer.find_perfect_score_days()
        
        # 干支分数分布
        analyzer.analyze_score_distribution_by_ganzhi()
        
        # 下月预测
        analyzer.predict_next_month_pattern()
        
        print("\n" + "=" * 80)
        print("🎊 高级分析完成！发现了很多有趣的运势规律！")
        
    except Exception as e:
        print(f"❌ 分析过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()






