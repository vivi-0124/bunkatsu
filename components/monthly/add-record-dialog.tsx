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
import { Switch } from "@/components/ui/switch";
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

  // Payment form state
  const [paymentName, setPaymentName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  // Income form state
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState("");

  const resetForms = () => {
    setPaymentName("");
    setPaymentAmount("");
    setPaymentDate("");
    setIsPaid(false);
    setIncomeName("");
    setIncomeAmount("");
    setIncomeDate("");
  };

  const handleAddPayment = async () => {
    if (!paymentName || !paymentAmount || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      const res = await client.api["monthly-records"].payment.$post({
        json: {
          userId: session.user.id,
          month,
          name: paymentName,
          amount: parseInt(paymentAmount, 10),
          paymentDate,
          isPaid,
        },
      });
      if (res.ok) {
        toast.success("支出を追加しました");
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

  const handleAddIncome = async () => {
    if (!incomeName || !incomeAmount || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      const res = await client.api["monthly-records"].income.$post({
        json: {
          userId: session.user.id,
          month,
          name: incomeName,
          amount: parseInt(incomeAmount, 10),
          date: incomeDate,
        },
      });
      if (res.ok) {
        toast.success("収入を追加しました");
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
          <DialogTitle>収支を追加</DialogTitle>
          <DialogDescription>
            {month} の支出または収入を手動で追加します。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment">支出</TabsTrigger>
            <TabsTrigger value="income">収入</TabsTrigger>
          </TabsList>
          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-name">項目名</Label>
              <Input
                id="payment-name"
                placeholder="例: 楽天カード"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">金額</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
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
              <Switch
                id="is-paid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
              <Label htmlFor="is-paid">支払済み</Label>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddPayment}
                disabled={isSubmitting || !paymentName || !paymentAmount}
              >
                {isSubmitting ? "追加中..." : "支出を追加"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="income" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="income-name">項目名</Label>
              <Input
                id="income-name"
                placeholder="例: 給与"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="income-amount">金額</Label>
              <Input
                id="income-amount"
                type="number"
                placeholder="0"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
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
            <DialogFooter>
              <Button
                onClick={handleAddIncome}
                disabled={isSubmitting || !incomeName || !incomeAmount}
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
