"use client";

import { useUser } from "@clerk/nextjs";
import { useAuthModalStore } from "./auth-modal-store";

/**
 * Returns guarded versions of cart and wishlist actions.
 * If the user is not signed in, opens the auth modal instead of running the action.
 */
export function useAuthGuard() {
  const { isSignedIn } = useUser();
  const { openAuthModal } = useAuthModalStore();

  function guardCart<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      if (!isSignedIn) {
        openAuthModal("cart");
        return;
      }
      return fn(...args);
    }) as T;
  }

  function guardWishlist<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      if (!isSignedIn) {
        openAuthModal("wishlist");
        return;
      }
      return fn(...args);
    }) as T;
  }

  return { guardCart, guardWishlist };
}
