import { fetchCases, startOfTodayJstIso, SECTIONS, type Case, type Section } from "@/lib/notion";
import CaseCard from "@/components/CaseCard";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
function str(v: string | string[] | undefined): string {
	return typeof v === "string" ? v : "";
}

const ATT_ORDER: Record<string, number> = { "◎": 0, "○": 1, "-": 2 };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
	const sp = await searchParams;
	const q = str(sp.q).trim();
	const view = sp.view === "today" ? "today" : "";
	const focus = sp.focus === "1" ? "1" : "";
	const sectionFilter = str(sp.section);
	const best = sp.best === "1" ? "1" : "";

	let all: Case[] = [];
	let error: string | null = null;
	try {
		all = await fetchCases(view === "today" ? { sinceIso: startOfTodayJstIso() } : undefined);
	} catch (e) {
		error = (e as Error).message;
	}

	let cases = all;
	if (sectionFilter) cases = cases.filter((c) => c.section === sectionFilter);
	if (focus) cases = cases.filter((c) => c.attention === "◎" || c.attention === "○");
	if (best) cases = cases.filter((c) => c.caseScore === "S" || c.caseScore === "A");
	if (q) {
		const n = q.toLowerCase();
		cases = cases.filter((c) =>
			[c.jpHeadline, c.jpSummary, c.title, c.brand, c.media, c.people, c.region ?? ""]
				.join(" ")
				.toLowerCase()
				.includes(n),
		);
	}

	const filtered = Boolean(q || focus || sectionFilter || best); // 絞り込み中はフラット表示

	// 今朝の注目（◎）を先頭に。重複を避けてセクションからは除外。
	const lead = cases.filter((c) => c.attention === "◎").slice(0, 4);
	const leadIds = new Set(lead.map((c) => c.id));

	const bySection = new Map<Section, Case[]>();
	for (const s of SECTIONS) bySection.set(s, []);
	for (const c of cases) {
		if (leadIds.has(c.id)) continue;
		bySection.get(c.section)?.push(c);
	}
	for (const arr of bySection.values()) {
		arr.sort(
			(a, b) =>
				(ATT_ORDER[a.attention] ?? 2) - (ATT_ORDER[b.attention] ?? 2) ||
				(b.date ?? "").localeCompare(a.date ?? ""),
		);
	}

	return (
		<>
			<header className="site-head">
				<div className="site-head-inner">
					<div className="brand">
						<h1>S/NEWS_CEO</h1>
						<span className="count">{error ? "—" : `${cases.length} 件`}</span>
					</div>
					<FilterBar current={{ q, view, focus, section: sectionFilter, best }} />
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
						{view === "today" ? "今朝の新着はまだありません。" : "該当する記事がありません。"}
					</p>
				) : filtered ? (
					<section className="gallery-grid">
						{cases.map((c) => (
							<CaseCard key={c.id} c={c} />
						))}
					</section>
				) : (
					<>
						{lead.length > 0 && (
							<section className="news-section">
								<div className="section-head section-head-lead">
									<h2>☀️ 今朝の注目</h2>
								</div>
								<div className="gallery-grid">
									{lead.map((c) => (
										<CaseCard key={`lead-${c.id}`} c={c} />
									))}
								</div>
							</section>
						)}
						{SECTIONS.map((s) => {
							const arr = bySection.get(s) ?? [];
							if (arr.length === 0) return null;
							return (
								<section key={s} className="news-section">
									<div className="section-head">
										<h2>{s}</h2>
										<span className="section-count">{arr.length}</span>
									</div>
									<div className="gallery-grid">
										{arr.map((c) => (
											<CaseCard key={c.id} c={c} />
										))}
									</div>
								</section>
							);
						})}
					</>
				)}
			</div>
		</>
	);
}
