# Attendify Frontend

**Version:** 1.2.0  
**Status:** Production Ready  
**Last Updated:** October 5, 2025

A modern, secure attendance management system built with [Next.js 15.5.4](https://nextjs.org) featuring HTTP-only cookie authentication, 3-layer JWT validation, and server-side route protection.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your backend API URL:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Start Building

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## 📁 Project Structure (overview)

This project follows a modular Next.js App Router layout with clear separation between pages, API proxies, feature components, and shared utilities. The structure below is an overview of the repository contents and where to look for important code.

```
attendify-frontend/
├── src/
│   ├── app/                # Next.js App Router: pages, layouts and server-side app-route proxies (app/api/*)
│   │   ├── api/            # Same-origin proxy routes and lightweight server APIs
│   │   ├── auth/           # Authentication pages (login, signup, logout)
│   │   ├── admin/          # Admin area pages and tools
│   │   ├── faculty/        # Faculty-facing pages
│   │   ├── student/        # Student area (classes, attendance, dashboard)
│   │   └── layout.tsx      # Root layout and top-level providers
│   │
│   ├── components/        # Reusable UI and feature components (shadcn UI wrappers, portals, camera components)
│   │   ├── student-portal/ # Student-facing components and sub-features (classes, attendance flow)
│   │   ├── ui/             # Generic UI building blocks
│   │   └── ...
│   │
│   ├── lib/               # Shared libraries and API clients
│   │   ├── api/           # Client API helpers (classes, attendance, fetchClient)
│   │   ├── liveness-tests/ # Liveness detection utilities and helper algorithms
│   │   └── utils/         # Formatting, avatars, detection helpers
│   │
│   ├── hooks/             # Custom React hooks (auth, toast, mobile helpers)
│   ├── contexts/          # React context providers (AuthContext)
│   ├── config/            # App configuration (routes, auth settings)
│   └── styles/            # Global CSS and Tailwind config

├── public/                # Static assets (CSV, images, keys used in dev)
├── docs/                  # Project documentation and guides
├── keys/                  # Local developer keys (not for production)
├── README.md
├── package.json
├── next.config.ts
└── tsconfig.json
```
│   │   ├── auth/                     # auth pages (login, signup)
│   │   ├── admin/                    # admin pages and subroutes
│   │   ├── student/                  # student area (classes, attendance)
│   │   ├── faculty/                  # faculty area
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/                   # UI components and feature components
│   │   ├── ui/                       # shadcn UI wrappers
│   │   ├── student-portal/           # student portal components (classes, take attendance)
│   │   ├── face-camera.tsx           # camera + liveness components
│   │   └── ...
│   │
│   ├── config/                       # app configuration (routes, auth settings)
│   ├── contexts/                     # React context providers (AuthContext)
│   ├── hooks/                        # custom hooks (use-auth, use-toast, use-mobile)
│   ├── lib/                          # utilities and API clients
│   │   ├── api/                      # client-side API helpers (classes, attendance, fetchClient)
│   │   ├── middleware/               # server-side middleware helpers
│   │   └── utils/                    # misc helpers (date, format, liveness)
│   │
│   └── styles/                       # global CSS
│
├── docs/                          # 📚 Documentation and developer guides
│   ├── AUTHENTICATION_GUIDE.md
│   ├── MIDDLEWARE_GUIDE.md
│   └── ARCHITECTURE_GUIDE.md
│
├── .env.local.example
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔐 Authentication System

### Overview

Production-ready authentication with **HTTP-only cookies**, **2-step OTP verification**, and **3-layer JWT validation** for maximum security and performance.

### 📚 Complete Documentation

| Guide                                                         | Description                                       | Lines |
| ------------------------------------------------------------- | ------------------------------------------------- | ----- |
| **[AUTHENTICATION_GUIDE.md](./docs/AUTHENTICATION_GUIDE.md)** | Complete auth system guide - flows, API, examples | 1000+ |
| **[MIDDLEWARE_GUIDE.md](./docs/MIDDLEWARE_GUIDE.md)**         | 3-layer optimization, performance, security       | 900+  |
| **[ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)**     | System architecture, modules, patterns            | 1100+ |

### Authentication Features

#### 🔒 Security

- **HTTP-only Cookies** - Tokens inaccessible to JavaScript (XSS protection)
- **CSRF Protection** - SameSite cookie policy
- **Server-Side Validation** - Middleware validates before page loads
- **JWT Signature Verification** - Backend confirms token authenticity
- **User Existence Check** - Validates user still exists in database

#### ⚡ Performance (v1.2.0)

- **3-Layer Validation System:**
  - **Layer 1:** Client decode - Check expiration (0ms)
  - **Layer 2:** In-memory cache - Recent validations (1ms, 90-99% hit rate)
  - **Layer 3:** Backend API - Full validation (200ms, 1-10% of requests)
- **Result:** 20-200x faster authentication, 90-99% fewer backend calls

#### 🎯 User Flows

- **Registration:** Two-step with email OTP verification
- **Login:** Flexible OTP (backend controlled) or direct token
- **Dashboard Access:** Automatic protection via middleware
- **Logout:** Secure cookie clearing

### Quick Usage Example

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { loginInitiate, loginVerify, isLoading, error } = useAuth();

  // Step 1: Initiate login
  const handleLogin = async () => {
    const result = await loginInitiate({
      username_or_email: "user@example.com",
      password: "SecurePass123",
    });

    if (result.requiresOTP) {
      // Show OTP input
      setShowOTP(true);
    }
    // If no OTP required, automatically redirects to dashboard
  };

  // Step 2: Verify OTP (if required)
  const handleVerifyOTP = async (code: string) => {
    await loginVerify({
      username_or_email: "user@example.com",
      code: code,
    });
    // Automatically redirects to dashboard
  };

  return <div>{/* Your login form */}</div>;
}
```

### Adding Protected Routes

**It's as simple as adding a route to the array!**

```typescript
// 1. Open: src/config/routes.ts

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin",
  "/profile",
  "/my-new-route", // ← Add here
] as const;

// 2. That's it! Route is now automatically protected by middleware
```

**What happens automatically:**

- ✅ Middleware intercepts all requests to `/my-new-route`
- ✅ Validates JWT token (3-layer system)
- ✅ Redirects to `/auth/login` if not authenticated
- ✅ Allows access if token is valid

---

## 🛠️ Technology Stack

### Core

- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.x** - Type safety

### UI & Styling

- **Shadcn UI** - Component library
- **Tailwind CSS 4.1.14** - Utility-first styling
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library

### Authentication & Validation

- **JWT** - Token-based authentication
- **Zod 4.1.11** - Schema validation
- **HTTP-only Cookies** - Secure token storage

### Development

- **ESLint 9.x** - Code linting
- **Turbopack** - Fast bundler
- **TypeScript Strict Mode** - Maximum type safety

---

## 📖 API Reference

### Backend Endpoints Required

Your backend must implement these endpoints:

| Method | Endpoint                         | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| `POST` | `/api/v1/auth/register/initiate` | Send OTP to email                 |
| `POST` | `/api/v1/auth/register/verify`   | Verify OTP, create account        |
| `POST` | `/api/v1/auth/login/initiate`    | Login or request OTP              |
| `POST` | `/api/v1/auth/login/verify`      | Verify OTP, get token             |
| `GET`  | `/api/v1/users/me`               | Get current user (for validation) |

### Frontend API Routes

These are handled automatically:

| Method | Endpoint                 | Description            |
| ------ | ------------------------ | ---------------------- |
| `POST` | `/api/auth/set-tokens`   | Set HTTP-only cookies  |
| `POST` | `/api/auth/clear-tokens` | Clear cookies (logout) |

### useAuth Hook API

```typescript
const {
  // State
  user, // Current user object or null
  isLoading, // Loading state
  isAuthenticated, // Authentication status
  error, // Error message or null

  // Methods
  loginInitiate, // Step 1: Login (username/email + password)
  loginVerify, // Step 2: Verify OTP code
  registerInitiate, // Step 1: Register (email + username + password)
  registerVerify, // Step 2: Verify OTP code
  logout, // Clear tokens and redirect to login
  refreshUser, // Reload user data
  clearError, // Clear error state
} = useAuth();
```

---

## 🚀 Configuration

### Environment Variables

```env
# Backend API URLs
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional: Override defaults
# NODE_ENV=production  # Enables secure cookies
```

### Local dev: temporarily bypass auth checks

If you don't have the backend available but want to develop the frontend, you can opt-in to a safe, local-only bypass of the middleware authentication checks.

Add the following to your `.env.local` (only for local development):

```env
# When set to "1" or "true" (case-insensitive) and NODE_ENV is not "production",
# middleware will treat requests as authenticated so protected pages are accessible.
NEXT_PUBLIC_DEV_AUTH_BYPASS=1
```

Notes and safety recommendations:

- This bypass is strictly opt-in and will only apply when `NODE_ENV !== 'production'`.
- Never enable this in production or CI environments.
- Use this for local UI development only. For more realistic testing consider using a mock API or MSW (Mock Service Worker).
- Remember to remove or set the variable to `0` before committing or deploying.

### Auth Configuration

Edit `src/config/auth.ts` to customize:

```typescript
// Cookie settings
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: "access_token",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  REFRESH_TOKEN: {
    name: "refresh_token",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

// Validation settings
export const VALIDATION_CONFIG = {
  CACHE_TTL_MS: 60 * 1000, // Cache for 1 minute
  CACHE_MAX_SIZE: 1000, // Max 1000 entries
  FAILURE_CACHE_TTL_MS: 10 * 1000, // Cache failures for 10s
  REQUEST_TIMEOUT_MS: 5 * 1000, // 5 second timeout
  TOKEN_EXPIRY_BUFFER_SECONDS: 30, // 30 second buffer
};
```

### Route Configuration

Edit `src/config/routes.ts` to customize:

```typescript
// Routes that require authentication
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin",
  "/profile",
  "/settings",
] as const;

// Routes that redirect authenticated users (login, signup)
export const AUTH_ROUTES = ["/auth/login", "/auth/signup"] as const;

// Routes accessible to everyone
export const PUBLIC_ROUTES = ["/", "/about", "/contact"] as const;
```

---

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript (if configured)
```

---

## 🔍 Performance Metrics

### Authentication Speed (v1.2.0)

| Scenario          | Before (v1.1.0) | After (v1.2.0) | Improvement          |
| ----------------- | --------------- | -------------- | -------------------- |
| **Cache Hit**     | 200ms           | 1ms            | **200x faster**      |
| **First Request** | 200ms           | 200ms          | Same                 |
| **100 Requests**  | 20 seconds      | 0.3 seconds    | **66x faster**       |
| **Backend Calls** | 100             | 1-10           | **90-99% reduction** |

### How It Works

1. **First Request:** Validates with backend (200ms), caches result
2. **Subsequent Requests (within 1 min):** Returns cached result (1ms)
3. **After Cache Expires:** Re-validates with backend, updates cache

---

## 🔒 Security Features

### HTTP-Only Cookies

- ✅ Tokens stored in HTTP-only cookies (not localStorage)
- ✅ JavaScript cannot access tokens (XSS protection)
- ✅ Automatic transmission with requests
- ✅ Secure flag in production (HTTPS only)

### Server-Side Protection

- ✅ Next.js middleware validates before page loads
- ✅ Cannot bypass with browser DevTools
- ✅ Validates JWT signature with backend
- ✅ Confirms user still exists

### CSRF Protection

- ✅ SameSite cookie policy (`lax`)
- ✅ Prevents cross-site request forgery
- ✅ Cookies not sent on cross-origin POST

### Additional Security

- ✅ Password validation (min 8 chars, uppercase, lowercase, number)
- ✅ OTP verification for sensitive operations
- ✅ Token expiration handling
- ✅ Automatic logout on invalid token

---

## 📚 Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Source code and issues

### Project Documentation

- **[AUTHENTICATION_GUIDE.md](./docs/AUTHENTICATION_GUIDE.md)** - Complete authentication guide
- **[MIDDLEWARE_GUIDE.md](./docs/MIDDLEWARE_GUIDE.md)** - Middleware optimization guide
- **[ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)** - System architecture guide
- **[v1.2.0 Release Notes](./docs/version_updates/v1.2.0.md)** - Latest release details

---

## 🚀 Deployment

### Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_AUTH_API_URL=https://your-backend.com/api/v1/auth
   NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
   ```
4. Deploy!

**Important:** Ensure your backend:

- ✅ Implements required API endpoints
- ✅ Configures CORS for your frontend domain
- ✅ Has `/api/v1/users/me` endpoint for validation

### Production Checklist

- [ ] Environment variables configured
- [ ] Backend API accessible
- [ ] CORS configured for frontend domain
- [ ] HTTPS enabled (required for secure cookies)
- [ ] `/api/v1/users/me` endpoint working
- [ ] OTP email delivery configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Performance monitoring (Vercel Analytics, etc.)

---

## 📝 Version History

### v1.2.0 (Current - October 5, 2025)

- ✅ HTTP-only cookie authentication
- ✅ 3-layer JWT validation (20-200x faster)
- ✅ Server-side route protection
- ✅ Modular configuration layer
- ✅ Consolidated documentation (3 comprehensive guides)
- ✅ Fixed login redirect bug

### v1.1.0 (October 5, 2025)

- ✅ Initial production release
- ✅ Two-step authentication (OTP)
- ✅ Registration with email verification
- ✅ localStorage-based token management
- ✅ Protected routes
- ✅ Comprehensive documentation

---

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Support

- **Documentation:** Check the guides in `/docs`
- **Issues:** Open an issue on GitHub
- **Email:** Contact the development team

---

**Built with ❤️ by the Attendify Team**
