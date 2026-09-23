import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="flex gap-4 border-b border-border pb-3 text-sm">
      <Link href="/admin" className="text-muted-foreground hover:text-foreground">
        Dashboard
      </Link>
      <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
        Users
      </Link>
      <Link href="/admin/companies" className="text-muted-foreground hover:text-foreground">
        Companies
      </Link>
      <Link href="/admin/audit-log" className="text-muted-foreground hover:text-foreground">
        Audit log
      </Link>
    </nav>
  );
}
