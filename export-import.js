// CSV Import/Export İşlemleri

// LocalStorage kapasite kontrolü fonksiyonu
function checkStorageLimit() {
    try {
        // 1 MB'lık test veri oluştur
        const testKey = '__storage_test__';
        const testData = 'x'.repeat(1024 * 1024); // 1 MB

        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        console.error("❌ Storage sınırı aşıldı:", e);
        return false;
    }
}

// CSV Export Fonksiyonu
function exportToCSV() {
    if (products.length === 0) {
        showNotification('Export edilecek ürün bulunamadı!', 'warning');
        return;
    }
    
    try {
        // CSV başlık satırı
        const headers = [
            'SKU',
            'Ürün Adı',
            'Açıklama', 
            'Miktar',
            'Minimum Stok',
            'Durum',
            'Oluşturma Tarihi',
            'Güncelleme Tarihi'
        ];
        
        // Veri satırları
        const csvData = products.map(product => {
            const isLowStock = product.quantity <= product.minStock;
            const status = product.quantity === 0 ? 'Stokta Yok' : 
                          isLowStock ? 'Düşük Stok' : 'Normal';
            
            return [
                product.sku,
                product.name,
                product.description || '',
                product.quantity,
                product.minStock,
                status,
                formatDate(product.createdAt),
                formatDate(product.updatedAt)
            ];
        });
        
        // CSV içeriğini oluştur
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => 
                row.map(cell => {
                    // Virgül içeren değerleri tırnak içine al
                    const cellStr = String(cell);
                    return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
                        ? `"${cellStr.replace(/"/g, '""')}"` 
                        : cellStr;
                }).join(',')
            )
        ].join('\n');
        
        // BOM ekleyerek Türkçe karakter desteği
        const BOM = '\uFEFF';
        const csvBlob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        // Dosya adı oluştur
        const now = new Date();
        const fileName = `stok_urunler_${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}.csv`;
        
        // Download linki oluştur
        const link = document.createElement('a');
        link.href = URL.createObjectURL(csvBlob);
        link.download = fileName;
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(link.href);
        
        console.log('📤 CSV Export başarılı:', fileName);
        showNotification(`${products.length} ürün CSV formatında export edildi!`, 'success');
        
    } catch (error) {
        console.error('❌ CSV Export hatası:', error);
        showNotification('CSV export işlemi sırasında hata oluştu!', 'error');
    }
}

// CSV Import Fonksiyonu  
function importFromCSV(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showNotification('Lütfen sadece .csv uzantılı dosya seçin!', 'error');
        event.target.value = ''; // Input'u temizle
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('Dosya boyutu 5MB\'den büyük olamaz!', 'error');
        event.target.value = '';
        return;
    }
    
    console.log('📥 CSV Import başlatılıyor:', file.name);
    
    // PapaParse ile CSV'yi oku
    Papa.parse(file, {
        header: true,
        encoding: 'UTF-8',
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: function(header) {
            // Header temizleme ve normalleştirme
            return header.trim().toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
        },
        complete: function(results) {
            processCSVImport(results, file.name);
            event.target.value = ''; // Input'u temizle
        },
        error: function(error) {
            console.error('❌ CSV Parse hatası:', error);
            showNotification('CSV dosyası okunamadı! Dosya formatını kontrol edin.', 'error');
            event.target.value = '';
        }
    });
}

function processCSVImport(results, fileName) {
    const csvData = results.data;
    if (!csvData || csvData.length === 0) return;

    csvData.forEach(row => {
        // Mevcut SKU kontrolü
        const existingIndex = products.findIndex(p => p.sku === row.sku);
        const newProduct = {
            id: generateId(),
            sku: row.sku || `SKU-${Date.now()}`,
            name: row.ürün_adı || row.name || "Adsız Ürün",
            description: row.açıklama || "",
            quantity: parseInt(row.miktar) || 0,
            minStock: parseInt(row.minimum_stok) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existingIndex === -1) {
            products.push(newProduct);
        } else {
            products[existingIndex] = { ...products[existingIndex], ...newProduct, id: products[existingIndex].id };
        }
    });

    saveData();
    renderProducts(); // index.html'deysen
    showNotification('CSV Başarıyla içe aktarıldı', 'success');
}