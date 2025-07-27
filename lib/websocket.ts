import { kv } from '@vercel/kv';

class WebSocketManager {
  private connections: Map<string, WebSocket>;

  constructor() {
    this.connections = new Map();
  }

  addConnection(userId: string, ws: WebSocket) {
    this.connections.set(userId, ws);
    console.log(`User ${userId} connected. Total connections: ${this.connections.size}`);
  }

  removeConnection(userId: string) {
    this.connections.delete(userId);
    console.log(`User ${userId} disconnected. Total connections: ${this.connections.size}`);
  }

  async broadcastMessage(message: any, excludeUserId: string | null = null) {
    const messageData = JSON.stringify(message);
    
    // Store in KV for persistence
    await kv.lpush('chat_messages', messageData);
    await kv.ltrim('chat_messages', 0, 99); // Keep last 100 messages

    // Broadcast to all connected clients
    this.connections.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === 1) {
        ws.send(messageData);
      }
    });
  }

  async broadcastNotice(notice: any) {
    const noticeData = JSON.stringify({
      type: 'notice',
      data: notice
    });

    this.connections.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(noticeData);
      }
    });
  }

  getConnectionCount() {
    return this.connections.size;
  }
}

export const wsManager = new WebSocketManager();