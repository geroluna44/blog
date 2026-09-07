import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import config from "./site.config.js";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(ROOT, "content", "posts");
const TEMPLATE_DIR = join(ROOT, "src", "templates");
const DIST_DIR = join(ROOT, "dist");
const { site } = config;

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

function readTemplate(name) {
  return readFileSync(join(TEMPLATE_DIR, name), "utf8");
}

const baseTemplate = readTemplate("base.html");
const postListTemplate = readTemplate("post-list.html");
const postTemplate = readTemplate("post.html");
const tagTemplate = readTemplate("tag.html");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (/^\[/.test(value)) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((t) => t.trim().replace(/^['"]|['"]$/g, ""));
    } else {
      value = value.replace(/^['"]|['"]$/g, "");
    }
    data[key] = value;
  }
  return { data, content: match[2].trim() };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderList(posts) {
  return postListTemplate.replace(/{{#posts}}([\s\S]*?){{\/posts}}/, (_, block) =>
    posts
      .map((post) => {
        let html = block;
        html = html.replace(/{{url}}/g, post.url);
        html = html.replace(/{{title}}/g, escapeHtml(post.title));
        html = html.replace(/{{isoDate}}/g, post.date);
        html = html.replace(/{{date}}/g, post.dateLabel);
        html = html.replace(/{{description}}/g, escapeHtml(post.description));
        html = html.replace(
          /{{#tags}}([\s\S]*?){{\/tags}}/g,
          (_, tagBlock) =>
            post.tags
              .map((tag) =>
                tagBlock
                  .replace(/{{slug}}/g, slugify(tag))
                  .replace(/{{name}}/g, escapeHtml(tag))
              )
              .join("")
        );
        return html;
      })
      .join("\n")
  );
}

function renderTemplate(template, vars) {
  let html = template;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

function renderBase(content, title, description) {
  return renderTemplate(baseTemplate, {
    lang: site.lang,
    title: `${title} · ${site.title}`,
    description: description || site.description,
    siteTitle: site.title,
    siteUrl: site.url,
    year: new Date().getFullYear(),
    author: site.author,
    content,
    analytics: analyticsSnippet(),
  });
}

function analyticsSnippet() {
  if (!config.analytics.goatcounter) return "";
  return `<script data-goatcounter="https://${config.analytics.goatcounter}/count" async src="//gc.zgo.at/count.js"></script>`;
}

function commentsSnippet() {
  const g = config.comments.giscus;
  if (!g || !g.repo) return "";
  return `
  <div class="giscus"></div>
  <script src="https://giscus.app/client.js"
    data-repo="${g.repo}"
    data-repo-id="${g.repoId}"
    data-category="${g.category}"
    data-category-id="${g.categoryId}"
    data-mapping="${g.mapping}"
    data-strict="${g.strict}"
    data-reactions-enabled="${g.reactionsEnabled}"
    data-emit-metadata="${g.emitMetadata}"
    data-input-position="${g.inputPosition}"
    data-theme="${g.theme}"
    data-lang="${g.lang}"
    async></script>`;
}

function rssFeed(posts) {
  const items = posts
    .slice(0, 10)
    .map(
      (p) => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${site.url}${p.url}</link>
      <guid isPermaLink="true">${site.url}${p.url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeHtml(p.description)}</description>
    </item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <link>${site.url}</link>
    <description>${escapeHtml(site.description)}</description>
    <language>${site.lang}</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function main() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const posts = files
    .map((file) => {
      const raw = readFileSync(join(CONTENT_DIR, file), "utf8");
      const { data, content } = parseFrontmatter(raw);
      const slug = slugify(basename(file, ".md"));
      return {
        slug,
        title: data.title || slug,
        date: data.date || "1970-01-01",
        dateLabel: formatDate(data.date || "1970-01-01"),
        description: data.description || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: `posts/${slug}/`,
        content,
        html: md.render(content),
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  mkdirSync(join(DIST_DIR, "posts"), { recursive: true });
  mkdirSync(join(DIST_DIR, "tags"), { recursive: true });

  const listHtml = renderList(posts);
  writeFileSync(join(DIST_DIR, "index.html"), renderBase(listHtml, site.title, site.description));

  for (const post of posts) {
    const tagBlock = post.tags
      .map((tag) => `<a class="tag" href="tags/${slugify(tag)}/">${escapeHtml(tag)}</a>`)
      .join(" ");
    let contentHtml = renderTemplate(postTemplate, {
      title: escapeHtml(post.title),
      isoDate: post.date,
      date: post.dateLabel,
      content: post.html,
      comments: commentsSnippet(),
    });
    contentHtml = contentHtml.replace(/{{#tags}}[\s\S]*?{{\/tags}}/, tagBlock);
    const page = renderBase(contentHtml, post.title, post.description);
    mkdirSync(join(DIST_DIR, "posts", post.slug), { recursive: true });
    writeFileSync(join(DIST_DIR, "posts", post.slug, "index.html"), page);
  }

  const tagMap = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push(post);
    }
  }
  for (const [tag, tagPosts] of tagMap) {
    const page = renderTemplate(tagTemplate, {
      tag: escapeHtml(tag),
      count: tagPosts.length,
      countLabel: tagPosts.length === 1 ? "post" : "posts",
      list: renderList(tagPosts),
    });
    mkdirSync(join(DIST_DIR, "tags", slugify(tag)), { recursive: true });
    writeFileSync(join(DIST_DIR, "tags", slugify(tag), "index.html"), renderBase(page, tag, ""));
  }

  writeFileSync(join(DIST_DIR, "feed.xml"), rssFeed(posts));

  const searchIndex = posts.map((p) => ({
    title: p.title,
    description: p.description,
    tags: p.tags,
    url: p.url,
    text: md.render(p.content).replace(/<[^>]+>/g, " "),
  }));
  writeFileSync(join(DIST_DIR, "search-index.json"), JSON.stringify(searchIndex));

  cpSync(join(ROOT, "src", "assets"), join(DIST_DIR, "assets"), { recursive: true });
  cpSync(join(ROOT, "src", "public"), join(DIST_DIR, "public"), { recursive: true });

  console.log(`Sitio generado en dist/ · ${posts.length} posts · ${tagMap.size} etiquetas`);
}

main();