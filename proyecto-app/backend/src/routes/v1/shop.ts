import { Router } from "express";
import { Transaction } from "sequelize";
import { sequelize } from "../../db/sequelize";
import { Cart, CartItem, Category, Order, OrderItem, Product, ProductImage } from "../../db/models";
import { requireAuth } from "../../middleware/auth";

export const shopV1Router = Router();

type CartItemWithRelations = CartItem & {
  product?: Product & {
    category?: Category;
    images?: ProductImage[];
  };
};

type OrderWithItems = Order & {
  items?: OrderItem[];
};

const SHIPPING_COST = 0;

async function getOrCreateActiveCart(userId: number, transaction?: Transaction) {
  const existing = await Cart.findOne({
    where: { userId, status: "active" },
    order: [["updatedAt", "DESC"]],
    transaction,
  });

  if (existing) {
    return existing;
  }

  return Cart.create({ userId, status: "active" }, { transaction });
}

const mapCartItem = (item: CartItemWithRelations) => {
  const unitPrice = Number(item.unitPrice);
  return {
    id: String(item.id),
    quantity: item.quantity,
    unitPrice,
    subtotal: Number((unitPrice * item.quantity).toFixed(2)),
    sizeName: item.sizeName ?? undefined,
    colorName: item.colorName ?? undefined,
    product: item.product
      ? {
          id: String(item.product.id),
          name: item.product.name,
          slug: item.product.slug,
          image:
            (item.product.get("images") as ProductImage[] | undefined)
              ?.slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? "/images/placeholder-product.jpg",
          price: Number(item.product.price),
          stock: item.product.stock,
          category: {
            id: String((item.product.get("category") as Category | undefined)?.id ?? item.product.categoryId),
            name: (item.product.get("category") as Category | undefined)?.name ?? "",
            slug: (item.product.get("category") as Category | undefined)?.slug ?? "hombre",
          },
        }
      : null,
  };
};

function mapCart(cart: Cart, items: CartItemWithRelations[]) {
  const mappedItems = items.map((item) => mapCartItem(item));
  const subtotal = mappedItems.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Number((subtotal + SHIPPING_COST).toFixed(2));

  return {
    id: String(cart.id),
    status: cart.status,
    items: mappedItems,
    summary: {
      subtotal: Number(subtotal.toFixed(2)),
      shippingTotal: SHIPPING_COST,
      total,
    },
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

function mapOrder(order: OrderWithItems) {
  const items = (order.get("items") as OrderItem[] | undefined) ?? [];
  return {
    id: String(order.id),
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    shippingTotal: Number(order.shippingTotal),
    total: Number(order.total),
    items: items.map((item) => ({
      id: String(item.id),
      productId: String(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      sizeName: item.sizeName ?? undefined,
      colorName: item.colorName ?? undefined,
      subtotal: Number((Number(item.unitPrice) * item.quantity).toFixed(2)),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

shopV1Router.get("/cart", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const cart = await getOrCreateActiveCart(userId);

    const items = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          as: "product",
          required: true,
          include: [
            { model: Category, as: "category", required: false },
            { model: ProductImage, as: "images", required: false },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: mapCart(cart, items as CartItemWithRelations[]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error obteniendo carrito",
    });
  }
});

shopV1Router.post("/cart/items", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const { productId, quantity, sizeName, colorName } = req.body ?? {};

    const numericProductId = Number(productId);
    const requestedQty = Math.max(1, Number(quantity ?? 1));

    if (!Number.isFinite(numericProductId)) {
      return res.status(400).json({ success: false, data: null, message: "Producto inválido" });
    }

    const product = await Product.findByPk(numericProductId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, data: null, message: "Producto no encontrado" });
    }

    const cart = await getOrCreateActiveCart(userId);

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId: numericProductId,
        sizeName: sizeName ? String(sizeName) : null,
        colorName: colorName ? String(colorName) : null,
      },
    });

    const nextQuantity = (existingItem?.quantity ?? 0) + requestedQty;
    if (nextQuantity > product.stock) {
      return res.status(409).json({
        success: false,
        data: null,
        message: `Stock insuficiente. Disponible: ${product.stock}`,
      });
    }

    if (existingItem) {
      await existingItem.update({ quantity: nextQuantity });
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId: numericProductId,
        quantity: requestedQty,
        unitPrice: Number(product.price),
        sizeName: sizeName ? String(sizeName) : null,
        colorName: colorName ? String(colorName) : null,
      });
    }

    const refreshedItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          as: "product",
          required: true,
          include: [
            { model: Category, as: "category", required: false },
            { model: ProductImage, as: "images", required: false },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: mapCart(cart, refreshedItems as CartItemWithRelations[]),
      message: "Producto agregado al carrito",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error agregando al carrito",
    });
  }
});

shopV1Router.patch("/cart/items/:itemId", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const itemId = Number(req.params.itemId);
    const quantity = Number(req.body?.quantity);

    if (!Number.isFinite(itemId) || !Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, data: null, message: "Datos inválidos" });
    }

    const cart = await getOrCreateActiveCart(userId);
    const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) {
      return res.status(404).json({ success: false, data: null, message: "Item no encontrado" });
    }

    const product = await Product.findByPk(item.productId);
    if (!product || quantity > product.stock) {
      return res.status(409).json({
        success: false,
        data: null,
        message: `Stock insuficiente. Disponible: ${product?.stock ?? 0}`,
      });
    }

    await item.update({ quantity });

    const refreshedItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          as: "product",
          required: true,
          include: [
            { model: Category, as: "category", required: false },
            { model: ProductImage, as: "images", required: false },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: mapCart(cart, refreshedItems as CartItemWithRelations[]),
      message: "Cantidad actualizada",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error actualizando item",
    });
  }
});

shopV1Router.delete("/cart/items/:itemId", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const itemId = Number(req.params.itemId);

    if (!Number.isFinite(itemId)) {
      return res.status(400).json({ success: false, data: null, message: "Item inválido" });
    }

    const cart = await getOrCreateActiveCart(userId);
    const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) {
      return res.status(404).json({ success: false, data: null, message: "Item no encontrado" });
    }

    await item.destroy();

    const refreshedItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          as: "product",
          required: true,
          include: [
            { model: Category, as: "category", required: false },
            { model: ProductImage, as: "images", required: false },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: mapCart(cart, refreshedItems as CartItemWithRelations[]),
      message: "Producto eliminado del carrito",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error eliminando item",
    });
  }
});

shopV1Router.delete("/cart", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const cart = await getOrCreateActiveCart(userId);

    await CartItem.destroy({ where: { cartId: cart.id } });

    return res.status(200).json({
      success: true,
      data: null,
      message: "Carrito vaciado",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error vaciando carrito",
    });
  }
});

shopV1Router.post("/orders", requireAuth, async (req: any, res: any) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = Number(req.auth.userId);
    const cart = await getOrCreateActiveCart(userId, transaction);

    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [{ model: Product, as: "product", required: true }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, data: null, message: "El carrito está vacío" });
    }

    for (const item of cartItems as CartItemWithRelations[]) {
      const product = item.product;
      if (!product || item.quantity > product.stock) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          data: null,
          message: `Stock insuficiente para ${product?.name ?? "producto"}`,
        });
      }
    }

    const subtotal = Number(
      cartItems
        .reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0)
        .toFixed(2),
    );

    const order = await Order.create(
      {
        userId,
        cartId: cart.id,
        status: "pending",
        paymentStatus: "pending",
        subtotal,
        discountTotal: 0,
        shippingTotal: SHIPPING_COST,
        total: Number((subtotal + SHIPPING_COST).toFixed(2)),
      },
      { transaction },
    );

    await OrderItem.bulkCreate(
      (cartItems as CartItemWithRelations[]).map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.product?.name ?? "Producto",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sizeName: item.sizeName ?? null,
        colorName: item.colorName ?? null,
      })),
      { transaction },
    );

    for (const item of cartItems as CartItemWithRelations[]) {
      if (!item.product) continue;
      await item.product.update({ stock: item.product.stock - item.quantity }, { transaction });
    }

    await cart.update({ status: "ordered" }, { transaction });
    await Cart.create({ userId, status: "active" }, { transaction });

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    return res.status(201).json({
      success: true,
      data: createdOrder ? mapOrder(createdOrder as OrderWithItems) : null,
      message: "Pedido creado exitosamente",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error creando pedido",
    });
  }
});

shopV1Router.get("/orders", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);

    const orders = await Order.findAll({
      where: { userId },
      include: [{ model: OrderItem, as: "items" }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: orders.map((order) => mapOrder(order as OrderWithItems)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error obteniendo pedidos",
    });
  }
});
