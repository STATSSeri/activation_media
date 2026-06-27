/** @type {import('next').NextConfig} */
const nextConfig = {
	// og:image は任意ドメインから来るため next/image を使わず <img> で表示する。
	// （ドメイン許可リストの管理が不要になる）
};

export default nextConfig;
