import { Flame, Hand, Leaf, Droplets, Lock, Star, Wheat } from "lucide-react";

const rituals = [
  { icon: Lock, label: "No Bulk Cooking" },
  { icon: Hand, label: "Made After Order" },
  { icon: Star, label: "Hand-Picked Chicken" },
  { icon: Flame, label: "Hand-Selected Mutton" },
  { icon: Wheat, label: "Spices Ground Daily" },
  { icon: Droplets, label: "Saffron Bloomed Fresh" },
  { icon: Lock, label: "Individually Sealed" },
];

const RitualSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-gradient-gold mb-4">
            Every Dawat. Individually Sealed.
          </h2>
          <div className="w-24 h-0.5 bg-gradient-saffron mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rituals.map((ritual, i) => (
            <div
              key={i}
              className="border border-gold/15 bg-card p-6 text-center group hover:border-gold/40 transition-all duration-500"
            >
              <div className="w-14 h-14 mx-auto mb-4 border border-gold/30 rounded-full flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <ritual.icon size={24} className="text-gold" />
              </div>
              <p className="font-heading text-sm tracking-[0.15em] uppercase text-foreground/80">
                {ritual.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RitualSection;
