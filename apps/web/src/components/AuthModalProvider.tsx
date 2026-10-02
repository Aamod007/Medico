"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import AuthModal from "./AuthModal";
import { useAuthModalStore } from "@/lib/auth-modal-store";
import { useCartStore } from "@/lib/cart-store";

export default function AuthModalProvider() {
  const { isOpen, reason, closeAuthModal } = useAuthModalStore();
  const { isSignedIn, isLoaded } = useUser();
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const executedRef = useRef(false);

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

