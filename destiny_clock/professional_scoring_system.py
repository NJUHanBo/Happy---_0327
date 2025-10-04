#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
专业八字计分系统
基于十神、地支关系、节气深浅、地支藏干的高级计分算法
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

class ProfessionalScoringSystem:
    """专业八字计分系统"""
    
    def __init__(self):
        # 十神吉凶权重表（基于传统命理）
        self.SHISHEN_SCORES = {
            '正官': +3,    # 最吉，代表权威、地位
            '正财': +3,    # 很吉，代表财富、妻子
            '正印': +2,    # 较吉，代表学问、贵人
            '食神': +2,    # 较吉，代表福禄、子女  
            '比肩': 0,     # 中性，代表兄弟、朋友
            '劫财': -1,    # 略凶，代表破财、争斗
            '伤官': -1,    # 略凶，代表伤害、官灾
            '偏财': -1,    # 略凶，代表偏财、情人（根据格局可调整）
            '偏印': -2,    # 较凶，代表偏业、孤独
            '七杀': -2,    # 较凶，代表压力、小人（有制化则吉）
            '日主': 0,     # 中性，自己
        }
        
        # 地支六合关系（和谐关系，+分）
        self.LIUHE_PAIRS = [
            ('子', '丑'), ('寅', '亥'), ('卯', '戌'),
            ('辰', '酉'), ('巳', '申'), ('午', '未')
        ]
        
        # 地支相冲关系（冲突关系，-分）
        self.XIANGCHONG_PAIRS = [
            ('子', '午'), ('丑', '未'), ('寅', '申'),
            ('卯', '酉'), ('辰', '戌'), ('巳', '亥')
        ]
        
        # 地支三合关系（最和谐，++分）
        self.SANHE_GROUPS = [
            ('申', '子', '辰'),  # 水局
            ('寅', '午', '戌'),  # 火局
            ('巳', '酉', '丑'),  # 金局  
            ('亥', '卯', '未')   # 木局
        ]
        
        # 地支相刑关系（刑克关系，-分）
        self.XINGKE_GROUPS = [
            ('寅', '巳', '申'),  # 寅巳申三刑
            ('丑', '戌', '未'),  # 丑戌未三刑
            ('子', '卯'),        # 子卯相刑
        ]
        
        # 地支自刑（同一地支重复出现）
        self.ZIXING_ZHIS = ['辰', '午', '酉', '亥']
        
        # 地支相害关系（相害关系，-分）
        self.XIANGHAI_PAIRS = [
            ('子', '未'), ('丑', '午'), ('寅', '巳'),
            ('卯', '辰'), ('申', '亥'), ('酉', '戌')
        ]
        
    def calculate_professional_score(self, ba, birth_date: str, gender: str = 'male') -> Dict[str, Any]:
        """计算专业级分数"""
        try:
            # 解析出生日期以获取节气信息
            year, month, day = map(int, birth_date.split('-'))
            solar = Solar.fromYmdHms(year, month, day, 4, 0, 0)  # 默认寅时
            lunar = solar.getLunar()
            
            total_score = 0
            score_details = {}
            
            # 第1层：十神关系精准计分
            shishen_score = self.calculate_shishen_score(ba)
            score_details['十神关系'] = shishen_score
            total_score += shishen_score['total']
            
            # 第2层：地支刑冲合害分析
            dizhi_score = self.calculate_dizhi_relations_score(ba)
            score_details['地支关系'] = dizhi_score
            total_score += dizhi_score['total']
            
            # 第3层：节气深浅影响
            jieqi_score = self.calculate_jieqi_influence(lunar, ba)
            score_details['节气深浅'] = jieqi_score
            total_score += jieqi_score['total']
            
            # 第4层：地支藏干精算
            cangan_score = self.calculate_cangan_influence(ba)
            score_details['地支藏干'] = cangan_score
            total_score += cangan_score['total']
            
            return {
                'total_score': total_score,
                'score_details': score_details,
                'analysis_method': 'professional_v1.0'
            }
            
        except Exception as e:
            print(f"专业计分失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'total_score': 0,
                'score_details': {},
                'error': str(e)
            }
    
    def calculate_shishen_score(self, ba) -> Dict[str, Any]:
        """计算十神关系分数"""
        shishen_details = {}
        total_score = 0
        
        try:
            # 获取四柱十神
            pillars = [
                ('年干', ba.getYearShiShenGan()),
                ('年支', ba.getYearShiShenZhi()),
                ('月干', ba.getMonthShiShenGan()),
                ('月支', ba.getMonthShiShenZhi()),
                ('日干', ba.getDayShiShenGan()),
                ('日支', ba.getDayShiShenZhi()),
                ('时干', ba.getTimeShiShenGan()),
                ('时支', ba.getTimeShiShenZhi())
            ]
            
            for pillar_name, shishen_data in pillars:
                pillar_score = 0
                pillar_details = []
                
                if isinstance(shishen_data, list):
                    # 地支可能有多个十神（藏干）
                    for shishen in shishen_data:
                        score = self.SHISHEN_SCORES.get(shishen, 0)
                        # 地支藏干影响减半
                        if '支' in pillar_name:
                            score = score * 0.5
                        pillar_score += score
                        pillar_details.append(f"{shishen}({score:+.1f})")
                else:
                    # 天干只有一个十神
                    score = self.SHISHEN_SCORES.get(shishen_data, 0)
                    pillar_score = score
                    pillar_details.append(f"{shishen_data}({score:+.1f})")
                
                shishen_details[pillar_name] = {
                    'score': pillar_score,
                    'details': pillar_details
                }
                total_score += pillar_score
                
            return {
                'total': round(total_score, 1),
                'details': shishen_details,
                'description': '基于十神关系的吉凶评分'
            }
            
        except Exception as e:
            print(f"十神计分失败: {str(e)}")
            return {'total': 0, 'details': {}, 'error': str(e)}
    
    def calculate_dizhi_relations_score(self, ba) -> Dict[str, Any]:
        """计算地支刑冲合害关系分数"""
        relation_score = 0
        relation_details = []
        
        try:
            # 获取四柱地支
            zhis = [ba.getYearZhi(), ba.getMonthZhi(), ba.getDayZhi(), ba.getTimeZhi()]
            
            # 检查六合关系（+2分）
            liuhe_count = 0
            for i, zhi1 in enumerate(zhis):
                for j, zhi2 in enumerate(zhis):
                    if i < j:  # 避免重复检查
                        if (zhi1, zhi2) in self.LIUHE_PAIRS or (zhi2, zhi1) in self.LIUHE_PAIRS:
                            relation_score += 2
                            liuhe_count += 1
                            relation_details.append(f"{zhi1}{zhi2}六合(+2)")
            
            # 检查三合关系（+3分）
            sanhe_count = 0
            for sanhe_group in self.SANHE_GROUPS:
                matched_zhis = [zhi for zhi in zhis if zhi in sanhe_group]
                if len(matched_zhis) >= 2:
                    sanhe_score = len(matched_zhis) * 1.5  # 2个地支+3分，3个地支+4.5分
                    relation_score += sanhe_score
                    sanhe_count += 1
                    relation_details.append(f"{''.join(matched_zhis)}三合({sanhe_score:+.1f})")
            
            # 检查相冲关系（-3分）
            chong_count = 0
            for i, zhi1 in enumerate(zhis):
                for j, zhi2 in enumerate(zhis):
                    if i < j:
                        if (zhi1, zhi2) in self.XIANGCHONG_PAIRS or (zhi2, zhi1) in self.XIANGCHONG_PAIRS:
                            relation_score -= 3
                            chong_count += 1
                            relation_details.append(f"{zhi1}{zhi2}相冲(-3)")
            
            # 检查相刑关系（-2分）
            xing_count = 0
            # 处理三刑
            for xing_group in self.XINGKE_GROUPS:
                if len(xing_group) == 3:  # 寅巳申三刑、丑戌未三刑
                    matched_zhis = [zhi for zhi in zhis if zhi in xing_group]
                    if len(matched_zhis) >= 2:
                        xing_score = len(matched_zhis) * -1
                        relation_score += xing_score
                        xing_count += 1
                        relation_details.append(f"{''.join(matched_zhis)}相刑({xing_score})")
                elif len(xing_group) == 2:  # 子卯刑
                    if xing_group[0] in zhis and xing_group[1] in zhis:
                        relation_score -= 2
                        xing_count += 1
                        relation_details.append(f"{xing_group[0]}{xing_group[1]}相刑(-2)")
            
            # 处理自刑（修复bug：需要同一地支出现2次或以上才算自刑）
            zhi_counts = {}
            for zhi in zhis:
                zhi_counts[zhi] = zhi_counts.get(zhi, 0) + 1
            
            # 自刑地支
            for zhi in self.ZIXING_ZHIS:
                if zhi_counts.get(zhi, 0) >= 2:  # 同一地支出现2次或以上
                    count = zhi_counts[zhi]
                    xing_score = -(count - 1) * 2  # 每多一个自刑地支-2分
                    relation_score += xing_score
                    xing_count += 1
                    relation_details.append(f"{zhi}自刑×{count}({xing_score})")
            
            # 检查相害关系（-1分）
            hai_count = 0
            for i, zhi1 in enumerate(zhis):
                for j, zhi2 in enumerate(zhis):
                    if i < j:
                        if (zhi1, zhi2) in self.XIANGHAI_PAIRS or (zhi2, zhi1) in self.XIANGHAI_PAIRS:
                            relation_score -= 1
                            hai_count += 1
                            relation_details.append(f"{zhi1}{zhi2}相害(-1)")
            
            return {
                'total': relation_score,
                'details': relation_details,
                'statistics': {
                    '六合': liuhe_count,
                    '三合': sanhe_count,
                    '相冲': chong_count,
                    '相刑': xing_count,
                    '相害': hai_count
                },
                'description': '地支间的刑冲合害关系评分'
            }
            
        except Exception as e:
            print(f"地支关系计分失败: {str(e)}")
            return {'total': 0, 'details': [], 'error': str(e)}
    
    def calculate_jieqi_influence(self, lunar, ba) -> Dict[str, Any]:
        """计算节气深浅影响"""
        try:
            # 获取前后节气
            prev_jieqi = lunar.getPrevJieQi()
            next_jieqi = lunar.getNextJieQi()
            current_solar = lunar.getSolar()
            
            # 计算节气深浅百分比
            # 由于toJulianDay方法不存在，我们用简化方法
            current_date = datetime.date(current_solar.getYear(), current_solar.getMonth(), current_solar.getDay())
            prev_date = datetime.date(prev_jieqi.getSolar().getYear(), 
                                    prev_jieqi.getSolar().getMonth(), 
                                    prev_jieqi.getSolar().getDay())
            next_date = datetime.date(next_jieqi.getSolar().getYear(),
                                    next_jieqi.getSolar().getMonth(),
                                    next_jieqi.getSolar().getDay())
            
            prev_days = (current_date - prev_date).days
            total_days = (next_date - prev_date).days
            depth_percent = (prev_days / total_days) * 100 if total_days > 0 else 50
            
            # 根据节气深浅评分
            jieqi_score = 0
            jieqi_description = ""
            
            if depth_percent < 20:
                # 节气初期，气势未稳
                jieqi_score = -1
                jieqi_description = f"节气初期({depth_percent:.1f}%)，气势未稳"
            elif depth_percent > 80:
                # 节气末期，气势将衰
                jieqi_score = -1  
                jieqi_description = f"节气末期({depth_percent:.1f}%)，气势将衰"
            else:
                # 节气中期，当令得时
                jieqi_score = +1
                jieqi_description = f"节气中期({depth_percent:.1f}%)，当令得时"
            
            # 特殊节气调整（根据日主五行）
            day_gan = ba.getDayGan()
            current_month_zhi = ba.getMonthZhi()
            
            # 简化的月令生克关系
            month_wuxing_map = {
                '寅': '木', '卯': '木', '辰': '土',
                '巳': '火', '午': '火', '未': '土', 
                '申': '金', '酉': '金', '戌': '土',
                '亥': '水', '子': '水', '丑': '土'
            }
            
            gan_wuxing_map = {
                '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
                '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
            }
            
            month_wx = month_wuxing_map.get(current_month_zhi, '土')
            day_wx = gan_wuxing_map.get(day_gan, '土')
            
            # 月令生扶日主额外+1，月令克制日主额外-1
            if self.wuxing_sheng_relation(month_wx, day_wx):
                jieqi_score += 1
                jieqi_description += "，月令生扶日主"
            elif self.wuxing_ke_relation(month_wx, day_wx):
                jieqi_score -= 1
                jieqi_description += "，月令克制日主"
            
            return {
                'total': jieqi_score,
                'depth_percent': depth_percent,
                'prev_jieqi': prev_jieqi.getName(),
                'next_jieqi': next_jieqi.getName(),
                'description': jieqi_description,
                'details': f"距{prev_jieqi.getName()}{prev_days}天，距{next_jieqi.getName()}{total_days-prev_days}天"
            }
            
        except Exception as e:
            print(f"节气深浅计分失败: {str(e)}")
            return {'total': 0, 'description': f'节气计算失败: {str(e)}'}
    
    def calculate_cangan_influence(self, ba) -> Dict[str, Any]:
        """计算地支藏干精细影响"""
        try:
            cangan_score = 0
            cangan_details = {}
            
            # 获取四柱地支藏干
            pillars = [
                ('年支', ba.getYearZhi(), ba.getYearHideGan()),
                ('月支', ba.getMonthZhi(), ba.getMonthHideGan()),
                ('日支', ba.getDayZhi(), ba.getDayHideGan()),
                ('时支', ba.getTimeZhi(), ba.getTimeHideGan())
            ]
            
            day_gan = ba.getDayGan()
            
            for pillar_name, zhi, hide_gans in pillars:
                pillar_score = 0
                pillar_details = []
                
                if hide_gans:
                    for i, hide_gan in enumerate(hide_gans):
                        # 计算藏干与日干的十神关系
                        shishen = self.get_shishen_relation(day_gan, hide_gan)
                        base_score = self.SHISHEN_SCORES.get(shishen, 0)
                        
                        # 藏干影响力递减：第一个藏干100%，第二个50%，第三个25%
                        influence_ratio = 1.0 / (2 ** i)
                        actual_score = base_score * influence_ratio * 0.3  # 藏干总体影响降低
                        
                        pillar_score += actual_score
                        pillar_details.append(f"{hide_gan}({shishen})×{influence_ratio:.1f}={actual_score:+.2f}")
                
                cangan_details[pillar_name] = {
                    'zhi': zhi,
                    'hide_gans': hide_gans,
                    'score': round(pillar_score, 2),
                    'details': pillar_details
                }
                cangan_score += pillar_score
            
            return {
                'total': round(cangan_score, 2),
                'details': cangan_details,
                'description': '地支藏干的十神影响（影响力递减）'
            }
            
        except Exception as e:
            print(f"地支藏干计分失败: {str(e)}")
            return {'total': 0, 'details': {}, 'error': str(e)}
    
    def wuxing_sheng_relation(self, wx1: str, wx2: str) -> bool:
        """判断五行相生关系（wx1生wx2）"""
        sheng_relations = {
            '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
        }
        return sheng_relations.get(wx1) == wx2
    
    def wuxing_ke_relation(self, wx1: str, wx2: str) -> bool:
        """判断五行相克关系（wx1克wx2）"""
        ke_relations = {
            '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
        }
        return ke_relations.get(wx1) == wx2
    
    def get_shishen_relation(self, day_gan: str, target_gan: str) -> str:
        """获取目标天干对日干的十神关系"""
        # 简化的十神关系映射
        gan_wuxing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        
        day_wx = gan_wuxing.get(day_gan, '土')
        target_wx = gan_wuxing.get(target_gan, '土')
        
        # 简化的十神判断逻辑
        if day_gan == target_gan:
            return '比肩'
        elif day_wx == target_wx:
            return '劫财'
        elif self.wuxing_sheng_relation(day_wx, target_wx):
            return '食神' if self.is_same_yinyang(day_gan, target_gan) else '伤官'
        elif self.wuxing_sheng_relation(target_wx, day_wx):
            return '正印' if self.is_same_yinyang(day_gan, target_gan) else '偏印'
        elif self.wuxing_ke_relation(day_wx, target_wx):
            return '正财' if self.is_same_yinyang(day_gan, target_gan) else '偏财'
        elif self.wuxing_ke_relation(target_wx, day_wx):
            return '正官' if self.is_same_yinyang(day_gan, target_gan) else '七杀'
        else:
            return '比肩'  # 默认值
    
    def is_same_yinyang(self, gan1: str, gan2: str) -> bool:
        """判断两个天干是否同阴阳"""
        yang_gans = ['甲', '丙', '戊', '庚', '壬']
        yin_gans = ['乙', '丁', '己', '辛', '癸']
        
        return (gan1 in yang_gans and gan2 in yang_gans) or (gan1 in yin_gans and gan2 in yin_gans)


# 测试函数
if __name__ == "__main__":
    from lunar_python import Solar
    
    print('🔬 专业计分系统测试')
    print('='*50)
    
    # 初始化系统
    system = ProfessionalScoringSystem()
    
    # 创建测试八字
    solar = Solar.fromYmdHms(1995, 6, 11, 4, 0, 0)
    lunar = solar.getLunar() 
    ba = lunar.getEightChar()
    
    print(f'测试八字: {ba.toString()}')
    print()
    
    # 计算专业分数
    result = system.calculate_professional_score(ba, '1995-06-11', 'male')
    
    if 'error' not in result:
        print(f'💯 总分: {result["total_score"]}分')
        print()
        
        # 显示各项详细分数
        for category, details in result['score_details'].items():
            print(f'📊 {category}: {details["total"]}分')
            if 'description' in details:
                print(f'   说明: {details["description"]}')
            if 'details' in details and details['details']:
                if isinstance(details['details'], dict):
                    for key, value in details['details'].items():
                        print(f'   • {key}: {value}')
                elif isinstance(details['details'], list):
                    for detail in details['details'][:5]:  # 只显示前5个
                        print(f'   • {detail}')
            print()
        
        print(f'🔍 分析方法: {result["analysis_method"]}')
    else:
        print(f'❌ 计算失败: {result["error"]}')
