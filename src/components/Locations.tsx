import { MapPin } from "lucide-react";

const locations = [
  "Location A",
  "Location B",
  "Location C",
  "Location D",
  "Location E",
  "Location F",
];

const Locations = () => {
  return (
    <section id="locations" className="section-padding bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-heading text-sm tracking-[0.4em] uppercase text-saffron mb-4">
            Presence
          </p>
          <h2 className="heading-lg text-gradient-gold">
            Where the Sultanate Stands
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc, i) => (
            <div
              key={i}
              className="border-2 border-gold/30 p-8 text-center group hover:border-gold hover:shadow-gold transition-all duration-500"
            >
              <MapPin size={28} className="text-gold mx-auto mb-4" />
              <h3 className="font-heading text-lg tracking-[0.15em] uppercase text-foreground">
                {loc}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Locations;
