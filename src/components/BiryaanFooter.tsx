const footerLinks = {
  menu: [
    { label: "Menu", href: "#menu" },
    { label: "Our Story", href: "#story" },
    { label: "Locations", href: "#locations" },
  ],
  app: [
    { label: "Download App", href: "#app" },
    { label: "Contact", href: "#contact" },
    { label: "Instagram", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

const BiryaanFooter = () => {
  return (
    <footer className="bg-background border-t border-gold/10 mughal-pattern">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl text-gradient-gold tracking-widest mb-4">
              BIRYAAN
            </h3>
            <p className="font-body text-sm text-muted-foreground">
              Sealed Under Fire.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key}>
              <h4 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-4">
                {key === "menu" ? "Explore" : key === "app" ? "Connect" : "Legal"}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gold/10 pt-8 text-center">
          <p className="font-body text-xs text-muted-foreground tracking-wider">
            © 2026 BIRYAAN — Crafted Under Fire.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BiryaanFooter;
