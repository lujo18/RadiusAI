"use client";

import * as React from "react";
import {
  usePosts,
  useDeletePostWithSlides,
  usePostsByBrand,
} from "@/features/posts/hooks";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Icon,
  MoreHorizontal,
  Rocket,
  Download,
  Heart,
  Eye,
  Share,
  Send,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Post, PostWithAnalytics } from "@/types/types";
import { postService } from "@/features/posts/services";
import { usePostingModal } from "@/components/modals/PostingModalProvider";
import { useBrands, useBrandIntegrations } from "@/features/brand/hooks";
import { Switch } from "@/components/animate-ui/components/radix/switch";
// ...existing code...
import { SocialItem } from "@/components/platform-integrations/SocialItem";
import { platform } from "os";
import { platforms } from "@/constants/platforms";
import { downloadSlides } from "@/util/downloadSlides";
import { LoadingButton } from "@/components/ui/loading-button";
import { useState } from "react";
import { useAnalytics } from "@/features/analytics/hooks";
import { usePostsWithAnalytics } from "@/features/posts/hooks";

export default function Page({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  // Brand switcher
  const {
    data: brands,
    isLoading: brandsLoading,
    error: brandsError,
  } = useBrands();
  const router = useRouter();
  const { brandId } = React.use(params);

  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false);

  // Redirect to /overview if:
  // A. brandId doesn't exist in Supabase (not in user's brands list after loading)
  // B. User doesn't own the brand (brand.user_id !== user.id)
  React.useEffect(() => {
    if (brandsLoading) return; // Wait for brands to load
    if (!Array.isArray(brands)) return; // No brands or not an array
    if (brands.length === 0) return; // No brands yet - could still be loading or user has no brands

    const found = brands.find((b: any) => b.id === brandId);
    // Only redirect if brand explicitly doesn't exist AND we have successfully loaded brands
    if (!found) {
      router.replace("/overview");
    }
  }, [brands, brandsLoading, brandId, router]);
  const deletePostMutation = useDeletePostWithSlides();
  // Bulk delete handler
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedRows.length} selected post(s) and all their slides? This cannot be undone.`,
      )
    )
      return;
    for (const row of selectedRows) {
      await (deletePostMutation as any).mutateAsync(row.original.id);
    }
    setBulkDeleteLoading(false);
  };

  // Bulk download handler
  const handleBulkDownload = async () => {
    setBulkDownloadLoading(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    for (const row of selectedRows) {
      downloadSlides(row.original);
    }
    setBulkDownloadLoading(false);
  };

  const { data, isLoading, error } = usePostsWithAnalytics(brandId);

  const postingModal = usePostingModal();
  // Fetch platform integrations for this brand
  const { data: integrations, isLoading: integrationsLoading } =
    useBrandIntegrations(brandId);

  const columns: ColumnDef<PostWithAnalytics>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "thumbnail",
      header: "Thumbnail",
      cell: ({ row }) => {
        const post = row.original;
        const storageUrls = post.storage_urls as any;
        const thumbnail = storageUrls?.thumbnail;

        return (
          <div className="w-20 h-24 rounded-lg overflow-hidden bg-background border border-white/10">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt="Post thumbnail"
                width={80}
                height={96}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-foreground/5 flex items-center justify-center text-xs text-foreground/50">
                No image
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "content",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description / Caption
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const post = row.original;
        const content = post.content as any;

        return (
          <div className="max-w-md">
            <div className="font-medium text-foreground mb-1">
              {content?.title || "Untitled Post"}
            </div>
            <div className="text-sm text-foreground/60 line-clamp-2">
              {content?.caption || "No caption"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "draft";
        const statusColors = {
          draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          published: "bg-primary/10 text-primary border-primary/20",
          scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          failed: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return (
          <div
            className={`capitalize px-3 py-1 rounded-full text-xs font-medium border inline-block ${
              statusColors[status as keyof typeof statusColors] ||
              statusColors.draft
            }`}
          >
            {status}
          </div>
        );
      },
    },

    {
      accessorFn: (row) => (row.analytics as any)?.impressions || 0,
      id: "impressions",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Impressions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const post = row.original;
        const analytics = post.analytics as any;

        return (
          <div className="max-w-md">
            <div className="flex font-medium text-foreground mb-1 gap-2">
              {analytics?.impressions || 0}{" "}
              <Eye size="18" className="text-border" />
            </div>
          </div>
        );
      },
    },

    {
      accessorFn: (row) => (row.analytics as any)?.likes || 0,
      id: "likes",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Likes
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const post = row.original;
        const analytics = post.analytics as any;

        return (
          <div className="max-w-md">
            <div className="flex font-medium text-foreground mb-1 gap-2">
              {analytics?.likes || 0}{" "}
              <Heart size="18" className="text-border" />
            </div>
          </div>
        );
      },
    },

    {
      accessorFn: (row) => (row.analytics as any)?.comments || 0,
      id: "comments",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Comments
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const post = row.original;
        const analytics = post.analytics as any;

        return (
          <div className="max-w-md">
            <div className="flex font-medium text-foreground mb-1 gap-2">
              {analytics?.comments || 0}{" "}
              <MessageCircle size="18" className="text-border" />
            </div>
          </div>
        );
      },
    },

    {
      accessorFn: (row) => (row.analytics as any)?.shares || 0,
      id: "shares",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Shares
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const post = row.original;
        const analytics = post.analytics as any;

        return (
          <div className="max-w-md">
            <div className="flex font-medium text-foreground mb-1 gap-2">
              {analytics?.shares || 0}{" "}
              <Send size="18" className="text-border" />
            </div>
          </div>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const post = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  postingModal.open({ postData: post, brandId, integrations })
                }
              >
                Publish <Rocket />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadSlides(post)}>
                Download slides <Download className="ml-2 h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/brand/${brandId}/posts/${post.id}`)
                }
              >
                View post
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(post.id)}
              >
                Copy post ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={deletePostMutation.isPending}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      "Are you sure you want to delete this post and all its slides? This cannot be undone.",
                    )
                  ) {
                    await (deletePostMutation as any).mutateAsync(post.id);
                  }
                }}
              >
                {deletePostMutation.isPending ? "Deleting..." : "Delete post"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // --- RENDER ---
  return (
    <>
      {isLoading ? (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            Error loading posts.
          </div>
        </div>
      ) : (
        <div className="flex flex-col px-6 py-12">
          <h1 className="text-3xl font-bold text-foreground mb-8">Posts</h1>
          <div className="overflow-hidden max-w-4xl space-y-4">
            <div className="flex items-center gap-4">
              {table.getFilteredSelectedRowModel().rows.length !== 0 && (
                <>
                  <LoadingButton
                    loading={bulkDeleteLoading}
                    variant="destructive"
                    size="sm"
                    disabled={
                      table.getFilteredSelectedRowModel().rows.length === 0 ||
                      deletePostMutation.isPending
                    }
                    onClick={handleBulkDelete}
                  >
                    {deletePostMutation.isPending
                      ? "Deleting..."
                      : `Delete Selected (${table.getFilteredSelectedRowModel().rows.length})`}
                  </LoadingButton>
                  <LoadingButton
                    loading={bulkDownloadLoading}
                    variant="secondary"
                    size="sm"
                    disabled={
                      table.getFilteredSelectedRowModel().rows.length === 0
                    }
                    onClick={handleBulkDownload}
                  >
                    Download Selected (
                    {table.getFilteredSelectedRowModel().rows.length})
                  </LoadingButton>
                </>
              )}
              <Input
                placeholder="Filter by caption..."
                value={
                  (table.getColumn("content")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("content")?.setFilterValue(event.target.value)
                }
                className="max-w-sm bg-background border-foreground/10 text-foreground"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="overflow-x-auto rounded-md border border-foreground/10">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="border-foreground/10 hover:bg-foreground/5"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-foreground">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-foreground/10 hover:bg-foreground/5 cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/brand/${brandId}/posts/${row.original.id}`,
                          )
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            onClick={(e) => {
                              // Prevent navigation when clicking checkboxes/actions
                              if (
                                cell.column.id === "select" ||
                                cell.column.id === "actions"
                              ) {
                                e.stopPropagation();
                              }
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-foreground/60"
                      >
                        No posts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="text-foreground/60 flex-1 text-sm">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
