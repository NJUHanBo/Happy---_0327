#!/usr/bin/env python3
"""
图表数据API
从CSV文件中提取图表数据，为前端提供折线图数据
"""

import csv
import os
import datetime
from collections import defaultdict
from flask import jsonify

class ChartDataAPI:
    def __init__(self, csv_file_path=None):
        if csv_file_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            csv_file_path = os.path.join(current_dir, "最终版一生每日分数_1995-2055.csv")
        
        self.csv_file_path = csv_file_path
        self.data_cache = None
        self._load_data()
    
    def _load_data(self):
        """加载CSV数据到内存"""
        self.data_cache = []
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # 跳过表头行（中文表头）
                    if row['日期'] == '日期':
                        continue
                    
                    # 处理数据
                    try:
                        processed_row = {
                            'date': row['日期'],
                            'year': int(row['年份']),
                            'dayun_ganzhi': row['大运干支'],
                            'liunian_ganzhi': row['流年干支'],
                            'liuyue_ganzhi': row['流月干支'],
                            'liuri_ganzhi': row['流日干支'],
                            'dayun_score': int(row['大运分数']),
                            'liunian_score': int(row['流年分数']),
                            'liuyue_score': int(row['流月分数']),
                            'liuri_score': int(row['流日分数']),
                            'final_score': int(row['最终总分'])
                        }
                        self.data_cache.append(processed_row)
                    except (ValueError, KeyError) as e:
                        continue
                        
            print(f"✅ 成功加载 {len(self.data_cache)} 条数据记录")
            
        except FileNotFoundError:
            print(f"❌ 数据文件不存在: {self.csv_file_path}")
            self.data_cache = []
        except Exception as e:
            print(f"❌ 加载数据时出错: {str(e)}")
            self.data_cache = []
    
    def get_dayun_chart_data(self):
        """获取大运图表数据 - 一生大运趋势"""
        if not self.data_cache:
            return {'labels': [], 'data': [], 'current_index': 0}
        
        # 大运周期定义
        dayun_periods = [
            {'ganzhi': '辛巳', 'start_year': 1997, 'end_year': 2007, 'label': '辛巳(1997-2007)'},
            {'ganzhi': '庚辰', 'start_year': 2007, 'end_year': 2017, 'label': '庚辰(2007-2017)'},
            {'ganzhi': '己卯', 'start_year': 2017, 'end_year': 2027, 'label': '己卯(2017-2027)'},
            {'ganzhi': '戊寅', 'start_year': 2027, 'end_year': 2037, 'label': '戊寅(2027-2037)'},
            {'ganzhi': '丁丑', 'start_year': 2037, 'end_year': 2047, 'label': '丁丑(2037-2047)'},
            {'ganzhi': '丙子', 'start_year': 2047, 'end_year': 2057, 'label': '丙子(2047-2057)'},
            {'ganzhi': '乙亥', 'start_year': 2057, 'end_year': 2067, 'label': '乙亥(2057-2067)'},
        ]
        
        labels = []
        data = []
        current_index = 0
        current_year = datetime.datetime.now().year
        
        for i, period in enumerate(dayun_periods):
            # 计算该大运期的平均分
            period_data = [item for item in self.data_cache 
                          if period['start_year'] <= item['year'] < period['end_year']]
            
            if period_data:
                avg_score = sum(item['final_score'] for item in period_data) / len(period_data)
                labels.append(period['label'])
                data.append(round(avg_score, 1))
                
                # 确定当前大运
                if period['start_year'] <= current_year < period['end_year']:
                    current_index = i
        
        return {
            'labels': labels,
            'data': data,
            'current_index': current_index
        }
    
    def get_liunian_chart_data(self):
        """获取流年图表数据 - 当前大运和下一个大运的流年趋势"""
        if not self.data_cache:
            return {'labels': [], 'data': [], 'current_index': 0}
        
        current_year = datetime.datetime.now().year
        
        # 确定当前大运和下一个大运
        current_dayun_years = None
        next_dayun_years = None
        
        if 2017 <= current_year < 2027:  # 当前在己卯大运
            current_dayun_years = range(2017, 2027)
            next_dayun_years = range(2027, 2037)
        elif 2027 <= current_year < 2037:  # 当前在戊寅大运
            current_dayun_years = range(2027, 2037)
            next_dayun_years = range(2037, 2047)
        else:  # 其他情况，默认当前大运
            current_dayun_years = range(2017, 2027)
            next_dayun_years = range(2027, 2037)
        
        # 合并年份范围
        all_years = list(current_dayun_years) + list(next_dayun_years)
        
        labels = []
        data = []
        current_index = 0
        
        for i, year in enumerate(all_years):
            # 计算该年的平均分
            year_data = [item for item in self.data_cache if item['year'] == year]
            
            if year_data:
                avg_score = sum(item['final_score'] for item in year_data) / len(year_data)
                labels.append(f"{year}年")
                data.append(round(avg_score, 1))
                
                if year == current_year:
                    current_index = i
        
        return {
            'labels': labels,
            'data': data,
            'current_index': current_index
        }
    
    def get_liuyue_chart_data(self):
        """获取流月图表数据 - 今年和明年全部月份"""
        if not self.data_cache:
            return {'labels': [], 'data': [], 'current_index': 0}
        
        current_date = datetime.datetime.now()
        current_year = current_date.year
        current_month = current_date.month
        
        # 今年和明年的月份
        years_months = []
        for year in [current_year, current_year + 1]:
            for month in range(1, 13):
                years_months.append((year, month))
        
        labels = []
        data = []
        current_index = 0
        
        for i, (year, month) in enumerate(years_months):
            # 计算该月的平均分
            month_data = [item for item in self.data_cache 
                         if item['year'] == year and 
                         datetime.datetime.strptime(item['date'], '%Y-%m-%d').month == month]
            
            if month_data:
                avg_score = sum(item['final_score'] for item in month_data) / len(month_data)
                labels.append(f"{year}年{month}月")
                data.append(round(avg_score, 1))
                
                if year == current_year and month == current_month:
                    current_index = i
        
        return {
            'labels': labels,
            'data': data,
            'current_index': current_index
        }
    
    def get_liuri_chart_data(self):
        """获取流日图表数据 - 本月和下个月每日分数"""
        if not self.data_cache:
            return {'labels': [], 'data': [], 'current_index': 0}
        
        current_date = datetime.datetime.now()
        current_year = current_date.year
        current_month = current_date.month
        current_day = current_date.day
        
        # 本月和下个月
        next_month = current_month + 1
        next_year = current_year
        if next_month > 12:
            next_month = 1
            next_year = current_year + 1
        
        # 收集本月和下个月的所有日期数据
        target_dates = []
        
        # 本月
        current_month_data = [item for item in self.data_cache 
                             if item['year'] == current_year and 
                             datetime.datetime.strptime(item['date'], '%Y-%m-%d').month == current_month]
        target_dates.extend(current_month_data)
        
        # 下个月
        next_month_data = [item for item in self.data_cache 
                          if item['year'] == next_year and 
                          datetime.datetime.strptime(item['date'], '%Y-%m-%d').month == next_month]
        target_dates.extend(next_month_data)
        
        # 按日期排序
        target_dates.sort(key=lambda x: x['date'])
        
        labels = []
        data = []
        current_index = 0
        current_date_str = current_date.strftime('%Y-%m-%d')
        
        for i, item in enumerate(target_dates):
            date_obj = datetime.datetime.strptime(item['date'], '%Y-%m-%d')
            labels.append(f"{date_obj.month}月{date_obj.day}日")
            data.append(item['final_score'])
            
            if item['date'] == current_date_str:
                current_index = i
        
        return {
            'labels': labels,
            'data': data,
            'current_index': current_index
        }

# 创建全局实例
chart_api = ChartDataAPI()

def get_dayun_chart_api():
    """大运图表API"""
    try:
        result = chart_api.get_dayun_chart_data()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def get_liunian_chart_api():
    """流年图表API"""
    try:
        result = chart_api.get_liunian_chart_data()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def get_liuyue_chart_api():
    """流月图表API"""
    try:
        result = chart_api.get_liuyue_chart_data()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def get_liuri_chart_api():
    """流日图表API"""
    try:
        result = chart_api.get_liuri_chart_data()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == "__main__":
    # 测试所有图表API
    print("🚀 测试图表数据API")
    print("=" * 40)
    
    print("📊 大运图表数据:")
    dayun_data = chart_api.get_dayun_chart_data()
    print(f"   标签: {dayun_data['labels']}")
    print(f"   数据: {dayun_data['data']}")
    print(f"   当前: {dayun_data['current_index']}")
    
    print("\n📈 流年图表数据:")
    liunian_data = chart_api.get_liunian_chart_data()
    print(f"   标签: {liunian_data['labels'][:5]}...")  # 只显示前5个
    print(f"   数据: {liunian_data['data'][:5]}...")
    print(f"   当前: {liunian_data['current_index']}")
    
    print("\n📅 流月图表数据:")
    liuyue_data = chart_api.get_liuyue_chart_data()
    print(f"   标签: {liuyue_data['labels'][:6]}...")
    print(f"   数据: {liuyue_data['data'][:6]}...")
    print(f"   当前: {liuyue_data['current_index']}")
    
    print("\n⏰ 流日图表数据:")
    liuri_data = chart_api.get_liuri_chart_data()
    print(f"   标签: {liuri_data['labels'][:10]}...")  # 只显示前10个
    print(f"   数据: {liuri_data['data'][:10]}...")
    print(f"   当前: {liuri_data['current_index']}")
    
    print(f"\n✅ 所有图表数据准备就绪！")
