"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WaveSvg } from "../components/wave-svg";



export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      await res.json();
      router.push("/board");
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-0 left-0 w-full h-[18rem] overflow-hidden leading-none rotate-180">
        <WaveSvg />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="container whitespace-nowrap -left-12">
          <h2 className="note ">Sign In To Your Account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-3">
            <div>
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#1A0EFD] focus:border-[#1A0EFD] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#1A0EFD] focus:border-[#1A0EFD] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#1A0EFD] hover:bg-[#1A0EFD]/[.8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A0EFD] disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Do not have an account yet?{" "}
            <a
              href="/register"
              className="font-medium text-[#1A0EFD] hover:underline"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[18rem] overflow-hidden leading-none">
        <WaveSvg />
      </div>
    </div>
  );
}
