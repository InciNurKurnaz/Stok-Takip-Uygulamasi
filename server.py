"""
Stok Takip Sistemi - Basit JSON Backend Server
Bu server JSON dosyasına veri okuma/yazma işlemlerini yönetir.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os

# Script'in bulunduğu dizini al (absolute path için)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data.json')
PORT = 8080

class StokTakipHandler(SimpleHTTPRequestHandler):
    
    def send_cors_headers(self):
        """CORS başlıkları ekle"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        """CORS preflight request"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """GET isteklerini işle"""
        if self.path == '/api/data':
            self.send_json_response(self.load_data())
        elif self.path == '/api/products':
            data = self.load_data()
            self.send_json_response(data.get('products', []))
        elif self.path == '/api/movements':
            data = self.load_data()
            self.send_json_response(data.get('movements', []))
        else:
            # Statik dosyaları serve et (HTML, CSS, JS)
            super().do_GET()
    
    def do_POST(self):
        """POST isteklerini işle"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request_data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            self.send_error_response(400, 'Geçersiz JSON formatı')
            return
        
        if self.path == '/api/data':
            # Tüm veriyi kaydet
            self.save_data(request_data)
            self.send_json_response({'success': True, 'message': 'Veriler kaydedildi'})
        
        elif self.path == '/api/products':
            # Ürünleri kaydet
            data = self.load_data()
            data['products'] = request_data
            self.save_data(data)
            self.send_json_response({'success': True, 'message': 'Ürünler kaydedildi'})
        
        elif self.path == '/api/movements':
            # Hareketleri kaydet
            data = self.load_data()
            data['movements'] = request_data
            self.save_data(data)
            self.send_json_response({'success': True, 'message': 'Hareketler kaydedildi'})
        
        elif self.path == '/api/save':
            # Hem ürün hem hareket kaydet
            data = self.load_data()
            if 'products' in request_data:
                data['products'] = request_data['products']
            if 'movements' in request_data:
                data['movements'] = request_data['movements']
            self.save_data(data)
            self.send_json_response({'success': True, 'message': 'Tüm veriler kaydedildi'})
        
        else:
            self.send_error_response(404, 'Endpoint bulunamadı')
    
    def load_data(self):
        """JSON dosyasından veri oku"""
        try:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f'⚠️ Veri okuma hatası: {e}')
        
        return {'products': [], 'movements': []}
    
    def save_data(self, data):
        """JSON dosyasına veri yaz"""
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f'💾 Veri kaydedildi: {len(data.get("products", []))} ürün, {len(data.get("movements", []))} hareket')
            return True
        except IOError as e:
            print(f'❌ Veri yazma hatası: {e}')
            return False
    
    def send_json_response(self, data, status=200):
        """JSON yanıt gönder"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_cors_headers()
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def send_error_response(self, status, message):
        """Hata yanıtı gönder"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_cors_headers()
        self.end_headers()
        
        response = json.dumps({'success': False, 'error': message}, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def log_message(self, format, *args):
        """İstek logları"""
        if '/api/' in args[0]:
            print(f'🔄 API: {args[0]}')
        # Statik dosya isteklerini loglamayı atla


def run_server():
    """Server'ı başlat"""
    # data.json yoksa oluştur
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({'products': [], 'movements': []}, f, indent=2)
        print(f'📁 {DATA_FILE} oluşturuldu')
    
    server = HTTPServer(('localhost', PORT), StokTakipHandler)
    
    print('=' * 50)
    print('🚀 Stok Takip Sistemi Backend Server')
    print('=' * 50)
    print(f'📡 Server adresi: http://localhost:{PORT}')
    print(f'💾 Veri dosyası: {DATA_FILE}')
    print('')
    print('API Endpoints:')
    print('  GET  /api/data      - Tüm verileri getir')
    print('  GET  /api/products  - Ürünleri getir')
    print('  GET  /api/movements - Hareketleri getir')
    print('  POST /api/save      - Verileri kaydet')
    print('')
    print('Durdurmak için Ctrl+C basın')
    print('=' * 50)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n👋 Server kapatılıyor...')
        server.shutdown()


if __name__ == '__main__':
    run_server()
