import heroVideo from "@/assets/hero-video.mp4";
import heroBg from "@/assets/hero-biryani.jpg";
import { ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative h-screen max-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={heroBg}
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h1
          className="font-display heading-xl text-gradient-gold mb-4 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          BIRYAAN
        </h1>
        <p
          className="font-heading text-xl md:text-3xl tracking-[0.3em] uppercase text-gold/80 mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          Sealed Under Fire.
        </p>
        <p
          className="font-body text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.8s" }}
        >
          Handcrafted Dum Biryani. Made Fresh For Every Dawat.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.1s" }}
        >
          <a
            href="#contact"
            className="bg-gradient-saffron font-heading text-base md:text-lg tracking-[0.2em] uppercase px-10 py-4 text-primary-foreground hover:opacity-90 transition-opacity shadow-saffron"
          >
            Dawat Kijiye
          </a>
          <a
            href="#app"
            className="border-2 border-gold/50 font-heading text-base md:text-lg tracking-[0.15em] uppercase px-10 py-4 text-gold hover:bg-gold/10 transition-all"
          >
            Download the App
          </a>
        </div>

        {/* QR / App */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "1.4s" }}>
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-24 h-24 border-2 border-gold/40 rounded-sm flex items-center justify-center mughal-pattern bg-muted/30">
              <span className="font-heading text-xs text-gold/60 tracking-wider text-center leading-tight">
                QR<br />SEAL
              </span>
            </div>
            <p className="font-heading text-xs tracking-[0.3em] uppercase text-gold/50">
              Scan the Seal
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float z-10">
        <ChevronDown size={28} className="text-gold/40" />
      </div>
    </section>
  );
};

export default HeroSection;
