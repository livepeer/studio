import createImageUrlBuilder from "@sanity/image-url";

import { config } from "./config";

export const urlFor = (source) => createImageUrlBuilder(config).image(source);

// Set up the live preview subscription hook
// export const usePreviewSubscription = createPreviewSubscriptionHook(config);
