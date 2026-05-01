/* ============================================================
   PTA・地域活動 デジタル活用統合ガイド
   共通ナビゲーションスクリプト v1.0
   ------------------------------------------------------------
   各ページの <body> に data-page-id="xxx" を指定するだけで、
   ヘッダ・パンくず・関連ページサジェストを自動生成します。
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // ベースパスの解決
  // ------------------------------------------------------------
  // index.html は /pta-guide/index.html
  // event.html は /pta-guide/scenarios/event.html
  // のいずれからもJSON・CSSを正しく参照できるよう、
  // 階層深さに応じて相対パスを動的解決します。
  // ============================================================
  function resolveBase() {
    const path = window.location.pathname;
    // /pta-guide/scenarios/event.html → 階層深さを判定
    const segments = path.split('/').filter(s => s && !s.endsWith('.html'));
    // 最後のディレクトリ名がカテゴリ名（scenarios/tools/governance）なら1階層深い
    const last = segments[segments.length - 1];
    if (['scenarios', 'tools', 'governance'].includes(last)) {
      return '../';
    }
    return './';
  }

  const BASE = resolveBase();

  // ============================================================
  // サイトマップ読み込み
  // ============================================================
  async function loadSitemap() {
    try {
      const res = await fetch(BASE + 'assets/site.json');
      return await res.json();
    } catch (e) {
      console.error('[nav.js] sitemap loading failed:', e);
      return null;
    }
  }

  // ============================================================
  // ヘッダ生成
  // ============================================================
  function renderHeader(sitemap, currentPageId) {
    const header = document.createElement('header');
    header.className = 'site-header';

    const currentCategory = sitemap.pages[currentPageId]?.category;

    const navLinks = sitemap.categories.map(cat => {
      const isCurrent = cat.id === currentCategory ? 'is-current' : '';
      // 各カテゴリは index.html の該当アンカーへ
      return `<a href="${BASE}index.html#${cat.id}" class="${isCurrent}">${cat.label}</a>`;
    }).join('');

    header.innerHTML = `
      <div class="site-header-inner">
        <a href="${BASE}index.html" class="site-logo">
          <span class="logo-mark">PTA</span>
          <span>デジタル活用ガイド</span>
        </a>
        <button class="nav-toggle" aria-label="メニュー" aria-expanded="false">☰</button>
        <nav class="site-nav" id="siteNav">
          <a href="${BASE}index.html" ${currentPageId === 'index' ? 'class="is-current"' : ''}>🏠 トップ</a>
          ${navLinks}
        </nav>
      </div>
    `;

    document.body.insertBefore(header, document.body.firstChild);

    // ハンバーガー
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('#siteNav');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ============================================================
  // パンくず生成
  // ============================================================
  function renderBreadcrumb(sitemap, currentPageId) {
    const target = document.querySelector('[data-breadcrumb]');
    if (!target) return;

    const page = sitemap.pages[currentPageId];
    if (!page) return;

    const items = [
      `<li><a href="${BASE}index.html">🏠 トップ</a></li>`
    ];

    if (page.category) {
      const cat = sitemap.categories.find(c => c.id === page.category);
      if (cat) {
        items.push(`<li><a href="${BASE}index.html#${cat.id}">${cat.label}</a></li>`);
      }
    }

    items.push(`<li>${page.icon || ''} ${page.title}</li>`);

    target.innerHTML = `<nav class="breadcrumb" aria-label="パンくず"><ol>${items.join('')}</ol></nav>`;
  }

  // ============================================================
  // 関連ページサジェスト生成
  // ============================================================
  function renderRelated(sitemap, currentPageId) {
    const target = document.querySelector('[data-related]');
    if (!target) return;

    const page = sitemap.pages[currentPageId];
    if (!page || !page.related || page.related.length === 0) return;

    const cards = page.related.map(id => {
      const p = sitemap.pages[id];
      if (!p) return '';
      return `
        <a class="s-card" href="${BASE}${p.path}">
          <div class="ico">${p.icon || '📄'}</div>
          <h3>${p.title}</h3>
          <p>${p.summary || ''}</p>
        </a>
      `;
    }).join('');

    target.innerHTML = `
      <section class="related">
        <h3>あわせて読みたい</h3>
        <div class="card-grid">${cards}</div>
      </section>
    `;
  }

  // ============================================================
  // フッタ生成
  // ============================================================
  function renderFooter(sitemap) {
    const existing = document.querySelector('.site-footer');
    if (existing) return; // 既存なら上書きしない

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <p><strong>${sitemap.site.title}</strong></p>
      <p>License: ${sitemap.site.license} / Version: ${sitemap.site.version}</p>
      <p>原典: <a href="https://akkyyyyy5.github.io/pta-guide/kawaii.html">柿生小学校PTA Kawaii Edition</a> を継承・拡張</p>
      <div class="footer-links">
        <a href="${BASE}index.html">トップ</a>
        <a href="${BASE}index.html#scenarios">やりたいこと別</a>
        <a href="${BASE}index.html#tools">ツール別</a>
        <a href="${BASE}index.html#governance">組織運営</a>
      </div>
    `;
    document.body.appendChild(footer);
  }

  // ============================================================
  // 進捗バー（シナリオページ等で <body data-progress> 指定時）
  // ============================================================
  function setupProgressBar() {
    if (!document.body.hasAttribute('data-progress')) return;

    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.innerHTML = `
      <div class="progress-bar-inner">
        <span class="progress-label">読み進み</span>
        <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
        <span class="progress-percent" id="progressPercent">0%</span>
      </div>
    `;

    // ヘッダの直後に挿入
    const header = document.querySelector('.site-header');
    if (header) header.after(bar);
    else document.body.insertBefore(bar, document.body.firstChild);

    const fill = document.getElementById('progressFill');
    const percent = document.getElementById('progressPercent');

    function update() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      fill.style.width = ratio + '%';
      percent.textContent = Math.round(ratio) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ============================================================
  // タイトル自動補完
  // ============================================================
  function autoTitle(sitemap, currentPageId) {
    const page = sitemap.pages[currentPageId];
    if (!page) return;
    if (!document.title || document.title === '') {
      document.title = `${page.title} | ${sitemap.site.title}`;
    }
  }

  // ============================================================
  // 初期化
  // ============================================================
  async function init() {
    const pageId = document.body.dataset.pageId;
    if (!pageId) {
      console.warn('[nav.js] data-page-id が <body> に指定されていません');
      return;
    }

    const sitemap = await loadSitemap();
    if (!sitemap) return;

    renderHeader(sitemap, pageId);
    renderBreadcrumb(sitemap, pageId);
    renderRelated(sitemap, pageId);
    renderFooter(sitemap);
    setupProgressBar();
    autoTitle(sitemap, pageId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
