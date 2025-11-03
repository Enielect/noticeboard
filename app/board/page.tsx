import db from "@/db/db";
import React from "react";
import StudentNoticeBoardApp from "./BoardPage";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getNotices, getUserById } from "@/lib/db";
import { redirect } from "next/navigation";

const BoardPage = async () => {
  const token = (await cookies()).get("auth-token")?.value;

  const user = verifyToken(token || "") ?? { email: "", userId: "", type: "" };
  const userData = await getUserById(user.userId);
  const userVerifiedPromise = db.query.usersTable.findFirst({
    where: (usersTable, { eq, and }) =>
      and(eq(usersTable.email, user.email), eq(usersTable.isVerified, true)),
  });

  const [isUserVerified, notices] = await Promise.allSettled([
    userVerifiedPromise,
    getNotices(),
  ]);

  if (userData.success === false || !userData.data) {
    redirect("/login");
  }

  //first time I am uing the allSettled method, you have to check if the promise was fulfilled or rejected, then access the value or reason property respectively
  const noticesData =
    notices.status === "fulfilled"
      ? notices.value.data
        ? notices.value.data
        : []
      : [];

  return (
    <div
      className={`bg-cover bg-center bg-no-repeat bg-fixed min-h-screen`}
      style={{ backgroundImage: "url('/background.jpeg')" }}
    >
      {isUserVerified ? (
        <StudentNoticeBoardApp
          initialNotices={noticesData}
          user={userData.data}
        />
      ) : (
        <p>Check your email to verify your account</p>
      )}
    </div>
  );
};

export default BoardPage;
