// 共有パスワード認証（Edge / Node 両対応。Web Crypto のみ使用）。
// GALLERY_PASSWORD が未設定なら expectedToken() は null を返し、
// middleware は全面ブロックする（社内データを誤って公開しないため）。

export const AUTH_COOKIE = "am_auth";

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** GALLERY_PASSWORD から導出した認証トークン。未設定なら null。 */
export async function expectedToken(): Promise<string | null> {
	const pw = process.env.GALLERY_PASSWORD;
	if (!pw) return null;
	const data = new TextEncoder().encode(`activation-media:${pw}`);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return toHex(digest);
}
