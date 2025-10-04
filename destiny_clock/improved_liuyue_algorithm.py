"""
改进的流月流日评级算法
基于身强身弱的全面分析方法
"""

class ImprovedBaziAnalyzer:
    
    def __init__(self):
        # 六合关系
        self.liuhe = [('子', '丑'), ('寅', '亥'), ('卯', '戌'), ('辰', '酉'), ('巳', '申'), ('午', '未')]
        # 相冲关系  
        self.xiangchong = [('子', '午'), ('丑', '未'), ('寅', '申'), ('卯', '酉'), ('辰', '戌'), ('巳', '亥')]
        # 天干五合
        self.tiangan_wuhe = [('甲', '己'), ('乙', '庚'), ('丙', '辛'), ('丁', '壬'), ('戊', '癸')]
        
        # 五行生克关系
        self.wuxing_sheng = [
            ('木', '火'), ('火', '土'), ('土', '金'), ('金', '水'), ('水', '木')
        ]
        self.wuxing_ke = [
            ('木', '土'), ('土', '水'), ('水', '火'), ('火', '金'), ('金', '木')
        ]
        
        # 干支五行对应
        self.gan_wuxing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', 
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        self.zhi_wuxing = {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
            '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
        }
    
    def is_day_master_weak(self, ba):
        """判断日主身强身弱"""
        day_gan = ba.getDayGan()
        month_zhi = ba.getMonthZhi()
        
        # 基于月令的旺衰表（简化版）
        weak_in_months = {
            '甲': ['申', '酉', '戌', '亥', '子', '丑', '午'],
            '乙': ['申', '酉', '戌', '亥', '子', '丑', '午'], 
            '丙': ['亥', '子', '丑', '寅', '申', '酉'],
            '丁': ['亥', '子', '丑', '寅', '申', '酉'],
            '戊': ['寅', '卯', '辰', '子', '亥'],
            '己': ['寅', '卯', '辰', '子', '亥'],
            '庚': ['巳', '午', '未', '卯', '寅'],
            '辛': ['巳', '午', '未', '卯', '寅'],
            '壬': ['未', '戌', '丑', '午', '巳'],
            '癸': ['未', '戌', '丑', '午', '巳']  # 癸水在午月确实身弱
        }
        
        return month_zhi in weak_in_months.get(day_gan, [])
    
    def get_wuxing_relation(self, wx1, wx2):
        """获取两个五行的关系：生、克、同类、无关"""
        if (wx1, wx2) in self.wuxing_sheng:
            return 'sheng'  # wx1生wx2
        elif (wx2, wx1) in self.wuxing_sheng:
            return 'bei_sheng'  # wx1被wx2生
        elif (wx1, wx2) in self.wuxing_ke:
            return 'ke'  # wx1克wx2
        elif (wx2, wx1) in self.wuxing_ke:
            return 'bei_ke'  # wx1被wx2克
        elif wx1 == wx2:
            return 'same'  # 同类
        else:
            return 'none'  # 无关
    
    def calculate_improved_liuyue_influence(self, natal_ba, current_ba):
        """改进的流月影响计算方法"""
        print("🔬 详细计算过程：")
        print("=" * 40)
        
        # 基础分
        base_level = 5
        print(f"基础分: {base_level}")
        
        # 判断日主身强身弱
        is_weak = self.is_day_master_weak(natal_ba)
        day_gan = natal_ba.getDayGan()
        print(f"日主: {day_gan}（{'身弱' if is_weak else '身强'}）")
        
        # 获取流月干支
        current_month_gan = current_ba.getMonthGan()
        current_month_zhi = current_ba.getMonthZhi()
        print(f"流月: {current_month_gan}{current_month_zhi}")
        print()
        
        total_score = 0
        
        # 分析流月天干与四柱天干的关系
        print("🌟 天干关系分析：")
        all_gans = [
            (natal_ba.getYearGan(), "年干", 0.5),
            (natal_ba.getMonthGan(), "月干", 1.0), 
            (natal_ba.getDayGan(), "日干", 2.0),
            (natal_ba.getTimeGan(), "时干", 0.8)
        ]
        
        for natal_gan, position, weight in all_gans:
            natal_wx = self.gan_wuxing[natal_gan]
            current_wx = self.gan_wuxing[current_month_gan]
            relation = self.get_wuxing_relation(natal_wx, current_wx)
            
            score_change = 0
            if relation == 'sheng':  # 本命生流月（泄身）
                if position == "日干" and is_weak:
                    score_change = -2 * weight
                    print(f"  {position}{natal_gan}({natal_wx})生{current_month_gan}({current_wx}): 泄日主 {score_change:.1f}")
                elif position == "月干" and is_weak:
                    score_change = -1 * weight  
                    print(f"  {position}{natal_gan}({natal_wx})生{current_month_gan}({current_wx}): 泄帮身之力 {score_change:.1f}")
                else:
                    score_change = -0.5 * weight
                    print(f"  {position}{natal_gan}({natal_wx})生{current_month_gan}({current_wx}): 轻微泄身 {score_change:.1f}")
            
            elif relation == 'bei_sheng':  # 流月生本命（助身）
                if position == "日干":
                    score_change = 2 * weight if is_weak else -1 * weight
                    action = "助日主" if is_weak else "生旺过头"
                    print(f"  {current_month_gan}({current_wx})生{position}{natal_gan}({natal_wx}): {action} {score_change:.1f}")
                else:
                    score_change = 1 * weight if is_weak else -0.5 * weight
                    action = "助身" if is_weak else "生旺过头"
                    print(f"  {current_month_gan}({current_wx})生{position}{natal_gan}({natal_wx}): {action} {score_change:.1f}")
            
            elif relation == 'ke':  # 本命克流月
                score_change = 1 * weight if is_weak else 0.5 * weight
                print(f"  {position}{natal_gan}({natal_wx})克{current_month_gan}({current_wx}): 制忌神 +{score_change:.1f}")
                
            elif relation == 'bei_ke':  # 流月克本命  
                if position == "日干":
                    score_change = -2 * weight if is_weak else 1 * weight
                    action = "克制日主" if is_weak else "制身有益"
                    print(f"  {current_month_gan}({current_wx})克{position}{natal_gan}({natal_wx}): {action} {score_change:.1f}")
                else:
                    score_change = -1 * weight if is_weak else 0.5 * weight
                    action = "克制" if is_weak else "制约"
                    print(f"  {current_month_gan}({current_wx})克{position}{natal_gan}({natal_wx}): {action} {score_change:.1f}")
                    
            elif relation == 'same':  # 同类
                score_change = 1 * weight if is_weak else -0.5 * weight
                action = "同类助身" if is_weak else "旺上加旺"
                print(f"  {current_month_gan}与{position}{natal_gan}同为{natal_wx}: {action} {score_change:.1f}")
            
            total_score += score_change
        
        print(f"天干关系总分: {total_score:.1f}")
        print()
        
        # 分析流月地支与四柱地支的关系
        print("🏠 地支关系分析：")
        all_zhis = [
            (natal_ba.getYearZhi(), "年支", 0.5),
            (natal_ba.getMonthZhi(), "月支", 1.0),
            (natal_ba.getDayZhi(), "日支", 1.5), 
            (natal_ba.getTimeZhi(), "时支", 1.0)
        ]
        
        zhi_total = 0
        for natal_zhi, position, weight in all_zhis:
            score_change = 0
            
            # 六合关系
            if (current_month_zhi, natal_zhi) in self.liuhe or (natal_zhi, current_month_zhi) in self.liuhe:
                score_change = 1.5 * weight
                print(f"  {current_month_zhi}与{position}{natal_zhi}六合: +{score_change:.1f}")
            
            # 相冲关系  
            elif (current_month_zhi, natal_zhi) in self.xiangchong or (natal_zhi, current_month_zhi) in self.xiangchong:
                score_change = -2 * weight
                print(f"  {current_month_zhi}与{position}{natal_zhi}相冲: {score_change:.1f}")
            
            # 五行生克关系
            else:
                natal_wx = self.zhi_wuxing[natal_zhi]
                current_wx = self.zhi_wuxing[current_month_zhi]
                relation = self.get_wuxing_relation(current_wx, natal_wx)
                
                if relation == 'sheng':  # 流月支生本命支
                    score_change = 1 * weight if is_weak else -0.3 * weight
                    action = "生助" if is_weak else "生旺过头"
                    print(f"  {current_month_zhi}({current_wx})生{position}{natal_zhi}({natal_wx}): {action} {score_change:.1f}")
                elif relation == 'ke':  # 流月支克本命支
                    score_change = -1 * weight if is_weak else 0.5 * weight  
                    action = "克制" if is_weak else "制约有益"
                    print(f"  {current_month_zhi}({current_wx})克{position}{natal_zhi}({natal_wx}): {action} {score_change:.1f}")
                elif relation == 'same':  # 同类
                    score_change = 0.5 * weight if is_weak else -0.2 * weight
                    action = "同类助" if is_weak else "旺上加旺"  
                    print(f"  {current_month_zhi}与{position}{natal_zhi}同为{natal_wx}: {action} {score_change:.1f}")
                else:
                    print(f"  {current_month_zhi}与{position}{natal_zhi}无特殊关系: 0")
            
            zhi_total += score_change
        
        print(f"地支关系总分: {zhi_total:.1f}")
        print()
        
        # 最终计算
        final_score = base_level + int(total_score) + int(zhi_total)
        final_level = max(1, min(10, final_score))
        
        print("💯 最终计算：")
        print(f"基础分({base_level}) + 天干关系({int(total_score)}) + 地支关系({int(zhi_total)}) = {final_level}级")
        print()
        
        return final_level

# 测试新算法
if __name__ == "__main__":
    from lunar_python import Solar
    import datetime
    
    analyzer = ImprovedBaziAnalyzer()
    
    # 您的八字
    solar = Solar.fromYmdHms(1995, 6, 11, 4, 0, 0)
    lunar = solar.getLunar()
    natal_ba = lunar.getEightChar()
    
    # 当前流月
    now = datetime.datetime.now()
    solar_today = Solar.fromYmdHms(now.year, now.month, now.day, now.hour, now.minute, now.second)
    lunar_today = solar_today.getLunar()
    current_ba = lunar_today.getEightChar()
    
    print("🎯 新算法测试")
    print("您的八字:", f"{natal_ba.getYearGan()}{natal_ba.getYearZhi()} {natal_ba.getMonthGan()}{natal_ba.getMonthZhi()} {natal_ba.getDayGan()}{natal_ba.getDayZhi()} {natal_ba.getTimeGan()}{natal_ba.getTimeZhi()}")
    print("当前流月:", f"{current_ba.getMonthGan()}{current_ba.getMonthZhi()}")
    print()
    
    result = analyzer.calculate_improved_liuyue_influence(natal_ba, current_ba)
    print(f"🏆 最终结果: {result}级")
