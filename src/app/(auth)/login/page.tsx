import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-primary">Camelot Scheduler</h1>
        <p className="text-sm text-muted-foreground">
          Log in to manage availability and showings.
        </p>
      </div>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
