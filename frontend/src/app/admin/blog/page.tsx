"use client";

import Link from "next/link";
import { FilePlus2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAdminBlogPosts } from "@/features/blog_admin/hooks";

export default function AdminBlogPage() {
  const { data, isLoading, error } = useAdminBlogPosts(200);
  const posts = data?.posts ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Blog Content</h1>
          <p className="text-foreground/60">
            Generate, edit, and publish SEO blog articles for Radius.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/80">
          <Link href="/admin/blog/new">
            <FilePlus2 className="w-4 h-4 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-foreground/70">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading blog posts...
            </div>
          ) : error ? (
            <div className="py-10 text-destructive">
              Failed to load blog posts.
            </div>
          ) : posts.length === 0 ? (
            <div className="py-10 text-foreground/60">
              No blog posts yet. Create your first article.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const updatedAt = post.updated_at || post.created_at;
                    return (
                      <TableRow key={post.id} className="border-border/50">
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="font-mono text-xs">/{post.slug}</TableCell>
                        <TableCell>
                          {post.is_published ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600/90">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground/70 text-sm">
                          {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
