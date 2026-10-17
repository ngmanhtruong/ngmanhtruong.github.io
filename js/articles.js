/**
 * Portfolio - Articles & Headless GitHub Issues CMS
 * Fetches articles directly from GitHub Issues (no redeploy needed to post/edit!).
 * Features 2-level filtering:
 * 1. Primary categories: Random Thoughts, Technicals, Opinions (and All).
 * 2. Secondary tags: Topics extracted from GitHub Issue labels (#AI, #Architecture, #Performance, etc.).
 * Falls back gracefully to local markdown files if offline or repo is not yet created.
 */

const GITHUB_CMS_CONFIG = {
  // Your GitHub username and repository for storing articles
  owner: 'ngmanhtruong',
  repo: 'ngmanhtruong.github.io', // GitHub Issues CMS repository
  cacheDurationMs: 5 * 60 * 1000 // 5 minutes cache to preserve rate limits
};

// Bump the version when the cached article shape/summary format changes.
const CACHE_KEY = 'portfolio_articles_cache_v2';

const LOCAL_FALLBACK_ARTICLES = [
  {
    id: 4,
    slug: 'why-notebooks-beat-digital-apps',
    title: 'Why Physical Notebooks & Doodles Still Beat Digital Note Apps in 2026',
    date: 'Oct 15, 2026',
    readTime: '3 min read',
    type: 'random thoughts',
    tags: ['Productivity', 'Architecture'],
    summary: "Every year there's a new AI-powered note app, yet an authentic grid notebook and a wooden pencil still spark the best ideas.",
    author: 'Matthew Nguyen',
    file: 'content/articles/why-notebooks-beat-digital-apps.md'
  },
  {
    id: 3,
    slug: 'ai-coding-agents-workflow',
    title: 'How I Work With AI Coding Agents as a Senior Engineer',
    date: 'Oct 12, 2026',
    readTime: '5 min read',
    type: 'technicals',
    tags: ['AI', 'Engineering', 'Architecture', 'Productivity'],
    summary: 'Agents write code fast, but shipping production software requires taste, architectural boundaries, and relentless verification. Here is my daily workflow.',
    author: 'Matthew Nguyen',
    file: 'content/articles/ai-coding-agents-workflow.md'
  },
  {
    id: 2,
    slug: 'lean-frontend-architecture',
    title: 'Lean Front-End Architecture: Shipping Less JS, Getting More Speed',
    date: 'Sep 28, 2026',
    readTime: '4 min read',
    type: 'opinions',
    tags: ['Front-end', 'Performance', 'Web Standards', 'CSS'],
    summary: "Why modern web development doesn't always need 300kB of runtime JavaScript to look incredible and feel fluid.",
    author: 'Matthew Nguyen',
    file: 'content/articles/lean-frontend-architecture.md'
  },
  {
    id: 1,
    slug: 'building-interactive-metaverse-web',
    title: 'Lessons from Building Metaverse and Real-time Web Experiences',
    date: 'Aug 15, 2026',
    readTime: '6 min read',
    type: 'technicals',
    tags: ['Metaverse', 'WebGL', 'Unity', 'GraphQL'],
    summary: 'Reflections on bridging Unity 3D with React and Next.js for virtual sports arenas and real-time runner tracking.',
    author: 'Matthew Nguyen',
    file: 'content/articles/building-interactive-metaverse-web.md'
  }
];

class ArticlesManager {
  constructor() {
    this.articles = [];
  }

  /**
   * Normalizes article metadata, detects category type, and formats tag lists.
   */
  normalizeArticle(a) {
    const rawLabels = a.rawLabels || a.tags || [];
    const lowerLabels = rawLabels.map(l => (typeof l === 'string' ? l.toLowerCase() : (l.name || '').toLowerCase()));

    // 1. Determine primary category (type)
    let type = (a.type || '').toLowerCase();
    if (lowerLabels.some(l => l.includes('random thought') || l.includes('random-thought') || l === 'random thoughts')) {
      type = 'random thoughts';
    } else if (lowerLabels.some(l => l === 'opinions' || l === 'opinion')) {
      type = 'opinions';
    } else if (lowerLabels.some(l => l === 'technicals' || l === 'technical')) {
      type = 'technicals';
    } else if (!type) {
      if (lowerLabels.some(l => /essay|thoughts?|perspective|reflection/i.test(l))) {
        type = 'opinions';
      } else {
        type = 'technicals';
      }
    }

    const typeConfig = {
      'technicals': { label: 'Technicals', icon: '<svg class="doodle-ic" aria-hidden="true"><use href="#ic-bolt"></use></svg>', class: 'technicals' },
      'opinions': { label: 'Opinions', icon: '<svg class="doodle-ic" aria-hidden="true"><use href="#ic-speech"></use></svg>', class: 'opinions' },
      'random thoughts': { label: 'Random Thoughts', icon: '<svg class="doodle-ic" aria-hidden="true"><use href="#ic-bubbles"></use></svg>', class: 'random-thoughts' }
    };

    const typeInfo = typeConfig[type] || typeConfig['technicals'];

    // 2. Filter out category names from topic tags
    const cleanTags = (a.tags || []).map(t => (typeof t === 'string' ? t : t.name)).filter(t => {
      const low = t.toLowerCase();
      return !['technicals', 'technical', 'opinions', 'opinion', 'random thoughts', 'random thought'].includes(low);
    });

    return {
      id: a.id,
      slug: a.slug || String(a.id),
      title: a.title,
      date: a.date,
      readTime: a.readTime,
      type: type,
      typeLabel: typeInfo.label,
      typeIcon: typeInfo.icon,
      typeClass: typeInfo.class,
      tags: cleanTags,
      summary: a.summary || 'Click to read this note.',
      author: a.author || 'Matthew Nguyen',
      body: a.body || '',
      file: a.file,
      githubUrl: a.githubUrl,
      isGitHubIssue: !!a.isGitHubIssue
    };
  }

  /**
   * Loads the catalog of articles.
   * Priority:
   * 1. GitHub Issues API (with localStorage cache).
   * 2. Local content/articles.json.
   * 3. Built-in fallback articles.
   */
  async loadCatalog() {
    const cached = this.getCachedCatalog();
    if (cached) {
      this.articles = cached.map(a => this.normalizeArticle(a));
      return this.articles;
    }

    try {
      const githubArticles = await this.fetchFromGitHub();
      if (githubArticles && githubArticles.length > 0) {
        this.articles = githubArticles.map(a => this.normalizeArticle(a));
        this.setCachedCatalog(this.articles);
        return this.articles;
      }
    } catch (err) {
      console.info('[ArticlesManager] GitHub Issues CMS not reached:', err.message);
      // Rate-limited (403) or offline: prefer the last good copy of the real issues
      // over the built-in files, which may be missing newer posts.
      const stale = this.getCachedCatalog(true);
      if (stale) {
        this.articles = stale.map(a => this.normalizeArticle(a));
        return this.articles;
      }
    }

    // Fallback to local files
    try {
      const res = await fetch('content/articles.json');
      if (res.ok) {
        const localData = await res.json();
        this.articles = localData.map(a => this.normalizeArticle(a));
        return this.articles;
      }
    } catch (e) {
      // Local fetch failed (e.g. direct file:// protocol)
    }

    this.articles = LOCAL_FALLBACK_ARTICLES.map(a => this.normalizeArticle(a));
    return this.articles;
  }

  /**
   * Converts markdown to plain text (no **, #, backticks, links, lists...) for card previews.
   */
  markdownToPlainText(md) {
    return md
      .replace(/^---[\s\S]*?---\s*/, '')               // front matter
      .replace(/^\s*\*\*Labels:\*\*.*\n+/, '')          // "Labels: ..." line (tags are shown separately)
      .replace(/```[\s\S]*?```/g, ' ')                  // fenced code blocks
      .replace(/<!--[\s\S]*?-->/g, ' ')                 // html comments
      .replace(/<[^>]+>/g, ' ')                          // html tags
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')            // images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // links -> text
      .replace(/^\s{0,3}#{1,6}\s.*$/gm, ' ')            // headings (the card already shows the title)
      .replace(/^\s*>\s?/gm, '')                         // blockquotes
      .replace(/^\s*([-*+]|\d+\.)\s+/gm, '')           // list markers
      .replace(/^\s*([-*_]\s*){3,}$/gm, ' ')            // horizontal rules
      .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ')    // table separator rows
      .replace(/(\*\*|__)(.*?)\1/g, '$2')               // bold
      .replace(/(\*|_)(.*?)\1/g, '$2')                   // italic
      .replace(/~~(.*?)~~/g, '$1')                       // strikethrough
      .replace(/`([^`]*)`/g, '$1')                       // inline code
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Builds the card summary: first ~160 chars of the plain-text body, cut at a word boundary.
   */
  makeSummary(md, max = 160) {
    const text = this.markdownToPlainText(md || '');
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : max).trimEnd() + '…';
  }

  /**
   * Fetches open issues from the configured GitHub repository.
   */
  async fetchFromGitHub() {
    const { owner, repo } = GITHUB_CMS_CONFIG;
    if (!owner || !repo) return null;

    // 1. Static snapshot kept in sync by .github/workflows/sync-articles.yml. It is served by
    //    the site itself, so it never hits GitHub's per-IP API rate limit (60/h, shared IPs).
    try {
      const snap = await fetch(`content/issues.json?t=${Math.floor(Date.now() / 60000)}`);
      if (snap.ok) {
        const issues = await snap.json();
        if (Array.isArray(issues) && issues.length > 0) return this.issuesToArticles(issues);
      }
    } catch (e) {
      // Snapshot missing/unreadable: try the live API below.
    }

    // 2. Live GitHub API (rate limited when unauthenticated).
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc&per_page=50`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}`);
    }

    const issues = await res.json();
    if (!Array.isArray(issues) || issues.length === 0) return null;
    return this.issuesToArticles(issues);
  }

  /**
   * Converts GitHub issue objects (API or snapshot) into normalized articles.
   */
  issuesToArticles(issues) {
    return issues
      .filter(item => !item.pull_request && (!item.state || item.state === 'open'))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(issue => {
        const body = issue.body || '';
        const wordCount = body.trim().split(/\s+/).length;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        // Format date: e.g. "Oct 15, 2026"
        const d = new Date(issue.created_at);
        const dateStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const summary = this.makeSummary(body);
        const rawLabels = (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name));

        return this.normalizeArticle({
          id: issue.number,
          slug: String(issue.number),
          title: issue.title,
          date: dateStr,
          readTime: `${readTimeMinutes} min read`,
          tags: rawLabels,
          rawLabels: rawLabels,
          summary: summary || 'Click to read this note.',
          author: (issue.user && issue.user.login !== GITHUB_CMS_CONFIG.owner) ? issue.user.login : 'Matthew Nguyen',
          body: body,
          githubUrl: issue.html_url,
          isGitHubIssue: true
        });
      });
  }

  /**
   * Retrieves single article data and markdown by ID or slug.
   */
  async loadArticle(identifier) {
    const catalog = await this.loadCatalog();
    
    // Look up by id or slug
    const article = catalog.find(a => String(a.id) === String(identifier) || a.slug === identifier);
    
    if (article && article.body) {
      return { meta: article, markdown: article.body };
    }

    // If it's a local file reference
    if (article && article.file) {
      try {
        const res = await fetch(article.file);
        if (res.ok) {
          const rawText = await res.text();
          return { meta: article, markdown: rawText };
        }
      } catch (err) {
        console.error('[ArticlesManager] Failed to fetch local markdown:', err);
      }
    }

    // Direct GitHub single issue fetch fallback
    if (/^\d+$/.test(identifier)) {
      const { owner, repo } = GITHUB_CMS_CONFIG;
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${identifier}`);
        if (res.ok) {
          const issue = await res.json();
          const d = new Date(issue.created_at);
          const rawLabels = (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name));
          const meta = this.normalizeArticle({
            id: issue.number,
            slug: String(issue.number),
            title: issue.title,
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            readTime: `${Math.max(1, Math.ceil((issue.body || '').split(/\s+/).length / 200))} min read`,
            tags: rawLabels,
            rawLabels: rawLabels,
            author: issue.user ? issue.user.login : 'Matthew Nguyen',
            githubUrl: issue.html_url,
            isGitHubIssue: true
          });
          return { meta, markdown: issue.body || '' };
        }
      } catch (e) {}
    }

    // Default to first local article if available
    const fallback = this.normalizeArticle(LOCAL_FALLBACK_ARTICLES[0]);
    try {
      const res = await fetch(fallback.file);
      if (res.ok) {
        const rawText = await res.text();
        return { meta: fallback, markdown: rawText };
      }
    } catch (e) {}

    return null;
  }

  /**
   * Two small hand-drawn doodles for the right side of an article card's "Read note" row.
   * "Random" but seeded by the article id, so a card keeps its doodles when filters re-render.
   */
  cardDoodles(id) {
    const pool = ['dc-plane', 'dc-smile', 'dc-rainbow', 'dc-cloud', 'dc-eye', 'dc-crown', 'dc-music', 'dc-infinity', 'dc-sparkles', 'dc-twinkle'];
    let seed = (parseInt(id, 10) || String(id).length) * 2654435761 >>> 0;
    const rand = () => {            // mulberry32
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const first = Math.floor(rand() * pool.length);
    const second = (first + 1 + Math.floor(rand() * (pool.length - 1))) % pool.length;
    const colors = rand() < 0.5 ? ['b', 'r'] : ['r', 'b'];
    const tilts = ['rot-n12', 'rot-n8', 'rot-n6', 'rot-n4', 'rot-5', 'rot-6', 'rot-8', 'rot-12'];
    const svgs = [[first, 62], [second, 46]].map(([i, size], n) => {
      const tilt = tilts[Math.floor(rand() * tilts.length)];
      const w = Math.round(size * (0.9 + rand() * 0.25));
      return `<svg class="dd ${colors[n]} ${tilt}" width="${w}" height="${w}" aria-hidden="true"><use href="#${pool[i]}"></use></svg>`;
    }).join('');
    return `<span class="card-doodles" aria-hidden="true">${svgs}</span>`;
  }

  /**
   * Initializes the interactive notebook filter bar and article cards.
   */
  async initArticlesPage(options = {}) {
    const container = document.getElementById(options.containerId || 'articles-container');
    const filterWrap = document.getElementById(options.filterWrapId || 'articles-filter-wrap');
    if (!container) return;

    const articles = await this.loadCatalog();
    if (!articles || !articles.length) return;

    // Read initial state from URL query params (e.g. ?type=technicals or ?tag=AI)
    const urlParams = new URLSearchParams(window.location.search);
    let selectedType = urlParams.get('type') || 'all';
    let selectedTag = urlParams.get('tag') || null;

    // Validate selectedType
    const validTypes = ['all', 'technicals', 'opinions', 'random thoughts'];
    if (!validTypes.includes(selectedType.toLowerCase())) {
      selectedType = 'all';
    }

    // Extract all unique topic tags and compute counts
    const getTagCounts = () => {
      const counts = {};
      articles.forEach(a => {
        a.tags.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      return counts;
    };

    // Calculate counts for categories
    const getTypeCounts = () => {
      const counts = { all: articles.length, technicals: 0, opinions: 0, 'random thoughts': 0 };
      articles.forEach(a => {
        if (counts[a.type] !== undefined) {
          counts[a.type]++;
        }
      });
      return counts;
    };

    // Update URL query parameters
    const updateURL = () => {
      const params = new URLSearchParams();
      if (selectedType && selectedType !== 'all') params.set('type', selectedType);
      if (selectedTag) params.set('tag', selectedTag);
      const query = params.toString() ? `?${params.toString()}` : window.location.pathname;
      history.replaceState(null, '', query);
    };

    // Render Filter Bar
    const renderFilterBar = () => {
      if (!filterWrap) return;
      const typeCounts = getTypeCounts();
      const tagCounts = getTagCounts();
      const allTags = Object.keys(tagCounts).sort();

      filterWrap.innerHTML = `
        <div class="type-filter-bar" role="tablist" aria-label="Article categories">
          <button class="type-tab-btn ${selectedType === 'all' ? 'active' : ''}" data-type="all" role="tab" aria-selected="${selectedType === 'all'}">
            <span class="tab-icon"><svg class="doodle-ic" aria-hidden="true"><use href="#ic-grid"></use></svg></span>
            <span class="tab-label">All Notes</span>
            <span class="tab-count">${typeCounts.all}</span>
          </button>
          <button class="type-tab-btn ${selectedType === 'technicals' ? 'active' : ''}" data-type="technicals" role="tab" aria-selected="${selectedType === 'technicals'}">
            <span class="tab-icon"><svg class="doodle-ic" aria-hidden="true"><use href="#ic-bolt"></use></svg></span>
            <span class="tab-label">Technicals</span>
            <span class="tab-count">${typeCounts.technicals}</span>
          </button>
          <button class="type-tab-btn ${selectedType === 'opinions' ? 'active' : ''}" data-type="opinions" role="tab" aria-selected="${selectedType === 'opinions'}">
            <span class="tab-icon"><svg class="doodle-ic" aria-hidden="true"><use href="#ic-speech"></use></svg></span>
            <span class="tab-label">Opinions</span>
            <span class="tab-count">${typeCounts.opinions}</span>
          </button>
          <button class="type-tab-btn ${selectedType === 'random thoughts' ? 'active' : ''}" data-type="random thoughts" role="tab" aria-selected="${selectedType === 'random thoughts'}">
            <span class="tab-icon"><svg class="doodle-ic" aria-hidden="true"><use href="#ic-bubbles"></use></svg></span>
            <span class="tab-label">Random Thoughts</span>
            <span class="tab-count">${typeCounts['random thoughts']}</span>
          </button>
        </div>

        <div class="tag-filter-bar">
          <div class="tag-filter-header">
            <span class="tag-filter-title note tab-label">
              <svg class="dd r dd-inline" width="22" height="22"><use href="#d-star"></use></svg>
              Filter by topic:
            </span>
            <button class="clear-filter-btn${selectedTag || selectedType !== 'all' ? '' : ' is-hidden'}" id="clear-filter-btn">
              ✕ Clear filters
            </button>
          </div>
          <div class="tag-cloud">
            ${allTags.map(tag => `
              <button class="tag-pill ${selectedTag === tag ? 'active' : ''}" data-tag="${tag}">
                #${tag} <span class="tag-pill-count">(${tagCounts[tag]})</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      // Event: Click on Type Tab
      filterWrap.querySelectorAll('.type-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          selectedType = type;
          updateURL();
          renderFilterBar();
          renderArticles();
        });
      });

      // Event: Click on Tag Pill
      filterWrap.querySelectorAll('.tag-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.tag;
          selectedTag = (selectedTag === tag) ? null : tag;
          updateURL();
          renderFilterBar();
          renderArticles();
        });
      });

      // Event: Clear filters button
      const clearBtn = filterWrap.querySelector('#clear-filter-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          selectedType = 'all';
          selectedTag = null;
          updateURL();
          renderFilterBar();
          renderArticles();
        });
      }
    };

    // Filter and Render articles
    const renderArticles = () => {
      const filtered = articles.filter(a => {
        const matchType = (selectedType === 'all' || a.type === selectedType);
        const matchTag = (!selectedTag || a.tags.includes(selectedTag));
        return matchType && matchTag;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-notes rbox card">
            <span class="hw empty-icon"><svg class="doodle-ic" aria-hidden="true"><use href="#ic-bubbles"></use></svg></span>
            <h3 class="hw ink empty-title">No notes found here yet!</h3>
            <p class="empty-text">
              No articles match the selected filter (${selectedType !== 'all' ? selectedType : ''} ${selectedTag ? '#' + selectedTag : ''}). Try selecting another category or clear the filter.
            </p>
            <button class="btn btn-xs rbox r" id="empty-reset-btn">Reset all filters</button>
          </div>
        `;
        const resetBtn = container.querySelector('#empty-reset-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            selectedType = 'all';
            selectedTag = null;
            updateURL();
            renderFilterBar();
            renderArticles();
          });
        }
        return;
      }

      container.innerHTML = filtered.map((a, idx) => `
        <article class="rbox card ${idx % 2 === 1 ? 'alt' : ''} article-card">
          <span class="tape"></span>
          <div class="article-meta">
            <span>${a.date}</span>
            <span class="dot">•</span>
            <span>${a.readTime}</span>
            <span class="dot">•</span>
            <span class="blue">By ${a.author}</span>
            <span class="article-type-badge ${a.typeClass}" data-type-filter="${a.type}" title="Filter by category: ${a.typeLabel}">
              ${a.typeIcon} ${a.typeLabel}
            </span>
          </div>
          <h3>
            <a class="lk c-ink" href="article.html?slug=${a.slug}">
              ${a.title}
            </a>
          </h3>
          <p class="card-excerpt">
            ${String(a.summary).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </p>
          <div class="article-tags">
            ${a.tags.map(t => `<span class="article-tag" data-tag-filter="${t}">#${t}</span>`).join('')}
          </div>
          <div class="mt-20 card-actions">
            <a class="btn btn-sm rbox r" href="article.html?slug=${a.slug}">Read note →</a>
            ${this.cardDoodles(a.id)}
          </div>
        </article>
      `).join('');

      // Click on type badge on card to filter
      container.querySelectorAll('.article-type-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedType = badge.dataset.typeFilter;
          updateURL();
          renderFilterBar();
          renderArticles();
        });
      });

      // Click on tag on card to filter
      container.querySelectorAll('.article-tag').forEach(tagEl => {
        tagEl.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedTag = tagEl.dataset.tagFilter;
          updateURL();
          renderFilterBar();
          renderArticles();
        });
      });
    };

    renderFilterBar();
    renderArticles();
  }

  /**
   * Cache management to preserve GitHub API rate limits.
   */
  getCachedCatalog(allowStale = false) {
    try {
      const item = localStorage.getItem(CACHE_KEY);
      if (!item) return null;
      const data = JSON.parse(item);
      if (allowStale || Date.now() - data.timestamp < GITHUB_CMS_CONFIG.cacheDurationMs) {
        return data.articles;
      }
    } catch (e) {}
    return null;
  }

  setCachedCatalog(articles) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        articles
      }));
    } catch (e) {}
  }

  /**
   * Lightweight Markdown to Notebook-styled HTML converter.
   */
  renderMarkdownToHtml(markdown) {
    let body = markdown.replace(/\r\n?/g, '\n').replace(/^---[\s\S]*?---\s*/, '');
    // The "Labels: ..." line some issues start with duplicates the tag chips shown above the body.
    body = body.replace(/^\s*\*\*Labels:\*\*.*\n+/m, '');

    const escapeHtml = (str) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks
    body = body.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="rbox"><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    body = body.replace(/`([^`\n]+)`/g, (m, code) => `<code>${escapeHtml(code)}</code>`);

    // Headers
    body = body.replace(/^# (.*$)/gm, '<h1 class="hw ink">$1</h1>\n\n');
    body = body.replace(/^## (.*$)/gm, '<h2 class="hw red">$1</h2>\n\n');
    body = body.replace(/^### (.*$)/gm, '<h3 class="hw blue">$1</h3>\n\n');

    // Horizontal rule
    body = body.replace(/^---$/gm, '\n\n<div class="rule" aria-hidden="true"></div>\n\n');

    // Blockquotes
    body = body.replace(/^> (.*$)/gm, '<blockquote class="rbox alt card">$1</blockquote>\n\n');

    // Bold / Strong / Italics
    body = body.replace(/\*\*([^*]+)\*\*/g, '<strong class="hl">$1</strong>');
    body = body.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Markdown Links
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="lk" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Images
    body = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Unordered lists
    body = body.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="dash-item">$1</li>');
    body = body.replace(/(<li class="dash-item">.*<\/li>(\n|$))+/g, '\n\n<ul class="dash">$&</ul>\n\n');

    // Ordered lists
    body = body.replace(/^\s*\d+\.\s+(.*)$/gm, '<li class="num-item">$1</li>');
    body = body.replace(/(<li class="num-item"[^>]*>.*<\/li>(\n|$))+/g, '\n\n<ol>$&</ol>\n\n');

    // Paragraphs
    const paragraphs = body.split(/\n{2,}/);
    body = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote|div|img)/.test(p)) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return body;
  }
}

// Attach globally
window.articlesManager = new ArticlesManager();
