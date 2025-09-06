import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/db';
import { hashPassword, generateVerificationToken, isValidEmail, isValidStudentId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, studentId, fullName, password } = await request.json();

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
        { error: 'Invalid Matric Number format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const existingUser = await getUser(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
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
      verificationToken
    });

    const sendEmail = await fetch('http://localhost:3000/api/auth/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        name: user.fullName,
        token: verificationToken
      })
    });

    if (!sendEmail.ok) {
      // I need to correct this implementation.
      return NextResponse.json(
        { error: 'Failed to send verification email' },

        { status: 500 }
      );
    }


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