"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Download,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Rocket,
  Send,
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
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingButton } from "@/components/ui/loading-button";

import { usePostsByAutomation, useDeletePostWithSlides } from "@/features/posts/hooks";
import { usePostingModal } from "@/components/modals/PostingModalProvider";
import { useBrandIntegrations } from "@/features/brand/hooks";
import { downloadSlides } from "@/util/downloadSlides";
import type { PostWithAnalytics } from "@/types/types";

interface AutomationPostsTabProps {
  automationId: string;
  brandId: string;
  teamId: string;
}

export function AutomationPostsTab({ automationId, brandId, teamId }: AutomationPostsTabProps) {
  const router = useRouter();
  const { data, isLoading, error } = usePostsByAutomation(automationId, brandId);
  const deletePostMutation = useDeletePostWithSlides(brandId);
  const postingModal = usePostingModal();
  const { data: integrations } = useBrandIntegrations(brandId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false);

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
        const storageUrls = (row.original.storage_urls as any);
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
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Description / Caption <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const content = row.original.content as any;
        return (
          <div className="max-w-md">
            <div className="font-medium text-foreground mb-1">{content?.title || "Untitled Post"}</div>
            <div className="text-sm text-foreground/60 line-clamp-2">{content?.caption || "No caption"}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "draft";
        const statusColors: Record<string, string> = {
          draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          published: "bg-primary/10 text-primary border-primary/20",
          scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          failed: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return (
          <div className={`capitalize px-3 py-1 rounded-full text-xs font-medium border inline-block ${statusColors[status] || statusColors.draft}`}>
            {status}
          </div>
        );
      },
    },
    {
      accessorFn: (row) => (row.analytics as any)?.impressions || 0,
      id: "impressions",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Impressions <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          {(row.original.analytics as any)?.impressions || 0} <Eye size={18} className="text-border" />
        </div>
      ),
    },
    {
      accessorFn: (row) => (row.analytics as any)?.likes || 0,
      id: "likes",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Likes <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          {(row.original.analytics as any)?.likes || 0} <Heart size={18} className="text-border" />
        </div>
      ),
    },
    {
      accessorFn: (row) => (row.analytics as any)?.comments || 0,
      id: "comments",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Comments <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          {(row.original.analytics as any)?.comments || 0} <MessageCircle size={18} className="text-border" />
        </div>
      ),
    },
    {
      accessorFn: (row) => (row.analytics as any)?.shares || 0,
      id: "shares",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Shares <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          {(row.original.analytics as any)?.shares || 0} <Send size={18} className="text-border" />
        </div>
      ),
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
              <DropdownMenuItem onClick={() => postingModal.open({ postData: post, brandId, integrations })}>
                Publish <Rocket />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadSlides(post)}>
                Download slides <Download className="ml-2 h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${teamId}/brand/${brandId}/posts/${post.id}`)}>
                View post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(post.id)}>
                Copy post ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={deletePostMutation.isPending}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this post and all its slides? This cannot be undone.")) {
                    await (deletePostMutation as any).mutateAsync(post.id);
                  }
                }}
              >
                {deletePostMutation.isPending ? "Deleting…" : "Delete post"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: (data as PostWithAnalytics[]) || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const handleBulkDelete = async () => {
    const rows = table.getFilteredSelectedRowModel().rows;
    if (rows.length === 0) return;
    if (!window.confirm(`Delete ${rows.length} selected post(s)? This cannot be undone.`)) return;
    setBulkDeleteLoading(true);
    for (const row of rows) {
      await (deletePostMutation as any).mutateAsync(row.original.id);
    }
    setBulkDeleteLoading(false);
  };

  const handleBulkDownload = async () => {
    const rows = table.getFilteredSelectedRowModel().rows;
    if (rows.length === 0) return;
    setBulkDownloadLoading(true);
    for (const row of rows) downloadSlides(row.original);
    setBulkDownloadLoading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
        Error loading posts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <>
            <LoadingButton loading={bulkDeleteLoading} variant="destructive" size="sm" onClick={handleBulkDelete}>
              Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
            </LoadingButton>
            <LoadingButton loading={bulkDownloadLoading} variant="secondary" size="sm" onClick={handleBulkDownload}>
              Download Selected ({table.getFilteredSelectedRowModel().rows.length})
            </LoadingButton>
          </>
        )}
        <Input
          placeholder="Filter by caption…"
          value={(table.getColumn("content")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("content")?.setFilterValue(e.target.value)}
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
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-foreground/10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-foreground/10 hover:bg-foreground/5">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-foreground/10 hover:bg-foreground/5 cursor-pointer"
                  onClick={() => router.push(`/${teamId}/brand/${brandId}/posts/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === "select" || cell.column.id === "actions") e.stopPropagation();
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-foreground/60">
                  No posts generated by this automation yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-2">
        <div className="text-foreground/60 flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
