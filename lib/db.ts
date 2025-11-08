"use server";

import { db } from "@/db/db";
import {
  ChatMessage,
  chatMessagesTable,
  Notice,
  noticesTable,
  User,
  usersTable,
} from "@/db/schema";
import type {
  CreateUserData,
  CreateNoticeData,
  DatabaseResult,
  ChatMessageWithAuthor,
  NoticeWithAuthor,
} from "@/lib/types/db";
import { eq, gte, sql, DrizzleError } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection error
      const isConnectionError =
        error.code === "ETIMEDOUT" ||
        error.message?.includes("timeout") ||
        error.message?.includes("connection") ||
        error.message?.includes("ECONNRESET");

      if (isConnectionError && attempt < maxRetries) {
        console.log(`Database retry ${attempt}/${maxRetries}:`, error.message);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError!;
}

export async function getUser(
  email: string
): Promise<DatabaseResult<User | null>> {
  return withRetry(async () => {
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
  });
}

export async function getUserById(
  id: string
): Promise<DatabaseResult<User | null>> {
  return withRetry(async () => {
    try {
      const result = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, id),
      });
      console.log(result, "result from getting a user");
      return { data: result || null, success: true };
    } catch (error) {
      return {
        error: `Failed to fetch user by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      };
    }
  });
}

export async function getUserByMatric(
  studentId: string
): Promise<DatabaseResult<User | null>> {
  return withRetry(async () => {
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
  });
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
    // Use JOIN instead of separate queries
    const result = await db
      .select({
        id: noticesTable.id,
        title: noticesTable.title,
        content: noticesTable.content,
        category: noticesTable.category,
        priority: noticesTable.priority,
        isPinned: noticesTable.isPinned,
        authorId: noticesTable.authorId,
        expiresAt: noticesTable.expiresAt,
        createdAt: noticesTable.createdAt,
        updatedAt: noticesTable.updatedAt,
        authorName: usersTable.fullName,
      })
      .from(noticesTable)
      .leftJoin(usersTable, eq(noticesTable.authorId, usersTable.id))
      .where(gte(noticesTable.expiresAt, new Date()))
      .orderBy(desc(noticesTable.isPinned), desc(noticesTable.createdAt))
      .limit(limit);

    const noticesWithAuthors = result.map((msg) => ({
      ...msg,
      authorName: msg.authorName || "Unknown User",
    }));

    return { data: noticesWithAuthors, success: true };
  } catch (error) {
    return {
      error: `Failed to fetch notices: ${error instanceof Error ? error.message : "Unknown error"}`,
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

export async function getChatMessages(
  limit: number = 15
): Promise<DatabaseResult<ChatMessageWithAuthor[]>> {
  try {
    // Use JOIN instead of separate queries
    const result = await db
      .select({
        id: chatMessagesTable.id,
        message: chatMessagesTable.message,
        authorId: chatMessagesTable.authorId,
        createdAt: chatMessagesTable.createdAt,
        authorName: usersTable.fullName,
      })
      .from(chatMessagesTable)
      .leftJoin(usersTable, eq(chatMessagesTable.authorId, usersTable.id))
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(limit);

    const messagesWithAuthors = result.map((msg) => ({
      ...msg,
      authorName: msg.authorName || "Unknown User",
    }));

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
