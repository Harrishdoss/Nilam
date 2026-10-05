import './globals.css';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = { title: 'Nilam – National Digital Platform for Land Governance Research & Policy Innovation', description: 'SIH prototype: DATA → RESEARCH → EVIDENCE → POLICY → SIMULATION → PILOT → EVALUATION → KNOWLEDGE.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
