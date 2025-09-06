// backend/src/index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type JWTPayload = { id: number; email: string; iat?: number; exp?: number };

// Auth middleware
function auth(req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as JWTPayload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Seed categories on startup
const DEFAULT_CATEGORIES = ["Electronics", "Furniture", "Books", "Clothing", "Sports"];
async function seedCategories() {
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
}

/* ----------------- AUTH ----------------- */
app.post("/api/auth/register", async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(2),
  });

  try {
    const input = schema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash: hash, username: input.username },
    });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid input" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ token });
});

app.get("/api/me", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, username: true },
  });
  res.json(me);
});

app.put("/api/me", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const { username } = req.body || {};
  if (!username || typeof username !== "string" || username.length < 2) {
    return res.status(400).json({ error: "Username must be at least 2 characters" });
  }
  const up = await prisma.user.update({ where: { id: req.user!.id }, data: { username } });
  res.json({ id: up.id, email: up.email, username: up.username });
});

/* ----------------- CATEGORIES ----------------- */
app.get("/api/categories", async (_req: Request, res: Response) => {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(cats);
});

/* ----------------- PRODUCTS ----------------- */

// Create product
const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  price: z.coerce.number().nonnegative(),
  categoryId: z.coerce.number().int(),
  imageUrl: z.string().url().optional(),
});
type CreateProductInput = z.infer<typeof createProductSchema>;

app.post("/api/products", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body) as CreateProductInput;
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) return res.status(400).json({ error: "Invalid categoryId" });

    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl ?? "https://placehold.co/600x400",
        ownerId: req.user!.id,
        categoryId: data.categoryId,
      },
    });
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid input" });
  }
});

// My listings
app.get("/api/my/listings", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const items = await prisma.product.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { id: "desc" },
  });
  res.json(items);
});

// Update own listing - fixed to build updateData explicitly (avoids TS type mismatch)
const updateProductSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  price: z.coerce.number().nonnegative().optional(),
  categoryId: z.coerce.number().int().optional(),
  imageUrl: z.string().url().optional(),
});
type UpdateProductInput = z.infer<typeof updateProductSchema>;

app.put("/api/products/:id", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.ownerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

  try {
    const parsed = updateProductSchema.parse(req.body) as UpdateProductInput;

    if (parsed.categoryId !== undefined) {
      const cat = await prisma.category.findUnique({ where: { id: parsed.categoryId } });
      if (!cat) return res.status(400).json({ error: "Invalid categoryId" });
    }

    // Build update payload explicitly to satisfy TypeScript / Prisma types
    const updateData: Record<string, any> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.price !== undefined) updateData.price = parsed.price;
    if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId;
    if (parsed.imageUrl !== undefined) updateData.imageUrl = parsed.imageUrl;

    const up = await prisma.product.update({ where: { id }, data: updateData });
    res.json(up);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid input" });
  }
});

// Delete own listing
app.delete("/api/products/:id", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.ownerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

  await prisma.product.delete({ where: { id } });
  res.json({ ok: true });
});

// Browse/search/filter
app.get("/api/products", async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

  const where: any = {};
  if (q) where.title = { contains: q };
  if (categoryId && !Number.isNaN(categoryId)) where.categoryId = categoryId;

  const items = await prisma.product.findMany({
    where,
    select: { id: true, title: true, price: true, imageUrl: true, categoryId: true },
    orderBy: { id: "desc" },
  });
  res.json(items);
});

// Product detail
app.get("/api/products/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const p = await prisma.product.findUnique({
    where: { id },
    include: { category: true, owner: { select: { id: true, username: true } } },
  });
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

/* ----------------- CART ----------------- */

// Add to cart
app.post("/api/cart/add", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const { productId, quantity } = req.body || {};
  if (!productId) return res.status(400).json({ error: "productId required" });

  const existing = await prisma.cartItem.findFirst({
    where: { userId: req.user!.id, productId },
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (quantity || 1) },
    });
    return res.json(updated);
  }

  const item = await prisma.cartItem.create({
    data: {
      userId: req.user!.id,
      productId,
      quantity: quantity || 1,
    },
  });
  res.json(item);
});

// View cart
app.get("/api/cart", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
  });
  res.json(items);
});

// Remove from cart
app.delete("/api/cart/:id", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await prisma.cartItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.cartItem.delete({ where: { id } });
  res.json({ ok: true });
});

/* ----------------- CHECKOUT ----------------- */
app.post("/api/checkout", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
  });
  if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

  const order = await prisma.order.create({
  data: {
    userId: req.user!.id,
    items: {
      create: cartItems.map((ci) => ({
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.product.price,
      })),
    },
  },
  include: { items: true },
});


  // clear cart
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });

  res.json(order);
});

/* ----------------- PREVIOUS PURCHASES ----------------- */
app.get("/api/orders", auth, async (req: Request & { user?: JWTPayload }, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});


/* Start server & seed categories */
app.listen(4000, async () => {
  await seedCategories();
  console.log("🚀 API running at http://localhost:4000");
});
