import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

type BlogPost = {
  slug: string;
  updated_at?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

type BlogListResponse = {
  posts: BlogPost[];
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://getradius.ai").replace(/\/$/, "");
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/blog?limit=500`, {
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/terms-of-service`,
      lastModified: now,
    },
  ];

  const posts = await getPublishedPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const updated = post.updated_at || post.published_at || post.created_at;
    return {
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: updated ? new Date(updated) : now,
    };
  });

  return [...staticPages, ...blogPages];
}
