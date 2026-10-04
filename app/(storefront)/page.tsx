import { HomeSections, Storefront } from "@/components/storefront";
import { products } from "@/lib/catalog";
export default function Home() { return <Storefront><HomeSections products={products} /></Storefront>; }
