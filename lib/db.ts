import { sql } from '@vercel/postgres';

interface User {
    id: string;
    email: string;
    student_id: string;
    full_name: string;
    password_hash: string;
    verification_token: string;
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
}

interface Notice {
    id: number;
    title: string;
    content: string;
    author_id: number;
    category: string;
    priority: string;
    expires_at: Date | null;
    is_pinned: boolean;
    created_at: Date;
    updated_at: Date;
}

interface NoticeWithAuthor extends Notice {
    author_name: string;
}

interface ChatMessage {
    id: number;
    message: string;
    author_id: number;
    created_at: Date;
}

interface ChatMessageWithAuthor extends ChatMessage {
    author_name: string;
}

interface UserData {
    email: number;
    studentId: string;
    fullName: string;
    passwordHash: string;
    verificationToken: string;
    is_verified?: boolean; // Optional, default is false
}

interface NoticeData {
    title: string;
    content: string;
    authorId: number;
    category: string;
    priority: string;
    expiresAt: Date | null;
}

interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    try {
        const result = await sql.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function getUser(email: string): Promise<User | null> {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function createUser(userData: UserData) {
    const { email, studentId, fullName, passwordHash, verificationToken, is_verified = false } = userData;
    const result = await query(
        `INSERT INTO users (email, student_id, full_name, password_hash, verification_token, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name`,
        [email, studentId, fullName, passwordHash, verificationToken, is_verified]
    );
    return result.rows[0];
}

export async function getNotices(limit = 50) {
  const result = await query(`
    SELECT n.*, u.full_name as author_name 
    FROM notices n 
    JOIN users u ON n.author_id = u.id 
    ORDER BY n.is_pinned DESC, n.created_at DESC 
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function createNotice(noticeData: NoticeData) {
  const { title, content, authorId, category, priority, expiresAt } = noticeData;
  const result = await query(`
    INSERT INTO notices (title, content, author_id, category, priority, expires_at) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *
  `, [title, content, authorId, category, priority, expiresAt]);
  return result.rows[0];
}

export async function getChatMessages(limit = 100) {
  const result = await query(`
    SELECT cm.*, u.full_name as author_name 
    FROM chat_messages cm 
    JOIN users u ON cm.author_id = u.id 
    ORDER BY cm.created_at DESC 
    LIMIT $1
  `, [limit]);
  return result.rows.reverse();
}

export async function createChatMessage(message: ChatMessage, authorId: number) {
  const result = await query(
    'INSERT INTO chat_messages (message, author_id) VALUES ($1, $2) RETURNING *',
    [message, authorId]
  );
  return result.rows[0];
}