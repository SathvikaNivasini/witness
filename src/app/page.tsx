import { Welcome } from "@/components/home/welcome";
import { Reports } from "@/components/home/reports";
import { Prompt } from "@/components/home/prompt";
import { PatternCard } from "@/components/patterns/patterncard";

export default function Home() {
  return (
    <>
      <Welcome />
      <div className="home-details">
        <Reports />
        <PatternCard />
      </div>
      <Prompt />
    </>
  );
}
