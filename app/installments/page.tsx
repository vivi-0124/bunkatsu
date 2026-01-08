"use client";

import {
  IconCheck,
  IconCreditCard,
  IconDownload,
  IconEdit,
  IconFileTypeCsv,
  IconLogout,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface InstallmentRaw {
  id: number;
  userId: string;
  name: string;
  totalPayments: number;
  startDate: string; // YYYY-MM形式
  amountPerPayment: number;
  totalAmount: number;
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      totalAmount: Number(formData.totalAmount),
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
      totalAmount: String(item.totalAmount),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("この分割払いを削除しますか？")) return;
    try {
      await fetch(`/api/installments/${id}`, { method: "DELETE" });
      fetchInstallments();
    } catch (error) {
      console.error("Failed to delete installment:", error);
    }
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

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace("/");
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
        alert(messages.join("、") || "処理が完了しました");
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchInstallments();
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to import:", error);
      alert("インポートに失敗しました");
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <IconCreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              分割払い管理
            </h1>
            <p className="text-sm text-muted-foreground">
              {session?.user?.name} さん
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <IconLogout className="h-5 w-5" />
        </Button>
      </div>

      {/* Monthly Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-linear-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              毎月の支払い総額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ¥{monthlySummary.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              残りの支払い総額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ¥{totalRemaining.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-6">
        {/* CSV Actions */}
        <Button variant="outline" size="sm" onClick={handleTemplateDownload}>
          <IconFileTypeCsv className="h-4 w-4 mr-2" />
          テンプレート
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="h-4 w-4 mr-2" />
          エクスポート
        </Button>
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <IconUpload className="h-4 w-4 mr-2" />
              インポート
            </Button>
          </DialogTrigger>
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
              className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              onClick={() => resetForm()}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              新規追加
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
                  <Label htmlFor="totalPayments">何回払い</Label>
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
                  <Label htmlFor="startDate">開始月</Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountPerPayment">毎回支払う額</Label>
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
                      setFormData({ ...formData, totalAmount: e.target.value })
                    }
                    placeholder="例: 120000"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="bg-linear-to-r from-indigo-500 to-purple-600"
                >
                  {editingId ? "更新" : "追加"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Installments List */}
      <div className="space-y-4">
        {installments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <IconCreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                分割払いがありません。
                <br />
                「新規追加」から登録してください。
              </p>
            </CardContent>
          </Card>
        ) : (
          installments.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden hover:shadow-lg transition-shadow ${
                item.isCompleted ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      {item.isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <IconCheck className="h-3 w-3" />
                          完済
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">進捗</span>
                        <p className="font-medium">
                          {item.currentPayment} / {item.totalPayments} 回
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">毎回</span>
                        <p className="font-medium">
                          ¥{item.amountPerPayment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">総額</span>
                        <p className="font-medium">
                          ¥{item.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">残り</span>
                        <p className="font-medium text-indigo-600">
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
                        </p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.isCompleted
                              ? "bg-green-500"
                              : "bg-linear-to-r from-indigo-500 to-purple-600"
                          }`}
                          style={{
                            width: `${(item.currentPayment / item.totalPayments) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      開始: {item.startDate}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
