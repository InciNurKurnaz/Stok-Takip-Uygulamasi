// Movements sayfası için JavaScript kodları

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    // Movements sayfasında mıyız kontrol et (yerel dosya sistemi ve sunucu için)
    const isMovementsPage = window.location.href.includes('movements.html') || 
                           document.getElementById('movementForm') !== null;
    
    if (isMovementsPage) {
        console.log('🔄 Hareketler sayfası başlatılıyor...');
        await initializeMovementsPage();
    }
});

async function initializeMovementsPage() {
    await loadData(); // JSON'dan veri yükle
    populateProductSelectors();
    initializeMovementEventListeners();
    renderCurrentStock();
    renderMovements();
    updateStockSummary();
    console.log('✅ Hareketler sayfası hazır!');
}

function populateProductSelectors() {
    const productSelect = document.getElementById('productSelect');
    const filterSelect = document.getElementById('filterProduct');
    
    // Seçenekleri temizle
    productSelect.innerHTML = '<option value="">-- Ürün Seçin --</option>';
    filterSelect.innerHTML = '<option value="">Tüm Ürünler</option>';
    
    // Ürünleri ekle
    products.forEach(product => {
        const optionText = `${product.name} (${product.sku}) - Stok: ${product.quantity}`;
        
        const option1 = new Option(optionText, product.id);
        const option2 = new Option(optionText, product.id);
        
        productSelect.appendChild(option1);
        filterSelect.appendChild(option2);
    });
    
    console.log(`🔄 ${products.length} ürün dropdown'lara eklendi`);
}

function initializeMovementEventListeners() {
    // Hareket formu
    const movementForm = document.getElementById('movementForm');
    if (movementForm) {
        movementForm.addEventListener('submit', handleMovementSubmit);
    }
    
    // Ürün seçimi değiştiğinde stok bilgisi göster
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.addEventListener('change', showSelectedProductInfo);
    }
    
    // Filtreler
    const filterProduct = document.getElementById('filterProduct');
    const filterType = document.getElementById('filterType');
    const filterPeriod = document.getElementById('filterPeriod');
    
    if (filterProduct) filterProduct.addEventListener('change', renderMovements);
    if (filterType) filterType.addEventListener('change', renderMovements);
    if (filterPeriod) filterPeriod.addEventListener('change', renderMovements);
    
    // Geçmişi temizle
    const clearHistory = document.getElementById('clearHistory');
    if (clearHistory) {
        clearHistory.addEventListener('click', clearMovementHistory);
    }
}

function handleMovementSubmit(e) {
    e.preventDefault();
    console.log('📝 Yeni hareket kaydediliyor...');
    
    const productId = document.getElementById('productSelect').value;
    const movementType = document.getElementById('movementType').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const reason = document.getElementById('reason').value.trim();
    
    // Validasyon
    if (!productId) {
        showNotification('Lütfen bir ürün seçin!', 'error');
        return;
    }
    
    if (!movementType) {
        showNotification('Lütfen hareket türünü seçin!', 'error');
        return;
    }
    
    if (quantity <= 0) {
        showNotification('Miktar 0\'dan büyük olmalıdır!', 'error');
        return;
    }
    
    if (!reason) {
        showNotification('Lütfen açıklama girin!', 'error');
        return;
    }
    
    // Ürünü bul
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
        showNotification('Seçilen ürün bulunamadı!', 'error');
        return;
    }
    
    const product = products[productIndex];
    const previousStock = product.quantity;
    
    // Stok çıkışı kontrolü
    if (movementType === 'out') {
        if (quantity > previousStock) {
            const confirmMsg = `⚠️ UYARI!\n\nStokta sadece ${previousStock} adet var.\n${quantity} adet çıkış yapmak istiyorsunuz.\n\nBu işlem stoku ${quantity - previousStock} adet eksiye düşürecek.\n\nDevam etmek istediğinizden emin misiniz?`;
            
            if (!confirm(confirmMsg)) {
                return;
            }
        }
    }
    
    // Yeni stok hesapla
    const newStock = movementType === 'in' ? previousStock + quantity : previousStock - quantity;
    
    // Ürün stokunu güncelle
    products[productIndex].quantity = Math.max(0, newStock);
    products[productIndex].updatedAt = new Date().toISOString();
    
    // Hareket kaydı oluştur
    const movement = {
        id: generateId(),
        productId: productId,
        productName: product.name,
        productSku: product.sku,
        type: movementType,
        quantity: quantity,
        previousStock: previousStock,
        newStock: products[productIndex].quantity,
        reason: reason,
        createdAt: new Date().toISOString()
    };
    
    // Hareket listesinin başına ekle (en yeni önce)
    movements.unshift(movement);
    
    // Verileri kaydet
    if (saveData()) {
        // Arayüzü güncelle
        populateProductSelectors(); // Stok bilgileri güncellensin
        renderCurrentStock();
        renderMovements();
        updateStockSummary();
        
        // Formu temizle
        e.target.reset();
        document.getElementById('stockInfo').textContent = '';
        
        const typeText = movementType === 'in' ? 'Giriş' : 'Çıkış';
        console.log(`✅ ${typeText} hareketi kaydedildi:`, movement);
        showNotification(`${typeText} hareketi başarıyla kaydedildi! (${quantity} adet)`, 'success');
        
        // Düşük stok uyarısı
        if (products[productIndex].quantity <= products[productIndex].minStock) {
            setTimeout(() => {
                showNotification(`⚠️ "${product.name}" düşük stokta! (${products[productIndex].quantity} adet kaldı)`, 'warning');
            }, 1000);
        }
    }
}

function showSelectedProductInfo() {
    const productId = document.getElementById('productSelect').value;
    const stockInfo = document.getElementById('stockInfo');
    
    if (!productId || !stockInfo) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        stockInfo.textContent = '';
        return;
    }
    
    const isLowStock = product.quantity <= product.minStock;
    const statusText = isLowStock ? '⚠️ DÜŞÜK STOK' : '✅ Normal';
    
    stockInfo.innerHTML = `
        Mevcut stok: <strong>${product.quantity}</strong> adet | 
        Minimum: <strong>${product.minStock}</strong> adet | 
        Durum: <span style="color: ${isLowStock ? '#e53e3e' : '#48bb78'};">${statusText}</span>
    `;
    
    // Quantity input'una max değer ayarla (çıkış için)
    const quantityInput = document.getElementById('quantity');
    const movementType = document.getElementById('movementType').value;
    
    if (movementType === 'out' && quantityInput) {
        quantityInput.setAttribute('max', product.quantity);
        quantityInput.setAttribute('placeholder', `Maksimum ${product.quantity} adet`);
    } else if (quantityInput) {
        quantityInput.removeAttribute('max');
        quantityInput.setAttribute('placeholder', 'Miktar girin');
    }
}

function updateStockSummary() {
    const summaryDiv = document.getElementById('stockSummary');
    if (!summaryDiv) return;
    
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockProducts = products.filter(p => p.quantity <= p.minStock).length;
    const outOfStockProducts = products.filter(p => p.quantity === 0).length;
    
    summaryDiv.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-icon">📦</div>
                <div class="summary-content">
                    <h4>${totalProducts.toLocaleString('tr-TR')}</h4>
                    <p>Toplam Ürün</p>
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-icon">📊</div>
                <div class="summary-content">
                    <h4>${totalStock.toLocaleString('tr-TR')}</h4>
                    <p>Toplam Stok</p>
                </div>
            </div>
            <div class="summary-item ${lowStockProducts > 0 ? 'warning' : ''}">
                <div class="summary-icon">⚠️</div>
                <div class="summary-content">
                    <h4>${lowStockProducts.toLocaleString('tr-TR')}</h4>
                    <p>Düşük Stok</p>
                </div>
            </div>
            <div class="summary-item ${outOfStockProducts > 0 ? 'critical' : ''}">
                <div class="summary-icon">🚫</div>
                <div class="summary-content">
                    <h4>${outOfStockProducts.toLocaleString('tr-TR')}</h4>
                    <p>Stokta Yok</p>
                </div>
            </div>
        </div>
    `;
}

function renderCurrentStock() {
    const stockGrid = document.getElementById('stockGrid');
    if (!stockGrid) return;
    
    if (products.length === 0) {
        stockGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-box-open"></i>
                <p>Henüz ürün bulunmuyor</p>
                <a href="index.html" class="btn btn-primary">İlk Ürünü Ekle</a>
            </div>
        `;
        return;
    }
    
    // Ürünleri stok durumuna göre sırala (düşük stok önce)
    const sortedProducts = [...products].sort((a, b) => {
        const aLowStock = a.quantity <= a.minStock;
        const bLowStock = b.quantity <= b.minStock;
        
        if (aLowStock && !bLowStock) return -1;
        if (!aLowStock && bLowStock) return 1;
        
        return a.name.localeCompare(b.name);
    });
    
    stockGrid.innerHTML = sortedProducts.map(product => {
        const isLowStock = product.quantity <= product.minStock;
        const isOutOfStock = product.quantity === 0;
        const stockPercentage = Math.min((product.quantity / (product.minStock * 2)) * 100, 100);
        
        let statusClass = 'normal';
        let statusIcon = '✅';
        let statusText = 'Normal';
        
        if (isOutOfStock) {
            statusClass = 'critical';
            statusIcon = '🚫';
            statusText = 'Stokta Yok';
        } else if (isLowStock) {
            statusClass = 'warning';
            statusIcon = '⚠️';
            statusText = 'Düşük Stok';
        }
        
        return `
            <div class="stock-card ${isLowStock ? 'low-stock' : ''}" data-product-id="${product.id}">
                <div class="stock-card-header">
                    <h4>${product.name}</h4>
                    <span class="sku">${product.sku}</span>
                </div>
                
                <div class="stock-info">
                    <div class="current-stock">
                        <span class="stock-number">${product.quantity.toLocaleString('tr-TR')}</span>
                        <span class="stock-label">Mevcut</span>
                    </div>
                    <div class="min-stock">
                        <span class="stock-number">${product.minStock.toLocaleString('tr-TR')}</span>
                        <span class="stock-label">Minimum</span>
                    </div>
                </div>
                
                <div class="stock-bar">
                    <div class="stock-progress" style="width: ${stockPercentage}%"></div>
                </div>
                
                <div class="stock-status ${statusClass}">
                    ${statusIcon} ${statusText}
                </div>
                
                <div class="stock-actions">
                    <button onclick="quickStockIn('${product.id}')" class="btn btn-success btn-small">
                        <i class="fas fa-plus"></i> Giriş
                    </button>
                    <button onclick="quickStockOut('${product.id}')" class="btn btn-warning btn-small" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i> Çıkış
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderMovements() {
    const tbody = document.getElementById('movementsTableBody');
    if (!tbody) return;
    
    // Filtreleri al
    const productFilter = document.getElementById('filterProduct')?.value || '';
    const typeFilter = document.getElementById('filterType')?.value || '';
    const periodFilter = document.getElementById('filterPeriod')?.value || '';
    
    // Filtreleme
    let filteredMovements = [...movements];
    
    if (productFilter) {
        filteredMovements = filteredMovements.filter(m => m.productId === productFilter);
    }
    
    if (typeFilter) {
        filteredMovements = filteredMovements.filter(m => m.type === typeFilter);
    }
    
    if (periodFilter) {
        const now = new Date();
        let filterDate = new Date();
        
        switch (periodFilter) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setDate(now.getDate() - 30);
                break;
        }
        
        filteredMovements = filteredMovements.filter(m => 
            new Date(m.createdAt) >= filterDate
        );
    }
    
    if (filteredMovements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    <i class="fas fa-history"></i>
                    <div>${movements.length === 0 ? 'Henüz hareket kaydı yok' : 'Filtreye uygun hareket bulunamadı'}</div>
                    ${movements.length === 0 ? '<div style="margin-top: 10px;"><small>Yukarıdaki formu kullanarak ilk hareket kaydınızı oluşturun</small></div>' : ''}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredMovements.map(movement => {
        const isIncoming = movement.type === 'in';
        const typeClass = isIncoming ? 'movement-in' : 'movement-out';
        const typeIcon = isIncoming ? 'fa-arrow-up' : 'fa-arrow-down';
        const typeText = isIncoming ? 'Giriş' : 'Çıkış';
        const quantityPrefix = isIncoming ? '+' : '-';
        
        return `
            <tr>
                <td>
                    <div style="font-size: 14px; font-weight: bold;">${formatDate(movement.createdAt)}</div>
                    <div style="font-size: 12px; color: #718096;">${getTimeAgo(movement.createdAt)}</div>
                </td>
                <td><strong>${movement.productName}</strong></td>
                <td><code>${movement.productSku}</code></td>
                <td>
                    <span class="movement-type ${typeClass}">
                        <i class="fas ${typeIcon}"></i> ${typeText}
                    </span>
                </td>
                <td>
                    <span class="quantity ${typeClass}" style="font-size: 16px;">
                        ${quantityPrefix}${movement.quantity.toLocaleString('tr-TR')}
                    </span>
                </td>
                <td>${movement.previousStock.toLocaleString('tr-TR')}</td>
                <td>
                    <strong style="color: ${movement.newStock <= 0 ? '#e53e3e' : '#48bb78'};">
                        ${movement.newStock.toLocaleString('tr-TR')}
                    </strong>
                </td>
                <td>${movement.reason}</td>
                <td>
                    <button onclick="deleteMovement('${movement.id}')" class="btn btn-danger btn-mini" title="Hareketi sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log(`📊 ${filteredMovements.length}/${movements.length} hareket gösteriliyor`);
}

// Hızlı stok giriş
function quickStockIn(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = prompt(`${product.name} için kaç adet stok girişi yapacaksınız?`, '10');
    
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        const parsedQuantity = parseInt(quantity);
        const reason = prompt('Giriş sebebini belirtin:', 'Hızlı stok girişi');
        
        if (reason) {
            addQuickMovement(productId, 'in', parsedQuantity, reason);
        }
    }
}

// Hızlı stok çıkış
function quickStockOut(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.quantity <= 0) {
        showNotification('Bu üründe stok bulunmuyor!', 'error');
        return;
    }
    
    const maxQuantity = product.quantity;
    const quantity = prompt(
        `${product.name} için kaç adet stok çıkışı yapacaksınız?\n\nMevcut stok: ${maxQuantity} adet`, 
        Math.min(5, maxQuantity).toString()
    );
    
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        const parsedQuantity = parseInt(quantity);
        
        if (parsedQuantity > maxQuantity) {
            if (!confirm(`Stokta sadece ${maxQuantity} adet var. ${parsedQuantity} adet çıkış yapmak istediğinizden emin misiniz?`)) {
                return;
            }
        }
        
        const reason = prompt('Çıkış sebebini belirtin:', 'Hızlı stok çıkışı');
        
        if (reason) {
            addQuickMovement(productId, 'out', parsedQuantity, reason);
        }
    }
}

// Hızlı hareket ekleme
function addQuickMovement(productId, type, quantity, reason) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = products[productIndex];
    const previousStock = product.quantity;
    const newStock = type === 'in' ? previousStock + quantity : previousStock - quantity;
    
    // Ürün stokunu güncelle
    products[productIndex].quantity = Math.max(0, newStock);
    products[productIndex].updatedAt = new Date().toISOString();
    
    // Hareket kaydı oluştur
    const movement = {
        id: generateId(),
        productId: productId,
        productName: product.name,
        productSku: product.sku,
        type: type,
        quantity: quantity,
        previousStock: previousStock,
        newStock: products[productIndex].quantity,
        reason: reason,
        createdAt: new Date().toISOString()
    };
    
    movements.unshift(movement);
    
    if (saveData()) {
        populateProductSelectors();
        renderCurrentStock();
        renderMovements();
        updateStockSummary();
        
        const typeText = type === 'in' ? 'Giriş' : 'Çıkış';
        showNotification(`${typeText} hareketi kaydedildi! (${quantity} adet)`, 'success');
    }
}

function deleteMovement(movementId) {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) {
        showNotification('Hareket kaydı bulunamadı!', 'error');
        return;
    }
    
    const confirmMsg = `Bu hareket kaydını silmek istediğinizden emin misiniz?\n\n` +
                      `Ürün: ${movement.productName}\n` +
                      `Hareket: ${movement.type === 'in' ? 'Giriş' : 'Çıkış'}\n` +
                      `Miktar: ${movement.quantity}\n` +
                      `Tarih: ${formatDate(movement.createdAt)}\n\n` +
                      `⚠️ Bu işlem stok düzeltmesi yapacaktır!`;
    
    if (!confirm(confirmMsg)) return;
    
    // Hareketi geri al
    const productIndex = products.findIndex(p => p.id === movement.productId);
    if (productIndex !== -1) {
        // Ters işlem yap
        const reverseQuantity = movement.type === 'in' ? -movement.quantity : movement.quantity;
        products[productIndex].quantity = Math.max(0, products[productIndex].quantity + reverseQuantity);
        products[productIndex].updatedAt = new Date().toISOString();
        
        console.log(`🔄 Stok düzeltmesi: ${movement.productName} - ${reverseQuantity > 0 ? '+' : ''}${reverseQuantity}`);
    }
    
    // Hareketi sil
    const movementIndex = movements.findIndex(m => m.id === movementId);
    if (movementIndex !== -1) {
        movements.splice(movementIndex, 1);
    }
    
    if (saveData()) {
        populateProductSelectors();
        renderCurrentStock();
        renderMovements();
        updateStockSummary();
        
        showNotification('Hareket kaydı silindi ve stok düzeltmesi yapıldı!', 'success');
    }
}

function clearMovementHistory() {
    if (movements.length === 0) {
        showNotification('Temizlenecek hareket kaydı yok!', 'info');
        return;
    }
    
    const confirmMsg = `⚠️ TÜM HAREKET GEÇMİŞİNİ TEMİZLE\n\n` +
                      `${movements.length} adet hareket kaydı silinecektir.\n\n` +
                      `Bu işlem GERİ ALINAMAZ ve stok düzeltmesi YAPMAZ!\n` +
                      `Sadece hareket geçmişi temizlenir.\n\n` +
                      `Devam etmek istediğinizden emin misiniz?`;
    
    if (!confirm(confirmMsg)) return;
    
    movements = [];
    
    if (saveData()) {
        renderMovements();
        showNotification('Tüm hareket geçmişi temizlendi!', 'success');
    }
}

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    return formatDate(dateString);
}

// Hareket türü değiştiğinde form güncelle
document.addEventListener('change', function(e) {
    if (e.target.id === 'movementType') {
        showSelectedProductInfo(); // Stok bilgisini güncelle
    }
});

// Sayfa her yenilendiğinde verileri güncelle
setInterval(() => {
    if (window.location.pathname.includes('movements.html')) {
        updateStockSummary();
    }
}, 30000); // 30 saniyede bir