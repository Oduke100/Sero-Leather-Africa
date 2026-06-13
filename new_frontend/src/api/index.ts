const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export interface Product {
  id:          number;
  name:        string;
  description: string;
  price:       number;
  image:       string;
  qty:         number;
  available:   boolean;
}

function parseProduct(p: Record<string, unknown>): Product {
  return {
    id:          p.id as number,
    name:        p.name as string,
    description: (p.description as string) || '',
    price:       parseFloat(String(p.price)),
    image:       (p.image_url as string) || '',
    qty:         p.stock as number,
    available:   p.is_active as boolean,
  };
}

export async function getProducts(): Promise<Product[]> {
  const res  = await fetch(`${API}/products`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.products || []);
  return list.map(parseProduct);
}

export async function getProduct(id: number): Promise<Product> {
  const res  = await fetch(`${API}/products/${id}`);
  const data = await res.json();
  return parseProduct(Array.isArray(data) ? data : data);
}

export interface Category {
  id:          number;
  name:        string;
  slug:        string;
  description: string;
  image_url:   string;
}

export async function getCategories(): Promise<Category[]> {
  const res  = await fetch(`${API}/categories`);
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

export async function subscribeNewsletter(email: string): Promise<void> {
  await fetch(`${API}/newsletter`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  });
}
/* ── ADMIN ─────────────────────────────────────────────────── */

export interface AdminProduct {
  id:          number;
  name:        string;
  description: string;
  price:       number;
  image:       string;
  qty:         number;
  available:   boolean;
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

function parseAdminProduct(p: Record<string, unknown>): AdminProduct {
  return {
    id:          p.id as number,
    name:        p.name as string,
    description: (p.description as string) || '',
    price:       parseFloat(String(p.price)),
    image:       (p.image_url as string) || '',
    qty:         p.stock as number,
    available:   p.is_active as boolean,
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

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch(`${API}/admin/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();
  return data.access_token as string;
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('sero_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const res  = await fetch(`${API}/admin/products`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Unauthorised');
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.products || []);
  return list.map(parseAdminProduct);
}

export async function toggleProduct(id: number): Promise<void> {
  const res = await fetch(`${API}/products/${id}/toggle`, {
    method: 'PUT', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Toggle failed');
}

export async function deleteAdminProduct(id: number): Promise<void> {
  const res = await fetch(`${API}/admin/products/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
}

export async function updateAdminProduct(
  id: number,
  payload: Partial<{ name: string; description: string; price: number; image: string; qty: number; available: boolean }>
): Promise<void> {
  const res = await fetch(`${API}/admin/products/${id}`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Update failed');
}

export async function getOrders(): Promise<Order[]> {
  const res  = await fetch(`${API}/orders`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Unauthorised');
  const data = await res.json();
  return (data.orders || []).map(parseOrder);
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  const res = await fetch(`${API}/orders/${id}`, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Status update failed');
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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Create failed');
  }
}