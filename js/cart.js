/* ═══════════════════════════════════════════════
   Cart Manager — Gestione completa del carrello
   ═══════════════════════════════════════════════ */

class CartManager {
  constructor() {
    this.items = [];
    this.coupon = null;
    this.shippingCost = 4.99;
    this.freeShippingThreshold = 50;
  }

  addItem(product, qty = 1) {
    const existing = this.items.find((i) => i.product.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ product, qty });
    }
    this.save();
    this.render();
    this.showToast(`"${product.name}" aggiunto al carrello!`);
  }

  removeItem(productId) {
    this.items = this.items.filter((i) => i.product.id !== productId);
    this.save();
    this.render();
  }

  updateQty(productId, delta) {
    const item = this.items.find((i) => i.product.id === productId);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    this.save();
    this.render();
  }

  clear() {
    this.items = [];
    this.coupon = null;
    this.save();
    this.render();
  }

  applyCoupon(code) {
    const c = COUPONS[code.toUpperCase()];
    if (!c) return false;
    this.coupon = { code: code.toUpperCase(), ...c };
    this.render();
    return true;
  }

  get subtotal() {
    return this.items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  }

  get discountAmount() {
    if (!this.coupon) return 0;
    if (this.coupon.type === "percent")
      return this.subtotal * (this.coupon.value / 100);
    return Math.min(this.coupon.value, this.subtotal);
  }

  get shipping() {
    if (this.items.length === 0) return 0;
    return this.subtotal - this.discountAmount >= this.freeShippingThreshold
      ? 0
      : this.shippingCost;
  }

  get total() {
    return Math.max(0, this.subtotal - this.discountAmount + this.shipping);
  }

  get totalItems() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  }

  // SAVINGS: how much user saves from original prices
  get totalSavings() {
    return this.items.reduce((sum, i) => {
      const orig = i.product.originalPrice || i.product.price;
      return sum + (orig - i.product.price) * i.qty;
    }, 0);
  }

  save() {
    try {
      localStorage.setItem(
        "vetrina_cart",
        JSON.stringify(
          this.items.map((i) => ({ id: i.product.id, qty: i.qty })),
        ),
      );
    } catch (e) {}
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem("vetrina_cart") || "[]");
      data.forEach((d) => {
        const prod = PRODUCTS.find((p) => p.id === d.id);
        if (prod) this.items.push({ product: prod, qty: d.qty });
      });
    } catch (e) {}
    this.render();
  }

  // ── RENDER CART UI ──
  render() {
    const cartItems = document.getElementById("cartItems");
    const cartEmpty = document.getElementById("cartEmpty");
    const cartFooter = document.getElementById("cartFooter");
    const cartCount = document.getElementById("cartCount");
    const cartSubtotal = document.getElementById("cartSubtotal");
    const cartDiscount = document.getElementById("cartDiscount");
    const cartShipping = document.getElementById("cartShipping");
    const cartTotal = document.getElementById("cartTotal");

    // Badge
    if (this.totalItems > 0) {
      cartCount.textContent = this.totalItems;
      cartCount.classList.remove("d-none");
    } else {
      cartCount.classList.add("d-none");
    }

    // Empty state
    if (this.items.length === 0) {
      cartEmpty.style.display = "";
      cartFooter.style.display = "none";
      // clear rendered items except empty state
      Array.from(cartItems.children).forEach((c) => {
        if (c.id !== "cartEmpty") c.remove();
      });
      return;
    }

    cartEmpty.style.display = "none";
    cartFooter.style.display = "";

    // Build items HTML
    const existingItems = cartItems.querySelectorAll(".cart-item");
    existingItems.forEach((el) => el.remove());

    this.items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
                <div class="cart-item-img">
                    <i class="bi ${item.product.icon}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.product.name}</div>
                    <div class="cart-item-price">€${item.product.price.toFixed(2)}</div>
                    ${
                      item.product.originalPrice > item.product.price
                        ? `<small class="text-decoration-line-through text-muted">€${item.product.originalPrice.toFixed(2)}</small>
                           <small class="text-danger ms-1">-${item.product.discount}%</small>`
                        : ""
                    }
                    <div class="cart-qty-ctrl mt-1">
                        <button class="btn btn-outline-secondary btn-sm" onclick="cart.updateQty(${item.product.id}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button class="btn btn-outline-secondary btn-sm" onclick="cart.updateQty(${item.product.id}, 1)">+</button>
                        <button class="btn btn-outline-danger btn-sm ms-auto" onclick="cart.removeItem(${item.product.id})" title="Rimuovi">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>
            `;
      cartItems.appendChild(div);
    });

    // Totals
    cartSubtotal.textContent = `€${this.subtotal.toFixed(2)}`;
    cartDiscount.textContent = `-€${this.discountAmount.toFixed(2)}`;
    cartShipping.textContent =
      this.shipping === 0 ? "GRATIS" : `€${this.shipping.toFixed(2)}`;
    cartShipping.className = this.shipping === 0 ? "text-success fw-bold" : "";
    cartTotal.textContent = `€${this.total.toFixed(2)}`;
  }

  showToast(msg) {
    const toastEl = document.getElementById("cartToast");
    const toastMsg = document.getElementById("toastMsg");
    toastMsg.textContent = msg;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 });
    toast.show();
  }
}

// Global cart instance
const cart = new CartManager();
