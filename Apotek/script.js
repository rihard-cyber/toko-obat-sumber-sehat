// Initialize AOS Animation
AOS.init({
    once: true, // Animasi hanya berjalan sekali saat di-scroll
    offset: 100, // Offset (dalam px) dari posisi elemen awal
});

// Initialize Vanilla Tilt for 3D Cards
VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
    max: 15,
    speed: 400,
    glare: true,
    "max-glare": 0.2,
});

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // Change icon
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });
}

// Close mobile menu when a link is clicked
const navItems = document.querySelectorAll('.nav-links a');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });
});

// Product Filtering
const filterBtns = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        
        productCards.forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.style.display = 'block';
                // Reset AOS animation for smooth appearance
                card.classList.remove('aos-animate');
                setTimeout(() => {
                    card.classList.add('aos-animate');
                }, 50);
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Add to Cart and Buy Button Ripple Effect
const cartBtns = document.querySelectorAll('.btn-add-cart, .btn-buy');
cartBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        const x = e.clientX - e.target.getBoundingClientRect().left;
        const y = e.clientY - e.target.getBoundingClientRect().top;
        
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.width = '100px';
        ripple.style.height = '100px';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        // Show success alert
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan';
        this.style.background = 'var(--primary-color)';
        this.style.color = 'var(--white)';
        
        setTimeout(() => {
            ripple.remove();
            this.innerHTML = originalText;
            this.style.background = 'var(--white)';
            this.style.color = 'var(--primary-color)';
        }, 2000);
    });
});

// Add CSS keyframe for ripple dynamically if it doesn't exist
const style = document.createElement('style');
style.innerHTML = `
    @keyframes ripple {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }
`;
document.head.appendChild(style);

// --- CART & WHATSAPP CHECKOUT LOGIC ---

let cart = [];
let appliedVoucher = null;
const availableVouchers = {
    'SEHAT10': { type: 'percent', value: 0.10, minPurchase: 0 },
    'POTONGAN20': { type: 'fixed', value: 20000, minPurchase: 50000 }
};

// DOM Elements
const cartBtn = document.getElementById('cartBtn');
const cartModalOverlay = document.getElementById('cartModalOverlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const checkoutForm = document.getElementById('checkoutForm');

// Toggle Modal
function toggleCartModal() {
    cartModalOverlay.classList.toggle('active');
}

if(cartBtn) cartBtn.addEventListener('click', toggleCartModal);
if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCartModal);
if(cartModalOverlay) {
    cartModalOverlay.addEventListener('click', (e) => {
        if(e.target === cartModalOverlay) toggleCartModal();
    });
}

// Format Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

// Update Cart UI
function updateCartUI() {
    // Update Badge
    cartBadge.textContent = cart.length;
    
    // Update Items List
    cartItemsList.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p class="empty-cart-msg">Keranjang Anda masih kosong.</p>';
        document.getElementById('cartSubtotalPrice').textContent = 'Rp 0';
        document.getElementById('cartTotalPrice').textContent = 'Rp 0';
        document.getElementById('discountRow').style.display = 'none';
        
        appliedVoucher = null;
        if(document.getElementById('voucherMessage')) document.getElementById('voucherMessage').textContent = '';
        if(document.getElementById('voucherCode')) document.getElementById('voucherCode').value = '';
        return;
    }
    
    cart.forEach((item, index) => {
        total += item.price;
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <h5>${item.name}</h5>
                <p>${formatRupiah(item.price)}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button>
        `;
        cartItemsList.appendChild(itemElement);
    });
    
    let subtotal = total;
    let discount = 0;
    
    if (appliedVoucher) {
        if (appliedVoucher.type === 'percent') {
            discount = subtotal * appliedVoucher.value;
        } else if (appliedVoucher.type === 'fixed') {
            discount = appliedVoucher.value;
        }
    }
    
    let finalTotal = subtotal - discount;
    if (finalTotal < 0) finalTotal = 0;
    
    // Update UI Elements
    document.getElementById('cartSubtotalPrice').textContent = formatRupiah(subtotal);
    
    if (discount > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discountLabel').textContent = appliedVoucher.code;
        document.getElementById('cartDiscountPrice').textContent = '-' + formatRupiah(discount);
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }
    
    document.getElementById('cartTotalPrice').textContent = formatRupiah(finalTotal);
}

// Add to Cart
function addToCart(name, price) {
    cart.push({ name, price: parseInt(price) });
    updateCartUI();
    
    // Small animation on cart icon
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartBtn.style.transform = 'scale(1)';
    }, 200);
}

// Remove from Cart
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    
    // Re-validate voucher min purchase on item remove
    if (appliedVoucher) {
        let currentSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
        if (currentSubtotal < appliedVoucher.minPurchase) {
            appliedVoucher = null;
            if(document.getElementById('voucherMessage')) {
                document.getElementById('voucherMessage').textContent = 'Voucher dilepas karena kurang dari minimal belanja.';
                document.getElementById('voucherMessage').style.color = '#e74c3c';
            }
        }
    }
    
    updateCartUI();
};

// Apply Voucher Event
const applyVoucherBtn = document.getElementById('applyVoucherBtn');
const voucherCodeInput = document.getElementById('voucherCode');
const voucherMessage = document.getElementById('voucherMessage');

if (applyVoucherBtn) {
    applyVoucherBtn.addEventListener('click', () => {
        const code = voucherCodeInput.value.trim().toUpperCase();
        if (!code) {
            voucherMessage.textContent = 'Silakan masukkan kode voucher.';
            voucherMessage.style.color = '#e74c3c';
            return;
        }
        
        if (availableVouchers[code]) {
            const voucher = availableVouchers[code];
            let subtotal = cart.reduce((sum, item) => sum + item.price, 0);
            
            if (subtotal >= voucher.minPurchase) {
                appliedVoucher = { code: code, ...voucher };
                voucherMessage.textContent = `Voucher ${code} berhasil digunakan!`;
                voucherMessage.style.color = '#2ecc71';
                updateCartUI();
            } else {
                voucherMessage.textContent = `Minimal belanja untuk voucher ini adalah ${formatRupiah(voucher.minPurchase)}.`;
                voucherMessage.style.color = '#e74c3c';
                appliedVoucher = null;
                updateCartUI();
            }
        } else {
            voucherMessage.textContent = 'Kode voucher tidak valid.';
            voucherMessage.style.color = '#e74c3c';
            appliedVoucher = null;
            updateCartUI();
        }
    });
}

// Hook Add to Cart Buttons
const addToCartButtons = document.querySelectorAll('.product-card .btn-add-cart');
addToCartButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Find parent product card
        const card = this.closest('.product-card');
        const name = card.getAttribute('data-name');
        const price = card.getAttribute('data-price');
        
        if(name && price) {
            addToCart(name, price);
        }
    });
});

// Hook Buy Buttons
const buyButtons = document.querySelectorAll('.product-card .btn-buy');
buyButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Find parent product card
        const card = this.closest('.product-card');
        const name = card.getAttribute('data-name');
        const price = card.getAttribute('data-price');
        
        if(name && price) {
            addToCart(name, price);
            // Open cart modal immediately
            if(cartModalOverlay) cartModalOverlay.classList.add('active');
        }
    });
});

// Handle Checkout Form Submit
if(checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('Keranjang belanja Anda kosong. Silakan pilih produk terlebih dahulu.');
            return;
        }
        
        // Get Form Data
        const buyerName = document.getElementById('buyerName').value;
        const buyerAddress = document.getElementById('buyerAddress').value;
        const shippingMethod = document.getElementById('shippingMethod').value;
        const buyerNotes = document.getElementById('buyerNotes').value;
        
        // Calculate Total
        let subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        let discount = 0;
        
        if (appliedVoucher) {
            if (appliedVoucher.type === 'percent') {
                discount = subtotal * appliedVoucher.value;
            } else if (appliedVoucher.type === 'fixed') {
                discount = appliedVoucher.value;
            }
        }
        
        let finalTotal = subtotal - discount;
        if (finalTotal < 0) finalTotal = 0;
        
        // Build WhatsApp Message
        let message = `*HALO APOTEK SUMBER SEHAT*%0A%0ASaya ingin memesan:%0A`;
        
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${formatRupiah(item.price)}%0A`;
        });
        
        message += `%0A*Subtotal: ${formatRupiah(subtotal)}*%0A`;
        if (discount > 0) {
            message += `*Diskon (${appliedVoucher.code}): -${formatRupiah(discount)}*%0A`;
        }
        message += `*Total Belanja: ${formatRupiah(finalTotal)}*%0A`;
        message += `%0A*Data Pengiriman:*%0A`;
        message += `Nama: ${buyerName}%0A`;
        message += `Alamat Lengkap: ${buyerAddress}%0A`;
        message += `Metode Pengiriman: ${shippingMethod}%0A`;
        
        if(buyerNotes) {
            message += `Catatan: ${buyerNotes}%0A`;
        }
        
        message += `%0AMohon info ketersediaan dan total tagihan (beserta ongkir jika ada). Terima kasih.`;
        
        // WhatsApp Admin Number (Replace with actual number)
        const waNumber = '6281234567890';
        const waLink = `https://wa.me/${waNumber}?text=${message}`;
        
        // Open WhatsApp in new tab
        window.open(waLink, '_blank');
        
        // Clear Cart & Form (Optional, but good UX after redirect)
        cart = [];
        updateCartUI();
        checkoutForm.reset();
        toggleCartModal();
    });
}

