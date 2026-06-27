import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-6">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo showTagline />
        </div>
        <AuthForm mode="login" />
        <p className="mt-6 text-center text-sm text-slate-400">
          New to SHFTD?{" "}
          <Link href="/signup" className="text-electric-300 hover:text-electric-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
