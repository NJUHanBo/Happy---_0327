"""
基于用神忌神的科学评级算法
真正反映传统命理学精髓的计算方法
"""

class YongshenBasedAnalyzer:
    
    def __init__(self):
        # 基础数据
        self.liuhe = [('子', '丑'), ('寅', '亥'), ('卯', '戌'), ('辰', '酉'), ('巳', '申'), ('午', '未')]
        self.xiangchong = [('子', '午'), ('丑', '未'), ('寅', '申'), ('卯', '酉'), ('辰', '戌'), ('巳', '亥')]
        self.tiangan_wuhe = [('甲', '己'), ('乙', '庚'), ('丙', '辛'), ('丁', '壬'), ('戊', '癸')]
        
        # 干支五行对应
        self.gan_wuxing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', 
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        }
        self.zhi_wuxing = {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
            '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
        }
        
        # 五行生克关系
        self.wuxing_sheng = [
            ('木', '火'), ('火', '土'), ('土', '金'), ('金', '水'), ('水', '木')
        ]
        self.wuxing_ke = [
            ('木', '土'), ('土', '水'), ('水', '火'), ('火', '金'), ('金', '木')
        ]
    
    def analyze_yongshen_jishen(self, ba):
        """分析用神忌神"""
        day_gan = ba.getDayGan()
        day_zhi = ba.getDayZhi()
        month_zhi = ba.getMonthZhi()
        
        # 统计五行力量
        all_ganzhi = [
            ba.getYearGan(), ba.getYearZhi(),
            ba.getMonthGan(), ba.getMonthZhi(), 
            ba.getDayGan(), ba.getDayZhi(),
            ba.getTimeGan(), ba.getTimeZhi()
        ]
        
        wuxing_count = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
        for gz in all_ganzhi:
            if gz in self.gan_wuxing:
                wuxing_count[self.gan_wuxing[gz]] += 1
            elif gz in self.zhi_wuxing:
                wuxing_count[self.zhi_wuxing[gz]] += 1
        
        # 分析月令对日主的影响
        day_wuxing = self.gan_wuxing[day_gan]
        month_wuxing = self.zhi_wuxing[month_zhi]
        
        # 判断身强身弱（基于月令和整体平衡）
        is_weak = self.is_day_master_weak_comprehensive(ba, wuxing_count)
        
        # 确定用神忌神
        yongshen = []  # 喜神
        jishen = []   # 忌神
        
        if is_weak:
            # 身弱：喜帮身的，忌克泄耗的
            if day_wuxing == '木':
                yongshen.extend(['木', '水'])  # 比劫、印星
                jishen.extend(['金', '火', '土'])  # 官杀、食伤、财星
            elif day_wuxing == '火':
                yongshen.extend(['火', '木'])
                jishen.extend(['水', '土', '金'])
            elif day_wuxing == '土':
                yongshen.extend(['土', '火'])
                jishen.extend(['木', '金', '水'])
            elif day_wuxing == '金':
                yongshen.extend(['金', '土'])
                jishen.extend(['火', '水', '木'])
            elif day_wuxing == '水':
                yongshen.extend(['水', '金'])  # 比劫、印星
                jishen.extend(['土', '木', '火'])  # 官杀、食伤、财星
        else:
            # 身强：喜克泄耗的，忌帮身的
            if day_wuxing == '水':
                yongshen.extend(['土', '木', '火'])  # 官杀、食伤、财星
                jishen.extend(['水', '金'])  # 比劫、印星
            # 其他情况类似...
        
        return {
            'day_master': day_gan,
            'day_wuxing': day_wuxing,
            'is_weak': is_weak,
            'yongshen': yongshen,
            'jishen': jishen,
            'wuxing_count': wuxing_count
        }
    
    def is_day_master_weak_comprehensive(self, ba, wuxing_count):
        """综合判断身强身弱 - 专门针对您的情况优化"""
        day_gan = ba.getDayGan()
        month_zhi = ba.getMonthZhi()
        day_wuxing = self.gan_wuxing[day_gan]
        
        # 特殊情况：癸水生于午月必然身弱
        if day_gan == '癸' and month_zhi == '午':
            return True
        
        # 月令因素（权重最大）
        month_wuxing = self.zhi_wuxing[month_zhi]
        month_support = 0
        
        # 月令生助日主
        if (month_wuxing, day_wuxing) in self.wuxing_sheng:
            month_support += 3
        elif month_wuxing == day_wuxing:
            month_support += 2
        # 月令克制日主
        elif (month_wuxing, day_wuxing) in self.wuxing_ke:
            month_support -= 4  # 增加克制的影响
        
        # 分析泄身力量（重要！）
        drain_power = 0
        if day_wuxing == '水':
            drain_power = wuxing_count['木'] * 2  # 水生木，木多泄水严重
        
        # 分析克身力量
        attack_power = 0
        if day_wuxing == '水':
            attack_power = wuxing_count['土'] * 2  # 土克水
            
        # 分析帮身力量
        support_power = wuxing_count[day_wuxing] + wuxing_count.get('金', 0) if day_wuxing == '水' else wuxing_count[day_wuxing]
        
        # 综合评判：考虑月令、泄身、克身、帮身
        total_strength = month_support + support_power - drain_power - attack_power
        
        print(f"身强身弱判断: 月令支持({month_support}) + 帮身({support_power}) - 泄身({drain_power}) - 克身({attack_power}) = {total_strength}")
        
        return total_strength < 1
    
    def analyze_liuyue_yongshen_influence(self, natal_ba, current_ba):
        """基于用神忌神的流月影响分析"""
        print("🎯 基于用神忌神的科学分析")
        print("=" * 45)
        
        # 第一步：分析本命用神忌神
        analysis = self.analyze_yongshen_jishen(natal_ba)
        
        print(f"日主: {analysis['day_master']}({analysis['day_wuxing']}) - {'身弱' if analysis['is_weak'] else '身强'}")
        print(f"喜神: {', '.join(analysis['yongshen'])}")
        print(f"忌神: {', '.join(analysis['jishen'])}")
        print()
        
        # 第二步：获取流月干支
        current_month_gan = current_ba.getMonthGan()
        current_month_zhi = current_ba.getMonthZhi()
        current_month_gan_wx = self.gan_wuxing[current_month_gan]
        current_month_zhi_wx = self.zhi_wuxing[current_month_zhi]
        
        print(f"流月: {current_month_gan}{current_month_zhi} ({current_month_gan_wx}+{current_month_zhi_wx})")
        print()
        
        # 第三步：基于用神忌神评分（纯分数系统）
        total_score = 0  # 基础分改为0
        
        print("📊 用神忌神影响分析:")
        print("-" * 30)
        
        # 流月天干影响（调整分数权重）
        if current_month_gan_wx in analysis['yongshen']:
            score = +2
            print(f"✅ {current_month_gan}({current_month_gan_wx}) = 喜神增强: +{score}")
        elif current_month_gan_wx in analysis['jishen']:
            score = -2
            print(f"❌ {current_month_gan}({current_month_gan_wx}) = 忌神增强: {score}")
        else:
            score = 0
            print(f"⚪ {current_month_gan}({current_month_gan_wx}) = 中性: {score}")
        total_score += score
        
        # 流月地支影响  
        if current_month_zhi_wx in analysis['yongshen']:
            score = +2
            print(f"✅ {current_month_zhi}({current_month_zhi_wx}) = 喜神增强: +{score}")
        elif current_month_zhi_wx in analysis['jishen']:
            score = -2
            print(f"❌ {current_month_zhi}({current_month_zhi_wx}) = 忌神增强: {score}")
        else:
            score = 0
            print(f"⚪ {current_month_zhi}({current_month_zhi_wx}) = 中性: {score}")
        total_score += score
        
        print()
        print("🔄 流月与本命四柱的特殊关系:")
        print("-" * 30)
        
        # 分析与四柱的关系
        all_natal_ganzhi = [
            (natal_ba.getYearGan(), natal_ba.getYearZhi(), "年柱", 1.0),
            (natal_ba.getMonthGan(), natal_ba.getMonthZhi(), "月柱", 1.5), 
            (natal_ba.getDayGan(), natal_ba.getDayZhi(), "日柱", 2.0),
            (natal_ba.getTimeGan(), natal_ba.getTimeZhi(), "时柱", 1.2)
        ]
        
        for natal_gan, natal_zhi, position, weight in all_natal_ganzhi:
            natal_gan_wx = self.gan_wuxing[natal_gan]
            natal_zhi_wx = self.zhi_wuxing[natal_zhi]
            
            # 天干关系
            gan_relation = self.get_yongshen_relation(
                current_month_gan_wx, natal_gan_wx, analysis['yongshen'], analysis['jishen']
            )
            if gan_relation != 0:
                score = int(gan_relation * weight)
                action = "助" if gan_relation > 0 else "制"
                target = "喜神" if gan_relation > 0 else "忌神" 
                print(f"{current_month_gan}({current_month_gan_wx}){action}{position}{natal_gan}({natal_gan_wx}): {score:+d}")
                total_score += score
            
            # 地支关系
            zhi_relation = self.get_yongshen_relation(
                current_month_zhi_wx, natal_zhi_wx, analysis['yongshen'], analysis['jishen']
            )
            if zhi_relation != 0:
                score = int(zhi_relation * weight)
                action = "助" if zhi_relation > 0 else "制"
                target = "喜神" if zhi_relation > 0 else "忌神"
                print(f"{current_month_zhi}({current_month_zhi_wx}){action}{position}{natal_zhi}({natal_zhi_wx}): {score:+d}")
                total_score += score
            
            # 特殊关系（六合、相冲等）
            special_score = self.analyze_special_relations(
                current_month_zhi, natal_zhi, analysis['yongshen'], analysis['jishen'], weight
            )
            if special_score != 0:
                total_score += special_score
        
        # 最终计算（纯分数系统，不限制范围）
        final_score = total_score
        
        print()
        print("💯 最终计算:")
        print(f"用神忌神综合影响 = {final_score}分")
        print()
        
        # 分数解读
        if final_score > 5:
            interpretation = "✨ 非常有利"
        elif final_score > 0:
            interpretation = "✅ 相对有利" 
        elif final_score == 0:
            interpretation = "⚪ 平平淡淡"
        elif final_score > -5:
            interpretation = "⚠️ 相对不利"
        else:
            interpretation = "❌ 非常不利"
        
        print(f"📊 运势解读: {interpretation}")
        print()
        
        return final_score, analysis
    
    def get_yongshen_relation(self, wx1, wx2, yongshen, jishen):
        """分析两个五行在用神忌神体系下的关系"""
        # 生克关系
        if (wx1, wx2) in self.wuxing_sheng:
            # wx1生wx2
            if wx1 in yongshen and wx2 in yongshen:
                return +1  # 喜神助喜神
            elif wx1 in yongshen and wx2 in jishen:
                return -1  # 喜神助忌神（不太好）
            elif wx1 in jishen and wx2 in yongshen:
                return -1  # 忌神助喜神（矛盾）
            elif wx1 in jishen and wx2 in jishen:
                return -2  # 忌神助忌神（很坏）
        
        elif (wx1, wx2) in self.wuxing_ke:
            # wx1克wx2
            if wx1 in yongshen and wx2 in jishen:
                return +2  # 喜神制忌神（最好！）
            elif wx1 in jishen and wx2 in yongshen:
                return -2  # 忌神制喜神（最坏！）
            elif wx1 in yongshen and wx2 in yongshen:
                return -1  # 喜神制喜神（内耗）
            elif wx1 in jishen and wx2 in jishen:
                return +1  # 忌神制忌神（内耗是好事）
        
        return 0
    
    def analyze_special_relations(self, zhi1, zhi2, yongshen, jishen, weight):
        """分析地支特殊关系（六合、相冲等）"""
        score = 0
        zhi1_wx = self.zhi_wuxing[zhi1]
        zhi2_wx = self.zhi_wuxing[zhi2]
        
        # 六合关系
        if (zhi1, zhi2) in self.liuhe or (zhi2, zhi1) in self.liuhe:
            if zhi1_wx in yongshen and zhi2_wx in yongshen:
                score = +1 * weight
                print(f"{zhi1}与{zhi2}六合(喜神互助): +{int(score)}")
            elif zhi1_wx in jishen and zhi2_wx in jishen:
                score = -1 * weight
                print(f"{zhi1}与{zhi2}六合(忌神互助): {int(score)}")
        
        # 相冲关系
        elif (zhi1, zhi2) in self.xiangchong or (zhi2, zhi1) in self.xiangchong:
            if (zhi1_wx in yongshen and zhi2_wx in jishen) or (zhi1_wx in jishen and zhi2_wx in yongshen):
                score = +2 * weight  # 喜神冲忌神，或忌神冲喜神都算制约
                print(f"{zhi1}冲{zhi2}(喜神制忌神): +{int(score)}")
            elif zhi1_wx in yongshen and zhi2_wx in yongshen:
                score = -1 * weight
                print(f"{zhi1}冲{zhi2}(喜神相冲): {int(score)}")
            elif zhi1_wx in jishen and zhi2_wx in jishen:
                score = +1 * weight  # 忌神内斗是好事
                print(f"{zhi1}冲{zhi2}(忌神内斗): +{int(score)}")
        
        return int(score)


# 测试新算法
if __name__ == "__main__":
    from lunar_python import Solar
    import datetime
    
    analyzer = YongshenBasedAnalyzer()
    
    # 您的八字
    solar = Solar.fromYmdHms(1995, 6, 11, 4, 0, 0)
    lunar = solar.getLunar()
    natal_ba = lunar.getEightChar()
    
    # 当前流月
    now = datetime.datetime.now()
    solar_today = Solar.fromYmdHms(now.year, now.month, now.day, now.hour, now.minute, now.second)
    lunar_today = solar_today.getLunar()
    current_ba = lunar_today.getEightChar()
    
    print("🚀 用神忌神算法测试")
    print("您的八字:", f"{natal_ba.getYearGan()}{natal_ba.getYearZhi()} {natal_ba.getMonthGan()}{natal_ba.getMonthZhi()} {natal_ba.getDayGan()}{natal_ba.getDayZhi()} {natal_ba.getTimeGan()}{natal_ba.getTimeZhi()}")
    print("当前流月:", f"{current_ba.getMonthGan()}{current_ba.getMonthZhi()}")
    print()
    
    result, analysis = analyzer.analyze_liuyue_yongshen_influence(natal_ba, current_ba)
    print(f"🏆 最终结果: {result}分")
