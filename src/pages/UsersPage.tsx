import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { canEditPlans, canEditSubscriptions } from "@/lib/permissions";
import { useUsers } from "@/hooks/useUsers";
import { useUserDetail } from "@/hooks/useUserDetail";
import {
  useBlockUser,
  useUnblockUser,
  useUpdateUserDates,
  useUpdateUserPlan,
  useUpdateUserStatus,
} from "@/hooks/useUserMutations";
import type { User, UserStatus } from "@/types/user";

const PER_PAGE = 20;

const statusColor: Record<string, string> = {
  active: "bg-accent text-accent-foreground",
  inactive: "bg-secondary text-muted-foreground",
  blocked: "bg-destructive/10 text-destructive",
  expired: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
};

function formatDt(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm");
  } catch {
    return value;
  }
}

function formatDateOnly(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "yyyy-MM-dd");
  } catch {
    return value.slice(0, 10);
  }
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function fromDatetimeLocalValue(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return d.toISOString();
}

export default function UsersPage() {
  const { user: authUser } = useAuth();
  const canMutateSubscription = canEditSubscriptions(authUser?.role);
  const canMutatePlan = canEditPlans(authUser?.role);


  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [sheetUser, setSheetUser] = useState<string | null>(null);
  const { data: detailData, isLoading: detailLoading } = useUserDetail(sheetUser);

  const [planDialogUser, setPlanDialogUser] = useState<User | null>(null);
  const [planName, setPlanName] = useState("");
  const [planCredits, setPlanCredits] = useState("");
  const [planRecurring, setPlanRecurring] = useState<string>("true");

  const [statusDialogUser, setStatusDialogUser] = useState<User | null>(null);
  const [statusChoice, setStatusChoice] = useState<UserStatus>("active");

  const [datesDialogUser, setDatesDialogUser] = useState<User | null>(null);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");


  const [blockDialogUser, setBlockDialogUser] = useState<User | null>(null);
  const [blockAction, setBlockAction] = useState<"block" | "unblock">("block");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const listFilters = {
    search: debouncedSearch || undefined,
    status: (statusFilter === "all" ? "all" : statusFilter) as UserStatus | "all",
    plan: planFilter === "all" ? "all" : planFilter,
    page,
    per_page: PER_PAGE,
  };

  const { data, isLoading, error } = useUsers(listFilters);

  const updatePlan = useUpdateUserPlan();
  const updateStatus = useUpdateUserStatus();
  const updateDates = useUpdateUserDates();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const openPlanDialog = useCallback((u: User) => {
    setPlanDialogUser(u);
    setPlanName(u.plan_name ?? "");
    setPlanCredits(String(u.credits));
    setPlanRecurring(u.is_recurring ? "true" : "false");
  }, []);

  const openStatusDialog = useCallback((u: User) => {
    setStatusDialogUser(u);
    setStatusChoice(u.status);
  }, []);

  const openDatesDialog = useCallback((u: User) => {
    setDatesDialogUser(u);
    setStartLocal(toDatetimeLocalValue(u.subscription_start));
    setEndLocal(toDatetimeLocalValue(u.subscription_end));
  }, []);

  const onSubmitPlan = async () => {
    if (!planDialogUser || !planName.trim()) return;
    try {
      await updatePlan.mutateAsync({
        whatsappNumber: planDialogUser.whatsapp_number,
        body: {
          plan_name: planName.trim(),
          credits: planCredits === "" ? undefined : Number(planCredits),
          is_recurring: planRecurring === "true",
        },
      });
      toast.success("Plan updated");
      setPlanDialogUser(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onSubmitStatus = async () => {
    if (!statusDialogUser) return;
    try {
      await updateStatus.mutateAsync({
        whatsappNumber: statusDialogUser.whatsapp_number,
        body: { status: statusChoice },
      });
      toast.success("Status updated");
      setStatusDialogUser(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onSubmitDates = async () => {
    if (!datesDialogUser || !startLocal || !endLocal) return;
    try {
      await updateDates.mutateAsync({
        whatsappNumber: datesDialogUser.whatsapp_number,
        body: {
          subscription_start: fromDatetimeLocalValue(startLocal),
          subscription_end: fromDatetimeLocalValue(endLocal),
        },
      });
      toast.success("Dates updated");
      setDatesDialogUser(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const confirmBlockAction = async () => {
    if (!blockDialogUser) return;
    try {
      if (blockAction === "block") {
        await blockUser.mutateAsync(blockDialogUser.whatsapp_number);
        toast.success("User blocked");
      } else {
        await unblockUser.mutateAsync(blockDialogUser.whatsapp_number);
        toast.success("User unblocked");
      }
      setBlockDialogUser(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const total = data?.total ?? 0;
  const pages = Math.max(1, data?.pages ?? 1);
  const users = data?.users ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-heading text-3xl font-semibold text-foreground tracking-tight">
            User Management
          </h1>
          <span className="text-sm text-muted-foreground">{total} users</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search phone or plan..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={planFilter}
            onValueChange={(v) => {
              setPlanFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="Trial">Trial</SelectItem>
              <SelectItem value="Subscription Start">Subscription Start (75)</SelectItem>
              <SelectItem value="Subscription Active">Subscription Active (150)</SelectItem>
              <SelectItem value="Subscription Pro">Subscription Pro (300)</SelectItem>
              <SelectItem value="50 credits">50 credits</SelectItem>
              <SelectItem value="100 credits">100 credits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            Could not load users. {error.message}
            {error.message.includes("404") && (
              <span className="block mt-1 text-muted-foreground">
                Deploy the B1 users API on the chatbot service (see{" "}
                <code className="text-xs">integrations/b1-backend/</code> in this repo).
              </span>
            )}
          </p>
        )}

        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border text-left bg-muted/30">
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  WhatsApp
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Credits
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Msgs
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Start
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  End
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden xl:table-cell">
                  Trial
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-border">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-8" />
                    </td>
                  </tr>
                ))}
              {!isLoading &&
                users.map((u) => (
                  <tr
                    key={u.whatsapp_number}
                    className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {u.whatsapp_number}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={`${statusColor[u.status] ?? "bg-secondary"} capitalize text-xs font-semibold`}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium max-w-[180px] truncate">
                      {u.plan_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold">{u.credits}</td>
                    <td className="px-4 py-3 font-semibold">{u.message_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                      {formatDateOnly(u.subscription_start)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                      {formatDateOnly(u.subscription_end)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {u.is_trial ? (
                        <Badge variant="outline" className="text-xs">
                          Trial
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="View user"
                          onClick={() => setSheetUser(u.whatsapp_number)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setSheetUser(u.whatsapp_number)}>
                              View detail &amp; chat
                            </DropdownMenuItem>
                            {canMutatePlan && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openPlanDialog(u)}>Edit plan</DropdownMenuItem>
                              </>
                            )}
                            {canMutateSubscription && (
                              <>
                                <DropdownMenuItem onClick={() => openStatusDialog(u)}>Edit status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDatesDialog(u)}>Edit subscription dates</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setBlockAction(u.status === "blocked" ? "unblock" : "block");
                                    setBlockDialogUser(u);
                                  }}
                                >
                                  {u.status === "blocked" ? "Unblock user" : "Block user"}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
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
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(pages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Detail sheet */}
        <Sheet open={Boolean(sheetUser)} onOpenChange={(o) => !o && setSheetUser(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>User detail</SheetTitle>
              <SheetDescription>{sheetUser}</SheetDescription>
            </SheetHeader>
            {detailLoading && (
              <div className="mt-6 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}
            {!detailLoading && detailData && (
              <div className="mt-6 space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium capitalize">{detailData.user.status}</div>
                  <div className="text-muted-foreground">Plan</div>
                  <div className="font-medium">{detailData.user.plan_name ?? "—"}</div>
                  <div className="text-muted-foreground">Credits</div>
                  <div className="font-medium">{detailData.user.credits}</div>
                  <div className="text-muted-foreground">Messages</div>
                  <div className="font-medium">{detailData.user.message_count}</div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recent chat</h4>
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {detailData.recent_chats.length === 0 && (
                      <p className="text-muted-foreground">No messages yet.</p>
                    )}
                    {detailData.recent_chats.map((log) => (
                      <div key={log.id} className="rounded-lg border border-border p-3 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {formatDt(log.created_at)} · {log.response_type ?? "—"}
                        </div>
                        <p className="text-xs font-medium text-foreground">User: {log.user_message}</p>
                        <p className="text-xs text-muted-foreground line-clamp-4">{log.bot_response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Plan dialog */}
        <Dialog open={Boolean(planDialogUser)} onOpenChange={(o) => !o && setPlanDialogUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Plan name</Label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Subscription Pro" />
              </div>
              <div className="space-y-2">
                <Label>Credits (optional)</Label>
                <Input
                  type="number"
                  value={planCredits}
                  onChange={(e) => setPlanCredits(e.target.value)}
                  placeholder="Leave blank to skip"
                />
              </div>
              <div className="space-y-2">
                <Label>Billing</Label>
                <Select value={planRecurring} onValueChange={setPlanRecurring}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Recurring subscription</SelectItem>
                    <SelectItem value="false">Prepaid / one-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialogUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => void onSubmitPlan()} disabled={updatePlan.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status dialog */}
        <Dialog open={Boolean(statusDialogUser)} onOpenChange={(o) => !o && setStatusDialogUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit status</DialogTitle>
            </DialogHeader>
            <Select value={statusChoice} onValueChange={(v) => setStatusChoice(v as UserStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => void onSubmitStatus()} disabled={updateStatus.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dates dialog */}
        <Dialog open={Boolean(datesDialogUser)} onOpenChange={(o) => !o && setDatesDialogUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subscription dates</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDatesDialogUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => void onSubmitDates()} disabled={updateDates.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block / unblock */}
        <AlertDialog open={Boolean(blockDialogUser)} onOpenChange={(o) => !o && setBlockDialogUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blockAction === "block" ? "Block this user?" : "Unblock this user?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {blockDialogUser?.whatsapp_number} — this updates subscription status in the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmBlockAction()}>
                {blockAction === "block" ? "Block" : "Unblock"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
