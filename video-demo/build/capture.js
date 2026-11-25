// Abre o app real (cópia local) com Firebase falso + dados de exemplo e captura as telas.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '../app-snapshot');
const PHOTOS = path.resolve(__dirname, 'photos');
const OUT = path.resolve(__dirname, 'shots');
const STUB = fs.readFileSync(path.join(__dirname, 'firebase-stub.js'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });

const mime = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };

(async () => {
  const browser = await chromium.launch({ args: ['--lang=pt-BR'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  let stubServed = false;
  await ctx.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.gstatic.com' && url.pathname.includes('firebase')) {
      const body = stubServed ? '' : STUB; stubServed = true;
      return route.fulfill({ status: 200, contentType: 'application/javascript', body });
    }
    if (url.hostname === 'cdnjs.cloudflare.com') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (url.hostname === 'app.demo') {
      if (url.pathname.startsWith('/.netlify/functions/sign-upload'))
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ apiKey: 'demo', timestamp: 1, folder: 'demo', signature: 'demo' }) });
      const file = url.pathname.startsWith('/photos/') ? path.join(PHOTOS, path.basename(url.pathname)) : path.join(APP, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ status: 200, contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
    }
    if (url.hostname === 'api.cloudinary.com') {
      const pick = ['trolley_a', 'trolley_b', 'forno_a', 'caixas_a'][Math.floor(Math.random() * 4)];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ secure_url: 'https://app.demo/photos/' + pick + '.jpg' }) });
    }
    if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) return route.continue();
    return route.abort();
  });

  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('https://app.demo/index.html');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const RECT_SEL = ['#loginUser','#loginPass','#loginBtn','#btnNovoChecklist','#btnPendentes','#btnHistorico','#wizNext','.qty-grid','#fFlight','[data-cat="producao"]','[data-cat="producao"] .photo-thumb','[data-multi-field="spml"]','[data-multi-field="preorder"]','[data-multi-field="fornosBC"]','[data-multi-field="fornosYC"]','[data-meal-class="business"][data-meal-key="jantar"]','[data-meal-class="economica"][data-meal-key="jantar"]','#pendentesList .flight-item','#resolveList','#resolveNome','#resolveSaveBtn','#histCatWrap','#histWordsWrap','#histTrendWrap','#btnExportHistPdf','#histDateChips','.pend-list','.confirm-chip','.confirm-icon','#confirmNewBtn','.toast','#histList'];
  const rects = {};
  const shot = async (name, full = true) => {
    await page.waitForTimeout(350);
    await page.evaluate(() => window.scrollTo(0, 0));
    rects[name] = await page.evaluate((sels) => {
      const o = {};
      sels.forEach((s) => { const els = Array.from(document.querySelectorAll(s)).filter(e => e.offsetParent || e.getClientRects().length); if (!els.length) return;
        o[s] = els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]; }); });
      o.__h = document.documentElement.scrollHeight; return o; }, RECT_SEL);
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
    console.log('shot', name);
  };
  const photo = (sel, n) => page.setInputFiles(sel, path.join(PHOTOS, n + '.jpg'));
  const next = async () => { await page.click('#wizNext'); await page.waitForTimeout(400); };

  await shot('01-login', false);
  await page.fill('#loginUser', 'alex');
  await page.fill('#loginPass', 'demo1234');
  await shot('02-login-filled', false);
  await page.click('#loginBtn');
  await page.waitForSelector('#screenHome.active');
  await page.waitForTimeout(500);
  await shot('03-home', false);

  // Etapa 1
  await page.click('#btnNovoChecklist');
  await page.fill('#fFlight', 'LA 3471');
  await page.fill('#fExpedidor', 'Marina Costa');
  await page.fill('#fExec', '24');
  await page.fill('#fEcon', '150');
  await page.fill('#fCrewTT', '2');
  await page.fill('#fCrewTC', '6');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await shot('04-step1');
  await next();

  // Etapa 2 — uma pendência em Produção
  await page.click('[data-cat="producao"] [data-act="setPend"][data-val="1"]');
  await page.fill('[data-cat="producao"] [data-act="desc"]', 'Faltou Lanche HLD2 na econômica');
  await page.fill('[data-cat="producao"] [data-act="qty"]', '12');
  await photo('#producao-0-photo', 'caixas_b');
  await page.waitForTimeout(500);
  await page.click('[data-cat="producao"] [data-act="setStatus"][data-val="pendente"]');
  await shot('05-step2');
  await next();

  // Etapa 3 — especiais
  await page.fill('#spmlDesc', '2x VGML · 1x DBML');
  await photo('#spml-add', 'trolley_c'); await page.waitForTimeout(400);
  await photo('#spml-add', 'trolley_a'); await page.waitForTimeout(400);
  await page.click('[data-multi-field="preorder"] [data-act="toggleNa"]');
  await shot('06-step3');
  await next();

  // Etapa 4 — quantidade + fotos
  await photo('#fornosBC-add', 'forno_a'); await page.waitForTimeout(400);
  await photo('#fornosYC-add', 'forno_b'); await page.waitForTimeout(400);
  await photo('#fornosYC-add', 'forno_a'); await page.waitForTimeout(400);
  await page.click('[data-multi-field="remanentes"] [data-act="toggleNa"]');
  await photo('#maletas-add', 'caixas_a'); await page.waitForTimeout(400);
  await shot('07-step4');
  await next();

  // Etapa 5 — trolleys
  const pics = ['trolley_a', 'trolley_b', 'trolley_d', 'trolley_c'];
  let k = 0;
  for (const cls of ['business', 'economica']) {
    await photo(`#${cls}-jantar-frente`, pics[k++ % 4]); await page.waitForTimeout(300);
    await photo(`#${cls}-jantar-verso`, pics[k++ % 4]); await page.waitForTimeout(300);
    await page.click(`[data-meal-class="${cls}"][data-meal-key="cafe"] [data-act="toggleMealNa"]`);
  }
  await page.click('[data-meal-class="business"][data-meal-key="lanche"] [data-act="toggleMealNa"]');
  await photo('#economica-lanche-frente', 'trolley_b'); await page.waitForTimeout(300);
  await photo('#economica-lanche-verso', 'trolley_a'); await page.waitForTimeout(300);
  await photo('#crew-frente', 'trolley_c'); await page.waitForTimeout(300);
  await photo('#crew-verso', 'trolley_d'); await page.waitForTimeout(300);
  await page.click('[data-opt-field="apoio"] [data-act="toggleOptNa"]');
  await shot('08-step5');
  await page.click('#wizNext');
  await page.waitForSelector('#screenConfirm.active', { timeout: 30000 });
  await page.waitForTimeout(600);
  await shot('09-confirm', false);

  // Pendentes
  await page.click('#confirmNewBtn');
  await page.waitForTimeout(300);
  await shot('10-home-after', false);
  await page.click('#btnPendentes');
  await shot('11-pendentes', false);

  // Resolver a do LA 3350
  const btn = page.locator('#pendentesList .flight-item', { hasText: 'LA 3350' });
  await btn.click();
  await page.waitForSelector('#screenResolve.active');
  await page.fill('#resolveNome', 'Diego Martins');
  await page.fill('#resolveList input[type="time"]', '07:42');
  // mostra no formato 24h (o navegador de captura exibe AM/PM)
  await page.evaluate(() => { const i = document.querySelector('#resolveList input[type="time"]'); i.type = 'text'; i.value = '07:42'; });
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await shot('12-resolve', false);
  await page.click('#resolveSaveBtn');
  await page.waitForTimeout(250);
  await shot('13-pendentes-after', false);

  // Histórico (admin)
  await page.waitForTimeout(2700);
  await page.click('#backFromPendentes');
  await page.click('#btnHistorico');
  await page.waitForTimeout(500);
  await page.click('#histDateChips [data-range="month"]');
  await page.waitForTimeout(900);
  await shot('14-historico');
  // detalhe de um voo
  const first = page.locator('#histList .flight-item').first();
  await first.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '15-detalhe.png') });
  console.log('shot 15-detalhe');

  fs.writeFileSync(path.join(OUT, 'rects.json'), JSON.stringify(rects, null, 1));
  await browser.close();
})();
