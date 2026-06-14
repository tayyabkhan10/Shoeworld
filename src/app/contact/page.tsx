"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import  WhatsAppButton  from "@/components/WhatsAppButton"
import { MapPin, Phone, Mail, Clock, CheckCircle2, Send } from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["Mumtazabad Market, Main Road", "Multan, Punjab, Pakistan"],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+92 303 6157070", "+92 318 1664079"],
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["kashanrana004@gmail.com", "tk2926868@gmail.com"],
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: ["Mon – Sat: 10am – 10pm", "Sunday: 11am – 11pm"],
  },
];

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 3-5 business days within Pakistan. International orders take 7-14 business days.",
  },
  {
    q: "Can I return my purchase?",
    a: "Yes! We offer a 30-day hassle-free return policy. Items must be unworn and in original packaging.",
  },
  {
    q: "Do you offer size exchanges?",
    a: "Absolutely. Contact us within 30 days of purchase and we'll arrange an exchange at no extra cost.",
  },
  {
    q: "How do I track my order?",
    a: "Once shipped, you'll receive a tracking number via email. You can also view your orders in your account.",
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <WhatsAppButton/>
      <Navbar />
   
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-widest text-primary-foreground/60 mb-4">We're Here to Help</p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-primary-foreground/70 max-w-xl mx-auto">
            Have a question, concern, or just want to say hello? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {contactInfo.map((info) => (
            <div key={info.title} className="border border-border p-6 hover:border-primary transition-colors duration-300 group">
              <div className="mb-3 p-2 w-fit bg-primary/10 group-hover:bg-primary/20 transition-colors rounded-md">
                <info.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{info.title}</h3>
              {info.lines.map((line) => (
                <p key={line} className="text-sm text-muted-foreground">{line}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Contact Form + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2">Send a Message</h2>
            <p className="text-muted-foreground mb-8">We typically respond within 24 hours during business days.</p>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-border bg-muted/30">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground max-w-sm">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <Button className="mt-6 rounded-none" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="rounded-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="rounded-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Subject</label>
                  <Input
                    placeholder="What is this about?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="rounded-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    placeholder="Tell us how we can help..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={6}
                    required
                    className="w-full border border-input bg-background px-3 py-2 text-sm rounded-none focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-none font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2">FAQs</h2>
            <p className="text-muted-foreground mb-8">Quick answers to common questions.</p>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="border border-border p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="h-64 bg-muted border-t border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Mumtazabad market main road, Multan, Punjab, Pakistan</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
