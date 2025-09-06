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
import { eq, gte, sql, and, DrizzleError } from "drizzle-orm";
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

export interface DatabaseResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Database helper functions with proper typing and error handling
export async function getUser(
  email: string
): Promise<DatabaseResult<User | null>> {
  try {
    const result = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });
    return { data: result || null, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch user by email: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function getUserById(
  id: string
): Promise<DatabaseResult<User | null>> {
  try {
    const result = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, id),
    });
    return { data: result || null, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch user by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function getUserByMatric(
  studentId: string
): Promise<DatabaseResult<User | null>> {
  try {
    const result = await db.query.usersTable.findFirst({
      where: eq(usersTable.studentId, studentId),
    });
    return { data: result || null, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch user by student ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function createUser(
  userData: CreateUserData
): Promise<DatabaseResult<User>> {
  try {
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
    return { data: result[0], success: true };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {

    // Handling a unique constraint violation error
    const pgErr = error.cause || error;
    if (pgErr.code === "23505") {
      const detail = pgErr.detail;

      if (detail?.includes("student_id")) {
        return {
          error:
            "This student ID is already registered. Please use a different student ID or contact support.",
          success: false,
        };
      }

      if (detail?.includes("email")) {
        return {
          error:
            "This email address is already registered. Please use a different email or try logging in.",
          success: false,
        };
      }

      // Generic unique constraint error
      return {
        error:
          "This information is already registered. Please check your details.",
        success: false,
      };
    }
    return {
      error: `Failed to create user: ${error instanceof DrizzleError || error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function verifyUser(
  token: string
): Promise<DatabaseResult<User[]>> {
  try {
    const result = await db
      .update(usersTable)
      .set({
        isVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.verificationToken, token))
      .returning();
    return { data: result, success: true };
  } catch (error) {
    return {
      error: `Failed to verify user: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function getNotices(
  limit: number = 50
): Promise<DatabaseResult<NoticeWithAuthor[]>> {
  try {
    const result = await db.query.noticesTable.findMany({
      where: gte(noticesTable.expiresAt, new Date()),
      orderBy: [desc(noticesTable.isPinned), desc(noticesTable.createdAt)],
      limit: limit,
    });

    const noticesWithAuthors = await Promise.all(
      result.map(async (notice) => {
        const userResult = await getUserById(notice.authorId || "");
        return {
          ...notice,
          authorName:
            userResult.success && userResult.data?.fullName
              ? userResult.data.fullName
              : "Unknown User",
        };
      })
    );

    return { data: noticesWithAuthors, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch notices: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function getNoticesByCategory(
  category: string,
  limit: number = 50
): Promise<DatabaseResult<NoticeWithAuthor[]>> {
  try {
    const result = await db.query.noticesTable.findMany({
      where: eq(noticesTable.category, category),
      orderBy: [desc(noticesTable.isPinned), desc(noticesTable.createdAt)],
      limit: limit,
    });

    const noticesWithAuthors = await Promise.all(
      result.map(async (notice) => {
        const userResult = await getUserById(notice.authorId || "");
        return {
          ...notice,
          authorName:
            userResult.success && userResult.data?.fullName
              ? userResult.data.fullName
              : "Unknown User",
        };
      })
    );

    return { data: noticesWithAuthors, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch notices by category: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function searchNotices(
  searchTerm: string,
  limit: number = 50
): Promise<DatabaseResult<NoticeWithAuthor[]>> {
  try {
    const result = await db.query.noticesTable.findMany({
      where: sql`(title ILIKE ${`%${searchTerm}%`} OR content ILIKE ${`%${searchTerm}%`}) AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
      orderBy: [desc(noticesTable.isPinned), desc(noticesTable.createdAt)],
      limit: limit,
    });

    const noticesWithAuthors = await Promise.all(
      result.map(async (notice) => {
        const userResult = await getUserById(notice.authorId || "");
        return {
          ...notice,
          authorName:
            userResult.success && userResult.data?.fullName
              ? userResult.data.fullName
              : "Unknown User",
        };
      })
    );

    return { data: noticesWithAuthors, success: true };
  } catch (error) {
    return {
      error: `Failed to search notices: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function createNotice(
  noticeData: CreateNoticeData
): Promise<DatabaseResult<Notice>> {
  try {
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
        expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    return { data: result[0], success: true };
  } catch (error) {
    return {
      error: `Failed to create notice: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function updateNotice(
  id: string,
  updates: Partial<CreateNoticeData>
): Promise<DatabaseResult<Notice | null>> {
  try {
    const filteredUpdates = Object.fromEntries(
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    return { data: result[0] || null, success: true };
  } catch (error) {
    return {
      error: `Failed to update notice: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function deleteNotice(
  id: string,
  authorId: string
): Promise<DatabaseResult<boolean>> {
  try {
    const result = await db
      .delete(noticesTable)
      .where(and(eq(noticesTable.id, id), eq(noticesTable.authorId, authorId)))
      .returning();

    return { data: result[0] !== undefined, success: true };
  } catch (error) {
    return {
      error: `Failed to delete notice: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function pinNotice(
  id: string,
  isPinned: boolean
): Promise<DatabaseResult<Notice | null>> {
  try {
    const result = await db
      .update(noticesTable)
      .set({
        isPinned,
        updatedAt: new Date(),
      })
      .where(eq(noticesTable.id, id))
      .returning();

    return { data: result[0] || null, success: true };
  } catch (error) {
    return {
      error: `Failed to pin/unpin notice: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function getChatMessages(
  limit: number = 100
): Promise<DatabaseResult<ChatMessageWithAuthor[]>> {
  try {
    const result = await db.query.chatMessagesTable.findMany({
      orderBy: [desc(chatMessagesTable.createdAt)],
      limit: limit,
    });

    const messagesWithAuthors = await Promise.all(
      result.map(async (message) => {
        const userResult = await getUserById(message.authorId || "");
        return {
          ...message,
          authorName:
            userResult.success && userResult.data?.fullName
              ? userResult.data.fullName
              : "Unknown User",
        };
      })
    );

    return { data: messagesWithAuthors, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch chat messages: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function createChatMessage(
  message: string,
  authorId: string
): Promise<DatabaseResult<ChatMessage>> {
  try {
    const result = await db
      .insert(chatMessagesTable)
      .values({
        message,
        authorId,
      })
      .returning();

    return { data: result[0], success: true };
  } catch (error) {
    return {
      error: `Failed to create chat message: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function deleteChatMessage(
  id: string,
  authorId: string
): Promise<DatabaseResult<boolean>> {
  try {
    const result = await db
      .delete(chatMessagesTable)
      .where(
        and(
          eq(chatMessagesTable.id, id),
          eq(chatMessagesTable.authorId, authorId)
        )
      )
      .returning();

    return { data: result[0] !== undefined, success: true };
  } catch (error) {
    return {
      error: `Failed to delete chat message: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function getNoticeStats(): Promise<
  DatabaseResult<{
    total: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }>
> {
  try {
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

    const stats = {
      total: totalResult[0]?.count || 0,
      byCategory,
      byPriority,
    };

    return { data: stats, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch notice statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}
