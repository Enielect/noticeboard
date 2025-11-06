import { verifyUser } from "@/lib/db";
import { redirect } from "next/navigation";
import { VerifyComponent } from "./VerifyComponent";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};
export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const token = (await searchParams).token;

  const result = await verifyUser(token ?? "");

  if (!result.success && result.error) {
    redirect("/register");
  }

  return <VerifyComponent />;
}
