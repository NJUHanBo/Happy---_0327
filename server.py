import http.server
import socketserver
import os
import json
import base64
import uuid
from urllib.parse import parse_qs
from PIL import Image
import io
import sys

# 添加destiny_clock目录到Python路径
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'destiny_clock'))

# 导入图表数据API
try:
    from chart_data_api import ChartDataAPI
    chart_api = ChartDataAPI()
    CHART_API_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not import chart_data_api: {e}")
    CHART_API_AVAILABLE = False

# 导入命理分析API
try:
    from mingli_analysis_api import analyze_bazi
    MINGLI_API_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not import mingli_analysis_api: {e}")
    MINGLI_API_AVAILABLE = False

PORT = 8000

# 定义目标尺寸
PANEL_SIZE = (1200, 300)  # 角色面板的目标尺寸
BLOCK_SIZE = (400, 300)   # 任务块的目标尺寸
GOD_SIZE = (200, 200)     # 火柴神图片的目标尺寸

def process_image(image_bytes, target_size, maintain_aspect=True):
    try:
        # 从字节数据创建图片对象
        image = Image.open(io.BytesIO(image_bytes))
        
        # 确保图片模式正确
        if image.mode in ('RGBA', 'RGB'):
            # 保持当前模式
            pass
        else:
            # 转换为RGB模式
            image = image.convert('RGB')
        
        # 获取目标尺寸和原始尺寸
        target_width, target_height = target_size
        original_width, original_height = image.size
        
        if maintain_aspect:
            # 计算新尺寸（保持长宽比）
            if original_width / original_height > target_width / target_height:
                # 以宽度为基准
                new_width = target_width
                new_height = int(original_height * (target_width / original_width))
            else:
                # 以高度为基准
                new_height = target_height
                new_width = int(original_width * (target_height / original_height))
        else:
            # 直接调整到目标尺寸
            new_width, new_height = target_width, target_height
        
        # 调整图片尺寸（使用高质量的LANCZOS重采样）
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        if maintain_aspect:
            # 创建新的透明背景画布
            new_image = Image.new('RGBA' if image.mode == 'RGBA' else 'RGB', 
                                target_size, 
                                (255, 255, 255, 0) if image.mode == 'RGBA' else (255, 255, 255))
            
            # 计算居中位置
            paste_x = (target_width - new_width) // 2
            paste_y = (target_height - new_height) // 2
            
            # 如果是RGBA模式，需要分别处理RGB和A通道
            if image.mode == 'RGBA':
                # 分离通道
                r, g, b, a = image.split()
                # 创建RGB图像
                rgb_image = Image.merge('RGB', (r, g, b))
                # 粘贴RGB部分
                new_image.paste(rgb_image, (paste_x, paste_y))
                # 创建mask
                mask = Image.merge('L', (a,))
                # 使用mask更新alpha通道
                new_image.putalpha(mask)
            else:
                # 直接粘贴RGB图像
                new_image.paste(image, (paste_x, paste_y))
        else:
            new_image = image
        
        # 转换回字节（使用最高质量设置）
        output = io.BytesIO()
        new_image.save(output, 
                      format='PNG',
                      optimize=False,  # 禁用优化以保持质量
                      quality=100)     # 使用最高质量
        return output.getvalue()
        
    except Exception as e:
        print(f"Error in process_image: {str(e)}")
        raise

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_POST(self):
        if self.path == '/save-background':
            try:
                # 读取请求内容
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # 解析base64图片数据
                try:
                    image_data = data['imageData'].split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                except:
                    print("Error: Invalid image data")
                    self.send_error(400, "Invalid image data")
                    return
                
                # 根据区域选择目标尺寸和保存目录
                if data['area'] == 'panel':
                    target_size = PANEL_SIZE
                    save_dir = 'assets/backgrounds/panel'
                    maintain_aspect = True
                elif data['area'] == 'god':
                    target_size = GOD_SIZE
                    save_dir = 'assets/characters'
                    maintain_aspect = True
                else:
                    target_size = BLOCK_SIZE
                    save_dir = 'assets/backgrounds/blocks'
                    maintain_aspect = True
                
                # 处理图片
                try:
                    processed_image = process_image(image_bytes, target_size, maintain_aspect)
                except Exception as e:
                    print(f"Error processing image: {e}")
                    self.send_error(500, "Error processing image")
                    return
                
                # 生成唯一文件名
                filename = f"{uuid.uuid4()}.png"
                
                # 确保目录存在
                os.makedirs(save_dir, exist_ok=True)
                
                # 保存处理后的图片
                file_path = os.path.join(save_dir, filename)
                try:
                    with open(file_path, 'wb') as f:
                        f.write(processed_image)
                except Exception as e:
                    print(f"Error saving file: {e}")
                    self.send_error(500, "Error saving file")
                    return
                
                # 返回文件路径
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    'path': f'/{file_path}'
                }
                self.wfile.write(json.dumps(response).encode())
                print(f"Background image saved successfully: {file_path}")
                return
            except Exception as e:
                print(f"Error processing background upload: {e}")
                self.send_error(500, "Internal server error")
                return
        
        # 处理命理分析API请求
        elif self.path == '/api/mingli-analysis' and MINGLI_API_AVAILABLE:
            try:
                # 读取请求内容
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # 检查八字数据
                if not data or 'bazi' not in data:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {"error": "请提供八字信息"}
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                    return
                
                bazi = data['bazi']
                if not bazi or not isinstance(bazi, str):
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {"error": "八字格式不正确"}
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                    return
                
                # 调用分析函数
                result = analyze_bazi(bazi)
                
                # 返回结果
                if 'error' in result:
                    self.send_response(500)
                else:
                    self.send_response(200)
                
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
                return
                
            except Exception as e:
                print(f"Error in mingli analysis: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"error": f"服务器错误: {str(e)}"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        # 处理保存分析结果请求
        elif self.path == '/api/save-analysis':
            try:
                # 读取请求内容
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # 创建保存目录
                save_dir = os.path.join('destiny_clock', 'saved_analysis')
                os.makedirs(save_dir, exist_ok=True)
                
                # 生成文件名（包含时间戳和八字）
                timestamp = data.get('timestamp', '')
                bazi = data.get('bazi', '').replace(' ', '_')
                date_str = timestamp.split('T')[0] if 'T' in timestamp else timestamp
                filename = f"命理分析_{bazi}_{date_str}.md"
                
                # 保存文件
                file_path = os.path.join(save_dir, filename)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(f"# 命理分析报告\n\n")
                    f.write(f"## 基本信息\n\n")
                    f.write(f"**八字：** {data.get('bazi', '')}\n\n")
                    f.write(f"**分析时间：** {timestamp}\n\n")
                    f.write(f"**分析模型：** 整合性生命剧本分析范式 v1.0\n\n")
                    f.write(f"**分析角色：** 生命系统诊断师\n\n")
                    f.write("---\n\n")
                    f.write("## 分析结果\n\n")
                    f.write(data.get('analysis', ''))
                    f.write("\n\n---\n\n")
                    f.write("*本报告由AI命理分析系统生成，仅供参考*")
                
                # 返回成功响应
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    'success': True,
                    'filename': filename,
                    'path': file_path
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f"分析结果已保存：{file_path}")
                return
                
            except Exception as e:
                print(f"Error saving analysis: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"success": False, "error": str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()
    
    def do_GET(self):
        # 处理图表API请求
        if CHART_API_AVAILABLE and self.path.startswith('/api/chart/'):
            try:
                # 设置响应头
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # 根据路径调用对应的API
                if self.path == '/api/chart/dayun':
                    data = chart_api.get_dayun_chart_data()
                    response = {'success': True, 'data': data}
                elif self.path == '/api/chart/liunian':
                    data = chart_api.get_liunian_chart_data()
                    response = {'success': True, 'data': data}
                elif self.path == '/api/chart/liuyue':
                    data = chart_api.get_liuyue_chart_data()
                    response = {'success': True, 'data': data}
                elif self.path == '/api/chart/liuri':
                    data = chart_api.get_liuri_chart_data()
                    response = {'success': True, 'data': data}
                else:
                    self.send_error(404, "API endpoint not found")
                    return
                
                # 发送响应
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
            except Exception as e:
                print(f"Error in chart API: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {'success': False, 'error': str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
        
        # 处理命理分析页面请求
        if self.path == '/destiny_clock/mingli_analysis.html':
            try:
                # 读取并返回命理分析页面
                file_path = os.path.join('destiny_clock', 'mingli_analysis.html')
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as e:
                print(f"Error serving mingli_analysis.html: {e}")
                self.send_error(404, "File not found")
                return
        
        # 其他GET请求使用默认处理
        super().do_GET()

def run_server():
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"服务器运行在 http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    # 确保目录结构存在
    os.makedirs("data", exist_ok=True)
    os.makedirs("assets/characters", exist_ok=True)
    os.makedirs("assets/backgrounds/panel", exist_ok=True)
    os.makedirs("assets/backgrounds/blocks", exist_ok=True)
    os.makedirs("styles", exist_ok=True)
    os.makedirs("scripts", exist_ok=True)
    
    run_server() 