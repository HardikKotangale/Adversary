import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { WhyAdversary } from "@/components/WhyAdversary";
import { HowItWorks } from "@/components/HowItWorks";
import { TechStrip } from "@/components/TechStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />

      <div className="animate-rise-in">
        <HeroSection />
        <WhyAdversary />
        <HowItWorks />
        <TechStrip />

        <div className="py-16 text-center border-t border-rule">
          <h3 className="text-2xl font-bold mb-4">Ready to put your idea to the test?</h3>
          <Link
            href="/arena"
            className="inline-block px-8 py-4 rounded-xl bg-mediator hover:brightness-110 hover:scale-105 active:scale-95 text-paper font-mono text-sm uppercase tracking-wider shadow-xl shadow-mediator/30 transition-all font-bold"
          >
            Enter Adversary Arena
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
