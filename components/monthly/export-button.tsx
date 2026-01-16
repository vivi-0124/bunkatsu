"use client";

import { IconDownload, IconFileTypeCsv } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";

interface ExportButtonProps {
  month: string;
}

export function ExportButton({ month }: ExportButtonProps) {
  const { data: session } = authClient.useSession();

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
        query: { month, userId: session.user.id },
      });
      if (res.ok) {
        const data = await res.json();
        downloadCSV(data.csv, `家計簿_${month}.csv`);
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <IconDownload className="h-4 w-4" />
          ダウンロード
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExport}>
          <IconFileTypeCsv className="h-4 w-4 mr-2" />
          CSVエクスポート（{month}）
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadTemplate}>
          <IconFileTypeCsv className="h-4 w-4 mr-2" />
          テンプレートをダウンロード
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
