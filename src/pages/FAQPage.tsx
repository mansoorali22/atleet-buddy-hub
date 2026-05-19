import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Database, TrendingUp, DollarSign, Pencil, Trash2 } from "lucide-react";
import { useFAQList, useFAQStats, useUpdateFAQ, useDeleteFAQ } from "@/hooks/useFAQ";
import type { FAQItem } from "@/types/faq";

function formatDt(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm");
  } catch {
    return value;
  }
}

export default function FAQPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFAQList(page);
  const { data: stats } = useFAQStats();

  const [editItem, setEditItem] = useState<FAQItem | null>(null);
  const [editAnswer, setEditAnswer] = useState("");
  const [deleteItem, setDeleteItem] = useState<FAQItem | null>(null);

  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();

  const openEdit = (item: FAQItem) => {
    setEditItem(item);
    setEditAnswer(item.answer_text);
  };

  const onSubmitEdit = async () => {
    if (!editItem || !editAnswer.trim()) return;
    try {
      await updateFAQ.mutateAsync({ id: editItem.id, answer_text: editAnswer.trim() });
      toast.success("Cached answer updated");
      setEditItem(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteFAQ.mutateAsync(deleteItem.id);
      toast.success("Cache entry deleted");
      setDeleteItem(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const items = data?.items ?? [];
  const pages = Math.max(1, data?.pages ?? 1);
  const total = data?.total ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-semibold text-foreground tracking-tight">
          FAQ Cache
        </h1>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
            <Database className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{stats?.total_entries ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Cached entries</div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{stats?.total_hits?.toLocaleString() ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Total cache hits</div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">
                ${stats?.cache_hit_savings_usd?.toFixed(4) ?? "0.00"}
              </div>
              <div className="text-xs text-muted-foreground">Est. savings</div>
            </div>
          </div>
        </div>

        {/* FAQ table */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-left bg-muted/30">
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Question
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-16">
                  Lang
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-16">
                  Hits
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Last hit
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))}
              {!isLoading &&
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground line-clamp-2">{item.question_text}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.answer_text}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs uppercase">
                        {item.language ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.hit_count}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {formatDt(item.last_hit_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No cached FAQ entries yet. They will appear as users ask questions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{total} entries</span>
          {pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page {page} of {pages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={page >= pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pages, p + 1)); }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {/* Edit dialog */}
        <Dialog open={Boolean(editItem)} onOpenChange={(o) => !o && setEditItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit cached answer</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Question</div>
                  <div className="text-sm font-medium">{editItem.question_text}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Answer</div>
                  <Textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={() => void onSubmitEdit()} disabled={updateFAQ.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={Boolean(deleteItem)} onOpenChange={(o) => !o && setDeleteItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete cached entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the cached answer for: "{deleteItem?.question_text}"
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void onConfirmDelete()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
