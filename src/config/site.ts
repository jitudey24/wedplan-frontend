export const siteConfig = {
  name: "WedPlan",
  tagline: "Plan your perfect day, effortlessly.",
  description:
    "WedPlan helps couples discover trusted wedding vendors, keep budgets on track and manage every detail of their big day in one place.",
  routes: {
    home: "/",
    services: "/services",
    signIn: "/signin",
    signUp: "/signup",
    dashboard: "/dashboard",
    adminDashboard: "/admin/dashboard",
    vendorDashboard: "/vendor/dashboard",
    authCallback: "/auth/callback",
    budget: "/dashboard/budget",
    checklist: "/dashboard/checklist",
    bookings: "/dashboard/bookings",
    profile: "/profile",
  },
  // Post-login landing route per account role.
  dashboards: {
    admin: "/admin/dashboard",
    vendor: "/vendor/dashboard",
    customer: "/dashboard",
  },
  contact: {
    email: "hello@wedplan.com",
    phone: "+880 1700-000000",
    address: " House 12, Road 2, Chandgoan, Chattogram, Bangladesh",
  },
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    x: "https://x.com",
    youtube: "https://youtube.com",
  },
} as const;

export type SiteConfig = typeof siteConfig;
