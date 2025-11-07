"use client";

import io, { Socket } from "socket.io-client";
import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Users,
  Bell,
  PlusCircle,
  Clock,
  User,
  Pin,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Filter,
} from "lucide-react";
import { logout } from "../action/logout";
import { formatDate, getCategoryColor, getPriorityColor } from "@/lib/utils";

import type { Notification, Notice, TUser } from "@/lib/types/general";
import { ChatMessageWithAuthor } from "@/lib/types/db";

type TNoticeBoardProp = {
  user: TUser;
  initialNotices: Notice[];
  initialMessages: ChatMessageWithAuthor[];
};

export default function StudentNoticeBoardApp({
  user,
  initialNotices,
  initialMessages,
}: TNoticeBoardProp) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [createNoticeLoading, setCreateNoticeLoading] = useState(false);
  const [chatMessages, setChatMessages] =
    useState<ChatMessageWithAuthor[]>(initialMessages);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
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
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    newSocket.on("userCount", (count: number) => {
      setConnectedUsers(count);
    });

    newSocket.on("message", (newMessage) => {
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    newSocket.on("notice", (newNotice) => {
      setNotices((prevNotices) => [newNotice, ...prevNotices]);
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [notices]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleLogout = async () => {
    if (socket) {
      socket.disconnect();
    }
    await logout();
  };

  // Handle sending chat messages
  const handleSendMessage = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSendingMessage(true);
    if (newMessage.trim() && socket?.connected && user) {
      const messageData = {
        id: Date.now(),
        type: "chat",
        message: newMessage.trim(),
        authorName: user.fullName,
        created_at: new Date().toISOString(),
      };

      try {
        console.log("started here");
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: newMessage.trim() }),
        });

        if (!response.ok) {
          addNotification("Failed to send message", "error");
          return;
        }
        console.log("ended here...");
      } catch (err) {
        console.error("Send message error:", err);
        return;
      }

      socket.emit("message", messageData);
      setNewMessage("");
      setIsSendingMessage(false);
    } else if (!socket?.connected) {
      addNotification("Not connected to chat server", "error");
    }
  };

  const handleCreateNotice = async () => {
    if (newNotice.title.trim() && newNotice.content.trim() && user) {
      const notice = {
        title: newNotice.title,
        content: newNotice.content,
        category: newNotice.category,
        authorName: user.fullName,
        priority: newNotice.priority,
        expires_at: newNotice.expiresAt,
        // isPinned: false, (we'll add this feature)
      };

      try {
        setCreateNoticeLoading(true);
        const response = await fetch("/api/notices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notice),
        });

        if (!response.ok) {
          const error = await response.json();
          addNotification(error.message || "Failed to create notice", "error");
          setCreateNoticeLoading(false);
          return;
        }

        const createdNotice = await response.json();
        // setNotices((prev) => [createdNotice.data, ...prev]); // we don't need this since we are using web socket to get the new notice
        socket?.emit("notice", createdNotice.data);
        setNewNotice({
          title: "",
          content: "",
          category: "general",
          priority: "normal",
          expiresAt: "",
        });
        setShowNoticeForm(false);

        addNotification("Notice created successfully!", "success");
      } catch (err) {
        // Check if the error is a network error
        if (err instanceof TypeError && err.message.includes("fetch")) {
          addNotification(
            "Network error: Please check your internet connection",
            "error"
          );
        } else {
          // addNotification("Failed to create notice", "error");
          console.error(err);
        }
      } finally {
        setCreateNoticeLoading(false);
      }
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
      notice?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice?.content?.toLowerCase().includes(searchTerm.toLowerCase()); // why should I be getting undefined here?
    const matchesCategory =
      selectedCategory === "all" || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    //  bg-gradient-to-br from-blue-50 via-white to-purple-50
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/20 backdrop-blur-md shadow-lg border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">
                  Student Notice Board
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>

                <span>{connectedUsers} online</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-white hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
                    />
                  </svg>

                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 text-white p-4 bg-blue-600 rounded-full flex items-center justify-center">
                    {user?.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-white">{user?.studentId}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* I had to bring this element outside of the header parent because of stacking context, from research it seems like 'backdrop-blur' create a new stacking context */}
      {showNotifications && (
        <div className="absolute z-50 bg-white/20 backdrop-blur-md right-[23rem] top-12 mt-2 w-80   rounded-lg shadow-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-white">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-white">
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
                      <p className="text-sm text-white">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white mt-1">
                        {formatDate(notification.timestamp.toISOString())}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm border border-gray-200">
              {" "}
              {/**border */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("notices")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "notices"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-white hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space -x-2">
                      <Bell className="w-4 h-4" />
                      <span>Notice Board</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "chat"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-white hover:text-gray-700 hover:border-gray-300"
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
                          notice.isPinned
                            ? "border-yellow-200 bg-yecreatedAt"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {notice.isPinned && (
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
                              <span>{notice.authorName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatDate(
                                  new Date(notice.createdAt).toISOString()
                                )}
                              </span>
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
                            <p className="text-sm font-medium text-white">
                              {message.authorName}
                            </p>
                            <p className="text-xs text-gray-300">
                              {formatDate(
                                new Date(message.createdAt).toLocaleDateString()
                              )}
                            </p>
                          </div>
                          <p className="bg-gradient-to-r from-blue-500 to-purple-500 text-sm text-white bg-gray-50 rounded-lg px-3 py-2">
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
                        onKeyDown={
                          (e) => e.key === "Enter" && (() => {}) // handleSendMessage()
                        }
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={500}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSendingMessage}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-white mt-2">
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
            <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-700" />
                    <span className="text-sm text-white">Total Notices</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {notices.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-green-700" />
                    <span className="text-sm text-white">Chat Messages</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {chatMessages.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-700" />
                    <span className="text-sm text-white">Online Users</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {connectedUsers}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-white">New notice posted</span>
                  <span className="text-gray-400">2m ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white">User joined chat</span>
                  <span className="text-gray-400">5m ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-white">Notice updated</span>
                  <span className="text-gray-400">10m ago</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
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
                          : "text-white hover:bg-gray-100 hover:text-gray-800"
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
                disabled={
                  !newNotice.title.trim() ||
                  !newNotice.content.trim() ||
                  createNoticeLoading
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createNoticeLoading ? "Creating..." : "Create Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
