import NextAuth from "next-auth";
import { fullAuthConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig);
