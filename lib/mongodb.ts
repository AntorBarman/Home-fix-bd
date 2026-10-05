import "server-only";

import { Collection, Db, Document, MongoClient } from "mongodb";
import type {
  Booking, Category, Complaint, Coupon, Customer, Order, Post, ProblemReport,
  Product, ReviewDoc, Seller, SellerPayout, Service, StoreSettings, Technician, User, Warranty,
} from "@/types";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is required");

const databaseName = process.env.MONGO_DB_NAME || "homefixbd";

const globalForMongo = globalThis as typeof globalThis & {
  homeFixMongo?: { client: MongoClient; promise: Promise<MongoClient> };
};

// ✅ Vercel serverless-optimized connection options
const client = new MongoClient(uri, {
  maxPoolSize: 10,                  // ✅ Serverless-এ 10 যথেষ্ট
  minPoolSize: 1,                   // ✅ কম idle connection
  maxIdleTimeMS: 60000,             // ✅ 60s পরে idle close
  serverSelectionTimeoutMS: 5000,   // ✅ 5s timeout (আগে default 30s)
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
});

const clientPromise = client.connect();
globalForMongo.homeFixMongo ??= { client, promise: clientPromise };

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const connection = globalForMongo.homeFixMongo;
  if (!connection) throw new Error("MongoDB connection was not initialized");
  const connectedClient = await connection.promise;
  return { client: connectedClient, db: connectedClient.db(databaseName) };
}

async function collection<T extends Document>(name: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(name);
}

export const users = () => collection<User>("users");
export const products = () => collection<Product>("products");
export const categories = () => collection<Category>("categories");
export const services = () => collection<Service>("services");
export const technicians = () => collection<Technician>("technicians");
export const sellers = () => collection<Seller>("sellers");
export const orders = () => collection<Order>("orders");
export const bookings = () => collection<Booking>("bookings");
export const coupons = () => collection<Coupon>("coupons");
export const reviews = () => collection<ReviewDoc>("reviews");
export const customers = () => collection<Customer>("customers");
export const posts = () => collection<Post>("posts");
export const settings = () => collection<StoreSettings>("settings");
export const warranties = () => collection<Warranty>("warranties");
export const complaints = () => collection<Complaint>("complaints");
export const problemReports = () => collection<ProblemReport>("problemReports");
export const messages = () => collection<Record<string, unknown>>("messages");
export const newsletter = () => collection<{ email: string; createdAt: string }>("newsletter");
export const sellerPayouts = () => collection<SellerPayout>("sellerPayouts");