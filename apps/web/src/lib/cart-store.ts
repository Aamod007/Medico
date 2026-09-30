import { create } from "zustand";
import { api } from "./api";

export interface CartItemData {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  packSize: string;
  sku: string;
  price: number;
  mrp: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
  isOutOfStock: boolean;
  prescriptionRequired: boolean;
}

interface CartState {
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  hasPrescriptionItems: boolean;
  isDrawerOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  subtotal: 0,
  mrpTotal: 0,
  discount: 0,
  deliveryFee: 0,
  totalAmount: 0,
  hasPrescriptionItems: false,
  isDrawerOpen: false,
  isLoading: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/cart");
      if (res.success && res.data) {
        set({
          items: res.data.items || [],
          itemCount: res.data.itemCount || 0,
          subtotal: res.data.subtotal || 0,
          mrpTotal: res.data.mrpTotal || 0,
          discount: res.data.discount || 0,
          deliveryFee: res.data.deliveryFee || 0,
          totalAmount: res.data.totalAmount || 0,
          hasPrescriptionItems: res.data.hasPrescriptionItems || false,
        });
      }
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (variantId: string, quantity: number = 1) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/cart/items", { variantId, quantity });
      if (res.success) {
        await get().fetchCart();
        set({ isDrawerOpen: true });
        return true;
      }
      alert(res.message || "Failed to add item to cart");
      return false;
    } catch (e) {
      console.error("Add item error:", e);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (e) {
      console.error("Update quantity error:", e);
    }
  },

  removeItem: async (itemId: string) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await get().fetchCart();
    } catch (e) {
      console.error("Remove item error:", e);
    }
  },

  clearCart: async () => {
    try {
      await api.delete("/cart");
      set({
        items: [],
        itemCount: 0,
        subtotal: 0,
        mrpTotal: 0,
        discount: 0,
        deliveryFee: 0,
        totalAmount: 0,
        hasPrescriptionItems: false,
      });
    } catch (e) {
      console.error("Clear cart error:", e);
    }
  },
}));
