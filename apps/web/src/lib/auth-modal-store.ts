import { create } from "zustand";

interface AuthModalState {
  isOpen: boolean;
  reason: "cart" | "wishlist";
  openAuthModal: (reason?: "cart" | "wishlist") => void;
  closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  reason: "cart",
  openAuthModal: (reason = "cart") => set({ isOpen: true, reason }),
  closeAuthModal: () => set({ isOpen: false }),
}));
