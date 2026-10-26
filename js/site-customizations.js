/* DZ Game Market: additive customizations. Existing marketplace and mediator features are preserved. */
(() => {
  const root = document.documentElement;
  const allowed = ['light','dark'];
  function applyTheme(theme) {
    if (!allowed.includes(theme)) theme = 'light';
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(btn => {
      const active = btn.dataset.themeChoice === theme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('dzgm-theme', theme); } catch (_) {}
  }
  document.addEventListener('DOMContentLoaded', () => {
    let saved = 'light';
    try { saved = localStorage.getItem('dzgm-theme') || 'light'; } catch (_) {}
    applyTheme(saved);
    document.querySelectorAll('[data-theme-choice]').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.themeChoice)));
    const overlay = document.getElementById('dzgmInfoModal');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) window.dzgmCloseInfoModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.dzgmCloseInfoModal(); });
  });
  
const contactLinks = {
    whatsapp: 'https://wa.me/qr/56YHJVE6VGIDJ1',
    facebook: 'https://www.facebook.com/share/1NqowXmR6r/',
    instagram: 'https://www.instagram.com/abdelhhadi?rpxt=a3A5MnBncXd3djFq',
    tiktok: 'https://www.tiktok.com/@YOUR_USERNAME'
};

  };
  const terms = `<section class="dzgm-terms-content"><p><strong>آخر تحديث: أكتوبر 2026</strong></p>
  <h3>1. طبيعة المنصة</h3><p>DZ Game Market منصة لعرض إعلانات الحسابات الرقمية وخدمات شحن الألعاب وربط المستخدمين بالبائعين والوسطاء. ما لم يُذكر صراحةً خلاف ذلك، فالمنصة ليست مالكة للحسابات المعروضة ولا تضمن موافقة ناشر اللعبة على نقل الحساب.</p>
  <h3>2. مسؤولية البائع</h3><p>يلتزم البائع بتقديم معلومات صحيحة، وامتلاك الحق في عرض الحساب، وعدم نشر حسابات مسروقة أو مخترقة أو مخالفة للقانون أو لشروط اللعبة. يجب توضيح السعر والمحتويات والقيود المعروفة قبل الاتفاق.</p>
  <h3>3. مسؤولية المشتري</h3><p>على المشتري مراجعة تفاصيل العرض والتحقق من البائع والاتفاق على السعر وطريقة التسليم قبل الدفع. لا تشارك كلمات المرور أو رموز التحقق مع أشخاص غير موثوقين، ولا ترسل أموالًا بناءً على وعود غير موثقة.</p>
  <h3>4. الدفع والتسليم</h3><p>تُتفق تفاصيل الدفع والتسليم مباشرة بين الأطراف ما لم تعلن المنصة عن آلية أخرى بوضوح. لا تدّعي المنصة الاحتفاظ بالأموال أو ضمان استردادها ما لم تُقدَّم خدمة ضمان مكتوبة ومفعّلة. احتفظ بإثباتات الدفع والمحادثات.</p>
  <h3>5. الوسطاء والنزاعات</h3><p>وجود وسيط في الموقع لا يعني ضمانًا مطلقًا للمعاملة. تحقّق من هوية الوسيط وتفاصيل الخدمة والرسوم قبل التعامل. يمكن إيقاف أو إزالة الإعلانات المضللة أو المشبوهة، مع إمكانية طلب معلومات داعمة عند معالجة الشكاوى.</p>
  <h3>6. الحسابات الرقمية ومخاطرها</h3><p>قد تمنع بعض شركات الألعاب بيع الحسابات أو نقلها، وقد يؤدي ذلك إلى تقييد الحساب أو إغلاقه. على المستخدمين مراجعة شروط ناشر اللعبة؛ ولا تضمن المنصة بقاء الحساب أو عدم استرجاعه من مالكه السابق.</p>
  <h3>7. الخصوصية والأمان</h3><p>استخدم بيانات التواصل فقط لإتمام المعاملة أو الاستفسار عنها. لا تنشر بيانات شخصية أو معلومات دخول حساسة. قد تُستخدم البيانات التي يرسلها المستخدم لتشغيل الخدمة ومعالجة البلاغات، وفق القوانين المعمول بها.</p>
  <h3>8. إساءة الاستخدام وتعديل الشروط</h3><p>يُمنع الاحتيال والتضليل والتحرش ومحاولة اختراق الموقع أو إساءة استخدامه. يجوز تحديث هذه الشروط عند الحاجة، ويُذكر تاريخ آخر تحديث أعلى الصفحة.</p>
  <h3>9. التواصل</h3><p>للاستفسارات أو الإبلاغ عن مشكلة، استخدم روابط التواصل المدرجة في قسم «اتصل بنا». هذه مسودة عامة وليست استشارة قانونية، وينبغي مراجعتها لتتوافق مع القوانين الجزائرية وطريقة تشغيل المنصة الفعلية.</p></section>`;
  function safeLink(url) { try { const u = new URL(url); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch (_) { return ''; } }
  window.dzgmOpenInfoModal = function(type) {
    const overlay = document.getElementById('dzgmInfoModal'); if (!overlay) return;
    const title = document.getElementById('dzgmInfoTitle'), body = document.getElementById('dzgmInfoBody');
    if (type === 'terms') { title.textContent = 'الشروط والأحكام'; body.innerHTML = terms; }
    else {
      title.textContent = 'اتصل بنا';
      const labels = {whatsapp:'WhatsApp',facebook:'Facebook',instagram:'Instagram',tiktok:'TikTok'};
      body.innerHTML = '<p>للاستفسارات والدعم، تواصل معنا عبر حساباتنا الرسمية:</p><div class="dzgm-contact-links">' + Object.entries(contactLinks).map(([key,value]) => { const url=safeLink(value); return `<a href="${url || '#'}" ${url?'target="_blank" rel="noopener noreferrer"':''} class="dzgm-contact-link ${url?'':'is-placeholder'}"><i class="fa-brands fa-${key==='whatsapp'?'whatsapp':key}"></i><span>${labels[key]}</span>${url?'':'<small>أضف رابطك في js/site-customizations.js</small>'}</a>`; }).join('') + '</div>';
    }
    overlay.hidden = false; document.body.classList.add('dzgm-modal-open');
  };
  window.dzgmCloseInfoModal = function() { const el=document.getElementById('dzgmInfoModal'); if(el) el.hidden=true; document.body.classList.remove('dzgm-modal-open'); };
})();
