import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import MusicToggle from "./MusicToggle";

const navLinks = [
  { label: "Menu", href: "#menu" },
  { label: "Our Story", href: "#story" },
  { label: "Locations", href: "#locations" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-gold/20 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="font-display text-2xl md:text-3xl text-gradient-gold tracking-widest">
          BIRYAAN
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-heading text-sm tracking-[0.2em] uppercase text-foreground/70 hover:text-gold transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
          <MusicToggle />
          <a
            href="#contact"
            className="bg-gradient-saffron font-heading text-sm tracking-[0.15em] uppercase px-6 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Dawat Kijiye
          </a>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <MusicToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gold">
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-lg border-t border-gold/10 animate-fade-in">
          <div className="flex flex-col items-center py-8 gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-heading text-lg tracking-[0.2em] uppercase text-foreground/80 hover:text-gold transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="bg-gradient-saffron font-heading text-sm tracking-[0.15em] uppercase px-8 py-3 text-primary-foreground"
            >
              Dawat Kijiye
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
