import { NextRequest, NextResponse } from "next/server";
import { createUser, getUser } from "@/lib/db";
import {
  hashPassword,
  generateVerificationToken,
  isValidEmail,
  isValidStudentId,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, studentId, fullName, password } = await request.json();

    if (!email || !studentId || !fullName || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please use your university email address" },
        { status: 400 }
      );
    }

    if (!isValidStudentId(studentId)) {
      return NextResponse.json(
        { error: "Invalid Matric Number format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const existingUser = await getUser(email);
    if (!existingUser.success) {
      return NextResponse.json(
        { error: existingUser.error },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const user = await createUser({
      email,
      studentId,
      fullName,
      passwordHash,
      verificationToken,
    });

    if(!user.success) {
      console.error(user.error)
      return NextResponse.json(
        { error: user.error },
        { status: 500 }
      );
    }

    const sendEmail = await fetch(`${process.env.SERVER_URL}/api/auth/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.data?.email,
        name: user.data?.fullName,
        token: verificationToken,
      }),
    });

    if (!sendEmail.ok) {
      const emailError = await sendEmail.text();
      console.error("Email sending failed:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Registration successful. Please check your email for verification.",
      userId: user.data?.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }
      if (error.message.includes("network") || error.message.includes("connection")) {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
