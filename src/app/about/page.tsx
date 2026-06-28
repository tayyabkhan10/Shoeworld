"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import  WhatsAppButton  from "@/components/ui/WhatsAppButton"
import { Heart, Target, Users, Award, Leaf, Zap } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Passion for Craft",
    desc: "Every shoe is a labor of love. We obsess over every stitch, seam, and sole to deliver footwear that exceeds expectations.",
  },
  {
    icon: Target,
    title: "Precision Engineering",
    desc: "Our design process combines traditional techniques with modern innovation to create shoes that are as functional as they are beautiful.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    desc: "We responsibly source our materials and work with artisans who share our commitment to ethical and sustainable production.",
  },
  {
    icon: Zap,
    title: "Timeless Innovation",
    desc: "We honor classic footwear traditions while embracing new technologies that make our shoes more comfortable and durable.",
  },
];

const team = [
  {
    name: "Rana Kashan",
    role: "Founder & CEO",
    bio: "A undergraduate from University of central Punjab, Kashan brings global perspective and bold creativity to every collection.",
    initials: "RK",
  }, {
    name: "Rana Javaid",
    role: "Head of Production",
    bio: "With over 15 years in the footwear industry, Javaid founded this brand with a clear mission: premium shoes for everyone.",
    initials: "RJ",
  },
  {
    name: "Rana Adnan",
    role: "Head of Design",
    bio: "Adnan oversees our manufacturing partners across Pakistan and European Countries, ensuring uncompromising quality at every step.",
    initials: "RA",
  },
];

const milestones = [
  { year: "2014", event: "Founded in Multan, Pakistan with just 12 styles" },
  { year: "2016", event: "Expanded to 3 flagship stores across major shops" },
  { year: "2019", event: "Launched online — reached customers in 20+ countries" },
  { year: "2022", event: "Passed 10,000 pairs sold milestone" },
  { year: "2025", event: "500+ styles. Still crafted with the same passion." },
];

export default function About() {
  return (
    <div className="w-full">
      <WhatsAppButton />
      <Navbar />
      <section className="relative py-32 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-sm uppercase tracking-widest text-primary-foreground/60 mb-4">Our Story</p>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
            Made with Purpose,
            <br />
            Worn with Pride.
          </h1>
          <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Soft Chapal was born from a simple belief: exceptional footwear should be accessible, sustainable, and above all — beautifully made.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Our Mission</p>
            <h2 className="text-4xl font-serif font-bold mb-6">
              Crafting Confidence, One Pair at a Time
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
              We started Soft Chappal because we believed there was a gap in the market — shoes that looked luxury but didn't require a luxury budget. Shoes that told a story and lasted long enough to continue telling it.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              From our first workshop in Lahore to serving thousands of customers worldwide, our commitment has never wavered: make the best shoe possible, at the fairest price possible, and stand behind every single pair we sell.
            </p>
            <Link href="/shop">
              <Button size="lg" className="rounded-none px-10">
                Explore Collection →
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="aspect-square bg-muted overflow-hidden">
              <img src="/images/boots.png" alt="Our craft" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-8 w-48">
              <div className="text-4xl font-serif font-bold">10+</div>
              <div className="text-primary-foreground/70 text-sm mt-1">Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">What Drives Us</p>
            <h2 className="text-4xl font-serif font-bold">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-background border border-border p-8 hover:border-primary transition-colors duration-300">
                <div className="mb-4 p-3 w-fit bg-primary/10 rounded-md">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Our Journey</p>
            <h2 className="text-4xl font-serif font-bold">Milestones</h2>
          </div>
          <div className="relative">
            <div className="absolute left-16 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={m.year} className="flex gap-8 items-start">
                  <div className="w-32 text-right shrink-0">
                    <span className="font-serif font-bold text-2xl">{m.year}</span>
                  </div>
                  <div className="relative flex-1 pb-0">
                    <div className="absolute -left-[25px] top-2 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <p className="text-muted-foreground leading-relaxed pt-0.5">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-primary-foreground/60 mb-3">The People</p>
            <h2 className="text-4xl font-serif font-bold">Meet Our Team</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="text-center bg-primary-foreground/10 border border-primary-foreground/20 p-8 hover:border-primary-foreground/40 transition-colors">
                <div className="h-20 w-20 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-2xl font-serif mx-auto mb-4">
                  {member.initials}
                </div>
                <h3 className="font-bold text-xl mb-1">{member.name}</h3>
                <p className="text-primary-foreground/60 text-sm mb-4 uppercase tracking-wider">{member.role}</p>
                <p className="text-primary-foreground/70 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
            
          </div>
            <section className="pt-14">
        <div className="max-w-sm mx-auto px-4 text-center">
          <Link
            href="/developer"
            className="inline-flex items-center justify-center gap-2 
                 px-7 py-3 bg-white text-slate-800 font-medium text-[0.95rem]
                 border border-slate-200 rounded-lg
                 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-[1px]
                 active:translate-y-0 active:shadow-sm
                 transition-all duration-200 ease-out
                 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">
            View Our Developer
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
        </div>
      </section>
    

      {/* CTA */}
      <section className="py-24 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <Users className="h-5 w-5 text-primary" />
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-4xl font-serif font-bold mb-4">Become Part of Our Story</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
          Join thousands of customers who walk with confidence every day. Find your perfect pair in our collection.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button size="lg" className="rounded-none px-10">
              Shop Now
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="rounded-none px-10">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
