import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUser(email);
    if (!user.success || !user.data) {
      console.log("User not found:", email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.data.passwordHash);
    if (!isValidPassword) {
      console.log("Invalid password for user:", email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.data.isVerified) {
      console.log("User not verified:", email);
      return NextResponse.json(
        { error: "Please verify your email address first" },
        { status: 401 }
      );
    }

    // This is to generate an access Token
    const token = generateToken(user.data.id, user.data.email);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.data.id,
        email: user.data.email,
        fullName: user.data.fullName,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
