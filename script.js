// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

const CART_STORAGE_KEY = 'skinhome_cart';
const WHATSAPP_NUMBER = '522297111160';

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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('✅ Productos cargados:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    console.warn('⚠️ Usando productos de respaldo');
    return [
      {
        id: 1,
        name: "SKIN1004 - Crema Facial",
        category: "cremas",
        brand: "SKIN1004",
        price: 422,
        description: "Crema vegana hidratante",
        longDescription: "Crema facial vegana con extracto de centella asiática que hidrata y calma la piel. Ideal para pieles sensibles.",
        benefits: ["Hidratación profunda", "Calma la irritación", "Apta para piel sensible"],
        usage: "Aplica sobre piel limpia por la mañana y noche. Da pequeños toquecitos hasta absorber.",
        ingredients: ["Centella Asiática", "Niacinamida", "Betaina"],
        skinType: ["Piel sensible", "Piel seca", "Todo tipo de piel"],
        volume: "75 ml",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
        badge: "Best Seller"
      },
      {
        id: 2,
        name: "Purito Seoul - Gel Crema",
        category: "cremas",
        brand: "Purito Seoul",
        price: 340,
        description: "Gel refrescante con centella",
        longDescription: "Gel-crema ligero y refrescante formulado con centella asiática al 70%. Hidrata sin dejar sensación grasa.",
        benefits: ["Textura gel ligera", "No comedogénico", "Hidratación sin brillos"],
        usage: "Aplica como último paso de tu rutina de noche o bajo el protector solar de día.",
        ingredients: ["Centella Asiática 70%", "Ácido Hialurónico", "Glicerina"],
        skinType: ["Piel mixta", "Piel grasa", "Piel con acné"],
        volume: "100 ml",
        image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400",
        badge: "Nuevo"
      }
    ];
  }
}

// ═══════════════════════════════════════════════════════════
// LOCALSTORAGE — CARRITO
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
// CARRITO — FUNCIONES
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
  const cartItems  = document.getElementById('cartItems');
  const cartCount  = document.querySelector('.cart-count');
  const cartFooter = document.getElementById('cartFooter');
  const emptyCart  = document.getElementById('emptyCart');
  const totalAmt   = document.getElementById('totalAmount');

  if (!cartItems || !cartCount) return;

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

  if (cart.length === 0) {
    cartItems.innerHTML = '';
    if (cartFooter) cartFooter.style.display = 'none';
    if (emptyCart)  emptyCart.style.display  = 'flex';
  } else {
    if (emptyCart)  emptyCart.style.display  = 'none';
    if (cartFooter) cartFooter.style.display = 'block';

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
  if (!cartBtn) return;
  cartBtn.style.transform = 'scale(1.1)';
  setTimeout(() => { cartBtn.style.transform = ''; }, 200);
}

// ═══════════════════════════════════════════════════════════
// MODAL DE DETALLE DE PRODUCTO
// ═══════════════════════════════════════════════════════════

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  if (!modal) return;

  // Imagen
  const img = document.getElementById('modalProductImage');
  img.src = product.image || '';
  img.alt = product.name;

  // Badge
  const badge = document.getElementById('modalProductBadge');
  if (product.badge) {
    badge.textContent = product.badge;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }

  // Info básica
  document.getElementById('modalProductCategory').textContent = getCategoryName(product.category) || '';
  document.getElementById('modalProductTitle').textContent    = product.name    || '';
  document.getElementById('modalProductBrand').textContent    = product.brand   || '';
  document.getElementById('modalProductPrice').textContent    = '$' + (product.price || '');
  document.getElementById('modalProductVolume').textContent   = product.volume  || '';

  // Descripción larga
  document.getElementById('modalProductDesc').textContent =
    product.longDescription || product.description || '';

  // Beneficios
  const benefitsSection = document.getElementById('modalBenefitsSection');
  const benefitsList    = document.getElementById('modalProductBenefits');
  if (product.benefits && product.benefits.length) {
    benefitsList.innerHTML = product.benefits
      .map(b => `<li><i class="fas fa-check"></i> ${b}</li>`)
      .join('');
    benefitsSection.style.display = 'block';
  } else {
    benefitsSection.style.display = 'none';
  }

  // Modo de uso
  const usageSection = document.getElementById('modalUsageSection');
  if (product.usage) {
    document.getElementById('modalProductUsage').textContent = product.usage;
    usageSection.style.display = 'block';
  } else {
    usageSection.style.display = 'none';
  }

  // Ingredientes clave
  const ingredientsSection = document.getElementById('modalIngredientsSection');
  const ingredientsDiv     = document.getElementById('modalProductIngredients');
  if (product.ingredients && product.ingredients.length) {
    ingredientsDiv.innerHTML = product.ingredients
      .map(i => `<span class="modal-tag">${i}</span>`)
      .join('');
    ingredientsSection.style.display = 'block';
  } else {
    ingredientsSection.style.display = 'none';
  }

  // Tipo de piel
  const skinTypeSection = document.getElementById('modalSkinTypeSection');
  const skinTypeDiv     = document.getElementById('modalProductSkinType');
  if (product.skinType && product.skinType.length) {
    skinTypeDiv.innerHTML = product.skinType
      .map(s => `<span class="modal-tag modal-tag--skin">${s}</span>`)
      .join('');
    skinTypeSection.style.display = 'block';
  } else {
    skinTypeSection.style.display = 'none';
  }

  // Botón agregar
  document.getElementById('modalAddToCart').onclick = () => {
    addToCart(productId);
    closeProductModal();
  };

  // Abrir modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleProductModalEsc);
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleProductModalEsc);
}

function handleProductModalEsc(e) {
  if (e.key === 'Escape') closeProductModal();
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
    const checkoutForm       = document.getElementById('checkoutForm');
    const confirmationSection = document.getElementById('confirmationSection');
    if (checkoutForm)        checkoutForm.style.display        = 'flex';
    if (confirmationSection) confirmationSection.style.display = 'none';
    if (checkoutForm)        checkoutForm.reset();
  }, 400);
}

function renderCheckoutItems() {
  const container = document.getElementById('checkoutItems');
  const total     = document.getElementById('checkoutTotal');
  if (!container || !total) return;

  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <span>${i.name} ×${i.quantity}</span>
      <span>$${i.price * i.quantity}</span>
    </div>
  `).join('');

  total.textContent = '$' + cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
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
    date: new Date().toLocaleString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    customer: {
      name:    document.getElementById('customerName').value,
      phone:   document.getElementById('customerPhone').value,
      email:   document.getElementById('customerEmail').value,
      address: document.getElementById('deliveryAddress').value,
      notes:   document.getElementById('deliveryNotes').value
    },
    items: [...cart],
    total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  };

  showConfirmation();
}

function showConfirmation() {
  const checkoutForm        = document.getElementById('checkoutForm');
  const confirmationSection = document.getElementById('confirmationSection');
  const orderNumberDisplay  = document.getElementById('orderNumberDisplay');
  const ticketDetails       = document.getElementById('ticketDetails');

  if (checkoutForm)        checkoutForm.style.display        = 'none';
  if (confirmationSection) confirmationSection.style.display = 'block';
  if (orderNumberDisplay)  orderNumberDisplay.textContent    = orderData.orderNumber;

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

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
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
================================
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Ticket_${orderData.orderNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification('📥 Ticket descargado');
}

// ═══════════════════════════════════════════════════════════
// RENDER DE PRODUCTOS
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

  // Limpia el grid y agrega las tarjetas como elementos DOM
  grid.innerHTML = '';
  list.forEach((product, index) => {
    grid.appendChild(renderProduct(product, index));
  });

  updateProductCount(list.length);
}

function renderProduct(product, index) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.category = product.category;
  card.style.setProperty('--i', index);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Ver detalle de ${product.name}`);

  card.innerHTML = `
    <div class="product-image">
      <img
        src="${product.image || ''}"
        alt="${product.name}"
        loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'"
      >
      ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
      <span class="product-tap-hint"><i class="fas fa-expand-alt"></i> más info</span>
    </div>
    <div class="product-info">
      <span class="product-category">${getCategoryName(product.category)}</span>
      <h3 class="product-title">${product.name}</h3>
      <p class="product-description">${product.description || ''}</p>
      <div class="product-footer">
        <span class="product-price">${product.price}</span>
        <button
          class="add-to-cart"
          aria-label="Agregar ${product.name} al carrito"
        >
          <i class="fas fa-plus"></i> Agregar
        </button>
      </div>
    </div>
  `;

  // Botón agregar: detiene la propagación para no abrir modal
  card.querySelector('.add-to-cart').addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(product.id);
  });

  // Click en la tarjeta abre el modal de detalle
  card.addEventListener('click', () => openProductModal(product.id));

  // Teclado: Enter / Space también abre modal
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openProductModal(product.id);
    }
  });

  return card;
}

function updateProductCount(n) {
  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = n + ' producto' + (n !== 1 ? 's' : '');
}

function getCategoryName(cat) {
  const map = {
    cremas:       'Cremas y Geles',
    mascarillas:  'Mascarillas',
    tratamientos: 'Tratamientos',
    tonicos:      'Tónicos y Pads',
    proteccion:   'Protección Solar',
    limpiadores:  'Limpiadores',
    serums:       'Sérums y Ampollas',
    ojos:         'Contorno de Ojos',
    labios:       'Cuidado de Labios'
  };
  return map[cat] || cat;
}

// ═══════════════════════════════════════════════════════════
// FILTROS Y BÚSQUEDA
// ═══════════════════════════════════════════════════════════

function filterProducts(category) {
  const filtered = category === 'all'
    ? products
    : products.filter(p => p.category === category);
  renderProducts(filtered);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-category') === category;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
}

function searchProducts(term) {
  const t = term.toLowerCase().trim();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(t) ||
    (p.description || '').toLowerCase().includes(t) ||
    p.category.toLowerCase().includes(t) ||
    (p.brand || '').toLowerCase().includes(t) ||
    (p.ingredients || []).some(i => i.toLowerCase().includes(t))
  );
  renderProducts(filtered);
}

// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function setupEventListeners() {
  // Filtros de categoría
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterProducts(btn.getAttribute('data-category'));
    });
  });

  // Búsqueda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => searchProducts(e.target.value));
  }

  // Formulario checkout
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
  const mainNav      = document.querySelector('.main-nav');
  if (!mobileToggle || !mainNav) return;

  mobileToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('active');
    mobileToggle.setAttribute('aria-expanded', isOpen);
    const icon = mobileToggle.querySelector('i');
    if (icon) {
      icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
  });

  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      const icon = mobileToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    });
  });

  // Cerrar al tocar fuera del header
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header') && mainNav.classList.contains('active')) {
      mainNav.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      const icon = mobileToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
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
  n.textContent = msg;
  document.body.appendChild(n);

  setTimeout(() => n.remove(), 3000);
}

// ═══════════════════════════════════════════════════════════
// ANIMACIONES DINÁMICAS
// ═══════════════════════════════════════════════════════════

function addAnimationStyles() {
  if (document.getElementById('dynamic-animations')) return;
  const style = document.createElement('style');
  style.id = 'dynamic-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(-16px); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateY(0);     opacity: 1; }
      to   { transform: translateY(-16px); opacity: 0; }
    }
    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════
// PÁGINA ACTIVA EN NAV
// ═══════════════════════════════════════════════════════════

function setupActivePage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const isActive = link.getAttribute('href') === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// ═══════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  addAnimationStyles();

  // 1. Cargar carrito guardado
  loadCart();
  updateCart();

  // 2. Cargar y mostrar productos (solo en index)
  if (document.getElementById('productsGrid')) {
    products = await loadProductsFromJSON();
    renderProducts(products);
    setupEventListeners();
  }

  // 3. Menú móvil
  setupMobileMenu();

  // 4. Enlace activo en nav
  setupActivePage();

  console.log('✨ Skin Home inicializado');
});

// Cambiar de categoría con el dropdown
document.getElementById('categorySelect').addEventListener('change', function(e) {
    const category = e.target.value;
    filtrarProductos(category);
});

function filtrarProductos(category) {
    // Tu lógica de filtrado aquí
    console.log('Filtrando por:', category);
    
    // Ejemplo: actualizar botones activos si los tienes
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}