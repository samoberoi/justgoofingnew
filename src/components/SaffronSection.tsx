import saffronImg from "@/assets/saffron.jpg";

const SaffronSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={saffronImg}
          alt="Saffron threads"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-20">
        <p className="font-heading text-sm tracking-[0.5em] uppercase text-saffron mb-6">
          The Essence
        </p>
        <h2 className="heading-xl text-gradient-gold mb-8">The Gold Within.</h2>
        <p className="font-body text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
          Every strand of saffron is hand-selected and bloomed before layering.
          This is not garnish — this is the soul of every BIRYAAN.
        </p>
      </div>
    </section>
  );
};

export default SaffronSection;
