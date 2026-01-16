"use client";

import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconFileTypeCsv,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { addMonths, format, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddRecordDialog } from "@/components/monthly/add-record-dialog";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type {
  MonthlyIncome,
  MonthlyPayment,
} from "@/db/schemas/monthly-record";
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";

type PaymentSortKey = "paymentDate" | "name" | "amount" | "isPaid";
type IncomeSortKey = "date" | "name" | "amount";

export default function MonthlyPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<{
    payments: MonthlyPayment[];
    incomes: MonthlyIncome[];
  }>({
    payments: [],
    incomes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { data: session } = authClient.useSession();

  // Sort state
  const [paymentSortKey, setPaymentSortKey] =
    useState<PaymentSortKey>("paymentDate");
  const [paymentSortDir, setPaymentSortDir] = useState<"asc" | "desc">("asc");
  const [incomeSortKey, setIncomeSortKey] = useState<IncomeSortKey>("date");
  const [incomeSortDir, setIncomeSortDir] = useState<"asc" | "desc">("asc");

  // Edit state
  const [editingPayment, setEditingPayment] = useState<MonthlyPayment | null>(
    null,
  );
  const [editingIncome, setEditingIncome] = useState<MonthlyIncome | null>(
    null,
  );
  const [editPaymentForm, setEditPaymentForm] = useState({
    name: "",
    amount: "",
    paymentDate: "",
    isPaid: false,
  });
  const [editIncomeForm, setEditIncomeForm] = useState({
    name: "",
    amount: "",
    date: "",
  });

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "payment" | "income";
    id: string;
    name: string;
  } | null>(null);

  const monthStr = format(currentDate, "yyyy-MM");

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.api["monthly-records"].$get({
        query: { month: monthStr },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(
          data as { payments: MonthlyPayment[]; incomes: MonthlyIncome[] },
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Sorted payments
  const sortedPayments = useMemo(() => {
    const sorted = [...records.payments];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (paymentSortKey) {
        case "paymentDate":
          comparison = (a.paymentDate ?? "").localeCompare(b.paymentDate ?? "");
          break;
        case "name":
          comparison = a.name.localeCompare(b.name, "ja");
          break;
        case "amount":
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case "isPaid":
          comparison = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
          break;
      }
      return paymentSortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [records.payments, paymentSortKey, paymentSortDir]);

  // Sorted incomes
  const sortedIncomes = useMemo(() => {
    const sorted = [...records.incomes];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (incomeSortKey) {
        case "date":
          comparison = (a.date ?? "").localeCompare(b.date ?? "");
          break;
        case "name":
          comparison = a.name.localeCompare(b.name, "ja");
          break;
        case "amount":
          comparison = Number(a.amount) - Number(b.amount);
          break;
      }
      return incomeSortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [records.incomes, incomeSortKey, incomeSortDir]);

  // Sort handlers
  const handlePaymentSort = (key: PaymentSortKey) => {
    if (paymentSortKey === key) {
      setPaymentSortDir(paymentSortDir === "asc" ? "desc" : "asc");
    } else {
      setPaymentSortKey(key);
      setPaymentSortDir("asc");
    }
  };

  const handleIncomeSort = (key: IncomeSortKey) => {
    if (incomeSortKey === key) {
      setIncomeSortDir(incomeSortDir === "asc" ? "desc" : "asc");
    } else {
      setIncomeSortKey(key);
      setIncomeSortDir("asc");
    }
  };

  // Sort icon component
  const SortIcon = ({
    column,
    currentKey,
    currentDir,
  }: {
    column: string;
    currentKey: string;
    currentDir: "asc" | "desc";
  }) => {
    if (currentKey !== column) {
      return <IconArrowsSort className="h-3 w-3 opacity-30" />;
    }
    return currentDir === "asc" ? (
      <IconArrowUp className="h-3 w-3" />
    ) : (
      <IconArrowDown className="h-3 w-3" />
    );
  };

  // CSV関連ハンドラ
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await client.api["monthly-records"].export.$get({
        query: { month: monthStr, userId: session.user.id },
      });
      if (res.ok) {
        const data = await res.json();
        downloadCSV(data.csv, `家計簿_${monthStr}.csv`);
        toast.success("エクスポートしました");
      } else {
        toast.error("エクスポートに失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await client.api["monthly-records"].template.$get();
      if (res.ok) {
        const data = await res.json();
        downloadCSV(data.csv, "家計簿テンプレート.csv");
        toast.success("テンプレートをダウンロードしました");
      } else {
        toast.error("ダウンロードに失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    }
  };

  const handleImport = async () => {
    if (!importFile || !session?.user?.id) return;
    setIsImporting(true);
    try {
      const csvText = await importFile.text();
      const res = await client.api["monthly-records"].import.$post({
        json: { csvText, month: monthStr, userId: session.user.id },
      });
      if (res.ok) {
        toast.success("インポートが完了しました");
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchRecords();
      } else {
        toast.error("インポートに失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await client.api["monthly-records"][":type"][":id"].$delete({
        param: { type: deleteTarget.type, id: deleteTarget.id },
      });
      if (res.ok) {
        toast.success("削除しました");
        fetchRecords();
      } else {
        toast.error("削除に失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Toggle isPaid
  const handleTogglePaid = async (id: string) => {
    try {
      const res = await fetch(
        `/api/monthly-records/payment/${id}/toggle-paid`,
        {
          method: "PATCH",
        },
      );
      if (res.ok) {
        fetchRecords();
      } else {
        toast.error("更新に失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    }
  };

  // Edit payment
  const openEditPayment = (payment: MonthlyPayment) => {
    setEditingPayment(payment);
    setEditPaymentForm({
      name: payment.name,
      amount: String(payment.amount),
      paymentDate: payment.paymentDate ?? "",
      isPaid: payment.isPaid,
    });
  };

  const handleEditPaymentSubmit = async () => {
    if (!editingPayment) return;
    try {
      const res = await fetch(
        `/api/monthly-records/payment/${editingPayment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editPaymentForm.name,
            amount: Number(editPaymentForm.amount),
            paymentDate: editPaymentForm.paymentDate,
            isPaid: editPaymentForm.isPaid,
          }),
        },
      );
      if (res.ok) {
        toast.success("更新しました");
        setEditingPayment(null);
        fetchRecords();
      } else {
        toast.error("更新に失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    }
  };

  // Edit income
  const openEditIncome = (income: MonthlyIncome) => {
    setEditingIncome(income);
    setEditIncomeForm({
      name: income.name,
      amount: String(income.amount),
      date: income.date ?? "",
    });
  };

  const handleEditIncomeSubmit = async () => {
    if (!editingIncome) return;
    try {
      const res = await fetch(
        `/api/monthly-records/income/${editingIncome.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editIncomeForm.name,
            amount: Number(editIncomeForm.amount),
            date: editIncomeForm.date,
          }),
        },
      );
      if (res.ok) {
        toast.success("更新しました");
        setEditingIncome(null);
        fetchRecords();
      } else {
        toast.error("更新に失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    }
  };

  // サマリー計算 (DBから文字列として返される場合があるのでNumber変換)
  const totalPayments = records.payments.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  );
  const totalIncomes = records.incomes.reduce(
    (acc, i) => acc + Number(i.amount),
    0,
  );
  const remaining = totalIncomes - totalPayments;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>月別収支管理</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="container mx-auto px-2 py-2 max-w-7xl">
          {/* Header Actions & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 md:gap-8 px-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  収入合計
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  ¥{totalIncomes.toLocaleString()}
                </p>
              </div>
              <div className="h-8 md:h-10 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  支出合計
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  ¥{totalPayments.toLocaleString()}
                </p>
              </div>
              <div className="h-8 md:h-10 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  残高
                </p>
                <p
                  className={`text-xl md:text-2xl lg:text-3xl font-bold tracking-tight ${remaining < 0 ? "text-destructive" : ""}`}
                >
                  ¥{remaining.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Month Navigation */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevMonth}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] text-center font-medium text-sm">
                  {format(currentDate, "yyyy年MM月", { locale: ja })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextMonth}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Secondary Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadTemplate}>
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

              {/* Add Button */}
              <AddRecordDialog month={monthStr} onSuccess={fetchRecords} />
            </div>
          </div>

          {/* Import Dialog */}
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CSVインポート</DialogTitle>
                <DialogDescription>
                  {monthStr} のCSVファイルをアップロードしてください。
                  既存のデータは上書きされます。
                </DialogDescription>
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
              </div>
              <DialogFooter>
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
                >
                  {isImporting ? "インポート中..." : "インポート"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Payment Dialog */}
          <Dialog
            open={!!editingPayment}
            onOpenChange={(open) => !open && setEditingPayment(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>支出を編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-name">項目名</Label>
                  <Input
                    id="edit-payment-name"
                    value={editPaymentForm.name}
                    onChange={(e) =>
                      setEditPaymentForm({
                        ...editPaymentForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-amount">金額</Label>
                  <Input
                    id="edit-payment-amount"
                    type="number"
                    value={editPaymentForm.amount}
                    onChange={(e) =>
                      setEditPaymentForm({
                        ...editPaymentForm,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-date">支払日</Label>
                  <Input
                    id="edit-payment-date"
                    value={editPaymentForm.paymentDate}
                    onChange={(e) =>
                      setEditPaymentForm({
                        ...editPaymentForm,
                        paymentDate: e.target.value,
                      })
                    }
                    placeholder="例: 10/27"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-payment-isPaid"
                    checked={editPaymentForm.isPaid}
                    onCheckedChange={(checked) =>
                      setEditPaymentForm({
                        ...editPaymentForm,
                        isPaid: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="edit-payment-isPaid">支払済み</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingPayment(null)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleEditPaymentSubmit}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Income Dialog */}
          <Dialog
            open={!!editingIncome}
            onOpenChange={(open) => !open && setEditingIncome(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>収入を編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-income-name">項目名</Label>
                  <Input
                    id="edit-income-name"
                    value={editIncomeForm.name}
                    onChange={(e) =>
                      setEditIncomeForm({
                        ...editIncomeForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-income-amount">金額</Label>
                  <Input
                    id="edit-income-amount"
                    type="number"
                    value={editIncomeForm.amount}
                    onChange={(e) =>
                      setEditIncomeForm({
                        ...editIncomeForm,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-income-date">日付</Label>
                  <Input
                    id="edit-income-date"
                    value={editIncomeForm.date}
                    onChange={(e) =>
                      setEditIncomeForm({
                        ...editIncomeForm,
                        date: e.target.value,
                      })
                    }
                    placeholder="例: 10/15"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingIncome(null)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleEditIncomeSubmit}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Record Tables */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Payments Table */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold">支出</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead
                      className="w-[80px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePaymentSort("paymentDate")}
                    >
                      <div className="flex items-center gap-1">
                        日付
                        <SortIcon
                          column="paymentDate"
                          currentKey={paymentSortKey}
                          currentDir={paymentSortDir}
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePaymentSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        項目名
                        <SortIcon
                          column="name"
                          currentKey={paymentSortKey}
                          currentDir={paymentSortDir}
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePaymentSort("amount")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        金額
                        <SortIcon
                          column="amount"
                          currentKey={paymentSortKey}
                          currentDir={paymentSortDir}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((p) => (
                    <TableRow
                      key={p.id}
                      className={p.isPaid ? "opacity-60" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={p.isPaid}
                          onCheckedChange={() => handleTogglePaid(p.id)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.paymentDate}
                      </TableCell>
                      <TableCell
                        className={`font-medium ${p.isPaid ? "line-through" : ""}`}
                      >
                        {p.name}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditPayment(p)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                type: "payment",
                                id: p.id,
                                name: p.name,
                              })
                            }
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.payments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        支出データがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Incomes Table */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold">収入</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="w-[80px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleIncomeSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        日付
                        <SortIcon
                          column="date"
                          currentKey={incomeSortKey}
                          currentDir={incomeSortDir}
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleIncomeSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        項目名
                        <SortIcon
                          column="name"
                          currentKey={incomeSortKey}
                          currentDir={incomeSortDir}
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleIncomeSort("amount")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        金額
                        <SortIcon
                          column="amount"
                          currentKey={incomeSortKey}
                          currentDir={incomeSortDir}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedIncomes.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {i.date}
                      </TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-right">
                        ¥{Number(i.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditIncome(i)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                type: "income",
                                id: i.id,
                                name: i.name,
                              })
                            }
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.incomes.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        収入データがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
