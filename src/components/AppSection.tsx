import { Smartphone } from "lucide-react";

const AppSection = () => {
  return (
    <section id="app" className="section-padding bg-gradient-royal mughal-pattern">
      <div className="max-w-4xl mx-auto text-center">
        <Smartphone size={48} className="text-gold mx-auto mb-6" />
        <h2 className="heading-lg text-gradient-gold mb-6">
          Apni Dawat Saath Le Jaiye.
        </h2>
        <p className="font-body text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Order your royal biryani from anywhere. Download the BIRYAAN app.
        </p>

        {/* QR */}
        <div className="inline-flex flex-col items-center gap-4 mb-10">
          <div className="w-32 h-32 border-2 border-gold/40 flex items-center justify-center mughal-pattern bg-muted/20">
            <span className="font-heading text-sm text-gold/50 tracking-wider text-center">
              QR<br />SEAL
            </span>
          </div>
          <p className="font-heading text-xs tracking-[0.3em] uppercase text-gold/50">
            Scan the Seal
          </p>
        </div>

        {/* App Store Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            className="border-2 border-gold/40 font-heading text-sm tracking-[0.15em] uppercase px-8 py-3 text-gold hover:bg-gold/10 transition-all"
          >
            App Store
          </a>
          <a
            href="#"
            className="border-2 border-gold/40 font-heading text-sm tracking-[0.15em] uppercase px-8 py-3 text-gold hover:bg-gold/10 transition-all"
          >
            Google Play
          </a>
        </div>
      </div>
    </section>
  );
};

export default AppSection;
