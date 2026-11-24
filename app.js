// Inisialisasi AOS
if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true, offset: 50 });
}

const API_BASE = 'https://dummyjson.com/products';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProductsData = [];

// --- DATA CADANGAN (Jika API Gagal karena CORS/Internet) ---
const fallbackProducts = [
    { id: 1, title: "Essence Mascara Lash Princess", price: 9.99, discountPercentage: 10.48, rating: 4.94, thumbnail: "https://cdn.dummyjson.com/product-images/1/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/1/1.jpg"] },
    { id: 2, title: "Eyeshadow Palette with Mirror", price: 19.99, discountPercentage: 18.19, rating: 3.28, thumbnail: "https://cdn.dummyjson.com/product-images/2/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/2/1.jpg"] },
    { id: 3, title: "Powder Canister", price: 14.99, discountPercentage: 9.84, rating: 3.82, thumbnail: "https://cdn.dummyjson.com/product-images/3/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/3/1.jpg"] },
    { id: 4, title: "Red Lipstick", price: 12.99, discountPercentage: 12.6, rating: 4.52, thumbnail: "https://cdn.dummyjson.com/product-images/4/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/4/1.jpg"] },
    { id: 5, title: "Red Nail Polish", price: 8.99, discountPercentage: 11.44, rating: 4.32, thumbnail: "https://cdn.dummyjson.com/product-images/5/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/5/1.jpg"] },
    { id: 6, title: "Calvin Klein CK One", price: 49.99, discountPercentage: 1.89, rating: 4.37, thumbnail: "https://cdn.dummyjson.com/product-images/6/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/6/1.jpg"] },
    { id: 7, title: "Chanel Coco Noir Eau De", price: 129.99, discountPercentage: 16.51, rating: 4.26, thumbnail: "https://cdn.dummyjson.com/product-images/7/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/7/1.jpg"] },
    { id: 8, title: "Dior J'adore", price: 89.99, discountPercentage: 14.72, rating: 3.8, thumbnail: "https://cdn.dummyjson.com/product-images/8/thumbnail.jpg", images: ["https://cdn.dummyjson.com/product-images/8/1.jpg"] }
];

// ==========================================
// UTILITIES
// ==========================================
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

function updateCartBadge() {
    const badges = document.querySelectorAll('#cart-badge, .cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    badges.forEach(badge => badge.textContent = totalItems);
}

function showToast(icon, title) {
    if(typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false,
            timer: 2000, timerProgressBar: true
        });
        Toast.fire({ icon: icon, title: title });
    } else {
        alert(title);
    }
}

// ==========================================
// LOGIKA HALAMAN BERANDA (index.html)
// ==========================================
async function initHomePage() {
    updateCartBadge();
    startCountdown();
    
    const allProdContainer = document.getElementById('all-products-container');
    if(allProdContainer) {
        allProdContainer.innerHTML = '<div class="col-12 text-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Memuat produk...</p></div>';
    }

    try {
        const catRes = await fetch(`${API_BASE}/categories`);
        if (!catRes.ok) throw new Error('Gagal fetch kategori');
        const categories = await catRes.json();
        renderCategories(categories);

        const prodRes = await fetch(`${API_BASE}?limit=50`);
        if (!prodRes.ok) throw new Error('Gagal fetch produk');
        const prodData = await prodRes.json();
        
        allProductsData = prodData.products;

        renderFlashSale(allProductsData);
        renderAllProducts(allProductsData, 8);
        renderBestSeller(allProductsData);
        renderDiscounts(allProductsData);

        let currentLimit = 8;
        const loadMoreBtn = document.getElementById('load-more-btn');
        if(loadMoreBtn) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.onclick = () => {
                currentLimit += 8;
                renderAllProducts(allProductsData, currentLimit);
                if (currentLimit >= allProductsData.length) {
                    loadMoreBtn.style.display = 'none';
                }
            };
        }

    } catch (error) {
        console.warn("API gagal, menggunakan data cadangan:", error);
        
        allProductsData = fallbackProducts;
        const loadMoreBtn = document.getElementById('load-more-btn');
        if(loadMoreBtn) loadMoreBtn.style.display = 'none';

        renderCategories(['beauty', 'fragrances', 'furniture', 'groceries']);
        renderFlashSale(allProductsData);
        renderAllProducts(allProductsData, 8);
        renderBestSeller(allProductsData);
        renderDiscounts(allProductsData);
        
        showToast('info', 'Menampilkan data contoh (API offline)');
    }
}

function createProductCard(product) {
    const kurs = 15000; 
    const originalPrice = product.price * kurs;
    const discount = product.discountPercentage || 0;
    const finalPrice = originalPrice - (originalPrice * discount / 100);
    
    // LOGIKA FOTO PRODUK: Gunakan images[0] jika ada, jika tidak gunakan thumbnail
    // Ini memastikan foto yang tampil adalah foto resolusi tinggi/spesifik, bukan dummy.
    let imageUrl = product.thumbnail;
    if (product.images && product.images.length > 0) {
        imageUrl = product.images[0]; 
    }

    let stars = '';
    for(let i=1; i<=5; i++) {
        stars += (i <= Math.round(product.rating)) ? '<i class="bi bi-star-fill text-warning fs-6"></i>' : '<i class="bi bi-star text-warning fs-6"></i>';
    }

    return `
        <div class="col-6 col-md-4 col-lg-3 mb-4" data-aos="fade-up">
            <div class="card product-card">
                <div class="product-img-wrapper">
                    <img src="${imageUrl}" class="product-img" alt="${product.title}" onerror="this.src='${product.thumbnail}'">
                </div>
                <div class="card-body d-flex flex-column p-3">
                    <h6 class="card-title text-truncate fw-bold" title="${product.title}">${product.title}</h6>
                    <div class="mb-2">${stars} <small class="text-muted">(${product.rating})</small></div>
                    <div class="mt-auto">
                        ${discount > 0 ? `<div class="text-discount">${formatRupiah(originalPrice)}</div>` : '<div style="height:20px;"></div>'}
                        <div class="price-text mb-2">${formatRupiah(finalPrice)}</div>
                        <button class="btn btn-primary btn-sm w-100" onclick="addToCart(${product.id}, '${product.title.replace(/'/g, "\\'")}', ${finalPrice}, '${imageUrl}')">
                            <i class="bi bi-cart-plus"></i> Beli
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCategories(categories) {
    const container = document.getElementById('kategori-container');
    if(!container) return;
    container.innerHTML = categories.slice(0, 6).map(cat => `
        <div class="col-4 col-md-2 mb-3" data-aos="zoom-in">
            <div class="card text-center py-3 shadow-sm h-100 border-0 category-card" style="cursor:pointer;" onclick="alert('Menampilkan kategori: ${cat}')">
                <i class="bi bi-tags fs-2 text-primary mb-2"></i>
                <small class="fw-bold text-capitalize">${cat.replace('-', ' ')}</small>
            </div>
        </div>
    `).join('');
}

function renderAllProducts(products, limit) {
    const container = document.getElementById('all-products-container');
    if(!container) return;
    container.innerHTML = products.slice(0, limit).map(createProductCard).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
}

function renderFlashSale(products) {
    const container = document.getElementById('flashsale-container');
    if(!container) return;
    const flashSale = products.filter(p => p.discountPercentage > 10).slice(0, 4);
    container.innerHTML = flashSale.map(createProductCard).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
}

function renderBestSeller(products) {
    const container = document.getElementById('best-seller-container');
    if(!container) return;
    const best = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
    container.innerHTML = best.map(createProductCard).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
}

function renderDiscounts(products) {
    const container = document.getElementById('discount-container');
    if(!container) return;
    const discounts = products.filter(p => p.discountPercentage > 0).slice(0, 4);
    container.innerHTML = discounts.map(createProductCard).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
}

// Pencarian
document.getElementById('search-btn')?.addEventListener('click', async () => {
    const keyword = document.getElementById('search-input').value.trim();
    if(!keyword) return showToast('warning', 'Masukkan kata kunci');

    const resContainer = document.getElementById('search-results-container');
    resContainer.innerHTML = '<div class="text-center w-100"><div class="spinner-border text-light"></div></div>';

    try {
        const response = await fetch(`${API_BASE}/search?q=${keyword}`);
        const data = await response.json();
        
        if(data.products.length === 0) {
            resContainer.innerHTML = '<h5 class="text-center w-100 text-white">Produk tidak ditemukan.</h5>';
        } else {
            resContainer.innerHTML = data.products.slice(0, 4).map(createProductCard).join('');
            if (typeof AOS !== 'undefined') AOS.refresh();
        }
    } catch (error) {
        showToast('error', 'Gagal mencari produk (API Offline)');
        resContainer.innerHTML = '';
    }
});

function startCountdown() {
    const countdownEl = document.getElementById('countdown');
    if(!countdownEl) return;
    let timeInSecs = (2 * 60 * 60) + (30 * 60); 
    setInterval(() => {
        const hours = Math.floor(timeInSecs / 3600);
        const minutes = Math.floor((timeInSecs % 3600) / 60);
        const seconds = timeInSecs % 60;
        countdownEl.innerHTML = `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
        if (timeInSecs > 0) timeInSecs--;
        else countdownEl.innerHTML = "Berakhir!";
    }, 1000);
}

// ==========================================
// LOGIKA KERANJANG (Global)
// ==========================================
window.addToCart = function(id, title, price, thumbnail) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id, title, price, thumbnail, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showToast('success', 'Berhasil masuk keranjang!');
}

// ==========================================
// LOGIKA HALAMAN KERANJANG (cart.html)
// ==========================================
function renderCartPage() {
    updateCartBadge();
    const container = document.getElementById('cart-items-container');
    const btnCheckout = document.getElementById('checkout-btn');
    
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x display-1 text-muted"></i>
                <h4 class="mt-3">Keranjangmu masih kosong</h4>
                <a href="index.html" class="btn btn-primary mt-3">Mulai Belanja</a>
            </div>
        `;
        updateSummary(0);
        if(btnCheckout) btnCheckout.classList.add('disabled');
        return;
    }

    if(btnCheckout) btnCheckout.classList.remove('disabled');
    let subtotal = 0;

    container.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        return `
            <div class="d-flex align-items-center border-bottom py-3 flex-wrap flex-md-nowrap">
                <img src="${item.thumbnail}" class="cart-item-img me-3 mb-2 mb-md-0">
                <div class="flex-grow-1 me-2">
                    <h6 class="mb-1 text-truncate" style="max-width: 250px;">${item.title}</h6>
                    <span class="text-muted small">${formatRupiah(item.price)}</span>
                </div>
                <div class="d-flex align-items-center me-3 mt-2 mt-md-0">
                    <button class="btn btn-sm btn-outline-secondary" onclick="changeQty(${index}, -1)">-</button>
                    <input type="text" class="form-control form-control-sm qty-input mx-1" value="${item.qty}" readonly>
                    <button class="btn btn-sm btn-outline-secondary" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <div class="fw-bold text-end mt-2 mt-md-0" style="min-width:100px;">
                    ${formatRupiah(itemTotal)}
                </div>
                <button class="btn btn-sm btn-danger ms-0 ms-md-3 mt-2 mt-md-0" onclick="removeItem(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    updateSummary(subtotal);
}

window.changeQty = function(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) {
        removeItem(index);
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage();
    }
}

window.removeItem = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartPage();
}

function updateSummary(subtotal) {
    const elSubtotal = document.getElementById('summary-subtotal');
    if(!elSubtotal) return;
    
    elSubtotal.textContent = formatRupiah(subtotal);
    document.getElementById('summary-discount').textContent = "-Rp 0";
    const ongkir = subtotal > 0 ? 20000 : 0;
    document.getElementById('summary-total').textContent = formatRupiah(subtotal + ongkir);
}

// ==========================================
// LOGIKA HALAMAN CHECKOUT (checkout.html)
// ==========================================
function renderCheckoutPage() {
    updateCartBadge();
    const container = document.getElementById('checkout-items');
    if(!container) return;

    if (cart.length === 0) {
        window.location.href = 'index.html'; 
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="d-flex align-items-center mb-3">
            <img src="${item.thumbnail}" class="cart-item-img me-3" style="width:50px; height:50px;">
            <div class="flex-grow-1">
                <small class="fw-bold d-block text-truncate" style="max-width:180px;">${item.title}</small>
                <small class="text-muted">${item.qty} x ${formatRupiah(item.price)}</small>
            </div>
            <div class="fw-bold small ms-2">
                ${formatRupiah(item.price * item.qty)}
            </div>
        </div>
    `).join('');
    
    window.updateCheckoutTotals();
}

window.updateCheckoutTotals = function() {
    const elTotal = document.getElementById('checkout-total');
    if(!elTotal) return;

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let ongkir = 20000; 

    const shippingRadios = document.querySelectorAll('input[name="shipping"]');
    shippingRadios.forEach(radio => {
        if(radio.checked && radio.id === 'express') ongkir = 50000;
    });

    document.getElementById('checkout-subtotal').textContent = formatRupiah(subtotal);
    document.getElementById('checkout-shipping').textContent = formatRupiah(ongkir);
    document.getElementById('checkout-total').textContent = formatRupiah(subtotal + ongkir);
}

document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if(typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    Swal.fire({
        title: 'Pesanan Berhasil!',
        text: 'Terima kasih telah berbelanja di TokoKita.',
        icon: 'success',
        confirmButtonText: 'Kembali ke Beranda'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
        }
    });
});

document.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener('change', window.updateCheckoutTotals);
});

// ==========================================
// ROUTER (Deteksi Halaman)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    if(document.getElementById('hero')) {
        initHomePage(); 
    } else if (document.getElementById('cart-items-container')) {
        renderCartPage();
    } else if (document.getElementById('checkout-items')) {
        renderCheckoutPage();
    }
});