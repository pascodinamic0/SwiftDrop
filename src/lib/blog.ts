export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  readingTimeMinutes: number;
};

export type BlogPost = BlogPostMeta & { body: string };

// Bundle markdown into the server/client build (Vercel serverless has no content/ on disk).
const rawModules = import.meta.glob("../../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function estimateReadingTime(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function fileToPost(path: string, raw: string): BlogPost {
  const { meta, body } = parseFrontmatter(raw);
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? "",
    date: meta.date ?? "2026-01-01",
    author: meta.author ?? "SwiftDrop",
    category: meta.category ?? "Updates",
    readingTimeMinutes: Number(meta.readingTimeMinutes) || estimateReadingTime(body),
    body,
  };
}

const posts: BlogPost[] = Object.entries(rawModules)
  .map(([path, raw]) => fileToPost(path, raw))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getAllPosts(): BlogPost[] {
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatPostDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
