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
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/rpc";

interface Course {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  emoji: string | null;
  termDuration: number | null;
  isActive: boolean | null;
  sortOrder: number | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[] | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    emoji: "",
    termDuration: 3,
    isActive: true,
    sortOrder: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = useCallback(async () => {
    const res = await client.api.courses.$get();
    if (res.ok) {
      const data = await res.json();
      setCourses(data as Course[]);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        displayName: course.displayName,
        description: course.description || "",
        emoji: course.emoji || "",
        termDuration: course.termDuration || 3,
        isActive: course.isActive ?? true,
        sortOrder: course.sortOrder || 0,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: "",
        displayName: "",
        description: "",
        emoji: "",
        termDuration: 3,
        isActive: true,
        sortOrder: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCourse) {
        const res = await client.api.courses[":id"].$patch({
          param: { id: editingCourse.id },
          json: formData,
        });
        if (res.ok) await fetchCourses();
      } else {
        const res = await client.api.courses.$post({
          json: formData,
        });
        if (res.ok) await fetchCourses();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      try {
        const res = await client.api.courses[":id"].$delete({
          param: { id },
        });
        if (res.ok) await fetchCourses();
      } catch (error) {
        console.error("Failed to delete course:", error);
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
                <BreadcrumbPage>Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">コース管理</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 追加
          </Button>
        </div>

        {courses === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>表示名</TableHead>
                  <TableHead>期間(月)</TableHead>
                  <TableHead>有効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      {course.emoji} {course.name}
                    </TableCell>
                    <TableCell>{course.displayName}</TableCell>
                    <TableCell>{course.termDuration}</TableCell>
                    <TableCell>{course.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course.id)}
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
              {editingCourse ? "コース編集" : "コース作成"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">内部名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emoji">絵文字</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) =>
                    setFormData({ ...formData, emoji: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termDuration">期間 (月)</Label>
                <Input
                  id="termDuration"
                  type="number"
                  value={formData.termDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termDuration: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">ソート順</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value, 10),
                    })
                  }
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
