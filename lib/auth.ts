import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";


const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "dev_access_secret_change_me");
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret_change_me");

export type JwtPayload = {
  sub: string;
  email: string;
  type: "access" | "refresh";
};

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

export async function signAccessToken(userId: string, email: string): Promise<string> {
  const jwt = await new SignJWT({ sub: userId, email, type: "access" } satisfies JwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(ACCESS_TOKEN_SECRET);
  return jwt;
}

export async function signRefreshToken(userId: string, email: string): Promise<{ token: string; expiresAt: Date }>{
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  const token = await new SignJWT({ sub: userId, email, type: "refresh" } satisfies JwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .sign(REFRESH_TOKEN_SECRET);
  return { token, expiresAt };
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload as unknown as JwtPayload;
}

export async function registerUser(params: { email: string; password: string; name?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await hashPassword(params.password);
  const user = await prisma.user.create({
    data: { email: params.email, passwordHash, name: params.name ?? null },
  });
  return user;
}

export async function loginUser(params: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: params.email } });
  if (!user) throw new Error("Invalid email or password");
  const ok = await verifyPassword(params.password, user.passwordHash);
  if (!ok) throw new Error("Invalid email or password");

  const accessToken = await signAccessToken(user.id, user.email);
  const { token: refreshToken, expiresAt } = await signRefreshToken(user.id, user.email);

  const refreshTokenHash = await hashPassword(refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash, refreshTokenExpiresAt: expiresAt },
  });

  return { user, accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
}

export async function rotateRefreshToken(userId: string, email: string) {
  const accessToken = await signAccessToken(userId, email);
  const { token: refreshToken, expiresAt } = await signRefreshToken(userId, email);
  const refreshTokenHash = await hashPassword(refreshToken);
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash, refreshTokenExpiresAt: expiresAt } });
  return { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
}

export async function revokeRefreshToken(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null, refreshTokenExpiresAt: null } });
}

export async function validateAndConsumeRefreshToken(token: string) {
  const payload = await verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) throw new Error("Refresh token not found");
  if (user.refreshTokenExpiresAt.getTime() < Date.now()) throw new Error("Refresh token expired");

  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) throw new Error("Refresh token mismatch");

  return rotateRefreshToken(user.id, user.email);
}

export function getCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

