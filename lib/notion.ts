import { Client, isFullPage } from "@notionhq/client";

export type Attention = "◎" | "○" | "-";

// 新聞のセクション（表示順）
export const SECTIONS = [
	"アクティベーション事例",
	"ラグジュアリー・クライアント",
	"インフルエンサー・SNS",
	"広告・マーケ・キャスティング",
	"経営・テック",
] as const;
export type Section = (typeof SECTIONS)[number];

export type Case = {
	id: string;
	title: string; // 原題
	section: Section; // セクション（空なら アクティベーション事例 に寄せる）
	jpHeadline: string; // 日本語見出し
	jpSummary: string; // 日本語要約
	type: string | null; // 施策タイプ（アクティベーションのみ）
	brand: string;
	category: string | null;
	region: string | null;
	people: string;
	whyItWorked: string;
	sourceUrl: string;
	media: string;
	attention: Attention;
	caseScore: string; // 事例評価 S/A/B/C（アクティベーションのみ）
	status: string;
	date: string | null;
};

function richText(prop: any): string {
	const arr = prop?.rich_text ?? prop?.title ?? [];
	return Array.isArray(arr) ? arr.map((t: any) => t.plain_text ?? "").join("") : "";
}
function selectName(prop: any): string | null {
	return prop?.select?.name ?? null;
}

function notionClient(): Client {
	const auth = process.env.NOTION_API_TOKEN;
	if (!auth) throw new Error("NOTION_API_TOKEN が未設定です");
	return new Client({ auth });
}

const MAX_PAGES = 6; // 最大 600件

/**
 * 「確認済み / 保存」のレコードを取得日の新しい順で取得する。
 * sinceIso を渡すと「取得日 >= sinceIso」に絞る（今朝の新着など）。
 */
export async function fetchCases(opts?: { sinceIso?: string }): Promise<Case[]> {
	const dataSourceId = process.env.ACTIVATION_DATA_SOURCE_ID;
	if (!dataSourceId) {
		throw new Error("ACTIVATION_DATA_SOURCE_ID が未設定です");
	}
	const notion = notionClient();

	const conditions: any[] = [
		{
			or: [
				{ property: "ステータス", select: { equals: "確認済み" } },
				{ property: "ステータス", select: { equals: "保存" } },
			],
		},
	];
	if (opts?.sinceIso) {
		conditions.push({ property: "取得日", date: { on_or_after: opts.sinceIso } });
	}

	const cases: Case[] = [];
	let cursor: string | undefined;
	let pages = 0;
	do {
		const res = await notion.dataSources.query({
			data_source_id: dataSourceId,
			filter: conditions.length === 1 ? conditions[0] : { and: conditions },
			sorts: [{ property: "取得日", direction: "descending" }],
			page_size: 100,
			start_cursor: cursor,
		});
		for (const page of res.results) {
			if (!isFullPage(page)) continue;
			const p: any = page.properties;
			const sectionRaw = selectName(p["セクション"]);
			const section = (SECTIONS as readonly string[]).includes(sectionRaw ?? "")
				? (sectionRaw as Section)
				: "アクティベーション事例"; // 旧レコード（未設定）は事例セクションへ
			cases.push({
				id: page.id,
				title: richText(p["タイトル"]),
				section,
				jpHeadline: richText(p["日本語見出し"]),
				jpSummary: richText(p["日本語要約"]),
				type: selectName(p["施策タイプ"]),
				brand: richText(p["ブランド名"]),
				category: selectName(p["ブランドカテゴリ"]),
				region: selectName(p["国・地域"]),
				people: richText(p["起用人物"]),
				whyItWorked: richText(p["なぜ効いたか"]),
				sourceUrl: p["ソースURL"]?.url ?? "",
				media: richText(p["媒体名"]),
				attention: (selectName(p["注目度"]) as Attention) ?? "-",
				caseScore: selectName(p["事例評価"]) ?? "",
				status: selectName(p["ステータス"]) ?? "",
				date: p["取得日"]?.date?.start ?? null,
			});
		}
		cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
		pages += 1;
	} while (cursor && pages < MAX_PAGES);

	return cases;
}

/** その日の0時(JST)を ISO8601 で返す（今朝の新着フィルタ用）。 */
export function startOfTodayJstIso(): string {
	const now = new Date();
	const jst = new Date(now.getTime() + 9 * 3600 * 1000);
	const startUtcMs = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()) - 9 * 3600 * 1000;
	return new Date(startUtcMs).toISOString();
}
