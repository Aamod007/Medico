import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";

export interface CartItemData {
  id: string;
  variantId: string;
  productId?: string;
  productName: string;
  productSlug?: string;
  image?: string | null;
  packSize?: string;
  sku?: string;
  price: number;
  mrp: number;
  quantity: number;
  subtotal: number;
  availableStock?: number;
  isOutOfStock?: boolean;
}

interface CartState {
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  isDrawerOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number, itemDetails?: Partial<CartItemData>) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

function recalcTotals(items: CartItemData[]) {
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const mrpTotal = items.reduce((acc, it) => acc + (it.mrp || it.price) * it.quantity, 0);
  const discount = Math.max(0, mrpTotal - subtotal);
  const deliveryFee = subtotal >= 500 || items.length === 0 ? 0 : 40;
  const totalAmount = subtotal + deliveryFee;
  return { itemCount, subtotal, mrpTotal, discount, deliveryFee, totalAmount };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      mrpTotal: 0,
      discount: 0,
      deliveryFee: 0,
      totalAmount: 0,
      isDrawerOpen: false,
      isLoading: false,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      fetchCart: async () => {
        try {
          const res = await api.get("/cart");
          if (res.success && res.data && res.data.items && res.data.items.length > 0) {
            // Server has real items - replace local state
            const serverItems: CartItemData[] = res.data.items.map((it: any) => ({
              id: it.id,
              variantId: it.variantId,
              productId: it.productId || "",
              productName: it.productName || it.name || "Healthcare Essential",
              productSlug: it.productSlug || it.slug || "",
              image: it.image || "",
              packSize: it.packSize || "Standard Pack",
              price: Number(it.price || 0),
              mrp: Number(it.mrp || it.price || 0),
              quantity: it.quantity,
              subtotal: Number(it.subtotal || it.itemSubtotal || (it.price || 0) * it.quantity),
            }));
            set({
              items: serverItems,
              ...recalcTotals(serverItems),
            });
          }
          // If server returns empty items, keep local state (offline resilience)
        } catch (e) {
          console.warn("Cart fetch fallback to local storage:", e);
        }
      },

      addItem: async (variantId: string, quantity: number = 1, itemDetails?: Partial<CartItemData>) => {
        set({ isLoading: true });

        // Optimistically add item to local state
        const currentItems = [...get().items];
        const existingIdx = currentItems.findIndex((it) => it.variantId === variantId);

        if (existingIdx !== -1) {
          currentItems[existingIdx].quantity += quantity;
          currentItems[existingIdx].subtotal = currentItems[existingIdx].price * currentItems[existingIdx].quantity;
        } else {
          const price = itemDetails?.price || 0;
          const mrp = itemDetails?.mrp || price;
          currentItems.push({
            id: `local_${Date.now()}`,
            variantId,
            productId: itemDetails?.productId || "",
            productName: itemDetails?.productName || "Adding...",
            productSlug: itemDetails?.productSlug || "",
            image: itemDetails?.image || "",
            packSize: itemDetails?.packSize || "Standard Pack",
            sku: itemDetails?.sku || "",
            price,
            mrp,
            quantity,
            subtotal: price * quantity,
            availableStock: 50,
            isOutOfStock: false,
          });
        }

        set({
          items: currentItems,
          ...recalcTotals(currentItems),
          isDrawerOpen: true,
          isLoading: false,
        });

        // Background server sync
        try {
          await api.post("/cart/items", { variantId, quantity });
          // Refresh from server to get real IDs and data
          await get().fetchCart();
        } catch (e) {
          console.warn("Background cart sync failed, retained in local storage:", e);
        }

        return true;
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        const currentItems = [...get().items];
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const idx = currentItems.findIndex((it) => it.id === itemId || it.variantId === itemId);
        if (idx !== -1) {
          currentItems[idx].quantity = quantity;
          currentItems[idx].subtotal = currentItems[idx].price * quantity;
        }

        set({
          items: currentItems,
          ...recalcTotals(currentItems),
        });

        try {
          await api.patch(`/cart/items/${itemId}`, { quantity });
        } catch (e) {
          console.warn("Background quantity update failed:", e);
        }
      },

      removeItem: async (itemId: string) => {
        const currentItems = get().items.filter((it) => it.id !== itemId && it.variantId !== itemId);
        set({
          items: currentItems,
          ...recalcTotals(currentItems),
        });

        try {
          await api.delete(`/cart/items/${itemId}`);
        } catch (e) {
          console.warn("Background item removal failed:", e);
        }
      },

      clearCart: async () => {
        set({
          items: [],
          itemCount: 0,
          subtotal: 0,
          mrpTotal: 0,
          discount: 0,
          deliveryFee: 0,
          totalAmount: 0,
        });

        try {
          await api.delete("/cart");
        } catch (e) {
          console.warn("Background cart clear failed:", e);
        }
      },
    }),
    {
      name: "pharmico-cart-storage",
      partialize: (state) => ({
        items: state.items,
        itemCount: state.itemCount,
        subtotal: state.subtotal,
        mrpTotal: state.mrpTotal,
        discount: state.discount,
        deliveryFee: state.deliveryFee,
        totalAmount: state.totalAmount,
      }),
    }
  )
);
