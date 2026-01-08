"use client";

import {
  IconCheck,
  IconCreditCard,
  IconDots,
  IconDownload,
  IconEdit,
  IconFileTypeCsv,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

interface InstallmentRaw {
  id: string;
  userId: string;
  name: string;
  totalPayments: number;
  startDate: string; // YYYY-MM形式
  amountPerPayment: number;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface InstallmentWithCalculated extends InstallmentRaw {
  currentPayment: number;
  isCompleted: boolean;
}

// 現在の月から支払い回数を計算
function calculateCurrentPayment(
  startDate: string,
  totalPayments: number,
): number {
  const [year, month] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthsDiff =
    (currentMonth.getFullYear() - start.getFullYear()) * 12 +
    (currentMonth.getMonth() - start.getMonth()) +
    1;

  return Math.min(Math.max(monthsDiff, 1), totalPayments);
}

// 現在の月をYYYY-MM形式で取得
function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function InstallmentsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [installmentsRaw, setInstallmentsRaw] = useState<InstallmentRaw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    totalPayments: "",
    startDate: getCurrentMonthString(),
    amountPerPayment: "",
    totalAmount: "",
  });

  // 計算済みのインストールメント
  const installments: InstallmentWithCalculated[] = installmentsRaw.map(
    (item) => {
      const currentPayment = calculateCurrentPayment(
        item.startDate,
        item.totalPayments,
      );
      return {
        ...item,
        currentPayment,
        isCompleted: currentPayment >= item.totalPayments,
      };
    },
  );

  // 支払いが完了していないものだけでサマリー計算
  const activeInstallments = installments.filter((item) => !item.isCompleted);

  const fetchInstallments = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/installments?userId=${session.user.id}`);
      const data = await res.json();
      setInstallmentsRaw(data);
    } catch (error) {
      console.error("Failed to fetch installments:", error);
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
    fetchInstallments();
  }, [session, isPending, router, fetchInstallments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    const payload = {
      userId: session.user.id,
      name: formData.name,
      totalPayments: Number(formData.totalPayments),
      startDate: formData.startDate,
      amountPerPayment: Number(formData.amountPerPayment),
      totalAmount: formData.totalAmount ? Number(formData.totalAmount) : null,
    };

    try {
      if (editingId) {
        await fetch(`/api/installments/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/installments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchInstallments();
    } catch (error) {
      console.error("Failed to save installment:", error);
    }
  };

  const handleEdit = (item: InstallmentWithCalculated) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      totalPayments: String(item.totalPayments),
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

    // Create a promise for the delete operation
    const deletePromise = async () => {
      // 処理が速すぎて通知が一瞬で消えるように見えるため、意図的に少し待機時間を設ける（UX向上のため）
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await fetch(`/api/installments/${deleteTargetId}`, {
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
        fetchInstallments();
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

  // CSV Export handler
  const handleExport = async () => {
    if (!session?.user?.id) return;
    window.location.href = `/api/installments/export?userId=${session.user.id}`;
  };

  // CSV Template download handler
  const handleTemplateDownload = () => {
    window.location.href = "/api/installments/template";
  };

  // CSV Import handler
  const handleImport = async () => {
    if (!session?.user?.id || !importFile) return;

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const res = await fetch("/api/installments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          csvData: text,
        }),
      });
      const result = await res.json();
      if (result.success) {
        const messages = [];
        if (result.inserted > 0) messages.push(`${result.inserted}件追加`);
        if (result.updated > 0) messages.push(`${result.updated}件更新`);

        toast.success("インポートが完了しました", {
          description: messages.join("、") || "変更はありませんでした",
        });

        if (result.errors && result.errors.length > 0) {
          toast.warning("一部の行でエラーが発生しました", {
            description: `${result.errors.length}件のエラーがあります。詳細はコンソールを確認してください。`,
          });
          console.warn("Import errors:", result.errors);
        }

        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchInstallments();
      } else {
        toast.error("インポートエラー", {
          description: result.error || "予期せぬエラーが発生しました",
        });
      }
    } catch (error) {
      console.error("Failed to import:", error);
      toast.error("インポートに失敗しました", {
        description: "通信エラーが発生しました",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate monthly summary (only active installments)
  const monthlySummary = activeInstallments.reduce(
    (sum, item) => sum + item.amountPerPayment,
    0,
  );

  // Calculate total remaining (only active installments)
  const totalRemaining = activeInstallments.reduce(
    (sum, item) =>
      sum +
      item.amountPerPayment * (item.totalPayments - item.currentPayment + 1),
    0,
  );

  if (isPending || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Monthly Summary Card */}
      {/* Header Actions & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 md:gap-8 px-1">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">
              毎月の支払い総額
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              ¥{monthlySummary.toLocaleString()}
            </p>
          </div>
          <div className="h-8 md:h-10 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">
              残りの支払い総額
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              ¥{totalRemaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Secondary Actions Dropdown */}
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
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <IconUpload className="h-4 w-4 mr-2" />
                インポート
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import Dialog (Controlled by state) */}
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CSVインポート</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSVファイル</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  テンプレートをダウンロードして、フォーマットを確認してください。
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      setImportFile(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || isImporting}
                    className="bg-linear-to-r from-indigo-500 to-purple-600"
                  >
                    {isImporting ? "インポート中..." : "インポート"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Entry Button */}
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
                    placeholder="例: MacBook Pro"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalPayments">分割回数</Label>
                    <Input
                      id="totalPayments"
                      type="number"
                      value={formData.totalPayments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalPayments: e.target.value,
                        })
                      }
                      placeholder="例: 12"
                      required
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
                        <SelectTrigger>
                          <SelectValue placeholder="年" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 41 }, (_, i) => {
                            const year = new Date().getFullYear() - 30 + i;
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
                        <SelectTrigger>
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
                    <Label htmlFor="amountPerPayment">月額</Label>
                    <Input
                      id="amountPerPayment"
                      type="number"
                      value={formData.amountPerPayment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amountPerPayment: e.target.value,
                        })
                      }
                      placeholder="例: 10000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">総額</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalAmount: e.target.value,
                        })
                      }
                      placeholder="例: 120000（任意）"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>削除の確認</DialogTitle>
            <DialogDescription>
              本当にこの分割払いを削除してもよろしいですか？
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">項目名</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>進捗</TableHead>
              <TableHead>月額</TableHead>
              <TableHead>総額</TableHead>
              <TableHead>残り</TableHead>
              <TableHead>開始</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <IconCreditCard className="h-8 w-8 mb-2 opacity-50" />
                    <p>分割払いがありません。</p>
                    <p className="text-xs">
                      「新規追加」から登録してください。
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              installments.map((item) => (
                <TableRow
                  key={item.id}
                  className={item.isCompleted ? "opacity-60 bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">
                    <div>
                      {item.name}
                      <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                        #{item.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <IconCheck className="h-3 w-3" />
                        完済
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="w-[120px]">
                      <div className="text-xs mb-1">
                        {item.currentPayment} / {item.totalPayments} 回
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.isCompleted
                              ? "bg-green-500"
                              : "bg-linear-to-r from-indigo-500 to-purple-600"
                          }`}
                          style={{
                            width: `${Math.min((item.currentPayment / item.totalPayments) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    ¥{item.amountPerPayment.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {item.totalAmount
                      ? `¥${item.totalAmount.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium text-indigo-600">
                    {item.isCompleted ? (
                      "¥0"
                    ) : (
                      <>
                        ¥
                        {(
                          item.amountPerPayment *
                          (item.totalPayments - item.currentPayment + 1)
                        ).toLocaleString()}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.startDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8"
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
