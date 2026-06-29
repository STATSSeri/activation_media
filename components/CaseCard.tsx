import type { Case } from "@/lib/notion";

const THUMB_VERSION = "3"; // デザイン変更時に上げてCDNキャッシュ更新

function fmtDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/** 既存の日本語データから「一瞬で分かる」サムネ画像URL（/api/thumb）を組み立てる。 */
function thumbUrl(c: Case): string {
	const p = new URLSearchParams();
	p.set("v", THUMB_VERSION);
	p.set("sec", c.section);
	if (c.type) p.set("t", c.type);
	if (c.brand) p.set("b", c.brand);
	p.set("s", c.jpHeadline || c.whyItWorked || c.title);
	if (c.media) p.set("m", c.media);
	if (c.region) p.set("r", c.region);
	p.set("a", c.attention);
	return `/api/thumb?${p.toString()}`;
}

export default function CaseCard({ c }: { c: Case }) {
	const title = c.jpHeadline || c.title || "(無題)";
	const body = c.jpSummary || c.whyItWorked || "";
	return (
		<a className="card" href={c.sourceUrl || "#"} target="_blank" rel="noreferrer">
			<div className="card-thumb">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={thumbUrl(c)} alt="" loading="lazy" />
			</div>
			<div className="card-body">
				<div className="card-meta">
					{(c.caseScore === "S" || c.caseScore === "A") && (
						<span className={`tag tag-score score-${c.caseScore}`}>事例{c.caseScore}</span>
					)}
					{c.type ? (
						<span className="tag">{c.type}</span>
					) : (
						<span className="tag">{c.section}</span>
					)}
					{c.region && <span className="tag tag-ghost">{c.region}</span>}
					{c.attention !== "-" && <span className="tag tag-att">{c.attention}</span>}
				</div>
				<h3 className="card-title">{title}</h3>
				{(c.brand || c.media) && (
					<div className="card-sub">{[c.brand, c.media].filter(Boolean).join(" ・ ")}</div>
				)}
				{body && <p className="card-why">{body}</p>}
				<div className="card-foot">
					<span>{fmtDate(c.date)}</span>
					{c.people && <span className="card-people">{c.people}</span>}
				</div>
			</div>
		</a>
	);
}
