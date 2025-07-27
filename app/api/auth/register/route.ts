import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/db';
import { hashPassword, generateVerificationToken, isValidEmail, isValidStudentId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, studentId, fullName, password } = await request.json();

    // Validation
    if (!email || !studentId || !fullName || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please use your university email address' },
        { status: 400 }
      );
    }

    if (!isValidStudentId(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUser(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const user = await createUser({
      email,
      studentId,
      fullName,
      passwordHash,
      verificationToken
    });

    // In production, send verification email here
    console.log(`Verification token for ${email}: ${verificationToken}`);

    return NextResponse.json({
      message: 'Registration successful. Please check your email for verification.',
      userId: user.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}