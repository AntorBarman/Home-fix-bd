import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import fetch from "node-fetch";
import sharp from "sharp";
import { MongoClient } from "mongodb";

const root = process.cwd();
const catalogPath = path.join(root, "data", "catalog.json");
const outputDir = path.join(root, "public", "homefix-bd", "products");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SEARCH_QUERIES = {
  "nilkontho-ceiling-fan-56": "ceiling fan",
  "bhor-32a-mcb": "circuit breaker",
  "bhor-32a-mcb-single-pole": "circuit breaker",
  "shonali-led-bulb-12w": "led bulb",
  "rupkotha-chrome-basin-tap": "bathroom faucet chrome",
  "meghla-flexible-shower": "shower head",
  "meghla-flexible-shower-set": "shower head",
  "probhat-inverter-ac": "air conditioner indoor unit",
  "tara-air-purifier": "air purifier",
  "chhaya-chest-freezer": "chest freezer",
  "meghla-4-channel-cctv-kit": "cctv security camera",
  "nilkontho-wall-light": "wall sconce outdoor",
  "bhora-pipe-repair-kit": "plumbing tools flat lay",
  "bhor-pipe-repair-kit": "plumbing tools flat lay",
  "rupkotha-mirror-cabinet": "bathroom mirror cabinet",
};

const args = new Set(process.argv.slice(2));
const slugArg = process.argv.find((arg) => arg.startsWith("--slug="))?.slice(7);
const force = args.has("--force");
const dryRun = args.has("--dry-run");
const accessKey = process.env.UNSPLASH_ACCESS_KEY;

if (!dryRun && !accessKey) throw new Error("UNSPLASH_ACCESS_KEY is required.");

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const selected = slugArg ? catalog.filter((product) => product.slug === slugArg) : catalog;
if (slugArg && selected.length === 0) throw new Error(`No catalog product found for slug: ${slugArg}`);

await fs.mkdir(outputDir, { recursive: true });
let downloaded = 0;
let skipped = 0;
const failures = [];
function setVariantImages(product, paths) {
  if (!Array.isArray(product.variants)) return;
  product.variants = product.variants.map((variant, index) => ({
    ...variant,
    image: paths[index % paths.length],
  }));
}

async function searchPhotos(query, fallbackQuery) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "4");
    url.searchParams.set("orientation", "squarish");
    url.searchParams.set("client_id", accessKey);
    const response = await fetch(url);
    if (response.status === 429 && attempt < 2) {
      console.log("  Unsplash rate limited; retrying in 5 seconds...");
      await delay(5000);
      continue;
    }
    if (!response.ok) throw new Error(`Unsplash returned HTTP ${response.status}`);
    const body = await response.json();
    const results = body.results ?? [];
    if (results.length === 0 && fallbackQuery && fallbackQuery !== query) {
      console.log(`  No results for "${query}"; retrying with "${fallbackQuery}"...`);
      return searchPhotos(fallbackQuery);
    }
    return results;
  }
  throw new Error("Unsplash request failed after retries.");
}

for (let index = 0; index < selected.length; index += 1) {
  const product = selected[index];
  const query = SEARCH_QUERIES[product.slug] ?? product.name;
  const fallbackQuery = product.category === "ac"
    ? "air conditioner"
    : product.category === "refrigerator"
      ? "freezer appliance"
      : product.category === "plumbing"
        ? "plumbing tools"
        : product.name;
  const paths = Array.from({ length: 4 }, (_, imageIndex) => `/homefix-bd/products/${product.slug}-${imageIndex + 1}.webp`);
  console.log(`[${index + 1}/${selected.length}] ${product.name} — "${query}"`);
  try {
    if (dryRun) {
      console.log(`  would download: ${paths.join(", ")}`);
    } else {
      const existing = await Promise.all(paths.map(async (imagePath) => {
        try {
          await fs.access(path.join(root, "public", imagePath.replace(/^[/\\]/, "")));
          return true;
        } catch {
          return false;
        }
      }));
      if (!force && existing.every(Boolean)) {
        skipped += 4;
        product.image = paths[0];
        product.hoverImage = paths[3];
        product.images = paths;
        setVariantImages(product, paths);
        console.log("  all four files already exist; skipping Unsplash request");
        continue;
      }
      const photos = await searchPhotos(query, fallbackQuery);
      if (photos.length < 4) throw new Error(`Only ${photos.length} Unsplash results returned.`);
      for (let imageIndex = 0; imageIndex < 4; imageIndex += 1) {
        const outputPath = path.join(root, "public", paths[imageIndex].replace(/^[/\\]/, ""));
        try {
          await fs.access(outputPath);
          if (!force) {
            skipped += 1;
            continue;
          }
        } catch {}
        const imageResponse = await fetch(photos[imageIndex].urls.regular);
        if (!imageResponse.ok) throw new Error(`Image download returned HTTP ${imageResponse.status}`);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        await sharp(buffer).resize(800, 800, { fit: "cover" }).webp({ quality: 85 }).toFile(outputPath);
        downloaded += 1;
      }
      product.image = paths[0];
      product.hoverImage = paths[3];
      product.images = paths;
      setVariantImages(product, paths);
    }
  } catch (error) {
    failures.push(`${product.slug}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`  FAILED: ${failures.at(-1)}`);
  }
  if (index < selected.length - 1 && !dryRun) await delay(2000);
}

if (!dryRun) {
  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  if (process.env.MONGO_URI) {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    try {
      const db = client.db(process.env.MONGO_DB_NAME || "homefixbd");
      for (const product of selected) {
        if (!product.images) continue;
        await db.collection("products").updateOne(
          { slug: product.slug },
          { $set: { image: product.image, hoverImage: product.hoverImage, images: product.images, variants: product.variants, updatedAt: new Date().toISOString() } },
          { upsert: true },
        );
      }
    } finally {
      await client.close();
    }
  } else {
    console.warn("MONGO_URI is not set; skipped MongoDB updates.");
  }
}

console.log("\nUnsplash image fetch summary");
console.log(`Total products processed: ${selected.length}`);
console.log(`Images downloaded: ${downloaded}`);
console.log(`Images skipped (already existed): ${skipped}`);
console.log(`Failures: ${failures.length ? failures.join("; ") : "none"}`);
