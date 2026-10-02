"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthModalStore } from "./auth-modal-store";

/**
 * Returns guarded versions of cart and wishlist actions.
 * If the user is not signed in, saves the pending action and triggers Clerk sign-in.
 * Once the user signs in, the pending action is completed automatically so the user can go ahead.
 */
export function useAuthGuard() {
  const { isSignedIn } = useUser();
  const clerk = useClerk();
  const { openAuthModal } = useAuthModalStore();

  function guardCart<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      if (!isSignedIn) {
        // Save pending cart item so user goes ahead seamlessly after Clerk login
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              "medico_pending_cart_action",
              JSON.stringify({
                args,
                timestamp: Date.now(),
              })
            );
          } catch (e) {
            console.warn("Could not save pending cart action:", e);
          }
        }

        // Open Clerk Sign-In modal directly if available, fallback to AuthModal
        try {
          if (clerk && typeof clerk.openSignIn === "function") {
            clerk.openSignIn();
            return;
          }
        } catch (err) {
          console.warn("Direct clerk.openSignIn fallback:", err);
        }

        openAuthModal("cart");
        return;
      }

      return fn(...args);
    }) as T;
  }

  function guardWishlist<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      if (!isSignedIn) {
        try {
          if (clerk && typeof clerk.openSignIn === "function") {
            clerk.openSignIn();
            return;
          }
        } catch (err) {
          console.warn("Direct clerk.openSignIn fallback:", err);
        }
        openAuthModal("wishlist");
        return;
      }
      return fn(...args);
    }) as T;
  }

  return { guardCart, guardWishlist };
}

