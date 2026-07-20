'use client'; // ✅ Single quotes + semicolon

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import {
  useGetCart,
  getGetCartQueryKey,
  useCreateOrder,
  getListOrdersQueryKey
} from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatPKR, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/pkr";

const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  line1: z.string().min(5, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  zip: z.string().min(3, "ZIP/Postal code is required"),
  country: z.string().min(2, "Country is required"),
  customerPhone: z.string()
    .min(11, "Phone number must be at least 11 digits")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export default function Checkout() {
  const router = useRouter(); // ✅ Added: replaces useLocation
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart();

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | null>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  const { mutate: createOrder, isPending } = useCreateOrder({
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      toast({
        title: "Order confirmed",
        description: `Order #${order.id} placed successfully.`,
        duration : 2000,
      });
      router.push(`/orders/${order.id}`); // ✅ Fixed: setLocation → router.push
    },
    onError: () => {
      toast({
        title: "Failed to place order",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      country: "Pakistan",
      customerPhone: "",
    },
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-24 text-center">Loading checkout...</div>;
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart"); // ✅ Fixed: setLocation → router.push
    return null;
  }

  const shipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = cart.subtotal + shipping;

  function onSubmit(data: ShippingFormValues) {
    const { customerPhone, ...shippingAddress } = data;
    createOrder({ shippingAddress, customerPhone, paymentMethod: paymentMethod ?? undefined });
  }

  const handleOrderSubmission = () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select Cash on Delivery or Online Payment.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "online") {
      setShowOnlineModal(true);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Navbar />
      <h1 className="text-3xl font-serif font-bold mb-8">Checkout</h1>

      {/* Payment Method Selector */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider">Step 1: Select Payment Method</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("cod")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === "cod"
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold">Cash on Delivery</div>
            <div className="text-sm text-muted-foreground mt-1">Pay when your order arrives at your doorstep</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("online")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === "online"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold">Online Payment (NayaPay)</div>
            <div className="text-sm text-muted-foreground mt-1">Pay instantly via mobile wallet</div>
          </button>
        </div>
      </div>

      {/* Order Details Grid */}
      <div className={`transition-opacity ${paymentMethod ? "opacity-100 pointer-events-auto" : "opacity-50 pointer-events-none"}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Form */}
          <div>
            <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider">Step 2: Shipping Information</h2>
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); handleOrderSubmission(); }} className="space-y-5">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Enter Your Name" className="rounded-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="line1" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl><Input placeholder="House #, Street name" className="rounded-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="line2" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl><Input placeholder="Block, Area, Colony" className="rounded-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="Lahore" className="rounded-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl><Input placeholder="Punjab" className="rounded-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl><Input placeholder="54000" className="rounded-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input placeholder="Pakistan" className="rounded-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="customerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (No Spacing or - )</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="***********"
                        className="rounded-none"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="pt-8">
                  <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-none" disabled={isPending}>
                    {isPending ? "Processing..." : `Complete Order • ${formatPKR(total)}`}
                  </Button>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    By completing your order, you agree to our Terms of Service.
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-muted/30 p-8 border">
              <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 shrink-0 bg-muted overflow-hidden border">
                      <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <h4 className="font-semibold line-clamp-1">{item.productName}</h4>
                      <p className="text-muted-foreground mt-1">{item.color} / Size {item.size}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-medium">{formatPKR(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPKR(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-2xl">{formatPKR(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Payment Modal */}
      {showOnlineModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowOnlineModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
            <h3 className="text-xl font-bold mb-2">Complete Online Payment</h3>
            <p className="text-muted-foreground mb-6 text-sm">Please send the exact total amount to the details below:</p>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-lg mb-6 text-center space-y-3">
              <p className="text-3xl font-bold tracking-wider text-gray-900">03181664079</p>
              <p className="text-lg font-semibold text-green-700">NayaPay</p>
              <div className="pt-2 border-t border-green-200 mt-2">
                <p className="text-sm text-muted-foreground">Amount to Send</p>
                <p className="text-xl font-bold text-gray-900">{formatPKR(total)}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-6 text-center">
              After sending the payment, click the button below to confirm your order.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowOnlineModal(false);
                  form.handleSubmit(onSubmit)();
                }}
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={isPending}
              >
                {isPending ? "Processing Order..." : "I Have Paid • Place Order"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowOnlineModal(false)}
                className="w-full text-muted-foreground"
              >
                Go Back & Change Payment Method
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}