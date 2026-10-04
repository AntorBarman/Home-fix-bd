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
  sellerId?: string;
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
  gallery?: string[];
  images?: string[];
  variants: Variant[];
  rating: number;
  reviewCount: number;
  featured?: boolean;
  badge?: "new" | "hot" | "sale";
  stockQty: number;
  inStock: boolean;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  image?: string;
  gallery?: string[];
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
  reviews?: ReviewDoc[];
  walletBalance?: number;
  nidNumber?: string;
  nidImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};
export type Seller = {
  id?: string;
  _id?: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  address: Record<string, string>;
  tradeLicenseUrl?: string;
  nidUrl?: string;
  bankAccount?: { bankName: string; accountNumber: string; branch: string };
  mfs?: { provider: "bkash" | "nagad"; number: string };
  verified: boolean;
  verificationStatus: "pending" | "under_review" | "verified" | "rejected" | "suspended";
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};
export type SellerPayout = {
  id: string;
  sellerId: string;
  periodFrom: string;
  periodTo: string;
  grossRevenue: number;
  commission: number;
  netPayout: number;
  destination: string;
  status: "pending" | "processing" | "paid" | "failed";
  createdAt: string;
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
  readyToShip?: boolean;
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
  technicianId?: string | null;
  technicianName?: string;
  serviceSlug: string;
  serviceName: string;
  address: Address;
  problemDescription: string;
  problemMediaUrls: string[];
  status: BookingStatus;
  scheduledAt: string;
  visitFee: number;
  quotation?: { amount: number; total?: number; visitFee?: number; labour?: number; parts?: { name: string; price: number }[]; notes: string; issuedAt: string; status: "pending" | "accepted" | "rejected" };
  invoiceUrl?: string;
  warrantyId?: string;
  customerConfirmedAt?: string;
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
  title?: string;
  body: string;
  photos?: string[];
  reason?: string;
  date: string;
  status: "pending" | "approved" | "rejected";
};

export type Customer = { id: string; email: string; name: string; phone?: string; createdAt: string; updatedAt: string };
export type User = { id?: string; email: string; name: string; passwordHash?: string; image?: string; phone?: string; role: "customer" | "technician" | "seller" | "admin"; addresses: Address[]; createdAt: string };
export type Post = { slug: string; title: string; titleBn: string; excerpt: string; category: string; author: string; date: string; readTime: string; image: string; blocks: { type: string; text?: string; items?: string[] }[] };
export type StoreSettings = {
  _id?: string;
  key?: string;
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
export type WarrantyClaim = { id: string; reason: string; description: string; photos: string[]; status: "open" | "in_progress" | "approved" | "rejected" | "resolved"; note?: string; createdAt: string; resolvedAt?: string };
export type Warranty = { id: string; orderId: string; itemIndex: number; startDate: string; endDate: string; type: "product" | "service"; provider: string; productId?: string; serviceSlug?: string; claims?: WarrantyClaim[] };
export type SupportMessage = { id: string; author: string; authorRole: "customer" | "admin"; body: string; createdAt: string };
export type Complaint = { id?: string; ticketNumber?: string; customerId: string; customerName?: string; customerEmail?: string; category?: string; subject: string; description: string; relatedOrderId?: string; relatedBookingNumber?: string; status: "open" | "in_progress" | "resolved" | "closed"; messages?: SupportMessage[]; createdAt: string; updatedAt?: string };
export type ProblemReport = { id: string; customerId?: string; text: string; mediaUrls: string[]; category?: string; confidence?: "low" | "medium" | "high"; keywords?: string[]; recommendedServiceSlug?: string; recommendedProductSlugs?: string[]; address?: string; phone?: string; createdAt: string };
