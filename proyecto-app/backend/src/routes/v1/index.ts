import { Router } from "express";
import { adminV1Router } from "./admin";
import { authV1Router } from "./auth";
import { catalogV1Router } from "./catalog";

export const v1Router = Router();

v1Router.use(catalogV1Router);
v1Router.use(authV1Router);
v1Router.use(adminV1Router);
