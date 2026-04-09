import { z } from "zod";

const email = z.string().trim().email("Email inválido");

export const authRegisterSchema = z
  .object({
    email,
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    firstName: z.string().trim().min(1, "firstName requerido"),
    lastName: z.string().trim().min(1, "lastName requerido"),
    acceptTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }

    if (!data.acceptTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["acceptTerms"],
        message: "Debes aceptar los términos",
      });
    }
  });

export const authLoginSchema = z.object({
  email,
  password: z.string().min(1, "password requerido"),
});

export const authRecoverSchema = z.object({
  email,
});

export const authRefreshSchema = z.object({
  refreshToken: z.string().trim().min(1, "refreshToken requerido"),
});

export const authLogoutSchema = z.object({
  refreshToken: z.string().trim().min(1).optional(),
});

export const authResetSchema = z
  .object({
    token: z.string().trim().min(1, "token requerido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }
  });

export const contactCreateSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido"),
  email,
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(1, "Asunto requerido"),
  message: z.string().trim().min(1, "Mensaje requerido"),
});

const toOptionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().optional());

export const productListQuerySchema = z.object({
  category: z.string().trim().optional(),
  minPrice: toOptionalNumber,
  maxPrice: toOptionalNumber,
  sizes: z.string().trim().optional(),
  colors: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["price-asc", "price-desc", "newest", "name"]).optional(),
  page: toOptionalNumber,
  pageSize: toOptionalNumber,
});

export const offersAllQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

const toRequiredInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return value;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : value;
}, z.number().int());

export const itemIdParamSchema = z.object({
  itemId: toRequiredInt,
});

export const cartAddItemSchema = z.object({
  productId: toRequiredInt,
  quantity: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return 1;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().min(1, "quantity debe ser >= 1")),
  sizeName: z.string().trim().min(1, "sizeName requerido"),
  colorName: z.string().trim().min(1, "colorName requerido"),
});

export const cartUpdateItemSchema = z.object({
  quantity: z.preprocess((value) => Number(value), z.number().min(1, "quantity debe ser >= 1")),
});

export const adminStatusIdParamSchema = z.object({
  id: toRequiredInt,
});

export const adminContactStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "resolved"]),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export const addressIdParamSchema = z.object({
  id: toRequiredInt,
});

export const addressCreateSchema = z.object({
  street: z.string().trim().min(1, "street requerido"),
  city: z.string().trim().min(1, "city requerido"),
  state: z.string().trim().min(1, "state requerido"),
  postalCode: z.string().trim().min(1, "postalCode requerido"),
  country: z.string().trim().min(1, "country requerido"),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = z.object({
  street: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
  postalCode: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export const orderCreateSchema = z.object({
  addressId: toRequiredInt,
});
