import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Radius Blog | SEO and Social Content Growth",
  description:
    "Learn practical, data-driven strategies to scale organic search and social growth with Radius.",
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
};

type BlogListResponse = {
  posts: BlogPost[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/blog?limit=200`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as BlogListResponse;
    return data.posts || [];
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Radius Blog</h1>
          <p className="text-lg text-foreground/70 max-w-3xl">
            Actionable SEO and social content systems for solo founders and agencies.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-foreground/70">
            No published posts yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden hover:border-primary/40 transition-colors"
              >
                {post.cover_image_url ? (
                  <div className="relative h-56 w-full">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}
                <div className="p-6 space-y-3">
                  <h2 className="text-2xl font-semibold leading-snug text-foreground">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt ? <p className="text-foreground/70">{post.excerpt}</p> : null}
                  <div className="text-sm text-foreground/50">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
