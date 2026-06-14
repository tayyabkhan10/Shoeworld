import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  imageUrl: string;
  additionalImages: string[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  stockCount: number;
  featured: boolean;
  rating: number | null;
  reviewCount: number;
  createdAt: string;
};

export type Category = { name: string; count: number };

export type CartItem = {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
};

export type CartResponse = {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
};

export type ShippingAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
};

export type Order = {
  id: number;
  userId: string;
  userEmail: string | null;
  status: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
  customerPhone?: string | null; 
  paymentMethod?: 'cod' | 'online';
};

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
};

export type TopProduct = {
  productId: number;
  name: string;
  imageUrl: string;
  totalSold: number;
  revenue: number;
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  lastActiveAt: number | null;
};

export type OrderStatusUpdateStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

// ── Query Keys ───────────────────────────────────────────────

export const getGetFeaturedProductsQueryKey = () => ["products", "featured"] as const;
export const getListProductsQueryKey = (params?: object) => ["products", params] as const;
export const getGetCategoriesQueryKey = () => ["categories"] as const;
export const getGetProductQueryKey = (id: number) => ["product", id] as const;
export const getGetCartQueryKey = () => ["cart"] as const;
export const getListOrdersQueryKey = () => ["orders"] as const;
export const getGetOrderQueryKey = (id: number) => ["order", id] as const;
export const getDashboardStatsQueryKey = () => ["dashboard", "stats"] as const;
export const getTopProductsQueryKey = () => ["dashboard", "top-products"] as const;
export const getRecentOrdersQueryKey = () => ["dashboard", "recent-orders"] as const;
export const getListAllOrdersQueryKey = (params?: object) => ["admin", "orders", params] as const;
export const getListAdminUsersQueryKey = () => ["admin", "users"] as const;

// ── Fetch Helper ─────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `API error ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

function post<T>(url: string, data?: unknown) {
  return apiFetch<T>(url, { method: "POST", body: data ? JSON.stringify(data) : undefined });
}

function patch<T>(url: string, data?: unknown) {
  return apiFetch<T>(url, { method: "PATCH", body: data ? JSON.stringify(data) : undefined });
}

function del<T>(url: string) {
  return apiFetch<T>(url, { method: "DELETE" });
}

// ── Product Hooks ────────────────────────────────────────────

export function useGetFeaturedProducts(
  options?: Omit<UseQueryOptions<Product[]>, "queryKey" | "queryFn">
) {
  return useQuery<Product[]>({
    queryKey: getGetFeaturedProductsQueryKey(),
    queryFn: () => apiFetch("/api/products/featured"),
    ...options,
  });
}

export type ListProductsParams = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  size?: string;
  color?: string;
};

export function useListProducts(
  params?: ListProductsParams,
  options?: Omit<UseQueryOptions<Product[]>, "queryKey" | "queryFn">
) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.minPrice != null) searchParams.set("minPrice", String(params.minPrice));
  if (params?.maxPrice != null) searchParams.set("maxPrice", String(params.maxPrice));
  if (params?.featured != null) searchParams.set("featured", String(params.featured));
  if (params?.size) searchParams.set("size", params.size);
  if (params?.color) searchParams.set("color", params.color);

  const qs = searchParams.toString();
  return useQuery<Product[]>({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => apiFetch(`/api/products${qs ? `?${qs}` : ""}`),
    ...options,
  });
}

export function useGetCategories(
  options?: Omit<UseQueryOptions<Category[]>, "queryKey" | "queryFn">
) {
  return useQuery<Category[]>({
    queryKey: getGetCategoriesQueryKey(),
    queryFn: () => apiFetch("/api/products/categories"),
    ...options,
  });
}

export function useGetProduct(
  id: number,
  options?: Omit<UseQueryOptions<Product>, "queryKey" | "queryFn">
) {
  return useQuery<Product>({
    queryKey: getGetProductQueryKey(id),
    queryFn: () => apiFetch(`/api/products/${id}`),
    enabled: !!id,
    ...options,
  });
}

type CreateProductData = {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  additionalImages?: string[];
  sizes: string[];
  colors: string[];
  stockCount?: number;
  featured?: boolean;
};

export function useCreateProduct(
  options?: UseMutationOptions<Product, Error, CreateProductData>
) {
  return useMutation<Product, Error, CreateProductData>({
    mutationFn: (data) => post("/api/products", data),
    ...options,
  });
}

export function useUpdateProduct(
  options?: UseMutationOptions<Product, Error, { id: number; data: Partial<CreateProductData> & { inStock?: boolean } }>
) {
  return useMutation<Product, Error, { id: number; data: Partial<CreateProductData> & { inStock?: boolean } }>({
    mutationFn: ({ id, data }) => patch(`/api/products/${id}`, data),
    ...options,
  });
}

export function useDeleteProduct(
  options?: UseMutationOptions<null, Error, number>
) {
  return useMutation<null, Error, number>({
    mutationFn: (id) => del(`/api/products/${id}`),
    ...options,
  });
}

// ── Cart Hooks ───────────────────────────────────────────────

export function useGetCart(
  options?: Omit<UseQueryOptions<CartResponse>, "queryKey" | "queryFn">
) {
  return useQuery<CartResponse>({
    queryKey: getGetCartQueryKey(),
    queryFn: () => apiFetch("/api/cart"),
    ...options,
  });
}

type AddToCartData = { productId: number; quantity: number; size: string; color: string };

export function useAddToCart(
  options?: UseMutationOptions<CartResponse, Error, AddToCartData>
) {
  return useMutation<CartResponse, Error, AddToCartData>({
    mutationFn: (data) => post("/api/cart/items", data),
    ...options,
  });
}

type UpdateCartItemData = { cartItemId: number; quantity: number };

export function useUpdateCartItem(
  options?: UseMutationOptions<CartResponse, Error, UpdateCartItemData>
) {
  return useMutation<CartResponse, Error, UpdateCartItemData>({
    mutationFn: ({ cartItemId, quantity }) =>
      patch(`/api/cart/items/${cartItemId}`, { quantity }),
    ...options,
  });
}

export function useRemoveCartItem(
  options?: UseMutationOptions<CartResponse, Error, number>
) {
  return useMutation<CartResponse, Error, number>({
    mutationFn: (cartItemId) => del(`/api/cart/items/${cartItemId}`),
    ...options,
  });
}

export function useClearCart(
  options?: UseMutationOptions<CartResponse, Error, void>
) {
  return useMutation<CartResponse, Error, void>({
    mutationFn: () => del("/api/cart/clear"),
    ...options,
  });
}

// ── Order Hooks ──────────────────────────────────────────────

type CreateOrderData = { shippingAddress: ShippingAddress , customerPhone: string , paymentMethod?: 'cod' | 'online';};

export function useCreateOrder(
  options?: UseMutationOptions<Order, Error, CreateOrderData>
) {
  return useMutation<Order, Error, CreateOrderData>({
    mutationFn: (data) => post("/api/orders", data),
    ...options,
  });
}

export function useListOrders(
  options?: Omit<UseQueryOptions<Order[]>, "queryKey" | "queryFn">
) {
  return useQuery<Order[]>({
    queryKey: getListOrdersQueryKey(),
    queryFn: () => apiFetch("/api/orders"),
    ...options,
  });
}

export function useGetOrder(
  id: number,
  options?: Omit<UseQueryOptions<Order>, "queryKey" | "queryFn">
) {
  return useQuery<Order>({
    queryKey: getGetOrderQueryKey(id),
    queryFn: () => apiFetch(`/api/orders/${id}`),
    enabled: !!id,
    ...options,
  });
}

// ── Admin / Dashboard Hooks ──────────────────────────────────

export function useGetDashboardStats(
  options?: Omit<UseQueryOptions<DashboardStats>, "queryKey" | "queryFn">
) {
  return useQuery<DashboardStats>({
    queryKey: getDashboardStatsQueryKey(),
    queryFn: () => apiFetch("/api/dashboard/stats"),
    ...options,
  });
}

export function useGetTopProducts(
  options?: Omit<UseQueryOptions<TopProduct[]>, "queryKey" | "queryFn">
) {
  return useQuery<TopProduct[]>({
    queryKey: getTopProductsQueryKey(),
    queryFn: () => apiFetch("/api/dashboard/top-products"),
    ...options,
  });
}

export function useGetRecentOrders(
  options?: Omit<UseQueryOptions<Order[]>, "queryKey" | "queryFn">
) {
  return useQuery<Order[]>({
    queryKey: getRecentOrdersQueryKey(),
    queryFn: () => apiFetch("/api/dashboard/recent-orders"),
    ...options,
  });
}

export function useListAllOrders(
  params?: { status?: string },
  options?: Omit<UseQueryOptions<Order[]>, "queryKey" | "queryFn">
) {
  const qs = params?.status ? `?status=${params.status}` : "";
  return useQuery<Order[]>({
    queryKey: getListAllOrdersQueryKey(params),
    queryFn: () => apiFetch(`/api/admin/orders${qs}`),
    ...options,
  });
}

type UpdateOrderStatusData = { id: number; status: OrderStatusUpdateStatus };

export function useUpdateOrderStatus(
  options?: UseMutationOptions<Order, Error, UpdateOrderStatusData>
) {
  return useMutation<Order, Error, UpdateOrderStatusData>({
    mutationFn: ({ id, status }) => patch(`/api/admin/orders/${id}/status`, { status }),
    ...options,
  });
}

export function useListAdminUsers(
  options?: Omit<UseQueryOptions<AdminUser[]>, "queryKey" | "queryFn">
) {
  return useQuery<AdminUser[]>({
    queryKey: getListAdminUsersQueryKey(),
    queryFn: () => apiFetch("/api/admin/users"),
    ...options,
  });
}



// Order Hooks section mein add karo
export function useDeleteOrder(
  options?: UseMutationOptions<null, Error, number>
) {
  return useMutation<null, Error, number>({
    mutationFn: (id) => del(`/api/admin/orders/${id}`),
    ...options,
  });
}