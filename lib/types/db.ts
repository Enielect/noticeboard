import { ChatMessage, Notice } from "@/db/schema";

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
