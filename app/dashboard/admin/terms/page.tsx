"use client";

import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/lib/rpc";

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  presentationDate: string;
  totalLessons: number;
  isActive: boolean | null;
}

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[] | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    presentationDate: "",
    totalLessons: 18,
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTerms = useCallback(async () => {
    const res = await client.api.terms.$get();
    if (res.ok) {
      const data = await res.json();
      setTerms(data as Term[]);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const handleOpenDialog = (term?: Term) => {
    if (term) {
      setEditingTerm(term);
      setFormData({
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
        presentationDate: term.presentationDate,
        totalLessons: term.totalLessons,
        isActive: term.isActive ?? true,
      });
    } else {
      setEditingTerm(null);
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        presentationDate: "",
        totalLessons: 18,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTerm) {
        const res = await client.api.terms[":id"].$patch({
          param: { id: editingTerm.id },
          json: formData,
        });
        if (res.ok) await fetchTerms();
      } else {
        const res = await client.api.terms.$post({
          json: formData,
        });
        if (res.ok) await fetchTerms();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save term:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      try {
        const res = await client.api.terms[":id"].$delete({
          param: { id },
        });
        if (res.ok) await fetchTerms();
      } catch (error) {
        console.error("Failed to delete term:", error);
      }
    }
  };

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
                <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Terms</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">学期(Term)管理</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 追加
          </Button>
        </div>

        {terms === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>開始日</TableHead>
                  <TableHead>終了日</TableHead>
                  <TableHead>発表会日</TableHead>
                  <TableHead>授業数</TableHead>
                  <TableHead>有効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{term.startDate}</TableCell>
                    <TableCell>{term.endDate}</TableCell>
                    <TableCell>{term.presentationDate}</TableCell>
                    <TableCell>{term.totalLessons}</TableCell>
                    <TableCell>{term.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(term)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(term.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTerm ? "学期編集" : "学期作成"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前 (例: 2024年度 第3期)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">終了日</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presentationDate">発表会日</Label>
                <Input
                  id="presentationDate"
                  type="date"
                  value={formData.presentationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presentationDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalLessons">総授業回数</Label>
                <Input
                  id="totalLessons"
                  type="number"
                  value={formData.totalLessons}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalLessons: parseInt(e.target.value, 10),
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">有効化</Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
