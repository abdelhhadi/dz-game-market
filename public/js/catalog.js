
/* DZ Game Market - Supabase-backed catalog */
var accounts = window.accounts || [];
var recharges = window.recharges || [];
window.accounts = accounts;
window.recharges = recharges;

const dzgmEsc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const dzgmT = (key, fallback) => window.translations?.[window.currentLanguage || localStorage.getItem("dzgm_language") || "ar"]?.[key] || fallback;
const dzgmMoney = value => new Intl.NumberFormat("fr-DZ").format(Number(value || 0)) + " DA";
const dzgmPriceMarkup = p => {
  const rows = [
    {key:"supports_dzd", price:p.price, label:dzgmT("currency_dzd", "الدينار الجزائري"), value:v=>dzgmMoney(v), supported:p.supports_dzd},
    {key:"supports_usd", price:p.price_usd, label:dzgmT("currency_usd", "الدولار"), value:v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)), supported:p.supports_usd},
    {key:"supports_flexy", price:p.price_flexy, label:dzgmT("currency_flexy", "الفليكسي"), value:v=>dzgmMoney(v), supported:p.supports_flexy}
  ];
  return `<div class="dzgm-price-list">${rows.map(r=>{
    const supported = r.supported !== false;
    const hasPrice = r.price !== null && r.price !== undefined && r.price !== "";
    const text = !supported ? dzgmT("unsupported_payment", "لا ندعم هذه الطريقة") : (hasPrice ? r.value(r.price) : dzgmT("price_unspecified", "السعر غير محدد"));
    return `<div class="dzgm-price-row ${supported?"":"unsupported"}"><span>${r.label}</span><strong>${dzgmEsc(text)}</strong></div>`;
  }).join("")}</div>`;
};
const dzgmSocialLinks = (raw) => {
  if (!raw) return "";
  let items = [];
  try { const parsed = JSON.parse(raw); items = Array.isArray(parsed) ? parsed : [parsed]; }
  catch { items = String(raw).split(/\n|,/).map(s => s.trim()).filter(Boolean); }
  return items.map(item => {
    const url = typeof item === "string" ? item : item.url;
    const label = typeof item === "string" ? item : (item.label || item.platform || item.url);
    if (!url) return "";
    let safeUrl = url.trim();
    if (!/^https?:\/\//i.test(safeUrl)) safeUrl = "https://" + safeUrl;
    try { const u = new URL(safeUrl); if (!["http:","https:"].includes(u.protocol)) return ""; }
    catch { return ""; }
    return `<a class="seller-social-link" href="${dzgmEsc(safeUrl)}" target="_blank" rel="noopener noreferrer">${dzgmEsc(label || dzgmT("seller_account", "حساب البائع"))}</a>`;
  }).join("");
};
const dzgmPhotos = p => {
  let arr = Array.isArray(p.gallery_urls) ? p.gallery_urls : [];
  if (p.image_url && !arr.includes(p.image_url)) arr = [p.image_url, ...arr];
  return arr.filter(Boolean);
};
const dzgmPhotoMarkup = (p) => {
  const photos = dzgmPhotos(p);
  if (!photos.length) return `<div class="dzgm-no-image"><i class="fa-solid fa-gamepad"></i></div>`;
  return `<div class="dzgm-photo-area">
    <img class="dzgm-main-photo" src="${dzgmEsc(photos[0])}" alt="${dzgmEsc(p.name)}" loading="lazy" onclick="dzgmOpenGallery(${Number(p.id)})">
    ${photos.length > 1 ? `<div class="dzgm-thumbs">${photos.slice(0,5).map((src,i)=>`<img src="${dzgmEsc(src)}" alt="صورة ${i+1}" loading="lazy" onclick="dzgmSetMainPhoto(this)">`).join("")}</div>` : ""}
  </div>`;
};
window.dzgmSetMainPhoto = function(img) {
  const area = img.closest(".dzgm-photo-area");
  const main = area && area.querySelector(".dzgm-main-photo");
  if (main) main.src = img.src;
};
window.dzgmOpenGallery = function(id) {
  const p = [...accounts, ...recharges].find(x => Number(x.id) === Number(id));
  if (!p) return;
  const photos = dzgmPhotos(p);
  if (!photos.length) return;
  const overlay = document.createElement("div");
  overlay.className = "dzgm-gallery-overlay";
  overlay.innerHTML = `<button class="dzgm-gallery-close" aria-label="${dzgmEsc(dzgmT("close_gallery", "إغلاق"))}">×</button><img src="${dzgmEsc(photos[0])}" alt="${dzgmEsc(p.name)}"><div class="dzgm-gallery-thumbs">${photos.map(src=>`<img src="${dzgmEsc(src)}" alt="" loading="lazy">`).join("")}</div>`;
  overlay.addEventListener("click", e => { if (e.target === overlay || e.target.classList.contains("dzgm-gallery-close")) overlay.remove(); });
  overlay.querySelectorAll(".dzgm-gallery-thumbs img").forEach(img => img.addEventListener("click", () => overlay.querySelector(":scope > img").src = img.src));
  document.body.append(overlay);
};
function renderAccounts() {
  const grid = document.getElementById("accountsGrid"); if (!grid) return;
  const gameFilter = document.getElementById("accountGameFilter")?.value || "all";
  const search = (document.getElementById("accountSearch")?.value || "").trim().toLowerCase();
  const sort = document.getElementById("accountSort")?.value || "default";
  let result = accounts.filter(p => p.is_active !== false);
  if (gameFilter !== "all") result = result.filter(p => p.game === gameFilter);
  if (search) result = result.filter(p => `${p.name} ${p.game} ${p.description}`.toLowerCase().includes(search));
  if (sort === "low") result.sort((a,b)=>Number(a.price)-Number(b.price));
  if (sort === "high") result.sort((a,b)=>Number(b.price)-Number(a.price));
  if (!result.length) { grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-gamepad"></i><h3>${dzgmEsc(translations[currentLanguage]?.accounts || "الحسابات")}</h3><p>${currentLanguage==="fr"?"Aucune offre pour le moment.":currentLanguage==="en"?"No offers available yet.":"لا توجد حسابات متاحة حاليًا. أضفها من لوحة المسؤول."}</p></div>`; return; }
  grid.innerHTML = result.map(p => `<article class="product-card dzgm-product-card">
    ${dzgmPhotoMarkup(p)}
    <div class="product-content"><small>${dzgmEsc(p.game)}</small><h3>${dzgmEsc(p.name)}</h3>
    <p class="dzgm-description">${dzgmEsc(p.description || "")}</p>
    <div class="dzgm-seller-block"><h4>${dzgmEsc(dzgmT("seller_account", "حساب البائع"))}</h4><div class="dzgm-seller-links">${dzgmSocialLinks(p.seller_social) || `<span class="seller-link-empty">${dzgmEsc(dzgmT("seller_no_links", "لم يضف البائع روابطه بعد."))}</span>`}</div></div>
    <div class="product-footer"><div class="dzgm-product-prices">${dzgmPriceMarkup(p)}</div></div></div>
  </article>`).join("");
}
function renderRecharges() {
  const grid = document.getElementById("rechargesGrid"); if (!grid) return;
  const result = recharges.filter(p => p.is_active !== false).sort((a,b)=>Number(Boolean(b.is_promotion))-Number(Boolean(a.is_promotion)) || Number(b.created_at_timestamp||0)-Number(a.created_at_timestamp||0));
  if (!result.length) { grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-bolt"></i><h3>${dzgmEsc(translations[currentLanguage]?.recharges || "الشحن")}</h3><p>${currentLanguage==="fr"?"Aucune offre pour le moment.":currentLanguage==="en"?"No top-up offers yet.":"لا توجد عروض شحن حاليًا. أضفها من لوحة المسؤول."}</p></div>`; return; }
  grid.innerHTML = result.map(p => `<article class="product-card dzgm-product-card ${p.is_promotion ? "dzgm-promoted" : ""}">
    ${p.is_promotion ? `<span class="dzgm-promo-ribbon"><i class="fa-solid fa-star"></i> ${dzgmT("promotion", "عرض مميز")}</span>` : ""}
    ${dzgmPhotoMarkup(p)}
    <div class="product-content"><small>${dzgmEsc(p.game)}</small><h3>${dzgmEsc(p.name || p.game)}</h3>
    ${p.description ? `<p class="dzgm-description">${dzgmEsc(p.description)}</p>` : ""}
    ${dzgmPriceMarkup(p)}
    <div class="dzgm-seller-links">${dzgmSocialLinks(p.seller_social)}</div>
    <div class="product-footer"><span>${p.is_promotion ? (dzgmT("featured_offer", "عرض مثبت في الأعلى")) : ""}</span><button onclick="dzgmContactSeller(${Number(p.id)})">${dzgmT("contact_seller", "التواصل مع البائع")}</button></div></div>
  </article>`).join("");
}
window.dzgmContactSeller = function(id) {
  const p = recharges.find(x => Number(x.id) === Number(id));
  if (!p) return;
  let links = [];
  try { links = Array.isArray(p.seller_social) ? p.seller_social : JSON.parse(p.seller_social || "[]"); } catch { links = String(p.seller_social||"").split(/\n|,/).filter(Boolean); }
  const first = links[0];
  const url = typeof first === "string" ? first : first?.url;
  if (url) { let href = url.trim(); if (!/^https?:\/\//i.test(href)) href = "https://" + href; window.open(href, "_blank", "noopener"); }
  else if (typeof showToast === "function") showToast(dzgmT("seller_no_links", "لم يضف البائع رابط تواصل بعد."));
  else alert(dzgmT("seller_no_links", "لم يضف البائع رابط تواصل بعد."));
};
/* Preserve existing order modal logic by mapping database records to its expected shape. */
window.openAccountOrderById = function(id) {
  const p = accounts.find(item => Number(item.id) === Number(id));
  if (!p) return;
  if (typeof openAccountOrder === "function") openAccountOrder(p.name, Number(p.price), p);
};
window.openRechargeOrderById = function(id) { window.dzgmContactSeller(id); };
async function dzgmLoadCatalog() {
  try {
    const response = await fetch('/api/public/products', { headers: { 'Accept': 'application/json' } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.details || result.error || `HTTP ${response.status}`);
    const rows = result.data || [];
    const a = rows.filter(p => p.category === 'account');
    const r = rows.filter(p => p.category === 'recharge').sort((x,y) => Number(Boolean(y.is_promotion))-Number(Boolean(x.is_promotion)) || (Date.parse(y.created_at||'')||0)-(Date.parse(x.created_at||'')||0));
    accounts.splice(0, accounts.length, ...a.map(p => ({...p, gallery_urls:Array.isArray(p.gallery_urls)?p.gallery_urls:[], level:'—',rank:'—',items:p.description||'',className:'',icon:'fa-gamepad'})));
    recharges.splice(0, recharges.length, ...r.map(p => ({...p, name:p.name || p.game, amounts:[Number(p.price||0)], description:p.description||'', className:'',icon:'fa-bolt', created_at_timestamp:Date.parse(p.created_at||'')||0})));
    window.accounts = accounts; window.recharges = recharges;
    renderAccounts(); renderRecharges();
  } catch (error) {
    console.error('DZ Game Market catalog load error:', error);
    const message = `تعذر تحميل المنتجات: ${dzgmEsc(error.message)}. راجع Terminal في VS Code.`;
    for (const id of ['accountsGrid', 'rechargesGrid']) {
      const grid = document.getElementById(id);
      if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${message}</p></div>`;
    }
  }
}
window.dzgmRefreshCatalog = dzgmLoadCatalog;
document.addEventListener("DOMContentLoaded", dzgmLoadCatalog);
