import { account } from "./categories/account";
import { international } from "./categories/international";
import { studium } from "./categories/studium";
import { stuve } from "./categories/stuve";
import type { LinkCategory } from "./types";

/** All link categories, in the order shown on `/links` */
export const LINK_CATEGORIES: LinkCategory[] = [studium, account, stuve, international];

export type * from "./types";
