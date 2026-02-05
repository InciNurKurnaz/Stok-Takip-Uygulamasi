// API endpoint
const API_URL = 'http://localhost:8080/api';

// Global değişkenler
let products = [];
let movements = [];
let editingProductIndex = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Stok Takip Sistemi başlatılıyor...');
    await loadData();
    initializeEventListeners();
    renderProducts();
    updateStats();
    
    // URL parametresiyle test verisi ekleme desteği
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true' && products.length === 0) {
        console.log('🧪 Test modu aktif - test verileri ekleniyor...');
        await addTestData();
    }
    
    console.log('✅ Ana sistem hazır!');
});

// JSON dosyasından verileri yükle
async function loadData() {
    try {
        const response = await fetch(`${API_URL}/data`);
        
        if (!response.ok) {
            throw new Error(`HTTP hata: ${response.status}`);
        }
        
        const data = await response.json();
        products = data.products || [];
        movements = data.movements || [];
        
        console.log(`📦 JSON'dan yüklendi: ${products.length} ürün, ${movements.length} hareket`);
    } catch (error) {
        console.error('❌ Veri yükleme hatası:', error);
        console.log('⚠️ Server çalışıyor mu? python server.py komutunu çalıştırın.');
        products = [];
        movements = [];
        showNotification('Veri yükleme hatası! Server çalışıyor mu kontrol edin.', 'error');
    }
}

// Verileri JSON dosyasına kaydet
async function saveData() {
    try {
        const response = await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: products,
                movements: movements
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP hata: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('💾 Veriler JSON dosyasına kaydedildi');
        return true;
    } catch (error) {
        console.error('❌ Veri kaydetme hatası:', error);
        showNotification('Veri kaydetme hatası! Server çalışıyor mu kontrol edin.', 'error');
        return false;
    }
}

// Event listener'ları başlat
function initializeEventListeners() {
    // Ürün ekleme formu
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Düzenleme formu
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
    
    // Modal kontrolleri
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }
    
    // Modal dışına tıklayınca kapatma
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeEditModal();
        }
    });
    
    // Export/Import butonları
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    
    if (exportBtn) exportBtn.addEventListener('click', () => exportToCSV());
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importFromCSV);
    
    console.log("🔗 Event listener'lar eklendi");
}

// Ürün ekleme formunu işle
function handleProductSubmit(e) {
    e.preventDefault();
    console.log('📝 Yeni ürün ekleniyor...');
    
    // Form verilerini al
    const formData = {
        sku: document.getElementById('sku').value.trim().toUpperCase(),
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        quantity: parseInt(document.getElementById('quantity').value) || 0,
        minStock: parseInt(document.getElementById('minStock').value) || 0
    };
    
    // Validasyon
    if (!formData.sku || !formData.name) {
        showNotification('SKU kodu ve ürün adı zorunludur!', 'error');
        return;
    }
    
    if (formData.quantity < 0 || formData.minStock < 0) {
        showNotification('Miktar ve minimum stok negatif olamaz!', 'error');
        return;
    }
    
    // SKU benzersizlik kontrolü
    const existingSku = products.find(p => p.sku === formData.sku);
    if (existingSku) {
        showNotification('Bu SKU kodu zaten mevcut!', 'error');
        document.getElementById('sku').focus();
        return;
    }
    
    // Yeni ürün oluştur
    const newProduct = {
        id: generateId(),
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        quantity: formData.quantity,
        minStock: formData.minStock,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Ürünü ekle
    products.push(newProduct);
    
    // Kaydet ve güncelle
    if (saveData()) {
        renderProducts();
        updateStats();
        
        // Formu temizle
        e.target.reset();
        
        // Başlangıç stoku için hareket kaydı
        if (newProduct.quantity > 0) {
            const movement = {
                id: generateId(),
                productId: newProduct.id,
                productName: newProduct.name,
                productSku: newProduct.sku,
                type: 'in',
                quantity: newProduct.quantity,
                previousStock: 0,
                newStock: newProduct.quantity,
                reason: 'İlk stok girişi',
                createdAt: new Date().toISOString()
            };
            
            movements.unshift(movement);
            saveData();
        }
        
        console.log('✅ Ürün eklendi:', newProduct);
        showNotification(`"${newProduct.name}" başarıyla eklendi!`, 'success');
    }
}

// Ürünleri tabloda göster
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    
    if (!tbody) {
        console.warn('⚠️ Ürün tablosu bulunamadı');
        return;
    }
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-box-open"></i>
                    <div>Henüz ürün eklenmemiş</div>
                    <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">
                        Yukarıdaki formu kullanarak ilk ürününüzü ekleyin
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map((product, index) => {
        const isLowStock = product.quantity <= product.minStock;
        const statusClass = isLowStock ? 'status-low' : 'status-normal';
        const statusText = isLowStock ? 'Düşük Stok' : 'Normal';
        const statusIcon = isLowStock ? 'fa-exclamation-triangle' : 'fa-check-circle';
        
        return `
            <tr ${isLowStock ? 'style="background: rgba(245, 101, 101, 0.05);"' : ''}>
                <td><strong>${product.sku}</strong></td>
                <td>${product.name}</td>
                <td>${product.description || '-'}</td>
                <td>
                    <span style="font-weight: bold; color: ${isLowStock ? '#e53e3e' : '#48bb78'};">
                        ${product.quantity.toLocaleString('tr-TR')}
                    </span>
                </td>
                <td>${product.minStock.toLocaleString('tr-TR')}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </span>
                </td>
                <td>
                    <button onclick="editProduct(${index})" class="btn btn-warning btn-small" title="Ürünü düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${index})" class="btn btn-danger btn-small" title="Ürünü sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log(`📊 ${products.length} ürün listelendi`);
}

// Ürün düzenleme modalını aç
function editProduct(index) {
    const product = products[index];
    if (!product) {
        showNotification('Ürün bulunamadı!', 'error');
        return;
    }
    
    editingProductIndex = index;
    
    // Modal alanlarını doldur
    document.getElementById('editIndex').value = index;
    document.getElementById('editSku').value = product.sku;
    document.getElementById('editName').value = product.name;
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editQuantity').value = product.quantity;
    document.getElementById('editMinStock').value = product.minStock;
    
    // Modal'ı göster
    document.getElementById('editModal').style.display = 'block';
    document.getElementById('editName').focus();
    
    console.log('✏️ Düzenleme modalı açıldı:', product.name);
}

// Düzenleme formunu işle
function handleEditSubmit(e) {
    e.preventDefault();
    
    const index = editingProductIndex;
    if (index === null || !products[index]) {
        showNotification('Düzenlenecek ürün bulunamadı!', 'error');
        closeEditModal();
        return;
    }
    
    const originalProduct = products[index];
    
    // Güncellenmiş veriler
    const updatedData = {
        sku: document.getElementById('editSku').value.trim().toUpperCase(),
        name: document.getElementById('editName').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        quantity: parseInt(document.getElementById('editQuantity').value) || 0,
        minStock: parseInt(document.getElementById('editMinStock').value) || 0
    };
    
    // Validasyon
    if (!updatedData.sku || !updatedData.name) {
        showNotification('SKU kodu ve ürün adı zorunludur!', 'error');
        return;
    }
    
    if (updatedData.quantity < 0 || updatedData.minStock < 0) {
        showNotification('Miktar ve minimum stok negatif olamaz!', 'error');
        return;
    }
    
    // SKU benzersizlik kontrolü (kendisi hariç)
    const existingSku = products.find((p, i) => i !== index && p.sku === updatedData.sku);
    if (existingSku) {
        showNotification('Bu SKU kodu başka bir üründe kullanılıyor!', 'error');
        return;
    }
    
    // Stok değişikliği kontrolü
    const quantityDiff = updatedData.quantity - originalProduct.quantity;
    
    // Ürünü güncelle
    products[index] = {
        ...originalProduct,
        ...updatedData,
        updatedAt: new Date().toISOString()
    };
    
    // Stok değişikliği varsa hareket kaydı oluştur
    if (quantityDiff !== 0) {
        const movement = {
            id: generateId(),
            productId: originalProduct.id,
            productName: updatedData.name,
            productSku: updatedData.sku,
            type: quantityDiff > 0 ? 'in' : 'out',
            quantity: Math.abs(quantityDiff),
            previousStock: originalProduct.quantity,
            newStock: updatedData.quantity,
            reason: 'Manuel düzenleme',
            createdAt: new Date().toISOString()
        };
        
        movements.unshift(movement);
    }
    
    // Kaydet ve güncelle
    if (saveData()) {
        renderProducts();
        updateStats();
        closeEditModal();
        
        console.log('✅ Ürün güncellendi:', products[index]);
        showNotification(`"${updatedData.name}" başarıyla güncellendi!`, 'success');
        
        if (quantityDiff !== 0) {
            const changeText = quantityDiff > 0 ? `+${quantityDiff}` : quantityDiff;
            showNotification(`Stok değişikliği: ${changeText}`, 'info');
        }
    }
}

// Düzenleme modalını kapat
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingProductIndex = null;
    console.log('❌ Düzenleme modalı kapatıldı');
}

// Ürün silme
function deleteProduct(index) {
    const product = products[index];
    if (!product) {
        showNotification('Ürün bulunamadı!', 'error');
        return;
    }
    
    const confirmMessage = `"${product.name}" ürününü silmek istediğinizden emin misiniz?\n
    \nBu işlem geri alınamaz ve bu ürünle ilgili tüm hareket kayıtları da silinecektir.`;
    
    if (confirm(confirmMessage)) {
        // Ürünü sil
        products.splice(index, 1);
        
        // İlgili hareket kayıtlarını sil
        const movementsBefore = movements.length;
        movements = movements.filter(m => m.productId !== product.id);
        const movementsDeleted = movementsBefore - movements.length;
        
        // Kaydet ve güncelle
        if (saveData()) {
            renderProducts();
            updateStats();
            
            console.log('🗑️ Ürün ve hareket kayıtları silindi:', product.name);
            showNotification(`"${product.name}" ve ${movementsDeleted} hareket kaydı silindi!`, 'success');
        }
    }
}

// İstatistikleri güncelle
function updateStats() {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.minStock).length;
    const outOfStockProducts = products.filter(p => p.quantity === 0).length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    
    // Console'da göster
    console.log('📊 İstatistikler:', {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStock,
        totalMovements: movements.length
    });
    
    // Başlığı güncelle (düşük stok uyarısı)
    if (lowStockProducts > 0) {
        document.title = `(${lowStockProducts}) Düşük Stok - Stok Takip Sistemi`;
    } else {
        document.title = 'Stok Takip Sistemi';
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        warning: '#ed8936',
        info: '#4299e1'
    };
    
    // Basit alert (gelişmiş toast sistemi için)
    const icon = icons[type] || icons.info;
    const prefix = type.charAt(0).toUpperCase() + type.slice(1);
    
    console.log(`${prefix}: ${message}`);
    alert(`${prefix}: ${message}`);
    
    // Gelecekte toast notification buraya eklenebilir
}

// Unique ID üretme
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Tarih formatla
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Test verisi ekleme fonksiyonu
function addTestData() {
    const testProducts = [
        {
            id: generateId(),
            sku: 'LAP001',
            name: 'HP Pavilion Laptop',
            description: 'Intel i5, 8GB RAM, 256GB SSD',
            quantity: 15,
            minStock: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            sku: 'MOU001',
            name: 'Logitech Wireless Mouse',
            description: 'Kablosuz optik mouse',
            quantity: 3,
            minStock: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            sku: 'KEY001',
            name: 'Mechanical Keyboard',
            description: 'RGB ışıklı mekanik klavye',
            quantity: 25,
            minStock: 8,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            sku: 'MON001',
            name: 'Samsung 24" Monitor',
            description: 'Full HD IPS panel',
            quantity: 0,
            minStock: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            sku: 'HDD001',
            name: 'Seagate 1TB HDD',
            description: '7200RPM dahili hard disk',
            quantity: 45,
            minStock: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    // Hareket kayıtları
    const testMovements = [];
    const reasons = ['Tedarikçiden alım', 'Depo transferi', 'Sayım düzeltmesi', 'İade girişi'];
    const saleReasons = ['Müşteri satışı', 'Toptan satış', 'Online sipariş', 'Bayi satışı'];
    
    testProducts.forEach((product, index) => {
        if (product.quantity > 0) {
            testMovements.push({
                id: generateId(),
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                type: 'in',
                quantity: product.quantity,
                previousStock: 0,
                newStock: product.quantity,
                reason: reasons[Math.floor(Math.random() * reasons.length)],
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        // Rastgele bazı hareketler ekle
        if (Math.random() > 0.5 && product.quantity > 5) {
            const saleQuantity = Math.floor(Math.random() * 5) + 1;
            testMovements.push({
                id: generateId(),
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                type: 'out',
                quantity: saleQuantity,
                previousStock: product.quantity + saleQuantity,
                newStock: product.quantity,
                reason: saleReasons[Math.floor(Math.random() * saleReasons.length)],
                createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
    });
    
    products.push(...testProducts);
    movements.push(...testMovements);
    
    saveData().then(success => {
        if (success) {
            renderProducts();
            updateStats();
            console.log('🧪 Test verileri eklendi');
            showNotification(`${testProducts.length} test ürün ve ${testMovements.length} hareket kaydı eklendi!`, 'success');
        }
    });
}

// Verileri temizleme
async function clearAllData() {
    if (confirm('⚠️ TÜM VERİLER SİLİNECEK!\n\nBu işlem geri alınamaz. Emin misiniz?')) {
        products = [];
        movements = [];
        
        const success = await saveData();
        
        if (success) {
            renderProducts();
            updateStats();
            
            console.log('🧹 Tüm veriler temizlendi');
            showNotification('Tüm veriler başarıyla temizlendi!', 'success');
        }
    }
}

// JSON dosya bilgisi
function getStorageInfo() {
    console.log(`📦 Ürünler: ${products.length}`);
    console.log(`📊 Hareketler: ${movements.length}`);
    console.log(`💾 Veriler data.json dosyasında saklanıyor`);
    
    return { 
        products: products.length, 
        movements: movements.length,
        storage: 'data.json'
    };
}

// Zaman farkını hesapla (Dashboard ve Movements için ortak kullanım)
function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return formatDate(dateString);
}

// Dashboard'dan hızlı stok ekleme
function quickStockAdd(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('Ürün bulunamadı!', 'error');
        return;
    }
    
    const quantity = prompt(`"${product.name}" için eklenecek miktar:`, '10');
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
        return;
    }
    
    const addQuantity = parseInt(quantity);
    const previousStock = product.quantity;
    
    // Stoku güncelle
    product.quantity += addQuantity;
    product.updatedAt = new Date().toISOString();
    
    // Hareket kaydı oluştur
    const movement = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        type: 'in',
        quantity: addQuantity,
        previousStock: previousStock,
        newStock: product.quantity,
        reason: 'Hızlı stok ekleme',
        createdAt: new Date().toISOString()
    };
    
    movements.unshift(movement);
    
    if (saveData()) {
        showNotification(`${product.name} için ${addQuantity} adet eklendi!`, 'success');
        
        // Dashboard varsa güncelle
        if (typeof updateStatistics === 'function') updateStatistics();
        if (typeof renderLowStockAlerts === 'function') renderLowStockAlerts();
        if (typeof renderRecentMovements === 'function') renderRecentMovements();
    }
}

// ==================== JSON EXPORT/IMPORT ====================

// JSON dosyasına export
function exportToJSON() {
    if (products.length === 0 && movements.length === 0) {
        showNotification('Export edilecek veri bulunamadı!', 'warning');
        return;
    }
    
    try {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {
                products: products,
                movements: movements
            },
            stats: {
                totalProducts: products.length,
                totalMovements: movements.length,
                totalStock: products.reduce((sum, p) => sum + p.quantity, 0)
            }
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        
        // Dosya adı oluştur
        const now = new Date();
        const fileName = `stok_yedek_${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}.json`;
        
        // Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        
        URL.revokeObjectURL(link.href);
        
        console.log('📤 JSON Export başarılı:', fileName);
        showNotification(`Veriler JSON formatında kaydedildi! (${products.length} ürün, ${movements.length} hareket)`, 'success');
        
    } catch (error) {
        console.error('❌ JSON Export hatası:', error);
        showNotification('JSON export işlemi sırasında hata oluştu!', 'error');
    }
}

// JSON dosyasından import
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Dosya türü kontrolü
    if (!file.name.endsWith('.json')) {
        showNotification('Lütfen geçerli bir JSON dosyası seçin!', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Veri yapısı kontrolü
            if (!importData.data || !importData.data.products) {
                throw new Error('Geçersiz veri formatı');
            }
            
            const importedProducts = importData.data.products;
            const importedMovements = importData.data.movements || [];
            
            // Onay al
            const confirmMsg = `JSON Import\n\n` +
                `Dosya: ${file.name}\n` +
                `Ürün sayısı: ${importedProducts.length}\n` +
                `Hareket sayısı: ${importedMovements.length}\n\n` +
                `Mevcut veriler silinecek. Devam etmek istiyor musunuz?`;
            
            if (!confirm(confirmMsg)) {
                event.target.value = '';
                return;
            }
            
            // Verileri aktar
            products = importedProducts;
            movements = importedMovements;
            
            // Kaydet ve güncelle
            if (saveData()) {
                renderProducts();
                updateStats();
                
                console.log('📥 JSON Import başarılı');
                showNotification(`Import tamamlandı! (${products.length} ürün, ${movements.length} hareket)`, 'success');
            }
            
        } catch (error) {
            console.error('❌ JSON Import hatası:', error);
            showNotification('JSON dosyası okunamadı veya format hatalı!', 'error');
        }
        
        event.target.value = '';
    };
    
    reader.onerror = function() {
        showNotification('Dosya okuma hatası!', 'error');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Otomatik JSON yedekleme (LocalStorage'a ek olarak)
function autoBackupToJSON() {
    const lastBackup = localStorage.getItem('stokTakip_lastBackup');
    const now = Date.now();
    
    // Her 24 saatte bir yedek öner
    if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
        if (products.length > 0) {
            console.log('💡 Yedekleme önerisi: JSON dosyasına yedek almanız önerilir.');
        }
    }
}
