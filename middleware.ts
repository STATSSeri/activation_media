import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

// login / api/login / 静的アセット 以外の全リクエストにかける
export const config = {
	matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
	// /api/digest は Cron 用。パスワードではなく CRON_SECRET でルート側が自衛するので通す。
	if (req.nextUrl.pathname.startsWith("/api/digest")) {
		return NextResponse.next();
	}

	const token = await expectedToken();
	if (!token) {
		// パスワード未設定 → 全面ブロック（社内データを誤って公開しない）
		return new NextResponse(
			"ギャラリーは未設定です。環境変数 GALLERY_PASSWORD を設定してください。",
			{ status: 503 },
		);
	}

	if (req.cookies.get(AUTH_COOKIE)?.value === token) {
		return NextResponse.next();
	}

	const url = req.nextUrl.clone();
	url.pathname = "/login";
	url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
	return NextResponse.redirect(url);
}
