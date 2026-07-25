/* Prompt Library — Client-side Search Engine
 * Pure JS, no dependencies. Fuzzy substring search across all docs.
 */

(function() {
  'use strict';

  // ---------- Index loader ----------
  // We embed an index.json generated at build time (or inline fallback).
  // To keep it simple, we crawl the same docs/pages and harvest <h1>, <h2>, <p>, <li> text.

  const PAGES = [
    // home page
    { url: 'index.html',                    title: 'Prompt Library · Hermes Agent' },
    // prompt detail pages
    { url: 'prompts/general/self-reflect.html',           title: 'general · self-reflect' },
    { url: 'prompts/hermes/delegation.html',              title: 'hermes · delegation' },
    { url: 'prompts/monitoring/watchdog.html',            title: 'monitoring · watchdog' },
    { url: 'prompts/extraction/web-article.html',         title: 'extraction · web-article' },
    { url: 'prompts/automation/cron.html',                title: 'automation · cron' },
    { url: 'prompts/automation/sync-notion-obsidian.html', title: 'automation · sync-notion-obsidian' },
    { url: 'prompts/automation/chat-platforms.html',      title: 'automation · chat-platforms' },
    // tutorial pages
    { url: 'tutorials/general-self-reflect.html',         title: '教程 · general-self-reflect' },
    { url: 'tutorials/hermes-delegation.html',            title: '教程 · hermes-delegation' },
  ];

  // ---------- Simple Chinese-aware tokenization ----------
  // For each char, treat as 1- or 2-gram so substring search works for CJK.
  function tokenize(text) {
    if (!text) return [];
    const tokens = new Set();
    const lower = text.toLowerCase();
    // English word tokens
    const words = lower.match(/[a-z0-9_]+/g);
    if (words) words.forEach(w => tokens.add(w));
    // CJK bigrams (2-character sliding window)
    const cjk = text.match(/[\u4e00-\u9fff]+/g);
    if (cjk) {
      for (const seg of cjk) {
        for (let i = 0; i < seg.length - 1; i++) {
          tokens.add(seg.substr(i, 2));
        }
        // Single chars too
        for (const ch of seg) tokens.add(ch);
      }
    }
    return Array.from(tokens);
  }

  // ---------- Fuzzy match ----------
  function fuzzyMatch(query, text) {
    if (!query || !text) return false;
    const ql = query.toLowerCase();
    if (text.toLowerCase().includes(ql)) return true;
    // Token-level: every token of query must appear in some token of text
    const qTokens = tokenize(query);
    const tTokens = new Set(tokenize(text));
    return qTokens.every(qt => Array.from(tTokens).some(tt => tt.includes(qt)));
  }

  // ---------- Highlight ----------
  function highlight(text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  // ---------- Search engine ----------
  const engine = {
    docs: [],  // { url, title, content, tokens }
    ready: false,

    async init() {
      // Fetch all pages, parse, build index
      const promises = PAGES.map(async (page) => {
        try {
          const resp = await fetch(page.url);
          if (!resp.ok) return null;
          const html = await resp.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          // Extract meaningful text
          const title = (doc.querySelector('h1') || {}).textContent || page.title;
          // Skip nav/header, get main content
          const main = doc.querySelector('main') || doc.body;
          // Extract structured text
          const blocks = [];
          main.querySelectorAll('h1, h2, h3, p, li, code, td').forEach(el => {
            const t = el.textContent.trim();
            if (t.length > 1 && t.length < 1000) blocks.push(t);
          });
          const content = blocks.join('\n');
          return { url: page.url, title, content, blocks };
        } catch (e) {
          console.warn(`Failed to fetch ${page.url}:`, e);
          return null;
        }
      });
      const results = await Promise.all(promises);
      this.docs = results.filter(Boolean);
      this.ready = true;
      console.log(`Search: indexed ${this.docs.length} pages`);
    },

    search(query, limit = 20) {
      if (!query || !this.ready) return [];
      const hits = [];
      for (const doc of this.docs) {
        // Score: title hit > content hit
        let score = 0;
        const titleHit = fuzzyMatch(query, doc.title);
        const contentHit = fuzzyMatch(query, doc.content);
        if (titleHit) score += 10;
        if (contentHit) score += 1;
        if (score === 0) continue;
        // Find best snippet
        let snippet = '';
        for (const block of doc.blocks) {
          if (fuzzyMatch(query, block)) {
            snippet = block;
            break;
          }
        }
        if (!snippet) snippet = doc.blocks[0] || '';
        hits.push({ url: doc.url, title: doc.title, snippet, score });
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, limit);
    },
  };

  // ---------- UI ----------
  function createUI() {
    // Floating search box
    const box = document.createElement('div');
    box.id = 'search-box';
    box.innerHTML = `
      <div class="search-widget">
        <input type="text" id="search-input" placeholder="搜索 prompt / 教程 (按 ⌘K 聚焦)" autocomplete="off">
        <div id="search-results"></div>
      </div>
    `;
    document.body.appendChild(box);

    // Style (inline so it's self-contained)
    const style = document.createElement('style');
    style.textContent = `
      #search-box {
        position: fixed; top: 16px; right: 16px; z-index: 9999;
        width: 360px; font-family: -apple-system, "PingFang SC", sans-serif;
      }
      .search-widget { background: #1a2027; border: 1px solid #2a333d;
        border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); overflow: hidden; }
      #search-input {
        width: 100%; box-sizing: border-box; padding: 12px 16px;
        background: transparent; border: none; color: #e4e7eb;
        font-size: 14px; outline: none;
      }
      #search-input::placeholder { color: #6a737d; }
      #search-results {
        max-height: 480px; overflow-y: auto; display: none;
        border-top: 1px solid #2a333d;
      }
      #search-results.active { display: block; }
      .result { padding: 10px 16px; border-bottom: 1px solid #232b33;
        cursor: pointer; transition: background 0.1s; }
      .result:hover { background: #232b33; }
      .result:last-child { border-bottom: none; }
      .result-title { color: #7eb8da; font-size: 13px; font-weight: 600;
        margin-bottom: 4px; }
      .result-snippet { color: #9aa3ad; font-size: 12px; line-height: 1.5; }
      .result-snippet mark { background: #d49a6a; color: #0f1419; padding: 0 2px; }
      .result-empty { padding: 16px; color: #6a737d; font-size: 13px;
        text-align: center; }
      .result-loading { padding: 12px 16px; color: #9aa3ad; font-size: 13px;
        text-align: center; }
      /* Mobile: full-width */
      @media (max-width: 600px) {
        #search-box { width: calc(100vw - 32px); right: 16px; left: 16px; }
      }
    `;
    document.head.appendChild(style);

    // Wire up events
    const input = box.querySelector('#search-input');
    const results = box.querySelector('#search-results');

    let activeIdx = -1;
    let currentHits = [];

    function render(query) {
      results.classList.add('active');
      if (!engine.ready) {
        results.innerHTML = '<div class="result-loading">索引加载中…</div>';
        return;
      }
      const hits = engine.search(query);
      currentHits = hits;
      activeIdx = -1;
      if (hits.length === 0) {
        results.innerHTML = `<div class="result-empty">没有匹配 "<strong>${query}</strong>"</div>`;
        return;
      }
      results.innerHTML = hits.map((hit, i) => `
        <div class="result" data-idx="${i}" data-url="${hit.url}">
          <div class="result-title">${highlight(hit.title, query)}</div>
          <div class="result-snippet">${highlight(hit.snippet.slice(0, 150), query)}…</div>
        </div>
      `).join('');
      // Click navigation
      results.querySelectorAll('.result').forEach(el => {
        el.addEventListener('click', () => {
          window.location.href = el.dataset.url;
        });
      });
    }

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length === 0) {
        results.classList.remove('active');
        results.innerHTML = '';
        return;
      }
      render(q);
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        results.classList.remove('active');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, currentHits.length - 1);
        updateActive();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        updateActive();
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        window.location.href = currentHits[activeIdx].url;
      }
    });

    function updateActive() {
      results.querySelectorAll('.result').forEach((el, i) => {
        el.style.background = i === activeIdx ? '#2a333d' : '';
      });
    }

    // Global hotkey: ⌘K or Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  // ---------- Boot ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createUI();
      engine.init();
    });
  } else {
    createUI();
    engine.init();
  }

  window.PromptSearch = engine;
})();