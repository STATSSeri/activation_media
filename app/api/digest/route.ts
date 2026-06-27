import { NextRequest, NextResponse } from "next/server";
import { fetchCases, startOfTodayJstIso, type Case } from "@/lib/notion";

export const dynamic = "force-dynamic";

// 毎朝 JST 8:00（vercel.json の cron: "0 23 * * *" UTC）に Vercel Cron が叩く。
// Vercel は CRON_SECRET を Authorization: Bearer で自動付与する。
export async function GET(req: NextRequest) {
	const secret = process.env.CRON_SECRET;
	if (secret) {
		const auth = req.headers.get("authorization");
		if (auth !== `Bearer ${secret}`) {
			return new NextResponse("unauthorized", { status: 401 });
		}
	}

	const webhook = process.env.SLACK_WEBHOOK_URL;
	if (!webhook) {
		return NextResponse.json({ ok: false, reason: "SLACK_WEBHOOK_URL 未設定" });
	}

	let cases: Case[];
	try {
		cases = (await fetchCases({ sinceIso: startOfTodayJstIso() })).filter(
			(c) => c.status === "確認済み",
		);
	} catch (e) {
		return NextResponse.json({ ok: false, reason: (e as Error).message }, { status: 500 });
	}

	// 0件の朝は通知しない（ノイズ防止）
	if (cases.length === 0) {
		return NextResponse.json({ ok: true, count: 0, posted: false });
	}

	const siteUrl = process.env.GALLERY_BASE_URL ?? "";
	const payload = buildSlackPayload(cases, siteUrl);
	const res = await fetch(webhook, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
	});

	return NextResponse.json({ ok: res.ok, count: cases.length, posted: res.ok });
}

function buildSlackPayload(cases: Case[], siteUrl: string) {
	const blocks: unknown[] = [
		{
			type: "header",
			text: { type: "plain_text", text: `☀️ 今朝のアクティベーション事例 ${cases.length}件`, emoji: true },
		},
	];

	for (const c of cases.slice(0, 12)) {
		const head = c.attention !== "-" ? `${c.attention} ` : "";
		const meta = [c.brand, c.type, c.media].filter(Boolean).join(" ・ ");
		const lines = [
			`${head}*<${c.sourceUrl || siteUrl || "#"}|${c.title || "(無題)"}>*`,
			meta,
			c.whyItWorked ? `> ${c.whyItWorked.slice(0, 180)}` : "",
		]
			.filter(Boolean)
			.join("\n");
		blocks.push({ type: "section", text: { type: "mrkdwn", text: lines } });
	}

	if (cases.length > 12) {
		blocks.push({
			type: "context",
			elements: [{ type: "mrkdwn", text: `ほか ${cases.length - 12} 件` }],
		});
	}

	if (siteUrl) {
		blocks.push({
			type: "actions",
			elements: [
				{
					type: "button",
					text: { type: "plain_text", text: "ギャラリーを開く" },
					url: siteUrl,
				},
			],
		});
	}

	return { text: `今朝のアクティベーション事例 ${cases.length}件`, blocks };
}
