import Link from "next/link";
import { ArrowRight, WalletCards } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { DOCS_URL, withBasePath } from "@/lib/site";
import { landing } from "@/features/landing/content";
import { AuthButtons } from "@/features/landing/components/AuthButtons";

/**
 * Landing / Welcome (design, Nov 2026). Illustrations are the designer's SVG exports (sources in
 * packages/ui/src/assets/images, served from public/images/landing).
 */
export function LandingView() {
	return (
		<>
			<Hero />
			<Tools />
			<Steps />
			<Cta />
		</>
	);
}

function Illustration({
	src,
	alt,
	width,
	height,
	className,
	reveal,
	eager,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
	className?: string;
	reveal?: boolean;
	eager?: boolean;
}) {
	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={withBasePath(src)}
			alt={alt}
			width={width}
			height={height}
			data-reveal={reveal ? "up" : undefined}
			loading={eager ? "eager" : "lazy"}
			decoding="async"
			className={cn("h-auto w-full select-none", className)}
			draggable={false}
		/>
	);
}

function DocsLink({ className }: { className?: string }) {
	return (
		<Link
			href={DOCS_URL}
			className={cn("group inline-flex items-center gap-1.5 text-base underline-offset-4 hover:underline", className)}
		>
			See Docs <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
		</Link>
	);
}

function Hero() {
	return (
		<section className="bg-page">
			<div className="app-container grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1fr_minmax(0,599px)] lg:gap-10 lg:py-[86px]">
				<div>
					<h1 className="animate-rise font-display text-[36px] leading-[1.05] font-medium tracking-[-0.02em] text-navy sm:text-[56px] xl:text-[66px]">
						{landing.hero.title[0]}
						<br />
						{landing.hero.title[1]}
					</h1>
					<p
						className="animate-rise mt-5 max-w-[470px] font-display text-lg leading-snug text-navy md:text-xl"
						style={{ "--i": 1 } as React.CSSProperties}
					>
						{landing.hero.subtitle}
					</p>
					<div className="animate-rise mt-10 md:mt-12" style={{ "--i": 2 } as React.CSSProperties}>
						<AuthButtons />
						<DocsLink className="mt-6 text-navy max-sm:flex max-sm:justify-center" />
					</div>
				</div>
				<div className="animate-rise" style={{ "--i": 2 } as React.CSSProperties}>
					<Illustration
						src="/images/landing/hero.svg"
						alt="The UseKollo app: a total balance card, an ongoing goal at 50% and recent activity."
						width={599}
						height={433}
						className="mx-auto max-w-[599px]"
						eager
					/>
				</div>
			</div>
		</section>
	);
}

function FeatureIcon() {
	return (
		<span className="flex size-10 items-center justify-center rounded-full bg-white/20" aria-hidden>
			<WalletCards className="size-5 text-white" />
		</span>
	);
}

function FeatureText({ title, body, className }: { title: string; body: string; className?: string }) {
	return (
		<div className={className}>
			<FeatureIcon />
			<h3 className="mt-8 text-[26px] leading-tight md:mt-10">{title}</h3>
			<p className="mt-2 max-w-[360px] text-base leading-snug text-white/90">{body}</p>
		</div>
	);
}

function Tools() {
	const f = landing.features;
	return (
		<section id="product" className="scroll-mt-20 bg-white">
			<div className="app-container py-16 md:py-24">
				<div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
					<h2
						data-reveal="up"
						className="max-w-[620px] font-display text-[30px] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[36px] md:text-[48px]"
					>
						{landing.tools.title}
					</h2>
					<div data-reveal="up" style={{ "--d": 1 } as React.CSSProperties} className="max-w-[400px]">
						<p className="font-display text-lg leading-snug text-ink">{landing.tools.body}</p>
						<Button asChild size="lg" className="mt-8 w-full sm:w-auto sm:min-w-[200px]">
							<Link href={routes.signUp()}>{landing.tools.cta}</Link>
						</Button>
					</div>
				</div>

				<div className="mt-14 grid gap-5 text-white lg:grid-cols-[1fr_2fr] lg:grid-rows-[260px_260px]">
					<article data-reveal="up" className="flex flex-col overflow-hidden rounded-[28px] bg-primary-500 lg:row-span-2">
						<FeatureText {...f.control} className="p-6 md:p-7" />
						<Illustration
							src="/images/landing/stay-in-control.svg"
							alt="Add Savings and Withdraw buttons above a goal's activity: a failed and a pending deposit."
							width={369}
							height={323}
							className="mx-auto mt-auto max-w-[369px] px-6 pt-8 lg:px-0"
						/>
					</article>
					{(
						[
							{
								key: "goals",
								data: f.goals,
								src: "/images/landing/goals-with-clarity.svg",
								alt: "Two ongoing goals with progress rings at 50% and 90%.",
							},
							{
								key: "progress",
								data: f.progress,
								src: "/images/landing/progress-you-can-see.svg",
								alt: "A goal's progress ring: 250 of 500 USDC, 50% done.",
							},
						] as const
					).map((card, i) => (
						<article
							key={card.key}
							data-reveal="up"
							style={{ "--d": i + 1 } as React.CSSProperties}
							className="relative flex flex-col overflow-hidden rounded-[28px] bg-primary-500 md:flex-row"
						>
							<FeatureText {...card.data} className="p-6 md:w-1/2 md:p-7" />
							<div className="flex justify-center px-6 pt-2 md:absolute md:right-6 md:bottom-0 md:h-[calc(100%-31px)] md:w-auto md:px-0 md:pt-0">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={withBasePath(card.src)}
									alt={card.alt}
									width={403}
									height={229}
									loading="lazy"
									className="h-auto w-full max-w-[403px] select-none md:h-full md:w-auto md:max-w-none"
									draggable={false}
								/>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}

function Steps() {
	return (
		<section id="how-it-works" className="scroll-mt-20 bg-page">
			<div className="app-container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1fr_minmax(0,599px)] lg:gap-10">
				<div data-reveal="up">
					<h2 className="max-w-[560px] font-display text-[30px] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[36px] md:text-[48px]">
						{landing.steps.title}
					</h2>
					<p className="mt-5 max-w-[470px] font-display text-lg leading-snug text-ink md:text-xl">{landing.steps.body}</p>
					<Button asChild variant="outline" size="lg" className="mt-8 w-full sm:mt-12 sm:w-auto sm:min-w-[200px]">
						<Link href={DOCS_URL}>See Docs</Link>
					</Button>
				</div>
				<Illustration
					reveal
					src="/images/landing/create-your-savings.svg"
					alt="A completed goal (500 of 500 USDC, 100% done) and an Add Savings transfer confirmation."
					width={599}
					height={433}
					className="mx-auto max-w-[599px]"
				/>
			</div>
		</section>
	);
}

function Cta() {
	return (
		<section className="bg-white px-3 py-6 sm:px-5">
			<div
				data-reveal="zoom"
				className="rounded-[28px] bg-primary-500 px-5 py-12 text-left text-white sm:px-6 sm:py-16 sm:text-center md:rounded-[36px] md:py-24"
			>
				<h2 className="mx-auto max-w-[1000px] font-display text-[30px] leading-[1.1] tracking-[-0.01em] md:text-[48px] xl:text-[52px]">
					{landing.cta.title}
				</h2>
				<p className="mt-5 text-base leading-snug text-white/95 sm:mx-auto sm:max-w-[380px] sm:text-lg">{landing.cta.body}</p>
				<AuthButtons tone="onBlue" className="mt-10 justify-center" />
				<DocsLink className="mt-6 text-white max-sm:flex max-sm:justify-center" />
			</div>
		</section>
	);
}
