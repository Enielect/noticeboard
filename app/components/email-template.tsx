import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  token: string;
}

export function EmailTemplate({ firstName, token }: EmailTemplateProps) {
  return (
    <div>
      <h1>Welcome, {firstName}!</h1>
      <p>
        Follow this{" "}
        <a href={`${process.env.SERVER_URL}/api/auth/verify?token=${token}`}>link</a> to
        verify your account
      </p>
    </div>
  );
}
