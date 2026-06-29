type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
	const sp = await searchParams;
	const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/";
	const error = sp.error === "1";

	return (
		<main className="login">
			<form className="login-card" method="POST" action="/api/login">
				<h1>S/NEWS</h1>
				<p>スタッツCEO向け 毎朝ニュースブリーフ</p>
				<input type="hidden" name="next" value={next} />
				<input type="password" name="password" placeholder="パスワード" autoFocus required />
				{error && <p className="login-error">パスワードが違います</p>}
				<button type="submit">入る</button>
			</form>
		</main>
	);
}
