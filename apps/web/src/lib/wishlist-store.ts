import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  wishlistIds: Set<string>;
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  getCount: () => number;
  getIds: () => string[];
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlistIds: new Set<string>(),
      toggle: (productId: string) => {
        set((state) => {
          const next = new Set(state.wishlistIds);
          if (next.has(productId)) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return { wishlistIds: next };
        });
      },
      isWishlisted: (productId: string) => {
        return get().wishlistIds.has(productId);
      },
      getCount: () => get().wishlistIds.size,
      getIds: () => Array.from(get().wishlistIds),
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
