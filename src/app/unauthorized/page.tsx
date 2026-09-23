export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">Please sign in</h1>
      <p className="text-muted-foreground">
        You need to be logged in to view this page.
      </p>
    </main>
  );
}
