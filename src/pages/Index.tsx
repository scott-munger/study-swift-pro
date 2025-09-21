import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import HeroSection from "@/components/sections/HeroSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import FlashcardSection from "@/components/sections/FlashcardSection";
import SubjectsSection from "@/components/sections/SubjectsSection";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  // Commenté pour permettre l'affichage de la page d'accueil même pour les admins
  // useEffect(() => {
  //   // Si l'utilisateur est connecté et est admin, rediriger vers l'administration
  //   if (user && (user.role === 'ADMIN' || isAdmin)) {
  //     navigate('/simple-admin/dashboard');
  //   }
  // }, [user, isAdmin, navigate]);

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