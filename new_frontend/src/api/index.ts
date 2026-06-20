const API = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000/api`;
/* ── TYPES ──────────────────────────────────────────────────── */
export interface Product {
  id:          number;
  slug:        string;
  name:        string;
  description: string;
  price:       number;
  image:       string;
  qty:         number;
  available:   boolean;
}
export interface Category {
  id:          number;
  slug:        string;
  name:        string;
  description: string;
  image_url:   string;
}
export interface CategoryProduct {
  id:            number;
  name:          string;
  initial_stock: number;
  stock:         number;
  is_active:     boolean;
  price:         number;
}
export interface CategoryDetail {
  id:          number;
  slug:        string;
  name:        string;
  description: string;
  image_url:   string;
  created_at:  string;
  updated_at:  string;
  products:    CategoryProduct[];
}
export interface AdminProductDetail {
  id:                  number;
  name:                string;
  slug:                string;
  description:         string;
  image_url:           string;
  price:               number;
  final_price:         number;
  discount_percentage: number;
  is_on_discount:      boolean;
  is_customisable:     boolean;
  is_active:           boolean;
  stock:               number;
  initial_stock:       number | null;
  currency:            string;
  created_at:          string;
  updated_at:          string;
}
export interface Order {
  id:       number;
  customer: string;
  phone:    string;
  address:  string;
  items:    { name: string; price: number; quantity: number }[];
  total:    number;
  status:   string;
  created:  string;
}
export interface CheckoutItem {
  product_id:  number;
  variant_id?: number;
  quantity:    number;
}
export interface OrderRequest {
  customer_name:    string;
  customer_email:   string;
  customer_phone:   string;
  delivery_address: string;
  payment_method:   string;
  currency:         string;
  items:            CheckoutItem[];
}
export interface OrderResponse {
  id:                 number;
  merchant_reference: string;
  status:             string;
  payment_status:     string;
  total_price:        number;
}
export interface OrderStatusResponse {
  order_id:           number;
  status:             string;
  payment_status:     string;
  total_price:        number;
  merchant_reference: string;
}
export interface Currency {
  id:           number;
  code:         string;
  name:         string;
  rate_to_kes:  number;
  is_active:    boolean;
  last_updated: string | null;
}
/* ── PARSERS ────────────────────────────────────────────────── */
function parseProduct(p: Record<string, unknown>): Product {
  return {
    id:          Number(p.id),
    slug:        (p.slug        as string)  || '',
    name:        p.name         as string,
    description: (p.description as string)  || '',
    price:       parseFloat(String(p.price)),
    image:       (p.image_url   as string)  || '',
    qty:         p.stock        as number,
    available:   p.is_active    as boolean,
  };
}
function parseOrder(o: unknown[]): Order {
  return {
    id:       o[0] as number,
    customer: o[1] as string,
    phone:    o[2] as string,
    address:  o[3] as string,
    items:    typeof o[4] === 'string' ? JSON.parse(o[4]) : (o[4] as Order['items']),
    total:    parseFloat(o[5] as string),
    status:   o[6] as string,
    created:  o[7] as string,
  };
}
/* ── AUTH ───────────────────────────────────────────────────── */
function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('sero_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch(`${API}/sero-internal/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();
  return data.access_token as string;
}
export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  const res = await fetch(`${API}/sero-internal/change-password`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || 'Password change failed');
  }
  const data = await res.json();
  return data.access_token as string;
}

/* ── PRODUCTS ───────────────────────────────────────────────── */
export async function getProducts(): Promise<Product[]> {
  const res  = await fetch(`${API}/products`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.products || []);
  return list.map(parseProduct);
}
export async function getProduct(id: number | string): Promise<Product> {
  const isSlug = isNaN(Number(id));
  const url    = isSlug ? `${API}/products/by-slug/${id}` : `${API}/products/${id}`;
  const res    = await fetch(url);
  if (!res.ok) throw new Error('Product not found');
  const data   = await res.json();
  return parseProduct(Array.isArray(data) ? data[0] : data);
}
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const res  = await fetch(`${API}/products?category=${slug}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.products || []);
  return list.map(parseProduct);
}
export async function createProduct(payload: {
  name:                string;
  slug:                string;
  description:         string;
  image_url:           string;
  price:               number;
  stock:               number;
  is_active:           boolean;
  is_customisable:     boolean;
  is_on_discount:      boolean;
  discount_percentage: number;
  category_id:         number;
}): Promise<void> {
  const res = await fetch(`${API}/new-product`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || 'Create failed');
  }
}
export async function toggleProduct(id: number): Promise<void> {
  const res = await fetch(`${API}/products/${id}/toggle`, {
    method: 'PUT', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Toggle failed');
}
export async function updateAdminProduct(
  id: number,
  payload: Partial<{ name: string; description: string; price: number; image: string; qty: number; available: boolean }>
): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (payload.name        !== undefined) mapped.name        = payload.name;
  if (payload.description !== undefined) mapped.description = payload.description;
  if (payload.price       !== undefined) mapped.price       = payload.price;
  if (payload.image       !== undefined) mapped.image_url   = payload.image;
  if (payload.qty         !== undefined) mapped.stock       = payload.qty;
  if (payload.available   !== undefined) mapped.is_active   = payload.available;
  const res = await fetch(`${API}/admin/products/${id}`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify(mapped),
  });
  if (!res.ok) throw new Error('Update failed');
}
export async function deleteAdminProduct(id: number): Promise<void> {
  const res = await fetch(`${API}/admin/products/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
}
export async function getAdminProducts(): Promise<Product[]> {
  const res  = await fetch(`${API}/admin/products`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Unauthorised');
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.products || []);
  return list.map(parseProduct);
}
export async function getAdminProductDetail(id: number): Promise<AdminProductDetail> {
  const res = await fetch(`${API}/admin/products/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch product detail');
  return res.json();
}
/* ── CATEGORIES ─────────────────────────────────────────────── */
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}
export async function createCategory(data: Omit<Category, 'id'>): Promise<Category> {
  const res = await fetch(`${API}/new-category`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
  return res.json();
}
export async function updateCategory(id: number, payload: Partial<Omit<Category, 'id'>>): Promise<Category> {
  const res = await fetch(`${API}/admin/categories/${id}`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Update failed'); }
  return res.json();
}
export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API}/admin/categories/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Delete failed'); }
}
export async function getCategoryDetail(id: number): Promise<CategoryDetail> {
  const res = await fetch(`${API}/admin/categories/${id}/detail`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch category detail');
  return res.json();
}
/* ── ORDERS ─────────────────────────────────────────────────── */
export async function createOrder(payload: OrderRequest): Promise<OrderResponse> {
  const res = await fetch(`${API}/orders`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || 'Order creation failed');
  }
  return res.json();
}
export async function getOrderStatus(orderId: number): Promise<OrderStatusResponse> {
  const res = await fetch(`${API}/orders/${orderId}/status`);
  if (!res.ok) throw new Error('Failed to fetch order status');
  return res.json();
}
export async function getOrders(): Promise<Order[]> {
  const res  = await fetch(`${API}/admin/orders`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Unauthorised');
  const data = await res.json();
  return (data.orders || []).map(parseOrder);
}
export async function updateOrderStatus(id: number, status: string): Promise<void> {
  const res = await fetch(`${API}/admin/orders/${id}`, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Status update failed');
}
/* ── CURRENCIES ─────────────────────────────────────────────── */
export async function getCurrencies(): Promise<Currency[]> {
  const res = await fetch(`${API}/currencies`);
  if (!res.ok) throw new Error('Failed to fetch currencies');
  return res.json();
}
export async function addCurrency(code: string, name: string): Promise<Currency> {
  const res = await fetch(`${API}/admin/currencies`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ code, name }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
  return res.json();
}
export async function removeCurrency(code: string): Promise<void> {
  const res = await fetch(`${API}/admin/currencies/${code}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
}
/* ── MISC ───────────────────────────────────────────────────── */
export async function subscribeNewsletter(email: string): Promise<void> {
  await fetch(`${API}/newsletter`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  });
}