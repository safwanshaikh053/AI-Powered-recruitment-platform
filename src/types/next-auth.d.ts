import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CANDIDATE" | "RECRUITER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "CANDIDATE" | "RECRUITER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "CANDIDATE" | "RECRUITER" | "ADMIN";
  }
}
