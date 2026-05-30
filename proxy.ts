import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/__clerk(.*)",
  "/about(.*)",
  "/account(.*)",
  "/admin(.*)",
  "/best-sellers(.*)",
  "/checkout(.*)",
  "/contact(.*)",
  "/delivery(.*)",
  "/login(.*)",
  "/new-arrivals(.*)",
  "/offers(.*)",
  "/privacy(.*)",
  "/products(.*)",
  "/returns(.*)",
  "/reviews(.*)",
  "/shop(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/signup(.*)",
  "/size-guide(.*)",
  "/terms(.*)",
  "/weekend-offers(.*)",
  "/api/admin(.*)",
  "/api/auth(.*)",
  "/api/checkout(.*)",
  "/api/orders(.*)",
  "/api/reviews(.*)",
  "/api/site-settings(.*)",
  "/api/uploadthing(.*)",
  "/api/webhooks/clerk(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
