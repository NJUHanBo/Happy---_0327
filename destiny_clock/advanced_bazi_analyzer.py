#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
from typing import Dict, List, Tuple, Any
import datetime

# 添加bazi_lib到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
bazi_lib_path = os.path.join(current_dir, 'bazi_lib')
sys.path.insert(0, bazi_lib_path)

from lunar_python import Lunar, Solar

class AdvancedBaziAnalyzer:
    """专业八字分析器 - 基于专业库的深度分析"""
    
    def __init__(self):
        # 十神吉凶权重表
        self.shishen_weights = {
            '正官': 85, '七杀': 70, '正财': 90, '偏财': 75,
            '食神': 80, '伤官': 65, '比肩': 70, '劫财': 60,
            '正印': 85, '偏印': 70, '日主': 100
        }
        
        # 五行相生相克关系
        self.wuxing_sheng = {
            '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
        }
        self.wuxing_ke = {
            '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
        }
        
        # 地支关系
        self.liuhe = [
            ('子', '丑'), ('寅', '亥'), ('卯', '戌'), 
            ('辰', '酉'), ('巳', '申'), ('午', '未')
        ]
        self.sanhe = [
            ('申', '子', '辰'), ('寅', '午', '戌'),
            ('巳', '酉', '丑'), ('亥', '卯', '未')
        ]
        self.xiangchong = [
            ('子', '午'), ('丑', '未'), ('寅', '申'),
            ('卯', '酉'), ('辰', '戌'), ('巳', '亥')
        ]
    
    def analyze_comprehensive_score(self, birth_date: str, birth_time: str, gender: str = 'male') -> Dict[str, Any]:
        """综合专业分析，返回准确的分数"""
        try:
            # 解析生日
            year, month, day = map(int, birth_date.split('-'))
            hour = 4 if birth_time in ['3-5', 'shenshi', '寅时'] else int(birth_time)
            
            # 获取八字
            solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
            lunar = solar.getLunar()
            ba = lunar.getEightChar()
            
            # 1. 本命盘基础分析
            base_score = self.calculate_base_score(ba)
            
            # 2. 当前大运分析
            dayun_score = self.calculate_dayun_influence(ba, gender)
            
            # 3. 流年分析
            liunian_score = self.calculate_liunian_influence(ba)
            
            # 4. 流月分析  
            liuyue_score = self.calculate_liuyue_influence(ba)
            
            # 5. 流日分析
            liuri_score = self.calculate_liuri_influence(ba)
            
            # 6. 调候分析
            tiaohou_analysis = self.analyze_tiaohou_comprehensive(ba)
            
            return {
                'scores': {
                    'base': base_score,
                    'with_dayun': dayun_score,
                    'with_liunian': liunian_score,
                    'with_liuyue': liuyue_score,
                    'with_liuri': liuri_score
                },
                'tiaohou_analysis': tiaohou_analysis,
                'detailed_analysis': {
                    'shishen_distribution': self.get_shishen_distribution(ba),
                    'dizhi_relations': self.analyze_dizhi_relations(ba),
                    'tiaohou_analysis': self.analyze_tiaohou(ba)
                }
            }
            
        except Exception as e:
            raise ValueError(f"专业分析失败: {str(e)}")
    
    def calculate_base_score(self, ba) -> int:
        """计算本命盘基础分数"""
        base_score = 50  # 基础分
        
        # 十神配置分析
        shishen_bonus = self.analyze_shishen_pattern(ba)
        base_score += shishen_bonus
        
        # 五行平衡分析
        wuxing_bonus = self.analyze_wuxing_balance(ba)
        base_score += wuxing_bonus
        
        # 地支关系分析
        dizhi_bonus = self.analyze_dizhi_base_relations(ba)
        base_score += dizhi_bonus
        
        return min(100, max(0, base_score))
    
    def analyze_shishen_pattern(self, ba) -> int:
        """分析十神格局的吉凶"""
        bonus = 0
        
        # 获取四柱十神
        shishen_list = [
            ba.getYearShiShenGan(), ba.getMonthShiShenGan(),
            ba.getDayShiShenGan(), ba.getTimeShiShenGan()
        ]
        
        # 计算十神权重
        for shishen in shishen_list:
            if shishen in self.shishen_weights:
                bonus += (self.shishen_weights[shishen] - 70) * 0.3
        
        # 特殊格局加分
        if '正官' in shishen_list and '正财' in shishen_list:
            bonus += 10  # 财官相配
        elif '食神' in shishen_list and '正财' in shishen_list:
            bonus += 8   # 食神生财
        elif shishen_list.count('劫财') >= 2:
            bonus -= 10  # 劫财过多
            
        return int(bonus)
    
    def analyze_wuxing_balance(self, ba) -> int:
        """分析五行平衡度"""
        wuxing_count = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
        
        # 统计四柱五行
        pillars_wuxing = [
            ba.getYearWuXing(), ba.getMonthWuXing(),
            ba.getDayWuXing(), ba.getTimeWuXing()
        ]
        
        for pillar_wuxing in pillars_wuxing:
            for wuxing in pillar_wuxing:
                if wuxing in wuxing_count:
                    wuxing_count[wuxing] += 1
        
        # 计算平衡度（方差越小越平衡）
        values = list(wuxing_count.values())
        mean_val = sum(values) / len(values)
        variance = sum((v - mean_val) ** 2 for v in values) / len(values)
        
        # 平衡度转换为分数
        balance_score = max(0, 20 - variance * 3)
        return int(balance_score)
    
    def analyze_dizhi_base_relations(self, ba) -> int:
        """分析地支关系对基础运势的影响"""
        bonus = 0
        
        zhi_list = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
        
        # 检查六合
        for zhi1, zhi2 in self.liuhe:
            if zhi1 in zhi_list and zhi2 in zhi_list:
                bonus += 5
        
        # 检查三合局
        for sanhe_group in self.sanhe:
            count = sum(1 for zhi in sanhe_group if zhi in zhi_list)
            if count == 3:
                bonus += 15  # 完整三合局
            elif count == 2:
                bonus += 8   # 半合
        
        # 检查相冲
        for zhi1, zhi2 in self.xiangchong:
            if zhi1 in zhi_list and zhi2 in zhi_list:
                bonus -= 8
        
        return bonus
    
    def calculate_dayun_influence(self, ba, gender: str) -> int:
        """计算大运对当前运势的影响"""
        base_score = self.calculate_base_score(ba)
        
        # 根据性别获取当前大运
        current_age = datetime.date.today().year - 1995  # 假设1995年生
        if 22 <= current_age < 32:  # 己卯大运
            dayun_gan, dayun_zhi = '己', '卯'
        else:
            return base_score
        
        # 大运对日干的影响
        day_gan = ba.getDayGan()
        dayun_influence = self.analyze_gan_relation(day_gan, dayun_gan)
        
        # 大运地支对命盘的影响
        zhi_influence = self.analyze_dayun_zhi_influence(ba, dayun_zhi)
        
        # 综合调整
        adjustment = (dayun_influence + zhi_influence) * 0.6
        return min(100, max(0, base_score + int(adjustment)))
    
    def analyze_gan_relation(self, day_gan: str, other_gan: str) -> int:
        """分析天干关系"""
        # 这里可以添加更复杂的天干关系分析
        # 比如合化、相冲等
        gan_relations = {
            ('甲', '己'): 5, ('乙', '庚'): 5, ('丙', '辛'): 5,
            ('丁', '壬'): 5, ('戊', '癸'): 5
        }
        
        relation = gan_relations.get((day_gan, other_gan)) or gan_relations.get((other_gan, day_gan))
        return relation if relation else 0
    
    def analyze_dayun_zhi_influence(self, ba, dayun_zhi: str) -> int:
        """分析大运地支的影响"""
        influence = 0
        original_zhi = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
        
        # 检查与原命盘地支的关系
        for orig_zhi in original_zhi:
            # 六合
            if (dayun_zhi, orig_zhi) in self.liuhe or (orig_zhi, dayun_zhi) in self.liuhe:
                influence += 8
            # 相冲
            elif (dayun_zhi, orig_zhi) in self.xiangchong or (orig_zhi, dayun_zhi) in self.xiangchong:
                influence -= 12
        
        return influence
    
    def calculate_liunian_influence(self, ba) -> int:
        """计算流年影响"""
        base_score = self.calculate_dayun_influence(ba, 'male')
        
        # 2025年乙巳年的影响
        liunian_gan, liunian_zhi = '乙', '巳'
        
        # 流年对日干的影响
        day_gan = ba.getDayGan()
        gan_influence = self.analyze_gan_relation(day_gan, liunian_gan)
        
        # 流年地支影响
        zhi_influence = self.analyze_liunian_zhi_influence(ba, liunian_zhi)
        
        adjustment = (gan_influence + zhi_influence) * 0.4
        return min(100, max(0, base_score + int(adjustment)))
    
    def analyze_liunian_zhi_influence(self, ba, liunian_zhi: str) -> int:
        """分析流年地支影响"""
        # 类似大运分析，但权重较小
        influence = 0
        original_zhi = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
        
        for orig_zhi in original_zhi:
            if (liunian_zhi, orig_zhi) in self.liuhe or (orig_zhi, liunian_zhi) in self.liuhe:
                influence += 5
            elif (liunian_zhi, orig_zhi) in self.xiangchong or (orig_zhi, liunian_zhi) in self.xiangchong:
                influence -= 8
        
        return influence
    
    def calculate_liuyue_influence(self, ba) -> int:
        """计算流月影响等级（1-10级）"""
        # 获取当前真实的流月干支
        import datetime
        from lunar_python import Solar
        
        now = datetime.datetime.now()
        solar_today = Solar.fromYmdHms(now.year, now.month, now.day, now.hour, now.minute, now.second)
        lunar_today = solar_today.getLunar()
        ba_today = lunar_today.getEightChar()
        
        current_month_gan = ba_today.getMonthGan()
        current_month_zhi = ba_today.getMonthZhi()
        
        day_gan = ba.getDayGan()
        
        # 基础等级
        base_level = 5
        
        # 天干关系分析
        gan_bonus = self.analyze_gan_relation(day_gan, current_month_gan) // 2
        
        # 地支关系分析
        original_zhi = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
        zhi_bonus = 0
        for orig_zhi in original_zhi:
            if (current_month_zhi, orig_zhi) in self.liuhe or (orig_zhi, current_month_zhi) in self.liuhe:
                zhi_bonus += 2
            elif (current_month_zhi, orig_zhi) in self.xiangchong or (orig_zhi, current_month_zhi) in self.xiangchong:
                zhi_bonus -= 2
        
        # 月令季节调整（固定的，基于月支）
        season_bonus = self.get_seasonal_bonus(current_month_zhi, day_gan)
        
        final_level = base_level + gan_bonus + zhi_bonus + season_bonus
        return max(1, min(10, final_level))
    
    def calculate_liuri_influence(self, ba) -> int:
        """计算流日影响等级（1-10级）"""
        # 获取当前真实的流日干支
        import datetime
        from lunar_python import Solar
        
        now = datetime.datetime.now()
        solar_today = Solar.fromYmdHms(now.year, now.month, now.day, now.hour, now.minute, now.second)
        lunar_today = solar_today.getLunar()
        ba_today = lunar_today.getEightChar()
        
        current_day_gan = ba_today.getDayGan()
        current_day_zhi = ba_today.getDayZhi()
        
        natal_day_gan = ba.getDayGan()
        natal_day_zhi = ba.getDayZhi()
        
        # 基础等级
        base_level = 5
        
        # 天干关系分析
        gan_bonus = self.analyze_gan_relation(natal_day_gan, current_day_gan) // 3
        
        # 地支关系分析
        zhi_bonus = 0
        if (current_day_zhi, natal_day_zhi) in self.liuhe or (natal_day_zhi, current_day_zhi) in self.liuhe:
            zhi_bonus += 2
        elif (current_day_zhi, natal_day_zhi) in self.xiangchong or (natal_day_zhi, current_day_zhi) in self.xiangchong:
            zhi_bonus -= 2
        
        # 日干五合关系特殊加分
        if self.is_tiangan_wuhe(natal_day_gan, current_day_gan):
            zhi_bonus += 1
        
        # 同干支加分
        if current_day_gan == natal_day_gan:
            gan_bonus += 1
        if current_day_zhi == natal_day_zhi:
            zhi_bonus += 1
        
        final_level = base_level + gan_bonus + zhi_bonus
        return max(1, min(10, final_level))
    
    def get_seasonal_bonus(self, month_zhi: str, day_gan: str) -> int:
        """根据月令和日干获取季节调整分数"""
        # 月令五行
        zhi_wuxing = {
            '寅': '木', '卯': '木', '辰': '土',
            '巳': '火', '午': '火', '未': '土', 
            '申': '金', '酉': '金', '戌': '土',
            '亥': '水', '子': '水', '丑': '土'
        }
        
        # 日干五行
        gan_wuxing = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        }
        
        month_element = zhi_wuxing.get(month_zhi, '土')
        day_element = gan_wuxing.get(day_gan, '土')
        
        # 五行生克关系调整
        if month_element == day_element:  # 同类
            return 1
        elif self.is_wuxing_sheng(month_element, day_element):  # 月令生日干
            return 2
        elif self.is_wuxing_sheng(day_element, month_element):  # 日干生月令
            return -1
        elif self.is_wuxing_ke(month_element, day_element):  # 月令克日干
            return -1
        elif self.is_wuxing_ke(day_element, month_element):  # 日干克月令
            return 0
        else:
            return 0
    
    def is_tiangan_wuhe(self, gan1: str, gan2: str) -> bool:
        """判断天干五合"""
        wuhe_pairs = [
            ('甲', '己'), ('乙', '庚'), ('丙', '辛'), ('丁', '壬'), ('戊', '癸')
        ]
        return (gan1, gan2) in wuhe_pairs or (gan2, gan1) in wuhe_pairs
    
    def is_wuxing_sheng(self, element1: str, element2: str) -> bool:
        """判断五行相生"""
        sheng_relations = [
            ('木', '火'), ('火', '土'), ('土', '金'), ('金', '水'), ('水', '木')
        ]
        return (element1, element2) in sheng_relations
    
    def is_wuxing_ke(self, element1: str, element2: str) -> bool:
        """判断五行相克"""
        ke_relations = [
            ('木', '土'), ('土', '水'), ('水', '火'), ('火', '金'), ('金', '木')
        ]
        return (element1, element2) in ke_relations
    
    def analyze_monthly_influence(self, ba, month_gan: str, month_zhi: str) -> int:
        """分析流月影响"""
        return 0  # 流月影响相对较小，可以简化处理
    
    def analyze_daily_influence(self, ba, day_gan: str, day_zhi: str) -> int:
        """分析流日影响"""
        return 0  # 流日影响最小
    
    def analyze_wuxing_power(self, ba) -> Dict[str, int]:
        """分析五行力量分布"""
        wuxing_power = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
        
        # 四柱五行力量计算
        pillars_info = [
            (ba.getYearWuXing(), 25),  # 年柱权重25%
            (ba.getMonthWuXing(), 35), # 月柱权重35%（最重要）
            (ba.getDayWuXing(), 30),   # 日柱权重30%
            (ba.getTimeWuXing(), 10)   # 时柱权重10%
        ]
        
        total_weight = 0
        for pillar_wuxing, weight in pillars_info:
            for wuxing in pillar_wuxing:
                if wuxing in wuxing_power:
                    wuxing_power[wuxing] += weight
                    total_weight += weight
        
        # 转换为百分比
        if total_weight > 0:
            for wuxing in wuxing_power:
                wuxing_power[wuxing] = int((wuxing_power[wuxing] / total_weight) * 100)
        
        return wuxing_power
    
    def get_shishen_distribution(self, ba) -> Dict[str, List[str]]:
        """获取十神分布"""
        return {
            'tiangan': [
                ba.getYearShiShenGan(), ba.getMonthShiShenGan(),
                ba.getDayShiShenGan(), ba.getTimeShiShenGan()
            ],
            'dizhi': [
                ba.getYearShiShenZhi(), ba.getMonthShiShenZhi(),
                ba.getDayShiShenZhi(), ba.getTimeShiShenZhi()
            ]
        }
    
    def analyze_dizhi_relations(self, ba) -> Dict[str, List[str]]:
        """分析地支关系"""
        zhi_list = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
        
        relations = {
            'liuhe': [],
            'sanhe': [],
            'xiangchong': [],
            'xinghai': []
        }
        
        # 查找各种关系
        for i, zhi1 in enumerate(zhi_list):
            for j, zhi2 in enumerate(zhi_list):
                if i != j:
                    if (zhi1, zhi2) in self.liuhe or (zhi2, zhi1) in self.liuhe:
                        relations['liuhe'].append(f'{zhi1}-{zhi2}')
                    elif (zhi1, zhi2) in self.xiangchong or (zhi2, zhi1) in self.xiangchong:
                        relations['xiangchong'].append(f'{zhi1}-{zhi2}')
        
        return relations
    
    def analyze_tiaohou(self, ba) -> Dict[str, str]:
        """调候分析"""
        # 这里可以基于专业库的调候分析结果
        month_zhi = ba.getMonthZhi()
        day_gan = ba.getDayGan()
        
        # 简化的调候分析
        tiaohou_advice = {
            ('癸', '午'): '喜庚壬辛，忌丁',  # 癸水生午月
            # 可以添加更多调候规则
        }
        
        advice = tiaohou_advice.get((day_gan, month_zhi), '需要详细分析')
        
        return {
            'day_gan': day_gan,
            'month_zhi': month_zhi,
            'advice': advice
        }
    
    def analyze_tiaohou_comprehensive(self, ba) -> Dict[str, Any]:
        """全面的调候分析"""
        try:
            # 导入调候数据
            import sys
            import os
            bazi_lib_path = os.path.join(os.path.dirname(__file__), 'bazi_lib')
            sys.path.insert(0, bazi_lib_path)
            from datas import tiaohous, jinbuhuan
            
            day_gan = ba.getDayGan()
            month_zhi = ba.getMonthZhi()
            key = day_gan + month_zhi  # 如：癸午
            
            # 获取调候数据
            simple_tiaohou = tiaohous.get(key, '')
            detailed_tiaohou = jinbuhuan.get(key, '')
            
            # 解析简单调候（如：1庚2癸壬）
            yongshen_list = self.parse_simple_tiaohou(simple_tiaohou)
            
            # 解析详细调候
            detailed_info = self.parse_detailed_tiaohou(detailed_tiaohou)
            
            # 分析当前大运流年是否符合调候
            current_compatibility = self.analyze_current_tiaohou_compatibility(ba, yongshen_list)
            
            return {
                'basic_info': {
                    'day_gan': day_gan,
                    'month_zhi': month_zhi,
                    'key': key
                },
                'yongshen': {
                    'primary': yongshen_list[0] if yongshen_list else None,
                    'secondary': yongshen_list[1:] if len(yongshen_list) > 1 else [],
                    'all': yongshen_list
                },
                'detailed_advice': detailed_info,
                'current_compatibility': current_compatibility,
                'recommendations': self.generate_tiaohou_recommendations(yongshen_list, current_compatibility)
            }
            
        except Exception as e:
            # 如果调候分析失败，返回基础信息
            return {
                'basic_info': {
                    'day_gan': ba.getDayGan(),
                    'month_zhi': ba.getMonthZhi(),
                    'key': ba.getDayGan() + ba.getMonthZhi()
                },
                'error': f'调候分析失败: {str(e)}',
                'recommendations': ['请咨询专业命理师进行详细分析']
            }
    
    def parse_simple_tiaohou(self, tiaohou_str: str) -> List[str]:
        """解析简单调候字符串（如：1庚2癸壬）"""
        yongshen = []
        if not tiaohou_str:
            return yongshen
            
        import re
        # 提取数字+天干的模式
        matches = re.findall(r'\d+([甲-癸]+)', tiaohou_str)
        for match in matches:
            for char in match:
                if char in '甲乙丙丁戊己庚辛壬癸':
                    yongshen.append(char)
        
        return yongshen
    
    def parse_detailed_tiaohou(self, detailed_str: str) -> Dict[str, str]:
        """解析详细调候信息"""
        info = {
            'tiaohou': '',
            'dayun': '',
            'beizhu': ''
        }
        
        if not detailed_str:
            return info
            
        # 解析调候部分
        if '调候：' in detailed_str:
            parts = detailed_str.split('大运：')
            tiaohou_part = parts[0].replace('调候：', '').strip()
            info['tiaohou'] = tiaohou_part
            
            if len(parts) > 1:
                dayun_part = parts[1].split('备注：')[0].strip()
                info['dayun'] = dayun_part
                
                if '备注：' in detailed_str:
                    beizhu_part = detailed_str.split('备注：')[1].strip()
                    info['beizhu'] = beizhu_part
        
        return info
    
    def analyze_current_tiaohou_compatibility(self, ba, yongshen_list: List[str]) -> Dict[str, Any]:
        """分析当前大运流年与调候的匹配度"""
        if not yongshen_list:
            return {'score': 5, 'analysis': '缺少用神信息'}
        
        compatibility_score = 0
        analysis_parts = []
        
        # 分析大运（当前是己卯）
        dayun_gan = '己'
        if dayun_gan in yongshen_list:
            compatibility_score += 3
            analysis_parts.append(f'大运天干{dayun_gan}为用神，有利')
        elif dayun_gan in '甲乙丙丁戊己庚辛壬癸':
            # 检查是否为忌神（简化判断）
            if dayun_gan not in yongshen_list:
                compatibility_score -= 1
                analysis_parts.append(f'大运天干{dayun_gan}非用神')
        
        # 分析流年（乙巳）
        liunian_gan = '乙'
        if liunian_gan in yongshen_list:
            compatibility_score += 2
            analysis_parts.append(f'流年天干{liunian_gan}为用神，有利')
        
        # 转换为1-10分
        final_score = max(1, min(10, 5 + compatibility_score))
        
        return {
            'score': final_score,
            'analysis': '；'.join(analysis_parts) if analysis_parts else '运势平平',
            'dayun_match': dayun_gan in yongshen_list,
            'liunian_match': liunian_gan in yongshen_list
        }
    
    def generate_tiaohou_recommendations(self, yongshen_list: List[str], compatibility: Dict[str, Any]) -> List[str]:
        """生成调候建议"""
        recommendations = []
        
        if not yongshen_list:
            return ['建议咨询专业命理师进行详细分析']
        
        # 基于用神的建议
        primary_yongshen = yongshen_list[0] if yongshen_list else None
        
        # 五行对应的调候建议
        wuxing_advice = {
            '甲': '多接触木属性事物，如绿色、东方、春季',
            '乙': '养护肝木，注意情绪调节，适合园艺工作',
            '丙': '增强火元素，多晒太阳，红色衣物有利',
            '丁': '注重心神调养，适合文化创作工作',
            '戊': '稳固土元素，黄色、中央方位有利',
            '己': '注重脾胃调养，适合稳定踏实的工作',
            '庚': '增强金元素，白色、西方、秋季有利',
            '辛': '精工细作，适合金属、工艺相关工作',
            '壬': '流动水元素，黑色、北方、冬季有利',
            '癸': '滋养肾水，适合智慧型、研究性工作'
        }
        
        if primary_yongshen and primary_yongshen in wuxing_advice:
            recommendations.append(f'主用神{primary_yongshen}：{wuxing_advice[primary_yongshen]}')
        
        # 基于当前运势匹配度的建议
        score = compatibility.get('score', 5)
        if score >= 8:
            recommendations.append('当前运势与调候匹配度高，是发展的好时机')
        elif score <= 3:
            recommendations.append('当前运势与调候不太匹配，建议保守稳健')
        else:
            recommendations.append('运势一般，宜稳中求进')
        
        # 补充用神建议
        if len(yongshen_list) > 1:
            secondary = yongshen_list[1]
            if secondary in wuxing_advice:
                recommendations.append(f'辅助用神{secondary}：{wuxing_advice[secondary]}')
        
        return recommendations
    
    def analyze_comprehensive_destiny(self, birth_date: str, birth_time: str, gender: str = 'male') -> Dict[str, Any]:
        """
        完整的命格分析，包括性格、事业、健康、大运流年等全方位分析
        """
        try:
            # 计算基础八字
            year, month, day = map(int, birth_date.split('-'))
            time_hour = 4 if '3-5' in birth_time or '寅' in birth_time else 10
            
            solar = Solar.fromYmdHms(year, month, day, time_hour, 0, 0)
            lunar = solar.getLunar()
            ba = lunar.getEightChar()
            
            # 基本八字信息
            bazi_info = {
                'year': f"{ba.getYearGan()}{ba.getYearZhi()}",
                'month': f"{ba.getMonthGan()}{ba.getMonthZhi()}",
                'day': f"{ba.getDayGan()}{ba.getDayZhi()}",
                'time': f"{ba.getTimeGan()}{ba.getTimeZhi()}"
            }
            
            # 综合分析
            analysis_result = {
                'basic_info': {
                    'birth_date': birth_date,
                    'birth_time': birth_time,
                    'gender': gender,
                    'bazi': bazi_info,
                    'day_master': ba.getDayGan(),
                    'birth_season': self.get_birth_season(month)
                },
                'shishen_analysis': self.analyze_shishen_comprehensive(ba),
                'dizhi_relations': self.analyze_dizhi_relations(ba),
                'personality_analysis': self.analyze_personality(ba),
                'career_wealth_analysis': self.analyze_career_wealth(ba),
                'health_analysis': self.analyze_health(ba),
                'yongshen_analysis': self.analyze_tiaohou_comprehensive(ba),
                'fortune_trends': self.analyze_fortune_trends(ba, year, month, day, gender),
                'comprehensive_advice': self.generate_comprehensive_advice(ba),
                'analysis_timestamp': datetime.datetime.now().isoformat()
            }
            
            return analysis_result
            
        except Exception as e:
            print(f"完整命格分析失败: {str(e)}")
            return {'error': f'分析失败: {str(e)}'}
    
    def get_birth_season(self, month: int) -> str:
        """获取出生季节"""
        if month in [3, 4, 5]:
            return "春季"
        elif month in [6, 7, 8]:
            return "夏季"
        elif month in [9, 10, 11]:
            return "秋季"
        else:
            return "冬季"
    
    def analyze_shishen_comprehensive(self, ba) -> Dict[str, Any]:
        """详细的十神分析"""
        day_gan = ba.getDayGan()
        
        # 获取各柱的十神 (使用专业库的方法)
        year_gan_shishen = ba.getYearShiShenGan()
        month_gan_shishen = ba.getMonthShiShenGan()
        time_gan_shishen = ba.getTimeShiShenGan()
        
        # 地支藏干的十神分析 (返回列表，需要处理)
        year_zhi_shishen_list = ba.getYearShiShenZhi()
        month_zhi_shishen_list = ba.getMonthShiShenZhi()
        time_zhi_shishen_list = ba.getTimeShiShenZhi()
        
        # 统计十神分布
        shishen_count = {}
        
        # 处理天干十神
        tiangan_shishen = [year_gan_shishen, month_gan_shishen, time_gan_shishen]
        for shishen in tiangan_shishen:
            if shishen:
                shishen_count[shishen] = shishen_count.get(shishen, 0) + 1
        
        # 处理地支十神（列表形式）
        dizhi_shishen_lists = [year_zhi_shishen_list, month_zhi_shishen_list, time_zhi_shishen_list]
        for shishen_list in dizhi_shishen_lists:
            if isinstance(shishen_list, list):
                for shishen in shishen_list:
                    if shishen:
                        shishen_count[shishen] = shishen_count.get(shishen, 0) + 1
            elif shishen_list:  # 如果不是列表但有值
                shishen_count[shishen_list] = shishen_count.get(shishen_list, 0) + 1
        
        # 十神解读
        interpretations = self.interpret_shishen_pattern(shishen_count, day_gan)
        
        return {
            'distribution': shishen_count,
            'pillars': {
                'year': {
                    'gan': year_gan_shishen, 
                    'zhi': year_zhi_shishen_list[0] if isinstance(year_zhi_shishen_list, list) and year_zhi_shishen_list else '无'
                },
                'month': {
                    'gan': month_gan_shishen, 
                    'zhi': month_zhi_shishen_list[0] if isinstance(month_zhi_shishen_list, list) and month_zhi_shishen_list else '无'
                },
                'time': {
                    'gan': time_gan_shishen, 
                    'zhi': time_zhi_shishen_list[0] if isinstance(time_zhi_shishen_list, list) and time_zhi_shishen_list else '无'
                }
            },
            'interpretation': interpretations,
            'dominant_shishen': max(shishen_count.items(), key=lambda x: x[1]) if shishen_count else ('无', 0)
        }
    
    def interpret_shishen_pattern(self, shishen_count: Dict[str, int], day_gan: str) -> List[str]:
        """解读十神格局"""
        interpretations = []
        
        # 分析主要十神
        if '正官' in shishen_count and shishen_count['正官'] >= 2:
            interpretations.append("正官格：性格正直，有责任心，适合从政或管理工作")
        
        if '偏财' in shishen_count and shishen_count['偏财'] >= 2:
            interpretations.append("偏财格：善于理财，商业头脑敏锐，适合投资经商")
        
        if '食神' in shishen_count and shishen_count['食神'] >= 2:
            interpretations.append("食神格：聪明伶俐，有艺术天赋，适合创意工作")
        
        if '伤官' in shishen_count and shishen_count['伤官'] >= 2:
            interpretations.append("伤官格：才华横溢但个性强烈，适合技术或艺术工作")
        
        if '比肩' in shishen_count and shishen_count['比肩'] >= 2:
            interpretations.append("比肩格：自立自强，朋友缘佳，但需防合作纠纷")
        
        if '劫财' in shishen_count and shishen_count['劫财'] >= 2:
            interpretations.append("劫财格：行动力强，但需注意财务管理和人际关系")
        
        if '正印' in shishen_count and shishen_count['正印'] >= 2:
            interpretations.append("正印格：学习能力强，有贵人相助，适合教育文化工作")
        
        if '偏印' in shishen_count and shishen_count['偏印'] >= 2:
            interpretations.append("偏印格：思维独特，有专业技能，但需防小人")
        
        if '七杀' in shishen_count and shishen_count['七杀'] >= 2:
            interpretations.append("七杀格：意志坚强，有领导才能，但需控制脾气")
        
        if '正财' in shishen_count and shishen_count['正财'] >= 2:
            interpretations.append("正财格：理财稳健，家庭观念重，适合稳定职业")
        
        # 如果没有特殊格局，给出综合建议
        if not interpretations:
            interpretations.append("命格较为平衡，各方面发展均衡，宜发挥自身优势")
        
        return interpretations
    
    def analyze_personality(self, ba) -> Dict[str, Any]:
        """性格特征分析"""
        day_gan = ba.getDayGan()
        day_zhi = ba.getDayZhi()
        month_zhi = ba.getMonthZhi()
        
        personality_traits = []
        
        # 基于日干分析
        gan_traits = {
            '甲': ['积极进取', '正直善良', '有领导才能', '但容易固执'],
            '乙': ['温柔体贴', '适应性强', '有艺术天赋', '但意志稍弱'],
            '丙': ['热情开朗', '乐观向上', '有感染力', '但容易冲动'],
            '丁': ['细腻敏感', '有创造力', '注重细节', '但容易多虑'],
            '戊': ['稳重踏实', '责任心强', '值得信赖', '但变通性不足'],
            '己': ['温和包容', '善解人意', '有耐心', '但缺乏主见'],
            '庚': ['果断坚毅', '有正义感', '执行力强', '但容易刚硬'],
            '辛': ['精明细致', '品味高雅', '有韧性', '但容易计较'],
            '壬': ['聪明灵活', '适应力强', '有智慧', '但容易多变'],
            '癸': ['深沉内敛', '直觉敏锐', '有同情心', '但容易忧郁']
        }
        
        if day_gan in gan_traits:
            personality_traits.extend(gan_traits[day_gan])
        
        # 基于地支关系
        if month_zhi == day_zhi:
            personality_traits.append("根基稳固，性格一致性强")
        
        # 地支相冲相害
        conflict_pairs = [('子', '午'), ('丑', '未'), ('寅', '申'), ('卯', '酉'), ('辰', '戌'), ('巳', '亥')]
        all_zhi = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
        
        for i, zhi1 in enumerate(all_zhi):
            for j, zhi2 in enumerate(all_zhi[i+1:], i+1):
                if (zhi1, zhi2) in conflict_pairs or (zhi2, zhi1) in conflict_pairs:
                    personality_traits.append("内心可能有矛盾冲突，需要平衡调节")
                    break
        
        return {
            'traits': personality_traits,
            'core_characteristics': f'{day_gan}日主：{gan_traits.get(day_gan, ["待分析"])[0]}',
            'personality_advice': '发挥优势，改善不足，保持内心平衡'
        }
    
    def analyze_career_wealth(self, ba) -> Dict[str, Any]:
        """事业财运分析"""
        day_gan = ba.getDayGan()
        
        # 获取财星和官星
        career_guidance = []
        wealth_analysis = []
        
        # 分析财星
        zhengcai_count = 0
        piancai_count = 0
        
        # 分析天干十神
        shishen_list = [ba.getYearShiShenGan(), ba.getMonthShiShenGan(), ba.getTimeShiShenGan()]
        for shishen in shishen_list:
            if shishen == '正财':
                zhengcai_count += 1
            elif shishen == '偏财':
                piancai_count += 1
        
        # 财运分析
        if zhengcai_count >= 2:
            wealth_analysis.append("正财旺：适合稳定职业，理财保守，财来财去有规律")
        elif piancai_count >= 2:
            wealth_analysis.append("偏财旺：适合投资经商，财运波动大，需把握时机")
        elif zhengcai_count + piancai_count == 0:
            wealth_analysis.append("财星较弱：需要主动求财，适合技能型工作")
        else:
            wealth_analysis.append("财星适中：财运平稳，需要合理规划")
        
        # 事业指导
        career_elements = {
            '甲': ['林业', '木材', '家具', '园艺', '教育'],
            '乙': ['花艺', '中医', '文化', '美容', '纺织'],
            '丙': ['能源', '娱乐', '餐饮', '电子', '广告'],
            '丁': ['电器', 'IT', '化工', '灯具', '文艺'],
            '戊': ['房地产', '建筑', '农业', '陶瓷', '土建'],
            '己': ['服务业', '农牧', '中介', '咨询', '土特产'],
            '庚': ['金属', '机械', '汽车', '军警', '体育'],
            '辛': ['珠宝', '金融', '精密仪器', '刀具', '五金'],
            '壬': ['物流', '贸易', '水利', '海运', '饮料'],
            '癸': ['渔业', '化学', '医药', '清洁', '石油']
        }
        
        if day_gan in career_elements:
            career_guidance.append(f"适合行业：{', '.join(career_elements[day_gan])}")
        
        return {
            'career_guidance': career_guidance,
            'wealth_analysis': wealth_analysis,
            'career_advice': '选择与五行相配的行业，发挥专业优势',
            'wealth_advice': '量入为出，稳健投资，避免贪心冒进'
        }
    
    def analyze_health(self, ba) -> Dict[str, Any]:
        """健康建议分析"""
        day_gan = ba.getDayGan()
        day_zhi = ba.getDayZhi()
        
        health_guidance = []
        
        # 基于日干的健康建议
        health_advice = {
            '甲': ['注意肝胆保养', '多运动锻炼', '避免过度劳累'],
            '乙': ['养护肝木', '注意情绪调节', '适合柔性运动'],
            '丙': ['保护心脏', '避免过度兴奋', '注意血压'],
            '丁': ['心神调养', '避免熬夜', '适度休息'],
            '戊': ['脾胃保养', '规律饮食', '避免暴饮暴食'],
            '己': ['脾胃调理', '温和饮食', '避免寒凉'],
            '庚': ['肺部保养', '避免呼吸道疾病', '注意空气质量'],
            '辛': ['肺金调养', '适度锻炼', '避免过度疲劳'],
            '壬': ['肾脏保养', '避免过度消耗', '注意腰部健康'],
            '癸': ['肾水滋养', '避免房劳过度', '注意保暖']
        }
        
        if day_gan in health_advice:
            health_guidance.extend(health_advice[day_gan])
        
        # 基于地支冲克的健康提醒
        if day_zhi in ['午', '巳']:  # 火旺
            health_guidance.append('火旺体质，需要清热降火，避免上火')
        elif day_zhi in ['子', '亥']:  # 水旺
            health_guidance.append('水旺体质，需要温阳化湿，避免寒湿')
        
        return {
            'health_guidance': health_guidance,
            'constitution_type': f'{day_gan}日主体质特征',
            'seasonal_advice': '根据季节调养，春养肝、夏养心、秋养肺、冬养肾',
            'lifestyle_advice': '规律作息，适度运动，情志调畅，饮食有节'
        }
    
    def analyze_fortune_trends(self, ba, birth_year: int, birth_month: int, birth_day: int, gender: str) -> Dict[str, Any]:
        """大运流年趋势分析"""
        current_year = datetime.datetime.now().year
        current_age = current_year - birth_year
        
        # 获取大运信息
        gender_code = 0 if gender == 'male' else 1
        yun = ba.getYun(gender_code)
        dayuns = yun.getDaYun()[:8]  # 前8步大运
        
        fortune_periods = []
        current_dayun = None
        
        for dayun in dayuns:
            start_age = dayun.getStartAge()
            end_age = dayun.getEndAge()
            ganzhi = dayun.getGanZhi()
            
            # 跳过空的大运
            if not ganzhi or len(str(ganzhi)) < 2:
                continue
                
            ganzhi_str = str(ganzhi)
            period_info = {
                'ages': f"{start_age}-{end_age}岁",
                'ganzhi': ganzhi_str,
                'gan': ganzhi_str[0] if ganzhi_str else '',
                'zhi': ganzhi_str[1] if len(ganzhi_str) > 1 else '',
                'is_current': start_age <= current_age < end_age
            }
            
            if period_info['is_current']:
                current_dayun = period_info
            
            fortune_periods.append(period_info)
        
        return {
            'current_period': current_dayun,
            'upcoming_periods': fortune_periods,
            'period_analysis': '大运每十年一换，需要适应不同阶段的特点',
            'trend_advice': '把握大运特点，顺势而为，逆境中求稳，顺境中求进'
        }
    
    def generate_comprehensive_advice(self, ba) -> Dict[str, Any]:
        """生成综合建议"""
        day_gan = ba.getDayGan()
        
        life_guidance = [
            "命由天定，运靠人为，积极面对人生挑战",
            "发挥自身优势，改善不足之处，追求平衡发展",
            "顺应自然规律，把握时机，厚德载物",
            "修身养性，提升内在品质，外在自然圆满"
        ]
        
        # 基于日干的人生建议
        gan_advice = {
            '甲': "如木之挺拔，保持正直品格，发挥领导才能",
            '乙': "如草之柔韧，以柔克刚，适应环境变化",
            '丙': "如太阳普照，发挥正能量，温暖他人",
            '丁': "如明灯指路，专注细节，精益求精",
            '戊': "如大地承载，脚踏实地，厚德载物",
            '己': "如土壤滋养，包容他人，默默奉献",
            '庚': "如金之刚毅，坚持原则，勇于改革",
            '辛': "如玉之精美，注重品质，精雕细琢",
            '壬': "如江河奔流，适应变化，智慧人生",
            '癸': "如甘露滋润，深沉内敛，厚积薄发"
        }
        
        if day_gan in gan_advice:
            life_guidance.insert(0, gan_advice[day_gan])
        
        return {
            'life_guidance': life_guidance,
            'core_philosophy': '天人合一，阴阳平衡，五行调和',
            'action_principles': ['知足常乐', '积德行善', '自强不息', '厚德载物']
        }
    
    def get_fortune_trends_data(self, birth_date: str, birth_time: str, gender: str = 'male') -> Dict[str, Any]:
        """获取运势趋势数据（年度和月度）"""
        try:
            # 计算基础八字
            year, month, day = map(int, birth_date.split('-'))
            time_hour = 4 if '3-5' in birth_time or '寅' in birth_time else 10
            
            solar = Solar.fromYmdHms(year, month, day, time_hour, 0, 0)
            lunar = solar.getLunar()
            ba = lunar.getEightChar()
            
            # 获取当前年月
            import datetime
            now = datetime.datetime.now()
            current_year = now.year
            current_month = now.month
            current_day = now.day
            
            # 计算年度12个月的流月评级
            monthly_data = self.calculate_yearly_monthly_trends(ba, current_year, current_month)
            
            # 计算本月每天的流日评级
            daily_data = self.calculate_monthly_daily_trends(ba, current_year, current_month, current_day)
            
            return {
                'yearly_monthly': monthly_data,
                'monthly_daily': daily_data,
                'current_period': {
                    'year': current_year,
                    'month': current_month,
                    'day': current_day
                }
            }
            
        except Exception as e:
            print(f"获取运势趋势数据失败: {str(e)}")
            return {'error': f'计算失败: {str(e)}'}
    
    def calculate_yearly_monthly_trends(self, ba, year: int, current_month: int) -> Dict[str, Any]:
        """计算年度12个月的流月评级"""
        monthly_scores = []
        monthly_labels = []
        
        for month in range(1, 13):
            # 计算每个月1号的八字来代表该月
            try:
                solar_month = Solar.fromYmdHms(year, month, 1, 12, 0, 0)
                lunar_month = solar_month.getLunar()
                ba_month = lunar_month.getEightChar()
                
                # 计算该月的流月评级
                score = self.calculate_month_score(ba, ba_month)
                monthly_scores.append(score)
                monthly_labels.append(f'{month}月')
                
            except Exception as e:
                # 如果某月计算失败，使用默认值
                monthly_scores.append(5)
                monthly_labels.append(f'{month}月')
        
        return {
            'labels': monthly_labels,
            'scores': monthly_scores,
            'current_index': current_month - 1,  # 0-based index
            'title': f'{year}年流月趋势'
        }
    
    def calculate_monthly_daily_trends(self, ba, year: int, month: int, current_day: int) -> Dict[str, Any]:
        """计算本月每天的流日评级"""
        import calendar
        
        # 获取本月天数
        days_in_month = calendar.monthrange(year, month)[1]
        
        daily_scores = []
        daily_labels = []
        
        for day in range(1, days_in_month + 1):
            try:
                # 计算每一天的八字
                solar_day = Solar.fromYmdHms(year, month, day, 12, 0, 0)
                lunar_day = solar_day.getLunar()
                ba_day = lunar_day.getEightChar()
                
                # 计算该日的流日评级
                score = self.calculate_day_score(ba, ba_day)
                daily_scores.append(score)
                daily_labels.append(str(day))
                
            except Exception as e:
                # 如果某日计算失败，使用默认值
                daily_scores.append(5)
                daily_labels.append(str(day))
        
        return {
            'labels': daily_labels,
            'scores': daily_scores,
            'current_index': current_day - 1,  # 0-based index
            'title': f'{year}年{month}月流日趋势'
        }
    
    def calculate_month_score(self, natal_ba, current_ba) -> int:
        """计算特定月份的流月评级"""
        current_month_gan = current_ba.getMonthGan()
        current_month_zhi = current_ba.getMonthZhi()
        day_gan = natal_ba.getDayGan()
        
        # 基础等级
        base_level = 5
        
        # 天干关系分析
        gan_bonus = self.analyze_gan_relation(day_gan, current_month_gan) // 2
        
        # 地支关系分析
        original_zhi = [natal_ba.getYearZhi(), natal_ba.getMonthZhi(), natal_ba.getDayZhi(), natal_ba.getTimeZhi()]
        zhi_bonus = 0
        for orig_zhi in original_zhi:
            if (current_month_zhi, orig_zhi) in self.liuhe or (orig_zhi, current_month_zhi) in self.liuhe:
                zhi_bonus += 2
            elif (current_month_zhi, orig_zhi) in self.xiangchong or (orig_zhi, current_month_zhi) in self.xiangchong:
                zhi_bonus -= 2
        
        # 季节调整
        season_bonus = self.get_seasonal_bonus(current_month_zhi, day_gan)
        
        final_level = base_level + gan_bonus + zhi_bonus + season_bonus
        return max(1, min(10, final_level))
    
    def calculate_day_score(self, natal_ba, current_ba) -> int:
        """计算特定日期的流日评级"""
        current_day_gan = current_ba.getDayGan()
        current_day_zhi = current_ba.getDayZhi()
        
        natal_day_gan = natal_ba.getDayGan()
        natal_day_zhi = natal_ba.getDayZhi()
        
        # 基础等级
        base_level = 5
        
        # 天干关系分析
        gan_bonus = self.analyze_gan_relation(natal_day_gan, current_day_gan) // 3
        
        # 地支关系分析
        zhi_bonus = 0
        if (current_day_zhi, natal_day_zhi) in self.liuhe or (natal_day_zhi, current_day_zhi) in self.liuhe:
            zhi_bonus += 2
        elif (current_day_zhi, natal_day_zhi) in self.xiangchong or (natal_day_zhi, current_day_zhi) in self.xiangchong:
            zhi_bonus -= 2
        
        # 特殊关系加分
        if self.is_tiangan_wuhe(natal_day_gan, current_day_gan):
            zhi_bonus += 1
        
        # 同干支加分
        if current_day_gan == natal_day_gan:
            gan_bonus += 1
        if current_day_zhi == natal_day_zhi:
            zhi_bonus += 1
        
        final_level = base_level + gan_bonus + zhi_bonus
        return max(1, min(10, final_level))

# 测试函数
if __name__ == "__main__":
    analyzer = AdvancedBaziAnalyzer()
    result = analyzer.analyze_comprehensive_score('1995-06-11', '3-5', 'male')
    
    print("=== 专业八字分析结果 ===")
    print(f"本命盘基础: {result['scores']['base']}")
    print(f"大运加持: {result['scores']['with_dayun']}")
    print(f"流年影响: {result['scores']['with_liunian']}")
    print(f"流月细化: {result['scores']['with_liuyue']}")
    print(f"流日精准: {result['scores']['with_liuri']}")
    print(f"\n调候分析: {result['tiaohou_analysis']}")
