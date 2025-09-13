import HeroSection from "@/components/sections/HeroSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import FlashcardSection from "@/components/sections/FlashcardSection";
import SubjectsSection from "@/components/sections/SubjectsSection";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <BenefitsSection />
      <FlashcardSection />
      <SubjectsSection />
    </main>
  );
};

export default Index;