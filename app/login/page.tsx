"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const WaveSvg = () => (
  <svg
    id="wave"
    style={{ transform: "rotate(0deg)", transition: "0.3s" }}
    viewBox="0 0 1440 310"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sw-gradient-0" x1="0" x2="0" y1="1" y2="0">
        <stop stopColor="rgba(19.582, 16.376, 213.876, 1)" offset="0%"></stop>
        <stop stopColor="rgba(12.075, 54.136, 202.492, 1)" offset="100%"></stop>
      </linearGradient>
    </defs>
    <path
      style={{ transform: "translate(0, 0px)", opacity: 1 }}
      fill="url(#sw-gradient-0)"
      d="M0,93L96,279L192,0L288,31L384,124L480,93L576,0L672,217L768,248L864,0L960,93L1056,217L1152,155L1248,62L1344,186L1440,279L1536,0L1632,248L1728,124L1824,124L1920,62L2016,0L2112,62L2208,62L2304,217L2304,310L2208,310L2112,310L2016,310L1920,310L1824,310L1728,310L1632,310L1536,310L1440,310L1344,310L1248,310L1152,310L1056,310L960,310L864,310L768,310L672,310L576,310L480,310L384,310L288,310L192,310L96,310L0,310Z"
    ></path>
    <defs>
      <linearGradient id="sw-gradient-1" x1="0" x2="0" y1="1" y2="0">
        <stop stopColor="rgba(62, 89.718, 243, 1)" offset="0%"></stop>
        <stop stopColor="rgba(25.609, 13.636, 252.581, 1)" offset="100%"></stop>
      </linearGradient>
    </defs>
    <path
      style={{ transform: "translate(0, 50px)", opacity: 0.9 }}
      fill="url(#sw-gradient-1)"
      d="M0,31L96,279L192,0L288,62L384,93L480,248L576,248L672,0L768,93L864,186L960,248L1056,124L1152,124L1248,124L1344,93L1440,248L1536,217L1632,155L1728,217L1824,186L1920,186L2016,186L2112,155L2208,186L2304,31L2304,310L2208,310L2112,310L2016,310L1920,310L1824,310L1728,310L1632,310L1536,310L1440,310L1344,310L1248,310L1152,310L1056,310L960,310L864,310L768,310L672,310L576,310L480,310L384,310L288,310L192,310L96,310L0,310Z"
    ></path>
    <defs>
      <linearGradient id="sw-gradient-2" x1="0" x2="0" y1="1" y2="0">
        <stop stopColor="rgba(62, 83.587, 243, 1)" offset="0%"></stop>
        <stop stopColor="rgba(14.96, 11, 255, 1)" offset="100%"></stop>
      </linearGradient>
    </defs>
    <path
      style={{ transform: "translate(0, 100px)", opacity: 0.8 }}
      fill="url(#sw-gradient-2)"
      d="M0,124L96,279L192,186L288,279L384,279L480,62L576,62L672,248L768,124L864,31L960,31L1056,155L1152,217L1248,155L1344,124L1440,0L1536,155L1632,31L1728,186L1824,186L1920,279L2016,93L2112,279L2208,248L2304,186L2304,310L2208,310L2112,310L2016,310L1920,310L1824,310L1728,310L1632,310L1536,310L1440,310L1344,310L1248,310L1152,310L1056,310L960,310L864,310L768,310L672,310L576,310L480,310L384,310L288,310L192,310L96,310L0,310Z"
    ></path>
    <defs>
      <linearGradient id="sw-gradient-3" x1="0" x2="0" y1="1" y2="0">
        <stop stopColor="rgba(62, 101.981, 243, 1)" offset="0%"></stop>
        <stop stopColor="rgba(11, 97.958, 255, 1)" offset="100%"></stop>
      </linearGradient>
    </defs>
    <path
      style={{ transform: "translate(0, 150px)", opacity: 0.7 }}
      fill="url(#sw-gradient-3)"
      d="M0,62L96,124L192,93L288,155L384,186L480,31L576,124L672,93L768,248L864,62L960,217L1056,248L1152,93L1248,62L1344,0L1440,248L1536,93L1632,155L1728,217L1824,31L1920,217L2016,0L2112,279L2208,93L2304,31L2304,310L2208,310L2112,310L2016,310L1920,310L1824,310L1728,310L1632,310L1536,310L1440,310L1344,310L1248,310L1152,310L1056,310L960,310L864,310L768,310L672,310L576,310L480,310L384,310L288,310L192,310L96,310L0,310Z"
    ></path>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
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
