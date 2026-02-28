import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/?text=Dawat%20on%20WhatsApp"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-saffron pl-5 pr-6 py-3 shadow-saffron hover:opacity-90 transition-opacity group"
    >
      <MessageCircle size={20} className="text-primary-foreground" />
      <span className="font-heading text-xs tracking-[0.15em] uppercase text-primary-foreground">
        Dawat on WhatsApp
      </span>
    </a>
  );
};

export default WhatsAppButton;
