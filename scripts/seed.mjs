import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relativePath) => {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`[seed] Required file missing: ${relativePath}`);
    throw error;
  }
};

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is required");
const client = new MongoClient(uri);
const db = client.db(process.env.MONGO_DB_NAME || "homefixbd");
const now = new Date().toISOString();

try {
  await client.connect();
  const catalog = await readJson("data/catalog.json");
  const services = await readJson("data/services.json");
  const technicianData = await readJson("data/technicians.json");
  const technicians = Array.isArray(technicianData) ? technicianData : technicianData.technicians;
  if (!Array.isArray(technicians)) throw new Error("[seed] data/technicians.json must contain a technicians array");
  const categoryIds = [...new Set(catalog.map((product) => product.category))];
  const categoryNames = {
    electrical: ["Electrical", "ইলেকট্রিক্যাল"], plumbing: ["Plumbing", "প্লাম্বিং"], sanitary: ["Sanitary", "স্যানিটারি"],
    ac: ["AC", "এসি"], refrigerator: ["Refrigerator", "রেফ্রিজারেটর"], tv: ["TV", "টিভি"],
    carpentry: ["Carpentry", "কাঠের কাজ"], painting: ["Painting", "রং করা"],
  };
  const categories = categoryIds.map((id) => ({ id, slug: id, name: categoryNames[id]?.[0] || id, nameBn: categoryNames[id]?.[1] || id, description: "", icon: "" }));
  const upsert = async (name, docs, key) => {
    if (!docs.length) return;
    await db.collection(name).bulkWrite(docs.map((document) => ({
      updateOne: { filter: { [key]: document[key] }, update: { $set: document }, upsert: true },
    })), { ordered: false });
  };
  await upsert("categories", categories, "slug");
  await upsert("products", catalog, "slug");
  await upsert("services", services, "slug");
  await upsert("technicians", technicians, "id");
  await db.collection("coupons").updateOne({ code: "FIX10" }, { $set: { code: "FIX10", type: "percent", value: 10, minSubtotal: 1000, active: true } }, { upsert: true });
  await db.collection("settings").updateOne({ _id: "singleton" }, { $set: {
    _id: "singleton", name: "HomeFix BD", tagline: "বাসার সব প্রয়োজন, এক প্ল্যাটফর্মে।", logo: "/homefix-bd/logo.svg",
    defaultLocale: "bn", defaultCurrency: "BDT", defaultTheme: "light", enableCod: true, enableBkash: true, enableNagad: true, enableSslcommerz: true, updatedAt: now,
  } }, { upsert: true });
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (adminEmail) {
    const existing = await db.collection("users").findOne({ email: adminEmail }, { projection: { _id: 1 } });
    if (!existing) {
      const password = randomBytes(12).toString("base64url");
      await db.collection("users").insertOne({ email: adminEmail, name: "HomeFix BD Admin", role: "admin", passwordHash: await bcrypt.hash(password, 12), addresses: [], createdAt: now });
      console.log(`[seed] Created admin user: ${adminEmail}`);
      console.log(`[seed] Temporary admin password (save it now): ${password}`);
    } else console.log(`[seed] Admin user already exists: ${adminEmail}`);
  } else console.log("[seed] NEXT_PUBLIC_ADMIN_EMAIL not set; admin user skipped");
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("products").createIndex({ slug: 1 }, { unique: true }),
    db.collection("services").createIndex({ slug: 1 }, { unique: true }),
    db.collection("technicians").createIndex({ id: 1 }, { unique: true }),
    db.collection("orders").createIndex({ orderNumber: 1 }, { unique: true }),
    db.collection("orders").createIndex({ bkashPaymentId: 1 }, { unique: true, sparse: true }),
    db.collection("orders").createIndex({ nagadPaymentId: 1 }, { unique: true, sparse: true }),
    db.collection("orders").createIndex({ sslcommerzTxnId: 1 }, { unique: true, sparse: true }),
    db.collection("bookings").createIndex({ bookingNumber: 1 }, { unique: true }),
    db.collection("coupons").createIndex({ code: 1 }, { unique: true }),
    db.collection("settings").createIndex({ _id: 1 }, { unique: true }),
  ]);
  console.log(`[seed] Seed complete: ${catalog.length} products, ${services.length} services, ${technicians.length} technicians`);
} finally {
  await client.close();
}
