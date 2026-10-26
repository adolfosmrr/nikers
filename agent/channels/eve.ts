import { getCartId } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";
import { disableRoute } from "eve/channels";
import { type AuthFn, ForbiddenError, localDev, none, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { shopConfig } from "../../lib/config";
import { isRateLimited } from "../lib/rate-limit";

const anonymous = none<Request>();
const browserAuth: AuthFn<Request> = async (request) => {
  if (new URL(request.url).pathname.endsWith("/eve/v1/info")) return null;
  if (
    shopConfig.botid.isEnabled &&
    (
      await checkBotId({
        advancedOptions: {
          checkLevel: shopConfig.botid.checkLevel,
          headers: Object.fromEntries(request.headers.entries()),
        },
      })
    ).isBot
  )
    throw new ForbiddenError();
  if (await isRateLimited(request))
    throw new ForbiddenError({
      code: "rate_limited",
      message: "Llegaste al límite de 10 mensajes por hora. Probá de nuevo más tarde.",
    });
  return anonymous(request);
};

export default shopConfig.agent.isEnabled
  ? eveChannel({
      auth: [vercelOidc(), localDev(), browserAuth],
      onMessage({ eve }) {
        const caller = eve.caller;
        if (!caller) return { auth: null };
        const cartId = getCartId({ cookie: eve.request.headers.get("cookie") ?? undefined });
        return {
          auth: { ...caller, attributes: { ...caller.attributes, ...(cartId ? { cartId } : {}) } },
        };
      },
      turnPolicy: "queue",
      uploadPolicy: "disabled",
    })
  : disableRoute();
