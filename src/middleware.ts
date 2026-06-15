import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Match all private routes for protection
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/market/:path*",
    "/signals/:path*",
    "/backtest/:path*",
    "/alerts/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
