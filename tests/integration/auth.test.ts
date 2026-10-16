import { describe, expect, it } from "vitest";
import { attemptLogin } from "@/lib/auth/login";
import { AuthError, authorize, createSession, destroySession, getSessionUser, SESSION_COOKIE } from "@/lib/auth/session";
import { cookieJar, db, makeUser, PASSWORD, signInAs, signOut } from "../helpers/db";
import { sha256 } from "@/lib/server/crypto";

describe("authentication", () => {
  it("logs in with correct credentials and records the event", async () => {
    await makeUser("ADMIN", "boss@test.example");
    const r = await attemptLogin("BOSS@test.example", PASSWORD, "10.0.0.1");
    expect(r.ok).toBe(true);
    const u = await db().adminUser.findUnique({ where: { email: "boss@test.example" } });
    expect(u?.lastLoginAt).not.toBeNull();
    expect(await db().auditLog.count({ where: { action: "auth.login" } })).toBe(1);
  });

  it("returns the same generic error for a wrong password and an unknown user", async () => {
    await makeUser("ADMIN", "boss@test.example");
    const wrong = await attemptLogin("boss@test.example", "WrongPassword123", "10.0.0.2");
    const unknown = await attemptLogin("nobody@test.example", "WrongPassword123", "10.0.0.2");
    expect(wrong).toEqual({ ok: false, error: "Incorrect email or password." });
    expect(unknown).toEqual(wrong);
  });

  it("locks the account after repeated failures, even for the right password", async () => {
    await makeUser("ADMIN", "boss@test.example");
    for (let i = 0; i < 5; i++) await attemptLogin("boss@test.example", "WrongPassword123", `10.1.0.${i}`);
    const u = await db().adminUser.findUnique({ where: { email: "boss@test.example" } });
    expect(u?.lockedUntil).not.toBeNull();
    const r = await attemptLogin("boss@test.example", PASSWORD, "10.1.0.99");
    expect(r.ok).toBe(false);
  });

  it("rate limits login attempts per address", async () => {
    let last;
    for (let i = 0; i < 22; i++) last = await attemptLogin(`user${i}@test.example`, "WrongPassword123", "203.0.113.9");
    expect(last).toEqual({ ok: false, error: "Too many attempts. Please wait and try again." });
  });

  it("refuses inactive accounts", async () => {
    const u = await makeUser("EDITOR", "gone@test.example");
    await db().adminUser.update({ where: { id: u.id }, data: { active: false } });
    expect((await attemptLogin("gone@test.example", PASSWORD, "10.0.0.3")).ok).toBe(false);
  });

  it("stores only a hash of the session token", async () => {
    const u = await makeUser("ADMIN");
    await createSession(u.id, "ua");
    const token = cookieJar.get(SESSION_COOKIE)!;
    const row = await db().adminSession.findFirstOrThrow();
    expect(row.tokenHash).toBe(sha256(token));
    expect(row.tokenHash).not.toBe(token);
  });

  it("resolves the user from the cookie and ends the session on logout", async () => {
    const u = await signInAs("ADMIN");
    expect((await getSessionUser())?.id).toBe(u.id);
    await destroySession();
    expect(await getSessionUser()).toBeNull();
    expect(await db().adminSession.count()).toBe(0);
  });

  it("rejects expired sessions and deactivated users", async () => {
    const u = await signInAs("ADMIN");
    await db().adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getSessionUser()).toBeNull();
    await db().adminSession.updateMany({ data: { expiresAt: new Date(Date.now() + 60_000) } });
    expect((await getSessionUser())?.id).toBe(u.id);
    await db().adminUser.update({ where: { id: u.id }, data: { active: false } });
    expect(await getSessionUser()).toBeNull();
  });

  it("rejects a forged session cookie", async () => {
    cookieJar.set(SESSION_COOKIE, "not-a-real-token");
    expect(await getSessionUser()).toBeNull();
  });
});

describe("authorisation is enforced server-side", () => {
  it("throws UNAUTHENTICATED without a session", async () => {
    signOut();
    await expect(authorize("enquiries:read")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("throws FORBIDDEN for the wrong role", async () => {
    await signInAs("EDITOR");
    await expect(authorize("enquiries:read")).rejects.toBeInstanceOf(AuthError);
    await expect(authorize("enquiries:read")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authorize("content:write")).resolves.toMatchObject({ role: "EDITOR" });
  });
});
