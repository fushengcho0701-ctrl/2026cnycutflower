let allProducts = [];

async function loadProducts() {
  try {
    const res = await fetch(PRODUCT_API);
    const data = await res.json();
    if (data.status === "ok") {
      allProducts = data.products || [];
      renderProducts();
    }
  } catch (err) { console.error("載入失敗"); }
}

function renderProducts() {
  const container = document.getElementById("products-container");
  container.innerHTML = "";
  allProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img-wrap" data-fullsrc="${p.imageUrl}"><img src="${p.imageUrl}" loading="lazy" /></div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">HKD$${p.price}</div>
      <div class="product-qty"><input type="number" min="0" value="0" data-name="${p.name}" data-price="${p.price}" /></div>`;
    container.appendChild(card);
  });
  document.querySelectorAll(".product-qty input").forEach(i => i.addEventListener("input", updateCartSummary));
  bindImageLightbox();
}

function updateCartSummary() {
  let total = 0, preview = [];
  document.querySelectorAll(".product-qty input").forEach(input => {
    const qty = parseInt(input.value || "0", 10);
    if (qty > 0) {
      preview.push(`${input.dataset.name} x ${qty}`);
      total += qty * parseInt(input.dataset.price, 10);
    }
  });
  document.getElementById("cartPreview").textContent = preview.length ? preview.join("、") : "尚未選購";
  document.getElementById("totalAmount").textContent = `HKD$${total}`;
}

async function handleSubmit() {
  const name = document.getElementById("customerName").value.trim();
  const wa = document.getElementById("customerWhatsapp").value.trim();
  const items = [];
  let total = 0;
  let belowMin = [];

  document.querySelectorAll(".product-qty input").forEach(input => {
    const qty = parseInt(input.value || "0", 10);
    if (qty > 0) {
      if (qty < 4) belowMin.push(input.dataset.name);
      items.push({ name: input.dataset.name, qty, price: parseInt(input.dataset.price, 10) });
      total += qty * parseInt(input.dataset.price, 10);
    }
  });

  if (!name || !wa || !items.length) { alert("請填寫姓名、Whatsapp 並至少選擇一個品項。"); return; }
  if (belowMin.length > 0) { alert("以下品項不足 4 把，請修正數量：\n" + belowMin.join("\n")); return; }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;

  try {
    const res = await fetch(ORDER_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "payload=" + encodeURIComponent(JSON.stringify({
        customerName: name, customerWhatsapp: wa,
        shopName: document.getElementById("shopName").value.trim(),
        shopInstagram: document.getElementById("shopInstagram").value.trim(),
        items, total
      }))
    });
    const data = await res.json();
    if (data.status === "ok") showSuccessScreen({ customerName: name, total, items });
  } catch (err) { alert("送出失敗"); btn.disabled = false; }
}

function showSuccessScreen(payload) {
  document.getElementById("main-content").classList.add("hidden");
  document.getElementById("cartBar").classList.add("hidden");
  document.getElementById("success-screen").classList.remove("hidden");

  const itemsHtml = payload.items.map(it => `<div class="summary-item"><span>${it.name}</span><span>x ${it.qty}</span></div>`).join('');
  document.getElementById("order-summary-details").innerHTML = `
    <p><strong>訂購人：</strong>${payload.customerName}</p>
    <p><strong>總金額：</strong>HKD$${payload.total}</p>
    <hr/>${itemsHtml}`;

  const lisaNumber = "85292052548"; 
  const waMsg = `您好 Lisa，我已完成切花預購：\n姓名：${payload.customerName}\n總金額：HKD$${payload.total}`;
  document.getElementById("wa-confirm-btn").href = `https://wa.me/${lisaNumber}?text=${encodeURIComponent(waMsg)}`;
  window.scrollTo(0,0);
}

function bindImageLightbox() {
  const lb = document.getElementById("lightbox"), lbImg = document.getElementById("lightboxImg");
  document.querySelectorAll(".product-img-wrap").forEach(w => w.addEventListener("click", () => {
    lbImg.src = w.dataset.fullsrc; lb.classList.add("show");
  }));
  document.querySelectorAll("[data-role='close-lightbox']").forEach(b => b.addEventListener("click", () => lb.classList.remove("show")));
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  document.getElementById("submitBtn").addEventListener("click", handleSubmit);
});
