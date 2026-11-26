(() => {
  'use strict';
  const htmlLang = document.documentElement.lang || 'vi';
  const lang = htmlLang.startsWith('zh') ? 'zh' : (htmlLang === 'en' ? 'en' : (htmlLang === 'ko' ? 'ko' : 'vi'));
  const T = {"vi": {"copied": "Đã sao chép", "copy": "Sao chép", "required": "Vui lòng điền mục này.", "phone": "Số điện thoại chưa đúng (8–15 chữ số).", "email": "Email chưa đúng định dạng.", "consent": "Cần đồng ý để CMV dùng thông tin này cho việc báo giá.", "sending": "Đang gửi…", "sent": "Đã gửi yêu cầu. CMV sẽ liên hệ lại trong giờ làm việc (T2–T6).", "fallback": "Chưa gửi được qua biểu mẫu. Vui lòng chép nội dung dưới đây và gửi qua Zalo 0394 719 822 hoặc email charger.vn@cgmco.com.tw.", "copyAll": "Sao chép nội dung", "mail": "Mở ứng dụng email"}, "en": {"copied": "Copied", "copy": "Copy", "required": "Please fill in this field.", "phone": "Phone number looks wrong (8–15 digits).", "email": "Email address looks wrong.", "consent": "Consent is needed for CMV to use this information for your quote.", "sending": "Sending…", "sent": "Request sent. CMV will reply within business hours (Mon–Fri, Vietnam time).", "fallback": "The form could not send. Please copy the text below and send it via Zalo/WhatsApp +84 394 719 822 or email charger.vn@cgmco.com.tw.", "copyAll": "Copy text", "mail": "Open email app"}, "zh": {"copied": "已複製", "copy": "複製", "required": "請填寫此欄位。", "phone": "電話號碼格式不正確（8–15 位數字）。", "email": "Email 格式不正確。", "consent": "需要您同意，CMV 才能使用這些資料提供報價。", "sending": "送出中…", "sent": "已送出。CMV 會在上班時間（週一至週五，越南時間）與您聯絡。", "fallback": "表單暫時無法送出。請複製以下內容，用 Zalo 0394 719 822 或 Email charger.vn@cgmco.com.tw 傳給我們。", "copyAll": "複製內容", "mail": "開啟 Email 程式"}, "ko": {"copied": "복사됨", "copy": "복사", "required": "이 항목을 입력해 주십시오.", "phone": "전화번호 형식이 올바르지 않습니다(숫자 8–15자리).", "email": "이메일 형식이 올바르지 않습니다.", "consent": "CMV가 견적을 위해 이 정보를 사용하려면 동의가 필요합니다.", "sending": "전송 중…", "sent": "요청이 전송되었습니다. CMV가 업무 시간(월–금, 베트남 시간) 내에 연락드리겠습니다.", "fallback": "양식을 전송하지 못했습니다. 아래 내용을 복사하여 Zalo/WhatsApp +84 394 719 822 또는 이메일 charger.vn@cgmco.com.tw로 보내 주십시오.", "copyAll": "내용 복사", "mail": "이메일 앱 열기"}}[lang];

  const track = (name, params) => { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} };

  /* copy buttons: numbers stay selectable text; the button is a convenience */
  const copyText = async (text, btn) => {
    try { await navigator.clipboard.writeText(text); const old = btn.textContent; btn.textContent = T.copied; setTimeout(() => { btn.textContent = old; }, 1600); }
    catch (e) { const r = document.createRange(); const target = btn.previousElementSibling || btn; r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  };
  document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', () => copyText(btn.dataset.copy, btn)));
  document.querySelectorAll('[data-track]').forEach((a) => a.addEventListener('click', () => track(a.dataset.track, { link_url: a.href })));

  /* signature moment: the tolerance band contracts from ±0,3 to ±0,1 mm, once */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-tolerance]').forEach((svg) => {
    const band = svg.querySelector('[data-band="after"]');
    const label = svg.querySelector('[data-band-label]');
    if (!band || reduce || !('IntersectionObserver' in window)) return;
    const x0 = +band.dataset.x0, w0 = +band.dataset.w0, x1 = +band.getAttribute('x'), w1 = +band.getAttribute('width');
    const v0 = +band.dataset.v0, v1 = +band.dataset.v1;
    const fmt = (v) => (lang === 'vi' ? '±' + v.toFixed(2).replace('.', ',') : '±' + v.toFixed(2)) + ' mm';
    const run = () => {
      const t0 = performance.now(), dur = 1300;
      const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
      const step = (now) => {
        const k = ease(Math.min(1, (now - t0) / dur));
        band.setAttribute('x', (x0 + (x1 - x0) * k).toFixed(2));
        band.setAttribute('width', (w0 + (w1 - w0) * k).toFixed(2));
        if (label) label.textContent = fmt(v0 + (v1 - v0) * k);
        if (k < 1) requestAnimationFrame(step); else if (label) label.textContent = fmt(v1);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { io.disconnect(); setTimeout(run, 250); } });
    }, { threshold: 0.6 });
    io.observe(svg);
  });

  /* forms: validate in place, send to the configured endpoint, never claim a send that did not happen */
  const endpointMeta = document.querySelector('meta[name="cmv-form-endpoint"]');
  const ENDPOINT = endpointMeta ? endpointMeta.content.trim() : '';

  const setError = (field, msg) => {
    const box = field.closest('.field, .check');
    let el = box && box.querySelector('.error-msg');
    if (msg) {
      field.setAttribute('aria-invalid', 'true');
      if (box && !el) { el = document.createElement('p'); el.className = 'error-msg'; el.id = field.id + '-err'; box.appendChild(el); }
      if (el) { el.textContent = msg; field.setAttribute('aria-describedby', el.id); }
    } else {
      field.removeAttribute('aria-invalid');
      if (el) el.remove();
    }
  };
  const check = (field) => {
    const v = (field.value || '').trim();
    if (field.type === 'checkbox') { if (field.required && !field.checked) return T.consent; return ''; }
    if (field.required && !v) return T.required;
    if (v && field.type === 'tel' && !/^[+()\d\s.-]{8,20}$/.test(v)) return T.phone;
    if (v && field.type === 'tel' && v.replace(/\D/g, '').length < 8) return T.phone;
    if (v && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return T.email;
    return '';
  };

  /* deep links: ?model=CODE&message=text&line=N fill the quote form, so a person or an agent arrives with the request ready */
  const qp = new URLSearchParams(location.search);
  const prefill = (form) => {
    const msg = form.querySelector('[name="message"]'); const line = form.querySelector('[name="line"]');
    const model = (qp.get('model') || '').slice(0, 80); const text = (qp.get('message') || '').slice(0, 1000);
    if (msg && (model || text) && !msg.value) msg.value = [model ? 'Model: ' + model : '', text].filter(Boolean).join('\n');
    if (line) { const n = qp.has('line') ? parseInt(qp.get('line'), 10) : (model ? 5 : NaN); if (n >= 0 && n < line.options.length) line.selectedIndex = n; }
  };

  document.querySelectorAll('form[data-form]').forEach((form) => {
    prefill(form);
    const status = form.querySelector('[data-status]');
    const btn = form.querySelector('button[type="submit"]');
    form.querySelectorAll('input, select, textarea').forEach((f) => {
      f.addEventListener('blur', () => { if (f.getAttribute('aria-invalid')) setError(f, check(f)); });
      f.addEventListener('change', () => { if (f.getAttribute('aria-invalid')) setError(f, check(f)); });
    });
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      let first = null;
      form.querySelectorAll('input:not(.hp input), select, textarea').forEach((f) => {
        if (f.closest('.hp')) return;
        const msg = check(f); setError(f, msg); if (msg && !first) first = f;
      });
      if (first) { first.focus(); return; }
      const data = new FormData(form);
      if (data.get('website')) return; // honeypot filled: drop silently
      data.append('page', location.href);
      data.append('lang', lang);
      data.append('submitted_at', new Date().toISOString());
      const lines = [];
      data.forEach((v, k) => { if (!['website', 'page', 'lang', 'submitted_at'].includes(k) && String(v).trim()) lines.push(form.querySelector(`[name="${k}"]`)?.dataset.label + ': ' + v); });
      const summary = lines.join('\n');
      status.hidden = false;
      status.dataset.kind = '';
      status.textContent = T.sending;
      if (btn) btn.disabled = true;
      let ok = false;
      if (ENDPOINT) {
        try {
          if (/formsubmit\.co\/ajax\//.test(ENDPOINT)) {
            const obj = {};
            data.forEach((v, k) => { if (k !== 'website') obj[k] = String(v); });
            obj._subject = '[CMV web] ' + (obj.line || 'Lead') + ' – ' + (obj.company || obj.phone || '');
            obj._template = 'table'; obj._captcha = 'false';
            if (obj.email) obj._replyto = obj.email;
            const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(obj) });
            const out = await res.json().catch(() => ({}));
            ok = res.ok && String(out.success) !== 'false';
          } else {
            await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
            ok = true;
          }
        } catch (e) { ok = false; }
      }
      if (btn) btn.disabled = false;
      if (ok) {
        status.dataset.kind = 'ok';
        status.textContent = T.sent;
        track('generate_lead', { form_id: form.dataset.form });
        form.reset();
      } else {
        status.dataset.kind = 'fallback';
        status.textContent = T.fallback;
        const pre = document.createElement('pre'); pre.textContent = summary; status.appendChild(pre);
        const c = document.createElement('button'); c.type = 'button'; c.className = 'copy-btn'; c.textContent = T.copyAll;
        c.addEventListener('click', () => copyText(summary, c)); status.appendChild(c);
        const mm = document.querySelector('meta[name="cmv-contact-email"]');
        if (mm && mm.content) {
          const m = document.createElement('a'); m.className = 'copy-btn'; m.textContent = T.mail;
          m.href = 'mailto:' + mm.content + '?subject=' + encodeURIComponent('[CMV web] ' + (data.get('line') || '')) + '&body=' + encodeURIComponent(summary);
          status.appendChild(m);
        }
      }
      status.focus();
    });
  });
})();
