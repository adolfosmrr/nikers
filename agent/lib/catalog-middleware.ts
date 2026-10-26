import type { wrapLanguageModel } from "ai";

function summarizeDescription(description: unknown): string | null {
  const html =
    typeof description === "string"
      ? description
      : description && typeof description === "object" && "html" in description && typeof description.html === "string"
        ? description.html
        : "";
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > 400 ? `${text.slice(0, 400)}…` : text;
}

function isCatalogSearch(input: unknown): boolean {
  return (
    !!input &&
    typeof input === "object" &&
    "name" in input &&
    input.name === "shopify__search_catalog"
  );
}

export const catalogMiddleware = {
  async transformParams({ params }) {
    const catalogSearchCallIds = new Set(
      params.prompt.flatMap((message) =>
        message.role === "assistant"
          ? message.content.flatMap((part) =>
              part.type === "tool-call" &&
              part.toolName === "eve__tool" &&
              isCatalogSearch(part.input)
                ? [part.toolCallId]
                : [],
            )
          : [],
      ),
    );
    if (!catalogSearchCallIds.size) return params;

    return {
      ...params,
      prompt: params.prompt.map((message) => {
        if (message.role !== "tool") return message;
        return {
          ...message,
          content: message.content.map((part) => {
            if (
              part.type !== "tool-result" ||
              !catalogSearchCallIds.has(part.toolCallId) ||
              part.output.type !== "json"
            )
              return part;
            const catalog = part.output.value;
            if (
              !catalog ||
              typeof catalog !== "object" ||
              Array.isArray(catalog) ||
              !("products" in catalog) ||
              !Array.isArray(catalog.products)
            )
              return part;
            return {
              ...part,
              output: {
                ...part.output,
                value: {
                  messages: catalog.messages ?? [],
                  pagination: catalog.pagination ?? null,
                  products: catalog.products.map((product) => {
                    if (!product || typeof product !== "object" || Array.isArray(product))
                      return product;
                    return {
                      categories: product.categories ?? [],
                      description: summarizeDescription(product.description),
                      handle: product.handle ?? null,
                      id: product.id ?? null,
                      options: product.options ?? [],
                      price_range: product.price_range ?? null,
                      product_type: product.product_type ?? null,
                      tags: product.tags ?? [],
                      title: product.title ?? null,
                    };
                  }),
                },
              },
            };
          }),
        };
      }),
    };
  },
} satisfies Parameters<typeof wrapLanguageModel>[0]["middleware"];
