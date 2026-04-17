export type AdminBlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url?: string | null;
  seo_keywords: string[];
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  seo_keywords: string[];
  author_id?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BlogListResponse = {
  posts: BlogPost[];
};

export type AdminBlogGenerateResponse = {
  draft: AdminBlogDraft;
  published_post?: BlogPost | null;
};

export type AdminBlogGeneratePayload = {
  keyword: string;
  tone: string;
  audience?: string;
  publish_immediately?: boolean;
};

export type AdminBlogPublishPayload = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  cover_image_url?: string;
  seo_keywords: string[];
  is_published: boolean;
};
