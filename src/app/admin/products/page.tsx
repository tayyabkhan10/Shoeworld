// 'use client';
// import { useState, useCallback, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useQueryClient } from "@tanstack/react-query";
// import { useDropzone } from "react-dropzone";
// import {
//   useListProducts,
//   getListProductsQueryKey,
//   useCreateProduct,
//   useUpdateProduct,
//   useDeleteProduct,
//   getGetFeaturedProductsQueryKey,
//   type Product
// } from "@/hooks/api";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";
// import { Edit, Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
// import { AdminLayout } from "@/components/admin/AdminLayout";
// import { formatPKR } from "@/lib/pkr";

// // ── Schema ─────────────────────────────────────────────────
//  const productSchema = z.object({
//   name: z.string().min(1, "Name is required"),
//   description: z.string().optional().nullable(),
//   price: z.coerce.number().min(0, "Price must be positive"),
//   originalPrice: z.coerce.number().min(0).optional().nullable(),
//   category: z.string().min(1, "Category is required"),
//   imageUrl: z.string().url("Must be a valid URL").optional().nullable(),
//   sizes: z.string().min(1, "Sizes required (comma separated)"),
//   colors: z.string().min(1, "Colors required (comma separated)"),
//   stockCount: z.coerce.number().int().min(0).optional().nullable(),
//   featured: z.boolean().default(false),
//   inStock: z.boolean().default(true),
//   additionalImages: z.array(z.string().url()).optional().default([]),
// });

//  type ProductFormValues = z.infer<typeof productSchema>;

// // ── Cloudinary Upload ───────────────────────────────────────
// async function uploadToCloudinary(file: File): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   const response = await fetch("/api/upload", { method: "POST", body: formData });
//   if (!response.ok) {
//     const errData = await response.json().catch(() => ({}));
//     throw new Error(errData.error || "Upload failed");
//   }
//   const data = await response.json();
//   return data.url;
// }

// // ── Cloudinary Delete ───────────────────────────────────────
// async function deleteFromCloudinary(url: string): Promise<void> {
//   // Sirf Cloudinary URLs delete karo (blob: ya placeholder nahi)
//   if (!url || !url.includes("cloudinary.com")) return;
//   try {
//     await fetch("/api/upload", {
//       method: "DELETE",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ url }),
//     });
//   } catch (err) {
//     console.error("Cloudinary delete error:", err);
//   }
// }

// // ── Single Image Upload Component ──────────────────────────
// interface ImageUploadProps {
//   value: string | null | undefined;
//   onChange: (value: string | null) => void;
//   label: string;
// }

// function ImageUpload({ value, onChange, label }: ImageUploadProps) {
//   const [preview, setPreview] = useState<string | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string>("");

//   useEffect(() => {
//     if (value && value.startsWith("http")) setPreview(value);
//     else if (!value) setPreview(null);
//   }, [value]);

//   useEffect(() => {
//     return () => {
//       if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
//     };
//   }, [preview]);

//   const onDrop = useCallback(async (acceptedFiles: File[]) => {
//     setError("");
//     if (acceptedFiles.length === 0) return;
//     const file = acceptedFiles[0];
//     const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
//     if (!validTypes.includes(file.type)) { setError("Only JPG, PNG, WebP, or GIF allowed"); return; }
//     if (file.size > 5 * 1024 * 1024) { setError("Image size must be less than 5MB"); return; }

//     const objectUrl = URL.createObjectURL(file);
//     setPreview(objectUrl);
//     setUploading(true);
//     try {
//       const cloudinaryUrl = await uploadToCloudinary(file);
//       onChange(cloudinaryUrl);
//       URL.revokeObjectURL(objectUrl);
//       setPreview(cloudinaryUrl);
//     } catch (err: any) {
//       setError(err.message || "Failed to upload image. Please try again.");
//       URL.revokeObjectURL(objectUrl);
//       setPreview(value || null);
//     } finally {
//       setUploading(false);
//     }
//   }, [onChange, value]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
//     maxSize: 5 * 1024 * 1024,
//     multiple: false,
//     disabled: uploading,
//   });

//   const removeImage = async () => {
//     if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
//     // Cloudinary se bhi delete karo
//     if (value) await deleteFromCloudinary(value);
//     setPreview(null);
//     onChange(null);
//     setError("");
//   };

//   const displayUrl = preview || value;

//   return (
//     <div className="space-y-3">
//       <FormLabel>{label}</FormLabel>
//       <div
//         {...getRootProps()}
//         className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
//           ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
//           ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
//       >
//         <input {...getInputProps()} />
//         {uploading ? (
//           <div className="flex flex-col items-center gap-2">
//             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             <p className="text-sm text-gray-600">Cloudinary pe upload ho raha hai...</p>
//           </div>
//         ) : isDragActive ? (
//           <div className="flex flex-col items-center gap-2 text-blue-600">
//             <Upload className="w-8 h-8" />
//             <p className="text-sm font-medium">Drop image here...</p>
//           </div>
//         ) : (
//           <div className="flex flex-col items-center gap-2">
//             <Upload className="w-8 h-8 text-gray-400" />
//             <div>
//               <p className="text-sm font-medium text-gray-700">Drag & drop image here</p>
//               <p className="text-xs text-gray-500 mt-1">or click to browse • Max 5MB • JPG, PNG, WebP</p>
//             </div>
//           </div>
//         )}
//       </div>
//       {error && <p className="text-sm text-red-500">{error}</p>}
//       {displayUrl && (
//         <div className="relative inline-block group">
//           <img src={displayUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border"
//             onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
//           <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }}
//             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
//             aria-label="Remove image">
//             <X className="w-3 h-3" />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Multiple Image Upload Component ────────────────────────
// interface MultipleImageUploadProps {
//   value: string[];
//   onChange: (value: string[]) => void;
//   label: string;
// }

// function MultipleImageUpload({ value = [], onChange, label }: MultipleImageUploadProps) {
//   const [previews, setPreviews] = useState<Record<string, string>>({});
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string>("");

//   useEffect(() => {
//     setPreviews(prev => {
//       const newPreviews = { ...prev };
//       value.forEach(url => {
//         if (!newPreviews[url] && url.startsWith("http")) newPreviews[url] = url;
//       });
//       Object.keys(newPreviews).forEach(key => {
//         if (!value.includes(key) && newPreviews[key]?.startsWith("blob:")) {
//           URL.revokeObjectURL(newPreviews[key]);
//           delete newPreviews[key];
//         }
//       });
//       return newPreviews;
//     });
//   }, [value]);

//   useEffect(() => {
//     return () => {
//       Object.values(previews).forEach(p => { if (p.startsWith("blob:")) URL.revokeObjectURL(p); });
//     };
//   }, []);

//   const onDrop = useCallback(async (acceptedFiles: File[]) => {
//     setError("");
//     if (acceptedFiles.length === 0) return;
//     const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
//     if (acceptedFiles.find(f => !validTypes.includes(f.type))) { setError("Only JPG, PNG, WebP, or GIF allowed"); return; }
//     if (acceptedFiles.find(f => f.size > 5 * 1024 * 1024)) { setError("Image size must be less than 5MB"); return; }

//     setUploading(true);
//     try {
//       const newUrls: string[] = [];
//       for (const file of acceptedFiles) {
//         const objectUrl = URL.createObjectURL(file);
//         const tempKey = `temp_${file.name}_${Date.now()}`;
//         setPreviews(prev => ({ ...prev, [tempKey]: objectUrl }));
//         const cloudinaryUrl = await uploadToCloudinary(file);
//         newUrls.push(cloudinaryUrl);
//         URL.revokeObjectURL(objectUrl);
//         setPreviews(prev => {
//           const updated = { ...prev };
//           delete updated[tempKey];
//           updated[cloudinaryUrl] = cloudinaryUrl;
//           return updated;
//         });
//       }
//       onChange([...value, ...newUrls]);
//     } catch (err: any) {
//       setError(err.message || "Failed to upload images. Please try again.");
//     } finally {
//       setUploading(false);
//     }
//   }, [onChange, value]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
//     maxSize: 5 * 1024 * 1024,
//     multiple: true,
//     disabled: uploading,
//   });

//   const removeImage = async (index: number) => {
//     const urlToRemove = value[index];
//     if (urlToRemove && previews[urlToRemove]?.startsWith("blob:")) URL.revokeObjectURL(previews[urlToRemove]);
//     // Cloudinary se bhi delete karo
//     if (urlToRemove) await deleteFromCloudinary(urlToRemove);
//     const newPreviews = { ...previews };
//     delete newPreviews[urlToRemove];
//     setPreviews(newPreviews);
//     onChange(value.filter((_, i) => i !== index));
//   };

//   return (
//     <div className="space-y-3">
//       <FormLabel>{label}</FormLabel>
//       <div
//         {...getRootProps()}
//         className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
//           ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
//           ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
//       >
//         <input {...getInputProps()} />
//         {uploading ? (
//           <div className="flex flex-col items-center gap-2">
//             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             <p className="text-sm text-gray-600">Cloudinary pe upload ho raha hai...</p>
//           </div>
//         ) : isDragActive ? (
//           <div className="flex flex-col items-center gap-2 text-blue-600">
//             <Upload className="w-8 h-8" />
//             <p className="text-sm font-medium">Drop images here...</p>
//           </div>
//         ) : (
//           <div className="flex flex-col items-center gap-2">
//             <Upload className="w-8 h-8 text-gray-400" />
//             <div>
//               <p className="text-sm font-medium text-gray-700">Drag & drop images here</p>
//               <p className="text-xs text-gray-500 mt-1">or click to browse • Max 5MB each • JPG, PNG, WebP</p>
//             </div>
//           </div>
//         )}
//       </div>
//       {error && <p className="text-sm text-red-500">{error}</p>}
//       {value.length > 0 && (
//         <div className="grid grid-cols-4 gap-2">
//           {value.map((url, index) => {
//             const displayUrl = previews[url] || url;
//             return (
//               <div key={index} className="relative group">
//                 <img src={displayUrl} alt={`Preview ${index + 1}`}
//                   className="w-full h-20 object-cover rounded-lg border"
//                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
//                 <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }}
//                   className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
//                   aria-label="Remove image">
//                   <X className="w-3 h-3" />
//                 </button>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Main Component ──────────────────────────────────────────
// export default function AdminProducts() {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);

//   const { data: products, isLoading } = useListProducts();

//   const invalidate = () => {
//     queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
//     queryClient.invalidateQueries({ queryKey: getGetFeaturedProductsQueryKey() });
//   };

//   const { mutate: createProduct, isPending: isCreating } = useCreateProduct({
//     onSuccess: () => { invalidate(); setIsDialogOpen(false); toast({ title: "✅ Product created" }); },
//     onError: () => toast({ title: "❌ Failed to create product", variant: "destructive" }),
//   });

//   const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct({
//     onSuccess: () => { invalidate(); setIsDialogOpen(false); setEditingProduct(null); toast({ title: "✅ Product updated" }); },
//     onError: () => toast({ title: "❌ Failed to update product", variant: "destructive" }),
//   });

//   const { mutate: deleteProduct } = useDeleteProduct({
//     onSuccess: () => { invalidate(); toast({ title: "🗑️ Product deleted" }); },
//     onError: () => toast({ title: "❌ Failed to delete product", variant: "destructive" }),
//   });

//   const form = useForm<ProductFormValues>({
//     resolver: zodResolver(productSchema) as any,
//     defaultValues: {
//       name: "", description: null, price: 0, originalPrice: null,
//       category: "", imageUrl: null, sizes: "7,8,9,10,11",
//       colors: "Black,Brown", stockCount: null, featured: false,
//       inStock: true, additionalImages: [],
//     },
//     mode: "onBlur",
//   });

//   const openEditDialog = (product: Product) => {
//     setEditingProduct(product);
//     form.reset({
//       name: product.name,
//       description: product.description ?? null,
//       price: product.price,
//       originalPrice: product.originalPrice ?? null,
//       category: product.category,
//       imageUrl: product.imageUrl ?? null,
//       sizes: product.sizes?.join(",") || "7,8,9,10,11",
//       colors: product.colors?.join(",") || "Black,Brown",
//       stockCount: product.stockCount ?? null,
//       featured: product.featured ?? false,
//       inStock: product.inStock ?? true,
//       additionalImages: product.additionalImages || [],
//     });
//     setIsDialogOpen(true);
//   };

//   const openCreateDialog = () => {
//     setEditingProduct(null);
//     form.reset({
//       name: "", description: null, price: 0, originalPrice: null,
//       category: "", imageUrl: null, sizes: "7,8,9,10,11",
//       colors: "Black,Brown", stockCount: null, featured: false,
//       inStock: true, additionalImages: [],
//     });
//     setIsDialogOpen(true);
//   };

//   // Product delete karne pe uski saari images bhi Cloudinary se hatao
//   const handleDeleteProduct = async (product: Product) => {
//     if (!confirm(`Delete "${product.name}"?`)) return;
//     // Pehle images delete karo Cloudinary se
//     if (product.imageUrl) await deleteFromCloudinary(product.imageUrl);
//     for (const imgUrl of product.additionalImages || []) {
//       await deleteFromCloudinary(imgUrl);
//     }
//     deleteProduct(product.id);
//   };

//   const onSubmit = (values: ProductFormValues) => {
//     if (!editingProduct && !values.imageUrl) {
//       toast({ title: "⚠️ Please upload a product image", variant: "destructive" });
//       return;
//     }
//     const formattedData = {
//       ...values,
//       sizes: values.sizes.split(",").map(s => s.trim()).filter(Boolean),
//       colors: values.colors.split(",").map(c => c.trim()).filter(Boolean),
//       additionalImages: values.additionalImages?.filter(url => url && url.trim()) || [],
//       price: Number(values.price),
//       originalPrice: values.originalPrice ? Number(values.originalPrice) : null,
//       stockCount: values.stockCount ? Number(values.stockCount) : null,
//       imageUrl: values.imageUrl?.trim() ? values.imageUrl : null,
//     };
//     if (editingProduct) {
//       updateProduct({ id: editingProduct.id, data: formattedData as any });
//     } else {
//       createProduct(formattedData as any);
//     }
//   };

//   return (
//     <AdminLayout>
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Products</h1>
//             <p className="text-sm text-gray-500 mt-1">
//               {products?.length ?? 0} products · visible to all customers
//             </p>
//           </div>
//           <Button onClick={openCreateDialog} className="gap-2">
//             <Plus className="h-4 w-4" /> Add Product
//           </Button>
//         </div>

//         {/* Dialog */}
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</DialogTitle>
//               <DialogDescription>Fill in the product details below. Drag & drop images to upload.</DialogDescription>
//             </DialogHeader>

//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

//                 <div className="p-4 bg-gray-50 rounded-lg border">
//                   <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
//                     <ImageIcon className="w-4 h-4" /> Product Images
//                   </h3>
//                   <FormField control={form.control} name="imageUrl" render={({ field }) => (
//                     <FormItem className="mb-4">
//                       <ImageUpload label="Main Product Image *" value={field.value ?? undefined}
//                         onChange={(url) => field.onChange(url)} />
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="additionalImages" render={({ field }) => (
//                     <FormItem>
//                       <MultipleImageUpload label="Additional Images (Optional)"
//                         value={field.value || []} onChange={(urls) => field.onChange(urls)} />
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField control={form.control} name="name" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Product Name *</FormLabel>
//                       <FormControl><Input placeholder="e.g. Classic Leather Boots" {...field} /></FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="category" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Category *</FormLabel>
//                       <FormControl><Input placeholder="boots, sneakers, loafers" {...field} /></FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField control={form.control} name="price" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Price (PKR) *</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="1" placeholder="e.g. 14999" {...field}
//                           onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? 0 : Number(val)); }}
//                           value={field.value ?? ""} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="originalPrice" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Orignal Price</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="1" placeholder="For discount display" {...field}
//                           onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? null : Number(val)); }}
//                           value={field.value ?? ""} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField control={form.control} name="sizes" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Sizes *</FormLabel>
//                       <FormControl><Input placeholder="7,8,9,10,11" {...field} /></FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="colors" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Colors *</FormLabel>
//                       <FormControl><Input placeholder="Black,Brown,White" {...field} /></FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField control={form.control} name="stockCount" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Stock Count</FormLabel>
//                       <FormControl>
//                         <Input type="number" {...field}
//                           onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? null : Number(val)); }}
//                           value={field.value ?? ""} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="description" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Description (Optional)</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Product details..." {...field}
//                           value={field.value ?? ""}
//                           onChange={(e) => field.onChange(e.target.value || null)} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 </div>

//                 <div className="flex gap-4">
//                   <FormField control={form.control} name="featured" render={({ field }) => (
//                     <FormItem className="flex items-center gap-3 rounded-lg border p-4">
//                       <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
//                       <FormLabel className="cursor-pointer font-medium">⭐ Featured Product</FormLabel>
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="inStock" render={({ field }) => (
//                     <FormItem className="flex items-center gap-3 rounded-lg border p-4">
//                       <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
//                       <FormLabel className="cursor-pointer font-medium">✅ In Stock</FormLabel>
//                     </FormItem>
//                   )} />
//                 </div>

//                 <div className="pt-4 flex justify-end gap-3">
//                   <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
//                   <Button type="submit" disabled={isCreating || isUpdating} className="min-w-[120px]">
//                     {isCreating || isUpdating ? (
//                       <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Saving...</>
//                     ) : "💾 Save Product"}
//                   </Button>
//                 </div>

//               </form>
//             </Form>
//           </DialogContent>
//         </Dialog>

//         {/* Products Table */}
//         {isLoading ? (
//           <div className="h-64 bg-gray-50 animate-pulse rounded-xl" />
//         ) : (
//           <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-gray-50 border-b border-gray-200">
//                   <TableHead className="w-[72px]">Image</TableHead>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Category</TableHead>
//                   <TableHead>Price</TableHead>
//                   <TableHead>Stock</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {products?.map((product) => (
//                   <TableRow key={product.id} className="hover:bg-gray-50">
//                     <TableCell>
//                       <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden border">
//                         {product.imageUrl ? (
//                           <img src={product.imageUrl} alt={product.name}
//                             className="h-full w-full object-cover"
//                             onError={(e) => {
//                               (e.target as HTMLImageElement).src =
//                                 "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";
//                             }} />
//                         ) : (
//                           <div className="h-full w-full flex items-center justify-center">
//                             <ImageIcon className="h-5 w-5 text-gray-300" />
//                           </div>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div>
//                         <span className="font-semibold text-sm">{product.name}</span>
//                         {product.featured && <Badge variant="secondary" className="ml-2 text-[10px]">FEATURED</Badge>}
//                       </div>
//                     </TableCell>
//                     <TableCell className="capitalize text-sm text-gray-600">{product.category}</TableCell>
//                     <TableCell>
//                       <div>
//                         <span className="font-semibold text-sm">{formatPKR(product.price)}</span>
//                         {product.originalPrice && (
//                           <span className="ml-2 text-xs text-gray-400 line-through">{formatPKR(product.originalPrice)}</span>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell className="text-sm">{product.stockCount ?? "—"}</TableCell>
//                     <TableCell>
//                       <Badge variant="outline" className={product.inStock
//                         ? "bg-green-50 text-green-700 border-green-200"
//                         : "bg-red-50 text-red-700 border-red-200"}>
//                         {product.inStock ? "In Stock" : "Out of Stock"}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}>
//                           <Edit className="h-3.5 w-3.5" />
//                         </Button>
//                         <Button variant="outline" size="icon"
//                           className="h-8 w-8 text-red-500 hover:bg-red-50 border-red-200"
//                           onClick={() => handleDeleteProduct(product)}>
//                           <Trash2 className="h-3.5 w-3.5" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 {(!products || products.length === 0) && (
//                   <TableRow>
//                     <TableCell colSpan={7} className="text-center py-12 text-gray-400">
//                       <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
//                       <p>No products found.</p>
//                       <Button variant="link" onClick={openCreateDialog} className="mt-2">+ Add your first product</Button>
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </div>
//     </AdminLayout>
//   );
// }



'use client';
import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  useListProducts,
  getListProductsQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getGetFeaturedProductsQueryKey,
  type Product
} from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Edit, Plus, Trash2, Upload, X, Image as ImageIcon,
  LayoutGrid, List, Star, PackageX, SlidersHorizontal,
  ArrowUpDown, Check, ChevronRight,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPKR } from "@/lib/pkr";

/* ─────────────────────────────────────────────────────────────
   DESIGN DIRECTION — "Signal White"
   Pure white surfaces with surgical precision. No background
   color except #ffffff and near-whites. Every element earns
   its place with micro-borders and shadow instead of color.
   
   white   #ffffff  — primary surface
   off     #fafafa  — secondary surface / page bg
   ink     #0a0a0a  — primary text
   mid     #6b7280  — secondary text
   line    #e5e7eb  — borders, dividers
   ghost   #f4f4f5  — hover states, chips
   danger  #ef4444  — destructive
   ───────────────────────────────────────────────────────────── */

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be positive"),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().nullable(),
  sizes: z.string().min(1, "Sizes required (comma separated)"),
  colors: z.string().min(1, "Colors required (comma separated)"),
  stockCount: z.coerce.number().int().min(0).optional().nullable(),
  featured: z.boolean().default(false),
  inStock: z.boolean().default(true),
  additionalImages: z.array(z.string().url()).optional().default([]),
});

type ProductFormValues = z.infer<typeof productSchema>;

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Upload failed");
  }
  const data = await response.json();
  return data.url;
}

async function deleteFromCloudinary(url: string): Promise<void> {
  if (!url || !url.includes("cloudinary.com")) return;
  try {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
}

// ── Single Image Upload ─────────────────────────────────────
interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label: string;
}

function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (value && value.startsWith("http")) setPreview(value);
    else if (!value) setPreview(null);
  }, [value]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError("");
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) { setError("Only JPG, PNG, WebP, or GIF allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image size must be less than 5MB"); return; }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      onChange(cloudinaryUrl);
      URL.revokeObjectURL(objectUrl);
      setPreview(cloudinaryUrl);
    } catch (err: any) {
      setError(err.message || "Upload failed. Try again.");
      URL.revokeObjectURL(objectUrl);
      setPreview(value || null);
    } finally {
      setUploading(false);
    }
  }, [onChange, value]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  const removeImage = async () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    if (value) await deleteFromCloudinary(value);
    setPreview(null);
    onChange(null);
    setError("");
  };

  const displayUrl = preview || value;

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">{label}</label>
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-150
          ${isDragActive
            ? "border-[#0a0a0a] bg-[#f4f4f5]"
            : "border-[#e5e7eb] hover:border-[#0a0a0a]/30 hover:bg-[#fafafa]"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#6b7280]">Uploading…</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-[#0a0a0a]" />
            <p className="text-sm font-medium text-[#0a0a0a]">Drop to upload</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#f4f4f5] flex items-center justify-center mb-1">
              <Upload className="w-5 h-5 text-[#6b7280]" />
            </div>
            <p className="text-sm font-medium text-[#0a0a0a]">Drop image or click to browse</p>
            <p className="text-xs text-[#6b7280]">JPG, PNG, WebP · max 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
      {displayUrl && (
        <div className="relative inline-flex group">
          <img src={displayUrl} alt="Preview"
            className="w-28 h-28 object-cover rounded-xl border border-[#e5e7eb]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }}
            className="absolute -top-2 -right-2 bg-[#0a0a0a] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Multiple Image Upload ────────────────────────────────────
interface MultipleImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
}

function MultipleImageUpload({ value = [], onChange, label }: MultipleImageUploadProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setPreviews(prev => {
      const newPreviews = { ...prev };
      value.forEach(url => {
        if (!newPreviews[url] && url.startsWith("http")) newPreviews[url] = url;
      });
      Object.keys(newPreviews).forEach(key => {
        if (!value.includes(key) && newPreviews[key]?.startsWith("blob:")) {
          URL.revokeObjectURL(newPreviews[key]);
          delete newPreviews[key];
        }
      });
      return newPreviews;
    });
  }, [value]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach(p => { if (p.startsWith("blob:")) URL.revokeObjectURL(p); });
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (acceptedFiles.find(f => !validTypes.includes(f.type))) { setError("Only JPG, PNG, WebP, or GIF allowed"); return; }
    if (acceptedFiles.find(f => f.size > 5 * 1024 * 1024)) { setError("Max 5MB per image"); return; }

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of acceptedFiles) {
        const objectUrl = URL.createObjectURL(file);
        const tempKey = `temp_${file.name}_${Date.now()}`;
        setPreviews(prev => ({ ...prev, [tempKey]: objectUrl }));
        const cloudinaryUrl = await uploadToCloudinary(file);
        newUrls.push(cloudinaryUrl);
        URL.revokeObjectURL(objectUrl);
        setPreviews(prev => {
          const updated = { ...prev };
          delete updated[tempKey];
          updated[cloudinaryUrl] = cloudinaryUrl;
          return updated;
        });
      }
      onChange([...value, ...newUrls]);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [onChange, value]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    disabled: uploading,
  });

  const removeImage = async (index: number) => {
    const urlToRemove = value[index];
    if (urlToRemove && previews[urlToRemove]?.startsWith("blob:")) URL.revokeObjectURL(previews[urlToRemove]);
    if (urlToRemove) await deleteFromCloudinary(urlToRemove);
    const newPreviews = { ...previews };
    delete newPreviews[urlToRemove];
    setPreviews(newPreviews);
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">{label}</label>
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-150
          ${isDragActive ? "border-[#0a0a0a] bg-[#f4f4f5]" : "border-[#e5e7eb] hover:border-[#0a0a0a]/30 hover:bg-[#fafafa]"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#6b7280]">Uploading…</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-[#6b7280]">
            <Upload className="w-4 h-4" />
            <p className="text-sm">{isDragActive ? "Drop here" : "Drop multiple images or click"}</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
      {value.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {value.map((url, index) => {
            const displayUrl = previews[url] || url;
            return (
              <div key={index} className="relative group aspect-square">
                <img src={displayUrl} alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-[#e5e7eb]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="absolute -top-1.5 -right-1.5 bg-[#0a0a0a] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Types & Constants ────────────────────────────────────────
type ViewMode = "gallery" | "list" | "table";
type SortKey = "newest" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock-asc" | "featured";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "name-asc", label: "A → Z" },
  { value: "name-desc", label: "Z → A" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "stock-asc", label: "Stock ↑" },
];

// ── Shared UI pieces ─────────────────────────────────────────
function StatusDot({ inStock }: { inStock?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inStock ? "bg-emerald-500" : "bg-red-400"}`} />
      <span className={`text-xs font-medium ${inStock ? "text-emerald-700" : "text-red-500"}`}>
        {inStock ? "In stock" : "Out of stock"}
      </span>
    </span>
  );
}

function Thumb({ src, name, size = "md" }: { src?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "w-9 h-9", md: "w-12 h-12", lg: "w-16 h-16" };
  return (
    <div className={`${dims[size]} rounded-lg overflow-hidden border border-[#e5e7eb] flex-shrink-0 bg-[#f4f4f5]`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-1/2 h-1/2 text-[#d1d5db]" />
        </div>
      )}
    </div>
  );
}

// ── Gallery View (2-col mobile, 3-col tablet, 4-col desktop) ─
function GalleryView({ products, onEdit, onDelete }: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map((p) => (
        <article
          key={p.id}
          className="group relative bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
        >
          {/* Image area */}
          <div className="relative aspect-[3/4] bg-[#fafafa] overflow-hidden">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${!p.inStock ? "opacity-50" : ""}`}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-[#d1d5db]" />
              </div>
            )}

            {/* Overlaid badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
              {p.featured && (
                <span className="inline-flex items-center gap-1 bg-[#0a0a0a] text-white text-[10px] font-medium px-2 py-1 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Featured
                </span>
              )}
              {!p.inStock && (
                <span className="ml-auto bg-white/90 backdrop-blur-sm text-[#6b7280] text-[10px] font-medium px-2 py-1 rounded-full border border-[#e5e7eb]">
                  Sold out
                </span>
              )}
            </div>

            {/* Hover action strip */}
            <div className="absolute inset-x-0 bottom-0 p-2 flex gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => onEdit(p)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/95 backdrop-blur-sm text-[#0a0a0a] text-xs font-medium py-2 rounded-xl border border-[#e5e7eb] hover:bg-white transition-colors"
              >
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => onDelete(p)}
                className="w-9 flex items-center justify-center bg-white/95 backdrop-blur-sm text-[#ef4444] rounded-xl border border-[#e5e7eb] hover:bg-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Info area */}
          <div className="p-3">
            <p className="text-[13px] font-semibold text-[#0a0a0a] truncate leading-snug">{p.name}</p>
            <p className="text-[11px] text-[#6b7280] capitalize mt-0.5 truncate">{p.category}</p>
            <div className="mt-2 flex items-center justify-between gap-1">
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-[#0a0a0a]">{formatPKR(p.price)}</span>
                {p.originalPrice && (
                  <span className="ml-1 text-[11px] text-[#6b7280] line-through">{formatPKR(p.originalPrice)}</span>
                )}
              </div>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.inStock ? "bg-emerald-500" : "bg-red-400"}`} title={p.inStock ? "In stock" : "Out of stock"} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── List View — horizontal cards, clean & spacious ───────────
function ListView({ products, onEdit, onDelete }: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div
          key={p.id}
          className="group flex items-center gap-4 bg-white rounded-2xl border border-[#e5e7eb] px-4 py-3.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-[#0a0a0a]/10 transition-all duration-150"
        >
          <Thumb src={p.imageUrl} name={p.name} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-[#0a0a0a] truncate max-w-[160px] sm:max-w-xs">{p.name}</span>
              {p.featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0a0a0a] bg-[#f4f4f5] px-2 py-0.5 rounded-full border border-[#e5e7eb]">
                  <Star className="w-2.5 h-2.5 fill-[#0a0a0a]" /> Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs capitalize text-[#6b7280]">{p.category}</span>
              <span className="text-[#e5e7eb]">·</span>
              <StatusDot inStock={p.inStock} />
              {p.stockCount != null && (
                <>
                  <span className="text-[#e5e7eb]">·</span>
                  <span className="text-xs text-[#6b7280]">{p.stockCount} units</span>
                </>
              )}
            </div>
          </div>

          {/* Price block */}
          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <span className="text-[15px] font-bold text-[#0a0a0a]">{formatPKR(p.price)}</span>
            {p.originalPrice && (
              <span className="text-xs text-[#6b7280] line-through">{formatPKR(p.originalPrice)}</span>
            )}
          </div>

          {/* Actions — always visible on mobile, hover on desktop */}
          <div className="flex items-center gap-1.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(p)}
              className="w-8 h-8 rounded-xl border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-[#0a0a0a] hover:text-white hover:border-[#0a0a0a] transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(p)}
              className="w-8 h-8 rounded-xl border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Table View — clean data table with proper columns ────────
function TableView({ products, onEdit, onDelete }: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#fafafa]">
              <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider w-16">Image</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Stock</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                className={`group hover:bg-[#fafafa] transition-colors ${i !== products.length - 1 ? "border-b border-[#f4f4f5]" : ""}`}
              >
                <td className="px-5 py-3.5">
                  <Thumb src={p.imageUrl} name={p.name} size="md" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0a0a0a] text-[13px]">{p.name}</span>
                      {p.featured && (
                        <Star className="w-3 h-3 fill-[#0a0a0a] text-[#0a0a0a] flex-shrink-0" />
                      )}
                    </div>
                    {p.description && (
                      <span className="text-xs text-[#6b7280] truncate max-w-[180px] mt-0.5">{p.description}</span>
                    )}
                    {/* show category + stock on mobile only */}
                    <div className="sm:hidden flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#6b7280] capitalize">{p.category}</span>
                      <span className="text-[#e5e7eb]">·</span>
                      <span className={`text-[11px] font-medium ${p.inStock ? "text-emerald-600" : "text-red-500"}`}>
                        {p.inStock ? "In stock" : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <span className="text-[13px] capitalize text-[#6b7280]">{p.category}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-[#0a0a0a]">{formatPKR(p.price)}</span>
                    {p.originalPrice && (
                      <span className="text-[11px] text-[#6b7280] line-through">{formatPKR(p.originalPrice)}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <span className="text-[13px] text-[#0a0a0a] font-medium">
                    {p.stockCount != null ? p.stockCount : <span className="text-[#6b7280]">—</span>}
                  </span>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <StatusDot inStock={p.inStock} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end items-center gap-1.5">
                    <button
                      onClick={() => onEdit(p)}
                      className="w-8 h-8 rounded-xl border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-[#0a0a0a] hover:text-white hover:border-[#0a0a0a] transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="w-8 h-8 rounded-xl border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Form Field wrapper ───────────────────────────────────────
function Field({ label, required, children, message }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  message?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#6b7280] uppercase tracking-wider">
        {label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {message && <p className="text-xs text-[#ef4444]">{message}</p>}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: products, isLoading } = useListProducts();

  const sortedProducts = useMemo(() => {
    const list = [...(products || [])];
    switch (sortBy) {
      case "name-asc": return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc": return list.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc": return list.sort((a, b) => a.price - b.price);
      case "price-desc": return list.sort((a, b) => b.price - a.price);
      case "stock-asc": return list.sort((a, b) => (a.stockCount ?? 0) - (b.stockCount ?? 0));
      case "featured": return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
      default: return list;
    }
  }, [products, sortBy]);

  const inStockCount = useMemo(() => (products || []).filter(p => p.inStock).length, [products]);
  const featuredCount = useMemo(() => (products || []).filter(p => p.featured).length, [products]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFeaturedProductsQueryKey() });
  };

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct({
    onSuccess: () => { invalidate(); setIsDialogOpen(false); toast({ title: "Product added" }); },
    onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
  });

  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct({
    onSuccess: () => { invalidate(); setIsDialogOpen(false); setEditingProduct(null); toast({ title: "Product updated" }); },
    onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
  });

  const { mutate: deleteProduct } = useDeleteProduct({
    onSuccess: () => { invalidate(); toast({ title: "Product deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "", description: null, price: 0, originalPrice: null,
      category: "", imageUrl: null, sizes: "7,8,9,10,11",
      colors: "Black,Brown", stockCount: null, featured: false,
      inStock: true, additionalImages: [],
    },
    mode: "onBlur",
  });

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      category: product.category,
      imageUrl: product.imageUrl ?? null,
      sizes: product.sizes?.join(",") || "7,8,9,10,11",
      colors: product.colors?.join(",") || "Black,Brown",
      stockCount: product.stockCount ?? null,
      featured: product.featured ?? false,
      inStock: product.inStock ?? true,
      additionalImages: product.additionalImages || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    form.reset({
      name: "", description: null, price: 0, originalPrice: null,
      category: "", imageUrl: null, sizes: "7,8,9,10,11",
      colors: "Black,Brown", stockCount: null, featured: false,
      inStock: true, additionalImages: [],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    if (product.imageUrl) await deleteFromCloudinary(product.imageUrl);
    for (const imgUrl of product.additionalImages || []) {
      await deleteFromCloudinary(imgUrl);
    }
    deleteProduct(product.id);
  };

  const onSubmit = (values: ProductFormValues) => {
    if (!editingProduct && !values.imageUrl) {
      toast({ title: "Please upload a product image", variant: "destructive" });
      return;
    }
    const formattedData = {
      ...values,
      sizes: values.sizes.split(",").map(s => s.trim()).filter(Boolean),
      colors: values.colors.split(",").map(c => c.trim()).filter(Boolean),
      additionalImages: values.additionalImages?.filter(url => url && url.trim()) || [],
      price: Number(values.price),
      originalPrice: values.originalPrice ? Number(values.originalPrice) : null,
      stockCount: values.stockCount ? Number(values.stockCount) : null,
      imageUrl: values.imageUrl?.trim() ? values.imageUrl : null,
    };
    if (editingProduct) {
      updateProduct({ id: editingProduct.id, data: formattedData as any });
    } else {
      createProduct(formattedData as any);
    }
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Sort";

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#fafafa] -m-4 sm:-m-6 p-4 sm:p-6">

        {/* ── Page header ────────────────────────────────── */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6b7280] mb-3 uppercase tracking-widest">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0a0a0a]">Products</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
                Products
              </h1>
              <p className="text-sm text-[#6b7280] mt-1">
                {(products || []).length} total · {inStockCount} in stock · {featuredCount} featured
              </p>
            </div>

            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1a1a1a] active:scale-[0.98] transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 bg-black" />
              Add product
            </button>
          </div>
        </header>

        {/* ── Toolbar ──────────────────────────────────── */}
        {!isLoading && sortedProducts.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                onBlur={() => setTimeout(() => setShowSortMenu(false), 150)}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0a0a0a] bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 hover:border-[#0a0a0a]/20 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6b7280]" />
                {currentSortLabel}
              </button>
              {showSortMenu && (
                <div className="absolute left-0 top-full mt-1.5 bg-white border border-[#e5e7eb] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-1 z-30 min-w-[160px]">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onMouseDown={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      className="w-full flex items-center justify-between gap-3 text-left px-3.5 py-2 text-sm text-[#0a0a0a] hover:bg-[#f4f4f5] transition-colors"
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#0a0a0a]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View switcher */}
            <div className="flex items-center bg-white border border-[#e5e7eb] rounded-xl p-1 gap-0.5">
              {([
                { value: "gallery" as ViewMode, icon: LayoutGrid, label: "Gallery" },
                { value: "list" as ViewMode, icon: List, label: "List" },
                { value: "table" as ViewMode, icon: SlidersHorizontal, label: "Table" },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === value
                      ? "bg-[#0a0a0a] text-white"
                      : "text-[#6b7280] hover:text-[#0a0a0a]"
                  }`}
                  title={label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Content ──────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="aspect-[3/4] animate-pulse bg-[#f4f4f5]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#f4f4f5]" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#f4f4f5]" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#e5e7eb] py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f4f4f5] flex items-center justify-center mb-4">
              <PackageX className="w-7 h-7 text-[#d1d5db]" />
            </div>
            <p className="text-[15px] font-semibold text-[#0a0a0a]">No products yet</p>
            <p className="text-sm text-[#6b7280] mt-1 max-w-xs">Add your first product to start building your catalog.</p>
            <button
              onClick={openCreateDialog}
              className="mt-5 inline-flex items-center gap-2 bg-[#0a0a0a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-colors"
            >
              <Plus className="w-4 h-4 bg-black" /> Add product
            </button>
          </div>
        ) : (
          <>
            {viewMode === "gallery" && <GalleryView products={sortedProducts} onEdit={openEditDialog} onDelete={handleDeleteProduct} />}
            {viewMode === "list" && <ListView products={sortedProducts} onEdit={openEditDialog} onDelete={handleDeleteProduct} />}
            {viewMode === "table" && <TableView products={sortedProducts} onEdit={openEditDialog} onDelete={handleDeleteProduct} />}
          </>
        )}

        {/* ── Add/Edit Dialog ───────────────────────────── */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-[#e5e7eb] shadow-[0_32px_80px_rgba(0,0,0,0.12)] p-0">

            {/* Dialog header */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#f4f4f5] px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#0a0a0a]">
                  {editingProduct ? "Edit product" : "New product"}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6b7280] mt-0.5">
                  {editingProduct ? "Update product information below." : "Fill in the details to add a new product."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Images section */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Images</p>
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (
                      <FormItem>
                        <ImageUpload label="Main image *" value={field.value ?? undefined} onChange={(url) => field.onChange(url)} />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="additionalImages" render={({ field }) => (
                      <FormItem>
                        <MultipleImageUpload label="Additional images" value={field.value || []} onChange={(urls) => field.onChange(urls)} />
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="h-px bg-[#f4f4f5]" />

                  {/* Basic info */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Classic Leather Boot" {...field}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Category *</FormLabel>
                          <FormControl>
                            <Input placeholder="boots, sneakers…" {...field}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Short product description…" {...field} value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="h-px bg-[#f4f4f5]" />

                  {/* Pricing */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Pricing</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Price (PKR) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" placeholder="14999" {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              value={field.value ?? ""}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="originalPrice" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Original Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" placeholder="For strikethrough" {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                              value={field.value ?? ""}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="stockCount" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Stock count</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                              value={field.value ?? ""}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="h-px bg-[#f4f4f5]" />

                  {/* Variants */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Variants</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="sizes" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Sizes *</FormLabel>
                          <FormControl>
                            <Input placeholder="7,8,9,10,11" {...field}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="colors" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Colors *</FormLabel>
                          <FormControl>
                            <Input placeholder="Black,Brown,White" {...field}
                              className="rounded-xl border-[#e5e7eb] focus-visible:ring-[#0a0a0a] text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="h-px bg-[#f4f4f5]" />

                  {/* Flags */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Visibility</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField control={form.control} name="featured" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 cursor-pointer hover:border-[#0a0a0a]/20 transition-colors">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange}
                              className="border-[#e5e7eb] data-[state=checked]:bg-[#0a0a0a] data-[state=checked]:border-[#0a0a0a]" />
                          </FormControl>
                          <div className="flex flex-col">
                            <FormLabel className="cursor-pointer text-sm font-semibold text-[#0a0a0a] flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5" /> Featured
                            </FormLabel>
                            <span className="text-xs text-[#6b7280]">Show on homepage</span>
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="inStock" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 cursor-pointer hover:border-[#0a0a0a]/20 transition-colors">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange}
                              className="border-[#e5e7eb] data-[state=checked]:bg-[#0a0a0a] data-[state=checked]:border-[#0a0a0a]" />
                          </FormControl>
                          <div className="flex flex-col">
                            <FormLabel className="cursor-pointer text-sm font-semibold text-[#0a0a0a]">In stock</FormLabel>
                            <span className="text-xs text-[#6b7280]">Available to purchase</span>
                          </div>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-[#f4f4f5]">
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm font-medium text-[#6b7280] hover:text-[#0a0a0a] hover:border-[#0a0a0a]/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0a0a0a] text-white text-sm font-semibold hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[130px]"
                    >
                      {isCreating || isUpdating ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : (
                        editingProduct ? "Save changes" : "Add product"
                      )}
                    </button>
                  </div>

                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}