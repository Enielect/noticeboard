"use server";

import db from "@/db/db";
import {
  ChatMessage,
  chatMessagesTable,
  Notice,
  noticesTable,
  User,
  usersTable,
} from "@/db/schema";
import { eq, gte, sql, and } from "drizzle-orm";
import jwt from 'jsonwebtoken'
import { desc } from "drizzle-orm";

export interface NoticeWithAuthor extends Notice {
  authorName: string;
}

export interface ChatMessageWithAuthor extends ChatMessage {
  authorName: string;
}

export interface CreateUserData {
  email: string;
  studentId: string;
  fullName: string;
  passwordHash: string;
  verificationToken: string;
}

export interface CreateNoticeData {
  title: string;
  content: string;
  authorId: string;
  category: string;
  priority: "normal" | "medium" | "high";
  expiresAt?: Date | null;
}

// Database helper functions with proper typing
export async function getUser(email: string): Promise<User | null> {
  const result = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  return result || null;
}


export async function getUserById(id: string): Promise<User | null> {
  const result = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, id),
  });
  return result || null;
}

export async function getUserByMatric(studentId: string): Promise<User | null> {
  const result = await db.query.usersTable.findFirst({
    where: eq(usersTable.studentId, studentId),
  });
  return result || null;
}

export async function createUser(userData: CreateUserData): Promise<User> {
  const { email, studentId, fullName, passwordHash, verificationToken } =
    userData;
  const result = await db
    .insert(usersTable)
    .values({
      email,
      studentId,
      fullName,
      passwordHash,
      verificationToken,
      isVerified: false,
    })
    .returning();

  return result[0];
}

export async function verifyUser(token: string): Promise<User[]> {
  const result = await db
    .update(usersTable)
    .set({
      isVerified: true,
      verificationToken: null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.verificationToken, token))
    .returning();
  return result;
}

export async function getNotices(
  limit: number = 50
): Promise<NoticeWithAuthor[]> {
  const result = await db.query.noticesTable.findMany({
    where: gte(noticesTable.expiresAt, new Date()),
    orderBy: [desc(noticesTable.isPinned), desc(noticesTable.createdAt)],
    limit: limit,
  });

  return Promise.all(
    result.map(async (notice) => ({
      ...notice,
      authorName: notice.authorId
        ? (await getUserById(notice.authorId))?.fullName || "Unknown User"
        : "Unknown User",
    }))
  );
}

export async function getNoticesByCategory(
  category: string,
  limit: number = 50
): Promise<NoticeWithAuthor[]> {
  const result = await db.query.noticesTable.findMany({
    where: eq(noticesTable.category, category),
    orderBy: [desc(noticesTable.isPinned), desc(noticesTable.createdAt)],
    limit: limit,
  });

  return Promise.all(
    result.map(async (notice) => ({
      ...notice,
      authorName: notice.authorId
        ? (await getUserById(notice.authorId))?.fullName || "Unknown User"
        : "Unknown User",
    }))
  );
}

export async function searchNotices(
  searchTerm: string,
  limit: number = 50
): Promise<NoticeWithAuthor[]> {
  const result = await db.query.noticesTable.findMany({
    where: sql`(title ILIKE ${`%${searchTerm}%`} OR content ILIKE ${`%${searchTerm}%`}) AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
    orderBy: [desc(noticesTable.isPinned), desc(noticesTable.createdAt)],
    limit: limit,
  });

  return Promise.all(
    result.map(async (notice) => ({
      ...notice,
      authorName: notice.authorId
        ? (await getUserById(notice.authorId))?.fullName || "Unknown User"
        : "Unknown User",
    }))
  );
}

export async function createNotice(
  noticeData: CreateNoticeData
): Promise<Notice> {
  const { title, content, authorId, category, priority, expiresAt } =
    noticeData;
  const result = await db
    .insert(noticesTable)
    .values({
      title,
      content,
      authorId,
      category,
      priority,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    })
    .returning();

  return result[0];
}

export async function updateNotice(
  id: string,
  updates: Partial<CreateNoticeData>
): Promise<Notice | null> {
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== null)
  );

  const result = await db
    .update(noticesTable)
    .set({
      ...filteredUpdates,
      updatedAt: new Date(),
    })
    .where(eq(noticesTable.id, id))
    .returning();

  return result[0] || null;
}

export async function deleteNotice(
  id: string,
  authorId: string
): Promise<boolean> {
  const result = await db
    .delete(noticesTable)
    .where(and(eq(noticesTable.id, id), eq(noticesTable.authorId, authorId)))
    .returning();

  return result[0] !== undefined;
}

export async function pinNotice(
  id: string,
  isPinned: boolean
): Promise<Notice | null> {
  const result = await db
    .update(noticesTable)
    .set({
      isPinned,
      updatedAt: new Date(),
    })
    .where(eq(noticesTable.id, id))
    .returning();

  return result[0] || null;
}

export async function getChatMessages(
  limit: number = 100
): Promise<ChatMessageWithAuthor[]> {
  const result = await db.query.chatMessagesTable.findMany({
    orderBy: [desc(chatMessagesTable.createdAt)],
    limit: limit,
  });
  return Promise.all(
    result.map(async (message) => ({
      ...message,
      authorName: message.authorId
        ? (await getUserById(message.authorId))?.fullName || "Unknown User"
        : "Unknown User",
    }))
  );
}

export async function createChatMessage(
  message: string,
  authorId: string
): Promise<ChatMessage> {
  const result = await db
    .insert(chatMessagesTable)
    .values({
      message,
      authorId,
    })
    .returning();

  return result[0];
}

export async function deleteChatMessage(
  id: string,
  authorId: string
): Promise<boolean> {
  const result = await db
    .delete(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.id, id),
        eq(chatMessagesTable.authorId, authorId)
      )
    )
    .returning();

  return result[0] !== undefined;
}

// Statistics and analytics functions
export async function getNoticeStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}> {
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(noticesTable);

  const categoryResult = await db
    .select({
      category: noticesTable.category,
      count: sql<number>`count(*)`,
    })
    .from(noticesTable)
    .groupBy(noticesTable.category);

  const priorityResult = await db
    .select({
      priority: noticesTable.priority,
      count: sql<number>`count(*)`,
    })
    .from(noticesTable)
    .groupBy(noticesTable.priority);

  const byCategory = categoryResult.reduce(
    (acc, row) => {
      if (row.category) {
        acc[row.category] = row.count;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const byPriority = priorityResult.reduce(
    (acc, row) => {
      if (row.priority) {
        acc[row.priority] = row.count;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: totalResult[0]?.count || 0,
    byCategory,
    byPriority,
  };
}

// Health check function
