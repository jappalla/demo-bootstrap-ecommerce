/* ═══════════════════════════════════════════════
   App Controller — Logic principale e-commerce
   ═══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  // ── Load cart from storage ──
  cart.load();

  // ── Render Products ──
  renderProducts(PRODUCTS);

  // ── Category filter ──
  initFilters();

  // ── Search ──
  initSearch();

  // ── Countdown Timer ──
  initCountdown();

  // ── Coupon system ──
  initCoupon();

  // ── Checkout flow ──
  initCheckout();

  // ── Scroll animations ──
  initScrollAnimations();

  // ── Back to top ──
  initBackToTop();

  // ── Card number formatting ──
  initCardFormatting();
});

/* ════════════════════════════════════════════
   RENDER PRODUCTS
   ════════════════════════════════════════════ */
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search display-4 text-muted"></i>
                <h5 class="mt-3 text-muted">Nessun prodotto trovato</h5>
            </div>`;
    return;
  }

  products.forEach((p, idx) => {
    const stars = renderStars(p.rating);
    const saving = p.originalPrice - p.price;
    const col = document.createElement("div");
    col.className = "col-lg-3 col-md-4 col-sm-6 fade-in";
    col.style.transitionDelay = `${idx * 0.06}s`;
    col.setAttribute("data-category", p.category);

    col.innerHTML = `
            <div class="product-card">
                <div class="product-img-wrap">
                    <div class="product-badges">
                        <span class="badge ${p.badgeClass}">${p.badge}</span>
                        ${saving > 0 ? `<span class="badge bg-success">Risparmi €${saving.toFixed(0)}</span>` : ""}
                    </div>
                    <div class="product-actions">
                        <button class="btn" title="Quick View" onclick='openQuickView(${p.id})'>
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn" title="Wishlist">
                            <i class="bi bi-heart"></i>
                        </button>
                    </div>
                    <i class="bi ${p.icon}"></i>
                </div>
                <div class="product-body">
                    <div class="product-category">${p.category}</div>
                    <div class="product-title">${p.name}</div>
                    <div class="product-rating mb-1">
                        ${stars}
                        <span class="text-muted ms-1">(${p.reviews})</span>
                    </div>
                    <div class="product-price-area">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="product-price">€${p.price.toFixed(2)}</span>
                            ${
                              p.originalPrice > p.price
                                ? `<span class="product-original">€${p.originalPrice.toFixed(2)}</span>
                                   <span class="badge bg-danger bg-opacity-10 text-danger">-${p.discount}%</span>`
                                : ""
                            }
                        </div>
                        <button class="btn btn-primary btn-add-cart w-100" onclick="addToCart(${p.id})">
                            <i class="bi bi-cart-plus me-1"></i>Aggiungi
                        </button>
                    </div>
                </div>
            </div>`;
    grid.appendChild(col);
  });

  // Trigger fade-in
  requestAnimationFrame(() => {
    document
      .querySelectorAll(".fade-in")
      .forEach((el) => el.classList.add("visible"));
  });
}

function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) html += '<i class="bi bi-star-fill"></i>';
    else if (i - rating < 1) html += '<i class="bi bi-star-half"></i>';
    else html += '<i class="bi bi-star"></i>';
  }
  return html;
}

/* ════════════════════════════════════════════
   ADD TO CART
   ════════════════════════════════════════════ */
function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (product) cart.addItem(product);
}

/* ════════════════════════════════════════════
   QUICK VIEW MODAL
   ════════════════════════════════════════════ */
let quickViewProduct = null;

function openQuickView(productId) {
  quickViewProduct = PRODUCTS.find((p) => p.id === productId);
  if (!quickViewProduct) return;

  const p = quickViewProduct;
  document.getElementById("qvIcon").className =
    `bi ${p.icon} display-1 text-primary`;
  document.getElementById("qvCategory").textContent = p.category;
  document.getElementById("qvName").textContent = p.name;
  document.getElementById("qvDesc").textContent = p.description;
  document.getElementById("qvPrice").textContent = `€${p.price.toFixed(2)}`;
  document.getElementById("qvOriginal").textContent =
    p.originalPrice > p.price ? `€${p.originalPrice.toFixed(2)}` : "";
  document.getElementById("qvDiscount").textContent =
    p.discount > 0 ? `-${p.discount}%` : "";
  document.getElementById("qvDiscount").style.display =
    p.discount > 0 ? "" : "none";
  document.getElementById("qvStars").innerHTML =
    `<span class="product-rating">${renderStars(p.rating)} <span class="text-muted">(${p.reviews} recensioni)</span></span>`;
  document.getElementById("qvQty").value = 1;

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("quickViewModal"),
  ).show();
}

document.getElementById("qvMinus")?.addEventListener("click", () => {
  const inp = document.getElementById("qvQty");
  inp.value = Math.max(1, +inp.value - 1);
});
document.getElementById("qvPlus")?.addEventListener("click", () => {
  const inp = document.getElementById("qvQty");
  inp.value = +inp.value + 1;
});
document.getElementById("qvAddCart")?.addEventListener("click", () => {
  if (!quickViewProduct) return;
  const qty = Math.max(1, +document.getElementById("qvQty").value);
  cart.addItem(quickViewProduct, qty);
  bootstrap.Modal.getInstance(
    document.getElementById("quickViewModal"),
  )?.hide();
});

/* ════════════════════════════════════════════
   FILTERS
   ════════════════════════════════════════════ */
function initFilters() {
  document.getElementById("filterBtns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;

    document
      .querySelectorAll("#filterBtns .btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    const filtered =
      filter === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === filter);
    renderProducts(filtered);
  });
}

/* ════════════════════════════════════════════
   SEARCH
   ════════════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById("searchInput");
  let timeout;
  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        renderProducts(PRODUCTS);
        return;
      }
      const results = PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
      renderProducts(results);
    }, 300);
  });
}

/* ════════════════════════════════════════════
   COUNTDOWN
   ════════════════════════════════════════════ */
function initCountdown() {
  let seconds = 3 * 3600 - 1; // ~ 3h
  const el = document.getElementById("countdown");
  setInterval(() => {
    if (seconds <= 0) seconds = 3 * 3600;
    seconds--;
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

/* ════════════════════════════════════════════
   COUPON
   ════════════════════════════════════════════ */
function initCoupon() {
  document.getElementById("applyCouponBtn").addEventListener("click", () => {
    const input = document.getElementById("couponInput");
    const msg = document.getElementById("couponMsg");
    const code = input.value.trim();

    if (!code) return;

    if (cart.applyCoupon(code)) {
      msg.textContent = cart.coupon.label;
      msg.classList.remove("d-none", "text-danger");
      msg.classList.add("text-success");
      input.disabled = true;
    } else {
      msg.textContent = "Codice non valido.";
      msg.classList.remove("d-none", "text-success");
      msg.classList.add("text-danger");
    }
  });
}

/* ════════════════════════════════════════════
   CHECKOUT FLOW
   ════════════════════════════════════════════ */
function initCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const toStep2 = document.getElementById("toStep2Btn");
  const backStep1 = document.getElementById("backStep1Btn");
  const payNow = document.getElementById("payNowBtn");
  const continueShopping = document.getElementById("continueShopping");

  // Open checkout
  checkoutBtn.addEventListener("click", () => {
    if (cart.items.length === 0) return;
    resetCheckout();
    // close offcanvas
    bootstrap.Offcanvas.getInstance(
      document.getElementById("cartOffcanvas"),
    )?.hide();
    setTimeout(() => {
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById("checkoutModal"),
      ).show();
    }, 400);
  });

  // Step 1 -> 2
  toStep2.addEventListener("click", () => {
    // Basic validation
    const fields = [
      "shipName",
      "shipSurname",
      "shipEmail",
      "shipAddress",
      "shipCity",
      "shipZip",
    ];
    let valid = true;
    fields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add("is-invalid");
        valid = false;
      } else el.classList.remove("is-invalid");
    });
    if (!valid) return;

    showCheckoutStep(2);
    buildOrderSummary();
  });

  // Step 2 -> 1
  backStep1.addEventListener("click", () => showCheckoutStep(1));

  // Pay Now
  payNow.addEventListener("click", () => {
    showCheckoutStep(3);
    simulatePayment();
  });

  // Continue Shopping
  continueShopping.addEventListener("click", () => {
    cart.clear();
  });

  // Toggle card form visibility
  document.querySelectorAll('input[name="payMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      document.getElementById("cardForm").style.display =
        radio.value === "card" ? "" : "none";
    });
  });
}

function resetCheckout() {
  showCheckoutStep(1);
  document.getElementById("processingView").classList.remove("d-none");
  document.getElementById("successView").classList.add("d-none");
  document.getElementById("payProgress").style.width = "0%";
}

function showCheckoutStep(step) {
  for (let i = 1; i <= 3; i++) {
    document
      .getElementById(`checkoutStep${i}`)
      .classList.toggle("d-none", i !== step);
  }
  // Update stepper
  document.querySelectorAll(".checkout-stepper .step").forEach((s) => {
    const sStep = +s.dataset.step;
    s.classList.remove("active", "completed");
    if (sStep === step) s.classList.add("active");
    else if (sStep < step) s.classList.add("completed");
  });
}

function buildOrderSummary() {
  const container = document.getElementById("checkoutSummaryItems");
  container.innerHTML = cart.items
    .map(
      (i) => `
        <div class="d-flex justify-content-between small mb-1">
            <span>${i.product.name} × ${i.qty}</span>
            <span>€${(i.product.price * i.qty).toFixed(2)}</span>
        </div>
    `,
    )
    .join("");

  if (cart.discountAmount > 0) {
    container.innerHTML += `<div class="d-flex justify-content-between small text-success"><span>Sconto coupon</span><span>-€${cart.discountAmount.toFixed(2)}</span></div>`;
  }
  if (cart.shipping > 0) {
    container.innerHTML += `<div class="d-flex justify-content-between small"><span>Spedizione</span><span>€${cart.shipping.toFixed(2)}</span></div>`;
  } else {
    container.innerHTML += `<div class="d-flex justify-content-between small text-success"><span>Spedizione</span><span>GRATIS</span></div>`;
  }

  document.getElementById("checkoutTotal").textContent =
    `€${cart.total.toFixed(2)}`;
  document.getElementById("payAmount").textContent =
    `€${cart.total.toFixed(2)}`;
}

function simulatePayment() {
  const progress = document.getElementById("payProgress");
  let pct = 0;
  const interval = setInterval(() => {
    pct += Math.random() * 15 + 5;
    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById("processingView").classList.add("d-none");
        document.getElementById("successView").classList.remove("d-none");

        // Fill confirmation
        const orderNum =
          "#ORD-" + String(Math.floor(100000 + Math.random() * 900000));
        document.getElementById("orderNumber").textContent = orderNum;
        document.getElementById("confItems").textContent = cart.totalItems;
        document.getElementById("confTotal").textContent =
          `€${cart.total.toFixed(2)}`;

        // Delivery estimate: 2-4 days from now
        const delivery = new Date();
        delivery.setDate(
          delivery.getDate() + 2 + Math.floor(Math.random() * 3),
        );
        document.getElementById("confDelivery").textContent =
          delivery.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
      }, 600);
    }
    progress.style.width = pct + "%";
  }, 400);
}

/* ════════════════════════════════════════════
   SCROLL ANIMATIONS
   ════════════════════════════════════════════ */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1 },
  );

  document
    .querySelectorAll(".fade-in, .feature-card")
    .forEach((el) => observer.observe(el));
}

/* ════════════════════════════════════════════
   BACK TO TOP
   ════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 400);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ════════════════════════════════════════════
   CARD NUMBER FORMATTING
   ════════════════════════════════════════════ */
function initCardFormatting() {
  const cardNum = document.getElementById("cardNumber");
  if (!cardNum) return;

  cardNum.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 16);
    e.target.value = val.replace(/(.{4})/g, "$1 ").trim();
  });

  const cardExp = document.getElementById("cardExpiry");
  if (cardExp) {
    cardExp.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + "/" + val.substring(2);
      e.target.value = val;
    });
  }
}
