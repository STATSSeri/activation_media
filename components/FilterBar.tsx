"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SECTIONS } from "@/lib/notion";

export type FilterState = { q: string; view: string; focus: string; section: string };

type Props = {
	current: FilterState;
};

export default function FilterBar({ current }: Props) {
	const router = useRouter();
	const [q, setQ] = useState(current.q);

	function go(next: Partial<FilterState>) {
		const merged: FilterState = { ...current, ...next };
		const p = new URLSearchParams();
		if (merged.q) p.set("q", merged.q);
		if (merged.view) p.set("view", merged.view);
		if (merged.focus) p.set("focus", merged.focus);
		if (merged.section) p.set("section", merged.section);
		const qs = p.toString();
		router.push(qs ? `/?${qs}` : "/");
	}

	return (
		<div className="filterbar">
			<div className="tabs">
				<button className={current.view === "" ? "on" : ""} onClick={() => go({ view: "" })}>
					すべて
				</button>
				<button
					className={current.view === "today" ? "on" : ""}
					onClick={() => go({ view: "today" })}
				>
					今朝の新着
				</button>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					go({ q });
				}}
			>
				<input
					type="search"
					placeholder="ブランド・キーワード検索"
					value={q}
					onChange={(e) => setQ(e.target.value)}
				/>
			</form>

			<select value={current.section} onChange={(e) => go({ section: e.target.value })}>
				<option value="">セクション：すべて</option>
				{SECTIONS.map((s) => (
					<option key={s} value={s}>
						{s}
					</option>
				))}
			</select>

			<button
				type="button"
				className={current.focus ? "chip on" : "chip"}
				onClick={() => go({ focus: current.focus ? "" : "1" })}
			>
				★ 注目（◎○）のみ
			</button>
		</div>
	);
}
