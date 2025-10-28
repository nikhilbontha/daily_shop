const apiBase = '/admin/api';
const content = document.getElementById('content-area');
const titleEl = document.getElementById('page-title');

// Auth UI elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const profileContainer = document.querySelector('.topbar .profile');
const profileDropdown = document.querySelector('.profile-dropdown');
const profileMenu = document.getElementById('profile-menu');
const profileEmailEl = document.getElementById('profile-email');
const profileLogout = document.getElementById('profile-logout');
const profileManage = document.getElementById('profile-manage');
const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-form');
const profileCancel = document.getElementById('profile-cancel');

// small SVG icons used in dashboard cards
const ICONS = {
  users: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="rgba(255,255,255,.95)"/><path d="M4 20c0-2.214 2.686-4 8-4s8 1.786 8 4v1H4v-1z" fill="rgba(255,255,255,.9)"/></svg>`,
  products: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7" width="18" height="12" rx="2" fill="rgba(255,255,255,.95)"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="rgba(255,255,255,.9)" stroke-width=".8"/></svg>`,
  orders: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18" stroke="rgba(255,255,255,.95)" stroke-width="1.2"/><path d="M5 11h14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6z" fill="rgba(255,255,255,.9)"/></svg>`,
  returns: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 1 1-2.6-6.1L21 6v6z" fill="rgba(255,255,255,.95)"/></svg>`,
  payments: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" fill="rgba(255,255,255,.95)"/><path d="M7 10h10" stroke="rgba(255,255,255,.9)" stroke-width=".8"/></svg>`
};

// wire profile dropdown
if(profileDropdown){
  profileDropdown.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    const shown = profileMenu && profileMenu.getAttribute('aria-hidden') === 'false';
    if(profileMenu) profileMenu.setAttribute('aria-hidden', shown ? 'true' : 'false');
  });
  // close on outside click
  document.addEventListener('click', ()=>{ if(profileMenu) profileMenu.setAttribute('aria-hidden','true'); });
}
// populate email from topbar text
if(profileEmailEl){
  const localEmail = document.querySelector('.topbar .profile .email');
  if(localEmail) profileEmailEl.textContent = localEmail.textContent.trim();
}
if(profileLogout){ profileLogout.addEventListener('click', async (ev)=>{ ev.preventDefault(); try{ await fetch(apiBase + '/auth/logout', { method: 'POST' }); showLoginModal(); }catch(e){ showLoginModal(); } }); }

// Manage profile modal
if(profileManage){
  profileManage.addEventListener('click', (ev)=>{ ev.preventDefault(); if(profileModal) profileModal.setAttribute('aria-hidden','false'); const emailInput = document.getElementById('profile-form-email'); if(emailInput && profileEmailEl) emailInput.value = profileEmailEl.textContent.trim(); });
}
if(profileCancel) profileCancel.addEventListener('click', ()=> profileModal && profileModal.setAttribute('aria-hidden','true'));
if(profileForm){
  profileForm.addEventListener('submit', async (ev)=>{
    ev.preventDefault(); const data = { email: profileForm.email.value, password: profileForm.password.value }; try{ const res = await fetch(apiBase + '/auth/update', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(data) }); if(!res.ok){ const j = await res.json(); alert('Failed: '+(j && j.error ? j.error : 'unknown')); return; } const j = await res.json(); if(j && j.email){ if(profileEmailEl) profileEmailEl.textContent = j.email; const topEmail = document.querySelector('.topbar .profile .email'); if(topEmail) topEmail.textContent = j.email; } profileModal && profileModal.setAttribute('aria-hidden','true'); alert('Profile updated'); }catch(e){ alert('Update failed'); } });
}

// fetch admin status and populate profile (avatar/email)
async function populateProfile(){
  try{
    const st = await fetch(apiBase + '/auth/status');
    if(!st.ok) return;
    const j = await st.json();
    if(j && j.email){
      const topEmail = document.querySelector('.topbar .profile .email');
      if(topEmail) topEmail.textContent = j.email;
      if(profileEmailEl) profileEmailEl.textContent = j.email;
    }
    if(j && j.avatar){
      const profImg = document.getElementById('admin-avatar');
      const menuImg = document.getElementById('profile-avatar');
      if(profImg) profImg.src = j.avatar;
      if(menuImg) menuImg.src = j.avatar;
    }
  }catch(e){}
}
populateProfile();

// avatar upload
const avatarInput = document.getElementById('avatar-input');
if(avatarInput){
  avatarInput.addEventListener('change', async (ev)=>{
    const f = ev.target.files && ev.target.files[0];
    if(!f) return;
    const fd = new FormData(); fd.append('avatar', f);
    try{
      const res = await fetch(apiBase + '/auth/avatar', { method: 'POST', body: fd });
      if(!res.ok) { alert('Upload failed'); return; }
      const j = await res.json();
      if(j && j.avatar){
        const profImg = document.getElementById('admin-avatar');
        const menuImg = document.getElementById('profile-avatar');
        if(profImg) profImg.src = j.avatar;
        if(menuImg) menuImg.src = j.avatar;
      }
    }catch(e){ alert('Upload error'); }
  });
}

function navTo(hash){
  const key = hash.replace('#/','') || '';
  document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.remove('active'));
  const sel = document.querySelector(`.sidebar nav a[data-key="${key||'dashboard'}"]`);
  if(sel) sel.classList.add('active');
  if(!key||key==='') renderDashboard();
  else if(key==='users') renderUsers();
  else if(key==='products') renderProducts();
  else if(key==='orders') renderOrders();
  else if(key==='returns') renderReturns();
  else if(key==='cancellations') renderCancellations();
  else if(key==='payments') renderPayments();
  else if(key==='reviews') renderReviews();
  else if(key==='home') renderEditHome();
  else if(key==='trash') renderTrash();
  else if(key==='settings') renderSettings();
  else renderNotFound();
}

window.addEventListener('hashchange',()=>navTo(location.hash));

// Global search wiring: perform combined search across products/users/orders
const globalSearch = document.getElementById('global-search');
if(globalSearch){
  globalSearch.addEventListener('keydown', async (ev)=>{
    if(ev.key === 'Enter'){
      ev.preventDefault(); const q = globalSearch.value.trim(); if(!q) return; try{
        // search products, users, orders in parallel
        const [prods, users, orders] = await Promise.all([
          fetchJson(apiBase + '/products').catch(()=>[]),
          fetchJson(apiBase + '/users').catch(()=>[]),
          fetchJson(apiBase + '/orders').catch(()=>[])
        ]);
        // filter results locally
        const pMatches = (prods||[]).filter(p => (p.name||'').toLowerCase().includes(q.toLowerCase()));
        const uMatches = (users||[]).filter(u => (u.email||'').toLowerCase().includes(q.toLowerCase()) || (u.name||'').toLowerCase().includes(q.toLowerCase()));
        const oMatches = (orders||[]).filter(o => (o._id||'').toLowerCase().includes(q.toLowerCase()));
        // render a simple results page
        let html = '<div class="table"><h3>Search results</h3>';
        html += '<div style="margin-top:8px"><strong>Products</strong>';
        if(pMatches.length) html += '<ul>' + pMatches.map(p=>`<li>${p.name} — ₹${p.price||0}</li>`).join('') + '</ul>'; else html += '<div class="muted">No products</div>';
        html += '</div><div style="margin-top:8px"><strong>Users</strong>';
        if(uMatches.length) html += '<ul>' + uMatches.map(u=>`<li>${u.email} ${u.name?('- '+u.name):''}</li>`).join('') + '</ul>'; else html += '<div class="muted">No users</div>';
        html += '</div><div style="margin-top:8px"><strong>Orders</strong>';
        if(oMatches.length) html += '<ul>' + oMatches.map(o=>`<li>${o._id} — ₹${o.totalPrice||0}</li>`).join('') + '</ul>'; else html += '<div class="muted">No orders</div>';
        html += '</div></div>';
        content.innerHTML = html;
      }catch(e){ console.error(e); }
    }
  });
}

function showLoginModal(){ if(loginModal) loginModal.setAttribute('aria-hidden','false'); }
function hideLoginModal(){ if(loginModal) loginModal.setAttribute('aria-hidden','true'); }

loginForm && loginForm.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const data = { email: loginForm.email.value, password: loginForm.password.value };
  try{
    const res = await fetch(apiBase + '/auth/login', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(data) });
    if(!res.ok) { alert('Login failed'); return; }
    hideLoginModal();
    // refresh UI
    navTo(location.hash || '#/');
  }catch(e){ alert('Login error'); }
});

// Logout link
const logoutLink = document.querySelector('.sidebar nav a[data-key="logout"]');
if(logoutLink) logoutLink.addEventListener('click', async (ev)=>{ ev.preventDefault(); try{ await fetch(apiBase + '/auth/logout', { method: 'POST' }); showLoginModal(); }catch(e){ showLoginModal(); } });

// check auth status
async function checkAuth(){ try{ const st = await fetch(apiBase + '/auth/status'); if(!st.ok) return false; const j = await st.json(); return !!j.isAdmin; }catch(e){ return false; } }

// Initialize: check authentication, then route or show login
(async function init(){
  const ok = await checkAuth();
  if(!ok){ showLoginModal(); return; }
  navTo(location.hash || '#/');
})();


async function fetchJson(url, opts){
  const res = await fetch(url, opts);
  if (res.status === 401) {
    // expose status so callers can react
    showLoginModal();
    const body = await safeText(res);
    const err = new Error('Unauthorized'); err.status = 401; err.body = body; throw err;
  }
  if (!res.ok) {
    const body = await safeText(res);
    const err = new Error('Request failed'); err.status = res.status; err.body = body; throw err;
  }
  // try parse json safely
  try { return await res.json(); } catch (e) { return null; }
}

async function safeText(res){
  try { return await res.text(); } catch (e) { return null; }
}

  // small HTML escape to safely show tooltips and short text
  function escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/[&<>"']/g, function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[ch];
    });
  }

  // attach approve/reject handlers (used after rendering returns table rows)
  function attachReturnHandlers(){
    document.querySelectorAll('.btn.approve').forEach(btn => {
      // remove existing listeners by cloning
      const nb = btn.cloneNode(true);
      btn.parentNode.replaceChild(nb, btn);
      nb.addEventListener('click', async (ev) => {
        const id = ev.currentTarget.dataset.id;
        if(!id) return;
        try{
          const res = await fetch(apiBase + `/returns/${id}`, { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ status: 'approved' }) });
          if(!res.ok) throw new Error('Approve failed');
          const row = document.querySelector(`tr[data-id="${id}"]`);
          if(row) row.querySelector('.return-status').textContent = 'approved';
        }catch(e){ alert('Approve failed'); }
      });
    });

    document.querySelectorAll('.btn.reject').forEach(btn => {
      const nb = btn.cloneNode(true);
      btn.parentNode.replaceChild(nb, btn);
      nb.addEventListener('click', async (ev) => {
        const id = ev.currentTarget.dataset.id;
        if(!id) return;
        try{
          const res = await fetch(apiBase + `/returns/${id}`, { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ status: 'rejected' }) });
          if(!res.ok) throw new Error('Reject failed');
          const row = document.querySelector(`tr[data-id="${id}"]`);
          if(row) row.querySelector('.return-status').textContent = 'rejected';
        }catch(e){ alert('Reject failed'); }
      });
    });
  }

function renderNotFound(){
  titleEl.textContent='Not found';
  content.innerHTML='<div class="table"><p>Page not found</p></div>';
}

async function renderDashboard(){
  titleEl.textContent = 'Dashboard';
  content.innerHTML = `<div class="cards" id="cards"></div>
    <div style="margin-top:12px;margin-bottom:6px"></div>
    <div class="table"><div id="dash-errors" style="color:#b91c1c;margin-bottom:8px"></div><canvas id="revChart" height="160"></canvas></div>`;

  // require auth first
  const ok = await checkAuth();
  if (!ok) { showLoginModal(); return; }

  // fetch each resource separately so one failure doesn't hide everything
  const results = {};
  const errors = [];

  const guards = [
    ['users', apiBase + '/users'],
    ['products', apiBase + '/products'],
    ['orders', apiBase + '/orders'],
    ['returns', apiBase + '/returns'],
    ['payments', apiBase + '/payments']
  ];

  await Promise.all(guards.map(async ([key, url]) => {
    try {
      results[key] = await fetchJson(url);
    } catch (err) {
      errors.push({ key, status: err.status || 0, body: err.body || err.message });
      results[key] = null;
    }
  }));

  const cards = document.getElementById('cards');
  const stats = [
    { key: 'users', label: 'Users', value: (results.users && Array.isArray(results.users)) ? results.users.length : 0 },
    { key: 'products', label: 'Products', value: (results.products && Array.isArray(results.products)) ? results.products.length : 0 },
    { key: 'orders', label: 'Orders', value: (results.orders && Array.isArray(results.orders)) ? results.orders.length : 0 },
    { key: 'returns', label: 'Returns Pending', value: (results.returns && Array.isArray(results.returns)) ? results.returns.filter(r => r.status === 'pending').length : 0 },
    { key: 'payments', label: 'Payments', value: (results.payments && Array.isArray(results.payments)) ? results.payments.length : 0 }
  ];
  cards.innerHTML = stats.map(s => `<div class="card"><div><div class="meta">${s.label}</div><div class="value">${s.value}</div></div><div class="icon">${ICONS[s.key]||''}</div></div>`).join('');

  // compute total sales: prefer payments amounts if available, else sum orders totals
  function fmtCurrency(v){ try{ return '₹' + (Number(v)||0).toLocaleString('en-IN'); }catch(e){ return '₹' + (Number(v)||0); } }
  let totalSales = 0;
  if (results.payments && Array.isArray(results.payments) && results.payments.length) {
    totalSales = results.payments.reduce((s,p) => s + (Number(p.amount || p.total || 0) || 0), 0);
  } else if (results.orders && Array.isArray(results.orders) && results.orders.length) {
    totalSales = results.orders.reduce((s,o) => s + (Number(o.totalPrice || o.total || (o.items && o.items.reduce((ss,it)=> ss + ((Number(it.price)||0) * (Number(it.qty)||1)), 0)) ) || 0), 0);
  }
  // insert a Total Sales card at the front
  const salesCard = `<div class="card total-sales" style="grid-column:1 / -1;background:linear-gradient(90deg,#06b6d4,#0ea5a4);"><div><div class="meta">Total Sales</div><div class="value">${fmtCurrency(totalSales)}</div></div><div class="icon">${ICONS.orders}</div></div>`;
  cards.insertAdjacentHTML('afterbegin', salesCard);

  // Financial breakdown: Earned (paid), Pending, Refunds, Failed/Loss
  let totalEarned = 0, pendingAmount = 0, refundAmount = 0, failedAmount = 0;
  let financeSource = 'payments';
  if (results.payments && Array.isArray(results.payments) && results.payments.length) {
    results.payments.forEach(p => {
      const amt = Number(p.amount || 0) || 0;
      const status = (p.status || '').toString().toLowerCase();
      // treat presence of refundId as refunded
      if (status.includes('paid')) totalEarned += amt;
      else if (status.includes('refund') || p.refundId) refundAmount += amt;
      else if (status.includes('fail') || status.includes('failed')) failedAmount += amt;
      else pendingAmount += amt;
    });
  } else if (results.orders && Array.isArray(results.orders) && results.orders.length) {
    // fall back to orders when payments collection is empty; use order total and paymentStatus
    financeSource = 'orders';
    results.orders.forEach(o => {
      const amt = Number(o.totalPrice || o.total || 0) || 0;
      const status = (o.paymentStatus || o.status || (o.payment && o.payment.status) || '').toString().toLowerCase();
      if (status.includes('paid')) totalEarned += amt;
      else if (status.includes('refund') || o.refundId) refundAmount += amt;
      else if (status.includes('fail') || status.includes('failed')) failedAmount += amt;
      else pendingAmount += amt;
    });
  }

  const financeHtml = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;margin-bottom:6px">
      <div style="font-weight:600;color:#374151">Financial summary</div>
      <div style="display:flex;align-items:center;gap:12px"><label style="font-size:12px;color:#6b7280">Source: ${financeSource}</label><label style="font-size:12px;color:#374151;display:flex;align-items:center;gap:8px"><input id="include-losses" type="checkbox"/> Include cancellations & returns in Loss</label></div>
    </div>
    <div class="cards" style="grid-column:1 / -1; margin-top:0; grid-template-columns:repeat(4,1fr); gap:12px">
      <div class="card" style="padding:18px"><div class="meta">Earned</div><div id="card-earned" class="value">${fmtCurrency(totalEarned)}</div><div class="muted" style="margin-top:6px">Collected (Paid)</div></div>
      <div class="card" style="padding:18px"><div class="meta">Pending</div><div id="card-pending" class="value">${fmtCurrency(pendingAmount)}</div><div class="muted" style="margin-top:6px">Awaiting confirmation</div></div>
      <div class="card" style="padding:18px"><div class="meta">Refunds</div><div id="card-refunds" class="value">${fmtCurrency(refundAmount)}</div><div class="muted" style="margin-top:6px">Amount refunded</div></div>
      <div class="card" style="padding:18px"><div class="meta">Failed / Loss</div><div id="card-failed" class="value">${fmtCurrency(failedAmount)}</div><div class="muted" style="margin-top:6px">Failed payments or chargebacks</div></div>
    </div>
  `;
  cards.insertAdjacentHTML('afterend', financeHtml);

  // wire include-losses toggle: when checked, include cancellations/refunds from orders and returns as additional losses
  async function computeAndApplyAdditionalLoss(){
    const checked = document.getElementById('include-losses') && document.getElementById('include-losses').checked;
    const failedEl = document.getElementById('card-failed');
    if(!failedEl) return;
    let extra = 0;
    if(checked){
      try{
        // fetch orders and returns and sum totals for cancellations/refunds
        const [orders, returns] = await Promise.all([
          fetchJson(apiBase + '/orders').catch(()=>[]),
          fetchJson(apiBase + '/returns').catch(()=>[])
        ]);
        if(Array.isArray(orders)){
          orders.forEach(o => {
            const status = (o.paymentStatus || o.status || (o.payment && o.payment.status) || '').toString().toLowerCase();
            const amt = Number(o.totalPrice || o.total || 0) || 0;
            if(status.includes('cancel') || status.includes('refunded') || status.includes('refundable')) extra += amt;
          });
        }
        if(Array.isArray(returns)){
          returns.forEach(r => {
            // treat approved returns as a loss amount if they reference an order
            const amt = Number(r.refundAmount || r.amount || 0) || 0;
            if(r.status && r.status.toString().toLowerCase() === 'approved') extra += amt;
          });
        }
      }catch(e){ /* ignore */ }
    }
    // update Failed/Loss card: show failedAmount + extra
    const baseFailed = Number((function(){ try{ return (document.getElementById('card-failed').textContent || '').replace(/[^0-9.-]+/g,''); }catch(e){ return 0 } })()) || 0;
    // baseFailed currently contains numeric without formatting; but the card shows formatted string. We'll compute from known variable if possible
    const base = failedAmount || 0;
    const total = base + extra;
    failedEl.textContent = fmtCurrency(total);
  }

  const incCheckbox = document.getElementById('include-losses');
  if(incCheckbox) incCheckbox.addEventListener('change', computeAndApplyAdditionalLoss);


  // show errors if any
  const errEl = document.getElementById('dash-errors');
  if (errors.length) {
    errEl.innerHTML = errors.map(e => `<div>Failed to load ${e.key} (status: ${e.status})</div>`).join('');
  } else {
    errEl.innerHTML = '';
  }

  // chart with monthly payments data if present
  const monthly = new Array(12).fill(0);
  if (results.payments && Array.isArray(results.payments)) {
    results.payments.forEach(p => {
      try { const d = new Date(p.date || p.createdAt); if (!isNaN(d)) monthly[d.getMonth()] += Number(p.amount) || 0; } catch (e) {}
    });
  }
  const ctx = document.getElementById('revChart').getContext('2d');
  // keep global references to charts so we can update them
  let revChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{ label: 'Revenue (₹)', data: monthly, borderColor: '#0ea5a4', backgroundColor: 'rgba(14,165,164,0.08)', tension: 0.32, pointRadius: 3 }]
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: 'easeOutCubic' },
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(2,6,23,0.04)' } } }
    }
  });

  // expose update functions for charts
  function updateRevenueChart(labels, data){ try{ revChart.data.labels = labels; revChart.data.datasets[0].data = data; revChart.update(); }catch(e){} }

  // Additional dashboard charts/stats (pie + donut + small cards)
  // insert container for side charts and small stat boxes
  const extraHtml = `
    <div style="display:flex;gap:16px;margin-top:18px;align-items:flex-start">
      <div style="flex:2;background:transparent">
        <div style="display:flex;gap:12px">
          <div style="flex:1;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
            <h4 style="margin:0 0 8px 0">Top Products</h4>
            <canvas id="topProductsChart" height="180"></canvas>
          </div>
          <div style="width:260px;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
            <h4 style="margin:0 0 8px 0">Conversion</h4>
            <canvas id="conversionChart" height="140"></canvas>
            <div id="conv-stats" style="margin-top:8px;font-size:13px;color:#6b7280"></div>
          </div>
        </div>
        <div id="small-stats" style="display:flex;gap:12px;margin-top:12px"></div>
      </div>
    </div>
  `;
  // append after the revenue chart area
  const revChartEl = document.getElementById('revChart');
  if(revChartEl && revChartEl.parentNode){ revChartEl.parentNode.insertAdjacentHTML('afterend', extraHtml); }

  // Build data for Top Products pie from orders (count qty per product name)
  const prodCounts = {};
  if(results.orders && Array.isArray(results.orders)){
    results.orders.forEach(o => {
      (o.items || []).forEach(it => {
        const name = it.productId ? (it.productId.name || it.productId.title || '') : (it.name || 'Unknown');
        const qty = Number(it.qty || it.quantity || 1) || 1;
        prodCounts[name] = (prodCounts[name] || 0) + qty;
      });
    });
  }
  // fallback: use products list (show prices as weight)
  if(Object.keys(prodCounts).length === 0 && results.products && Array.isArray(results.products)){
    results.products.slice(0,6).forEach(p=>{ const name = p.name || p.title || 'Product'; prodCounts[name] = (prodCounts[name]||0) + (Number(p.stockCount||1) || 1); });
  }
  const prodEntries = Object.entries(prodCounts).sort((a,b)=> b[1]-a[1]).slice(0,6);
  const prodLabels = prodEntries.map(e=> e[0] || 'Unknown');
  const prodData = prodEntries.map(e=> e[1] || 0);

  // render top products pie
  let topProductsChart = null;
  try{
    const tpCtx = document.getElementById('topProductsChart').getContext('2d');
    topProductsChart = new Chart(tpCtx, {
      type: 'pie',
      data: { labels: prodLabels, datasets: [{ data: prodData, backgroundColor: ['#34d399','#60a5fa','#f59e0b','#f97316','#f472b6','#a78bfa'] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }catch(e){/* ignore if canvas missing */}

  // conversion donut: compute paid orders / total orders
  let totalOrders = (results.orders && Array.isArray(results.orders)) ? results.orders.length : 0;
  let paidOrders = 0;
  if(results.orders && Array.isArray(results.orders)){
    results.orders.forEach(o=>{ const st = (o.paymentStatus || o.status || (o.payment && o.payment.status) || '').toString().toLowerCase(); if(st.includes('paid')) paidOrders++; });
  }
  const conversionRate = totalOrders ? Math.round((paidOrders/totalOrders)*100) : 0;
  const conversionData = [conversionRate, Math.max(0,100-conversionRate)];
  let conversionChart = null;
  try{
    const convCtx = document.getElementById('conversionChart').getContext('2d');
    conversionChart = new Chart(convCtx, {
      type: 'doughnut',
      data: { labels: ['Converted','Not Converted'], datasets: [{ data: conversionData, backgroundColor: ['#34d399','#e5e7eb'] }] },
      options: { cutout: '70%', responsive: true, plugins: { legend: { display: false } } }
    });
    const convStatsEl = document.getElementById('conv-stats');
    if(convStatsEl) convStatsEl.innerHTML = `<div style="font-weight:700;font-size:18px">${conversionRate}%</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Conversion rate — ${paidOrders}/${totalOrders} orders</div>`;
  }catch(e){ }

  // small stat boxes (Visits, Revenue, Bounce Rate, Recent Reviews sample)
  const smallStatsEl = document.getElementById('small-stats');
  if(smallStatsEl){
    const visits = (results.orders && results.orders.length) ? results.orders.length * 8 : (results.users && results.users.length ? results.users.length * 10 : 0);
    const revenue = totalSales;
    const bounce = '46.41%';
    const reviews = (results.reviews && Array.isArray(results.reviews)) ? results.reviews.slice(0,3) : [];
    smallStatsEl.innerHTML = `
      <div style="flex:1;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)"><div class="meta">Earnings</div><div class="value">${fmtCurrency(revenue)}</div><div class="muted">Visits ≈ ${visits}</div></div>
      <div style="flex:1;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)"><div class="meta">Bounce Rate</div><div class="value">${bounce}</div><div class="muted">Engagement metric</div></div>
      <div style="flex:1;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)"><div class="meta">Recent Reviews</div><div style="margin-top:6px">${reviews.length ? reviews.map(r=>`<div style="padding:6px 0;border-bottom:1px solid #f3f4f6"><strong>${(r.userId && r.userId.email) || 'User'}</strong><div style="font-size:13px;color:#374151">${(r.text||'').slice(0,80)}</div></div>`).join('') : '<div class="muted">No recent reviews</div>'}</div></div>
    `;
  }

  // store references to charts created later (earningsChart, topCategoriesChart)
  let earningsChart = null, topCategoriesChart = null;

  // function to refresh all charts & finance summary by date range
  async function refreshAll(startIso, endIso){
    // filter orders/payments client-side if server summary not available
    const orders = results.orders && Array.isArray(results.orders) ? results.orders.slice() : await fetchJson(apiBase + '/orders').catch(()=>[]);
    const payments = results.payments && Array.isArray(results.payments) ? results.payments.slice() : await fetchJson(apiBase + '/payments').catch(()=>[]);

    function inRange(itemDate){ if(!startIso && !endIso) return true; const d = new Date(itemDate); if(startIso && d < new Date(startIso)) return false; if(endIso && d > new Date(endIso + 'T23:59:59.999Z')) return false; return true; }

    // revenue line: aggregate per month-day for visible range (simple approach: last 12 months buckets)
    const revLabels = [];
    const revData = [];
    // re-use monthly by month (simple) — fallback to existing monthly if no range
    if(startIso || endIso){
      // build daily labels between start and end (limit 90 days)
      const s = startIso ? new Date(startIso) : new Date(new Date().setDate(new Date().getDate()-30));
      const e = endIso ? new Date(endIso + 'T23:59:59.999Z') : new Date();
      const days = Math.min(90, Math.ceil((e - s) / (1000*60*60*24)) + 1);
      for(let i=0;i<days;i++){ const d = new Date(s); d.setDate(s.getDate() + i); revLabels.push(d.toISOString().slice(0,10)); revData.push(0); }
      orders.forEach(o => { const od = new Date(o.createdAt || o.date || o.updatedAt || Date.now()); const key = od.toISOString().slice(0,10); const idx = revLabels.indexOf(key); if(idx>=0) revData[idx] += Number(o.totalPrice || o.total || (o.items && o.items.reduce((s,it)=> s + ((Number(it.price)||0)*(Number(it.qty)||1)),0)) || 0) || 0; });
      updateRevenueChart(revLabels, revData);
    }

    // update top products chart by applying inRange to orders
    const pc = {};
    orders.forEach(o=>{ if(!inRange(o.createdAt||o.date)) return; (o.items||[]).forEach(it=>{ const name = it.productId ? (it.productId.name || it.productId.title || '') : (it.name || 'Unknown'); pc[name] = (pc[name]||0) + (Number(it.qty||it.quantity||1)||1); }); });
    const pEntries = Object.entries(pc).sort((a,b)=> b[1]-a[1]).slice(0,6);
    const pLabels = pEntries.map(e=> e[0]); const pData = pEntries.map(e=> e[1]);
    if(topProductsChart){ topProductsChart.data.labels = pLabels; topProductsChart.data.datasets[0].data = pData; topProductsChart.update(); }

    // update conversion chart
    const ordFiltered = orders.filter(o=> inRange(o.createdAt||o.date||Date.now()));
    const totalOrd = ordFiltered.length; let paid = 0; ordFiltered.forEach(o=>{ const st = (o.paymentStatus||o.status||'').toString().toLowerCase(); if(st.includes('paid')) paid++; });
    const conv = totalOrd? Math.round((paid/totalOrd)*100):0;
    if(conversionChart){ conversionChart.data.datasets[0].data = [conv, Math.max(0,100-conv)]; conversionChart.update(); }
    const convStatsEl = document.getElementById('conv-stats'); if(convStatsEl) convStatsEl.innerHTML = `<div style="font-weight:700;font-size:18px">${conv}%</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Conversion rate — ${paid}/${totalOrd} orders</div>`;

    // earnings chart (last 14 days)
    try{
      const days = 14; const now = new Date(); const byDay = {}; for(let i=days-1;i>=0;i--){ const d = new Date(now); d.setDate(d.getDate()-i); const key = d.toISOString().slice(0,10); byDay[key]=0; }
      orders.forEach(o=>{ const od = new Date(o.createdAt || o.date || o.updatedAt || Date.now()); const key = od.toISOString().slice(0,10); if(byDay[key] !== undefined && inRange(od)) byDay[key] += Number(o.totalPrice || o.total || (o.items && o.items.reduce((s,it)=> s + ((Number(it.price)||0)*(Number(it.qty)||1)),0)) || 0) || 0; });
      const labels = Object.keys(byDay); const data = labels.map(l=> byDay[l]);
      if(earningsChart){ earningsChart.data.labels = labels; earningsChart.data.datasets[0].data = data; earningsChart.update(); } else { const eCtx = document.getElementById('earningsChart').getContext('2d'); earningsChart = new Chart(eCtx, { type:'bar', data:{ labels, datasets:[{ label:'Earnings', data, backgroundColor:'#60a5fa' }] }, options:{ responsive:true, plugins:{legend:{display:false}} } }); }
    }catch(e){ }

    // top categories chart
    try{
      const catCounts = {}; orders.forEach(o=>{ if(!inRange(o.createdAt||o.date)) return; (o.items||[]).forEach(it=>{ const cat = it.productId ? (it.productId.category || it.productId.cat || 'Uncategorized') : (it.category || 'Uncategorized'); const qty = Number(it.qty || it.quantity || 1) || 1; catCounts[cat] = (catCounts[cat]||0) + qty; }); });
      const entries = Object.entries(catCounts).sort((a,b)=> b[1]-a[1]).slice(0,6); const labels = entries.map(e=> e[0]); const data = entries.map(e=> e[1]);
      if(topCategoriesChart){ topCategoriesChart.data.labels = labels; topCategoriesChart.data.datasets[0].data = data; topCategoriesChart.update(); } else { const cc = document.getElementById('topCategoriesChart'); if(cc){ const cCtx = cc.getContext('2d'); topCategoriesChart = new Chart(cCtx, { type:'pie', data:{ labels, datasets:[{ data, backgroundColor:['#f97316','#f59e0b','#34d399','#60a5fa','#a78bfa','#f472b6'] }] }, options:{ responsive:true, plugins:{legend:{position:'right'}} } }); } }
    }catch(e){ }

  }

  // Date-range controls removed per request (Apply/Clear and From/To inputs are not present)

  // initial full refresh (no dates)
  refreshAll();

  // Additional charts: Earnings by Day (last 14 days) and Top Categories pie
  const extras2Html = `
    <div style="display:flex;gap:12px;margin-top:14px;align-items:flex-start">
      <div style="flex:2;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <h4 style="margin:0 0 8px 0">Earnings (Last 14 days)</h4>
        <canvas id="earningsChart" height="120"></canvas>
      </div>
      <div style="width:320px;background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <h4 style="margin:0 0 8px 0">Top Categories</h4>
        <canvas id="topCategoriesChart" height="240"></canvas>
      </div>
    </div>
  `;
  const smallStatsParent = document.getElementById('small-stats');
  if(smallStatsParent) smallStatsParent.insertAdjacentHTML('afterend', extras2Html);

  // earnings by day (last 14 days)
  try{
    const days = 14;
    const now = new Date();
    const byDay = {};
    for(let i=days-1;i>=0;i--){ const d = new Date(now); d.setDate(d.getDate()-i); const key = d.toISOString().slice(0,10); byDay[key]=0; }
    if(results.orders && Array.isArray(results.orders)){
      results.orders.forEach(o=>{
        const d = new Date(o.createdAt || o.date || o.updatedAt || Date.now());
        const key = d.toISOString().slice(0,10);
        if(byDay[key] !== undefined){ byDay[key] += Number(o.totalPrice || o.total || (o.items && o.items.reduce((s,it)=> s + ((Number(it.price)||0)*(Number(it.qty)||1)),0)) || 0) || 0; }
      });
    }
    const earningsLabels = Object.keys(byDay);
    const earningsData = earningsLabels.map(l => byDay[l]);
    const eCtx = document.getElementById('earningsChart').getContext('2d');
    new Chart(eCtx, { type: 'bar', data: { labels: earningsLabels, datasets: [{ label: 'Earnings', data: earningsData, backgroundColor: '#60a5fa' }] }, options: { responsive:true, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{grid:{color:'rgba(2,6,23,0.04)'}} } } });
  }catch(e){ }

  // top categories pie
  try{
    const catCounts = {};
    if(results.orders && Array.isArray(results.orders)){
      results.orders.forEach(o=>{
        (o.items||[]).forEach(it=>{
          const cat = it.productId ? (it.productId.category || it.productId.cat || 'Uncategorized') : (it.category || 'Uncategorized');
          const qty = Number(it.qty || it.quantity || 1) || 1;
          catCounts[cat] = (catCounts[cat]||0) + qty;
        });
      });
    }
    if(Object.keys(catCounts).length === 0 && results.products && Array.isArray(results.products)){
      results.products.forEach(p=>{ const c = p.category || 'Uncategorized'; catCounts[c] = (catCounts[c]||0) + 1; });
    }
    const catEntries = Object.entries(catCounts).sort((a,b)=> b[1]-a[1]).slice(0,6);
    const catLabels = catEntries.map(e=> e[0]);
    const catData = catEntries.map(e=> e[1]);
    const cc = document.getElementById('topCategoriesChart');
    if(cc){ const cCtx = cc.getContext('2d'); new Chart(cCtx, { type:'pie', data:{ labels: catLabels, datasets:[{ data: catData, backgroundColor: ['#f97316','#f59e0b','#34d399','#60a5fa','#a78bfa','#f472b6'] }] }, options:{ responsive:true, plugins:{legend:{position:'right'}} } }); }
  }catch(e){ }
}

async function renderUsers(){
  titleEl.textContent='Manage Users';
  content.innerHTML='<div class="table"><div id="users-table">Loading...</div></div>';
  try{
    const users = await fetchJson(apiBase+'/users');
    const table = ['<table><thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>'];
    users.forEach(u=>{
      table.push(`<tr><td>${u.name||''}</td><td>${u.email||''}</td><td><button data-id="${u._id}" class="btn del">Delete</button></td></tr>`);
    });
    table.push('</tbody></table>');
    document.getElementById('users-table').innerHTML = table.join('');
    document.querySelectorAll('.btn.del').forEach(b=>b.addEventListener('click',async (ev)=>{
      const id = ev.target.dataset.id; if(!confirm('Delete user?')) return;
      await fetch(apiBase+`/users/${id}`,{method:'DELETE'});
      renderUsers();
    }));
  }catch(e){ document.getElementById('users-table').innerHTML='<p>Error loading users</p>' }
}

async function renderProducts(){
  titleEl.textContent='Manage Products';
  content.innerHTML='<div class="table"><div id="products-table">Loading...</div></div>';
  try{
    const products = await fetchJson(apiBase+'/products');
  const rows = ['<table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>'];
  products.forEach(p=> rows.push(`<tr><td>${p.name||''}</td><td>${p.category||''}</td><td>₹${p.price||0}</td><td>${p.stockCount||0}</td><td><button data-id="${p._id}" class="btn edit">Edit</button> <button data-id="${p._id}" class="btn del">Delete</button></td></tr>`));
    rows.push('</tbody></table>');
    document.getElementById('products-table').innerHTML = rows.join('');
    document.querySelectorAll('.btn.del').forEach(b=>b.addEventListener('click',async (ev)=>{ const id=ev.target.dataset.id; if(!confirm('Delete product?')) return; await fetch(apiBase+`/products/${id}`,{method:'DELETE'}); renderProducts(); }));
    document.querySelectorAll('.btn.edit').forEach(b=>b.addEventListener('click',async (ev)=>{
      const id = ev.target.dataset.id;
      try{
        const p = await fetchJson(apiBase+`/products/${id}`);
        openProductModal(p);
        // render existing images
        renderExistingImages(p.images || []);
      }catch(e){ alert('Failed to load product'); }
    }));
  }catch(e){ document.getElementById('products-table').innerHTML='<p>Error loading products</p>' }
}

async function renderOrders(){
  // debug marker to ensure this updated function is loaded in the browser
  console.log('renderOrders (detailed) invoked');
  titleEl.textContent='Orders — Detailed';
  content.innerHTML='<div class="table"><p>Loading orders...</p></div>';
  try{
    const orders = await fetchJson(apiBase+'/orders');
    if(!Array.isArray(orders)) throw new Error('Invalid orders response');
    if(!orders.length){ content.innerHTML = '<div class="table"><p>No orders found</p></div>'; return; }

    // build rows with expanded product listing per order, using new CSS classes
    const rows = orders.map(o => {
      const orderId = o._id;
      const customerEmail = o.userId ? (o.userId.email || '') : '';
      const customerName = o.userId ? (o.userId.name || '') : '';
      const customerId = o.userId ? (o.userId._id || '') : '';
      const date = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
      const paymentMethod = o.paymentMethod || o.payMethod || (o.payment && o.payment.method) || '';
      const paymentStatus = (o.paymentStatus || o.status || (o.payment && o.payment.status) || '').toString().toLowerCase();
      const itemsHtml = (o.items || []).map(it => {
        const pname = it.productId ? (it.productId.name || it.productId.title || '') : (it.name || 'Product removed');
        const qty = it.qty || it.quantity || 1;
        const price = it.price || it.unitPrice || (it.productId && it.productId.price) || 0;
        const subtotal = (Number(price) || 0) * (Number(qty) || 0);
        return `<div><strong>${escapeHtml(pname)}</strong><div class="meta">Qty: ${qty} — ₹${price} each — Subtotal: ₹${subtotal}</div></div>`;
      }).join('');
      const total = o.totalPrice || o.total || (o.items && o.items.reduce((s,it)=> s + ((Number(it.price)||0) * (Number(it.qty)||1)), 0)) || 0;

      const paymentBadgeClass = paymentStatus.includes('paid') ? 'payment-badge paid' : (paymentStatus.includes('fail') || paymentStatus.includes('failed') ? 'payment-badge failed' : (paymentStatus.includes('cash') ? 'payment-badge cash' : 'payment-badge pending'));

      return `<tr data-id="${orderId}"><td>${orderId}</td><td><div class="customer-block"><div class="customer-email">${escapeHtml(customerEmail)}</div><div class="customer-meta">${escapeHtml(customerName)} (${escapeHtml(customerId)})</div></div></td><td>${date}</td><td><div class="${paymentBadgeClass}">${escapeHtml(paymentMethod || paymentStatus || 'Pending')}</div><div class="customer-meta" style="margin-top:6px">${escapeHtml(paymentStatus)}</div></td><td><div class="items-list">${itemsHtml}</div></td><td style="font-weight:700">₹${total}</td></tr>`;
    }).join('');

  // compute grand total across displayed orders
  const grandTotal = orders.reduce((s, o) => s + (Number(o.totalPrice || o.total || (o.items && o.items.reduce((ss,it)=> ss + ((Number(it.price)||0) * (Number(it.qty)||1)), 0)) ) || 0), 0);
  function fmtAmt(v){ try{ return '₹' + (Number(v)||0).toLocaleString('en-IN'); }catch(e){ return '₹' + (Number(v)||0); } }
  content.innerHTML = `<div class="table"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Payment</th><th>Items</th><th>Total</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="table-grand"><td colspan="5" style="text-align:right;padding:14px;font-weight:800">Grand total</td><td style="font-weight:900;padding:14px">${fmtAmt(grandTotal)}</td></tr></tfoot></table></div>`;
  }catch(e){ content.innerHTML='<div class="table"><p>Error loading orders</p></div>'; }
}

async function renderReturns(){
  titleEl.textContent = 'Returns';
  content.innerHTML = '<div class="table"><p>Loading...</p></div>';
  try{
  let list = await fetchJson(apiBase + '/returns');
  // defensive: ensure only action==='return' items are shown
  if (Array.isArray(list)) list = list.filter(it => !it.action || it.action === 'return');
    // add a search/filter box
    content.innerHTML = `<div style="margin-bottom:8px"><input id="returns-search" placeholder="Search by ID, order, user or reason" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e5e7eb"/></div><div class="table" id="returns-table-container"><p>Loading...</p></div>`;

    // render function for current list (supports filtering)
    function doRender(filterText){
      const f = (filterText||'').toLowerCase().trim();
      const filtered = !f ? list : list.filter(r => {
        return (r._id || '').toString().toLowerCase().includes(f)
          || (r.orderId || r.productId || '').toString().toLowerCase().includes(f)
          || ((r.userId && (r.userId.email || r.userId.name)) || '').toString().toLowerCase().includes(f)
          || ((r.reason||'') + '').toString().toLowerCase().includes(f);
      });

      const rows = filtered.map(r => {
        const reason = (r.reason||'').toString();
        const short = reason.length > 80 ? reason.slice(0,80) + '…' : reason;
        const tooltip = reason ? ` title="${escapeHtml(reason)}"` : '';
  const orderRef = r.orderId || (r.productId? (r.productId._id || '') : '');
  return `<tr data-id="${r._id}" data-order="${orderRef}"><td>${r._id}</td><td>${orderRef}</td><td>${r.userId?r.userId.email:''}</td><td class="return-reason"${tooltip}>${escapeHtml(short)}</td><td class="return-status">${r.status}</td><td><button class="btn approve" data-id="${r._id}">Approve</button> <button class="btn reject" data-id="${r._id}">Reject</button></td></tr>`;
      }).join('');
      document.getElementById('returns-table-container').innerHTML = `<table><thead><tr><th>Return ID</th><th>Order</th><th>User</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`;

      // reattach handlers
      attachReturnHandlers();
    }

    // wire search box
    document.getElementById('returns-search').addEventListener('input', (ev)=> doRender(ev.target.value));

    // initial render
    doRender('');

    // handlers are attached earlier via attachReturnHandlers() which update status in-place.

  }catch(e){
    content.innerHTML = '<p>Error loading returns</p>';
  }
}

async function renderCancellations(){
  titleEl.textContent = 'Cancellations';
  content.innerHTML = '<div class="table"><p>Loading...</p></div>';
  try{
    const list = await fetchJson(apiBase + '/returns/cancellations');
    content.innerHTML = `<div style="margin-bottom:8px"><input id="cancellations-search" placeholder="Search by ID, order, user or reason" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e5e7eb"/></div><div class="table" id="cancellations-table-container"><p>Loading...</p></div>`;

    function doRender(filterText){
      const f = (filterText||'').toLowerCase().trim();
      const filtered = !f ? list : list.filter(r => {
        return (r._id || '').toString().toLowerCase().includes(f)
          || (r.orderId || r.productId || '').toString().toLowerCase().includes(f)
          || ((r.userId && (r.userId.email || r.userId.name)) || '').toString().toLowerCase().includes(f)
          || ((r.reason||'') + '').toString().toLowerCase().includes(f);
      });

      const rows = filtered.map(r => {
        const reason = (r.reason||'').toString();
        const short = reason.length > 80 ? reason.slice(0,80) + '…' : reason;
        const tooltip = reason ? ` title="${escapeHtml(reason)}"` : '';
        const orderRef = r.orderId || (r.productId? (r.productId._id || '') : '');
        return `<tr data-id="${r._id}" data-order="${orderRef}"><td>${r._id}</td><td>${orderRef}</td><td>${r.userId?r.userId.email:''}</td><td class="return-reason"${tooltip}>${escapeHtml(short)}</td><td class="return-status">${r.status}</td><td><button class="btn approve" data-id="${r._id}">Approve</button> <button class="btn reject" data-id="${r._id}">Reject</button></td></tr>`;
      }).join('');

      document.getElementById('cancellations-table-container').innerHTML = `<table><thead><tr><th>Cancel ID</th><th>Order</th><th>User</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`;
      attachReturnHandlers();
    }

    document.getElementById('cancellations-search').addEventListener('input', (ev)=> doRender(ev.target.value));
    doRender('');
  }catch(e){ content.innerHTML = '<p>Error loading cancellations</p>'; }
}

async function renderPayments() {
  titleEl.textContent = 'Payments';
  content.innerHTML = '<div class="table"><p>Loading payments...</p></div>';
  try {
    const list = await fetchJson(apiBase + '/payments');
    if (!Array.isArray(list)) throw new Error('Invalid payments response');

    // tabs: Cash | UPI | Refunds | Failed
    content.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="flex:1;margin-right:12px"><input id="payments-search" placeholder="Search payments by id, order, user or status" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e5e7eb"/></div><div style="display:flex;gap:8px"><button id="payments-export" class="btn secondary">Export CSV</button><button id="payments-retry" class="btn">Refresh</button></div></div>
      <div style="display:flex;gap:8px;margin-bottom:12px" id="payments-tabs"><button data-tab="cash" class="btn tab">Cash</button><button data-tab="upi" class="btn tab">UPI</button><button data-tab="refunds" class="btn tab">Refunds</button><button data-tab="failed" class="btn tab">Failed</button></div>
      <div class="table"><div id="payments-table">Loading...</div></div>`;

    const tabs = Array.from(document.querySelectorAll('#payments-tabs .tab'));
    let activeTab = 'upi';

    function fmt(v){ try{ return '₹' + (Number(v)||0).toLocaleString('en-IN'); }catch(e){ return '₹'+(Number(v)||0); } }

    function matchesType(p, type){
      const status = (p.status || '').toString().toLowerCase();
      const method = (p.method || p.paymentMethod || (p.payment && p.payment.method) || (p.meta && p.meta.method) || '').toString().toLowerCase();
      if(type === 'cash'){
        return method.includes('cash') || status.includes('cash');
      }
      if(type === 'upi'){
        return method.includes('upi') || method.includes('bhim') || (p.meta && (String(p.meta.provider||'').toLowerCase().includes('upi')));
      }
      if(type === 'refunds'){
        return !!p.refundId || status.includes('refund') || method.includes('refund');
      }
      if(type === 'failed'){
        return status.includes('fail') || status.includes('failed') || (p.status && String(p.status).toLowerCase() === 'failed');
      }
      return false;
    }

    function renderTable(filtered){
      if(!filtered.length){ document.getElementById('payments-table').innerHTML = '<div class="table"><p>No payments found</p></div>'; return; }
      // helper: cache order totals to avoid extra network calls
      const orderTotalCache = {};
      async function fetchOrderTotal(orderId){
        if(!orderId) return null;
        if(orderTotalCache[orderId] !== undefined) return orderTotalCache[orderId];
        try{ const o = await fetchJson(apiBase + '/orders/' + orderId); const t = o && (o.totalPrice || o.total) ? Number(o.totalPrice || o.total) : null; orderTotalCache[orderId] = t; return t; }catch(e){ orderTotalCache[orderId] = null; return null; }
      }
      // we'll render rows and then populate order totals asynchronously
      const rows = filtered.map(p => {
        const pid = p.paymentId || p._id || '';
        const user = p.userId ? (p.userId.email || p.userId.name || '') : '';
        const amt = p.amount || 0;
        const date = p.date ? new Date(p.date).toLocaleString() : (p.createdAt ? new Date(p.createdAt).toLocaleString() : '');
        const status = (p.status || '').toString().toLowerCase();
        const method = p.method || p.paymentMethod || (p.payment && p.payment.method) || '';
        const statusClass = status.includes('paid') ? 'payment-badge paid' : (status.includes('fail') ? 'payment-badge failed' : 'payment-badge pending');
        const orderIdCell = p.orderId ? `<div class="muted">${escapeHtml(p.orderId)}</div>` : '<div class="muted">—</div>';
        const refundCell = p.refundId ? `<div style="font-size:12px;color:#991b1b">Refund: ${p.refundId}</div>` : '';
        return `<tr data-id="${p._id}" data-order="${p.orderId||''}"><td><div><strong>${escapeHtml(pid)}</strong>${refundCell}</div></td><td><div class="customer-block"><div class="customer-email">${escapeHtml(user)}</div></div></td><td style="font-weight:700">${fmt(amt)}</td><td class="order-id-cell">${orderIdCell}</td><td class="order-total-cell">Loading...</td><td>${escapeHtml(date)}</td><td><div class="${statusClass}">${escapeHtml(method || status || 'Pending')}</div></td></tr>`;
      }).join('');
      document.getElementById('payments-table').innerHTML = `<table><thead><tr><th>Payment</th><th>User</th><th>Amount</th><th>Order ID</th><th>Order Total</th><th>Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;

      // populate order totals for rows that have an orderId
      const rowsNodes = Array.from(document.querySelectorAll('#payments-table tbody tr'));
      rowsNodes.forEach(async (row)=>{
        const orderId = row.dataset.order;
        if(orderId){
          const total = await fetchOrderTotal(orderId);
          const cell = row.querySelector('.order-total-cell');
          if(cell) cell.textContent = total !== null ? fmt(total) : '—';
          // make the Order ID cell clickable to open order detail
          const idCell = row.querySelector('.order-id-cell');
          if(idCell){
            idCell.style.cursor = 'pointer';
            idCell.addEventListener('click', ()=> openOrderDetail(orderId));
          }
        } else {
          const cell = row.querySelector('.order-total-cell'); if(cell) cell.textContent = '—';
        }
      });

      document.querySelectorAll('#payments-table tbody tr').forEach(r=>r.addEventListener('click', async ()=>{
        const id = r.dataset.id; if(!id) return; 
        try{
            const p = await fetchJson(apiBase + '/payments/' + id);
            // reuse existing panel rendering
            const panel = document.getElementById('payment-panel');
            const body = document.getElementById('payment-body');
            const title = document.getElementById('payment-id');
            title.textContent = 'Payment ' + (p.paymentId || p._id || '');
            const user = p.userId && (p.userId.email || p.userId.name) ? (p.userId.email || p.userId.name) : '';
            const date = p.date ? new Date(p.date).toLocaleString() : (p.createdAt ? new Date(p.createdAt).toLocaleString() : '');
            const method = p.method || p.paymentMethod || (p.payment && p.payment.method) || '';
            const status = (p.status||'').toString().toLowerCase();
            const metaHtml = p.meta ? `<pre style="white-space:pre-wrap;max-height:200px;overflow:auto">${escapeHtml(JSON.stringify(p.meta, null, 2))}</pre>` : '<div class="muted">No meta</div>';

            let refundsHtml = '';
            if(Array.isArray(list)){
              const related = list.filter(x => (x.refundId && p.refundId && x.refundId === p.refundId) || (x.paymentId && p.paymentId && String(x.paymentId).startsWith(String(p.paymentId))) || (x.paymentId && String(x.paymentId).includes('refund')));
              if(related.length){
                refundsHtml = '<div class="order-section"><strong>Related payments / refunds</strong>' + related.map(r=>`<div style="padding:6px 0;border-bottom:1px solid #f3f4f6"><div style="font-weight:700">${escapeHtml(r.paymentId||r._id)}</div><div class="meta">Amount: ₹${r.amount||0} — ${escapeHtml(r.status||'')}</div></div>`).join('') + '</div>';
              }
            }

            body.innerHTML = `<div class="order-section"><strong>Amount:</strong> <span style="font-weight:700">₹${(p.amount||0)}</span></div><div class="order-section"><strong>User:</strong> ${escapeHtml(user)}</div><div class="order-section"><strong>Order:</strong> <a href="#/orders" id="payment-order-link">${escapeHtml(p.orderId||'')}</a></div><div class="order-section"><strong>Date:</strong> ${escapeHtml(date)}</div><div class="order-section"><strong>Method / Status:</strong> ${escapeHtml(method)} <span style="margin-left:8px" class="payment-badge ${status.includes('paid')?'paid':(status.includes('fail')?'failed':'pending')}">${escapeHtml(status||'')}</span></div><div class="order-section"><strong>Meta:</strong>${metaHtml}</div>${refundsHtml}`;
            panel.setAttribute('aria-hidden','false');
            const refundInput = document.getElementById('refund-amount'); if(refundInput){ refundInput.value = p.amount || 0; }
            const refundBtn = document.getElementById('payment-refund');
            if(refundBtn) refundBtn.dataset.paymentId = p.paymentId || p._id || '';
            const orderLink = document.getElementById('payment-order-link');
            if(orderLink && p.orderId){ orderLink.addEventListener('click', (ev)=>{ ev.preventDefault(); orderPanel.setAttribute('aria-hidden','false'); openOrderDetail(p.orderId); }); }
          }catch(e){ console.warn('Failed to load payment', e); }
      }));
    }

    function renderSection(tab, filterText){
      const f = (filterText||'').toLowerCase().trim();
      const filtered = list.filter(p => matchesType(p, tab) && ( !f || (String(p.paymentId||p._id||'')+ ' ' + String(p.orderId||'') + ' ' + JSON.stringify(p)).toLowerCase().includes(f) ));
      renderTable(filtered);
    }

    // wire tab clicks
    tabs.forEach(t => t.addEventListener('click', (ev)=>{
      tabs.forEach(x=>x.classList.remove('active'));
      ev.currentTarget.classList.add('active');
      activeTab = ev.currentTarget.dataset.tab;
      const search = document.getElementById('payments-search').value || '';
      renderSection(activeTab, search);
    }));

    // set default active
    const defaultTab = tabs.find(t => t.dataset.tab === activeTab) || tabs[0];
    if(defaultTab) defaultTab.classList.add('active');

    // export and refresh
    document.getElementById('payments-retry').addEventListener('click', renderPayments);
    document.getElementById('payments-export').addEventListener('click', ()=>{
      const filtered = list.filter(p => matchesType(p, activeTab));
      const rows = [['PaymentId','OrderId','User','Amount','Date','Status','Meta']];
      filtered.forEach(p=> rows.push([p.paymentId||p._id||'', p.orderId||'', (p.userId && (p.userId.email||p.userId.name))||'', p.amount||0, p.date||p.createdAt||'', p.status||'', JSON.stringify(p.meta||'') ]));
      const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'payments-'+activeTab+'.csv'; a.click(); URL.revokeObjectURL(url);
    });

    // search wiring
    const searchEl = document.getElementById('payments-search');
    searchEl.addEventListener('input', (ev)=> renderSection(activeTab, ev.target.value));

    // initial render for default tab
    renderSection(activeTab, '');
  } catch (err) {
    const status = err && err.status ? ` (status ${err.status})` : '';
    const body = err && err.body ? `: ${err.body}` : '';
    content.innerHTML = `<div class="table"><p style="color:#b91c1c">Failed to load payments${status}${body}</p><div style="margin-top:8px"><button id="payments-retry" class="btn">Retry</button></div></div>`;
    document.getElementById('payments-retry').addEventListener('click', renderPayments);
  }
}

async function renderReviews(){ titleEl.textContent='Reviews'; content.innerHTML='<div class="table"><p>Loading...</p></div'; try{ const list = await fetchJson(apiBase+'/reviews'); content.innerHTML = '<div class="table"><table><thead><tr><th>Review</th><th>User</th><th>Rating</th><th>Actions</th></tr></thead><tbody>' + list.map(r=>`<tr><td>${r.text||''}</td><td>${r.userId?r.userId.email:''}</td><td>${r.rating}</td><td><button class="btn del" data-id="${r._id}">Delete</button></td></tr>`).join('') + '</tbody></table></div>'; document.querySelectorAll('.btn.del').forEach(b=>b.addEventListener('click',async ev=>{ const id=ev.dataset.id; if(!confirm('Delete review?')) return; await fetch(apiBase+`/reviews/${id}`,{method:'DELETE'}); renderReviews(); })); }catch(e){ content.innerHTML='<p>Error</p>' } }

async function renderEditHome(){
  titleEl.textContent = 'Edit Home';
  content.innerHTML = '<div class="table"><p>Loading...</p></div>';
  try{
    const data = await fetchJson(apiBase + '/homepage');
    const doc = data || {};
    // render editor: left = announcements editor, right = raw JSON editor
    content.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start">
        <div style="flex:1">
          <h3 style="margin-top:0">Announcements</h3>
          <div id="announcements-list" style="margin-bottom:8px"></div>
          <div style="margin-top:8px">
            <button id="add-announcement" class="btn secondary">Add announcement</button>
            <button id="save-announcements" class="btn">Save Announcements</button>
          </div>
        </div>
        <div style="flex:1">
          <h3 style="margin-top:0">Raw JSON</h3>
          <textarea id="homepage-json" style="width:100%;height:280px;padding:8px;border-radius:6px;border:1px solid #e5e7eb; font-family:monospace">${escapeHtml(JSON.stringify(doc, null, 2))}</textarea>
          <div style="margin-top:8px;display:flex;gap:8px"><button id="save-homepage-json" class="btn">Save JSON</button><button id="reset-homepage-json" class="btn secondary">Reset</button></div>
        </div>
      </div>
      <div id="homepage-message" style="margin-top:12px"></div>
    `;

    // populate announcements list
    const listEl = document.getElementById('announcements-list');
    const anns = Array.isArray(doc.announcements) ? doc.announcements.slice() : [];

    function renderAnnouncements(){
      listEl.innerHTML = '';
      if(!anns.length){ listEl.innerHTML = '<div class="muted">No announcements. Click "Add announcement" to create one.</div>'; return; }
      anns.forEach((a, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex'; row.style.gap = '8px'; row.style.marginBottom = '8px';
        const inp = document.createElement('input'); inp.type = 'text'; inp.value = a || ''; inp.style.flex = '1'; inp.style.padding = '8px'; inp.style.border = '1px solid #e5e7eb'; inp.style.borderRadius = '6px';
        inp.addEventListener('input', (ev)=> anns[idx] = ev.target.value);
        const del = document.createElement('button'); del.className = 'btn secondary'; del.textContent = 'Remove'; del.addEventListener('click', ()=>{ anns.splice(idx,1); renderAnnouncements(); });
        row.appendChild(inp); row.appendChild(del); listEl.appendChild(row);
      });
    }

    renderAnnouncements();

    document.getElementById('add-announcement').addEventListener('click', ()=>{ anns.push(''); renderAnnouncements(); });

    function showMessage(msg, isError){ const el = document.getElementById('homepage-message'); el.innerHTML = `<div style="padding:8px;border-radius:6px;background:${isError?'#fee2e2':'#ecfdf5'};color:${isError?'#9f1239':'#065f46'}">${escapeHtml(msg)}</div>`; setTimeout(()=>{ el.innerHTML = '' }, 5000); }

    document.getElementById('save-announcements').addEventListener('click', async ()=>{
      try{
        const payload = Object.assign({}, doc, { announcements: anns });
        const res = await fetch(apiBase + '/homepage', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(payload) });
        if(!res.ok){ const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Save failed'); }
        showMessage('Announcements saved');
        // update raw JSON textarea
        const updated = await res.json(); document.getElementById('homepage-json').value = JSON.stringify(updated, null, 2);
      }catch(e){ showMessage('Save failed: ' + (e.message||e), true); }
    });

    // JSON editor handlers
    document.getElementById('save-homepage-json').addEventListener('click', async ()=>{
      const txt = document.getElementById('homepage-json').value;
      try{
        const parsed = JSON.parse(txt);
        const res = await fetch(apiBase + '/homepage', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(parsed) });
        if(!res.ok){ const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Save failed'); }
        const updated = await res.json();
        showMessage('Homepage saved');
        // refresh local state
        if(updated && Array.isArray(updated.announcements)){
          anns.length = 0; updated.announcements.forEach(x => anns.push(x)); renderAnnouncements();
        }
        document.getElementById('homepage-json').value = JSON.stringify(updated, null, 2);
      }catch(e){ showMessage('Save failed: ' + (e.message||e), true); }
    });

    document.getElementById('reset-homepage-json').addEventListener('click', ()=>{ document.getElementById('homepage-json').value = JSON.stringify(doc, null, 2); showMessage('Reset to server copy'); });

  }catch(e){ content.innerHTML = '<div class="table"><p>Error loading homepage data</p></div>' }
}

async function renderTrash(){
  titleEl.textContent='Trash';
  content.innerHTML = '<div class="table"><p>Loading trash...</p></div>';
  try{
    const items = await fetchJson(apiBase + '/trash');
    if(!items.length) { content.innerHTML = '<div class="table"><p>Trash is empty</p></div>'; return; }
    content.innerHTML = '<div class="table"><table><thead><tr><th>File</th><th>Size</th><th>Deleted At</th><th>Actions</th></tr></thead><tbody>' + items.map(it=>`<tr data-name="${it.name}"><td><img src="${it.path}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;margin-right:8px;vertical-align:middle"/> ${it.name}</td><td>${Math.round(it.size/1024)} KB</td><td>${new Date(it.deletedAt).toLocaleString()}</td><td><button class="btn restore">Restore</button> <button class="btn purge">Delete</button></td></tr>`).join('') + '</tbody></table><div style="margin-top:8px"><button id="purge-all" class="btn">Purge All</button></div></div>';
    document.querySelectorAll('.btn.restore').forEach(b=>b.addEventListener('click', async ev=>{
      const row = ev.target.closest('tr'); const name = row.dataset.name; if(!confirm('Restore this file?')) return; await fetch(apiBase + '/trash/restore',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name }) }); renderTrash();
    }));
    document.querySelectorAll('.btn.purge').forEach(b=>b.addEventListener('click', async ev=>{
      const row = ev.target.closest('tr'); const name = row.dataset.name; if(!confirm('Delete permanently?')) return; await fetch(apiBase + '/trash/' + encodeURIComponent(name),{ method:'DELETE' }); renderTrash();
    }));
    document.getElementById('purge-all').addEventListener('click', async ()=>{ if(!confirm('Purge all trash?')) return; await fetch(apiBase + '/trash',{ method:'DELETE' }); renderTrash(); });
  }catch(e){ content.innerHTML = '<div class="table"><p>Error loading trash</p></div>'; }
}

// Settings UI
async function renderSettings(){
  titleEl.textContent='Settings';
  content.innerHTML = '<div class="table"><p>Loading settings...</p></div>';
  try{
    const s = await fetchJson(apiBase + '/settings');
    content.innerHTML = `<div class="table"><label>Trash retention (days): <input id="retention-days" type="number" value="${s.retentionDays||30}"/></label><div style="margin-top:8px"><button id="save-settings" class="btn">Save</button> <button id="run-purge" class="btn secondary">Run Purge Now</button></div></div>`;
    document.getElementById('save-settings').addEventListener('click', async ()=>{
      const days = document.getElementById('retention-days').value;
      await fetch(apiBase + '/settings', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ retentionDays: days }) });
      alert('Saved');
    });
    document.getElementById('run-purge').addEventListener('click', async ()=>{
      if(!confirm('Run purge now? This will permanently delete trashed files older than retention days.')) return;
      const res = await fetch(apiBase + '/settings/purge', { method: 'POST' });
      const j = await res.json();
      alert('Purge complete. Deleted: ' + (j.deleted||0));
    });
  }catch(e){ content.innerHTML = '<p>Error loading settings</p>'; }
}

// Product modal: Restore from trash helper
// NEW: Restore modal implementation with pagination and multi-select
let restoreCache = [];
let restorePage = 0;
const RESTORE_PAGE_SIZE = 12;

async function loadRestorePage(page){
  restoreCache = await fetchJson(apiBase + '/trash');
  restorePage = Math.max(0, Math.min(page, Math.floor((restoreCache.length-1)/RESTORE_PAGE_SIZE || 0)));
  const start = restorePage * RESTORE_PAGE_SIZE;
  const pageItems = restoreCache.slice(start, start + RESTORE_PAGE_SIZE);
  const list = document.getElementById('restore-list');
  list.innerHTML = '';
  pageItems.forEach(it => {
    const el = document.createElement('div');
    el.className = 'restore-tile';
    el.dataset.name = it.name;
    el.innerHTML = `<div style="position:relative"><img src="${it.path}" style="width:100%;height:100px;object-fit:cover;border-radius:6px"/><label style="position:absolute;left:6px;top:6px;background:#fff;padding:4px;border-radius:4px"><input type="checkbox"/></label></div><div style="font-size:12px;word-break:break-all;margin-top:6px">${it.name}</div>`;
    list.appendChild(el);
  });
  document.getElementById('restore-page').textContent = (restorePage+1) + ' / ' + (Math.max(1, Math.ceil(restoreCache.length / RESTORE_PAGE_SIZE)));
}

// open restore modal (replaces old prompt)
async function openRestorePicker(){
  document.getElementById('restore-modal').setAttribute('aria-hidden','false');
  await loadRestorePage(0);
}

// wire modal buttons
document.getElementById('close-restore').addEventListener('click', ()=> document.getElementById('restore-modal').setAttribute('aria-hidden','true'));
document.getElementById('restore-prev').addEventListener('click', async ()=> { await loadRestorePage(Math.max(0, restorePage-1)); });
document.getElementById('restore-next').addEventListener('click', async ()=> { await loadRestorePage(restorePage+1); });
document.getElementById('restore-selected').addEventListener('click', async ()=>{
  const tiles = Array.from(document.querySelectorAll('#restore-list .restore-tile'));
  const selected = tiles.filter(t => t.querySelector('input[type="checkbox"]').checked).map(t => t.dataset.name);
  if(!selected.length) return alert('No files selected');
  for(const name of selected){
    try{
      await fetch(apiBase + '/trash/restore', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name }) });
      // insert into existing-images container
      const url = '/admin/static/uploads/' + encodeURIComponent(name);
      const container = document.getElementById('existing-images');
      const tpl = document.getElementById('img-tpl');
      const node = tpl.content.cloneNode(true);
      const el = node.firstElementChild;
      el.querySelector('img').src = url;
      const btn = el.querySelector('.remove-img');
      btn.addEventListener('click', ()=> el.remove());
      el.draggable = true;
      el.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', url); el.classList.add('dragging'); });
      el.addEventListener('dragend', ()=> el.classList.remove('dragging'));
      el.addEventListener('click', ()=>{ const currently = container.querySelector('.img-preview.cover'); if(currently) currently.classList.remove('cover'); el.classList.add('cover'); });
      container.appendChild(el);
    }catch(e){ console.warn('restore failed', name, e); }
  }
  // refresh page and close
  await loadRestorePage(restorePage);
  document.getElementById('restore-modal').setAttribute('aria-hidden','true');
});

// add a 'Restore from trash' button into the product modal if present
const prodModalPanel = document.querySelector('#product-modal .modal-panel');
if(prodModalPanel){
  const btn = document.createElement('button'); btn.type='button'; btn.textContent='Restore from Trash'; btn.className='btn secondary'; btn.style.marginRight='8px';
  btn.addEventListener('click', openRestorePicker);
  const actions = prodModalPanel.querySelector('.modal-actions');
  if(actions) actions.insertBefore(btn, actions.firstChild);
}

/* Product modal and form handling */
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const productCancel = document.getElementById('product-cancel');
let editingProductId = null;

function openProductModal(product){
  productModal.setAttribute('aria-hidden','false');
  if(product){
    editingProductId = product._id;
    document.getElementById('product-form-title').textContent = 'Edit Product';
  productForm.name.value = product.name || '';
  productForm.price.value = product.price || '';
  productForm.stockCount.value = product.stockCount || '';
  // set select value if present
  const catSel = document.getElementById('product-category-select');
  if(catSel) catSel.value = product.category || '';
  productForm.description.value = product.description || '';
  } else {
    editingProductId = null;
    document.getElementById('product-form-title').textContent = 'Add Product';
    productForm.reset();
  }
}

productCancel.addEventListener('click',()=> productModal.setAttribute('aria-hidden','true'));

productForm.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  // inject existingImages inputs into formData
  // remove any previous existingImages entries
  const existingInputs = productForm.querySelectorAll('input[name="existingImages"]');
  existingInputs.forEach(i => i.parentNode && i.parentNode.removeChild(i));
  // gather current previews
  // gather current existing previews in order; if one has class 'cover', ensure it comes first
  const existingEls = Array.from(document.querySelectorAll('#existing-images .img-preview'));
  let previews = existingEls.map(el=> el.querySelector('img').src);
  const coverEl = existingEls.find(el=>el.classList.contains('cover'));
  if (coverEl) {
    const coverSrc = coverEl.querySelector('img').src;
    previews = [coverSrc, ...previews.filter(s => s !== coverSrc)];
  }
  previews.forEach(src => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'existingImages';
    hidden.value = src;
    productForm.appendChild(hidden);
  });
  const formData = new FormData(productForm);
  const url = apiBase + '/products' + (editingProductId ? '/' + editingProductId : '');
  const method = editingProductId ? 'PUT' : 'POST';
  const res = await fetch(url, { method, body: formData });
  if(!res.ok){ alert('Failed'); return; }
  productModal.setAttribute('aria-hidden','true');
  renderProducts();
});

// New image preview for files selected (before upload)
const newImagesPreview = document.getElementById('new-images-preview');
const imagesInput = document.getElementById('product-images-input');
imagesInput && imagesInput.addEventListener('change', (ev)=>{
  newImagesPreview.innerHTML = '';
  Array.from(imagesInput.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const tpl = document.getElementById('img-tpl');
      const node = tpl.content.cloneNode(true);
      const img = node.querySelector('img');
      img.src = reader.result;
      const btn = node.querySelector('.remove-img');
      btn.addEventListener('click', ()=>{
        // remove from file input by creating a new DataTransfer
        const dt = new DataTransfer();
        Array.from(imagesInput.files).forEach(f=>{ if(f !== file) dt.items.add(f); });
        imagesInput.files = dt.files;
        node.firstElementChild.remove();
      });
      newImagesPreview.appendChild(node);
    };
    reader.readAsDataURL(file);
  });
});

// Render existing images list inside the modal and add remove handlers
function renderExistingImages(images){
  const container = document.getElementById('existing-images');
  container.innerHTML = '';
  const tpl = document.getElementById('img-tpl');
  images.forEach(src => {
    const node = tpl.content.cloneNode(true);
    const el = node.firstElementChild;
    const img = el.querySelector('img');
    img.src = src;
    const btn = el.querySelector('.remove-img');
    btn.addEventListener('click', (ev)=>{ ev.preventDefault(); el.remove(); });
    // make draggable
    el.draggable = true;
    el.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', src); el.classList.add('dragging'); });
    el.addEventListener('dragend', ()=> el.classList.remove('dragging'));
    el.addEventListener('click', ()=>{
      // toggle cover
      const currently = container.querySelector('.img-preview.cover');
      if(currently) currently.classList.remove('cover');
      el.classList.add('cover');
    });
    container.appendChild(el);
  });
  // dragover/drop to reorder
  container.addEventListener('dragover', (e)=>{ e.preventDefault(); const after = getDragAfterElement(container, e.clientX, e.clientY); const dragging = container.querySelector('.dragging'); if(!dragging) return; if(after == null) container.appendChild(dragging); else container.insertBefore(dragging, after); });
}

function getDragAfterElement(container, x, y){
  const draggableElements = [...container.querySelectorAll('.img-preview:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > (closest.offset || Number.NEGATIVE_INFINITY)) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, {}).element || null;
}

/* Orders detail panel */
const orderPanel = document.getElementById('order-panel');
const orderBody = document.getElementById('order-body');
const orderIdEl = document.getElementById('order-id');
const orderClose = document.getElementById('order-close');
const orderBack = document.getElementById('order-back');
const trackBtn = document.getElementById('track-btn');
const refundBtn = document.getElementById('refund-btn');
const updateOrderBtn = document.getElementById('update-order-btn');
const deleteOrderBtn = document.getElementById('delete-order-btn');

orderClose.addEventListener('click', ()=> orderPanel.setAttribute('aria-hidden','true'));
if(orderBack) orderBack.addEventListener('click', ()=> { 
  // navigate back to the orders list view in admin
  try { window.location.href = '/admin/orders'; } catch(e) { orderPanel.setAttribute('aria-hidden','true'); }
});

// Payment modal elements
const paymentPanel = document.getElementById('payment-panel');
const paymentClose = document.getElementById('payment-close');
const paymentRefundBtn = document.getElementById('payment-refund');

if(paymentClose) paymentClose.addEventListener('click', ()=> paymentPanel && paymentPanel.setAttribute('aria-hidden','true'));

// Refund handler wired once — uses data-paymentId set when modal opens
if(paymentRefundBtn) paymentRefundBtn.addEventListener('click', async (ev) => {
  const pid = ev.currentTarget.dataset.paymentId;
  if(!pid) return alert('Payment ID unknown');
  const amountInput = document.getElementById('refund-amount');
  const amount = amountInput && amountInput.value ? Number(amountInput.value) : null;
  if(!confirm('Refund this payment for amount: ₹' + (amount || 'full') + '?')) return;
  try{
    const res = await fetch('/admin/api/payments/refund', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ paymentId: pid, amount: amount || undefined }) });
    if(!res.ok){ const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Refund failed'); }
    const j = await res.json();
    alert('Refund created');
    paymentPanel && paymentPanel.setAttribute('aria-hidden','true');
    // refresh payments view if open
    if(location.hash === '#/payments') renderPayments();
  }catch(err){ alert('Refund failed: '+(err.message||err)); }
});

async function openOrderDetail(id){
  orderPanel.setAttribute('aria-hidden','false');
  orderIdEl.textContent = 'Order ' + id;
  orderBody.innerHTML = 'Loading...';
  try{
    const o = await fetchJson(apiBase + '/orders/' + id);
    const user = o.userId || {};
    const itemsHtml = (o.items||[]).map(it=>{
      const src = (it.productId && it.productId.images && it.productId.images[0]) || '/admin/static/avatar.png';
      // add onerror to fall back to default placeholder when image path is broken
      return `<div style="display:flex;gap:8px;margin-bottom:8px"><img src="${src}" onerror="this.onerror=null;this.src='/images/default.jpg'" style="width:64px;height:64px;object-fit:cover;border-radius:6px"/><div><div style="font-weight:600">${it.productId?it.productId.name:''}</div><div>Qty: ${it.quantity}</div><div>₹${(it.productId&&it.productId.price)||''}</div></div></div>`
    }).join('');
  // render editable fields for admin: paymentStatus and totalPrice
  orderBody.innerHTML = `<div><strong>Customer:</strong> ${user.email||user.name||''}</div><div style="margin-top:8px"><strong>Items:</strong>${itemsHtml}</div><div style="margin-top:8px"><label><strong>Total:</strong> ₹<input id="order-total-input" type="number" value="${o.totalPrice||0}" style="width:120px;padding:6px;border-radius:6px;border:1px solid #e6eef6"/></label></div><div style="margin-top:8px"><label><strong>Payment Status:</strong> <select id="order-payment-status"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Refunded">Refunded</option><option value="Cancelled">Cancelled</option></select></label></div>`;
  // set current status
  const statusEl = document.getElementById('order-payment-status');
  if(statusEl) statusEl.value = o.paymentStatus || (o.paymentStatus && o.paymentStatus.toLowerCase()) || 'Pending';
    // Wire actions
    trackBtn.onclick = ()=> alert('Open tracking for order ' + id);
    refundBtn.onclick = async ()=>{
      if(!confirm('Refund this order?')) return;
      // try to find a payment id on the order
      const paymentId = o.paymentId || (o.payment && o.payment.id) || null;
      const amt = o.totalPrice || null;
      if(paymentId){
        try{
          const res = await fetch('/admin/api/payments/refund', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ paymentId, amount: amt }) });
          if(!res.ok){ const j = await res.json(); throw new Error(j.error || 'Refund failed'); }
          const json = await res.json();
          alert('Refund successful');
          orderPanel.setAttribute('aria-hidden','true');
          renderOrders();
          return;
        }catch(err){ alert('Refund API failed: '+(err.message||err)); }
      }
      // fallback: mark order refunded only
      await fetch(apiBase + '/orders/' + id, { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ paymentStatus: 'refunded' })});
      alert('Refunded (marked)');
      orderPanel.setAttribute('aria-hidden','true');
      renderOrders();
    };
    // update action
    if(updateOrderBtn){
      updateOrderBtn.onclick = async ()=>{
        const totalInput = document.getElementById('order-total-input');
        const statusSelect = document.getElementById('order-payment-status');
        const payload = {};
        if(totalInput) payload.totalPrice = Number(totalInput.value) || 0;
        if(statusSelect) payload.paymentStatus = statusSelect.value;
          try{
          const res = await fetch(apiBase + '/orders/' + id, { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify(payload) });
          if(!res.ok){ const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Update failed'); }
          alert('Order updated');
          // redirect to the admin order page for full details
          window.location.href = '/admin/orders/' + id;
        }catch(err){ alert('Update failed: '+(err.message||err)); }
      };
    }
    // delete action
    if(deleteOrderBtn){
      deleteOrderBtn.onclick = async ()=>{
        if(!confirm('Delete this order? This is permanent.')) return;
        try{
          const res = await fetch(apiBase + '/orders/' + id, { method: 'DELETE' });
          if(!res.ok){ const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Delete failed'); }
          alert('Order deleted');
          orderPanel.setAttribute('aria-hidden','true');
          renderOrders();
        }catch(err){ alert('Delete failed: '+(err.message||err)); }
      };
    }
  }catch(e){ orderBody.innerHTML = '<p>Failed to load order</p>' }
}

// Enhance orders list: call the detailed renderer and attach click handlers so rows open the detail panel
const origRenderOrders = renderOrders;
renderOrders = async function(){
  // Use the previously-defined detailed renderer
  await origRenderOrders();
  // Attach click handlers to any table rows produced by the detailed renderer
  try{
    document.querySelectorAll('table tbody tr[data-id]').forEach(r => {
      r.style.cursor = 'pointer';
      r.addEventListener('click', () => openOrderDetail(r.dataset.id));
    });
  }catch(e){ /* ignore if table not present */ }
};

// Add 'Add Product' button to products page
const origRenderProducts = renderProducts;
renderProducts = async function(){
  await origRenderProducts();
  const container = document.getElementById('products-table');
  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Product';
  addBtn.className = 'btn';
  addBtn.style.margin = '8px 0';
  addBtn.onclick = ()=> openProductModal(null);
  container.prepend(addBtn);
}
