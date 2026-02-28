import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RoyalFive from "@/components/RoyalFive";
import RitualSection from "@/components/RitualSection";
import SaffronSection from "@/components/SaffronSection";
import OurStory from "@/components/OurStory";
import Locations from "@/components/Locations";
import AppSection from "@/components/AppSection";
import ContactSection from "@/components/ContactSection";
import BiryaanFooter from "@/components/BiryaanFooter";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <RoyalFive />
      <RitualSection />
      <SaffronSection />
      <OurStory />
      <Locations />
      <AppSection />
      <ContactSection />
      <BiryaanFooter />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
