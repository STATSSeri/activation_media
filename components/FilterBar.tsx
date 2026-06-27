"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type FilterState = { q: string; type: string; view: string; focus: string };

type Props = {
	types: string[];
	current: FilterState;
};

export default function FilterBar({ types, current }: Props) {
	const router = useRouter();
	const [q, setQ] = useState(current.q);

	function go(next: Partial<FilterState>) {
		const merged: FilterState = { ...current, ...next };
		const p = new URLSearchParams();
		if (merged.q) p.set("q", merged.q);
		if (merged.type) p.set("type", merged.type);
		if (merged.view) p.set("view", merged.view);
		if (merged.focus) p.set("focus", merged.focus);
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

			<select value={current.type} onChange={(e) => go({ type: e.target.value })}>
				<option value="">施策タイプ：すべて</option>
				{types.map((t) => (
					<option key={t} value={t}>
						{t}
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
