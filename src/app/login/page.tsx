import { Suspense } from "react";
import { redirect } from "next/navigation";
import "../styles/login.css";
import LoginForm from "@/app/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/getUser";
import { defaultLandingForRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

/**
 * /login page.
 * If the user is already signed in, send them to their role landing page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    redirect(next || defaultLandingForRole(user.role));
  }

  return (
    <div className="login-shell">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
