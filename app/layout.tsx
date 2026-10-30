import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "衣合 · 找到适合自己的穿搭", description: "结合身材、预算与风格，规划你的日常穿搭，发现附近服装门店。", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }
