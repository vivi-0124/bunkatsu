"use client";

import { IconUpload } from "@tabler/icons-react";
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
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";

interface ImportDialogProps {
  month: string;
  onImportSuccess: () => void;
}

export function ImportDialog({ month, onImportSuccess }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { data: session } = authClient.useSession();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !session?.user?.id) return;

    setIsImporting(true);
    try {
      const csvText = await file.text();
      const res = await client.api["monthly-records"].import.$post({
        json: {
          csvText,
          month,
          userId: session.user.id,
        },
      });

      if (res.ok) {
        toast.success("インポートが完了しました");
        setOpen(false);
        onImportSuccess();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <IconUpload className="h-4 w-4" />
          CSVインポート
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>家計簿データのインポート</DialogTitle>
          <DialogDescription>
            {month} のCSVファイルをアップロードしてください。
            既存のデータがある場合は上書きされます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">CSVファイル</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || isImporting}
          >
            {isImporting ? "インポート中..." : "インポート実行"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
