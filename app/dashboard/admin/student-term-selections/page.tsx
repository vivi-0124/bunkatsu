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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { client } from "@/lib/rpc";

interface Selection {
  id: string;
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  courseId: string;
  courseName: string;
  courseType: "fuchu" | "fuchu_advance";
  status: "active" | "completed" | "canceled";
}

interface Student {
  id: string;
  name: string;
}

interface Term {
  id: string;
  name: string;
}

interface Course {
  id: string;
  displayName: string;
}

export default function SelectionsPage() {
  const [selections, setSelections] = useState<Selection[] | undefined>(
    undefined,
  );
  const [students, setStudents] = useState<Student[] | undefined>(undefined);
  const [terms, setTerms] = useState<Term[] | undefined>(undefined);
  const [courses, setCourses] = useState<Course[] | undefined>(undefined);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSelection, setEditingSelection] = useState<Selection | null>(
    null,
  );

  const [formData, setFormData] = useState({
    studentId: "",
    termId: "",
    courseId: "",
    courseType: "fuchu" as "fuchu" | "fuchu_advance",
    status: "active" as "active" | "completed" | "canceled",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const [selectionsRes, studentsRes, termsRes, coursesRes] =
      await Promise.all([
        client.api["student-term-selections"].$get(),
        client.api.students.$get({
          query: {},
        }),
        client.api.terms.$get(),
        client.api.courses.$get(),
      ]);

    if (selectionsRes.ok) {
      const data = await selectionsRes.json();
      setSelections(data as Selection[]);
    }
    if (studentsRes.ok) {
      const data = await studentsRes.json();
      setStudents(data as Student[]);
    }
    if (termsRes.ok) {
      const data = await termsRes.json();
      setTerms(data as Term[]);
    }
    if (coursesRes.ok) {
      const data = await coursesRes.json();
      setCourses(data as Course[]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (selection?: Selection) => {
    if (selection) {
      setEditingSelection(selection);
      setFormData({
        studentId: selection.studentId,
        termId: selection.termId,
        courseId: selection.courseId,
        courseType: selection.courseType,
        status: selection.status || "active",
      });
    } else {
      setEditingSelection(null);
      setFormData({
        studentId: "",
        termId: "",
        courseId: "",
        courseType: "fuchu",
        status: "active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.termId || !formData.courseId) {
      alert("すべての項目を選択してください");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingSelection) {
        const res = await client.api["student-term-selections"][":id"].$patch({
          param: { id: editingSelection.id },
          json: formData,
        });
        if (res.ok) await fetchData();
      } else {
        const res = await client.api["student-term-selections"].$post({
          json: formData,
        });
        if (res.ok) await fetchData();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save selection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      try {
        const res = await client.api["student-term-selections"][":id"].$delete({
          param: { id },
        });
        if (res.ok) await fetchData();
      } catch (error) {
        console.error("Failed to delete selection:", error);
      }
    }
  };

  const isLoading =
    selections === undefined ||
    students === undefined ||
    terms === undefined ||
    courses === undefined;

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
                <BreadcrumbPage>Student Term Selections</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">受講コース登録管理</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 追加
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>生徒名</TableHead>
                  <TableHead>学期</TableHead>
                  <TableHead>コース</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selections.map((selection) => (
                  <TableRow key={selection.id}>
                    <TableCell className="font-medium">
                      {selection.studentName}
                    </TableCell>
                    <TableCell>{selection.termName}</TableCell>
                    <TableCell>{selection.courseName}</TableCell>
                    <TableCell>{selection.courseType}</TableCell>
                    <TableCell>{selection.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(selection)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(selection.id)}
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
            <DialogTitle>
              {editingSelection ? "登録編集" : "新規登録"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>生徒</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    studentId: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="生徒を選択" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>学期</Label>
              <Select
                value={formData.termId}
                onValueChange={(value) =>
                  setFormData({ ...formData, termId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="学期を選択" />
                </SelectTrigger>
                <SelectContent>
                  {terms?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>コース</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="コースを選択" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>コースタイプ</Label>
                <Select
                  value={formData.courseType}
                  onValueChange={(value: "fuchu" | "fuchu_advance") =>
                    setFormData({ ...formData, courseType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuchu">Fuchu</SelectItem>
                    <SelectItem value="fuchu_advance">Advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "completed" | "canceled") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
