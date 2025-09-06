import {
  boolean,
  pgTable,
  timestamp,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  createdAt: timestamp("created_at").default(new Date()).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(
    () => new Date()
  ),
});

export const noticesTable = pgTable("notices", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: varchar("content", { length: 1000 }).notNull(),
  authorId: uuid("author_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  expiresAt: timestamp("expires_at")
    .notNull()
    .default(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Default to 7 days from now
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").default(new Date()).notNull(),
  updatedAt: timestamp("updated_at")
    .default(new Date())
    .$onUpdate(() => new Date()),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  message: varchar("message", { length: 500 }).notNull(),
  authorId: uuid("author_id")
    .references(() => usersTable.id)
    // .onDelete("CASCADE")
    .notNull(),
  createdAt: timestamp("created_at").default(new Date()).notNull(),
});

// Create indexes for performance
export const indexes = [
  { table: "notices", column: "created_at", order: "DESC" },
  { table: "notices", column: "category" },
  { table: "notices", column: "is_pinned" },
  { table: "chat_messages", column: "created_at", order: "DESC" },
];

// Export the database schema
// export const schema = {
//   users: usersTable,
//   notices: noticesTable,
//   chatMessages: chatMessagesTable,
//   indexes,
// };

// -- Create indexes for performance
// CREATE INDEX idx_notices_created_at ON notices(created_at DESC);
// CREATE INDEX idx_notices_category ON notices(category);
// CREATE INDEX idx_notices_pinned ON notices(is_pinned);
// CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

// Type inference exports
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Notice = typeof noticesTable.$inferSelect;
export type NewNotice = typeof noticesTable.$inferInsert;

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewChatMessage = typeof chatMessagesTable.$inferInsert;
