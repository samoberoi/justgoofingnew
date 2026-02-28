import { useState } from "react";
import packagingImg from "@/assets/packaging-royal.jpg";
import { ShieldCheck } from "lucide-react";

interface Product {
  name: string;
  description: string;
  isNonVeg?: boolean;
  isSehat?: boolean;
  protein?: string;
}

const products: Product[] = [
  {
    name: "Badshahi Murgh Biryani",
    description:
      "Royal chicken layered with aromatic basmati, saffron infusion, hand-ground masalas. Dum sealed individually.",
    isNonVeg: true,
  },
  {
    name: "Nawabi Gosht Biryani",
    description:
      "Hand-selected bone-in mutton. Slow-dum cooked. Deep masala layering. Rich and regal.",
    isNonVeg: true,
  },
  {
    name: "Zaffrani Sabz Biryani",
    description:
      "Seasonal vegetables layered with saffron bloom and whole spices. Elegant vegetarian royalty.",
  },
  {
    name: "Sehat Sabz Biryani",
    description:
      "Balanced, lighter vegetable biryani with paneer & chickpeas. Crafted fresh. Less oil. Whole spices.",
    isSehat: true,
    protein: "18g protein per serving",
  },
  {
    name: "Sehat Murgh Biryani",
    description:
      "Lean chicken cuts. Balanced masala. Dum sealed for strength with refinement.",
    isNonVeg: true,
    isSehat: true,
    protein: "32g protein per serving",
  },
];

const ProductCard = ({ product }: { product: Product }) => {
  const [flavor, setFlavor] = useState<"hyderabadi" | "muradabadi">("hyderabadi");
  const [bone, setBone] = useState<"bone" | "boneless">("bone");

  return (
    <div className="group flex flex-col border border-gold/20 bg-card hover:border-gold/40 transition-all duration-500 p-6 md:p-8 h-full">
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
      <p className="font-body text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
        {product.description}
      </p>

      {/* Spacer to push toggles and CTA to bottom */}
      <div className="flex-1" />

      {/* Protein badge for Sehat range */}
      {product.isSehat && product.protein && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 border border-gold/20 bg-gold/5">
          <ShieldCheck size={16} className="text-gold shrink-0" />
          <span className="font-heading text-xs tracking-[0.1em] uppercase text-gold">
            {product.protein}
          </span>
        </div>
      )}

      {/* Flavor toggle — shown for all non-veg, placeholder for veg to keep alignment */}
      <div className="mb-3 min-h-[34px]">
        {product.isNonVeg ? (
          <div className="flex gap-2">
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
        ) : null}
      </div>

      {/* Bone toggle — shown for all non-veg, placeholder for veg to keep alignment */}
      <div className="mb-5 min-h-[34px]">
        {product.isNonVeg ? (
          <div className="flex gap-2">
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
        ) : null}
      </div>

      <a
        href="#contact"
        className="inline-block w-full text-center bg-gradient-saffron font-heading text-sm tracking-[0.15em] uppercase px-6 py-3 text-primary-foreground hover:opacity-90 transition-opacity mt-auto"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {products.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoyalFive;
