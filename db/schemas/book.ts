import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth-schema";

// 1対1授業スケジュールステータス: 生徒希望から授業完了まで一元管理
export const lessonStatusValues = [
  "requested",
  "confirmed",
  "completed",
] as const;
export type LessonStatus = (typeof lessonStatusValues)[number];

// コースタイプ: fuchuまたはfuchu advance
export const courseTypeValues = ["fuchu", "fuchu_advance"] as const;
export type CourseType = (typeof courseTypeValues)[number];

// 月謝支払いステータス
export const paymentStatusValues = ["unpaid", "pending", "paid"] as const;
export type PaymentStatus = (typeof paymentStatusValues)[number];

export interface TimeSlot {
  dayOfWeek: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
}

// ヘルパー: IDのデフォルト値生成 (UUID互換)
const generateId = () => crypto.randomUUID();

// ヘルパー: 共通のタイムスタンプ定義
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
};

// コース: プログラミングコースの基本情報
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  // SQLite doesn't support arrays, so stored as JSON string
  technologies: text("technologies"),
  targetRoles: text("target_roles"),
  termDuration: integer("term_duration").default(3),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  ...timestamps,
});

// terms テーブル: プログラミング教室の期間（学期）管理
export const terms = sqliteTable("terms", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  presentationDate: text("presentation_date").notNull(), // YYYY-MM-DD
  totalLessons: integer("total_lessons").notNull().default(18),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  ...timestamps,
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

// areas テーブル: 地域の定義
export const areas = sqliteTable("areas", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps,
});

// students テーブル: 実際の生徒情報（認証しない）
export const students = sqliteTable("students", {
  id: text("id").primaryKey().$defaultFn(generateId),

  // 保護者ID（users.idを参照）
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  areaId: text("area_id").references(() => areas.id, { onDelete: "set null" }),

  // 生徒基本情報
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD
  school: text("school").notNull(),
  grade: text("grade"),

  // コースタイプ
  courseType: text("course_type")
    .$type<CourseType>()
    .notNull()
    .default("fuchu"),

  // 月謝情報
  tuitionAmount: integer("tuition_amount"),
  paymentStatus: text("payment_status")
    .$type<PaymentStatus>()
    .default("unpaid"),
  tuitionMonth: text("tuition_month"), // YYYY-MM
  adminMemo: text("admin_memo"),

  ...timestamps,
});

// 教材ステージ（進捗管理用）
export const stages = sqliteTable("stages", {
  id: text("id").primaryKey().$defaultFn(generateId),
  courseType: text("course_type")
    .$type<CourseType>()
    .notNull()
    .default("fuchu"),
  stageNumber: text("stage_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  ...timestamps,
});

// 生徒ごとのステージ進捗
export const studentStageProgress = sqliteTable("student_stage_progress", {
  id: text("id").primaryKey().$defaultFn(generateId),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  stageId: text("stage_id")
    .notNull()
    .references(() => stages.id, { onDelete: "cascade" }),
  courseType: text("course_type")
    .$type<CourseType>()
    .notNull()
    .default("fuchu"),
  note: text("note"),
  ...timestamps,
});

// 社内共有メモ（日付単位）
export const dayNotes = sqliteTable("day_notes", {
  id: text("id").primaryKey().$defaultFn(generateId),
  targetDate: text("target_date").notNull().unique(), // YYYY-MM-DD
  note: text("note"),
  ...timestamps,
});

// 休講日（期間対応）
export const holidays = sqliteTable("holidays", {
  id: text("id").primaryKey().$defaultFn(generateId),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  ...timestamps,
});

// lessonSlots テーブル: 教室管理（エリア・場所・日時・定員）
export const lessonSlots = sqliteTable(
  "lesson_slots",
  {
    id: text("id").primaryKey().$defaultFn(generateId),

    // エリア・場所情報
    areaId: text("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "cascade" }),
    location: text("location").notNull(),

    // 学期情報
    termId: text("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),

    // コースタイプ
    courseType: text("course_type")
      .$type<CourseType>()
      .notNull()
      .default("fuchu"),

    // 開講時間帯の配列（JSON文字列）
    timeSlots: text("time_slots", { mode: "json" })
      .$type<TimeSlot[]>()
      .notNull(),

    // 有効フラグ
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    ...timestamps,
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("lesson_slots_term_idx").on(table.termId),
    index("lesson_slots_area_idx").on(table.areaId),
  ],
);

// lessons テーブル: 1対1授業スケジュール管理
export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey().$defaultFn(generateId),

    termId: text("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),

    courseType: text("course_type")
      .$type<CourseType>()
      .notNull()
      .default("fuchu"),

    courseId: text("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),

    // SQLite doesn't support arrays, stored as JSON string
    studentIds: text("student_ids"),
    tutorIds: text("tutor_ids"),

    lessonSlotId: text("lesson_slot_id").references(() => lessonSlots.id, {
      onDelete: "set null",
    }),

    // Link to term selections for reporting/tracking
    studentTermSelectionIds: text("student_term_selection_ids"),

    manualLocation: text("manual_location"),
    lessonNumber: integer("lesson_number").notNull(),

    startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
    endTime: integer("end_time", { mode: "timestamp_ms" }).notNull(),

    status: text("status").$type<LessonStatus>().notNull().default("requested"),

    ...timestamps,
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("lessons_term_idx").on(table.termId),
    index("lessons_status_idx").on(table.status),
    index("lessons_course_type_idx").on(table.courseType),
    index("lessons_start_time_idx").on(table.startTime),
  ],
);

// 講師振り返り
export const reflections = sqliteTable("reflections", {
  id: text("id").primaryKey().$defaultFn(generateId),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stageId: text("stage_id").references(() => stages.id, {
    onDelete: "set null",
  }),
  focusScore: integer("focus_score"),
  reflection: text("reflection"),
  internalNote: text("internal_note"),
  ...timestamps,
});

// ステータス履歴テーブル: 全てのステータス変更を追跡
export const statusHistory = sqliteTable(
  "status_history",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    changedBy: text("changed_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    changedAt: integer("changed_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    reason: text("reason"),
    ...timestamps,
  },
  (table) => [index("status_history_lesson_idx").on(table.lessonId)],
);

// studentTermSelections テーブル: 生徒がどの学期にどのコースを受講するか
export const studentTermSelections = sqliteTable(
  "student_term_selections",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    termId: text("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    courseType: text("course_type").$type<CourseType>().notNull(),
    status: text("status")
      .$type<"active" | "completed" | "canceled">()
      .default("active"),
    ...timestamps,
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("student_term_selections_student_idx").on(table.studentId),
    index("student_term_selections_term_idx").on(table.termId),
  ],
);

// リレーション定義
export const studentsRelations = relations(students, ({ one }) => ({
  parent: one(users, {
    fields: [students.parentId],
    references: [users.id],
  }),
  area: one(areas, {
    fields: [students.areaId],
    references: [areas.id],
  }),
}));

export const stagesRelations = relations(stages, ({ many }) => ({
  progress: many(studentStageProgress),
}));

export const studentStageProgressRelations = relations(
  studentStageProgress,
  ({ one }) => ({
    student: one(students, {
      fields: [studentStageProgress.studentId],
      references: [students.id],
    }),
    stage: one(stages, {
      fields: [studentStageProgress.stageId],
      references: [stages.id],
    }),
  }),
);

export const dayNotesRelations = relations(dayNotes, () => ({}));
export const holidaysRelations = relations(holidays, () => ({}));

export const reflectionsRelations = relations(reflections, ({ one }) => ({
  lesson: one(lessons, {
    fields: [reflections.lessonId],
    references: [lessons.id],
  }),
  student: one(students, {
    fields: [reflections.studentId],
    references: [students.id],
  }),
  stage: one(stages, {
    fields: [reflections.stageId],
    references: [stages.id],
  }),
  tutor: one(users, {
    fields: [reflections.tutorId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
}));

export const termsRelations = relations(terms, ({ many }) => ({
  lessons: many(lessons),
  lessonSlots: many(lessonSlots),
}));

export const lessonSlotsRelations = relations(lessonSlots, ({ one, many }) => ({
  term: one(terms, {
    fields: [lessonSlots.termId],
    references: [terms.id],
  }),
  area: one(areas, {
    fields: [lessonSlots.areaId],
    references: [areas.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  term: one(terms, {
    fields: [lessons.termId],
    references: [terms.id],
  }),
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  lessonSlot: one(lessonSlots, {
    fields: [lessons.lessonSlotId],
    references: [lessonSlots.id],
  }),
  statusHistory: many(statusHistory),
}));

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  lesson: one(lessons, {
    fields: [statusHistory.lessonId],
    references: [lessons.id],
  }),
  changedBy: one(users, {
    fields: [statusHistory.changedBy],
    references: [users.id],
  }),
}));
