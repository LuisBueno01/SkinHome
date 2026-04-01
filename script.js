// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

const CART_STORAGE_KEY = 'skinhome_cart';
const WHATSAPP_NUMBER = '522297111160';

// ⚠️ Los productos se cargan desde data/productos.json
let products = [];
let cart = [];
let orderNumber = '';
let orderData = {};

// ═══════════════════════════════════════════════════════════
// CARGAR PRODUCTOS DESDE JSON
// ═══════════════════════════════════════════════════════════

async function loadProductsFromJSON() {
  try {
    const response = await fetch('data/productos.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Productos cargados:', data.length);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    console.warn('⚠️ Usando productos de respaldo');
    
    // Productos de respaldo por si falla la carga
    return [
      { id: 1, name: "SKIN1004 - Crema Facial", category: "cremas", price: 422, description: "Crema vegana", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400", badge: "Best Seller" },
      { id: 2, name: "Purito Seoul - Gel Crema", category: "cremas", price: 340, description: "Gel refrescante", image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400", badge: "Nuevo" }
    ];
  }
}

// ═══════════════════════════════════════════════════════════
// FUNCIONES DE LOCALSTORAGE (CARRITO)
// ═══════════════════════════════════════════════════════════

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error guardando carrito:', error);
  }
}

function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      cart = JSON.parse(savedCart);
      return true;
    }
  } catch (error) {
    console.error('Error cargando carrito:', error);
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return false;
}

function clearCart() {
  cart = [];
  localStorage.removeItem(CART_STORAGE_KEY);
}

// ═══════════════════════════════════════════════════════════
// FUNCIONES DEL CARRITO
// ═══════════════════════════════════════════════════════════

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) {
    showNotification('❌ Producto no encontrado');
    return;
  }
  
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  saveCart();
  updateCart();
  showNotification('✅ Producto agregado a tu bolsa');
  animateCartButton();
}

function updateQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  
  item.quantity += delta;
  
  if (item.quantity <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    updateCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCart();
  showNotification('🗑️ Producto eliminado');
}

function updateCart() {
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.querySelector('.cart-count');
  const cartFooter = document.getElementById('cartFooter');
  const emptyCart = document.getElementById('emptyCart');
  const totalAmt = document.getElementById('totalAmount');
  
  if (!cartItems || !cartCount) return;
  
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartCount.textContent = totalItems;
  
  if (totalItems > 0) {
    cartCount.style.display = 'flex';
    cartCount.style.animation = 'popIn .3s ease';
  } else {
    cartCount.style.display = 'none';
  }
  
  if (cart.length === 0) {
    if (cartItems) cartItems.innerHTML = '';
    if (cartFooter) cartFooter.style.display = 'none';
    if (emptyCart) emptyCart.style.display = 'flex';
  } else {
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';
    
    if (cartItems) {
      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">$${item.price}</div>
            <div class="cart-item-quantity">
              <button class="qty-btn" onclick="updateQuantity(${item.id},-1)" aria-label="Disminuir">−</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="updateQuantity(${item.id},1)" aria-label="Aumentar">+</button>
            </div>
          </div>
          <button class="remove-item" onclick="removeFromCart(${item.id})" aria-label="Eliminar">
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      `).join('');
    }
    
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (totalAmt) totalAmt.textContent = '$' + total;
  }
}

function toggleCart() {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  
  modal.classList.toggle('active');
  document.body.style.overflow = modal.classList.contains('active') ? 'hidden' : '';
}

function animateCartButton() {
  const cartBtn = document.querySelector('.cart-trigger');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
      cartBtn.style.transform = 'scale(1)';
    }, 200);
  }
}

// ═══════════════════════════════════════════════════════════
// CHECKOUT
// ═══════════════════════════════════════════════════════════

function openCheckout() {
  if (!cart.length) {
    showNotification('⚠️ Tu bolsa está vacía');
    return;
  }
  
  toggleCart();
  
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCheckoutItems();
  }
}

function closeCheckout() {
  const checkoutModal = document.getElementById('checkoutModal');
  if (!checkoutModal) return;
  
  checkoutModal.classList.remove('active');
  document.body.style.overflow = '';
  
  setTimeout(() => {
    const checkoutForm = document.getElementById('checkoutForm');
    const confirmationSection = document.getElementById('confirmationSection');
    
    if (checkoutForm) checkoutForm.style.display = 'flex';
    if (confirmationSection) confirmationSection.style.display = 'none';
    if (checkoutForm) checkoutForm.reset();
  }, 400);
}

function renderCheckoutItems() {
  const container = document.getElementById('checkoutItems');
  const total = document.getElementById('checkoutTotal');
  
  if (!container || !total) return;
  
  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <span>${i.name} ×${i.quantity}</span>
      <span>$${i.price * i.quantity}</span>
    </div>
  `).join('');
  
  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  total.textContent = '$' + totalAmount;
}

function handleCheckout(e) {
  e.preventDefault();
  
  let valid = true;
  ['customerName', 'customerPhone', 'deliveryAddress'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el && !el.value.trim()) {
      el.style.borderColor = '#e74c3c';
      valid = false;
    } else if (el) {
      el.style.borderColor = '';
    }
  });
  
  if (!valid) {
    showNotification('⚠️ Completa los campos requeridos');
    return;
  }
  
  orderNumber = 'ORD-' + Date.now().toString().slice(-8);
  orderData = {
    orderNumber,
    date: new Date().toLocaleString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    customer: {
      name: document.getElementById('customerName').value,
      phone: document.getElementById('customerPhone').value,
      email: document.getElementById('customerEmail').value,
      address: document.getElementById('deliveryAddress').value,
      notes: document.getElementById('deliveryNotes').value
    },
    items: [...cart],
    total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  };
  
  showConfirmation();
}

function showConfirmation() {
  const checkoutForm = document.getElementById('checkoutForm');
  const confirmationSection = document.getElementById('confirmationSection');
  const orderNumberDisplay = document.getElementById('orderNumberDisplay');
  const ticketDetails = document.getElementById('ticketDetails');
  
  if (checkoutForm) checkoutForm.style.display = 'none';
  if (confirmationSection) confirmationSection.style.display = 'block';
  if (orderNumberDisplay) orderNumberDisplay.textContent = orderData.orderNumber;
  
  if (ticketDetails) {
    ticketDetails.innerHTML = `
      <div class="ticket-item"><span>Cliente</span><span>${orderData.customer.name}</span></div>
      <div class="ticket-item"><span>Teléfono</span><span>${orderData.customer.phone}</span></div>
      <div class="ticket-item"><span>Dirección</span><span>${orderData.customer.address}</span></div>
      <div style="margin:.75rem 0;border-top:1px dashed rgba(200,169,126,.3);padding-top:.75rem;">
        ${orderData.items.map(i => `
          <div class="ticket-item">
            <span>${i.name}</span>
            <span>×${i.quantity} — $${i.price * i.quantity}</span>
          </div>
        `).join('')}
      </div>
      <div class="ticket-item" style="font-weight:700;color:var(--color-deep-rose);font-size:.95rem;">
        <span>TOTAL</span><span>$${orderData.total}</span>
      </div>
    `;
  }
  
  clearCart();
  updateCart();
}

// ═══════════════════════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════════════════════

function sendToWhatsApp() {
  if (!orderData.items || !orderData.customer) {
    showNotification('⚠️ No hay pedido para enviar');
    return;
  }
  
  const msg = `
🌸 *SKIN HOME* 🌸
*Pedido:* ${orderData.orderNumber}
*Fecha:* ${orderData.date}

👤 *Cliente:*
• Nombre: ${orderData.customer.name}
• Teléfono: ${orderData.customer.phone}
• Email: ${orderData.customer.email || 'No proporcionado'}

📍 *Dirección de entrega:*
${orderData.customer.address}
${orderData.customer.notes ? '📝 ' + orderData.customer.notes : ''}

🛍️ *Productos:*
${orderData.items.map(i => `• ${i.name}\n   Cant: ${i.quantity}  |  $${i.price * i.quantity}`).join('\n')}

💰 *TOTAL: $${orderData.total}*

¡Gracias por tu compra! 💕
  `.trim();
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(whatsappUrl, '_blank');
  
  showNotification('📱 Abriendo WhatsApp...');
}

// ═══════════════════════════════════════════════════════════
// DESCARGAR TICKET
// ═══════════════════════════════════════════════════════════

function downloadTicket() {
  if (!orderData.items || !orderData.customer) {
    showNotification('⚠️ No hay pedido para descargar');
    return;
  }
  
  const content = `
================================
     SKIN HOME
     Ticket de Compra
================================
PEDIDO: ${orderData.orderNumber}
FECHA:  ${orderData.date}
--------------------------------
CLIENTE:
Nombre:    ${orderData.customer.name}
Teléfono:  ${orderData.customer.phone}
Email:     ${orderData.customer.email || 'No proporcionado'}
--------------------------------
DIRECCIÓN:
${orderData.customer.address}
${orderData.customer.notes ? 'Notas: ' + orderData.customer.notes : ''}
--------------------------------
PRODUCTOS:
${orderData.items.map(i => 
  `${i.name}
   Cantidad:  ${i.quantity}
   Unitario:  $${i.price}
   Subtotal:  $${i.price * i.quantity}`
).join('\n---\n')}
--------------------------------
TOTAL: $${orderData.total}
================================
¡Gracias por tu compra!
www.skinhome.mx
================================
  `.trim();
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ticket_${orderData.orderNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('📥 Ticket descargado');
}

// ═══════════════════════════════════════════════════════════
// FILTROS Y BÚSQUEDA
// ═══════════════════════════════════════════════════════════

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  
  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No se encontraron productos</p>
      </div>
    `;
    updateProductCount(0);
    return;
  }
  
  grid.innerHTML = list.map((p, index) => `
    <div class="product-card" data-category="${p.category}" style="--i: ${index}">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-category">${getCategoryName(p.category)}</div>
        <h3 class="product-title">${p.name}</h3>
        <p class="product-description">${p.description}</p>
        <div class="product-footer">
          <div class="product-price">${p.price}</div>
          <button class="add-to-cart" onclick="addToCart(${p.id})" aria-label="Agregar ${p.name} al carrito">
            <i class="fas fa-plus"></i> Agregar
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  updateProductCount(list.length);
}

function updateProductCount(n) {
  const countEl = document.getElementById('productCount');
  if (countEl) {
    countEl.textContent = n + ' producto' + (n !== 1 ? 's' : '');
  }
}

function getCategoryName(cat) {
  const map = { 
    cremas: 'Cremas y Geles', 
    mascarillas: 'Mascarillas', 
    tratamientos: 'Tratamientos', 
    tonicos: 'Tónicos y Pads', 
    proteccion: 'Protección Solar', 
    limpiadores: 'Limpiadores', 
    serums: 'Sérums y Ampollas', 
    ojos: 'Contorno de Ojos', 
    labios: 'Cuidado de Labios' 
  };
  return map[cat] || cat;
}

function filterProducts(category) {
  const filtered = category === 'all' 
    ? products 
    : products.filter(p => p.category === category);
  renderProducts(filtered);
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
    if (btn.getAttribute('data-category') === category) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
  });
}

function searchProducts(term) {
  const t = term.toLowerCase().trim();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(t) ||
    p.description.toLowerCase().includes(t) ||
    p.category.toLowerCase().includes(t)
  );
  renderProducts(filtered);
}

function setupEventListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterProducts(btn.getAttribute('data-category'));
    });
  });
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchProducts(e.target.value);
    });
  }
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckout);
  }
}

// ═══════════════════════════════════════════════════════════
// MENÚ MÓVIL
// ═══════════════════════════════════════════════════════════

function setupMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (!mobileToggle || !mainNav) return;
  
  mobileToggle.addEventListener('click', () => {
    const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
    mobileToggle.setAttribute('aria-expanded', !isExpanded);
    mainNav.classList.toggle('active');
    
    const icon = mobileToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    }
  });
  
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header') && mainNav.classList.contains('active')) {
      mainNav.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════════════════════════

function showNotification(msg) {
  document.querySelectorAll('.notification').forEach(n => n.remove());
  
  const n = document.createElement('div');
  n.className = 'notification';
  n.setAttribute('role', 'status');
  n.setAttribute('aria-live', 'polite');
  
  Object.assign(n.style, {
    position: 'fixed',
    top: 'calc(var(--header-height) + 1rem)',
    right: '1rem',
    left: '1rem',
    maxWidth: '400px',
    margin: '0 auto',
    background: 'var(--gradient-deep, linear-gradient(135deg, #c9897a 0%, #9b5e52 100%))',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '50px',
    boxShadow: '0 6px 20px rgba(61,43,38,.2)',
    zIndex: '5000',
    animation: 'slideIn .3s ease, slideOut .3s ease 2.7s forwards',
    fontWeight: '500',
    fontSize: '0.875rem',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center'
  });
  
  n.textContent = msg;
  document.body.appendChild(n);
  
  setTimeout(() => n.remove(), 3000);
}

// ═══════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Cargar carrito
  loadCart();
  updateCart();
  
  // 2. Cargar productos desde JSON
  if (document.getElementById('productsGrid')) {
    products = await loadProductsFromJSON();
    renderProducts(products);
    setupEventListeners();
  }
  
  // 3. Menú móvil
  setupMobileMenu();
  
  // 4. Página activa
  setupActivePage();
  
  // 5. Animaciones
  addAnimationStyles();
  
  console.log('✨ Skin Home inicializado con productos desde JSON');
});

function setupActivePage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

function addAnimationStyles() {
  const existingStyle = document.getElementById('dynamic-animations');
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = 'dynamic-animations';
  style.textContent = `
    @keyframes slideIn { 
      from { transform: translateY(-20px); opacity: 0; } 
      to { transform: translateY(0); opacity: 1; } 
    }
    @keyframes slideOut { 
      from { transform: translateY(0); opacity: 1; } 
      to { transform: translateY(-20px); opacity: 0; } 
    }
    @keyframes popIn { 
      from { transform: scale(0); opacity: 0; } 
      to { transform: scale(1); opacity: 1; } 
    }
  `;
  document.head.appendChild(style);
}