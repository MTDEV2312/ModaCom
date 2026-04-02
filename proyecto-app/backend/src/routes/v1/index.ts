import { Router } from "express";
import { adminV1Router } from "./admin";
import { authV1Router } from "./auth";
import { addressesV1Router } from "./addresses";
import { catalogV1Router } from "./catalog";
import { contactV1Router } from "./contact";
import { shopV1Router } from "./shop";

export const v1Router = Router();

v1Router.use(catalogV1Router);
v1Router.use(authV1Router);
v1Router.use(addressesV1Router);
v1Router.use(contactV1Router);
v1Router.use(shopV1Router);
v1Router.use(adminV1Router);
