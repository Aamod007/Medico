import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";

interface WishlistStore {
  wishlistIds: Set<string>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  getCount: () => number;
  getIds: () => string[];
  syncWithBackend: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlistIds: new Set<string>(),
      toggle: async (productId: string) => {
        const isCurrentlyWishlisted = get().wishlistIds.has(productId);
        const next = new Set(get().wishlistIds);
        if (isCurrentlyWishlisted) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        set({ wishlistIds: next });

        try {
          await api.post("/wishlist/toggle", { productId });
        } catch {
          // Guest or offline: state remains preserved in localStorage
        }
      },
      isWishlisted: (productId: string) => {
        return get().wishlistIds.has(productId);
      },
      getCount: () => get().wishlistIds.size,
      getIds: () => Array.from(get().wishlistIds),
      syncWithBackend: async () => {
        try {
          const res = await api.get("/wishlist");
          if (res.success && Array.isArray(res.data)) {
            const dbIds = res.data.map((p: any) => p.id);
            set((state) => ({
              wishlistIds: new Set([...Array.from(state.wishlistIds), ...dbIds]),
            }));
          }
        } catch {
          // Guest session
        }
      },
    }),
    {
      name: "medico-wishlist",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              wishlistIds: new Set(parsed.state.wishlistIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              wishlistIds: Array.from(value.state.wishlistIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
