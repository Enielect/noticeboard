import { NextRequest, NextResponse } from "next/server";
import { EmailTemplate } from "../../../components/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, token } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "Enielect <eniola@enielect.me>",
      to: [email],
      subject: "This is to verify your account",
      react: EmailTemplate({ firstName: name, token }),
    });

    if (error) {
      console.error("Email send error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error("Email route error:", error);
    return NextResponse.json(
      { error: "Failed to send email" }, 
      { status: 500 }
    );
  }
}