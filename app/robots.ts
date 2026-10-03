import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/checkout", "/technician", "/seller"] }, sitemap: "http://localhost:3000/sitemap.xml" };
}
