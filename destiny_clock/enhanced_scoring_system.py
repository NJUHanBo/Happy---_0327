#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版八字计分系统
集成情境化十神评分 + 组合效应评分
"""

import sys
import os
from typing import Dict, List, Tuple, Any

# 添加bazi_lib到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
bazi_lib_path = os.path.join(current_dir, 'bazi_lib')
sys.path.insert(0, bazi_lib_path)

from lunar_python import Solar, Lunar
from professional_scoring_system import ProfessionalScoringSystem

class ContextualShishenScoring:
    """情境化十神评分系统"""
    
    def __init__(self):
        # 基础十神评分（中性）
        self.BASE_SHISHEN_SCORES = {
            '正官': 0, '七杀': 0, '正财': 0, '偏财': 0,
            '正印': 0, '偏印': 0, '食神': 0, '伤官': 0,
            '比肩': 0, '劫财': 0, '日主': 0
        }
        
        # 不同格局下的十神修正值
        self.PATTERN_MODIFIERS = {
            '正官格': {
                '正官': +4,    # 格局之神，大吉
                '正印': +3,    # 官印相生
                '正财': +2,    # 财生官
                '七杀': -3,    # 官杀混杂
                '伤官': -4,    # 伤官见官
                '劫财': -2     # 破财坏官
            },
            '七杀格': {
                '七杀': +3,    # 格局之神（需要制化）
                '食神': +4,    # 食神制杀，最佳组合
                '伤官': +3,    # 伤官制杀
                '正印': +3,    # 杀印相生
                '正官': -2,    # 官杀混杂
                '偏财': +2     # 财生杀（身强时）
            },
            '正财格': {
                '正财': +4,    # 格局之神
                '正官': +3,    # 财官相生
                '食神': +2,    # 食神生财
                '比肩': -3,    # 比劫夺财
                '劫财': -4,    # 劫财最忌
                '偏印': -2     # 枭神克食
            },
            '偏财格': {
                '偏财': +3,    # 格局之神
                '七杀': +2,    # 财杀相生
                '食神': +2,    # 食神生财
                '比肩': -2,    # 比劫夺财
                '劫财': -3,    # 劫财最忌
                '正印': -1     # 印克伤官
            },
            '正印格': {
                '正印': +4,    # 格局之神
                '正官': +3,    # 官生印
                '七杀': +2,    # 杀生印（有制时）
                '偏财': -4,    # 财坏印
                '伤官': -2,    # 伤官泄身
                '食神': -1     # 食神泄身
            },
            '偏印格': {
                '偏印': +3,    # 格局之神
                '七杀': +3,    # 杀生印
                '正官': +2,    # 官生印
                '食神': -4,    # 枭神夺食，大凶
                '偏财': -3,    # 财坏印
                '正财': -2     # 财坏印
            },
            '食神格': {
                '食神': +4,    # 格局之神
                '正财': +3,    # 食神生财
                '偏印': -4,    # 枭神夺食，大凶
                '正印': -2,    # 正印夺食
                '七杀': +2     # 食神制杀（杀不太旺时）
            },
            '伤官格': {
                '伤官': +3,    # 格局之神
                '正财': +4,    # 伤官生财，最佳
                '正印': +3,    # 伤官配印
                '正官': -4,    # 伤官见官，大凶
                '七杀': +1     # 伤官制杀
            },
            '比肩格': {
                '比肩': +2,    # 格局之神
                '食神': +3,    # 比肩生食神
                '伤官': +2,    # 比肩生伤官
                '正财': -2,    # 比劫夺财
                '偏财': -1,    # 比劫夺财
                '正官': +2     # 官制比劫
            },
            '从强格': {
                '比肩': +4,    # 从比格
                '劫财': +3,    # 从劫格
                '正印': +2,    # 印生身
                '正官': -4,    # 官克身，忌
                '七杀': -4,    # 杀克身，大忌
                '正财': -3,    # 财耗身，忌
                '偏财': -2     # 财耗身，忌
            },
            '从弱格': {
                '正官': +4,    # 从官格
                '七杀': +3,    # 从杀格  
                '正财': +4,    # 从财格
                '食神': +3,    # 从儿格
                '比肩': -4,    # 比劫破格，大忌
                '劫财': -4,    # 比劫破格，大忌
                '正印': -3     # 印星破格，忌
            }
        }
        
        # 身强身弱修正值
        self.STRENGTH_MODIFIERS = {
            'weak': {  # 身弱时的修正
                '正印': +2, '偏印': +1,     # 印星生身，喜
                '比肩': +2, '劫财': +1,     # 比劫帮身，喜  
                '正官': -2, '七杀': -3,     # 官杀克身，忌
                '正财': -2, '偏财': -1,     # 财星耗身，忌
                '食神': -1, '伤官': -2      # 食伤泄身，忌
            },
            'strong': {  # 身强时的修正
                '正官': +2, '七杀': +1,     # 官杀制身，喜
                '正财': +3, '偏财': +2,     # 财星耗身，喜
                '食神': +2, '伤官': +1,     # 食伤泄秀，喜
                '正印': -2, '偏印': -3,     # 印星生身太过，忌
                '比肩': -1, '劫财': -2      # 比劫助身太过，忌
            },
            'balanced': {  # 身平衡时的修正（较小调整）
                '正官': +1, '七杀': 0,      # 稍喜官杀
                '正财': +1, '偏财': +1,     # 稍喜财星
                '食神': +1, '伤官': 0,      # 稍喜食神
                '正印': 0, '偏印': -1,      # 印星中性
                '比肩': 0, '劫财': -1       # 比劫中性
            }
        }

    def calculate_contextual_shishen_score(self, ba, pattern_type, body_strength):
        """计算情境化十神分数"""
        total_score = 0
        detailed_scores = {}
        
        # 获取四柱十神
        pillars = self.get_all_shishens(ba)
        
        for pillar_name, shishen in pillars:
            if not shishen or shishen == '日主':  # 跳过日主和空值
                continue
                
            # 基础分数
            base_score = self.BASE_SHISHEN_SCORES.get(shishen, 0)
            
            # 格局修正
            pattern_modifier = self.PATTERN_MODIFIERS.get(pattern_type, {}).get(shishen, 0)
            
            # 身强弱修正
            strength_modifier = self.STRENGTH_MODIFIERS.get(body_strength, {}).get(shishen, 0)
            
            # 最终分数
            final_score = base_score + pattern_modifier + strength_modifier
            
            detailed_scores[pillar_name] = {
                'shishen': shishen,
                'base': base_score,
                'pattern_bonus': pattern_modifier,
                'strength_bonus': strength_modifier,
                'final': final_score
            }
            
            total_score += final_score
            
        return {
            'total': round(total_score, 1),
            'pattern': pattern_type,
            'strength': body_strength,
            'details': detailed_scores
        }

    def get_all_shishens(self, ba):
        """获取四柱所有十神"""
        pillars = []
        try:
            # 年柱
            year_gan_shishen = ba.getYearShiShenGan() if hasattr(ba, 'getYearShiShenGan') else '未知'
            year_zhi_shishen = ba.getYearShiShenZhi() if hasattr(ba, 'getYearShiShenZhi') else ['未知']
            pillars.append(('年干', year_gan_shishen))
            if isinstance(year_zhi_shishen, list) and year_zhi_shishen:
                pillars.append(('年支', year_zhi_shishen[0]))  # 取主气
            
            # 月柱
            month_gan_shishen = ba.getMonthShiShenGan() if hasattr(ba, 'getMonthShiShenGan') else '未知'
            month_zhi_shishen = ba.getMonthShiShenZhi() if hasattr(ba, 'getMonthShiShenZhi') else ['未知']
            pillars.append(('月干', month_gan_shishen))
            if isinstance(month_zhi_shishen, list) and month_zhi_shishen:
                pillars.append(('月支', month_zhi_shishen[0]))  # 取主气
            
            # 日柱（日干是自己，不算）
            day_zhi_shishen = ba.getDayShiShenZhi() if hasattr(ba, 'getDayShiShenZhi') else ['未知']
            if isinstance(day_zhi_shishen, list) and day_zhi_shishen:
                pillars.append(('日支', day_zhi_shishen[0]))  # 取主气
            
            # 时柱
            time_gan_shishen = ba.getTimeShiShenGan() if hasattr(ba, 'getTimeShiShenGan') else '未知'
            time_zhi_shishen = ba.getTimeShiShenZhi() if hasattr(ba, 'getTimeShiShenZhi') else ['未知']
            pillars.append(('时干', time_gan_shishen))
            if isinstance(time_zhi_shishen, list) and time_zhi_shishen:
                pillars.append(('时支', time_zhi_shishen[0]))  # 取主气
                
        except Exception as e:
            print(f"获取十神时出错: {str(e)}")
            # 降级到简单的十神计算
            pillars = self.get_simple_shishens(ba)
            
        return pillars

    def get_simple_shishens(self, ba):
        """简单的十神计算（备用方法）"""
        pillars = []
        
        # 天干五行对应
        gan_wuxing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        
        # 地支五行对应
        zhi_wuxing = {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
            '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
        }
        
        day_gan = ba.getDayGan()
        day_wuxing = gan_wuxing.get(day_gan, '土')
        
        # 简化的十神关系
        ganzhi_list = [
            ('年干', ba.getYearGan()),
            ('年支', ba.getYearZhi()),
            ('月干', ba.getMonthGan()),
            ('月支', ba.getMonthZhi()),
            ('日支', ba.getDayZhi()),
            ('时干', ba.getTimeGan()),
            ('时支', ba.getTimeZhi())
        ]
        
        for pillar_name, gz in ganzhi_list:
            if gz == day_gan:  # 跳过日干
                continue
                
            # 简化的十神判断
            if gz in gan_wuxing:
                gz_wuxing = gan_wuxing[gz]
            else:
                gz_wuxing = zhi_wuxing.get(gz, '土')
            
            shishen = self.simple_shishen_relation(day_wuxing, gz_wuxing, day_gan, gz)
            pillars.append((pillar_name, shishen))
        
        return pillars

    def simple_shishen_relation(self, day_wx, target_wx, day_gan, target_gan):
        """简化的十神关系判断"""
        if day_gan == target_gan:
            return '比肩'
        elif day_wx == target_wx:
            return '劫财'
        elif self.wuxing_sheng_relation(day_wx, target_wx):
            return '食神'  # 简化：日主生的为食神
        elif self.wuxing_sheng_relation(target_wx, day_wx):
            return '正印'  # 简化：生日主的为印
        elif self.wuxing_ke_relation(day_wx, target_wx):
            return '正财'  # 简化：日主克的为财
        elif self.wuxing_ke_relation(target_wx, day_wx):
            return '正官'  # 简化：克日主的为官
        else:
            return '比肩'  # 默认

    def wuxing_sheng_relation(self, wx1, wx2):
        """五行相生关系"""
        sheng_relations = {
            '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
        }
        return sheng_relations.get(wx1) == wx2

    def wuxing_ke_relation(self, wx1, wx2):
        """五行相克关系"""
        ke_relations = {
            '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
        }
        return ke_relations.get(wx1) == wx2


class CombinationEffectScoring:
    """组合效应评分系统"""
    
    def __init__(self):
        # 吉利组合加分表
        self.AUSPICIOUS_COMBINATIONS = {
            '官印相生': {
                'patterns': [
                    ['正官', '正印'],
                    ['七杀', '正印'],
                    ['七杀', '偏印']
                ],
                'bonus': 8,
                'description': '贵人扶持，学业事业双佳'
            },
            '食神制杀': {
                'patterns': [['食神', '七杀']],
                'bonus': 7,
                'description': '化敌为友，转凶为吉'
            },
            '伤官配印': {
                'patterns': [
                    ['伤官', '正印'],
                    ['伤官', '偏印']
                ],
                'bonus': 6,
                'description': '才华与修养并存'
            },
            '财官印全': {
                'patterns': [['正财', '正官', '正印']],
                'bonus': 10,
                'description': '三奇聚会，富贵双全'
            },
            '杀印相生': {
                'patterns': [['七杀', '正印']],
                'bonus': 6,
                'description': '权威与学识结合'
            },
            '食神生财': {
                'patterns': [
                    ['食神', '正财'],
                    ['食神', '偏财']
                ],
                'bonus': 5,
                'description': '才艺生财，衣食无忧'
            },
            '伤官生财': {
                'patterns': [
                    ['伤官', '正财'],
                    ['伤官', '偏财']
                ],
                'bonus': 5,
                'description': '聪明生财，富贵可期'
            },
            '印比相生': {
                'patterns': [
                    ['正印', '比肩'],
                    ['偏印', '比肩']
                ],
                'bonus': 3,
                'description': '得贵人助，兄弟和睦'
            }
        }
        
        # 凶险组合减分表
        self.INAUSPICIOUS_COMBINATIONS = {
            '官杀混杂': {
                'patterns': [['正官', '七杀']],
                'penalty': -8,
                'description': '权力争斗，进退失据'
            },
            '伤官见官': {
                'patterns': [['伤官', '正官']],
                'penalty': -10,
                'description': '口舌官灾，仕途坎坷'
            },
            '枭神夺食': {
                'patterns': [['偏印', '食神']],
                'penalty': -7,
                'description': '福禄被夺，子女有损'
            },
            '比劫夺财': {
                'patterns': [
                    ['比肩', '正财'],
                    ['劫财', '正财'],
                    ['劫财', '偏财']
                ],
                'penalty': -5,
                'description': '兄弟争财，合作破财'
            },
            '财印相战': {
                'patterns': [
                    ['正财', '正印'],
                    ['偏财', '正印']
                ],
                'penalty': -6,
                'description': '妻母不和，进退两难'
            }
        }

    def calculate_combination_effects(self, ba, shishen_analysis):
        """计算组合效应分数"""
        total_bonus = 0
        combinations_found = []
        
        # 提取所有十神
        all_shishens = self.extract_all_shishens(shishen_analysis)
        
        # 检查吉利组合
        for combo_name, combo_info in self.AUSPICIOUS_COMBINATIONS.items():
            for pattern in combo_info['patterns']:
                if self.has_combination(all_shishens, pattern):
                    total_bonus += combo_info['bonus']
                    combinations_found.append({
                        'type': 'auspicious',
                        'name': combo_name,
                        'bonus': combo_info['bonus'],
                        'description': combo_info['description'],
                        'pattern': pattern
                    })
                    break  # 找到一个匹配就够了
        
        # 检查凶险组合
        for combo_name, combo_info in self.INAUSPICIOUS_COMBINATIONS.items():
            for pattern in combo_info['patterns']:
                if self.has_combination(all_shishens, pattern):
                    total_bonus += combo_info['penalty']  # penalty是负数
                    combinations_found.append({
                        'type': 'inauspicious',
                        'name': combo_name,
                        'penalty': combo_info['penalty'],
                        'description': combo_info['description'],
                        'pattern': pattern
                    })
                    break  # 找到一个匹配就够了
        
        return {
            'total_bonus': total_bonus,
            'combinations': combinations_found,
            'combination_count': len(combinations_found),
            'all_shishens': all_shishens
        }

    def extract_all_shishens(self, shishen_analysis):
        """从分析结果中提取所有十神"""
        shishens = []
        
        # 从详细分析中提取
        if isinstance(shishen_analysis, dict) and 'details' in shishen_analysis:
            for pillar_info in shishen_analysis['details'].values():
                if isinstance(pillar_info, dict) and 'shishen' in pillar_info:
                    shishen = pillar_info['shishen']
                    if shishen and shishen != '未知' and shishen != '日主':
                        shishens.append(shishen)
        
        return shishens

    def has_combination(self, all_shishens, required_pattern):
        """检查是否包含指定的十神组合"""
        # 检查是否所有需要的十神都存在
        return all(shishen in all_shishens for shishen in required_pattern)


class PatternDetector:
    """格局自动识别器"""
    
    def __init__(self):
        pass

    def detect_bazi_pattern(self, ba):
        """自动识别八字格局"""
        try:
            # 获取月令和各柱天干地支
            month_zhi = ba.getMonthZhi()
            day_gan = ba.getDayGan()
            
            # 简化的格局判断
            # 这里可以根据月令十神来初步判断格局
            
            # 获取月支对日干的十神关系
            month_shishen = self.get_month_shishen(day_gan, month_zhi)
            
            # 根据月令十神确定基本格局
            if month_shishen in ['正官', '七杀']:
                # 进一步判断是正官格还是七杀格
                all_gans = [ba.getYearGan(), ba.getMonthGan(), ba.getTimeGan()]
                if self.has_multiple_officials(day_gan, all_gans + [month_zhi]):
                    return '七杀格'  # 有多个官杀，倾向于七杀格
                else:
                    return '正官格'
            elif month_shishen in ['正财', '偏财']:
                return '正财格' if month_shishen == '正财' else '偏财格'
            elif month_shishen in ['正印', '偏印']:
                return '正印格' if month_shishen == '正印' else '偏印格'
            elif month_shishen in ['食神', '伤官']:
                return '食神格' if month_shishen == '食神' else '伤官格'
            elif month_shishen in ['比肩', '劫财']:
                return '比肩格'
            else:
                return '普通格局'
                
        except Exception as e:
            print(f"格局识别失败: {str(e)}")
            return '普通格局'

    def get_month_shishen(self, day_gan, month_zhi):
        """获取月支对日干的十神关系"""
        # 天干五行对应
        gan_wuxing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        
        # 地支五行对应（主气）
        zhi_wuxing = {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
            '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
        }
        
        day_wx = gan_wuxing.get(day_gan, '土')
        month_wx = zhi_wuxing.get(month_zhi, '土')
        
        return self.get_shishen_relation(day_wx, month_wx, day_gan, month_zhi)

    def get_shishen_relation(self, day_wx, target_wx, day_gan, target_gz):
        """获取十神关系"""
        if day_wx == target_wx:
            return '比肩'  # 同类
        elif self.wuxing_sheng_relation(day_wx, target_wx):
            # 日主生目标
            if self.is_yang_gan(day_gan) == self.is_yang_zhi(target_gz):
                return '食神'  # 同阴阳
            else:
                return '伤官'  # 异阴阳
        elif self.wuxing_sheng_relation(target_wx, day_wx):
            # 目标生日主
            if self.is_yang_gan(day_gan) == self.is_yang_zhi(target_gz):
                return '正印'  # 同阴阳
            else:
                return '偏印'  # 异阴阳
        elif self.wuxing_ke_relation(day_wx, target_wx):
            # 日主克目标
            if self.is_yang_gan(day_gan) == self.is_yang_zhi(target_gz):
                return '正财'  # 同阴阳
            else:
                return '偏财'  # 异阴阳
        elif self.wuxing_ke_relation(target_wx, day_wx):
            # 目标克日主
            if self.is_yang_gan(day_gan) == self.is_yang_zhi(target_gz):
                return '正官'  # 同阴阳
            else:
                return '七杀'  # 异阴阳
        else:
            return '比肩'  # 默认

    def wuxing_sheng_relation(self, wx1, wx2):
        """五行相生关系"""
        sheng_relations = {
            '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
        }
        return sheng_relations.get(wx1) == wx2

    def wuxing_ke_relation(self, wx1, wx2):
        """五行相克关系"""
        ke_relations = {
            '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
        }
        return ke_relations.get(wx1) == wx2

    def is_yang_gan(self, gan):
        """判断天干是否为阳"""
        yang_gans = ['甲', '丙', '戊', '庚', '壬']
        return gan in yang_gans

    def is_yang_zhi(self, zhi):
        """判断地支是否为阳"""
        yang_zhis = ['子', '寅', '辰', '午', '申', '戌']
        return zhi in yang_zhis

    def has_multiple_officials(self, day_gan, all_ganzhi):
        """检查是否有多个官杀"""
        official_count = 0
        for gz in all_ganzhi:
            shishen = self.get_single_shishen(day_gan, gz)
            if shishen in ['正官', '七杀']:
                official_count += 1
        return official_count > 1

    def get_single_shishen(self, day_gan, target_gz):
        """获取单个干支的十神关系"""
        # 天干五行对应
        gan_wuxing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        
        # 地支五行对应
        zhi_wuxing = {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
            '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
        }
        
        day_wx = gan_wuxing.get(day_gan, '土')
        
        if target_gz in gan_wuxing:
            target_wx = gan_wuxing[target_gz]
        else:
            target_wx = zhi_wuxing.get(target_gz, '土')
        
        return self.get_shishen_relation(day_wx, target_wx, day_gan, target_gz)

    def detect_body_strength(self, ba):
        """判断身强身弱"""
        try:
            # 简化的身强弱判断
            day_gan = ba.getDayGan()
            month_zhi = ba.getMonthZhi()
            
            # 获取所有干支
            all_gans = [ba.getYearGan(), ba.getMonthGan(), ba.getTimeGan()]
            all_zhis = [ba.getYearZhi(), month_zhi, ba.getDayZhi(), ba.getTimeZhi()]
            
            # 统计帮身和耗身的力量
            help_count = 0  # 帮身（比劫印）
            drain_count = 0  # 耗身（官杀财食伤）
            
            # 检查天干
            for gan in all_gans:
                shishen = self.get_single_shishen(day_gan, gan)
                if shishen in ['比肩', '劫财', '正印', '偏印']:
                    help_count += 1
                elif shishen in ['正官', '七杀', '正财', '偏财', '食神', '伤官']:
                    drain_count += 1
            
            # 检查地支（权重减半）
            for zhi in all_zhis:
                shishen = self.get_single_shishen(day_gan, zhi)
                if shishen in ['比肩', '劫财', '正印', '偏印']:
                    help_count += 0.5
                elif shishen in ['正官', '七杀', '正财', '偏财', '食神', '伤官']:
                    drain_count += 0.5
            
            # 月令额外权重
            month_shishen = self.get_single_shishen(day_gan, month_zhi)
            if month_shishen in ['比肩', '劫财', '正印', '偏印']:
                help_count += 1  # 月令帮身额外+1
            elif month_shishen in ['正官', '七杀', '正财', '偏财', '食神', '伤官']:
                drain_count += 1  # 月令耗身额外+1
            
            # 判断强弱
            if help_count > drain_count + 1:
                return 'strong'
            elif drain_count > help_count + 1:
                return 'weak'
            else:
                return 'balanced'
                
        except Exception as e:
            print(f"身强弱判断失败: {str(e)}")
            return 'balanced'


class EnhancedScoringSystem:
    """增强版评分系统（集成所有功能）"""
    
    def __init__(self):
        self.base_system = ProfessionalScoringSystem()
        self.contextual_scorer = ContextualShishenScoring()
        self.combination_scorer = CombinationEffectScoring()
        self.pattern_detector = PatternDetector()

    def calculate_enhanced_score(self, ba, birth_date, gender='male'):
        """计算增强版综合分数"""
        try:
            print("🚀 开始增强版八字评分分析...")
            
            # 1. 自动识别格局
            pattern_type = self.pattern_detector.detect_bazi_pattern(ba)
            print(f"📋 识别格局: {pattern_type}")
            
            # 2. 判断身强身弱
            body_strength = self.pattern_detector.detect_body_strength(ba)
            print(f"💪 身强弱: {body_strength}")
            
            # 3. 原有基础评分
            base_result = self.base_system.calculate_professional_score(ba, birth_date, gender)
            base_score = base_result.get('total_score', 0)
            print(f"📊 基础评分: {base_score}分")
            
            # 4. 情境化十神评分
            contextual_result = self.contextual_scorer.calculate_contextual_shishen_score(
                ba, pattern_type, body_strength
            )
            contextual_score = contextual_result['total']
            print(f"🎯 情境化十神: {contextual_score}分")
            
            # 5. 组合效应评分
            combination_result = self.combination_scorer.calculate_combination_effects(
                ba, contextual_result
            )
            combination_score = combination_result['total_bonus']
            print(f"⚡ 组合效应: {combination_score:+.1f}分")
            
            # 6. 综合计算最终分数
            # 权重分配：基础30% + 情境化40% + 组合效应30%
            final_score = (
                base_score * 0.3 +
                contextual_score * 0.4 +
                combination_score * 0.3
            )
            
            print(f"🎉 最终综合分数: {final_score:.1f}分")
            
            return {
                'total_score': round(final_score, 1),
                'pattern': pattern_type,
                'body_strength': body_strength,
                'component_scores': {
                    'base_score': base_score,
                    'contextual_score': contextual_score,
                    'combination_score': combination_score
                },
                'base_analysis': base_result,
                'contextual_analysis': contextual_result,
                'combination_analysis': combination_result,
                'enhancement_info': f'格局:{pattern_type} | 身强弱:{body_strength} | 组合效应:{len(combination_result["combinations"])}个'
            }
            
        except Exception as e:
            print(f"增强版评分失败: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # 降级到基础评分
            base_result = self.base_system.calculate_professional_score(ba, birth_date, gender)
            return {
                'total_score': base_result.get('total_score', 0),
                'pattern': '未识别',
                'body_strength': '未知',
                'error': str(e)
            }


# 测试代码
if __name__ == "__main__":
    print("🧪 测试增强版八字评分系统")
    print("=" * 50)
    
    # 创建测试八字
    solar = Solar.fromYmdHms(1995, 6, 11, 4, 0, 0)  # 您的生日
    lunar = solar.getLunar()
    ba = lunar.getEightChar()
    
    print(f"测试八字: {ba.toString()}")
    print()
    
    # 创建增强版系统
    enhanced_system = EnhancedScoringSystem()
    
    # 计算增强版分数
    result = enhanced_system.calculate_enhanced_score(ba, '1995-06-11', 'male')
    
    if 'error' not in result:
        print("\n📈 详细分析结果:")
        print(f"格局类型: {result['pattern']}")
        print(f"身强弱: {result['body_strength']}")
        print(f"增强信息: {result['enhancement_info']}")
        
        print(f"\n💯 分数构成:")
        components = result['component_scores']
        print(f"  基础评分: {components['base_score']:.1f}分 (权重30%)")
        print(f"  情境化十神: {components['contextual_score']:.1f}分 (权重40%)")
        print(f"  组合效应: {components['combination_score']:+.1f}分 (权重30%)")
        print(f"  最终总分: {result['total_score']:.1f}分")
        
        if result['combination_analysis']['combinations']:
            print(f"\n⚡ 发现的组合:")
            for combo in result['combination_analysis']['combinations']:
                combo_type = "吉" if combo['type'] == 'auspicious' else "凶"
                score = combo.get('bonus', combo.get('penalty', 0))
                print(f"  {combo_type}: {combo['name']} ({score:+.1f}分) - {combo['description']}")
    else:
        print(f"分析失败: {result['error']}")






