"use client";

import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";

type CourseType = "fuchu" | "fuchu_advance";

interface Student {
  id: string;
  name: string;
  school: string;
  grade: string | null;
  areaId: string | null;
  areaName?: string;
  courseType: string;
  birthDate: string;
  parentId: string;
}

interface Area {
  id: string;
  name: string;
}

interface FormData {
  parentId: string;
  areaId: string;
  name: string;
  birthDate: string;
  school: string;
  grade: string;
  courseType: CourseType | "";
}

const initialFormData: FormData = {
  parentId: "",
  areaId: "",
  name: "",
  birthDate: "",
  school: "",
  grade: "",
  courseType: "",
};

export default function StudentDashboard() {
  const { data: session } = authClient.useSession();
  const [students, setStudents] = useState<Student[] | undefined>(undefined);
  const [areas, setAreas] = useState<Area[] | undefined>(undefined);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const [studentsRes, areasRes] = await Promise.all([
      client.api.students.$get(),
      client.api.areas.$get(),
    ]);

    if (studentsRes.ok) {
      const data = await studentsRes.json();
      setStudents(data as Student[]);
    }
    if (areasRes.ok) {
      const data = await areasRes.json();
      setAreas(data as Area[]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        parentId: student.parentId || "",
        areaId: student.areaId || "",
        name: student.name || "",
        birthDate: student.birthDate || "",
        school: student.school || "",
        grade: student.grade || "",
        courseType: (student.courseType as CourseType) || "",
      });
    } else {
      setEditingStudent(null);
      setFormData({
        ...initialFormData,
        parentId: session?.user.id || "manual",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate || !formData.school) {
      alert("名前、生年月日、学校は必須です");
      return;
    }
    setIsSubmitting(true);
    try {
      const submitData = {
        parentId: formData.parentId || session?.user.id || "manual",
        name: formData.name,
        birthDate: formData.birthDate,
        school: formData.school,
        areaId: formData.areaId || undefined,
        grade: formData.grade || undefined,
        courseType: (formData.courseType as CourseType) || undefined,
      };

      if (editingStudent) {
        const res = await client.api.students[":id"].$patch({
          param: { id: editingStudent.id },
          json: submitData,
        });
        if (res.ok) await fetchData();
      } else {
        const res = await client.api.students.$post({
          json: submitData,
        });
        if (res.ok) await fetchData();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      try {
        const res = await client.api.students[":id"].$delete({
          param: { id },
        });
        if (res.ok) await fetchData();
      } catch (error) {
        console.error("Failed to delete student:", error);
      }
    }
  };

  const isLoading = students === undefined || areas === undefined;

  const getCourseTypeLabel = (type?: string) => {
    switch (type) {
      case "fuchu":
        return "fuchu";
      case "fuchu_advance":
        return "fuchu_advance";
      default:
        return "-";
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
                <BreadcrumbPage>生徒管理</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">生徒一覧</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 生徒を追加
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
                  <TableHead>名前</TableHead>
                  <TableHead>学校</TableHead>
                  <TableHead>学年</TableHead>
                  <TableHead>エリア</TableHead>
                  <TableHead>コースタイプ</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      生徒がまだ登録されていません
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.school}</TableCell>
                      <TableCell>{student.grade || "-"}</TableCell>
                      <TableCell>{student.areaName || "-"}</TableCell>
                      <TableCell>
                        {getCourseTypeLabel(student.courseType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "生徒情報編集" : "新規生徒登録"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  名前 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="山田太郎"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">
                  生年月日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">
                  学校 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) =>
                    setFormData({ ...formData, school: e.target.value })
                  }
                  placeholder="○○小学校"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">学年</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  placeholder="小学3年"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>エリア</Label>
                <Select
                  value={formData.areaId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      areaId: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="エリアを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>コースタイプ</Label>
                <Select
                  value={formData.courseType}
                  onValueChange={(value: CourseType) =>
                    setFormData({ ...formData, courseType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="コースを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuchu">fuchu</SelectItem>
                    <SelectItem value="fuchu_advance">fuchu_advance</SelectItem>
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
