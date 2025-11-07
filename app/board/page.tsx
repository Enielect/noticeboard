import { db } from "@/db/db";
import React from "react";
import StudentNoticeBoardApp from "./BoardPage";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getChatMessages, getNotices, getUserById, withRetry } from "@/lib/db";
import { redirect } from "next/navigation";

const BoardPage = async () => {
  const token = (await cookies()).get("auth-token")?.value;

  const user = verifyToken(token || "") ?? { email: "", userId: "", type: "" };
  const userData = await withRetry(() => getUserById(user.userId));

  if (!userData?.success || !userData.data) {
    console.log("User data fetch failed after retries, redirecting to login");

    // Show error page instead of immediate redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl shadow-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            Connection Failed
          </h2>
          <p className="text-white/90 mb-6">
            We&apos;re having trouble connecting to the server. This might be a
            temporary issue.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <a
              href="/login"
              className="block w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-center"
            >
              Back to Login
            </a>
          </div>
          <p className="text-white/60 text-xs mt-4">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    );
  }

  // Sequential queries to avoid overwhelming the connection
  let isUserVerified = null;
  let noticesData = null;
  let messagesHistory = null;

  try {
    isUserVerified = await db.query.usersTable.findFirst({
      where: (usersTable, { eq, and }) =>
        and(eq(usersTable.email, user.email), eq(usersTable.isVerified, true)),
    });

    if (isUserVerified) {
      [noticesData, messagesHistory] = await Promise.allSettled([
        getNotices(),
        getChatMessages(),
      ]);
    }
    console.log(isUserVerified, "is user verified");
  } catch (error) {
    console.error("Error in BoardPage:", error);
  }

  return (
    <div
      className={`bg-cover bg-center bg-no-repeat bg-fixed min-h-screen`}
      style={{ backgroundImage: "url('/background.jpeg')" }}
    >
      {isUserVerified ? (
        <StudentNoticeBoardApp
          initialNotices={
            noticesData?.status === "fulfilled"
              ? (noticesData.value.data ?? [])
              : []
          }
          initialMessages={
            messagesHistory?.status === "fulfilled"
              ? (messagesHistory.value.data ?? [])
              : []
          }
          user={userData.data}
        />
      ) : (
        <p className="text-2xl text-center">
          Check your email to verify your account
        </p>
      )}
    </div>
  );
};

export default BoardPage;
