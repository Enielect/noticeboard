'use client'

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Users,
  Bell,
  PlusCircle,
  Calendar,
  Clock,
  User,
  LogOut,
  Pin,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Filter,
} from "lucide-react";

// Main App Component

interface Notification {
  id: number;
  message: string;
  type: string;
  timestamp: Date;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  author_name: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
}

interface TChatMessages {
  id: number;
  message: string;
  author_name: string;
  created_at: string;
}

interface TUser {
  id: number;
  email: string;
  fullName: string;
  studentId: string;
}
export default function StudentNoticeBoardApp() {
  const [currentUser, setCurrentUser] = useState<TUser | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [chatMessages, setChatMessages] = useState<TChatMessages[]>([]);
  const [activeTab, setActiveTab] = useState("notices");
  const [newMessage, setNewMessage] = useState("");
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "normal",
    expiresAt: "",
  });

  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [connectedUsers, setConnectedUsers] = useState(23);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ws = useRef<WebSocket | { send: (data: string) => void } | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    // Initialize mock user
    setCurrentUser({
      id: 1,
      email: "john.doe@university.edu",
      fullName: "John Doe",
      studentId: "2024001234",
    });

    // Initialize mock notices
    // Define notice type

    setNotices([
      {
        id: 1,
        title: "Important: Mid-term Exam Schedule Released",
        content:
          "The mid-term examination schedule has been released. Please check your student portal for detailed timing and venue information. All students must carry their ID cards during the examination.",
        author_name: "Academic Office",
        category: "academic",
        priority: "high",
        is_pinned: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Library Hours Extended During Finals",
        content:
          "The university library will extend its operating hours during the final exam period. New timings: 6:00 AM - 12:00 AM from Monday to Sunday.",
        author_name: "Library Staff",
        category: "facilities",
        priority: "normal",
        is_pinned: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        title: "Student Council Elections - Nominations Open",
        content:
          "Nominations for Student Council elections are now open. Interested candidates can submit their applications at the student affairs office by Friday.",
        author_name: "Student Affairs",
        category: "events",
        priority: "normal",
        is_pinned: false,
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ]);

    // Initialize mock chat messages
    setChatMessages([
      {
        id: 1,
        message:
          "Hey everyone! Has anyone started preparing for the mid-terms yet?",
        author_name: "Sarah Johnson",
        created_at: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: 2,
        message:
          "Yes! I've been studying for the past week. The schedule looks intense.",
        author_name: "Mike Chen",
        created_at: new Date(Date.now() - 240000).toISOString(),
      },
      {
        id: 3,
        message:
          "Does anyone know if the library study rooms are available for booking?",
        author_name: "Emma Davis",
        created_at: new Date(Date.now() - 180000).toISOString(),
      },
    ]);

    // Simulate WebSocket connection
    // In real implementation, this would connect to your WebSocket server
    interface MockWebSocket {
      send: (data: string) => void;
    }

    interface ChatMessageData {
      message: string;
      author_name: string;
    }

    interface WebSocketMessage {
      type: string;
      data: ChatMessageData;
    }

    const mockWebSocket: MockWebSocket = {
      send: (data: string) => {
        console.log("Sending:", data);
        // Simulate receiving the message back
        setTimeout(() => {
          const message: WebSocketMessage = JSON.parse(data);
          if (message.type === "chat") {
            setChatMessages((prev) => [
              ...prev,
              {
                ...message.data,
                id: Date.now(),
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }, 100);
      },
    };
    ws.current = mockWebSocket;

    return () => {
      if (ws.current && ws.current.close) {
        ws.current.close();
      }
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Handle sending chat messages
  const handleSendMessage = () => {
    if (newMessage.trim() && ws.current && currentUser) {
      const messageData = {
        type: "chat",
        data: {
          message: newMessage.trim(),
          author_name: currentUser.fullName,
        },
      };

      ws.current.send(JSON.stringify(messageData));
      setNewMessage("");
    }
  };

  // Handle creating new notice
  const handleCreateNotice = () => {
    if (newNotice.title.trim() && newNotice.content.trim() && currentUser) {
      const notice = {
        id: Date.now(),
        ...newNotice,
        author_name: currentUser.fullName,
        is_pinned: false,
        created_at: new Date().toISOString(),
      };

      setNotices((prev) => [notice, ...prev]);
      setNewNotice({
        title: "",
        content: "",
        category: "general",
        priority: "normal",
        expiresAt: "",
      });
      setShowNoticeForm(false);

      // Show success notification
      addNotification("Notice created successfully!", "success");
    }
  };

  // Add notification

  const addNotification = (message: string, type: string = "info"): void => {
    const notification: Notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications((prev) => [notification, ...prev]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 3000);
  };

  // Filter notices
  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-blue-100 text-blue-800";
      case "events":
        return "bg-purple-100 text-purple-800";
      case "facilities":
        return "bg-green-100 text-green-800";
      case "announcements":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Student Notice Board
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{connectedUsers} online</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-start space-x-2">
                              {notification.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(
                                    notification.timestamp.toISOString()
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser?.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentUser?.studentId}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("notices")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "notices"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Notice Board</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "chat"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Live Chat</span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Notice Board Tab */}
              {activeTab === "notices" && (
                <div className="p-6">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search notices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        <option value="academic">Academic</option>
                        <option value="events">Events</option>
                        <option value="facilities">Facilities</option>
                        <option value="announcements">Announcements</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setShowNoticeForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>New Notice</span>
                    </button>
                  </div>

                  {/* Notices List */}
                  <div className="space-y-4">
                    {filteredNotices.map((notice) => (
                      <div
                        key={notice.id}
                        className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                          notice.is_pinned
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {notice.is_pinned && (
                              <Pin className="w-4 h-4 text-yellow-600" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notice.title}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                notice.priority
                              )}`}
                            >
                              {notice.priority}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                notice.category
                              )}`}
                            >
                              {notice.category}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {notice.content}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{notice.author_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(notice.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Chat Tab */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-96">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {message.author_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={500}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {newMessage.length}/500 characters
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Total Notices</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {notices.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Chat Messages</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {chatMessages.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Online Users</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {connectedUsers}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">New notice posted</span>
                  <span className="text-gray-400">2m ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">User joined chat</span>
                  <span className="text-gray-400">5m ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Notice updated</span>
                  <span className="text-gray-400">10m ago</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {["academic", "events", "facilities", "announcements"].map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-100 text-blue-800"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="capitalize">{category}</span>
                      <span className="float-right text-xs">
                        {notices.filter((n) => n.category === category).length}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Notice Modal */}
      {showNoticeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Notice
              </h2>
              <button
                onClick={() => setShowNoticeForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notice title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, content: e.target.value })
                  }
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notice content"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newNotice.category}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="events">Events</option>
                    <option value="facilities">Facilities</option>
                    <option value="announcements">Announcements</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newNotice.priority}
                    onChange={(e) =>
                      setNewNotice({ ...newNotice, priority: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newNotice.expiresAt}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, expiresAt: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNoticeForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotice}
                disabled={!newNotice.title.trim() || !newNotice.content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
