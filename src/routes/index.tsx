import { createFileRoute } from "@tanstack/react-router";
import { MiddlewareDemo } from "@/components/demo";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { NavigationBar } from "@/components/navigation";
import { CounterCard } from "@/components/web3/counter-card";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-background">
			<NavigationBar />
			<main>
				<HeroSection />
				<FeaturesSection />
				<section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
					<div className="max-w-md mx-auto flex flex-col gap-4">
						<h2 className="text-2xl font-bold text-foreground">On-chain Counter</h2>
						<p className="text-sm text-muted-foreground">
							Live read + write against the Counter smart contract on the active chain.
						</p>
						<CounterCard />
					</div>
				</section>
				<MiddlewareDemo />
			</main>
			<Footer />
		</div>
	);
}
