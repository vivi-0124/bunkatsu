"use client";

import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconCheck,
  IconDots,
  IconDownload,
  IconEdit,
  IconFileTypeCsv,
  IconFilter,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface FixedCostRaw {
  id: string;
  userId: string;
  name: string;
  totalPayments: number | null;
  startDate: string; // YYYY-MM形式
  amountPerPayment: number;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface FixedCostApiResponse {
  id: string;
  userId: string;
  name: string;
  totalPayments: number | string | null;
  startDate: string;
  amountPerPayment: number | string;
  totalAmount: number | string | null;
  createdAt: string;
  updatedAt: string;
}

function normalizeFixedCost(item: FixedCostApiResponse): FixedCostRaw {
  return {
    ...item,
    totalPayments:
      item.totalPayments !== null ? Number(item.totalPayments) : null,
    amountPerPayment: Number(item.amountPerPayment),
    totalAmount: item.totalAmount !== null ? Number(item.totalAmount) : null,
  };
}

interface FixedCostWithCalculated extends FixedCostRaw {
  currentPayment: number | null;
  isCompleted: boolean;
  isStarted: boolean;
  endDate: string | null; // 完済予定月 (YYYY-MM形式)
}

function calculateCurrentPayment(
  startDate: string,
  totalPayments: number | null,
): number | null {
  if (totalPayments === null) return null;

  const [year, month] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthsDiff =
    (currentMonth.getFullYear() - start.getFullYear()) * 12 +
    (currentMonth.getMonth() - start.getMonth()) +
    1;

  if (monthsDiff < 1) return 0;
  return Math.min(monthsDiff, totalPayments);
}

function calculateEndDate(
  startDate: string,
  totalPayments: number | null,
): string | null {
  if (totalPayments === null) return null;
  const [year, month] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  start.setMonth(start.getMonth() + totalPayments - 1);
  const endYear = start.getFullYear();
  const endMonth = String(start.getMonth() + 1).padStart(2, "0");
  return `${endYear}-${endMonth}`;
}

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function FixedCostsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [fixedCostsRaw, setFixedCostsRaw] = useState<FixedCostRaw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [sortKey, setSortKey] = useState<
    | "name"
    | "status"
    | "progress"
    | "amountPerPayment"
    | "totalAmount"
    | "remaining"
    | "startDate"
    | "endDate"
  >("startDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "not_started" | "in_progress" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputMobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          searchInputRef.current?.focus();
        } else {
          searchInputMobileRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    totalPayments: "",
    startDate: getCurrentMonthString(),
    amountPerPayment: "",
    totalAmount: "",
  });

  const fixedCostsCalculated: FixedCostWithCalculated[] = fixedCostsRaw.map(
    (item) => {
      const currentPayment = calculateCurrentPayment(
        item.startDate,
        item.totalPayments,
      );
      const endDate = calculateEndDate(item.startDate, item.totalPayments);
      const currentMonth = getCurrentMonthString();
      return {
        ...item,
        currentPayment,
        isCompleted:
          item.totalPayments !== null &&
          currentPayment !== null &&
          currentPayment >= item.totalPayments,
        isStarted: item.startDate <= currentMonth,
        endDate,
      };
    },
  );

  const fixedCosts = useMemo(() => {
    let filtered = [...fixedCostsCalculated];
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "completed") return item.isCompleted;
        if (statusFilter === "not_started") return !item.isStarted && !item.isCompleted;
        if (statusFilter === "in_progress") return item.isStarted && !item.isCompleted;
        return true;
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query),
      );
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "name":
          comparison = a.name.localeCompare(b.name, "ja");
          break;
        case "status": {
          const statusA = a.isCompleted ? 1 : 0;
          const statusB = b.isCompleted ? 1 : 0;
          comparison = statusA - statusB;
          break;
        }
        case "progress": {
          const progressA = a.totalPayments
            ? (a.currentPayment || 0) / a.totalPayments
            : 0;
          const progressB = b.totalPayments
            ? (b.currentPayment || 0) / b.totalPayments
            : 0;
          comparison = progressA - progressB;
          break;
        }
        case "amountPerPayment":
          comparison = a.amountPerPayment - b.amountPerPayment;
          break;
        case "totalAmount":
          comparison = (a.totalAmount ?? 0) - (b.totalAmount ?? 0);
          break;
        case "remaining": {
          const remainingA = a.isCompleted
            ? 0
            : a.amountPerPayment *
              (a.totalPayments ? a.totalPayments - (a.currentPayment || 0) : 1);
          const remainingB = b.isCompleted
            ? 0
            : b.amountPerPayment *
              (b.totalPayments ? b.totalPayments - (b.currentPayment || 0) : 1);
          comparison = remainingA - remainingB;
          break;
        }
        case "startDate":
          comparison = a.startDate.localeCompare(b.startDate);
          break;
        case "endDate":
          comparison = (a.endDate || "").localeCompare(b.endDate || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [
    fixedCostsCalculated,
    statusFilter,
    searchQuery,
    sortKey,
    sortDirection,
  ]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortLabel = useMemo(() => {
    const dir = sortDirection === "asc" ? "昇順" : "降順";
    switch (sortKey) {
      case "startDate":
        return `開始日（${sortDirection === "asc" ? "古い順" : "新しい順"}）`;
      case "endDate":
        return `完済予定（${sortDirection === "asc" ? "古い順" : "新しい順"}）`;
      case "name":
        return `名前（${dir}）`;
      case "amountPerPayment":
        return `金額（${sortDirection === "asc" ? "安い順" : "高い順"}）`;
      case "totalAmount":
        return `総額（${sortDirection === "asc" ? "安い順" : "高い順"}）`;
      case "remaining":
        return `残り（${sortDirection === "asc" ? "少ない順" : "多い順"}）`;
      case "progress":
        return `進捗（${sortDirection === "asc" ? "低い順" : "高い順"}）`;
      case "status":
        return `ステータス（${dir}）`;
      default:
        return "並び替え";
    }
  }, [sortKey, sortDirection]);

  const SortIcon = ({ column }: { column: typeof sortKey }) => {
    if (sortKey !== column)
      return <IconArrowsSort className="h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? (
      <IconArrowUp className="h-3 w-3" />
    ) : (
      <IconArrowDown className="h-3 w-3" />
    );
  };

  const activeFixedCosts = fixedCostsCalculated.filter(
    (item) => !item.isCompleted && item.isStarted,
  );

  const fetchFixedCosts = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(
        `/api/dashboard/fixed-costs?userId=${session.user.id}`,
      );
      const data: FixedCostApiResponse[] = await res.json();
      setFixedCostsRaw(data.map(normalizeFixedCost));
    } catch (error) {
      console.error("Failed to fetch fixed costs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/");
      return;
    }
    fetchFixedCosts();
  }, [session, isPending, router, fetchFixedCosts]);

  const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;
  const MAX_PAYMENTS = 999;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    const name = formData.name.trim();
    const totalPayments = formData.totalPayments
      ? Number(formData.totalPayments)
      : null;
    const amountPerPayment = Number(formData.amountPerPayment);
    const totalAmount = formData.totalAmount
      ? Number(formData.totalAmount)
      : null;

    if (!name) {
      toast.error("項目名を入力してください");
      return;
    }
    if (name.length > 100) {
      toast.error("項目名は100文字以内で入力してください");
      return;
    }
    if (totalPayments !== null) {
      if (!Number.isInteger(totalPayments) || totalPayments < 1) {
        toast.error("支払い回数は1以上の整数で入力してください");
        return;
      }
      if (totalPayments > MAX_PAYMENTS) {
        toast.error(`支払い回数は${MAX_PAYMENTS}以下で入力してください`);
        return;
      }
    }
    if (!/^\d{4}-\d{2}$/.test(formData.startDate)) {
      toast.error("開始月の形式が正しくありません");
      return;
    }
    if (!Number.isInteger(amountPerPayment) || amountPerPayment < 0) {
      toast.error("金額は0以上の整数で入力してください");
      return;
    }
    if (amountPerPayment > MAX_AMOUNT) {
      toast.error("金額の値が大きすぎます");
      return;
    }

    const payload = {
      userId: session.user.id,
      name,
      totalPayments,
      startDate: formData.startDate,
      amountPerPayment,
      totalAmount,
    };

    try {
      const url = editingId
        ? `/api/dashboard/fixed-costs/${editingId}`
        : "/api/dashboard/fixed-costs";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.error || "保存に失敗しました。");
        return;
      }
      toast.success(editingId ? "更新しました" : "追加しました");
      resetForm();
      fetchFixedCosts();
    } catch (error) {
      console.error("Failed to save fixed cost:", error);
      toast.error("通信エラーが発生しました");
    }
  };

  const handleEdit = (item: FixedCostWithCalculated) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      totalPayments: item.totalPayments ? String(item.totalPayments) : "",
      startDate: item.startDate,
      amountPerPayment: String(item.amountPerPayment),
      totalAmount: item.totalAmount ? String(item.totalAmount) : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const deletePromise = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await fetch(`/api/dashboard/fixed-costs/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    };
    toast.promise(deletePromise(), {
      loading: "削除中...",
      success: () => {
        setIsDeleteDialogOpen(false);
        setDeleteTargetId(null);
        fetchFixedCosts();
        return "削除しました";
      },
      error: "削除に失敗しました",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      totalPayments: "",
      startDate: getCurrentMonthString(),
      amountPerPayment: "",
      totalAmount: "",
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleExport = async () => {
    if (!session?.user?.id) return;
    window.location.href = `/api/dashboard/fixed-costs/export?userId=${session.user.id}`;
  };

  const handleTemplateDownload = () => {
    window.location.href = "/api/dashboard/fixed-costs/template";
  };

  const handleImport = async () => {
    if (!session?.user?.id || !importFile) return;
    setIsImporting(true);
    try {
      const text = await importFile.text();
      const res = await fetch("/api/dashboard/fixed-costs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, csvData: text }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("インポートが完了しました");
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchFixedCosts();
      } else {
        toast.error(result.error || "インポートエラー");
      }
    } catch (error) {
      console.error("Failed to import:", error);
      toast.error("インポートに失敗しました");
    } finally {
      setIsImporting(false);
    }
  };

  const monthlySummary = activeFixedCosts.reduce(
    (sum, item) => sum + item.amountPerPayment,
    0,
  );

  const remainingCosts = fixedCostsCalculated.filter(
    (item) => !item.isCompleted,
  );

  const totalRemaining = remainingCosts.reduce((sum, item) => {
    if (item.totalPayments === null) return sum;
    return (
      sum +
      item.amountPerPayment * (item.totalPayments - (item.currentPayment || 0))
    );
  }, 0);

  const finalEndDate = useMemo(() => {
    const endDates: string[] = [];
    for (const c of remainingCosts) {
      if (c.endDate) endDates.push(c.endDate);
    }
    if (endDates.length === 0) return null;
    return endDates.reduce((latest, current) =>
      current > latest ? current : latest,
    );
  }, [remainingCosts]);

  const notStartedCosts = fixedCostsCalculated.filter(
    (item) => !item.isCompleted && !item.isStarted,
  );

  const nextChangeDate = useMemo(() => {
    const changeDates: string[] = [];

    // 開始済みアイテムの終了日（金額が減るタイミング）
    for (const c of activeFixedCosts) {
      if (c.endDate) changeDates.push(c.endDate);
    }

    // 開始前アイテムの開始日（金額が増えるタイミング）
    for (const c of notStartedCosts) {
      changeDates.push(c.startDate);
    }

    if (changeDates.length === 0) return null;
    return changeDates.reduce((earliest, current) =>
      current < earliest ? current : earliest,
    );
  }, [activeFixedCosts, notStartedCosts]);

  if (isPending || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>分割払い管理</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="container mx-auto px-2 py-2 max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-stretch gap-4 md:gap-8 px-1">
              <div className="relative flex flex-col p-4 rounded-xl bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/10">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  毎月の支払い総額
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  ¥{monthlySummary.toLocaleString()}
                </p>
                {nextChangeDate && (
                  <p className="text-[10px] md:text-xs text-indigo-400 font-medium mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    {format(
                      new Date(
                        Number(nextChangeDate.split("-")[0]),
                        Number(nextChangeDate.split("-")[1]) - 1,
                        1,
                      ),
                      "yyyy年MM月",
                    )}
                    まで
                  </p>
                )}
              </div>
              <div className="relative flex flex-col p-4 rounded-xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/10">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  残りの支払い総額
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  ¥{totalRemaining.toLocaleString()}
                </p>
                {finalEndDate && (
                  <p className="text-[10px] md:text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {format(
                      new Date(
                        Number(finalEndDate.split("-")[0]),
                        Number(finalEndDate.split("-")[1]) - 1,
                        1,
                      ),
                      "yyyy年MM月",
                    )}
                    まで
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="hidden md:flex gap-2">
                <Button variant="outline" onClick={handleTemplateDownload}>
                  <IconFileTypeCsv className="h-4 w-4 mr-2" />
                  テンプレート
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <IconDownload className="h-4 w-4 mr-2" />
                  エクスポート
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  <IconUpload className="h-4 w-4 mr-2" />
                  インポート
                </Button>
              </div>
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <IconDots className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleTemplateDownload}>
                      <IconFileTypeCsv className="h-4 w-4 mr-2" />
                      テンプレート
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport}>
                      <IconDownload className="h-4 w-4 mr-2" />
                      エクスポート
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsImportDialogOpen(true)}
                    >
                      <IconUpload className="h-4 w-4 mr-2" />
                      インポート
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    onClick={() => resetForm()}
                  >
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "分割払いを編集" : "新しい分割払いを追加"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">項目名</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="例: 家賃、Netflix、MacBook Pro"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-[3fr_7fr] gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalPayments">支払い回数</Label>
                        <Input
                          id="totalPayments"
                          type="text"
                          inputMode="numeric"
                          value={formData.totalPayments}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            const payments = Number(val);
                            const amount = formData.amountPerPayment
                              ? Number(formData.amountPerPayment)
                              : null;
                            const total = formData.totalAmount
                              ? Number(formData.totalAmount)
                              : null;

                            setFormData((prev) => ({
                              ...prev,
                              totalPayments: val,
                              amountPerPayment:
                                total && payments
                                  ? String(Math.round(total / payments))
                                  : prev.amountPerPayment,
                              totalAmount:
                                amount && payments && !total
                                  ? String(amount * payments)
                                  : prev.totalAmount,
                            }));
                          }}
                          placeholder="空欄で無期限"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>開始月</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.startDate.split("-")[0]}
                            onValueChange={(val) =>
                              setFormData({
                                ...formData,
                                startDate: `${val}-${formData.startDate.split("-")[1]}`,
                              })
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="年" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 11 }, (_, i) => {
                                const year = new Date().getFullYear() - 5 + i;
                                return (
                                  <SelectItem key={year} value={String(year)}>
                                    {year}年
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Select
                            value={formData.startDate.split("-")[1]}
                            onValueChange={(val) =>
                              setFormData({
                                ...formData,
                                startDate: `${formData.startDate.split("-")[0]}-${val}`,
                              })
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="月" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => {
                                const month = String(i + 1).padStart(2, "0");
                                return (
                                  <SelectItem key={month} value={month}>
                                    {i + 1}月
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amountPerPayment">金額</Label>
                        <Input
                          id="amountPerPayment"
                          type="text"
                          inputMode="numeric"
                          value={
                            formData.amountPerPayment
                              ? Number(
                                  formData.amountPerPayment,
                                ).toLocaleString()
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            const amount = Number(val);
                            const payments = formData.totalPayments
                              ? Number(formData.totalPayments)
                              : null;
                            const total = formData.totalAmount
                              ? Number(formData.totalAmount)
                              : null;

                            setFormData((prev) => ({
                              ...prev,
                              amountPerPayment: val,
                              totalPayments:
                                total && amount && !payments
                                  ? String(Math.round(total / amount))
                                  : prev.totalPayments,
                              totalAmount:
                                payments && amount
                                  ? String(payments * amount)
                                  : prev.totalAmount,
                            }));
                          }}
                          placeholder="例: 1,000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalAmount">支払い総額</Label>
                        <Input
                          id="totalAmount"
                          type="text"
                          inputMode="numeric"
                          value={
                            formData.totalAmount
                              ? Number(formData.totalAmount).toLocaleString()
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            const total = Number(val);
                            const payments = formData.totalPayments
                              ? Number(formData.totalPayments)
                              : null;
                            const amount = formData.amountPerPayment
                              ? Number(formData.amountPerPayment)
                              : null;

                            setFormData((prev) => ({
                              ...prev,
                              totalAmount: val,
                              totalPayments:
                                amount && total && !payments
                                  ? String(Math.round(total / amount))
                                  : prev.totalPayments,
                              amountPerPayment:
                                payments && total
                                  ? String(Math.round(total / payments))
                                  : prev.amountPerPayment,
                            }));
                          }}
                          placeholder="空欄でも可"
                        />
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="submit"
                        className="bg-linear-to-r from-indigo-500 to-purple-600"
                      >
                        {editingId ? "更新" : "追加"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>削除の確認</DialogTitle>
                <DialogDescription>
                  本当にこの固定費を削除してもよろしいですか？
                  <br />
                  この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={executeDelete}>
                  削除する
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <InputGroup className="flex-1 min-w-[200px] h-10 md:h-9">
              <InputGroupAddon>
                <IconSearch className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInputRef}
                placeholder="項目名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="items-center gap-1.5 px-2 text-[10px] text-muted-foreground border-l ml-auto hidden md:flex">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </div>
            </InputGroup>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-9 gap-2"
                  >
                    <IconFilter className="h-4 w-4" />
                    <span>
                      {
                        {
                          all: "すべて",
                          not_started: "開始前",
                          in_progress: "支払い中",
                          completed: "完済",
                        }[statusFilter]
                      }
                    </span>
                    <IconArrowDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    <IconCheck
                      className={cn(
                        "h-4 w-4 mr-2",
                        statusFilter === "all" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    すべて
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("not_started")}>
                    <IconCheck
                      className={cn(
                        "h-4 w-4 mr-2",
                        statusFilter === "not_started" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    開始前
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
                    <IconCheck
                      className={cn(
                        "h-4 w-4 mr-2",
                        statusFilter === "in_progress" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    支払い中
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                    <IconCheck
                      className={cn(
                        "h-4 w-4 mr-2",
                        statusFilter === "completed" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    完済
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-9 gap-2 flex-1 md:flex-none"
                  >
                    <IconArrowsSort className="h-4 w-4" />
                    <span>{sortLabel}</span>
                    <IconArrowDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSort("startDate")}>
                    開始日
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("name")}>
                    名前
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSort("amountPerPayment")}
                  >
                    金額
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("progress")}>
                    進捗
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4 px-1 text-right">
            {fixedCosts.length}件表示
          </p>

          {/* Mobile Card List */}
          <div className="grid gap-4 md:hidden">
            {fixedCosts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                データがありません。
              </p>
            ) : (
              fixedCosts.map((item) => {
                const progress = item.totalPayments
                  ? ((item.currentPayment || 0) / item.totalPayments) * 100
                  : 0;
                const remainingAmount = item.totalPayments
                  ? item.amountPerPayment *
                    (item.totalPayments - (item.currentPayment || 0))
                  : null;

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "overflow-hidden border-none bg-muted/30 shadow-none cursor-pointer",
                      item.isCompleted && "opacity-60",
                    )}
                    onClick={() => handleEdit(item)}
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-base leading-tight">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground dark:text-muted-foreground/60 font-mono">
                            #{item.id.split("-")[0]}
                          </p>
                        </div>
                        {/* biome-ignore lint/a11y/useKeyWithClickEvents: prevent card click */}
                        {/* biome-ignore lint/a11y/noStaticElementInteractions: prevent card click */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border-none px-2 h-6 text-[10px]",
                              item.isCompleted
                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                : !item.isStarted
                                  ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                  : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
                            )}
                          >
                            {item.isCompleted
                              ? "完済"
                              : !item.isStarted
                                ? "開始前"
                                : "支払い中"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleEdit(item)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500/80 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDelete(item.id)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">
                            {item.totalPayments
                              ? `${item.currentPayment} / ${item.totalPayments} 回`
                              : "無期限"}
                          </span>
                          <span className="text-muted-foreground">
                            {item.startDate} → {item.endDate || "∞"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                            style={{
                              width: `${item.totalPayments ? progress : 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                            月額
                          </p>
                          <p className="font-bold font-mono">
                            ¥{item.amountPerPayment.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                            残り
                          </p>
                          <p className="font-bold text-indigo-500 font-mono">
                            {remainingAmount !== null
                              ? `¥${remainingAmount.toLocaleString()}`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="rounded-xl border border-border/50 hidden md:block overflow-hidden bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/30">
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <span className="inline-flex items-center gap-1">
                      項目名 <SortIcon column="name" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <span className="inline-flex items-center gap-1">
                      ステータス <SortIcon column="status" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("progress")}
                  >
                    <span className="inline-flex items-center gap-1">
                      進捗 <SortIcon column="progress" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("amountPerPayment")}
                  >
                    <span className="inline-flex items-center gap-1">
                      月額 <SortIcon column="amountPerPayment" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("totalAmount")}
                  >
                    <span className="inline-flex items-center gap-1">
                      総額 <SortIcon column="totalAmount" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("remaining")}
                  >
                    <span className="inline-flex items-center gap-1">
                      残り <SortIcon column="remaining" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("startDate")}
                  >
                    <span className="inline-flex items-center gap-1">
                      開始 <SortIcon column="startDate" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("endDate")}
                  >
                    <span className="inline-flex items-center gap-1">
                      完済予定 <SortIcon column="endDate" />
                    </span>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedCosts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      固定費がありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  fixedCosts.map((item) => {
                    const progress = item.totalPayments
                      ? ((item.currentPayment || 0) / item.totalPayments) * 100
                      : 0;
                    const remainingAmount = item.totalPayments
                      ? item.amountPerPayment *
                        (item.totalPayments - (item.currentPayment || 0))
                      : null;
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "transition-colors duration-200 hover:bg-muted/40 cursor-pointer group",
                          item.isCompleted && "opacity-50",
                        )}
                        onClick={() => handleEdit(item)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground/50 font-mono">
                              #{item.id.substring(0, 8)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.isCompleted ? (
                            <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-none gap-1 font-medium">
                              <IconCheck className="h-3 w-3" />
                              完了
                            </Badge>
                          ) : !item.isStarted ? (
                            <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-none font-medium">
                              開始前
                            </Badge>
                          ) : (
                            <Badge className="bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border-none font-medium">
                              支払い中
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.totalPayments ? (
                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                              <span className="text-xs font-medium text-muted-foreground">
                                {item.currentPayment} / {item.totalPayments} 回
                              </span>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-700 ease-out",
                                    item.isCompleted
                                      ? "bg-linear-to-r from-emerald-400 to-emerald-500"
                                      : progress > 60
                                        ? "bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400"
                                        : "bg-linear-to-r from-indigo-500 to-purple-500",
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          ¥{item.amountPerPayment.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {item.totalAmount
                            ? `¥${item.totalAmount.toLocaleString()}`
                            : item.totalPayments
                              ? `¥${(item.amountPerPayment * item.totalPayments).toLocaleString()}`
                              : "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "font-mono font-semibold",
                              item.isCompleted
                                ? "text-muted-foreground"
                                : "text-emerald-500",
                            )}
                          >
                            {remainingAmount !== null
                              ? `¥${remainingAmount.toLocaleString()}`
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.startDate}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.endDate || "—"}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors"
                              onClick={() => handleEdit(item)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              onClick={() => handleDelete(item.id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>データのインポート</DialogTitle>
            <DialogDescription>
              CSVファイルをアップロードして固定費をインポートします。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSVファイル</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
            >
              {isImporting ? "インポート中..." : "インポート実行"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
