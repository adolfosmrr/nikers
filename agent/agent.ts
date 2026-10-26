import { gateway, wrapLanguageModel } from "ai";
import { defineAgent } from "eve";

import { catalogMiddleware } from "./lib/catalog-middleware";

export default defineAgent({
  defaultTools: false,
  model: wrapLanguageModel({
    middleware: catalogMiddleware,
    model: gateway("openai/gpt-5-mini"),
  }),
  modelContextWindowTokens: 400_000,
});
