// 신청 페이지와 DJ 화면이 같이 쓰는 도우미
(function () {
  const cfg = window.PIVOT_CONFIG || {};
  const API = String(cfg.API_URL || '').trim();
  const configured = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(API);

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function deviceId() {
    let id = store('pivot_device');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 24);
      store('pivot_device', id);
    }
    return id;
  }

  async function handle(res) {
    if (!res.ok) throw new Error('네트워크 오류 (' + res.status + ')');
    const data = await res.json();
    return data;
  }

  async function get(params) {
    const q = new URLSearchParams(Object.assign({ t: Date.now() }, params)).toString();
    return handle(await fetch(API + '?' + q, { method: 'GET', cache: 'no-store' }));
  }

  // Content-Type을 지정하지 않으면 text/plain으로 가서 CORS 사전 요청 없이 Apps Script에 도착해요.
  async function post(body) {
    return handle(await fetch(API, { method: 'POST', body: JSON.stringify(body) }));
  }

  let toastTimer;
  function toast(msg, kind) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 3200);
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // 화면이 보일 때만 주기적으로 새로고침 (서버 부담 줄이기)
  function poll(fn, ms) {
    let timer = null, running = false;
    const tick = async () => {
      if (running) return;
      running = true;
      clearTimeout(timer);
      if (document.visibilityState === 'visible') { try { await fn(); } catch (e) { /* 다음 차례에 재시도 */ } }
      running = false;
      timer = setTimeout(tick, ms);
    };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
    tick();
    return { now: tick };
  }

  window.Pivot = { API, configured, cfg, store, deviceId, get, post, toast, el, poll };
})();
