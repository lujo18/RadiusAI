"use client";

import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Mermaid from "@/components/ui/mermaid";
import {
  useGenerateAdminBlogDraft,
  usePublishAdminBlogPost,
} from "@/features/blog_admin/hooks";

const DEFAULT_TONE = "expert";
const MERMAID_STARTER = [
  "```mermaid",
  "flowchart TD",
  "  A[Problem] --> B[Action]",
  "  B --> C[Outcome]",
  "```",
].join("\n");

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

export default function NewAdminBlogPage() {
  const router = useRouter();
  const generateMutation = useGenerateAdminBlogDraft();
  const publishMutation = usePublishAdminBlogPost();

  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [audience, setAudience] = useState("Solo online business owners and agencies");
  const [autoPublishOnGenerate, setAutoPublishOnGenerate] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [seoKeywordsText, setSeoKeywordsText] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isBusy = generateMutation.isPending || publishMutation.isPending;

  const seoKeywords = useMemo(
    () =>
      seoKeywordsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [seoKeywordsText]
  );

  const handleInsertMermaidStarter = () => {
    setContent((current) => {
      const trimmed = current.trimEnd();
      if (!trimmed) {
        return MERMAID_STARTER;
      }
      return `${trimmed}\n\n${MERMAID_STARTER}`;
    });
  };

  const handleGenerate = async () => {
    setStatusMessage(null);

    try {
      const response = await generateMutation.mutateAsync({
        keyword,
        tone,
        audience,
        publish_immediately: autoPublishOnGenerate,
      });

      const draft = response.draft;
      setTitle(draft.title);
      setSlug(draft.slug);
      setExcerpt(draft.excerpt);
      setContent(draft.content);
      setCoverImageUrl(draft.cover_image_url || "");
      setSeoKeywordsText((draft.seo_keywords || []).join(", "));

      if (response.published_post) {
        setStatusMessage("Draft generated and published successfully.");
        router.push("/admin/blog");
        return;
      }

      setStatusMessage("Draft generated. Review and edit in the markdown editor below.");
    } catch (error: any) {
      setStatusMessage(error?.response?.data?.detail || "Failed to generate draft.");
    }
  };

  const handleSave = async (isPublished: boolean) => {
    setStatusMessage(null);

    try {
      await publishMutation.mutateAsync({
        title,
        slug,
        excerpt,
        content,
        cover_image_url: coverImageUrl || undefined,
        seo_keywords: seoKeywords,
        is_published: isPublished,
      });

      setStatusMessage(isPublished ? "Post published successfully." : "Draft saved successfully.");
      router.push("/admin/blog");
    } catch (error: any) {
      setStatusMessage(error?.response?.data?.detail || "Failed to save post.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Automated Content Studio</h1>
        <p className="text-foreground/60">
          Generate high-quality SEO drafts and refine them in a manual markdown editor.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Generation Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Primary keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="AI carousel maker for agencies"
                name="keyword"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="expert"
                name="tone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audience</Label>
            <Input
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Solo online business owners and agencies"
              name="audience"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-publish-on-generate"
              checked={autoPublishOnGenerate}
              onCheckedChange={(checked) => setAutoPublishOnGenerate(Boolean(checked))}
            />
            <Label htmlFor="auto-publish-on-generate" className="cursor-pointer">
              Publish immediately after generation
            </Label>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!keyword.trim() || isBusy}
            className="bg-primary hover:bg-primary/80"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Draft
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Manual Markdown Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} name="title" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} name="slug" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-image-url">Cover image URL</Label>
              <Input
                id="cover-image-url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                name="cover_image_url"
                inputMode="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo-keywords">SEO keywords (comma separated)</Label>
            <Input
              id="seo-keywords"
              value={seoKeywordsText}
              onChange={(e) => setSeoKeywordsText(e.target.value)}
              name="seo_keywords"
              placeholder="ai carousel maker, social media carousel templates"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="min-h-30"
              name="excerpt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Markdown content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-105 font-mono text-sm"
              name="content"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="content-preview">Live preview</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleInsertMermaidStarter}>
                Insert Mermaid Starter
              </Button>
            </div>
            <div
              id="content-preview"
              className="max-h-[32rem] overflow-y-auto rounded-xl border border-border/60 bg-background/50 p-4"
            >
              {content.trim() ? (
                <article className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-pre:border prose-pre:border-border/60 prose-pre:bg-foreground/5 prose-code:rounded-md prose-code:bg-foreground/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-img:rounded-xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: MarkdownPre }}>
                    {content}
                  </ReactMarkdown>
                </article>
              ) : (
                <p className="text-sm text-foreground/60">Start writing markdown to preview your article and diagrams.</p>
              )}
            </div>
          </div>

          {statusMessage ? (
            <div className="text-sm text-foreground/80">{statusMessage}</div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isBusy || !title.trim() || !excerpt.trim() || !content.trim()}
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isBusy || !title.trim() || !excerpt.trim() || !content.trim()}
              className="bg-primary hover:bg-primary/80"
            >
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
