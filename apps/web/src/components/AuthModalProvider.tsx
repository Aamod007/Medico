"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import AuthModal from "./AuthModal";
import { useAuthModalStore } from "@/lib/auth-modal-store";
import { useCartStore } from "@/lib/cart-store";

export default function AuthModalProvider() {
  const { isOpen, reason, closeAuthModal } = useAuthModalStore();
  const { isSignedIn, isLoaded, user } = useUser();
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const executedRef = useRef(false);

  const prevUserIdRef = useRef<string | null>(null);

  // Synchronize authenticated user identity to cookie and localStorage for route handlers
  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window !== "undefined") {
      // Purge any legacy browser order tracking
      localStorage.removeItem("medico_placed_order_ids");
      document.cookie = "medico_placed_order_ids=; path=/; max-age=0; SameSite=Lax";

      if (isSignedIn && user?.id) {
        // If switching accounts, clear cart to prevent cross-account pollution
        if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
          useCartStore.getState().clearCart();
        }
        prevUserIdRef.current = user.id;

        document.cookie = `userId=${encodeURIComponent(user.id)}; path=/; max-age=2592000; SameSite=Lax`;
        localStorage.setItem("medico_user_id", user.id);
      } else {
        prevUserIdRef.current = null;
        document.cookie = "userId=; path=/; max-age=0; SameSite=Lax";
        localStorage.removeItem("medico_user_id");
        useCartStore.getState().clearCart();
      }
    }
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || executedRef.current) return;

    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("medico_pending_cart_action");
      if (raw) {
        executedRef.current = true;
        try {
          const { args, timestamp } = JSON.parse(raw);
          // Valid if queued within the last 2 hours
          if (Date.now() - (timestamp || 0) < 2 * 60 * 60 * 1000) {
            sessionStorage.removeItem("medico_pending_cart_action");
            if (Array.isArray(args) && args.length > 0) {
              const [variantId, quantity, itemDetails] = args;
              addItem(variantId, quantity || 1, itemDetails).then(() => {
                // User goes ahead: automatically open cart drawer
                openDrawer();
                closeAuthModal();
              });
            }
          } else {
            sessionStorage.removeItem("medico_pending_cart_action");
          }
        } catch (e) {
          console.error("Error executing pending cart action:", e);
          sessionStorage.removeItem("medico_pending_cart_action");
        }
      }
    }
  }, [isLoaded, isSignedIn, addItem, openDrawer, closeAuthModal]);

  return <AuthModal isOpen={isOpen} onClose={closeAuthModal} reason={reason} />;
}
