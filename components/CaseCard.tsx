import type { Case } from "@/lib/notion";

const ATT_CLASS: Record<string, string> = {
	"◎": "att att-top",
	"○": "att att-mid",
};

function fmtDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function CaseCard({ c }: { c: Case }) {
	return (
		<a className="card" href={c.sourceUrl || "#"} target="_blank" rel="noreferrer">
			<div className="card-thumb">
				{c.thumbnail ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={c.thumbnail} alt="" loading="lazy" />
				) : (
					<div className="card-thumb-ph">{c.media || "no image"}</div>
				)}
				{ATT_CLASS[c.attention] && <span className={ATT_CLASS[c.attention]}>{c.attention}</span>}
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
