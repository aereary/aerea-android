import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userStates = sqliteTable("user_states", {
  userId: text("user_id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sketchPages = sqliteTable(
  "sketch_pages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    pageStyle: text("page_style").notNull(),
    objectKey: text("object_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("sketch_pages_user_updated_idx").on(
      table.userId,
      table.updatedAt,
    ),
  ],
);

export const studyFiles = sqliteTable(
  "study_files",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    mediaType: text("media_type").notNull(),
    kind: text("kind").notNull(),
    size: integer("size").notNull(),
    objectKey: text("object_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("study_files_user_updated_idx").on(
      table.userId,
      table.updatedAt,
    ),
  ],
);
