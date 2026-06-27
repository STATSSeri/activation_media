import type { Case } from "@/lib/notion";

function fmtDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/** 既存の日本語データから「一瞬で分かる」サムネ画像URL（/api/thumb）を組み立てる。 */
function thumbUrl(c: Case): string {
	const p = new URLSearchParams();
	p.set("t", c.type ?? "未分類");
	if (c.brand) p.set("b", c.brand);
	// 概要はRSS原文（英語）のため、日本語で書かれた「なぜ効いたか」を見出しに使う
	p.set("s", c.whyItWorked || c.summary || c.title);
	if (c.media) p.set("m", c.media);
	if (c.region) p.set("r", c.region);
	p.set("a", c.attention);
	return `/api/thumb?${p.toString()}`;
}

export default function CaseCard({ c }: { c: Case }) {
	return (
		<a className="card" href={c.sourceUrl || "#"} target="_blank" rel="noreferrer">
			<div className="card-thumb">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={thumbUrl(c)} alt="" loading="lazy" />
			</div>
			<div className="card-body">
				<div className="card-meta">
					{c.type && <span className="tag">{c.type}</span>}
					{c.category && <span className="tag tag-ghost">{c.category}</span>}
					{c.region && <span className="tag tag-ghost">{c.region}</span>}
				</div>
				<h2 className="card-title">{c.title || "(無題)"}</h2>
				<div className="card-sub">{[c.brand, c.media].filter(Boolean).join(" ・ ")}</div>
				{c.whyItWorked && <p className="card-why">{c.whyItWorked}</p>}
				<div className="card-foot">
					<span>{fmtDate(c.date)}</span>
					{c.people && <span className="card-people">{c.people}</span>}
				</div>
			</div>
		</a>
	);
}
