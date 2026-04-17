import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Mermaid from "@/components/ui/mermaid";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  seo_keywords: string[];
  published_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type MarkdownPreProps = ComponentPropsWithoutRef<"pre"> & {
  children?: ReactNode;
};

function extractMermaidSource(children: ReactNode): string | null {
  const firstChild = Children.toArray(children)[0];

  if (!isValidElement<{ className?: string; children?: ReactNode }>(firstChild)) {
    return null;
  }

  const className = firstChild.props.className || "";
  if (!className.includes("language-mermaid")) {
    return null;
  }

  const content = firstChild.props.children;
  if (Array.isArray(content)) {
    return content.join("").replace(/\n$/, "");
  }

  return String(content || "").replace(/\n$/, "");
}

function MarkdownPre({ children, ...props }: MarkdownPreProps) {
  const mermaidSource = extractMermaidSource(children);
  if (mermaidSource) {
    return <Mermaid chart={mermaidSource} />;
  }

  return <pre {...props}>{children}</pre>;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/blog/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BlogPost;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Radius Blog",
      description: "SEO and social content growth guides from Radius.",
    };
  }

  return {
    title: `${post.title} | Radius Blog`,
    description: post.excerpt || "SEO and social content growth guides from Radius.",
    openGraph: {
      title: post.title,
      description: post.excerpt || "SEO and social content growth guides from Radius.",
      images: post.cover_image_url ? [post.cover_image_url] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const published = post.published_at || post.updated_at || post.created_at;
  const publishedLabel = published
    ? new Date(published).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Draft";
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    datePublished: post.published_at || post.created_at || null,
    dateModified: post.updated_at || post.created_at || null,
    image: post.cover_image_url || null,
    keywords: post.seo_keywords || [],
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-24">
      <article className="mx-auto w-full max-w-[760px] px-6 md:px-8">
        <header className="mb-12 md:mb-14">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.08] mb-6">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="max-w-[64ch] text-xl md:text-2xl leading-relaxed text-foreground/75 mb-6">
              {post.excerpt}
            </p>
          ) : null}
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/50">
            <span>{publishedLabel}</span>
            {post.seo_keywords.length > 0 ? (
              <>
                <span aria-hidden="true">•</span>
                <span className="text-foreground/45">{post.seo_keywords.slice(0, 2).join(" • ")}</span>
              </>
            ) : null}
          </div>
          {post.cover_image_url ? (
            <div className="relative mt-8 w-full h-[320px] md:h-[420px] overflow-hidden rounded-xl border border-border/60">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 760px"
                priority
              />
            </div>
          ) : null}
        </header>

        <section className="prose prose-invert prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-3xl prose-h3:mt-12 prose-h3:mb-4 prose-h3:text-2xl prose-p:my-6 prose-p:leading-8 prose-p:text-foreground/85 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-li:my-2 prose-li:text-foreground/85 prose-blockquote:border-l-border prose-blockquote:text-foreground/70 prose-blockquote:italic prose-hr:border-border/60 prose-code:rounded-md prose-code:bg-foreground/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-pre:border prose-pre:border-border/60 prose-pre:bg-foreground/5 prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: MarkdownPre }}>
            {post.content}
          </ReactMarkdown>
        </section>
      </article>

      <Script
        id={`blog-article-jsonld-${post.id}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
    </main>
  );
}
