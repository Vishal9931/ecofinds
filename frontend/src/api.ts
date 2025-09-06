import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:4000/api" });

// attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUTH
export const register = (email: string, password: string, username: string) =>
  API.post("/auth/register", { email, password, username });

export const login = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

// PROFILE
export const getMe = () => API.get("/me");
export const updateMe = (username: string) => API.put("/me", { username });

// CATEGORIES
export const getCategories = () => API.get("/categories");

// PRODUCTS
export const createProduct = (p: any) => API.post("/products", p);
export const getProducts = (params?: any) => API.get("/products", { params });
export const getProduct = (id: number) => API.get(`/products/${id}`);
export const myListings = () => API.get("/my/listings");
export const updateProduct = (id: number, p: any) => API.put(`/products/${id}`, p);
export const deleteProduct = (id: number) => API.delete(`/products/${id}`);

// CART + ORDERS
export const addToCart = (productId: number, quantity = 1) =>
  API.post("/cart/add", { productId, quantity });
export const getCart = () => API.get("/cart");
export const removeFromCart = (id: number) => API.delete(`/cart/${id}`);
export const checkout = () => API.post("/checkout");
export const getOrders = () => API.get("/orders");
