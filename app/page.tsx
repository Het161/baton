import { Stage } from "@/components/three/Stage";
import { Grain } from "@/components/ui/Grain";
import { ScrollDirector } from "@/components/story/ScrollDirector";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { ActCapture } from "@/components/sections/ActCapture";
import { ActThink } from "@/components/sections/ActThink";
import { ActHandoff } from "@/components/sections/ActHandoff";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { WhyWins } from "@/components/sections/WhyWins";
import { DeskTeaser } from "@/components/sections/DeskTeaser";
import { Team } from "@/components/sections/Team";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { TrailDivider } from "@/components/ui/primitives";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Stage />
      <Grain />
      <ScrollDirector />

      <main id="main" className="content">
        {/* the warm zone — one continuous handoff, hero through ACT III */}
        <div id="story">
          <Hero />
          <Problem />
          <TrailDivider />
          <ActCapture />
          <ActThink />
          <ActHandoff />
        </div>

        {/* the cool zone — opaque, so the fixed canvas never shows through */}
        <div className="relative bg-[rgb(var(--page-bg))]">
          <LiveDemo />
          <WhyWins />
          <DeskTeaser />
          <Team />
          <SiteFooter />
        </div>
      </main>
    </>
  );
}
