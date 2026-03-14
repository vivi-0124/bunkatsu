"use client";

import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconCheck,
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

  const [paymentSortKey, setPaymentSortKey] =
    useState<PaymentSortKey>("paymentDate");
  const [paymentSortDir, setPaymentSortDir] = useState<"asc" | "desc">("asc");
  const [incomeSortKey, setIncomeSortKey] = useState<IncomeSortKey>("date");
  const [incomeSortDir, setIncomeSortDir] = useState<"asc" | "desc">("asc");

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

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "payment" | "income";
    id: string;
    name: string;
  } | null>(null);

  const [selectedItems, setSelectedItems] = useState<
    { type: "payment" | "income"; id: string }[]
  >([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const monthStr = format(currentDate, "yyyy-MM");

  const toggleSelectItem = (type: "payment" | "income", id: string) => {
    setSelectedItems((prev) =>
      prev.some((item) => item.id === id)
        ? prev.filter((item) => item.id !== id)
        : [...prev, { type, id }],
    );
  };

  const handleSelectAll = (type: "payment" | "income", checked: boolean) => {
    const ids =
      type === "payment"
        ? records.payments.map((p) => p.id)
        : records.incomes.map((i) => i.id);
    if (checked) {
      const newItems = ids
        .filter((id) => !selectedItems.some((item) => item.id === id))
        .map((id) => ({ type, id }));
      setSelectedItems((prev) => [...prev, ...newItems]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    }
  };

  const handleBulkSetPaid = async () => {
    const paymentIds = selectedItems
      .filter((item) => item.type === "payment")
      .map((item) => item.id);

    if (paymentIds.length === 0) {
      toast.error("支出項目を選択してください");
      return;
    }

    try {
      const res = await client.api["monthly-records"]["bulk-set-paid"].$post({
        json: { ids: paymentIds },
      });
      if (res.ok) {
        toast.success(`${paymentIds.length}件を支払済みに更新しました`);
        setSelectedItems([]);
        fetchRecords();
      }
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      const res = await client.api["monthly-records"]["bulk-delete"].$post({
        json: { items: selectedItems },
      });
      if (res.ok) {
        toast.success(`${selectedItems.length}件を削除しました`);
        setSelectedItems([]);
        fetchRecords();
      }
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    } finally {
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.api["monthly-records"].$get({
        query: { month: monthStr },
      });
      if (res.ok) {
        const data = await res.json();
        const payments = (data.payments as MonthlyPayment[]).filter(
          (p) => p.name !== "固定費",
        );
        setRecords({ payments, incomes: data.incomes as MonthlyIncome[] });
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

  const handlePaymentSort = (key: PaymentSortKey) => {
    if (paymentSortKey === key)
      setPaymentSortDir(paymentSortDir === "asc" ? "desc" : "asc");
    else {
      setPaymentSortKey(key);
      setPaymentSortDir("asc");
    }
  };

  const handleIncomeSort = (key: IncomeSortKey) => {
    if (incomeSortKey === key)
      setIncomeSortDir(incomeSortDir === "asc" ? "desc" : "asc");
    else {
      setIncomeSortKey(key);
      setIncomeSortDir("asc");
    }
  };

  const SortIcon = ({
    column,
    currentKey,
    currentDir,
  }: {
    column: string;
    currentKey: string;
    currentDir: "asc" | "desc";
  }) => {
    if (currentKey !== column)
      return <IconArrowsSort className="h-3 w-3 opacity-30" />;
    return currentDir === "asc" ? (
      <IconArrowUp className="h-3 w-3" />
    ) : (
      <IconArrowDown className="h-3 w-3" />
    );
  };

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
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await client.api["monthly-records"].template.$get();
      if (res.ok) {
        const data = await res.json();
        downloadCSV(data.csv, "家計簿テンプレート.csv");
      }
    } catch (error) {
      console.error(error);
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
      }
    } catch (error) {
      console.error(error);
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
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteTarget(null);
    }
  };

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
      }
    } catch (error) {
      console.error(error);
    }
  };

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
      }
    } catch (error) {
      console.error(error);
    }
  };

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
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 md:gap-4 px-1">
              <div className="relative flex flex-col p-3 md:p-4 rounded-xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/10">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-0.5">
                  収入合計
                </p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  ¥{totalIncomes.toLocaleString()}
                </p>
              </div>
              <div className="relative flex flex-col p-3 md:p-4 rounded-xl bg-linear-to-br from-rose-500/10 via-orange-500/5 to-transparent border border-rose-500/10">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-0.5">
                  支出合計
                </p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight bg-linear-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                  ¥{totalPayments.toLocaleString()}
                </p>
              </div>
              <div
                className={`relative flex flex-col p-3 md:p-4 rounded-xl border ${remaining < 0 ? "bg-linear-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/10" : "bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/10"}`}
              >
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-0.5">
                  残高
                </p>
                <p
                  className={`text-lg md:text-2xl lg:text-3xl font-bold tracking-tight ${remaining < 0 ? "text-destructive" : "bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"}`}
                >
                  ¥{remaining.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-background/80 transition-colors"
                  onClick={handlePrevMonth}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] text-center font-semibold text-sm">
                  {format(currentDate, "yyyy年MM月", { locale: ja })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-background/80 transition-colors"
                  onClick={handleNextMonth}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden md:flex gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate}>
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
                    <DropdownMenuItem
                      onClick={() => setIsImportDialogOpen(true)}
                    >
                      <IconUpload className="h-4 w-4 mr-2" />
                      インポート
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AddRecordDialog month={monthStr} onSuccess={fetchRecords} />
            </div>
          </div>

          {/* Balance Bar */}
          {(totalIncomes > 0 || totalPayments > 0) && (
            <div className="mb-6 px-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                <span>収入に対する支出率</span>
                <span className="font-mono font-medium">
                  {totalIncomes > 0
                    ? `${Math.round((totalPayments / totalIncomes) * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    totalIncomes > 0 && totalPayments / totalIncomes > 0.9
                      ? "bg-linear-to-r from-rose-400 to-red-500"
                      : totalIncomes > 0 && totalPayments / totalIncomes > 0.7
                        ? "bg-linear-to-r from-amber-400 to-orange-500"
                        : "bg-linear-to-r from-emerald-400 to-teal-500"
                  }`}
                  style={{
                    width: `${totalIncomes > 0 ? Math.min((totalPayments / totalIncomes) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">今月の明細</h2>
            {selectedItems.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkSetPaid}>
                  <IconCheck className="h-4 w-4 mr-2" />
                  支払済みに更新
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  削除する
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="inline-block w-1 h-5 rounded-full bg-linear-to-b from-rose-400 to-orange-400" />
                  支出
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    ¥{totalPayments.toLocaleString()}
                  </span>
                </h3>
              </div>
              <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 bg-muted/30">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            records.payments.length > 0 &&
                            records.payments.every((p) =>
                              selectedItems.some((item) => item.id === p.id),
                            )
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll("payment", !!checked)
                          }
                        />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handlePaymentSort("name")}
                      >
                        <span className="inline-flex items-center gap-1">
                          項目名{" "}
                          <SortIcon
                            column="name"
                            currentKey={paymentSortKey}
                            currentDir={paymentSortDir}
                          />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handlePaymentSort("amount")}
                      >
                        <span className="inline-flex items-center gap-1">
                          金額{" "}
                          <SortIcon
                            column="amount"
                            currentKey={paymentSortKey}
                            currentDir={paymentSortDir}
                          />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handlePaymentSort("paymentDate")}
                      >
                        <span className="inline-flex items-center gap-1">
                          日{" "}
                          <SortIcon
                            column="paymentDate"
                            currentKey={paymentSortKey}
                            currentDir={paymentSortDir}
                          />
                        </span>
                      </TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.map((p) => (
                      <TableRow
                        key={p.id}
                        className={`transition-colors duration-200 hover:bg-muted/40 group ${p.isPaid ? "opacity-50 bg-muted/20" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.some(
                              (item) => item.id === p.id,
                            )}
                            onCheckedChange={() =>
                              toggleSelectItem("payment", p.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="font-mono">
                          ¥{Number(p.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.paymentDate}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditPayment(p)}
                              >
                                <IconEdit className="h-4 w-4 mr-2" />
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "payment",
                                    id: p.id,
                                    name: p.name,
                                  })
                                }
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedPayments.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          データがありません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="inline-block w-1 h-5 rounded-full bg-linear-to-b from-emerald-400 to-teal-400" />
                収入
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  ¥{totalIncomes.toLocaleString()}
                </span>
              </h3>
              <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 bg-muted/30">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            records.incomes.length > 0 &&
                            records.incomes.every((i) =>
                              selectedItems.some((item) => item.id === i.id),
                            )
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll("income", !!checked)
                          }
                        />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handleIncomeSort("name")}
                      >
                        <span className="inline-flex items-center gap-1">
                          項目名{" "}
                          <SortIcon
                            column="name"
                            currentKey={incomeSortKey}
                            currentDir={incomeSortDir}
                          />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handleIncomeSort("amount")}
                      >
                        <span className="inline-flex items-center gap-1">
                          金額{" "}
                          <SortIcon
                            column="amount"
                            currentKey={incomeSortKey}
                            currentDir={incomeSortDir}
                          />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handleIncomeSort("date")}
                      >
                        <span className="inline-flex items-center gap-1">
                          日{" "}
                          <SortIcon
                            column="date"
                            currentKey={incomeSortKey}
                            currentDir={incomeSortDir}
                          />
                        </span>
                      </TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIncomes.map((i) => (
                      <TableRow
                        key={i.id}
                        className="transition-colors duration-200 hover:bg-muted/40 group"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.some(
                              (item) => item.id === i.id,
                            )}
                            onCheckedChange={() =>
                              toggleSelectItem("income", i.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell className="font-mono">
                          ¥{Number(i.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {i.date}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditIncome(i)}
                              >
                                <IconEdit className="h-4 w-4 mr-2" />
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "income",
                                    id: i.id,
                                    name: i.name,
                                  })
                                }
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedIncomes.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          データがありません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={setIsBulkDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>一括削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              選択した{selectedItems.length}件の項目を削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} を削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                type="text"
                inputMode="numeric"
                value={
                  editPaymentForm.amount
                    ? Number(editPaymentForm.amount).toLocaleString()
                    : ""
                }
                onChange={(e) =>
                  setEditPaymentForm({
                    ...editPaymentForm,
                    amount: e.target.value.replace(/[^\d]/g, ""),
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
                  setEditPaymentForm({ ...editPaymentForm, isPaid: !!checked })
                }
              />
              <Label htmlFor="edit-payment-isPaid">支払済み</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>
              キャンセル
            </Button>
            <Button onClick={handleEditPaymentSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  setEditIncomeForm({ ...editIncomeForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-amount">金額</Label>
              <Input
                id="edit-income-amount"
                type="text"
                inputMode="numeric"
                value={
                  editIncomeForm.amount
                    ? Number(editIncomeForm.amount).toLocaleString()
                    : ""
                }
                onChange={(e) =>
                  setEditIncomeForm({
                    ...editIncomeForm,
                    amount: e.target.value.replace(/[^\d]/g, ""),
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
                  setEditIncomeForm({ ...editIncomeForm, date: e.target.value })
                }
                placeholder="例: 10/15"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIncome(null)}>
              キャンセル
            </Button>
            <Button onClick={handleEditIncomeSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSVインポート</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
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
              {isImporting ? "中..." : "インポート"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
