import { ImageResponse } from "next/og";

export const runtime = "edge";

// 施策タイプごとの背景グラデーション（一覧で色で見分けやすくする）
const TYPE_COLORS: Record<string, [string, string]> = {
	"ポップアップ/リテール体験": ["#0f2a2a", "#1f7a6f"],
	"インフルエンサー連動": ["#2a0f24", "#a83b76"],
	"ローンチイベント": ["#1e1838", "#6a4fb0"],
	"ブランドコラボ": ["#0f243f", "#2f6fb0"],
	"OOH/屋外広告": ["#2a230f", "#b08d3f"],
	"デジタル/SNSキャンペーン": ["#0f2a1c", "#2f9e6a"],
	"フラッグシップ/空間体験": ["#2a0f0f", "#b04f4f"],
	"アンバサダー起用": ["#181830", "#5566b0"],
	"ゲリラ/PRスタント": ["#2a1a0f", "#c06a2f"],
	"その他": ["#1c1c1c", "#6a5c44"],
	"未分類": ["#1c1c1c", "#6a5c44"],
};

// セクションごとの背景色（施策タイプが無い記事はこちらで色分け）
const SECTION_COLORS: Record<string, [string, string]> = {
	"アクティベーション事例": ["#1e1838", "#6a4fb0"],
	"ラグジュアリー・クライアント": ["#2a230f", "#b08d3f"],
	"インフルエンサー・SNS": ["#2a0f24", "#a83b76"],
	"広告・マーケ・キャスティング": ["#0f243f", "#2f6fb0"],
	"経営・テック": ["#0f2a1c", "#2f9e6a"],
};

function clip(s: string, n: number): string {
	const t = s.trim();
	return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** Google Fonts から「使う文字だけ」のサブセット（軽量）を取得。woff2を避けるため古いUAでTTF/WOFFを得る。 */
async function loadJpFont(text: string): Promise<ArrayBuffer | null> {
	try {
		const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
		const css = await (
			await fetch(cssUrl, {
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
				},
			})
		).text();
		const m = css.match(/src:\s*url\((https:[^)]+)\)/);
		if (!m) return null;
		return await (await fetch(m[1])).arrayBuffer();
	} catch {
		return null;
	}
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const type = searchParams.get("t") || "";
	const section = searchParams.get("sec") || "";
	const brand = searchParams.get("b") || "";
	const headline = clip(searchParams.get("s") || "", 40);
	const media = searchParams.get("m") || "";
	const region = searchParams.get("r") || "";
	const attention = searchParams.get("a") || "-";

	// 色：施策タイプ優先（アクティベーション）→ 無ければセクション色
	const chip = type || section || "ニュース";
	const [bg1, bg2] =
		(type && TYPE_COLORS[type]) ||
		SECTION_COLORS[section] ||
		SECTION_COLORS["広告・マーケ・キャスティング"];
	const fontText = `${chip}${brand}${headline}${media}${region}・◎○ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789／`;
	const fontData = await loadJpFont(fontText);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: 48,
					background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
					fontFamily: "Noto Sans JP",
					color: "#ffffff",
				}}
			>
				{/* 上段：施策タイプ・地域・注目度 */}
				<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
					<div
						style={{
							display: "flex",
							background: "#f5e000",
							color: "#1a1a1a",
							fontWeight: 700,
							fontSize: 30,
							padding: "8px 22px",
							borderRadius: 10,
						}}
					>
						{chip}
					</div>
					{region ? (
						<div
							style={{
								display: "flex",
								border: "2px solid rgba(255,255,255,0.55)",
								fontSize: 26,
								padding: "6px 16px",
								borderRadius: 10,
							}}
						>
							{region}
						</div>
					) : null}
					{attention !== "-" ? (
						<div style={{ display: "flex", marginLeft: "auto", fontSize: 46 }}>{attention}</div>
					) : null}
				</div>

				{/* 中段：ブランド名＋見出し（概要） */}
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{brand ? (
						<div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#ffe27a" }}>
							{clip(brand, 24)}
						</div>
					) : null}
					<div style={{ display: "flex", fontSize: 46, fontWeight: 700, lineHeight: 1.3 }}>
						{headline}
					</div>
				</div>

				{/* 下段：媒体名 */}
				<div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.72)" }}>
					{media}
				</div>
			</div>
		),
		{
			width: 800,
			height: 450,
			fonts: fontData
				? [{ name: "Noto Sans JP", data: fontData, weight: 700, style: "normal" }]
				: [],
			headers: {
				"cache-control": "public, max-age=86400, s-maxage=86400, immutable",
			},
		},
	);
}
