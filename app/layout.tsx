import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "S/NEWS",
	description: "スタッツCEO向け 毎朝ニュースブリーフ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<body>{children}</body>
		</html>
	);
}
