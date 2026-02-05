// Dashboard sayfası için JavaScript kodları
let stockChart = null;
let movementChart = null;
let dashboardUpdateInterval = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    // Dashboard sayfasında mıyız kontrol et (yerel dosya sistemi ve sunucu için)
    const isDashboardPage = window.location.href.includes('dashboard.html') || 
                           document.getElementById('stockChart') !== null;
    
    if (isDashboardPage) {
        console.log('📊 Dashboard başlatılıyor...');
        await initializeDashboard();
    }
});

async function initializeDashboard() {
    await loadData();
    updateStatistics();
    renderLowStockAlerts();
    renderRecentMovements();
    createCharts();
    
    // Otomatik güncelleme (her 5 saniyede bir)
    dashboardUpdateInterval = setInterval(async () => {
        await loadData();
        updateStatistics();
        renderLowStockAlerts();
        renderRecentMovements();
        updateCharts();
    }, 5000);
    
    console.log('✅ Dashboard hazır!');
}

// Sayfa değiştiğinde interval'i temizle
window.addEventListener('beforeunload', function() {
    if (dashboardUpdateInterval) {
        clearInterval(dashboardUpdateInterval);
    }
});

function updateStatistics() {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockProducts = products.filter(p => p.quantity <= p.minStock).length;
    const outOfStockProducts = products.filter(p => p.quantity === 0).length;
    const totalMovements = movements.length;
    
    // İstatistik değerlerini güncelle
    updateStatElement('totalProducts', totalProducts);
    updateStatElement('totalStock', totalStock.toLocaleString('tr-TR'));
    updateStatElement('lowStockProducts', lowStockProducts);
    updateStatElement('totalMovements', totalMovements);
    
    // Düşük stok kartını renklendir ve animasyon ekle
    const lowStockCard = document.querySelector('.stat-card.warning');
    if (lowStockCard) {
        if (lowStockProducts > 0) {
            lowStockCard.style.animation = 'pulse 2s infinite';
            lowStockCard.style.transform = 'scale(1.02)';
        } else {
            lowStockCard.style.animation = 'none';
            lowStockCard.style.transform = 'scale(1)';
        }
    }
    
    // Başlığı güncelle
    if (lowStockProducts > 0) {
        document.title = `(${lowStockProducts}) Düşük Stok - Dashboard`;
    } else {
        document.title = 'Dashboard - Stok Takip Sistemi';
    }
    
    console.log('📊 İstatistikler güncellendi:', {
        totalProducts,
        totalStock,
        lowStockProducts,
        outOfStockProducts,
        totalMovements
    });
}

function updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== value.toString()) {
        element.style.transform = 'scale(1.1)';
        element.textContent = value;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

function renderLowStockAlerts() {
    const alertsContainer = document.getElementById('lowStockAlerts');
    if (!alertsContainer) return;
    
    const lowStockProducts = products.filter(p => p.quantity <= p.minStock);
    
    if (lowStockProducts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>Tüm ürünler yeterli stok seviyesinde! 🎉</p>
            </div>
        `;
        return;
    }
    
    // Kritiklik seviyesine göre sırala
    const sortedProducts = lowStockProducts.sort((a, b) => {
        const aUrgency = a.quantity === 0 ? 3 : a.quantity < (a.minStock * 0.5) ? 2 : 1;
        const bUrgency = b.quantity === 0 ? 3 : b.quantity < (b.minStock * 0.5) ? 2 : 1;
        return bUrgency - aUrgency;
    });
    
    alertsContainer.innerHTML = sortedProducts.map(product => {
        const urgencyLevel = product.quantity === 0 ? 'critical' : 
                           product.quantity < (product.minStock * 0.5) ? 'high' : 'medium';
        
        const urgencyIcon = product.quantity === 0 ? '🚫' : 
                          product.quantity < (product.minStock * 0.5) ? '🔴' : '🟡';
        
        const stockPercentage = Math.max((product.quantity / product.minStock) * 100, 0);
        
        return `
            <div class="alert-item ${urgencyLevel}">
                <div class="alert-content">
                    <div class="alert-title">
                        <strong>${product.name}</strong>
                        <span class="sku-badge">${product.sku}</span>
                    </div>
                    <div class="alert-details">
                        ${urgencyIcon} Kalan: <strong>${product.quantity}</strong> | 
                        Minimum: <strong>${product.minStock}</strong> | 
                        Durum: <strong>${stockPercentage.toFixed(0)}%</strong>
                        ${product.quantity === 0 ? ' | <span class="out-of-stock">STOKTA YOK!</span>' : ''}
                    </div>
                    <div class="alert-progress">
                        <div class="progress-bar ${urgencyLevel}" style="width: ${Math.max(stockPercentage, 5)}%"></div>
                    </div>
                </div>
                <div class="alert-actions">
                    <button onclick="quickStockAdd('${product.id}')" class="btn btn-mini btn-primary">
                        <i class="fas fa-plus"></i> Hızlı Stok
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecentMovements() {
    const movementsContainer = document.getElementById('recentMovements');
    if (!movementsContainer) return;
    
    const recentMovements = movements.slice(0, 10); // Son 10 hareket
    
    if (recentMovements.length === 0) {
        movementsContainer.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-history"></i>
                <p>Henüz hareket kaydı bulunmuyor</p>
                <a href="movements.html" class="btn btn-primary btn-small">İlk Hareketi Ekle</a>
            </div>
        `;
        return;
    }
    
    movementsContainer.innerHTML = recentMovements.map(movement => {
        const isIncoming = movement.type === 'in';
        const typeIcon = isIncoming ? 'fa-arrow-up' : 'fa-arrow-down';
        const typeClass = isIncoming ? 'movement-in' : 'movement-out';
        const typeText = isIncoming ? 'Giriş' : 'Çıkış';
        const timeAgo = getTimeAgo(movement.createdAt);
        const quantityPrefix = isIncoming ? '+' : '-';
        
        return `
            <div class="alert-item">
                <div class="alert-content">
                    <div class="alert-title">
                        <span class="movement-icon ${typeClass}">
                            <i class="fas ${typeIcon}"></i>
                        </span>
                        <strong>${movement.productName}</strong>
                        <span class="sku-badge">${movement.productSku}</span>
                    </div>
                    <div class="alert-details">
                        ${typeText}: <strong>${quantityPrefix}${movement.quantity}</strong> adet |
                        ${movement.reason} |
                        <small>${timeAgo}</small>
                    </div>
                    <div class="stock-change">
                        ${movement.previousStock} → <strong style="color: 
                        ${movement.newStock <= movement.previousStock && movement.newStock <= 0 ? '#e53e3e' : '#48bb78'};">
                        ${movement.newStock}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function createCharts() {
    createStockChart();
    createMovementChart();
}

function createStockChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    
    if (products.length === 0) {
        chartCtx.clearRect(0, 0, ctx.width, ctx.height);
        chartCtx.fillStyle = '#ccc';
        chartCtx.font = '16px Arial';
        chartCtx.textAlign = 'center';
        chartCtx.fillText('Henüz ürün bulunmuyor', ctx.width / 2, ctx.height / 2);
        return;
    }
    
    // Stok durumuna göre renk belirle
    const chartData = products.map(product => ({
        label: `${product.name} (${product.sku})`,
        value: product.quantity,
        color: product.quantity === 0 ? '#e53e3e' : 
               product.quantity <= product.minStock ? '#ed8936' : '#48bb78',
        borderColor: '#fff'
    }));
    
    // Önceki grafiği temizle
    if (stockChart) {
        stockChart.destroy();
    }
    
    stockChart = new Chart(chartCtx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(item => item.label),
            datasets: [{
                data: chartData.map(item => item.value),
                backgroundColor: chartData.map(item => item.color),
                borderColor: chartData.map(item => item.borderColor),
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
    });
    console.log('📈 Stok grafiği oluşturuldu');
}

function createMovementChart() {
    const ctx = document.getElementById('movementChart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    
    if (movements.length === 0) {
        chartCtx.clearRect(0, 0, ctx.width, ctx.height);
        chartCtx.fillStyle = '#ccc';
        chartCtx.font = '16px Arial';
        chartCtx.textAlign = 'center';
        chartCtx.fillText('Henüz hareket bulunmuyor', ctx.width / 2, ctx.height / 2);
        return;
    }
    
    // Son 7 günün hareketlerini grupla
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
        
        const dayMovements = movements.filter(m => {
            const mDate = new Date(m.createdAt);
            return mDate.toDateString() === date.toDateString();
        });
        
        const inCount = dayMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0);
        const outCount = dayMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0);
        
        last7Days.push({ date: dateStr, in: inCount, out: outCount });
    }
    
    // Önceki grafiği temizle
    if (movementChart) {
        movementChart.destroy();
    }
    
    movementChart = new Chart(chartCtx, {
        type: 'bar',
        data: {
            labels: last7Days.map(d => d.date),
            datasets: [
                {
                    label: 'Giriş',
                    data: last7Days.map(d => d.in),
                    backgroundColor: '#48bb78',
                    borderColor: '#38a169',
                    borderWidth: 1
                },
                {
                    label: 'Çıkış',
                    data: last7Days.map(d => d.out),
                    backgroundColor: '#f56565',
                    borderColor: '#e53e3e',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    console.log('📊 Hareket grafiği oluşturuldu');
}

function updateCharts() {
    createStockChart();
    createMovementChart();
}