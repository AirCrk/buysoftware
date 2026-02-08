import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: '邮箱', type: 'email' },
                password: { label: '密码', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('请输入邮箱和密码');
                }

                const user = await prisma.adminUser.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error('用户不存在');
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error('密码错误');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/admin/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
};
