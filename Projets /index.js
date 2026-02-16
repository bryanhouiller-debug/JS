// you can write js here

/* ==========================
       Configuration & constantes
       ========================== */
    const API_URL = 'https://dummyjson.com/products?limit=12'; // API publique demo (DummyJSON)
    const productListEl = document.getElementById('productList');
    const slidesEl = document.getElementById('slides');
    const indicatorsEl = document.getElementById('indicators');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const cartCountEl = document.getElementById('cartCount');
    const openCartBtn = document.getElementById('openCartBtn');
    const cartModal = document.getElementById('cartModal');
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    const pTitle = document.getElementById('pTitle');
    const pPrice = document.getElementById('pPrice');
    const pDesc = document.getElementById('pDesc');
    const addToCartBtn = document.getElementById('addToCartBtn');

    /* état local */
    let products = [];            // produits chargés depuis l'API
    let selectedProduct = null;   // produit actuellement affiché
    let slideIndex = 0;           // image du carousel affichée
    let autoplayInterval = null;
    const AUTOPLAY_MS = 3500;

    /* panier conservé dans localStorage */
    function readCart() {
      return JSON.parse(localStorage.getItem('cart_v1') || '[]');
    }
    function writeCart(cart) {
      localStorage.setItem('cart_v1', JSON.stringify(cart));
      renderCartCount();
    }
    function renderCartCount() {
      const cart = readCart();
      const qty = cart.reduce((s,i)=> s + i.quantity, 0);
      cartCountEl.textContent = qty;
    }

    /* =========================
       Chargement des produits
       ========================= */
    async function loadProducts() {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        products = json.products || [];

        // afficher la liste
        renderProductList();
        // sélectionner le premier produit par défaut (si présent)
        if (products[0]) selectProduct(products[0].id);
      } catch (err) {
        productListEl.innerHTML = '<p style="color:#a00; padding:8px;">Erreur de chargement. Verifie ta connexion ou l\'URL API.</p>';
        console.error(err);
      }
    }

    /* Render liste produits */
    function renderProductList() {
      productListEl.innerHTML = '';
      products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <img src="${p.thumbnail}" alt="${escapeHtml(p.title)}">
          <div class="meta">
            <div class="title">${escapeHtml(p.title)}</div>
            <div class="price">${p.price} €</div>
          </div>
        `;
        card.addEventListener('click', () => selectProduct(p.id));
        productListEl.appendChild(card);
      });
    }

    /* =========================
       Sélection produit -> met à jour carousel + infos
       ========================= */
    function selectProduct(id) {
      selectedProduct = products.find(x => x.id === id);
      if (!selectedProduct) return;
      // infos
      pTitle.textContent = selectedProduct.title;
      pPrice.textContent = selectedProduct.price + ' €';
      pDesc.textContent = selectedProduct.description;
      addToCartBtn.disabled = false;

      // build carousel images (DummyJSON fournit un tableau 'images')
      const imgs = selectedProduct.images && selectedProduct.images.length ? selectedProduct.images : [selectedProduct.thumbnail];
      buildCarousel(imgs);
    }

    /* =========================
       CAROUSEL : construction + comportement
       ========================= */
    function buildCarousel(imgArray) {
      // reset
      slideIndex = 0;
      slidesEl.style.transform = 'translateX(0)';
      slidesEl.innerHTML = '';
      indicatorsEl.innerHTML = '';

      // créer les slides
      imgArray.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = selectedProduct.title;
        slidesEl.appendChild(img);
      });

      // créer les indicateurs
      imgArray.forEach((_, i) => {
        const btn = document.createElement('button');
        if (i === 0) btn.classList.add('active');
        btn.addEventListener('click', () => {
          goToSlide(i);
          resetAutoplay();
        });
        indicatorsEl.appendChild(btn);
      });

      // autoplay
      resetAutoplay();
    }

    function goToSlide(i) {
      const width = slidesEl.children[0]?.clientWidth || 720;
      slideIndex = i;
      slidesEl.style.transform = `translateX(-${i * width}px)`;
      updateIndicators();
    }

    function nextSlide() {
      const count = slidesEl.children.length;
      if (count === 0) return;
      slideIndex = (slideIndex + 1) % count;
      goToSlide(slideIndex);
    }
    function prevSlide() {
      const count = slidesEl.children.length;
      if (count === 0) return;
      slideIndex = (slideIndex - 1 + count) % count;
      goToSlide(slideIndex);
    }
    function updateIndicators() {
      const buttons = Array.from(indicatorsEl.children);
      buttons.forEach((b, idx) => b.classList.toggle('active', idx === slideIndex));
    }

    function resetAutoplay() {
      if (autoplayInterval) clearInterval(autoplayInterval);
      autoplayInterval = setInterval(nextSlide, AUTOPLAY_MS);
    }

    /* pause au survol du carousel */
    const carouselEl = document.getElementById('carousel');
    carouselEl.addEventListener('mouseenter', () => { if (autoplayInterval) clearInterval(autoplayInterval); });
    carouselEl.addEventListener('mouseleave', () => resetAutoplay());

    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });

    /* resize -> repositionner correctement */
    window.addEventListener('resize', () => goToSlide(slideIndex));

    /* =========================
       PANIER : ajout, rendu, suppression
       ========================= */
    function addToCart(product) {
      const cart = readCart();
      const existing = cart.find(i=> i.id === product.id);
      if (existing) { existing.quantity += 1; }
      else { cart.push({ id: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail, quantity: 1 }); }
      writeCart(cart);
      animateAddToCart();
    }

    function animateAddToCart() {
      // petit feedback visuel
      const old = openCartBtn.style.transform;
      openCartBtn.style.transform = 'scale(1.06)';
      setTimeout(()=> openCartBtn.style.transform = old, 180);
    }

    addToCartBtn.addEventListener('click', () => {
      if (!selectedProduct) return;
      addToCart(selectedProduct);
    });

    function renderCart() {
      const cart = readCart();
      cartItemsEl.innerHTML = '';
      if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p style="opacity:.7">Ton panier est vide.</p>';
        cartTotalEl.textContent = '0 €';
        return;
      }
      let total = 0;
      cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}">
          <div class="meta">
            <div style="font-weight:600">${escapeHtml(item.title)}</div>
            <div>${item.quantity} × ${item.price} €</div>
          </div>
          <button class="remove" data-id="${item.id}">Suppr</button>
        `;
        cartItemsEl.appendChild(div);
      });
      cartTotalEl.textContent = Math.round(total * 100)/100 + ' €';

      // lier boutons supprimer
      cartItemsEl.querySelectorAll('.remove').forEach(b => b.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.dataset.id);
        removeFromCart(id);
      }));
    }

    function removeFromCart(id) {
      let cart = readCart();
      cart = cart.filter(i => i.id !== id);
      writeCart(cart);
      renderCart();
    }

    document.getElementById('clearCartBtn').addEventListener('click', () => {
      writeCart([]);
      renderCart();
    });

    // ouvrir / fermer modal panier
    openCartBtn.addEventListener('click', () => {
      cartModal.classList.toggle('open');
      renderCart();
    });

    // checkout simple (démo)
    document.getElementById('checkoutBtn').addEventListener('click', () => {
      const cart = readCart();
      if (cart.length === 0) { alert('Ton panier est vide.'); return; }
      alert('Simulation de paiement — merci !');
      writeCart([]);
      renderCart();
      cartModal.classList.remove('open');
    });

    /* =========================
       Utilitaires
       ========================= */
    function escapeHtml(text) {
      return String(text || '').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
    }

    /* =========================
       Initialisation
       ========================= */
    // charge les produits et le panier depuis localStorage
    (function init() {
      renderCartCount();
      loadProducts();
    })();
    // On récupère le bouton grâce à son id
const button = document.getElementById("menuButton");

// On récupère le menu grâce à son id
const menu = document.getElementById("menu");

// On ajoute un événement "click" sur le bouton
button.addEventListener("click", function() {

    // On bascule (toggle) la classe "hidden"
    menu.classList.toggle("hidden");

});
