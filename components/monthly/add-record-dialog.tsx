"use client";

import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";

interface AddRecordDialogProps {
  month: string;
  onSuccess: () => void;
}

export function AddRecordDialog({ month, onSuccess }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = authClient.useSession();

  const [paymentName, setPaymentName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentRecurring, setPaymentRecurring] = useState(false);

  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState("");
  const [incomeRecurring, setIncomeRecurring] = useState(false);

  const resetForms = () => {
    setPaymentName("");
    setPaymentAmount("");
    setPaymentDate("");
    setPaymentRecurring(false);
    setIncomeName("");
    setIncomeAmount("");
    setIncomeDate("");
    setIncomeRecurring(false);
  };

  const handleAddPayment = async () => {
    if (!paymentName || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      if (paymentRecurring) {
        // 繰り返し項目として登録（GETハンドラが自動で月次レコードを生成する）
        const recurRes = await client.api["recurring-items"].$post({
          json: {
            userId: session.user.id,
            name: paymentName,
            amount: paymentAmount ? parseInt(paymentAmount, 10) : 0,
            type: "payment" as const,
            startMonth: month,
            paymentDate: paymentDate || null,
          },
        });
        if (recurRes.ok) {
          toast.success("支出項目を追加しました（毎月繰り返し）");
          resetForms();
          setOpen(false);
          onSuccess();
        } else {
          toast.error("追加に失敗しました");
        }
      } else {
        // 通常の1回限り追加
        const res = await client.api["monthly-records"].payment.$post({
          json: {
            userId: session.user.id,
            month,
            name: paymentName,
            amount: paymentAmount ? parseInt(paymentAmount, 10) : 0,
            paymentDate: paymentDate || null,
            isPaid: false,
          },
        });
        if (res.ok) {
          toast.success("支出項目を追加しました");
          resetForms();
          setOpen(false);
          onSuccess();
        } else {
          toast.error("追加に失敗しました");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIncome = async () => {
    if (!incomeName || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      if (incomeRecurring) {
        // 繰り返し項目として登録（GETハンドラが自動で月次レコードを生成する）
        const recurRes = await client.api["recurring-items"].$post({
          json: {
            userId: session.user.id,
            name: incomeName,
            amount: incomeAmount ? parseInt(incomeAmount, 10) : 0,
            type: "income" as const,
            startMonth: month,
            paymentDate: incomeDate || null,
          },
        });
        if (recurRes.ok) {
          toast.success("収入項目を追加しました（毎月繰り返し）");
          resetForms();
          setOpen(false);
          onSuccess();
        } else {
          toast.error("追加に失敗しました");
        }
      } else {
        // 通常の1回限り追加
        const res = await client.api["monthly-records"].income.$post({
          json: {
            userId: session.user.id,
            month,
            name: incomeName,
            amount: incomeAmount ? parseInt(incomeAmount, 10) : 0,
            date: incomeDate || null,
          },
        });
        if (res.ok) {
          toast.success("収入項目を追加しました");
          resetForms();
          setOpen(false);
          onSuccess();
        } else {
          toast.error("追加に失敗しました");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <IconPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>項目を追加</DialogTitle>
          <DialogDescription>
            {month}{" "}
            の明細に新しい項目を追加します。「毎月繰り返す」にチェックすると、翌月以降も自動的に追加されます。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment">支出</TabsTrigger>
            <TabsTrigger value="income">収入</TabsTrigger>
          </TabsList>
          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-name">項目名 *</Label>
              <Input
                id="payment-name"
                placeholder="例: カフェ代"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">金額（任意）</Label>
              <Input
                id="payment-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  paymentAmount ? Number(paymentAmount).toLocaleString() : ""
                }
                onChange={(e) =>
                  setPaymentAmount(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-date">支払日（任意）</Label>
              <Input
                id="payment-date"
                placeholder="例: 10/27"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-recurring"
                checked={paymentRecurring}
                onCheckedChange={(checked) =>
                  setPaymentRecurring(checked === true)
                }
              />
              <Label
                htmlFor="payment-recurring"
                className="text-sm font-normal cursor-pointer"
              >
                毎月繰り返す
              </Label>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddPayment}
                disabled={isSubmitting || !paymentName}
              >
                {isSubmitting ? "追加中..." : "支出を追加"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="income" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="income-name">項目名 *</Label>
              <Input
                id="income-name"
                placeholder="例: お祝い"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="income-amount">金額（任意）</Label>
              <Input
                id="income-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  incomeAmount ? Number(incomeAmount).toLocaleString() : ""
                }
                onChange={(e) =>
                  setIncomeAmount(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="income-date">日付（任意）</Label>
              <Input
                id="income-date"
                placeholder="例: 10/15"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="income-recurring"
                checked={incomeRecurring}
                onCheckedChange={(checked) =>
                  setIncomeRecurring(checked === true)
                }
              />
              <Label
                htmlFor="income-recurring"
                className="text-sm font-normal cursor-pointer"
              >
                毎月繰り返す
              </Label>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddIncome}
                disabled={isSubmitting || !incomeName}
              >
                {isSubmitting ? "追加中..." : "収入を追加"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
