import db from "@/db/db";
import React from "react";
import StudentNoticeBoardApp from "./BoardPage";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";

const BoardPage = async () => {
  const token = (await cookies()).get("auth-token")?.value;

  const user = verifyToken(token || "") ?? { email: "", userId: "", type: "" };
  const userData = await getUserById(user.userId);
  const isUserVerified = await db.query.usersTable.findFirst({
    where: (usersTable, { eq, and }) =>
      and(eq(usersTable.email, user.email), eq(usersTable.isVerified, true)),
  });

  if (!userData) {
    redirect("/login");
  }

  if (!token) {
    redirect("/login");
  }

  return (
    <div
      className={`bg-cover bg-center bg-no-repeat bg-fixed min-h-screen`}
      style={{ backgroundImage: "url('/background.jpeg')" }}
    >
      {isUserVerified ? (
        <StudentNoticeBoardApp user={userData} />
      ) : (
        <p>Check your email to verify your account</p>
      )}
    </div>
  );
};

export default BoardPage;
