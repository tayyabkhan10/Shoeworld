import { Truck, RefreshCw, Shield, Award } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Shipping", desc: "Free delivery on orders over Rs. 25,000 anywhere in Pakistan." },
  { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free return policy. No questions asked." },
  { icon: Shield, title: "Authenticity Guaranteed", desc: "Every pair is genuine, certified, and quality-checked." },
  { icon: Award, title: "Premium Quality", desc: "Handcrafted from the finest leathers and materials." },
];

export default function BrandPromise() {
  return (
    <section className="py-16 sm:py-24 bg-muted/40" aria-label="Brand promise">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Why Choose Us</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Our Promise</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 bg-background border border-border hover:border-foreground hover:shadow-lg transition-all duration-300 hover-3d"
            >
              <div className="mb-5 p-3 w-10 h-10 border border-border flex items-center justify-center group-hover:border-foreground group-hover:bg-foreground transition-all duration-300">
                <feature.icon className="h-4 w-4 text-foreground group-hover:text-background transition-colors duration-300" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}