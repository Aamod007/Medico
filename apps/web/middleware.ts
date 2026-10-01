import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that should be accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/products(.*)",
  "/medicines(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/api/products(.*)",
  "/api/catalog(.*)",
]);

// Protect only checkout, orders, and admin routes from unauthenticated access
const isProtectedRoute = createRouteMatcher([
  "/checkout(.*)",
  "/orders(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Only enforce authentication on protected routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
