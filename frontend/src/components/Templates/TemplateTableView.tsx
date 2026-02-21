"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Template } from "@/types/template";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

interface TemplateTableViewProps {
  templates: Template[] | undefined;
  isLoading: boolean;
  brandId: string;
  onDelete: (templateId: string) => void;
}

export const TemplateTableView: React.FC<TemplateTableViewProps> = ({
  templates,
  isLoading,
  brandId,
  onDelete,
}) => {
  const router = useRouter();
  const params = useParams();
  const teamId = (params?.teamId as string) || "";
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Template>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div>
            <p className="font-semibold">{template.name}</p>
            {template.is_default && (
              <Badge
                variant="secondary"
                className="mt-1 bg-primary/20 text-primary text-xs"
              >
                Default
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs uppercase">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={`text-xs uppercase ${
            row.original.status === "testing" ? "bg-chart-1/20 text-chart-1" : ""
          }`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorFn: (row) => (row as any).analytics?.postCount || 0,
      id: "postCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end"
        >
          Total Posts
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-right block">
          {(row.original as any).analytics?.postCount || 0}
        </span>
      ),
    },
    {
      accessorFn: (row) => (row as any).analytics?.engagementRate || 0,
      id: "engagementRate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end"
        >
          Avg Engagement
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-chart-4 text-right block">
          {((row.original as any).analytics?.engagementRate || 0).toFixed(1)}%
        </span>
      ),
    },
    {
      accessorFn: (row) => (row as any).analytics?.impressions || 0,
      id: "impressions",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end"
        >
          Impressions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-right block">
          {(row.original as any).analytics?.impressions || 0}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              router.push(`/${teamId}/brand/${brandId}/template/${row.original.id}`)
            }
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: templates || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No templates yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-md">
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
            table.getRowModel().rows.map((row) => {
              const template = row.original;
              return (
                <TableRow
                  key={row.id}
                  className={`${
                    template.is_default ? "bg-primary/5" : ""
                  } hover:bg-foreground/5 transition-colors`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-foreground/60"
              >
                No templates found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TemplateTableView;
