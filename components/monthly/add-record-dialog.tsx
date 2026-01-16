"use client";

import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
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

  // Payment template form state
  const [paymentName, setPaymentName] = useState("");
  const [paymentDefaultAmount, setPaymentDefaultAmount] = useState("");
  const [paymentDefaultDate, setPaymentDefaultDate] = useState("");

  // Income template form state
  const [incomeName, setIncomeName] = useState("");
  const [incomeDefaultAmount, setIncomeDefaultAmount] = useState("");
  const [incomeDefaultDate, setIncomeDefaultDate] = useState("");

  const resetForms = () => {
    setPaymentName("");
    setPaymentDefaultAmount("");
    setPaymentDefaultDate("");
    setIncomeName("");
    setIncomeDefaultAmount("");
    setIncomeDefaultDate("");
  };

  const handleAddPaymentTemplate = async () => {
    if (!paymentName || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      // テンプレートを作成
      const templateRes = await client.api[
        "monthly-records"
      ].templates.payment.$post({
        json: {
          userId: session.user.id,
          name: paymentName,
          defaultAmount: paymentDefaultAmount
            ? parseInt(paymentDefaultAmount, 10)
            : null,
          defaultPaymentDate: paymentDefaultDate || null,
        },
      });
      if (templateRes.ok) {
        // 現在の月にもレコードを追加
        await client.api["monthly-records"].payment.$post({
          json: {
            userId: session.user.id,
            month,
            name: paymentName,
            amount: paymentDefaultAmount
              ? parseInt(paymentDefaultAmount, 10)
              : 0,
            paymentDate: paymentDefaultDate,
            isPaid: false,
          },
        });
        toast.success("支出項目を追加しました");
        resetForms();
        setOpen(false);
        onSuccess();
      } else {
        toast.error("追加に失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIncomeTemplate = async () => {
    if (!incomeName || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      // テンプレートを作成
      const templateRes = await client.api[
        "monthly-records"
      ].templates.income.$post({
        json: {
          userId: session.user.id,
          name: incomeName,
          defaultAmount: incomeDefaultAmount
            ? parseInt(incomeDefaultAmount, 10)
            : null,
          defaultDate: incomeDefaultDate || null,
        },
      });
      if (templateRes.ok) {
        // 現在の月にもレコードを追加
        await client.api["monthly-records"].income.$post({
          json: {
            userId: session.user.id,
            month,
            name: incomeName,
            amount: incomeDefaultAmount ? parseInt(incomeDefaultAmount, 10) : 0,
            date: incomeDefaultDate,
          },
        });
        toast.success("収入項目を追加しました");
        resetForms();
        setOpen(false);
        onSuccess();
      } else {
        toast.error("追加に失敗しました");
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
            新しい項目を追加します。追加した項目は毎月自動で表示されます。
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
                placeholder="例: 楽天カード"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-default-amount">
                デフォルト金額（任意）
              </Label>
              <Input
                id="payment-default-amount"
                type="number"
                placeholder="毎月同じ金額の場合に設定"
                value={paymentDefaultAmount}
                onChange={(e) => setPaymentDefaultAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-default-date">
                デフォルト支払日（任意）
              </Label>
              <Input
                id="payment-default-date"
                placeholder="例: 27"
                value={paymentDefaultDate}
                onChange={(e) => setPaymentDefaultDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddPaymentTemplate}
                disabled={isSubmitting || !paymentName}
              >
                {isSubmitting ? "追加中..." : "支出項目を追加"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="income" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="income-name">項目名 *</Label>
              <Input
                id="income-name"
                placeholder="例: 給与"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="income-default-amount">
                デフォルト金額（任意）
              </Label>
              <Input
                id="income-default-amount"
                type="number"
                placeholder="毎月同じ金額の場合に設定"
                value={incomeDefaultAmount}
                onChange={(e) => setIncomeDefaultAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="income-default-date">
                デフォルト日付（任意）
              </Label>
              <Input
                id="income-default-date"
                placeholder="例: 15"
                value={incomeDefaultDate}
                onChange={(e) => setIncomeDefaultDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddIncomeTemplate}
                disabled={isSubmitting || !incomeName}
              >
                {isSubmitting ? "追加中..." : "収入項目を追加"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
