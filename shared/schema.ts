import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  canvasToken: text("canvas_token"),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  canvasToken: true,
});

// Courses schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  canvasId: text("canvas_id").notNull(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  userId: true,
  canvasId: true,
  name: true,
  active: true,
});

// Assignments schema
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  url: text("url"),
  isReading: boolean("is_reading").default(false),
  processed: boolean("processed").default(false),
  processedContent: text("processed_content"),
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  courseId: true,
  title: true,
  description: true,
  dueDate: true,
  url: true,
  isReading: true,
  processed: true,
  processedContent: true,
});

// Summaries schema
export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseName: text("course_name").notNull(),
  fileName: text("file_name").notNull(),
  summaryDate: timestamp("summary_date").notNull(),
  summaryContent: text("summary_content"),
  googleDocId: text("google_doc_id"),
  googleDocUrl: text("google_doc_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSummarySchema = createInsertSchema(summaries).pick({
  userId: true,
  courseName: true,
  fileName: true,
  summaryDate: true,
  summaryContent: true,
  googleDocId: true,
  googleDocUrl: true,
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  driveFolderPath: text("drive_folder_path").default("GSB/Course Summaries"),
  fileNameFormat: text("file_name_format").default("[Course] - [Date] Summary"),
  lastCanvasScan: timestamp("last_canvas_scan"),
  canvasSessionExpiry: timestamp("canvas_session_expiry"),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  userId: true,
  driveFolderPath: true,
  fileNameFormat: true,
  lastCanvasScan: true,
  canvasSessionExpiry: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Special types for API and state
export type AssignmentsByDate = {
  date: string;
  dateObj: Date;
  assignments: {
    courseName: string;
    assignments: Assignment[];
  }[];
};

export type CanvasCredentials = {
  username: string;
  password: string;
};

export type ProcessPdfRequest = {
  courseName: string;
  readingDate: string;
  files: {
    name: string;
    content: string; // base64 encoded
  }[];
};
