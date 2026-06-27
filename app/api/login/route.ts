import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
	const form = await req.formData();
	const password = String(form.get("password") ?? "");
	const nextRaw = String(form.get("next") ?? "/");
	const next = nextRaw.startsWith("/") ? nextRaw : "/";

	const pw = process.env.GALLERY_PASSWORD;
	const token = await expectedToken();

	if (!pw || !token || password !== pw) {
		// 303 でGETに切り替えてログイン画面へ
		return NextResponse.redirect(
			new URL(`/login?error=1&next=${encodeURIComponent(next)}`, req.url),
			303,
		);
	}

	const res = NextResponse.redirect(new URL(next, req.url), 303);
	res.cookies.set(AUTH_COOKIE, token, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30, // 30日
	});
	return res;
}
