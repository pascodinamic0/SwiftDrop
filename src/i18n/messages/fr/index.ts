import { commonFr } from "./common";
import { navFr } from "./nav";
import { homeFr } from "./home";
import { authFr } from "./auth";
import { shopFr } from "./shop";
import { cartFr } from "./cart";
import { orderFr } from "./order";
import { riderFr } from "./rider";
import { vendorFr } from "./vendor";
import { adminFr } from "./admin";
import { whyUsFr } from "./whyUs";
import { storeCategoryFr } from "./storeCategory";
import { passwordFr } from "./password";
import { metaFr } from "./meta";
import { merchantFr } from "./merchant";

export const fr = {
  common: commonFr,
  nav: navFr,
  home: homeFr,
  auth: authFr,
  shop: shopFr,
  cart: cartFr,
  order: orderFr,
  rider: riderFr,
  vendor: vendorFr,
  admin: adminFr,
  whyUs: whyUsFr,
  storeCategory: storeCategoryFr,
  password: passwordFr,
  meta: metaFr,
  merchant: merchantFr,
  legal: {
    privacyTitle: "Politique de confidentialité",
    privacyMeta: "Politique de confidentialité — SwiftDrop",
    privacyDesc:
      "Comment SwiftDrop collecte, utilise et protège vos informations personnelles.",
    termsTitle: "Conditions d'utilisation",
    termsMeta: "Conditions d'utilisation — SwiftDrop",
    termsDesc:
      "Conditions régissant l'utilisation de la place de marché et des services de livraison SwiftDrop.",
    updated: "6 mai 2026",
  },
} as const;
