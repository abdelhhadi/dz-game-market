/* Public mediator directory for DZ Game Market — localized dynamic content */
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
  const platforms = [
    ["facebook_url","Facebook","fa-brands fa-facebook"],
    ["whatsapp_url","WhatsApp","fa-brands fa-whatsapp"],
    ["instagram_url","Instagram","fa-brands fa-instagram"],
    ["tiktok_url","TikTok","fa-brands fa-tiktok"]
  ];
  const lang = () => window.currentLanguage || localStorage.getItem("dzgm_language") || "ar";
  const t = key => window.translations?.[lang()]?.[key] || window.translations?.ar?.[key] || key;
  async function loadMediators(){
    const grid=document.getElementById("mediatorsGrid");
    if(!grid)return;
    grid.innerHTML = `<p class="mediators-loading">${esc(t("mediators_loading"))}</p>`;
    try{
      const response=await fetch('/api/public/mediators',{headers:{'Accept':'application/json'}});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.details || result.error || `HTTP ${response.status}`);
      const data=result.data || [];
      if(!data.length){grid.innerHTML=`<p class="mediators-loading">${esc(t("mediators_empty"))}</p>`;return;}
      grid.innerHTML=data.map(m=>{
        const avatar=m.image_url?`<img class="mediator-avatar" src="${esc(m.image_url)}" alt="${esc(m.name)}" loading="lazy">`:'<div class="mediator-avatar-placeholder"><i class="fa-solid fa-user-shield"></i></div>';
        const links=platforms.filter(([key])=>m[key]).map(([key,label,icon])=>{
          let url=String(m[key]).trim();
          if(!/^https?:\/\//i.test(url))url="https://"+url;
          try{const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol))return "";url=parsed.href;}catch{return "";}
          return `<a class="mediator-social-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="${icon}"></i><span>${label}</span><small>${esc(t("open_link"))} <i class="fa-solid fa-arrow-up-right-from-square"></i></small></a>`;
        }).join("");
        return `<article class="mediator-card">${avatar}<h3>${esc(m.name)}</h3>${m.description?`<p>${esc(m.description)}</p>`:""}<div class="mediator-socials">${links||`<p>${esc(t("mediator_no_links"))}</p>`}</div></article>`;
      }).join("");
    }catch(err){console.error("DZ Game Market mediator load error:",err);grid.innerHTML=`<p class="mediators-loading">${esc(t("mediators_load_error"))}: ${esc(err.message)}</p>`;}
  }
  document.addEventListener("DOMContentLoaded",loadMediators);
  window.dzgmLoadMediators=loadMediators;
})();
