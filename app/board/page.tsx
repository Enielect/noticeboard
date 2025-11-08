import { db } from "@/db/db";
import React from "react";
import StudentNoticeBoardApp from "./BoardPage";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getChatMessages, getNotices, getUserById, withRetry } from "@/lib/db";
import { redirect } from "next/navigation";

const BoardPage = async () => {
  const token = (await cookies()).get("auth-token")?.value;

  if (!token) redirect("/login");

  const user = verifyToken(token) ?? { email: "", userId: "", type: "" };
  const userData = await withRetry(() => getUserById(user.userId));

  if (!userData?.success || !userData.data) {
    console.log("User data fetch failed after retries, redirecting to login");
    redirect("/login");
  }

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
