/**
 * Portfolio - Articles & Headless GitHub Issues CMS
 * Fetches articles directly from GitHub Issues (no redeploy needed to post/edit!).
 * Falls back gracefully to local markdown files if offline or repo is not yet created.
 */

const GITHUB_CMS_CONFIG = {
  // Your GitHub username and repository for storing articles
  owner: 'ngmanhtruong',
  repo: 'portfolio-v2', // GitHub Issues CMS repository
  cacheDurationMs: 5 * 60 * 1000 // 5 minutes cache to preserve rate limits
};

const LOCAL_FALLBACK_ARTICLES = [
  {
    id: 1,
    slug: 'ai-coding-agents-workflow',
    title: 'How I Work With AI Coding Agents as a Senior Engineer',
    date: 'Oct 12, 2026',
    readTime: '5 min read',
    tags: ['AI', 'Engineering', 'Architecture'],
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
    tags: ['Front-end', 'Performance', 'CSS'],
    summary: "Why modern web development doesn't always need 300kB of runtime JavaScript to look incredible and feel fluid.",
    author: 'Matthew Nguyen',
    file: 'content/articles/lean-frontend-architecture.md'
  },
  {
    id: 3,
    slug: 'building-interactive-metaverse-web',
    title: 'Lessons from Building Metaverse and Real-time Web Experiences',
    date: 'Aug 15, 2026',
    readTime: '6 min read',
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
   * Loads the catalog of articles.
   * Priority:
   * 1. GitHub Issues API (with localStorage cache).
   * 2. Local content/articles.json.
   * 3. Built-in fallback articles.
   */
  async loadCatalog() {
    const cached = this.getCachedCatalog();
    if (cached) {
      this.articles = cached;
      return cached;
    }

    try {
      const githubArticles = await this.fetchFromGitHub();
      if (githubArticles && githubArticles.length > 0) {
        this.articles = githubArticles;
        this.setCachedCatalog(githubArticles);
        return githubArticles;
      }
    } catch (err) {
      console.info('[ArticlesManager] GitHub Issues CMS not reached, using local files:', err.message);
    }

    // Fallback to local files
    try {
      const res = await fetch('content/articles.json');
      if (res.ok) {
        this.articles = await res.json();
        return this.articles;
      }
    } catch (e) {
      // Local fetch failed (e.g. direct file:// protocol)
    }

    this.articles = LOCAL_FALLBACK_ARTICLES;
    return this.articles;
  }

  /**
   * Fetches open issues from the configured GitHub repository.
   */
  async fetchFromGitHub() {
    const { owner, repo } = GITHUB_CMS_CONFIG;
    if (!owner || !repo) return null;

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

    // Filter out pull requests and format issues into articles
    return issues
      .filter(item => !item.pull_request)
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

        // Extract clean summary
        const cleanBody = body.replace(/^[#>-].*$/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
        const summary = cleanBody.slice(0, 160).replace(/\s+/g, ' ') + (cleanBody.length > 160 ? '...' : '');

        return {
          id: issue.number,
          slug: String(issue.number),
          title: issue.title,
          date: dateStr,
          readTime: `${readTimeMinutes} min read`,
          tags: (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name)),
          summary: summary || 'Click to read this note.',
          author: issue.user ? issue.user.login : 'Matthew Nguyen',
          body: body,
          githubUrl: issue.html_url,
          isGitHubIssue: true
        };
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
          const meta = {
            id: issue.number,
            slug: String(issue.number),
            title: issue.title,
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            readTime: `${Math.max(1, Math.ceil((issue.body || '').split(/\s+/).length / 200))} min read`,
            tags: (issue.labels || []).map(l => l.name),
            author: issue.user ? issue.user.login : 'Matthew Nguyen',
            githubUrl: issue.html_url,
            isGitHubIssue: true
          };
          return { meta, markdown: issue.body || '' };
        }
      } catch (e) {}
    }

    // Default to first local article if available
    const fallback = LOCAL_FALLBACK_ARTICLES[0];
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
   * Cache management to preserve GitHub API rate limits.
   */
  getCachedCatalog() {
    try {
      const item = localStorage.getItem('portfolio_articles_cache');
      if (!item) return null;
      const data = JSON.parse(item);
      if (Date.now() - data.timestamp < GITHUB_CMS_CONFIG.cacheDurationMs) {
        return data.articles;
      }
    } catch (e) {}
    return null;
  }

  setCachedCatalog(articles) {
    try {
      localStorage.setItem('portfolio_articles_cache', JSON.stringify({
        timestamp: Date.now(),
        articles
      }));
    } catch (e) {}
  }

  /**
   * Lightweight Markdown to Notebook-styled HTML converter.
   */
  renderMarkdownToHtml(markdown) {
    let body = markdown.replace(/^---[\s\S]*?---\s*/, '');

    const escapeHtml = (str) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks
    body = body.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="rbox" style="padding:16px 20px;overflow-x:auto;background:rgba(255,255,255,0.6);margin:24px 0"><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    body = body.replace(/`([^`]+)`/g, '<code style="background:rgba(211,236,69,0.3);padding:2px 6px;border-radius:3px;font-family:monospace;font-size:0.9em">$1</code>');

    // Headers
    body = body.replace(/^# (.*$)/gm, '<h1 class="hw ink" style="font-size: clamp(38px, 6vw, 56px); margin: 36px 0 16px; color: var(--ink);">$1</h1>');
    body = body.replace(/^## (.*$)/gm, '<h2 class="hw red" style="font-size: 38px; margin: 32px 0 14px; position:relative; display:inline-block;">$1</h2>');
    body = body.replace(/^### (.*$)/gm, '<h3 class="hw blue" style="font-size: 32px; margin: 24px 0 10px;">$1</h3>');

    // Horizontal rule
    body = body.replace(/^---$/gm, '<div class="rule" aria-hidden="true"></div>');

    // Blockquotes
    body = body.replace(/^> (.*$)/gm, '<blockquote class="rbox alt card" style="margin:24px 0;padding:18px 24px;border-left:4px solid var(--blue);font-family:\'Patrick Hand\',cursive;font-size:24px;line-height:32px;color:var(--blue)">$1</blockquote>');

    // Bold / Strong / Italics
    body = body.replace(/\*\*([^*]+)\*\*/g, '<strong class="hl">$1</strong>');
    body = body.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Markdown Links
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="lk" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Images
    body = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.15)">');

    // Unordered lists
    body = body.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="dash-item">$1</li>');
    body = body.replace(/(<li class="dash-item">.*<\/li>(\n|$))+/g, '<ul class="dash" style="margin:16px 0;">$&</ul>');

    // Ordered lists
    body = body.replace(/^\s*\d+\.\s+(.*)$/gm, '<li class="num-item" style="margin-left:24px;margin-bottom:8px">$1</li>');
    body = body.replace(/(<li class="num-item">.*<\/li>(\n|$))+/g, '<ol style="margin:16px 0;padding-left:16px">$&</ol>');

    // Paragraphs
    const paragraphs = body.split(/\n{2,}/);
    body = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote|div|img)/.test(p)) return p;
      return `<p style="margin: 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return body;
  }
}

// Attach globally
window.articlesManager = new ArticlesManager();
