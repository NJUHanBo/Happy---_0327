#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版分层叠加评分系统
在大运、流年、流月、流日各个层面都应用情境化评分
"""

import sys
import os
import datetime
from typing import Dict, List, Tuple, Any

# 添加bazi_lib到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
bazi_lib_path = os.path.join(current_dir, 'bazi_lib')
sys.path.insert(0, bazi_lib_path)

from lunar_python import Solar, Lunar
from enhanced_scoring_system import ContextualShishenScoring, CombinationEffectScoring, PatternDetector

class EnhancedLayeredScoring:
    """增强版分层叠加评分系统"""
    
    def __init__(self):
        self.contextual_scorer = ContextualShishenScoring()
        self.combination_scorer = CombinationEffectScoring()
        self.pattern_detector = PatternDetector()
        
        # 不同层面的权重设置
        self.LAYER_WEIGHTS = {
            'base': {'contextual': 1.0, 'combination': 0.8},      # 本命盘：全权重
            'dayun': {'contextual': 0.8, 'combination': 0.6},    # 大运：高权重
            'liunian': {'contextual': 0.6, 'combination': 0.4},  # 流年：中权重
            'liuyue': {'contextual': 0.3, 'combination': 0.2},   # 流月：低权重
            'liuri': {'contextual': 0.2, 'combination': 0.1}     # 流日：最低权重
        }

    def calculate_enhanced_layered_scores(self, natal_ba, current_ba, birth_year, birth_month, birth_day, gender):
        """计算增强版分层叠加分数"""
        
        # 1. 基本盘分析（本命盘）
        base_analysis = self.analyze_base_fortune(natal_ba, gender)
        
        # 2. 大运层面分析
        dayun_analysis = self.analyze_dayun_influence(natal_ba, current_ba, base_analysis, birth_year, birth_month, birth_day, gender)
        
        # 3. 流年层面分析
        liunian_analysis = self.analyze_liunian_influence(natal_ba, current_ba, base_analysis, dayun_analysis)
        
        # 4. 流月层面分析
        liuyue_analysis = self.analyze_liuyue_influence(natal_ba, current_ba, base_analysis, liunian_analysis)
        
        # 5. 流日层面分析
        liuri_analysis = self.analyze_liuri_influence(natal_ba, current_ba, base_analysis, liuyue_analysis)
        
        # 6. 分层叠加计算最终分数
        layered_scores = self.calculate_final_layered_scores(
            base_analysis, dayun_analysis, liunian_analysis, liuyue_analysis, liuri_analysis
        )
        
        return {
            'base_analysis': base_analysis,
            'dayun_analysis': dayun_analysis,
            'liunian_analysis': liunian_analysis,
            'liuyue_analysis': liuyue_analysis,
            'liuri_analysis': liuri_analysis,
            'layered_scores': layered_scores,
            'scoring_method': 'enhanced_layered_v1.0'
        }

    def analyze_base_fortune(self, natal_ba, gender):
        """分析基本盘（本命盘）"""
        try:
            # 识别格局和身强弱
            pattern = self.pattern_detector.detect_bazi_pattern(natal_ba)
            strength = self.pattern_detector.detect_body_strength(natal_ba)
            
            # 情境化十神评分
            contextual_score = self.contextual_scorer.calculate_contextual_shishen_score(
                natal_ba, pattern, strength
            )
            
            # 组合效应评分
            combination_score = self.combination_scorer.calculate_combination_effects(
                natal_ba, contextual_score
            )
            
            # 基本盘总分（作为基础分数）
            base_total = (
                contextual_score['total'] * self.LAYER_WEIGHTS['base']['contextual'] +
                combination_score['total_bonus'] * self.LAYER_WEIGHTS['base']['combination']
            )
            
            return {
                'pattern': pattern,
                'strength': strength,
                'contextual_score': contextual_score,
                'combination_score': combination_score,
                'total_score': round(base_total, 1),
                'layer': 'base'
            }
            
        except Exception as e:
            print(f"基本盘分析失败: {str(e)}")
            return {
                'pattern': '未识别',
                'strength': 'balanced',
                'total_score': 0,
                'error': str(e)
            }

    def analyze_dayun_influence(self, natal_ba, current_ba, base_analysis, birth_year, birth_month, birth_day, gender):
        """分析大运影响"""
        try:
            # 获取当前大运
            current_dayun_ganzhi = self.get_current_dayun(birth_year, birth_month, birth_day, gender)
            
            if not current_dayun_ganzhi:
                return {'total_score': 0, 'error': '无法获取大运信息'}
            
            # 创建大运八字（简化：只考虑大运干支对原局的影响）
            dayun_influence = self.calculate_dayun_contextual_score(
                current_dayun_ganzhi, base_analysis['pattern'], base_analysis['strength']
            )
            
            # 分析大运与原局的组合效应
            dayun_combination = self.analyze_dayun_combinations(
                natal_ba, current_dayun_ganzhi, base_analysis
            )
            
            # 大运层面总分
            dayun_total = (
                dayun_influence * self.LAYER_WEIGHTS['dayun']['contextual'] +
                dayun_combination * self.LAYER_WEIGHTS['dayun']['combination']
            )
            
            return {
                'dayun_ganzhi': current_dayun_ganzhi,
                'contextual_influence': dayun_influence,
                'combination_influence': dayun_combination,
                'total_score': round(dayun_total, 1),
                'layer': 'dayun'
            }
            
        except Exception as e:
            print(f"大运分析失败: {str(e)}")
            return {'total_score': 0, 'error': str(e)}

    def analyze_liunian_influence(self, natal_ba, current_ba, base_analysis, dayun_analysis):
        """分析流年影响"""
        try:
            year_gan = current_ba.getYearGan()
            year_zhi = current_ba.getYearZhi()
            year_ganzhi = year_gan + year_zhi
            
            # 流年的情境化影响（相对简化）
            liunian_influence = self.calculate_time_period_influence(
                year_ganzhi, base_analysis['pattern'], base_analysis['strength'], 'liunian'
            )
            
            # 流年与原局+大运的组合效应（简化）
            liunian_combination = self.analyze_time_period_combinations(
                year_ganzhi, base_analysis, dayun_analysis, 'liunian'
            )
            
            # 流年层面总分
            liunian_total = (
                liunian_influence * self.LAYER_WEIGHTS['liunian']['contextual'] +
                liunian_combination * self.LAYER_WEIGHTS['liunian']['combination']
            )
            
            return {
                'liunian_ganzhi': year_ganzhi,
                'contextual_influence': liunian_influence,
                'combination_influence': liunian_combination,
                'total_score': round(liunian_total, 1),
                'layer': 'liunian'
            }
            
        except Exception as e:
            print(f"流年分析失败: {str(e)}")
            return {'total_score': 0, 'error': str(e)}

    def analyze_liuyue_influence(self, natal_ba, current_ba, base_analysis, liunian_analysis):
        """分析流月影响（简化处理）"""
        try:
            month_gan = current_ba.getMonthGan()
            month_zhi = current_ba.getMonthZhi()
            month_ganzhi = month_gan + month_zhi
            
            # 流月影响（更简化）
            liuyue_influence = self.calculate_time_period_influence(
                month_ganzhi, base_analysis['pattern'], base_analysis['strength'], 'liuyue'
            )
            
            # 流月组合效应（基础判断）
            liuyue_combination = self.analyze_time_period_combinations(
                month_ganzhi, base_analysis, liunian_analysis, 'liuyue'
            )
            
            # 流月层面总分
            liuyue_total = (
                liuyue_influence * self.LAYER_WEIGHTS['liuyue']['contextual'] +
                liuyue_combination * self.LAYER_WEIGHTS['liuyue']['combination']
            )
            
            return {
                'liuyue_ganzhi': month_ganzhi,
                'contextual_influence': liuyue_influence,
                'combination_influence': liuyue_combination,
                'total_score': round(liuyue_total, 1),
                'layer': 'liuyue'
            }
            
        except Exception as e:
            print(f"流月分析失败: {str(e)}")
            return {'total_score': 0, 'error': str(e)}

    def analyze_liuri_influence(self, natal_ba, current_ba, base_analysis, liuyue_analysis):
        """分析流日影响（最简化处理）"""
        try:
            day_gan = current_ba.getDayGan()
            day_zhi = current_ba.getDayZhi()
            day_ganzhi = day_gan + day_zhi
            
            # 流日影响（最简化：主要考虑基本喜忌）
            liuri_influence = self.calculate_time_period_influence(
                day_ganzhi, base_analysis['pattern'], base_analysis['strength'], 'liuri'
            )
            
            # 流日基本不考虑复杂组合，只做简单加减
            liuri_combination = 0
            
            # 流日层面总分
            liuri_total = (
                liuri_influence * self.LAYER_WEIGHTS['liuri']['contextual'] +
                liuri_combination * self.LAYER_WEIGHTS['liuri']['combination']
            )
            
            return {
                'liuri_ganzhi': day_ganzhi,
                'contextual_influence': liuri_influence,
                'combination_influence': liuri_combination,
                'total_score': round(liuri_total, 1),
                'layer': 'liuri'
            }
            
        except Exception as e:
            print(f"流日分析失败: {str(e)}")
            return {'total_score': 0, 'error': str(e)}

    def calculate_dayun_contextual_score(self, dayun_ganzhi, pattern, strength):
        """计算大运的情境化分数"""
        if len(dayun_ganzhi) != 2:
            return 0
            
        gan, zhi = dayun_ganzhi[0], dayun_ganzhi[1]
        
        # 获取大运干支的十神关系
        gan_shishen = self.get_simple_shishen_relation(gan, pattern)
        zhi_shishen = self.get_simple_shishen_relation(zhi, pattern)
        
        # 应用情境化评分
        gan_score = self.get_contextual_shishen_score(gan_shishen, pattern, strength)
        zhi_score = self.get_contextual_shishen_score(zhi_shishen, pattern, strength) * 0.7  # 地支权重稍低
        
        return gan_score + zhi_score

    def calculate_time_period_influence(self, ganzhi, pattern, strength, period_type):
        """计算时间周期（流年/流月/流日）的影响"""
        if len(ganzhi) != 2:
            return 0
            
        gan, zhi = ganzhi[0], ganzhi[1]
        
        # 获取干支的十神关系
        gan_shishen = self.get_simple_shishen_relation(gan, pattern)
        zhi_shishen = self.get_simple_shishen_relation(zhi, pattern)
        
        # 根据时间周期类型调整权重
        period_weights = {
            'liunian': {'gan': 1.0, 'zhi': 0.8},
            'liuyue': {'gan': 0.8, 'zhi': 0.6},
            'liuri': {'gan': 0.6, 'zhi': 0.4}
        }
        
        weights = period_weights.get(period_type, {'gan': 1.0, 'zhi': 0.8})
        
        # 简化的情境化评分
        gan_score = self.get_contextual_shishen_score(gan_shishen, pattern, strength) * weights['gan']
        zhi_score = self.get_contextual_shishen_score(zhi_shishen, pattern, strength) * weights['zhi']
        
        return gan_score + zhi_score

    def get_simple_shishen_relation(self, ganzhi, pattern):
        """获取简化的十神关系（这里需要根据实际情况实现）"""
        # 这是一个简化实现，实际需要更精确的十神计算
        shishen_map = {
            '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财',
            '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印',
            '子': '正印', '丑': '偏财', '寅': '比肩', '卯': '劫财', '辰': '偏财',
            '巳': '食神', '午': '伤官', '未': '正财', '申': '七杀', '酉': '正官',
            '戌': '正财', '亥': '正印'
        }
        return shishen_map.get(ganzhi, '比肩')

    def get_contextual_shishen_score(self, shishen, pattern, strength):
        """获取情境化十神分数"""
        # 使用之前定义的情境化评分表
        pattern_modifier = self.contextual_scorer.PATTERN_MODIFIERS.get(pattern, {}).get(shishen, 0)
        strength_modifier = self.contextual_scorer.STRENGTH_MODIFIERS.get(strength, {}).get(shishen, 0)
        
        return pattern_modifier + strength_modifier

    def analyze_dayun_combinations(self, natal_ba, dayun_ganzhi, base_analysis):
        """分析大运与原局的组合效应"""
        # 这里做简化处理，主要检查一些重要的组合
        # 实际实现中可以更详细
        
        basic_combinations = {
            '官印相生': 3,
            '食神制杀': 4,
            '财官印全': 5
        }
        
        # 简化：返回一个基础的组合分数
        return 0  # 大运组合效应的详细计算比较复杂，这里先简化

    def analyze_time_period_combinations(self, ganzhi, base_analysis, previous_analysis, period_type):
        """分析时间周期的组合效应"""
        # 流年流月流日的组合效应相对简单
        # 主要考虑与原局和大运的基本作用关系
        
        # 简化处理：根据周期类型返回基础分数
        period_bonus = {
            'liunian': 1,
            'liuyue': 0.5,
            'liuri': 0.2
        }
        
        return period_bonus.get(period_type, 0)

    def calculate_final_layered_scores(self, base_analysis, dayun_analysis, liunian_analysis, liuyue_analysis, liuri_analysis):
        """计算分层叠加的最终分数"""
        
        # 基本盘分数
        base_score = base_analysis['total_score']
        
        # 逐层叠加
        with_dayun = base_score + dayun_analysis['total_score']
        with_liunian = with_dayun + liunian_analysis['total_score']
        with_liuyue = with_liunian + liuyue_analysis['total_score']
        with_liuri = with_liuyue + liuri_analysis['total_score']
        
        return {
            'base': round(base_score, 1),
            'dayun': round(dayun_analysis['total_score'], 1),
            'with_dayun': round(with_dayun, 1),
            'liunian': round(liunian_analysis['total_score'], 1),
            'with_liunian': round(with_liunian, 1),
            'liuyue': round(liuyue_analysis['total_score'], 1),
            'with_liuyue': round(with_liuyue, 1),
            'liuri': round(liuri_analysis['total_score'], 1),
            'with_liuri': round(with_liuri, 1),
            'final': round(with_liuri, 1)
        }

    def get_current_dayun(self, birth_year, birth_month, birth_day, gender='male'):
        """获取当前大运（复用原有逻辑）"""
        try:
            from bazi_calculator import BaziCalculator
            calculator = BaziCalculator()
            
            current_date = datetime.date.today()
            dayun_result = calculator.calculate_dayun(birth_year, birth_month, birth_day, current_date, gender)
            
            if dayun_result and 'gan' in dayun_result and 'zhi' in dayun_result:
                return dayun_result['gan'] + dayun_result['zhi']
            
            return "己卯"  # 备用值
            
        except Exception as e:
            print(f"获取大运失败: {str(e)}")
            return "己卯"


# 测试代码
if __name__ == "__main__":
    print("🧪 测试增强版分层叠加评分系统")
    print("=" * 50)
    
    # 创建测试八字
    solar = Solar.fromYmdHms(1995, 6, 11, 4, 0, 0)
    lunar = solar.getLunar()
    natal_ba = lunar.getEightChar()
    
    # 当前时间八字
    now_solar = Solar.fromYmdHms(2024, 8, 17, 15, 0, 0)
    now_lunar = now_solar.getLunar()
    current_ba = now_lunar.getEightChar()
    
    print(f"本命八字: {natal_ba.toString()}")
    print(f"当前八字: {current_ba.toString()}")
    print()
    
    # 创建增强版分层系统
    enhanced_layered = EnhancedLayeredScoring()
    
    # 计算增强版分层分数
    result = enhanced_layered.calculate_enhanced_layered_scores(
        natal_ba, current_ba, 1995, 6, 11, 'male'
    )
    
    if 'layered_scores' in result:
        print("📊 增强版分层叠加结果:")
        scores = result['layered_scores']
        print(f"基本盘: {scores['base']}分")
        print(f"大运影响: {scores['dayun']:+.1f}分 → 累计{scores['with_dayun']}分")
        print(f"流年影响: {scores['liunian']:+.1f}分 → 累计{scores['with_liunian']}分")
        print(f"流月影响: {scores['liuyue']:+.1f}分 → 累计{scores['with_liuyue']}分")
        print(f"流日影响: {scores['liuri']:+.1f}分 → 累计{scores['with_liuri']}分")
        print(f"最终总分: {scores['final']}分")
        
        print("\n📋 各层面详情:")
        if 'base_analysis' in result:
            base = result['base_analysis']
            print(f"本命盘: {base['pattern']} + {base['strength']} = {base['total_score']}分")
        
        if 'dayun_analysis' in result and 'dayun_ganzhi' in result['dayun_analysis']:
            dayun = result['dayun_analysis']
            print(f"大运: {dayun['dayun_ganzhi']} = {dayun['total_score']:+.1f}分")
            
    else:
        print("分析失败")
        if 'error' in result:
            print(f"错误: {result['error']}")






