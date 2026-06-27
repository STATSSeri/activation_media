import { Client, isFullPage } from "@notionhq/client";

export type Attention = "◎" | "○" | "-";

export type Case = {
	id: string;
	title: string;
	type: string | null; // 施策タイプ
	subTypes: string[]; // サブ施策タイプ
	brand: string;
	category: string | null; // ブランドカテゴリ
	region: string | null; // 国・地域
	people: string; // 起用人物
	summary: string; // 概要
	whyItWorked: string; // なぜ効いたか
	sourceUrl: string;
	media: string; // 媒体名
	attention: Attention; // 注目度
	status: string; // ステータス
	date: string | null; // 取得日（ISO）
	thumbnail: string | null; // サムネイル
};

// Notion のプロパティ値は型が複雑なので、抽出だけ any で受けて整形する。
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

const MAX_PAGES = 3; // 最大 300件まで（100件 × 3ページ）

/**
 * 「確認済み / 保存」のレコードを取得日の新しい順で取得する。
 * sinceIso を渡すと「取得日 >= sinceIso」に絞る（今朝の新着など）。
 * 環境変数が未設定なら空配列（呼び出し側でエラー表示）。
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
			cases.push({
				id: page.id,
				title: richText(p["タイトル"]),
				type: selectName(p["施策タイプ"]),
				subTypes: (p["サブ施策タイプ"]?.multi_select ?? []).map((s: any) => s.name),
				brand: richText(p["ブランド名"]),
				category: selectName(p["ブランドカテゴリ"]),
				region: selectName(p["国・地域"]),
				people: richText(p["起用人物"]),
				summary: richText(p["概要"]),
				whyItWorked: richText(p["なぜ効いたか"]),
				sourceUrl: p["ソースURL"]?.url ?? "",
				media: richText(p["媒体名"]),
				attention: (selectName(p["注目度"]) as Attention) ?? "-",
				status: selectName(p["ステータス"]) ?? "",
				date: p["取得日"]?.date?.start ?? null,
				thumbnail: p["サムネイル"]?.url ?? null,
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
