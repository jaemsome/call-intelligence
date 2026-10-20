import Link from "next/link";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./NavItems";
import { LogoutButton } from "./LogoutButton";

export function Brand() {
	return (
		<div className="flex items-center gap-3 px-2">
			<span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
				<Rocket className="size-5" aria-hidden />
			</span>
			<div className="leading-tight">
				<p className="text-sm font-semibold">Call Intelligence Test</p>
				<p className="text-xs text-ink-3">Powered by PestLaunch</p>
			</div>
		</div>
	);
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<nav aria-label="Main" className="flex flex-col gap-1">
			{NAV_ITEMS.map(({ label, href, icon: Icon, live }) =>
				live ? (
					<Link
						key={label}
						href={href}
						onClick={onNavigate}
						aria-current="page"
						className="flex min-h-11 items-center gap-3 rounded-xl bg-accent-soft px-3 text-sm font-medium text-accent-ink"
					>
						<Icon className="size-4" aria-hidden />
						{label}
					</Link>
				) : (
					<span
						key={label}
						aria-disabled="true"
						title="Not part of this build"
						className={cn(
							"flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-ink-3 opacity-70",
						)}
					>
						<Icon className="size-4" aria-hidden />
						{label}
					</span>
				),
			)}
		</nav>
	);
}

export function Sidebar() {
	return (
		<aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r border-line bg-surface px-3 py-5 lg:flex">
			<div className="flex flex-col gap-6">
				<Brand />
				<NavList />
			</div>
			<LogoutButton />
		</aside>
	);
}
