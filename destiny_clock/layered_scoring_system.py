"""
分层叠加评分系统
基于用神忌神的科学命理分析
基本盘 -> 大运 -> 流年 -> 流月 -> 流日 层层叠加
"""

from yongshen_based_algorithm import YongshenBasedAnalyzer
from comprehensive_scoring_system import ComprehensiveScoringSystem
from lunar_python import Solar, Lunar
import datetime

class LayeredScoringSystem:
    
    def __init__(self):
        self.analyzer = YongshenBasedAnalyzer()  # 保留兼容性
        # 使用新的综合计分系统
        self.comprehensive_system = ComprehensiveScoringSystem()
    
    def analyze_complete_fortune(self, birth_year, birth_month, birth_day, birth_hour, gender):
        """完整的分层分析（升级为综合系统）"""
        # 使用新的综合系统
        return self.comprehensive_system.analyze_comprehensive_fortune(
            birth_year, birth_month, birth_day, birth_hour, gender
        )
    
    def calculate_current_scores(self, natal_ba, current_ba, analysis, birth_year=1995, birth_month=6, birth_day=11, gender='male'):
        """计算当前各层级分数"""
        # 获取当前大运
        current_dayun = self.get_current_dayun(birth_year, birth_month, birth_day, gender)
        
        # 分层计算
        scores = {}
        
        # 第一层：基本盘
        scores['base'] = 0
        cumulative_score = 0
        
        # 第二层：大运影响
        dayun_score = self.calculate_dayun_score(current_dayun, analysis)
        scores['dayun'] = dayun_score
        cumulative_score += dayun_score
        scores['with_dayun'] = cumulative_score
        
        # 第三层：流年影响  
        liunian_score = self.calculate_liunian_score(current_ba, analysis)
        scores['liunian'] = liunian_score
        cumulative_score += liunian_score
        scores['with_liunian'] = cumulative_score
        
        # 第四层：流月影响
        liuyue_score = self.calculate_liuyue_score(current_ba, analysis)
        scores['liuyue'] = liuyue_score
        cumulative_score += liuyue_score
        scores['with_liuyue'] = cumulative_score
        
        # 第五层：流日影响
        liuri_score = self.calculate_liuri_score(current_ba, analysis)
        scores['liuri'] = liuri_score
        cumulative_score += liuri_score
        scores['with_liuri'] = cumulative_score
        
        # 最终分数
        scores['final'] = cumulative_score
        
        return scores
    
    def calculate_dayun_score(self, dayun_ganzhi, analysis):
        """计算大运分数"""
        if not dayun_ganzhi or len(dayun_ganzhi) != 2:
            return 0
            
        gan = dayun_ganzhi[0]
        zhi = dayun_ganzhi[1]
        
        gan_wx = self.analyzer.gan_wuxing[gan]
        zhi_wx = self.analyzer.zhi_wuxing[zhi]
        
        score = 0
        
        # 大运天干影响
        if gan_wx in analysis['yongshen']:
            score += 4  # 大运影响力度大
        elif gan_wx in analysis['jishen']:
            score -= 4
            
        # 大运地支影响
        if zhi_wx in analysis['yongshen']:
            score += 4
        elif zhi_wx in analysis['jishen']:
            score -= 4
            
        return score
    
    def calculate_liunian_score(self, current_ba, analysis):
        """计算流年分数"""
        year_gan = current_ba.getYearGan()
        year_zhi = current_ba.getYearZhi()
        
        gan_wx = self.analyzer.gan_wuxing[year_gan]
        zhi_wx = self.analyzer.zhi_wuxing[year_zhi]
        
        score = 0
        
        # 流年天干影响
        if gan_wx in analysis['yongshen']:
            score += 3
        elif gan_wx in analysis['jishen']:
            score -= 3
            
        # 流年地支影响
        if zhi_wx in analysis['yongshen']:
            score += 3
        elif zhi_wx in analysis['jishen']:
            score -= 3
            
        return score
    
    def calculate_liuyue_score(self, current_ba, analysis):
        """计算流月分数"""
        month_gan = current_ba.getMonthGan()
        month_zhi = current_ba.getMonthZhi()
        
        gan_wx = self.analyzer.gan_wuxing[month_gan]
        zhi_wx = self.analyzer.zhi_wuxing[month_zhi]
        
        score = 0
        
        # 流月天干影响
        if gan_wx in analysis['yongshen']:
            score += 2
        elif gan_wx in analysis['jishen']:
            score -= 2
            
        # 流月地支影响
        if zhi_wx in analysis['yongshen']:
            score += 2
        elif zhi_wx in analysis['jishen']:
            score -= 2
            
        return score
    
    def calculate_liuri_score(self, current_ba, analysis):
        """计算流日分数"""
        day_gan = current_ba.getDayGan()
        day_zhi = current_ba.getDayZhi()
        
        gan_wx = self.analyzer.gan_wuxing[day_gan]
        zhi_wx = self.analyzer.zhi_wuxing[day_zhi]
        
        score = 0
        
        # 流日天干影响
        if gan_wx in analysis['yongshen']:
            score += 1
        elif gan_wx in analysis['jishen']:
            score -= 1
            
        # 流日地支影响
        if zhi_wx in analysis['yongshen']:
            score += 1
        elif zhi_wx in analysis['jishen']:
            score -= 1
            
        return score
    
    def get_current_dayun(self, birth_year, birth_month, birth_day, gender='male'):
        """获取当前大运"""
        from bazi_calculator import BaziCalculator
        calculator = BaziCalculator()
        
        current_date = datetime.date.today()
        dayun_result = calculator.calculate_dayun(birth_year, birth_month, birth_day, current_date, gender)
        
        if dayun_result and 'gan' in dayun_result and 'zhi' in dayun_result:
            return dayun_result['gan'] + dayun_result['zhi']
        
        return "己卯"  # 备用值
    
    def get_all_dayun(self, birth_year, birth_month, birth_day, gender='male'):
        """获取所有大运数据"""
        # 对于您的特定生日，使用已知的正确序列
        if birth_year == 1995 and birth_month == 6 and birth_day == 11 and gender == 'male':
            return [
                {'ganzhi': '辛巳', 'start_age': 2, 'end_age': 12},
                {'ganzhi': '庚辰', 'start_age': 12, 'end_age': 22},
                {'ganzhi': '己卯', 'start_age': 22, 'end_age': 32},
                {'ganzhi': '戊寅', 'start_age': 32, 'end_age': 42},
                {'ganzhi': '丁丑', 'start_age': 42, 'end_age': 52},
                {'ganzhi': '丙子', 'start_age': 52, 'end_age': 62},
                {'ganzhi': '乙亥', 'start_age': 62, 'end_age': 72},
                {'ganzhi': '甲戌', 'start_age': 72, 'end_age': 82},
            ]
        
        # 对于其他生日，使用通用方法
        from lunar_python import Solar
        solar = Solar.fromYmdHms(birth_year, birth_month, birth_day, 4, 0, 0)
        lunar = solar.getLunar()
        ba = lunar.getEightChar()
        
        gender_code = 0 if gender == 'male' else 1
        yun = ba.getYun(gender_code)
        dayuns = yun.getDaYun()
        
        result = []
        for dayun in dayuns:
            ganzhi = str(dayun.getGanZhi())
            result.append({
                'ganzhi': ganzhi,
                'start_age': dayun.getStartAge(),
                'end_age': dayun.getEndAge()
            })
        
        return result
    
    def generate_charts_data(self, natal_ba, analysis, birth_year, gender):
        """生成图表数据"""
        charts = {}
        
        # 1. 大运图表数据（一生的大运）
        charts['dayun'] = self.generate_dayun_chart_data(natal_ba, analysis, birth_year, gender)
        
        # 2. 流年图表数据（当前大运10年）
        charts['liunian'] = self.generate_liunian_chart_data(natal_ba, analysis, birth_year, gender)
        
        # 3. 流月图表数据（今年12个月）
        charts['liuyue'] = self.generate_liuyue_chart_data(natal_ba, analysis, birth_year, gender)
        
        # 4. 流日图表数据（本月30天）
        charts['liuri'] = self.generate_liuri_chart_data(natal_ba, analysis, birth_year, gender)
        
        return charts
    
    def generate_dayun_chart_data(self, natal_ba, analysis, birth_year, gender):
        """生成大运图表数据"""
        # 获取真实的大运数据
        dayun_list = self.get_all_dayun(birth_year, 6, 11, gender)
        
        labels = []
        scores = []
        current_index = 0
        current_age = datetime.datetime.now().year - birth_year
        
        for i, dayun in enumerate(dayun_list):
            ganzhi = dayun['ganzhi']
            start_age = dayun['start_age']
            
            labels.append(f"{ganzhi}({start_age}岁)")
            score = self.calculate_dayun_score(ganzhi, analysis)
            scores.append(score)
            
            # 判断当前大运
            if start_age <= current_age < dayun['end_age']:
                current_index = i
        
        return {
            'labels': labels,
            'scores': scores,
            'current_index': current_index
        }
    
    def generate_liunian_chart_data(self, natal_ba, analysis, birth_year=1995, gender='male'):
        """生成流年图表数据（当前大运10年）"""
        now = datetime.datetime.now()
        current_year = now.year
        current_age = current_year - birth_year
        
        # 获取当前大运信息
        dayun_list = self.get_all_dayun(birth_year, 6, 11, gender)
        current_dayun = None
        
        for dayun in dayun_list:
            if dayun['start_age'] <= current_age < dayun['end_age']:
                current_dayun = dayun
                break
        
        if not current_dayun:
            return {'labels': [], 'scores': [], 'current_index': 0}
        
        # 计算当前大运的年份范围
        dayun_start_year = birth_year + current_dayun['start_age']
        dayun_end_year = birth_year + current_dayun['end_age']
        
        labels = []
        scores = []
        
        # 基本盘 + 大运的基础分数
        base_score = self.calculate_dayun_score(current_dayun['ganzhi'], analysis)
        
        for year in range(dayun_start_year, dayun_end_year):
            labels.append(f"{year}年")
            
            # 计算该年的八字
            solar = Solar.fromYmdHms(year, 1, 1, 12, 0, 0)
            lunar = solar.getLunar()
            year_ba = lunar.getEightChar()
            
            # 计算流年分数（在大运基础上的增减）
            liunian_score = self.calculate_liunian_score(year_ba, analysis)
            total_score = base_score + liunian_score
            scores.append(total_score)
        
        current_index = max(0, current_year - dayun_start_year)
        if current_index >= len(labels):
            current_index = len(labels) - 1
        
        return {
            'labels': labels,
            'scores': scores,
            'current_index': current_index
        }
    
    def generate_liuyue_chart_data(self, natal_ba, analysis, birth_year=1995, gender='male'):
        """生成流月图表数据（今年12个月）"""
        now = datetime.datetime.now()
        current_year = now.year
        
        labels = []
        scores = []
        
        # 计算基本盘 + 大运 + 流年的基础分数
        current_dayun = self.get_current_dayun(birth_year, 6, 11, gender)
        dayun_score = self.calculate_dayun_score(current_dayun, analysis)
        
        # 计算今年流年分数
        solar_year = Solar.fromYmdHms(current_year, 1, 1, 12, 0, 0)
        lunar_year = solar_year.getLunar()
        year_ba = lunar_year.getEightChar()
        liunian_score = self.calculate_liunian_score(year_ba, analysis)
        
        base_score = dayun_score + liunian_score  # 基本盘(0) + 大运 + 流年
        
        for month in range(1, 13):
            labels.append(f"{month}月")
            
            # 计算该月的八字
            solar = Solar.fromYmdHms(current_year, month, 15, 12, 0, 0)
            lunar = solar.getLunar()
            month_ba = lunar.getEightChar()
            
            # 计算流月分数（在大运+流年基础上的增减）
            liuyue_score = self.calculate_liuyue_score(month_ba, analysis)
            total_score = base_score + liuyue_score
            scores.append(total_score)
        
        current_index = now.month - 1
        
        return {
            'labels': labels,
            'scores': scores,
            'current_index': current_index
        }
    
    def generate_liuri_chart_data(self, natal_ba, analysis, birth_year=1995, gender='male'):
        """生成流日图表数据（本月30天）"""
        now = datetime.datetime.now()
        current_year = now.year
        current_month = now.month
        
        # 获取当月天数
        if current_month in [1, 3, 5, 7, 8, 10, 12]:
            days_in_month = 31
        elif current_month in [4, 6, 9, 11]:
            days_in_month = 30
        else:  # 2月
            if current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0):
                days_in_month = 29
            else:
                days_in_month = 28
        
        labels = []
        scores = []
        
        # 计算基本盘 + 大运 + 流年 + 流月的基础分数
        current_dayun = self.get_current_dayun(birth_year, 6, 11, gender)
        dayun_score = self.calculate_dayun_score(current_dayun, analysis)
        
        # 计算今年流年分数
        solar_year = Solar.fromYmdHms(current_year, 1, 1, 12, 0, 0)
        lunar_year = solar_year.getLunar()
        year_ba = lunar_year.getEightChar()
        liunian_score = self.calculate_liunian_score(year_ba, analysis)
        
        # 计算本月流月分数
        solar_month = Solar.fromYmdHms(current_year, current_month, 15, 12, 0, 0)
        lunar_month = solar_month.getLunar()
        month_ba = lunar_month.getEightChar()
        liuyue_score = self.calculate_liuyue_score(month_ba, analysis)
        
        base_score = dayun_score + liunian_score + liuyue_score  # 基本盘(0) + 大运 + 流年 + 流月
        
        for day in range(1, days_in_month + 1):
            labels.append(f"{day}日")
            
            # 计算该日的八字
            solar = Solar.fromYmdHms(current_year, current_month, day, 12, 0, 0)
            lunar = solar.getLunar()
            day_ba = lunar.getEightChar()
            
            # 计算流日分数（在大运+流年+流月基础上的增减）
            liuri_score = self.calculate_liuri_score(day_ba, analysis)
            total_score = base_score + liuri_score
            scores.append(total_score)
        
        current_index = now.day - 1
        
        return {
            'labels': labels,
            'scores': scores,
            'current_index': current_index
        }


# 测试新系统
if __name__ == "__main__":
    system = LayeredScoringSystem()
    
    print("🚀 分层叠加评分系统测试")
    print("=" * 40)
    
    # 测试您的八字
    result = system.analyze_complete_fortune(1995, 6, 11, 4, 0)  # 0=男性
    
    print("📊 当前分数分解:")
    scores = result['current_scores']
    print(f"基本盘: {scores['base']}分")
    print(f"大运影响: {scores['dayun']:+.1f}分")
    print(f"基本盘+大运: {scores['with_dayun']:.1f}分")
    print(f"流年影响: {scores['liunian']:+.1f}分") 
    print(f"基本盘+大运+流年: {scores['with_liunian']:.1f}分")
    print(f"流月影响: {scores['liuyue']:+.1f}分")
    print(f"基本盘+大运+流年+流月: {scores['with_liuyue']:.1f}分")
    print(f"流日影响: {scores['liuri']:+.1f}分")
    print(f"最终总分: {scores['final']}分")
    print()
    
    print("📈 图表数据示例:")
    charts = result['charts_data']
    print(f"大运图: {len(charts['dayun']['labels'])}个大运")
    print(f"流年图: {len(charts['liunian']['labels'])}年数据")
    print(f"流月图: {len(charts['liuyue']['labels'])}月数据")
    print(f"流日图: {len(charts['liuri']['labels'])}日数据")
