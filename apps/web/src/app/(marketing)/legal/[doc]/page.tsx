import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** Legal pages linked from sign-up and the footers. TODO(legal): the real text; until then they say so. */
const DOCS = {
	terms: "Terms of Service",
	privacy: "Privacy Policy",
	cookies: "Cookie Policy",
} as const;

export function generateStaticParams() {
	return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
	const { doc } = await params;
	return { title: DOCS[doc as keyof typeof DOCS] ?? "Legal" };
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
	const { doc } = await params;
	const title = DOCS[doc as keyof typeof DOCS];
	if (!title) notFound();
	return (
		<section className="app-container max-w-[760px] py-16 md:py-24">
			<h1 className="font-display text-4xl text-navy md:text-5xl">{title}</h1>
			<p className="mt-6 text-lg leading-8 text-ink/70">
				We’re finalising this page. UseKollo runs on Stellar Testnet only: test assets have no real value, and UseKollo never
				holds your keys or funds.
			</p>
		</section>
	);
}
