// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function safeEqual(a: string, b: string) {
  const abuf = Buffer.from(a);
  const bbuf = Buffer.from(b);
  if (abuf.length !== bbuf.length) return false;
  return crypto.timingSafeEqual(abuf, bbuf);
}

function isBcryptHash(s: string) {
  return s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!credentials?.email || !credentials?.password) return null;
        if (!adminEmail || !adminPassword) return null;
        if (!isBcryptHash(adminPassword)) {
          // 평문 비밀번호 금지 — 반드시 bcrypt 해시여야 함
          return null;
        }

        const emailOK = safeEqual(credentials.email, adminEmail);
        const pwOK = await bcrypt.compare(credentials.password, adminPassword);
        if (!emailOK || !pwOK) return null;

        return { id: "admin-1", email: adminEmail, name: "Administrator" } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = (user as any).email;
        token.name = (user as any).name;
      }
      return token as any;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token as any).email;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
