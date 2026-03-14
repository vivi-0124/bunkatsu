"use client";

import { IconCheck, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { client } from "@/lib/rpc";

interface RecordListProps {
  payments: MonthlyPayment[];
  incomes: MonthlyIncome[];
  onDeleteSuccess: () => void;
}

export function RecordList({
  payments,
  incomes,
  onDeleteSuccess,
}: RecordListProps) {
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "payment" | "income";
    id: string;
    name: string;
    templateId?: string | null;
  } | null>(null);

  const executeDelete = async (
    scope: "this_month" | "all_future" = "this_month",
  ) => {
    if (!deleteTarget) return;
    try {
      const res = await client.api["monthly-records"][":type"][":id"].$delete({
        param: { type: deleteTarget.type, id: deleteTarget.id },
        query: { scope },
      });
      if (res.ok) {
        toast.success("削除しました");
        onDeleteSuccess();
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

  const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalIncomes = incomes.reduce((acc, i) => acc + i.amount, 0);
  const paidPayments = payments
    .filter((p) => p.isPaid)
    .reduce((acc, p) => acc + p.amount, 0);
  const remaining = totalIncomes - paidPayments;
  const unpaidPayments = totalPayments - paidPayments;

  return (
    <>
      <div className="grid gap-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>収入合計</CardDescription>
              <CardTitle className="text-2xl">
                ¥{totalIncomes.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>支出合計</CardDescription>
              <CardTitle className="text-2xl">
                ¥{totalPayments.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className={remaining < 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>残高（あと）</CardDescription>
              <CardTitle
                className={`text-2xl ${remaining < 0 ? "text-destructive" : ""}`}
              >
                ¥{remaining.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>残りの支出</CardDescription>
              <CardTitle className="text-2xl">
                ¥{unpaidPayments.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Expenditure Table */}
          <Card>
            <CardHeader>
              <CardTitle>支出</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">日付</TableHead>
                    <TableHead>項目名</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {p.paymentDate}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {p.isPaid && (
                            <IconCheck className="h-4 w-4 text-primary" />
                          )}
                          {p.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{p.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              type: "payment",
                              id: p.id,
                              name: p.name,
                              templateId: p.templateId,
                            })
                          }
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        支出データがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Income Table */}
          <Card>
            <CardHeader>
              <CardTitle>収入</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">日付</TableHead>
                    <TableHead>項目名</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-muted-foreground">
                        {i.date}
                      </TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-right">
                        ¥{i.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              type: "income",
                              id: i.id,
                              name: i.name,
                              templateId: i.templateId,
                            })
                          }
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {incomes.length === 0 && (
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
            </CardContent>
          </Card>
        </div>
      </div>

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
            {deleteTarget?.templateId ? (
              <>
                <AlertDialogAction
                  onClick={() => executeDelete("this_month")}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  この月だけ削除
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => executeDelete("all_future")}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  これ以降もすべて削除
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                onClick={() => executeDelete("this_month")}
                className="bg-destructive hover:bg-destructive/90"
              >
                削除
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
