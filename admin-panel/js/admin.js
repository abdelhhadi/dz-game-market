



const ADMIN_UID = "1e389dfb-a16b-438e-a1c8-4468bd308148";
const BUCKET = "product-images";
const MEDIATOR_TABLE = "mediators";
const $ = id => document.getElementById(id);
let products = [];
let currentGallery = [];
let editingImageUrl = null;
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const apiRequest = async (path, options={}) => {
 const { data:{session} } = await supabaseClient.auth.getSession();
 if (!session?.access_token) throw new Error("سجّل الدخول أولًا.");
 const headers = new Headers(options.headers || {}); headers.set("Authorization", `Bearer ${session.access_token}`);
 if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
 const response = await fetch(`/api${path}`, { ...options, headers });
 const body = await response.json().catch(()=>({}));
 if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
 return body;
};
const apiUploadImage = async file => {
 if (!validImage(file)) throw new Error("نوع الصورة غير مدعوم أو حجمها يتجاوز 5 ميغابايت.");
 const form = new FormData(); form.append("image", file);
 const result = await apiRequest("/admin/upload", { method:"POST", body:form }); return result.url;
};
function status(message,error=false){$("statusMessage").textContent=message;$("statusMessage").classList.toggle("error",error);}
function loginStatus(message,error=false){$("loginStatus").textContent=message;$("loginStatus").classList.toggle("error",error);}
function showDashboard(show){$("loginSection").hidden=show;$("dashboard").hidden=!show;}
async function requireAdmin(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(!session || session.user.id!==ADMIN_UID){showDashboard(false);return false;}
 showDashboard(true); await loadProducts(); await loadMediators(); return true;
}
$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();loginStatus("جارٍ تسجيل الدخول...");
 const {error}=await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
 if(error){loginStatus("فشل الدخول تحقق من البريد وكلمة المرور ",true);return;}
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user||user.id!==ADMIN_UID){await supabaseClient.auth.signOut();loginStatus("هذا الحساب ليس حساب المسؤول المصرح به.",true);return;}
 loginStatus("");await requireAdmin();
});
$("logoutBtn").addEventListener("click",async()=>{await supabaseClient.auth.signOut();showDashboard(false);resetForm();});
$("refreshBtn").addEventListener("click", () => {
  window.location.reload();
});
$("category").addEventListener("change",updateCategoryFields);
function updateCategoryFields(){
 const account=$("category").value==="account";
 document.querySelectorAll(".account-only").forEach(el=>el.hidden=!account);
 $("promotionWrap").hidden=account;
 $("isPromotion").checked=account?false:$("isPromotion").checked;
 $("name").required=account;
}
$("image").addEventListener("change",()=>{
 const file=$("image").files[0];if(!file){$("imagePreview").hidden=true;return;}
 if(!validImage(file)){status("استخدم صورة JPG أو PNG أو WebP بحجم أقل من 5 ميغابايت.",true);$("image").value="";return;}
 $("imagePreview").src=URL.createObjectURL(file);$("imagePreview").hidden=false;
});
$("gallery").addEventListener("change",()=>{
 const files=[...$("gallery").files];
 if(files.some(f=>!validImage(f))){status("كل الصور الإضافية يجب أن تكون JPG أو PNG أو WebP وأقل من 5 ميغابايت للصورة.",true);$("gallery").value="";return;}
 $("galleryPreview").replaceChildren(...files.map(file=>{const img=document.createElement("img");img.src=URL.createObjectURL(file);img.alt=file.name;return img;}));
});
function validImage(file){return ["image/jpeg","image/png","image/webp"].includes(file.type)&&file.size<=5*1024*1024;}
async function uploadImage(file){ return apiUploadImage(file); }
async function uploadGallery(files){const urls=[];for(const f of files)urls.push(await uploadImage(f));return urls;}
function resetForm(){
 $("productForm").reset();$("productId").value="";$("formTitle").textContent="إضافة منتج جديد";
 $("imagePreview").hidden=true;$("galleryPreview").replaceChildren();$("cancelEdit").hidden=true;
 currentGallery=[];editingImageUrl=null;
 $("supportsDzd").checked=true;$("supportsUsd").checked=true;$("supportsFlexy").checked=true;
 updateCategoryFields();status("");
}
$("cancelEdit").addEventListener("click",resetForm);
$("productForm").addEventListener("submit",async e=>{
 e.preventDefault();const btn=$("saveBtn");btn.disabled=true;status("جارٍ حفظ المنتج...");
 try{
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user||user.id!==ADMIN_UID)throw new Error("سجّل الدخول بحساب المسؤول أولًا.");
  const id=$("productId").value;const category=$("category").value;const old=products.find(p=>String(p.id)===id);
  const imageFile=$("image").files[0];let image_url=imageFile?await uploadImage(imageFile):(old?.image_url||null);
  let gallery_urls=[...currentGallery];
  const uploadedGallery=await uploadGallery([...$("gallery").files]);gallery_urls=[...gallery_urls,...uploadedGallery];
  if(image_url && !gallery_urls.includes(image_url))gallery_urls.unshift(image_url);
  const seller_social=$("sellerSocial").value.split(/\n/).map(s=>s.trim()).filter(Boolean);
  const priceValue=$("price").value.trim();
  const payload={category,game:$("game").value.trim(),name:category==="recharge"?$("game").value.trim():$("name").value.trim(),price:priceValue===""?0:Number(priceValue),price_usd:$("priceUsd").value.trim()===""?null:Number($("priceUsd").value),price_flexy:$("priceFlexy").value.trim()===""?null:Number($("priceFlexy").value),supports_dzd:$("supportsDzd").checked,supports_usd:$("supportsUsd").checked,supports_flexy:$("supportsFlexy").checked,description:$("description").value.trim(),image_url,gallery_urls,seller_social,is_promotion:category==="recharge"&&$("isPromotion").checked,is_active:true,updated_at:new Date().toISOString()};
  if(!payload.game||!Number.isFinite(payload.price)||payload.price<0)throw new Error("تحقق من اسم اللعبة والسعر بالدينار.");
  if(payload.price_usd!==null&&(!Number.isFinite(payload.price_usd)||payload.price_usd<0))throw new Error("تحقق من السعر بالدولار.");
  if(payload.price_flexy!==null&&(!Number.isFinite(payload.price_flexy)||payload.price_flexy<0))throw new Error("تحقق من سعر الفليكسي.");
  if(category==="account"&&!payload.name)throw new Error("اكتب اسم الحساب أو عنوان العرض.");
  if(id) await apiRequest(`/admin/products/${Number(id)}`,{method:"PATCH",body:JSON.stringify(payload)});
  else await apiRequest("/admin/products",{method:"POST",body:JSON.stringify(payload)});
  resetForm();await loadProducts();status(id?"تم تعديل المنتج بنجاح.":"تمت إضافة المنتج بنجاح.");
 }catch(err){console.error(err);status(err.message||"حدث خطأ أثناء الحفظ.",true);}
 finally{btn.disabled=false;}
});
async function loadProducts(){
 status("جارٍ تحميل المنتجات...");
 let data; try { ({data}=await apiRequest("/admin/products")); } catch(error){status("تعذر تحميل المنتجات من الخادم الخلفي: "+error.message,true);console.error(error);return;}
 products=data||[];$("accountCount").textContent=products.filter(p=>p.category==="account"&&p.is_active).length;
 $("rechargeCount").textContent=products.filter(p=>p.category==="recharge"&&p.is_active).length;renderProducts();status("");
}
function renderProducts(){
 const list=$("productList");list.replaceChildren();$("emptyState").hidden=products.length>0;
 products.forEach(p=>{
  const card=document.createElement("article");card.className="admin-product-card";
  const img=document.createElement("img");img.src=p.image_url||"";img.alt=p.name||p.game; if(!p.image_url)img.style.visibility="hidden";card.append(img);
  const info=document.createElement("div");info.className="admin-product-info";
  const tag=document.createElement("span");tag.className="product-tag"+(p.is_promotion?" promo":"");tag.textContent=p.category==="account"?"حساب للبيع":p.is_promotion?"عرض شحن مثبت":"عرض شحن";
  const title=document.createElement("h3");title.textContent=p.name||p.game;
  const detail=document.createElement("p");detail.textContent=`${p.game} · ${p.supports_dzd===false?"الدينار غير مدعوم":(new Intl.NumberFormat("fr-DZ").format(p.price||0)+" دج")} · ${p.supports_usd===false?"الدولار غير مدعوم":(p.price_usd!=null? p.price_usd+" USD":"")} · ${p.supports_flexy===false?"الفليكسي غير مدعوم":(p.price_flexy!=null? p.price_flexy+" دج فليكسي":"")} · ${(p.gallery_urls||[]).length|| (p.image_url?1:0)} صورة`;
  const desc=document.createElement("p");desc.textContent=p.description||"بدون وصف";info.append(tag,title,detail,desc);
  const actions=document.createElement("div");actions.className="product-actions";
  const edit=document.createElement("button");edit.className="secondary-btn";edit.type="button";edit.textContent="تعديل";edit.addEventListener("click",()=>editProduct(p));
  const del=document.createElement("button");del.className="danger-btn";del.type="button";del.textContent="حذف";del.addEventListener("click",()=>deleteProduct(p));
  actions.append(edit,del);card.append(info,actions);list.append(card);
 });
}
function editProduct(p){
 $("productId").value=p.id;$("category").value=p.category;$("game").value=p.game;$("name").value=p.category==="recharge"?"":p.name||"";
 $("price").value=p.price??"";$("priceUsd").value=p.price_usd??"";$("priceFlexy").value=p.price_flexy??"";
 $("supportsDzd").checked=p.supports_dzd!==false;$("supportsUsd").checked=p.supports_usd!==false;$("supportsFlexy").checked=p.supports_flexy!==false;
 $("description").value=p.description||"";$("sellerSocial").value=(Array.isArray(p.seller_social)?p.seller_social:[]).join("\n");
 $("isPromotion").checked=Boolean(p.is_promotion);currentGallery=Array.isArray(p.gallery_urls)?[...p.gallery_urls]:[];editingImageUrl=p.image_url;
 $("image").value="";$("gallery").value="";$("galleryPreview").replaceChildren(...currentGallery.map(src=>{const img=document.createElement("img");img.src=src;img.alt="صورة محفوظة";return img;}));
 if(p.image_url){$("imagePreview").src=p.image_url;$("imagePreview").hidden=false;}else $("imagePreview").hidden=true;
 $("formTitle").textContent="تعديل المنتج";$("cancelEdit").hidden=false;updateCategoryFields();window.scrollTo({top:0,behavior:"smooth"});
}
function dzgmConfirmDelete(productName) {
 return new Promise(resolve => {
  const existing = document.getElementById("dzgmDeleteConfirm");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "dzgmDeleteConfirm";
  overlay.className = "dzgm-confirm-overlay";
  overlay.innerHTML = `
   <section class="dzgm-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dzgmConfirmTitle" aria-describedby="dzgmConfirmMessage" dir="rtl">
    <div class="dzgm-confirm-icon" aria-hidden="true"><i class="fa-solid fa-trash-can"></i></div>
    <h2 id="dzgmConfirmTitle">تأكيد الحذف</h2>
    <p id="dzgmConfirmMessage">هل تريد حذف <strong></strong>؟</p>
    <p class="dzgm-confirm-warning">لا يمكن التراجع عن هذا الإجراء.</p>
    <div class="dzgm-confirm-actions">
     <button type="button" class="dzgm-confirm-delete">نعم، احذف</button>
     <button type="button" class="dzgm-confirm-cancel">إلغاء</button>
    </div>
   </section>`;
  overlay.querySelector("#dzgmConfirmMessage strong").textContent = `«${productName || "هذا العنصر"}»`;
  const finish = value => { overlay.remove(); document.removeEventListener("keydown", onKey); resolve(value); };
  const onKey = event => { if (event.key === "Escape") finish(false); };
  overlay.addEventListener("click", event => { if (event.target === overlay) finish(false); });
  overlay.querySelector(".dzgm-confirm-cancel").addEventListener("click", () => finish(false));
  overlay.querySelector(".dzgm-confirm-delete").addEventListener("click", () => finish(true));
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
  overlay.querySelector(".dzgm-confirm-delete").focus();
 });
}
async function deleteProduct(p){
 if(!await dzgmConfirmDelete(p.name || p.game)) return;
 try { await apiRequest(`/admin/products/${Number(p.id)}`,{method:"DELETE"}); }
 catch(error){status("تعذر الحذف: "+error.message,true);console.error(error);return;}
 await loadProducts();status("تم حذف المنتج من الموقع.");
}
supabaseClient.auth.onAuthStateChange(()=>setTimeout(()=>requireAdmin(),0));
updateCategoryFields();requireAdmin();


/* Mediator management */
let mediators = [];
function mediatorStatus(message,error=false){$("mediatorStatus").textContent=message;$("mediatorStatus").classList.toggle("error",error);}
$("mediatorImage").addEventListener("change",()=>{
 const file=$("mediatorImage").files[0];
 if(!file){$("mediatorImagePreview").hidden=true;return;}
 if(!validImage(file)){mediatorStatus("استخدم صورة JPG أو PNG أو WebP بحجم أقل من 5 ميغابايت.",true);$("mediatorImage").value="";return;}
 $("mediatorImagePreview").src=URL.createObjectURL(file);$("mediatorImagePreview").hidden=false;
});
function resetMediatorForm(){
 $("mediatorForm").reset();$("mediatorId").value="";$("mediatorFormTitle").textContent="إضافة وسيط جديد";
 $("mediatorImagePreview").hidden=true;$("mediatorActive").checked=true;$("cancelMediatorEdit").hidden=true;mediatorStatus("");
}
$("cancelMediatorEdit").addEventListener("click",resetMediatorForm);
$("mediatorForm").addEventListener("submit",async e=>{
 e.preventDefault();const btn=$("saveMediatorBtn");btn.disabled=true;mediatorStatus("جارٍ حفظ بيانات الوسيط...");
 try{
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user||user.id!==ADMIN_UID)throw new Error("سجّل الدخول بحساب المسؤول أولًا.");
  const id=$("mediatorId").value;const old=mediators.find(m=>String(m.id)===id);
  let image_url=old?.image_url||null;const file=$("mediatorImage").files[0];if(file)image_url=await uploadImage(file);
  const urlValue=id=>{const v=$(id).value.trim();if(!v)return null;const u=new URL(v);if(!["http:","https:"].includes(u.protocol))throw new Error("رابط التواصل غير صالح.");return u.href;};
  const payload={name:$("mediatorName").value.trim(),description:$("mediatorDescription").value.trim(),image_url,facebook_url:urlValue("mediatorFacebook"),whatsapp_url:urlValue("mediatorWhatsapp"),instagram_url:urlValue("mediatorInstagram"),tiktok_url:urlValue("mediatorTiktok"),is_active:$("mediatorActive").checked,updated_at:new Date().toISOString()};
  if(!payload.name)throw new Error("اكتب اسم الوسيط.");
  if(id) await apiRequest(`/admin/mediators/${Number(id)}`,{method:"PATCH",body:JSON.stringify(payload)});
  else await apiRequest("/admin/mediators",{method:"POST",body:JSON.stringify(payload)});
  resetMediatorForm();await loadMediators();mediatorStatus(id?"تم تعديل بيانات الوسيط.":"تمت إضافة الوسيط.");
 }catch(err){console.error(err);mediatorStatus(err.message||"تعذر حفظ الوسيط.",true);}
 finally{btn.disabled=false;}
});
async function loadMediators(){
 let data;
 try { ({data}=await apiRequest("/admin/mediators")); }
 catch(error){console.error("Mediators load error:",error);mediatorStatus("تعذر تحميل الوسطاء: "+error.message,true);return;}
 mediators=data||[];renderMediators();
}
function renderMediators(){
 const list=$("mediatorList");if(!list)return;list.replaceChildren();$("mediatorEmptyState").hidden=mediators.length>0;
 mediators.forEach(m=>{
  const card=document.createElement("article");card.className="admin-product-card";
  const img=document.createElement("img");img.src=m.image_url||"";img.alt=m.name;if(!m.image_url)img.style.visibility="hidden";card.append(img);
  const info=document.createElement("div");info.className="admin-product-info";
  const title=document.createElement("h3");title.textContent=m.name;
  const detail=document.createElement("p");detail.textContent=[m.facebook_url&&"Facebook",m.whatsapp_url&&"WhatsApp",m.instagram_url&&"Instagram",m.tiktok_url&&"TikTok"].filter(Boolean).join(" · ")||"لا توجد روابط تواصل";
  const state=document.createElement("p");state.textContent=m.is_active?"ظاهر في الموقع":"مخفي عن الزوار";info.append(title,detail,state);
  const actions=document.createElement("div");actions.className="product-actions";
  const edit=document.createElement("button");edit.className="secondary-btn";edit.type="button";edit.textContent="تعديل";edit.addEventListener("click",()=>editMediator(m));
  const del=document.createElement("button");del.className="danger-btn";del.type="button";del.textContent="حذف";del.addEventListener("click",()=>deleteMediator(m));
  actions.append(edit,del);card.append(info,actions);list.append(card);
 });
}
function editMediator(m){
 $("mediatorId").value=m.id;$("mediatorName").value=m.name||"";$("mediatorDescription").value=m.description||"";
 $("mediatorFacebook").value=m.facebook_url||"";$("mediatorWhatsapp").value=m.whatsapp_url||"";
 $("mediatorInstagram").value=m.instagram_url||"";$("mediatorTiktok").value=m.tiktok_url||"";
 $("mediatorActive").checked=m.is_active!==false;$("mediatorImage").value="";
 if(m.image_url){$("mediatorImagePreview").src=m.image_url;$("mediatorImagePreview").hidden=false;}else $("mediatorImagePreview").hidden=true;
 $("mediatorFormTitle").textContent="تعديل بيانات الوسيط";$("cancelMediatorEdit").hidden=false;window.scrollTo({top:0,behavior:"smooth"});
}
async function deleteMediator(m){
 if(!await dzgmConfirmDelete(m.name || "هذا الوسيط"))return;
 try { await apiRequest(`/admin/mediators/${Number(m.id)}`,{method:"DELETE"}); }
 catch(error){mediatorStatus("تعذر حذف الوسيط: "+error.message,true);console.error(error);return;}
 await loadMediators();mediatorStatus("تم حذف الوسيط.");
}
