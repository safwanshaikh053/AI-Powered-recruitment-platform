import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// The login form can't know the user's role until after signIn() resolves,
// so it redirects here instead of guessing a destination client-side. This
// page reads the real server-side session and sends them to the right home.
export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(`/${session.user.role.toLowerCase()}`);
}
