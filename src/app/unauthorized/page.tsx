import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-primary">You don&apos;t have access to this page</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your account doesn&apos;t have permission to view this. If you think that&apos;s wrong, ask an admin to check your role.
      </p>
      <Link href="/" className={buttonVariants()}>
        Go to my dashboard
      </Link>
    </div>
  );
}
