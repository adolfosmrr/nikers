import type { Metadata } from "next";

import Hero from "@/components/home/Hero";
import { ProductsGrid } from "@/components/product/products-grid";
import { Container } from "@/components/ui/container";

import { shopConfig } from "@/lib/config";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCollectionResults } from "@/lib/collections/server";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Home";
  const description = "Explore featured products, curated collections, and seasonal campaigns.";
  return {
    title: `${title} | ${shopConfig.site.name}`,
    description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
  };
}

export default async function HomePage() {
  const { products } = await getCollectionResults({ handle: "shoes" })
  console.log(products.map(item => item.title))
  return (
    <>
    <div className="-mt-16 flex h-auto w-full flex-col items-center justify-between max-[800px]:hidden max-[390px]:flex">
      <Hero products={products} />
      <Container>
        <ProductsGrid
          title="Products"
          eagerCount={4}
          limit={8}
          collectionUrl="/collections/all"
        />
      </Container>
    </div>
    <div className=" hidden w-full h-screen bg-black max-[800px]:flex max-[800px]:justify-center max-[800px]:items-center max-[800px]:px-5 max-[390px]:flex">
        <p className="font-mono text-2xl text-white text-center text-balance">This store is only available within screens with 800px or more and 390px or less.</p>
    </div>
    </>
  );
}
