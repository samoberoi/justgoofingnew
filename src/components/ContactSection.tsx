import { useState } from "react";
import { Send } from "lucide-react";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - integrate with backend
  };

  return (
    <section id="contact" className="section-padding bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-heading text-sm tracking-[0.4em] uppercase text-saffron mb-4">
            Reach Us
          </p>
          <h2 className="heading-lg text-gradient-gold">Contact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { key: "name", label: "Name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block font-heading text-xs tracking-[0.2em] uppercase text-foreground/60 mb-2">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-card border border-border px-4 py-3 font-body text-foreground focus:border-gold focus:outline-none transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block font-heading text-xs tracking-[0.2em] uppercase text-foreground/60 mb-2">
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full bg-card border border-border px-4 py-3 font-body text-foreground focus:border-gold focus:outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-saffron font-heading text-sm tracking-[0.2em] uppercase px-8 py-4 text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send Message
            </button>
          </form>

          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-gold mb-2">
                Phone
              </h3>
              <p className="font-body text-foreground/70">+91 XXXX XXXX XX</p>
            </div>
            <div>
              <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-gold mb-2">
                Email
              </h3>
              <p className="font-body text-foreground/70">dawat@biryaan.com</p>
            </div>
            <div>
              <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-gold mb-2">
                Hours
              </h3>
              <p className="font-body text-foreground/70">
                11:00 AM — 11:00 PM | Every Day
              </p>
            </div>
            {/* Map placeholder */}
            <div className="aspect-video border border-gold/20 bg-card flex items-center justify-center">
              <p className="font-heading text-sm text-muted-foreground tracking-wider">
                Map Placeholder
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
