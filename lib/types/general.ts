export interface Notification {
  id: number;
  message: string;
  type: string;
  timestamp: Date;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorName?: string; // I have to derive the authorName from the id
  category: string;
  priority: string;
  isPinned: boolean;
  createdAt: Date | string;
}

export interface TChatMessages {
  id: number;
  message: string;
  authorName: string;
  created_at: string;
}
export interface TUser {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
}
