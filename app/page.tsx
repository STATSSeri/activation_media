import { fetchCases, startOfTodayJstIso, type Case } from "@/lib/notion";
import CaseCard from "@/components/CaseCard";
import FilterBar from "@/components/FilterBar";

// Notion を都度読むため動的レンダリング（ビルド時に env 無しで実行されない）
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string {
	return typeof v === "string" ? v : "";
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
	const sp = await searchParams;
	const q = str(sp.q).trim();
	const type = str(sp.type);
	const view = sp.view === "today" ? "today" : "";
	const focus = sp.focus === "1" ? "1" : "";

	let all: Case[] = [];
	let error: string | null = null;
	try {
		all = await fetchCases(view === "today" ? { sinceIso: startOfTodayJstIso() } : undefined);
	} catch (e) {
		error = (e as Error).message;
	}

	const types = [...new Set(all.map((c) => c.type).filter((t): t is string => Boolean(t)))].sort();

	let cases = all;
	if (type) cases = cases.filter((c) => c.type === type);
	if (focus) cases = cases.filter((c) => c.attention === "◎" || c.attention === "○");
	if (q) {
		const needle = q.toLowerCase();
		cases = cases.filter((c) =>
			[c.title, c.brand, c.summary, c.whyItWorked, c.media, c.people, c.region ?? ""]
				.join(" ")
				.toLowerCase()
				.includes(needle),
		);
	}

	return (
		<>
			<header className="site-head">
				<div className="site-head-inner">
					<div className="brand">
						<h1>Activation Radar</h1>
						<span className="count">{error ? "—" : `${cases.length} 件`}</span>
					</div>
					<FilterBar types={types} current={{ q, type, view, focus }} />
				</div>
			</header>

			<div className="wrap">
				{error ? (
					<p className="empty">
						読み込みエラー: {error}
						<br />
						Vercel の環境変数 NOTION_API_TOKEN / ACTIVATION_DATA_SOURCE_ID を確認してください。
					</p>
				) : cases.length === 0 ? (
					<p className="empty">
						{view === "today" ? "今朝の新着はまだありません。" : "該当する事例がありません。"}
					</p>
				) : (
					<section className="gallery-grid">
						{cases.map((c) => (
							<CaseCard key={c.id} c={c} />
						))}
					</section>
				)}
			</div>
		</>
	);
}
