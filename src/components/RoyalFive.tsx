import { useState } from "react";
import packagingImg from "@/assets/packaging.jpg";

interface Product {
  name: string;
  description: string;
  hasFlavorToggle?: boolean;
  hasBoneToggle?: boolean;
}

const products: Product[] = [
  {
    name: "Badshahi Murgh Biryani",
    description:
      "Royal chicken layered with aromatic basmati, saffron infusion, hand-ground masalas. Dum sealed individually.",
    hasFlavorToggle: true,
    hasBoneToggle: true,
  },
  {
    name: "Nawabi Gosht Biryani",
    description:
      "Hand-selected bone-in mutton. Slow-dum cooked. Deep masala layering. Rich and regal.",
  },
  {
    name: "Zaffrani Sabz Biryani",
    description:
      "Seasonal vegetables layered with saffron bloom and whole spices. Elegant vegetarian royalty.",
  },
  {
    name: "Sehat Sabz Biryani",
    description:
      "Balanced, lighter vegetable biryani. Crafted fresh. Less oil. Whole spices.",
  },
  {
    name: "Sehat Murgh Biryani",
    description:
      "Lean chicken cuts. Balanced masala. Dum sealed for strength with refinement.",
  },
];

const ProductCard = ({ product }: { product: Product }) => {
  const [flavor, setFlavor] = useState<"hyderabadi" | "muradabadi">("hyderabadi");
  const [bone, setBone] = useState<"bone" | "boneless">("bone");

  return (
    <div className="group border border-gold/20 bg-card hover:border-gold/40 transition-all duration-500 p-6 md:p-8">
      <div className="aspect-square mb-6 overflow-hidden bg-muted/20">
        <img
          src={packagingImg}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <h3 className="font-heading text-xl md:text-2xl text-gold mb-3 tracking-wide">
        {product.name}
      </h3>
      <p className="font-body text-sm md:text-base text-muted-foreground mb-5 leading-relaxed">
        {product.description}
      </p>

      {product.hasFlavorToggle && (
        <div className="flex gap-2 mb-3">
          {(["hyderabadi", "muradabadi"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFlavor(f)}
              className={`font-body text-xs uppercase tracking-wider px-3 py-1.5 border transition-all ${
                flavor === f
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:border-gold/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {product.hasBoneToggle && (
        <div className="flex gap-2 mb-5">
          {(["bone", "boneless"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBone(b)}
              className={`font-body text-xs uppercase tracking-wider px-3 py-1.5 border transition-all ${
                bone === b
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:border-gold/30"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      <a
        href="#contact"
        className="inline-block w-full text-center bg-gradient-saffron font-heading text-sm tracking-[0.15em] uppercase px-6 py-3 text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Dawat Mangaiye
      </a>
    </div>
  );
};

const RoyalFive = () => {
  return (
    <section id="menu" className="section-padding bg-gradient-royal mughal-pattern">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-heading text-sm tracking-[0.4em] uppercase text-saffron mb-4">
            The Royal Five
          </p>
          <h2 className="heading-lg text-gradient-gold">THE ROYAL DAWAT</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoyalFive;
