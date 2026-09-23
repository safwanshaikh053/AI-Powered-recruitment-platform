import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";
import { siteConfig } from "@/config/site";
import { unreadNotificationCount } from "@/services/notification";

export async function Navbar() {
  const session = await auth();
  const unread = session?.user ? await unreadNotificationCount(session.user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse jobs
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/notifications"
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Notifications
                {unread > 0 && (
                  <Badge className="glow-primary-sm bg-primary text-primary-foreground">
                    {unread}
                  </Badge>
                )}
              </Link>
              <Link
                href={`/${session.user.role.toLowerCase()}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
