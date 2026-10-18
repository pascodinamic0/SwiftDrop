import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlogPostBody } from "@/components/BlogPostBody";
import { formatPostDate, getPostBySlug } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — SwiftDrop` },
          { name: "description", content: loaderData.description },
        ]
      : [{ title: "Not found — SwiftDrop" }],
  }),
  component: BlogPostPage,
});

function BlogPostPage() {
  const post = Route.useLoaderData();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← All articles
        </Link>
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
            {post.category}
          </span>
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span>{post.readingTimeMinutes} min</span>
          <span>· {post.author}</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
        <div className="mt-10">
          <BlogPostBody body={post.body} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
