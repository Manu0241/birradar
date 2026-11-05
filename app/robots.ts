import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/datos";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${URL_BASE}/sitemap.xml`,
  };
}
