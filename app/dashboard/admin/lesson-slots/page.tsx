"use client";

import { Edit, Loader2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface LessonSlot {
  id: string;
  areaId: string;
  areaName: string;
  termId: string;
  termName: string;
  courseType: "fuchu" | "fuchu_advance";
  location: string;
  timeSlots: Omit<TimeSlotEntry, "id">[];
  isActive: boolean | null;
}

interface Area {
  id: string;
  name: string;
}

interface Term {
  id: string;
  name: string;
}

type TimeSlotEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
};

const DAYS_OF_WEEK = [
  { value: 0, label: "日" },
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
];

const getDayLabel = (dayOfWeek: number): string => {
  return (
    DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label ?? String(dayOfWeek)
  );
};

export default function LessonSlotsPage() {
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[] | undefined>(
    undefined,
  );
  const [areas, setAreas] = useState<Area[] | undefined>(undefined);
  const [terms, setTerms] = useState<Term[] | undefined>(undefined);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<LessonSlot | null>(null);

  const [formData, setFormData] = useState({
    areaId: "",
    location: "",
    termId: "",
    courseType: "fuchu" as "fuchu" | "fuchu_advance",
    isActive: true,
  });

  const [timeSlotEntries, setTimeSlotEntries] = useState<TimeSlotEntry[]>([
    {
      id: crypto.randomUUID(),
      dayOfWeek: 4,
      startTime: "16:00",
      endTime: "17:00",
      capacity: 4,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const [slotsRes, areasRes, termsRes] = await Promise.all([
      client.api["lesson-slots"].$get(),
      client.api.areas.$get(),
      client.api.terms.$get(),
    ]);

    if (slotsRes.ok) {
      const data = await slotsRes.json();
      setLessonSlots(data as LessonSlot[]);
    }
    if (areasRes.ok) {
      const data = await areasRes.json();
      setAreas(data as Area[]);
    }
    if (termsRes.ok) {
      const data = await termsRes.json();
      setTerms(data as Term[]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mapTimeSlotsToEntries = (
    slots: Omit<TimeSlotEntry, "id">[],
  ): TimeSlotEntry[] => {
    return slots.map((item) => ({
      id: crypto.randomUUID(),
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      capacity: item.capacity,
    }));
  };

  const handleOpenDialog = (slot?: LessonSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({
        areaId: slot.areaId,
        location: slot.location,
        termId: slot.termId,
        courseType: slot.courseType,
        isActive: slot.isActive ?? true,
      });
      setTimeSlotEntries(mapTimeSlotsToEntries(slot.timeSlots));
    } else {
      setEditingSlot(null);
      setFormData({
        areaId: areas?.[0]?.id ?? "",
        location: "",
        termId: terms?.[0]?.id ?? "",
        courseType: "fuchu",
        isActive: true,
      });
      setTimeSlotEntries([
        {
          id: crypto.randomUUID(),
          dayOfWeek: 4,
          startTime: "16:00",
          endTime: "17:00",
          capacity: 4,
        },
      ]);
    }
    setIsDialogOpen(true);
  };

  const addTimeSlot = () => {
    const lastEntry = timeSlotEntries[timeSlotEntries.length - 1];
    setTimeSlotEntries([
      ...timeSlotEntries,
      {
        id: crypto.randomUUID(),
        dayOfWeek: lastEntry?.dayOfWeek ?? 4,
        startTime: "",
        endTime: "",
        capacity: lastEntry?.capacity ?? 4,
      },
    ]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlotEntries.length > 1) {
      setTimeSlotEntries(timeSlotEntries.filter((e) => e.id !== id));
    }
  };

  const updateTimeSlot = <K extends keyof TimeSlotEntry>(
    id: string,
    field: K,
    value: TimeSlotEntry[K],
  ) => {
    const updated = timeSlotEntries.map((e) =>
      e.id === id ? { ...e, [field]: value } : e,
    );
    setTimeSlotEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // IDを除外して送信
      const timeSlotsToSend = timeSlotEntries.map(({ id, ...rest }) => rest);

      if (editingSlot) {
        const res = await client.api["lesson-slots"][":id"].$patch({
          param: { id: editingSlot.id },
          json: {
            ...formData,
            timeSlots: timeSlotsToSend,
          },
        });
        if (res.ok) await fetchData();
      } else {
        const res = await client.api["lesson-slots"].$post({
          json: {
            ...formData,
            timeSlots: timeSlotsToSend,
          },
        });
        if (res.ok) await fetchData();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save lesson slot:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      try {
        const res = await client.api["lesson-slots"][":id"].$delete({
          param: { id },
        });
        if (res.ok) await fetchData();
      } catch (error) {
        console.error("Failed to delete lesson slot:", error);
      }
    }
  };

  const formatTimeSlots = (slots: Omit<TimeSlotEntry, "id">[]) => {
    if (Array.isArray(slots)) {
      return (
        slots
          .slice(0, 2)
          .map((slot) => {
            const day = getDayLabel(slot.dayOfWeek);
            return `${day} ${slot.startTime}-${slot.endTime} (${slot.capacity}名)`;
          })
          .join(", ") + (slots.length > 2 ? ` +${slots.length - 2}` : "")
      );
    }
    return "";
  };

  const isLoading =
    lessonSlots === undefined || areas === undefined || terms === undefined;

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
                <BreadcrumbPage>Lesson Slots</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">レッスンスロット管理</h1>
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
                  <TableHead>エリア</TableHead>
                  <TableHead>場所</TableHead>
                  <TableHead>学期</TableHead>
                  <TableHead>コースタイプ</TableHead>
                  <TableHead>タイムスロット</TableHead>
                  <TableHead>有効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonSlots.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      レッスンスロットがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  lessonSlots.map((slot: LessonSlot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">
                        {slot.areaName}
                      </TableCell>
                      <TableCell>{slot.location}</TableCell>
                      <TableCell>{slot.termName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            slot.courseType === "fuchu_advance"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {slot.courseType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {formatTimeSlots(slot.timeSlots)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={slot.isActive ? "default" : "outline"}>
                          {slot.isActive ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(slot)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(slot.id)}
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
              {editingSlot ? "レッスンスロット編集" : "レッスンスロット作成"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaId">エリア</Label>
                <Select
                  value={formData.areaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, areaId: value })
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
                <Label htmlFor="termId">学期</Label>
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
                    {terms?.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="例: 我部祖河公民館"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseType">コースタイプ</Label>
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
                  <SelectItem value="fuchu">fuchu</SelectItem>
                  <SelectItem value="fuchu_advance">fuchu_advance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>タイムスロット</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                >
                  <Plus className="h-3 w-3 mr-1" /> 追加
                </Button>
              </div>
              <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                <div className="grid grid-cols-[80px_100px_100px_70px_40px] gap-2 text-xs text-muted-foreground font-medium">
                  <div>曜日</div>
                  <div>開始時間</div>
                  <div>終了時間</div>
                  <div>定員</div>
                  <div></div>
                </div>
                {timeSlotEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[80px_100px_100px_70px_40px] gap-2 items-center"
                  >
                    <Select
                      value={String(entry.dayOfWeek)}
                      onValueChange={(value) =>
                        updateTimeSlot(
                          entry.id,
                          "dayOfWeek",
                          parseInt(value, 10),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) =>
                        updateTimeSlot(entry.id, "startTime", e.target.value)
                      }
                    />
                    <Input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) =>
                        updateTimeSlot(entry.id, "endTime", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      min={1}
                      value={entry.capacity}
                      onChange={(e) =>
                        updateTimeSlot(
                          entry.id,
                          "capacity",
                          parseInt(e.target.value, 10) || 1,
                        )
                      }
                    />
                    {timeSlotEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(entry.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
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
