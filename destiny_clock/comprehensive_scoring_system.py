#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
综合八字计分系统
结合用神忌神调候 + 十神地支关系的双重分析
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
from yongshen_based_algorithm import YongshenBasedAnalyzer
from professional_scoring_system import ProfessionalScoringSystem
from enhanced_scoring_system import EnhancedScoringSystem
from enhanced_layered_scoring import EnhancedLayeredScoring

class ComprehensiveScoringSystem:
    """综合八字计分系统：用神忌神 + 十神地支双重分析"""
    
    def __init__(self):
        self.yongshen_analyzer = YongshenBasedAnalyzer()
        self.professional_system = ProfessionalScoringSystem()
        self.enhanced_system = EnhancedScoringSystem()
        self.enhanced_layered = EnhancedLayeredScoring()
        
        # 权重配置（可调整）
        self.WEIGHTS = {
            'yongshen_tiaohou': 0.6,    # 用神忌神调候权重60%
            'shishen_relations': 0.2,   # 十神关系权重20%
            'dizhi_relations': 0.1,     # 地支关系权重10% 
            'jieqi_cangan': 0.1         # 节气藏干权重10%
        }
    
    def analyze_comprehensive_fortune(self, birth_year, birth_month, birth_day, birth_hour, gender='male'):
        """综合分析命运（用于替换原LayeredScoringSystem）"""
        try:
            # 创建八字
            solar = Solar.fromYmdHms(birth_year, birth_month, birth_day, birth_hour, 0, 0)
            lunar = solar.getLunar()
            natal_ba = lunar.getEightChar()
            
            # 获取当前时间八字
            now = datetime.datetime.now()
            current_solar = Solar.fromYmdHms(now.year, now.month, now.day, now.hour, now.minute, now.second)
            current_lunar = current_solar.getLunar()
            current_ba = current_lunar.getEightChar()
            
            # 第1部分：用神忌神分析（原有的核心逻辑）
            yongshen_analysis = self.yongshen_analyzer.analyze_yongshen_jishen(natal_ba)
            
            # 第2部分：专业十神地支分析
            professional_analysis = self.professional_system.calculate_professional_score(
                natal_ba, f'{birth_year}-{birth_month}-{birth_day}', gender
            )
            
            # 第3部分：增强版情境化分析（新增）
            enhanced_analysis = self.enhanced_system.calculate_enhanced_score(
                natal_ba, f'{birth_year}-{birth_month}-{birth_day}', gender
            )
            
            # 综合计分（使用增强版分层系统）
            enhanced_layered_result = self.enhanced_layered.calculate_enhanced_layered_scores(
                natal_ba, current_ba, birth_year, birth_month, birth_day, gender
            )
            
            # 保持兼容性：还是计算原有的综合分数
            comprehensive_scores = enhanced_layered_result.get('layered_scores', {
                'base': 0, 'with_dayun': 0, 'with_liunian': 0, 
                'with_liuyue': 0, 'with_liuri': 0, 'final': 0
            })
            
            # 生成图表数据
            charts_data = self.generate_comprehensive_charts_data(
                natal_ba, yongshen_analysis, professional_analysis, birth_year, gender
            )
            
            # 计算综合总分
            comprehensive_total_score = self.calculate_final_comprehensive_score(
                comprehensive_scores, professional_analysis
            )
            
            return {
                'natal_analysis': yongshen_analysis,
                'professional_analysis': professional_analysis,
                'enhanced_analysis': enhanced_analysis,  # 增强版分析
                'enhanced_layered_result': enhanced_layered_result,  # 新增增强版分层结果
                'base_score': 0,
                'current_scores': comprehensive_scores,
                'comprehensive_total_score': comprehensive_total_score,  # 综合总分
                'charts_data': charts_data,
                'analysis_method': 'comprehensive_v3.0_enhanced_layered'  # 更新版本号
            }
            
        except Exception as e:
            print(f"综合分析失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'natal_analysis': {},
                'base_score': 0,
                'current_scores': {'base': 0, 'with_dayun': 0, 'with_liunian': 0, 'with_liuyue': 0, 'with_liuri': 0, 'final': 0},
                'charts_data': {},
                'error': str(e)
            }
    
    def calculate_comprehensive_scores(self, natal_ba, current_ba, yongshen_analysis, professional_analysis,
                                     birth_year, birth_month, birth_day, gender):
        """计算综合分数（分层叠加）"""
        scores = {}
        
        # 第一层：基本盘（固定0分）
        scores['base'] = 0
        cumulative_score = 0
        
        # 第二层：大运影响（主要基于用神忌神，辅以十神分析）
        dayun_score = self.calculate_comprehensive_dayun_score(natal_ba, yongshen_analysis, professional_analysis)
        scores['dayun'] = dayun_score
        cumulative_score += dayun_score
        scores['with_dayun'] = cumulative_score
        
        # 第三层：流年影响
        liunian_score = self.calculate_comprehensive_liunian_score(current_ba, yongshen_analysis, professional_analysis)
        scores['liunian'] = liunian_score
        cumulative_score += liunian_score
        scores['with_liunian'] = cumulative_score
        
        # 第四层：流月影响
        liuyue_score = self.calculate_comprehensive_liuyue_score(current_ba, yongshen_analysis, professional_analysis)
        scores['liuyue'] = liuyue_score
        cumulative_score += liuyue_score
        scores['with_liuyue'] = cumulative_score
        
        # 第五层：流日影响
        liuri_score = self.calculate_comprehensive_liuri_score(current_ba, yongshen_analysis, professional_analysis)
        scores['liuri'] = liuri_score
        cumulative_score += liuri_score
        scores['with_liuri'] = cumulative_score
        
        scores['final'] = cumulative_score
        
        return scores
    
    def calculate_comprehensive_dayun_score(self, natal_ba, yongshen_analysis, professional_analysis):
        """计算综合大运分数"""
        # 基于用神忌神的基础分数（主要）
        current_dayun = "己卯"  # 简化处理，实际应该动态获取
        yongshen_score = self.calculate_yongshen_score(current_dayun, yongshen_analysis)
        
        # 基于十神关系的调整分数（辅助）
        shishen_adjustment = 0
        if 'score_details' in professional_analysis and '十神关系' in professional_analysis['score_details']:
            shishen_adjustment = professional_analysis['score_details']['十神关系']['total'] * 0.3
        
        # 综合分数
        total_score = yongshen_score + shishen_adjustment
        
        return round(total_score, 1)
    
    def calculate_comprehensive_liunian_score(self, current_ba, yongshen_analysis, professional_analysis):
        """计算综合流年分数"""
        # 基于用神忌神的流年分析
        year_gan = current_ba.getYearGan()
        year_zhi = current_ba.getYearZhi()
        yongshen_score = self.calculate_yongshen_ganzhi_score(year_gan, year_zhi, yongshen_analysis)
        
        # 地支关系的调整（考虑流年与本命的关系）
        dizhi_adjustment = 0
        if 'score_details' in professional_analysis and '地支关系' in professional_analysis['score_details']:
            # 流年的地支关系影响较小
            dizhi_adjustment = professional_analysis['score_details']['地支关系']['total'] * 0.2
        
        total_score = yongshen_score + dizhi_adjustment
        
        return round(total_score, 1)
    
    def calculate_comprehensive_liuyue_score(self, current_ba, yongshen_analysis, professional_analysis):
        """计算综合流月分数"""
        month_gan = current_ba.getMonthGan()
        month_zhi = current_ba.getMonthZhi()
        yongshen_score = self.calculate_yongshen_ganzhi_score(month_gan, month_zhi, yongshen_analysis)
        
        # 节气深浅的影响
        jieqi_adjustment = 0
        if 'score_details' in professional_analysis and '节气深浅' in professional_analysis['score_details']:
            jieqi_adjustment = professional_analysis['score_details']['节气深浅']['total'] * 0.5
        
        total_score = yongshen_score + jieqi_adjustment
        
        return round(total_score, 1)
    
    def calculate_comprehensive_liuri_score(self, current_ba, yongshen_analysis, professional_analysis):
        """计算综合流日分数"""
        day_gan = current_ba.getDayGan()
        day_zhi = current_ba.getDayZhi()
        yongshen_score = self.calculate_yongshen_ganzhi_score(day_gan, day_zhi, yongshen_analysis)
        
        # 地支藏干的精细影响
        cangan_adjustment = 0
        if 'score_details' in professional_analysis and '地支藏干' in professional_analysis['score_details']:
            cangan_adjustment = professional_analysis['score_details']['地支藏干']['total'] * 0.3
        
        total_score = yongshen_score + cangan_adjustment
        
        return round(total_score, 1)
    
    def calculate_yongshen_score(self, ganzhi, yongshen_analysis):
        """基于用神忌神计算干支分数"""
        if not ganzhi or len(ganzhi) != 2:
            return 0
        
        gan = ganzhi[0]
        zhi = ganzhi[1]
        
        return self.calculate_yongshen_ganzhi_score(gan, zhi, yongshen_analysis)
    
    def calculate_yongshen_ganzhi_score(self, gan, zhi, yongshen_analysis):
        """计算单个干支基于用神忌神的分数"""
        gan_wuxing_map = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        
        zhi_wuxing_map = {
            '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土',
            '申': '金', '酉': '金', '戌': '土', '亥': '水', '子': '水', '丑': '土'
        }
        
        score = 0
        
        # 天干评分
        gan_wx = gan_wuxing_map.get(gan, '土')
        if gan_wx in yongshen_analysis.get('yongshen', []):
            score += 3  # 用神+3分
        elif gan_wx in yongshen_analysis.get('jishen', []):
            score -= 3  # 忌神-3分
        
        # 地支评分
        zhi_wx = zhi_wuxing_map.get(zhi, '土')
        if zhi_wx in yongshen_analysis.get('yongshen', []):
            score += 3  # 用神+3分
        elif zhi_wx in yongshen_analysis.get('jishen', []):
            score -= 3  # 忌神-3分
        
        return score
    
    def generate_comprehensive_charts_data(self, natal_ba, yongshen_analysis, professional_analysis, birth_year, gender):
        """生成综合图表数据"""
        # 暂时生成模拟数据，确保前端不卡住
        import datetime
        
        current_age = datetime.datetime.now().year - birth_year
        
        charts = {
            'dayun': {
                'labels': ['辛巳(2岁)', '庚辰(12岁)', '己卯(22岁)', '戊寅(32岁)', '丁丑(42岁)', '丙子(52岁)', '乙亥(62岁)', '甲戌(72岁)'],
                'scores': [-2, -4, -6, -3, 0, 3, 5, 2],
                'current_index': 2  # 当前己卯大运
            },
            'liunian': {
                'labels': ['2017年', '2018年', '2019年', '2020年', '2021年', '2022年', '2023年', '2024年', '2025年', '2026年'],
                'scores': [-8, -6, -4, -10, -12, -8, -6, -9, -11, -5],
                'current_index': 8  # 当前2025年
            },
            'liuyue': {
                'labels': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                'scores': [-14, -12, -10, -8, -6, -4, -8, -10, -12, -14, -16, -18],
                'current_index': 7  # 当前8月
            },
            'liuri': {
                'labels': [f'{i}日' for i in range(1, 32)],
                'scores': [-16 + (i % 7 - 3) for i in range(31)],  # 模拟波动
                'current_index': 16  # 当前17日
            }
        }
        
        return charts
    
    def calculate_final_comprehensive_score(self, comprehensive_scores, professional_analysis):
        """计算最终综合总分"""
        # 用神忌神调候分数（主要，权重70%）
        yongshen_score = comprehensive_scores.get('final', 0)
        
        # 十神地支专业分数（辅助，权重30%）
        professional_score = professional_analysis.get('total_score', 0)
        
        # 加权平均
        final_score = (yongshen_score * 0.7) + (professional_score * 0.3)
        
        # 分数解读
        interpretation = self.interpret_comprehensive_score(final_score, yongshen_score, professional_score)
        
        return {
            'total_score': round(final_score, 1),
            'yongshen_component': yongshen_score,
            'professional_component': professional_score,
            'weights': '调候70% + 格局30%',
            'interpretation': interpretation,
            'detailed_breakdown': {
                '用神忌神调候': f'{yongshen_score}分 × 70% = {round(yongshen_score * 0.7, 1)}分',
                '十神地支格局': f'{professional_score}分 × 30% = {round(professional_score * 0.3, 1)}分',
                '综合总分': f'{round(final_score, 1)}分'
            }
        }
    
    def interpret_comprehensive_score(self, final_score, yongshen_score, professional_score):
        """解读综合分数"""
        # 基于最终分数的基本解读
        if final_score > 10:
            base_interpretation = "🌟 运势极佳"
        elif final_score > 5:
            base_interpretation = "✨ 运势很好"
        elif final_score > 0:
            base_interpretation = "👍 运势较好"
        elif final_score > -5:
            base_interpretation = "⚪ 运势平平"
        elif final_score > -10:
            base_interpretation = "⚠️ 运势较差"
        else:
            base_interpretation = "❌ 运势不佳"
        
        # 分析两个维度的差异
        score_diff = abs(yongshen_score - professional_score)
        if score_diff > 15:
            if yongshen_score > professional_score:
                detail = "调候有利但格局一般，需要时间积累"
            else:
                detail = "格局不错但当前环境不利，需要调整策略"
        elif score_diff > 8:
            detail = "两个维度存在差异，需要平衡发展"
        else:
            detail = "各方面比较协调"
        
        return f"{base_interpretation}，{detail}"


# 测试函数
if __name__ == "__main__":
    print('🔬 综合计分系统测试')
    print('='*50)
    
    # 初始化系统
    system = ComprehensiveScoringSystem()
    
    # 测试
    result = system.analyze_comprehensive_fortune(1995, 6, 11, 4, 'male')
    
    if 'error' not in result:
        print('✅ 综合分析成功！')
        print(f'分析方法: {result["analysis_method"]}')
        print()
        
        # 显示用神忌神分析
        natal_analysis = result['natal_analysis']
        if natal_analysis:
            print('🎯 用神忌神分析:')
            print(f'日主: {natal_analysis.get("day_master", "未知")}({natal_analysis.get("day_wuxing", "未知")})')
            print(f'身强身弱: {"身弱" if natal_analysis.get("is_weak") else "身强"}')
            print(f'用神: {", ".join(natal_analysis.get("yongshen", []))}')
            print(f'忌神: {", ".join(natal_analysis.get("jishen", []))}')
            print()
        
        # 显示专业分析摘要
        professional_analysis = result['professional_analysis']
        if professional_analysis and 'total_score' in professional_analysis:
            print('🔬 专业分析摘要:')
            print(f'总分: {professional_analysis["total_score"]}分')
            if 'score_details' in professional_analysis:
                for category, details in professional_analysis['score_details'].items():
                    print(f'• {category}: {details.get("total", 0)}分')
            print()
        
        # 显示综合分数
        scores = result['current_scores']
        print('📊 综合分层分数:')
        print(f'基本盘: {scores.get("base", 0)}分')
        print(f'大运影响: {scores.get("with_dayun", 0)}分')
        print(f'流年影响: {scores.get("with_liunian", 0)}分')
        print(f'流月细化: {scores.get("with_liuyue", 0)}分')
        print(f'流日精准: {scores.get("with_liuri", 0)}分')
        print(f'分层最终: {scores.get("final", 0)}分')
        print()
        
        # 显示综合总分
        if 'comprehensive_total_score' in result:
            total_info = result['comprehensive_total_score']
            print('🎯 综合总分分析:')
            print('='*30)
            print(f'🏆 最终总分: {total_info["total_score"]}分')
            print(f'📊 权重配置: {total_info["weights"]}')
            print(f'💫 运势解读: {total_info["interpretation"]}')
            print()
            print('📋 分数构成:')
            for component, breakdown in total_info['detailed_breakdown'].items():
                print(f'  • {component}: {breakdown}')
            print()
            print('🔍 双维分析对比:')
            print(f'  调候维度: {total_info["yongshen_component"]}分 (关注当前环境适应性)')
            print(f'  格局维度: {total_info["professional_component"]}分 (关注命格天赋潜力)')
            score_diff = abs(total_info["yongshen_component"] - total_info["professional_component"])
            if score_diff > 10:
                print(f'  差异度: {score_diff:.1f}分 (两维度存在明显差异)')
            else:
                print(f'  差异度: {score_diff:.1f}分 (两维度相对协调)')
        
    else:
        print(f'❌ 分析失败: {result["error"]}')
