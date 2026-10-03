export type Category = {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  icon: string;
};

export type Variant = {
  color: string;
  colorHex: string;
  sizes: { size: string; qty: number }[];
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  hoverImage: string;
  variants: Variant[];
  rating: number;
  reviewCount: number;
  featured?: boolean;
  badge?: "new" | "hot" | "sale";
  stockQty: number;
  inStock: boolean;
  installable: boolean;
  installServiceSlug?: string;
  features: string[];
}

export type Service = {
  slug: string;
  name: string;
  nameBn: string;
  category: string;
  description: string;
  priceFrom: number;
  priceTo: number;
  warrantyDays: number;
  icon: string;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: string;
  qty: number;
  addInstallation: boolean;
};

export type Coupon = { code: string; type: "percent" | "fixed"; value: number; minSubtotal?: number; active: boolean };
export type BookingStatus = "requested" | "accepted" | "assigned" | "on_the_way" | "arrived" | "started" | "completed" | "customer_confirmed" | "closed" | "cancelled";

export type Address = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  area: string;
  city: string;
  district: string;
  division: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type TechnicianSkill = { serviceSlug: string; level: "junior" | "mid" | "senior"; yearsExperience: number };
export type Technician = {
  id: string;
  userId?: string;
  name: string;
  nameBn?: string;
  phone: string;
  photo?: string;
  verified: boolean;
  verificationStatus: "pending" | "under_review" | "verified" | "rejected" | "suspended";
  experienceYears: number;
  skills: TechnicianSkill[];
  serviceAreas: string[];
  rating: number;
  completedJobs: number;
  visitCharge: number;
  active: boolean;
  availability?: { day: string; slots: string[] }[];
};

export type OrderItem = {
  type: "product" | "service" | "delivery";
  productId?: string;
  serviceSlug?: string;
  slug: string;
  name: string;
  image: string;
  color?: string;
  size?: string;
  qty: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  email: string;
  items: OrderItem[];
  address: Address;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: "BDT";
  status: string;
  paymentMethod: "bkash" | "nagad" | "sslcommerz" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  createdAt: string;
  updatedAt: string;
  bkashPaymentId?: string;
  nagadPaymentId?: string;
  sslcommerzTxnId?: string;
};

export type Booking = {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  technicianId?: string;
  technicianName?: string;
  serviceSlug: string;
  serviceName: string;
  address: Address;
  problemDescription: string;
  problemMediaUrls: string[];
  status: BookingStatus;
  scheduledAt: string;
  visitFee: number;
  createdAt: string;
  updatedAt: string;
};

export type ReviewDoc = {
  id: string;
  targetType: "product" | "technician" | "service";
  targetId: string;
  author: string;
  authorEmail?: string;
  rating: number;
  body: string;
  date: string;
  status: "pending" | "approved" | "rejected";
};

export type Customer = { id: string; email: string; name: string; phone?: string; createdAt: string; updatedAt: string };
export type User = { id?: string; email: string; name: string; passwordHash?: string; image?: string; phone?: string; role: "customer" | "technician" | "seller" | "admin"; addresses: Address[]; createdAt: string };
export type Post = { slug: string; title: string; titleBn: string; excerpt: string; category: string; author: string; date: string; readTime: string; image: string; blocks: { type: string; text?: string; items?: string[] }[] };
export type StoreSettings = {
  name: string;
  tagline: string;
  logo: string;
  defaultLocale: "bn" | "en";
  defaultCurrency: "BDT" | "USD";
  defaultTheme: "light" | "dark";
  enableCod: boolean;
  enableBkash: boolean;
  enableNagad: boolean;
  enableSslcommerz: boolean;
};
export type Warranty = { id: string; orderId: string; itemIndex: number; startDate: string; endDate: string; type: "product" | "service"; provider: string };
export type Complaint = { id: string; customerId: string; subject: string; description: string; status: string; createdAt: string; updatedAt: string };
export type ProblemReport = { id: string; customerId?: string; text: string; mediaUrls: string[]; category?: string; confidence?: string; createdAt: string };
