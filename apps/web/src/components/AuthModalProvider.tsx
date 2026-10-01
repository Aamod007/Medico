"use client";

import AuthModal from "./AuthModal";
import { useAuthModalStore } from "@/lib/auth-modal-store";

export default function AuthModalProvider() {
  const { isOpen, reason, closeAuthModal } = useAuthModalStore();
  return <AuthModal isOpen={isOpen} onClose={closeAuthModal} reason={reason} />;
}
