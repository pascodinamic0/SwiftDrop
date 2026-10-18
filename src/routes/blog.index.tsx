import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPostDate, getAllPosts } from "@/lib/blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — SwiftDrop" },
      {
        name: "description",
        content: "Delivery tips and product updates from SwiftDrop.",
      },
    ],
  }),
  loader: () => getAllPosts(),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = Route.useLoaderData();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">SwiftDrop Blog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Articles</h1>
        <p className="mt-3 text-muted-foreground">Delivery tips and product updates.</p>
        <div className="mt-10 space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                  {post.category}
                </span>
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                <span>{post.readingTimeMinutes} min</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Read →
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
