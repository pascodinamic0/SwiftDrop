import { commonEn } from "./common";
import { navEn } from "./nav";
import { homeEn } from "./home";
import { authEn } from "./auth";
import { shopEn } from "./shop";
import { cartEn } from "./cart";
import { orderEn } from "./order";
import { riderEn } from "./rider";
import { vendorEn } from "./vendor";
import { adminEn } from "./admin";
import { whyUsEn } from "./whyUs";
import { storeCategoryEn } from "./storeCategory";
import { passwordEn } from "./password";
import { metaEn } from "./meta";

export const en = {
  common: commonEn,
  nav: navEn,
  home: homeEn,
  auth: authEn,
  shop: shopEn,
  cart: cartEn,
  order: orderEn,
  rider: riderEn,
  vendor: vendorEn,
  admin: adminEn,
  whyUs: whyUsEn,
  storeCategory: storeCategoryEn,
  password: passwordEn,
  meta: metaEn,
  legal: {
    privacyTitle: "Privacy policy",
    privacyMeta: "Privacy policy — SwiftDrop",
    privacyDesc: "How SwiftDrop collects, uses, and protects your personal information.",
    termsTitle: "Terms of service",
    termsMeta: "Terms of service — SwiftDrop",
    termsDesc: "Terms governing use of the SwiftDrop marketplace and delivery services.",
    updated: "May 6, 2026",
  },
} as const;
