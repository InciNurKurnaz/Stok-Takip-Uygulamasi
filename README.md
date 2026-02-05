# 📦 Stok Takip Sistemi

Modern ve kullanıcı dostu bir stok takip uygulaması. Ürünlerinizi, stok hareketlerinizi takip edin ve dashboard üzerinden anlık durum görüntüleyin.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

## ✨ Özellikler

- **Ürün Yönetimi**: Ürün ekleme, düzenleme, silme
- **Stok Hareketleri**: Giriş/çıkış kayıtları, hareket geçmişi
- **Dashboard**: Gerçek zamanlı istatistikler ve grafikler
- **Düşük Stok Uyarıları**: Minimum stok seviyesi takibi
- **CSV Import/Export**: Excel uyumlu veri aktarımı
- **JSON Veri Saklama**: Kalıcı veri depolama

## 🖼️ Ekran Görüntüleri

### Ana Sayfa - Ürün Listesi
- Ürün ekleme formu
- Tablo görünümünde ürün listesi
- Düşük stok uyarıları

### Dashboard
- Toplam ürün, stok, hareket sayıları
- Stok dağılımı grafiği (Doughnut)
- Hareket grafiği (Bar)
- Son hareketler listesi

### Hareketler
- Stok giriş/çıkış formu
- Filtreli hareket geçmişi
- Anlık stok durumu kartları

## 🚀 Kurulum

### Gereksinimler
- Python 3.6 veya üzeri
- Modern web tarayıcı (Chrome, Firefox, Edge)

### Adımlar

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/KULLANICI_ADINIZ/stok-takip.git
cd stok-takip
```

2. **Sunucuyu başlatın:**
```bash
python server.py
```

3. **Tarayıcıda açın:**
```
http://localhost:8080
```

## 📁 Proje Yapısı

```
stok_takip/
├── index.html          # Ana sayfa - Ürün yönetimi
├── dashboard.html      # Dashboard - İstatistikler
├── movements.html      # Stok hareketleri
├── styles.css          # Stil dosyası
├── script.js           # Ana JavaScript
├── dashboard.js        # Dashboard fonksiyonları
├── movements.js        # Hareket fonksiyonları
├── export-import.js    # CSV işlemleri
├── server.py           # Python backend server
├── data.json           # Veri dosyası
└── README.md           # Bu dosya
```

## 🔧 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/data` | Tüm verileri getir |
| GET | `/api/products` | Ürünleri getir |
| GET | `/api/movements` | Hareketleri getir |
| POST | `/api/save` | Verileri kaydet |

## 💾 Veri Yapısı

### Ürün (Product)
```json
{
  "id": "unique_id",
  "sku": "LAP001",
  "name": "Ürün Adı",
  "description": "Açıklama",
  "quantity": 15,
  "minStock": 5,
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-05T14:30:00.000Z"
}
```

### Hareket (Movement)
```json
{
  "id": "unique_id",
  "productId": "product_id",
  "productName": "Ürün Adı",
  "productSku": "LAP001",
  "type": "in|out",
  "quantity": 10,
  "previousStock": 5,
  "newStock": 15,
  "reason": "Tedarikçiden alım",
  "createdAt": "2026-02-05T14:30:00.000Z"
}
```

## 🎯 Kullanım

### Ürün Ekleme
1. Ana sayfada formu doldurun
2. SKU, ad, miktar ve minimum stok girin
3. "Ürün Ekle" butonuna tıklayın

### Stok Hareketi
1. "Hareketler" sayfasına gidin
2. Ürün seçin, hareket türü belirleyin
3. Miktar ve açıklama girin
4. "Hareketi Kaydet" butonuna tıklayın

### CSV Export/Import
- **Export**: "CSV Export" butonu ile ürünleri indirin
- **Import**: "CSV Import" ile toplu ürün yükleyin

## 🛠️ Teknolojiler

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python (http.server)
- **Grafik**: Chart.js
- **İkonlar**: Font Awesome
- **Veri**: JSON dosya tabanlı

## 📝 Notlar

- Veriler `data.json` dosyasında saklanır
- Sunucu kapatılsa bile veriler korunur
- Tarayıcı önbelleğine bağımlı değildir

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Push edin (`git push origin feature/yeniOzellik`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👤 Geliştirici

- GitHub: [@KULLANICI_ADINIZ](https://github.com/KULLANICI_ADINIZ)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
