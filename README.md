# Attendify Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your backend API URL:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and update the values:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

```
src/
├── app/
│   ├── api/auth/          # Cookie management API routes
│   ├── auth/              # Authentication pages (login, signup)
│   ├── dashboard/         # User dashboard (protected route)
│   ├── admin/dashboard/   # Admin dashboard (protected route)
│   └── layout.tsx         # Root layout with AuthProvider
├── components/
│   ├── ui/                # Shadcn UI components
│   └── ...                # Custom components
├── config/                # 🆕 Configuration files
│   ├── auth.ts           # Authentication settings
│   └── routes.ts         # Route definitions
├── contexts/
│   └── AuthContext.tsx    # Global authentication state
├── hooks/
│   └── use-auth.ts        # Authentication hook
├── lib/
│   ├── api/
│   │   └── auth.ts       # Auth API client (HTTP-only cookies)
│   └── middleware/        # 🆕 Middleware utilities
│       └── utils.ts      # Route checking helpers
└── middleware.ts          # 🆕 Server-side route protection
```

## Authentication

This project includes a **production-ready HTTP-based authentication system** with HTTP-only cookies for enhanced security.

### 📚 Documentation

- **[docs/QUICK_START.md](./docs/QUICK_START.md)** - Quick start guide for developers
- **[docs/COMPLETE_IMPLEMENTATION_SUMMARY.md](./docs/COMPLETE_IMPLEMENTATION_SUMMARY.md)** - Full implementation overview
- **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** - Comprehensive authentication guide
- **[docs/MODULAR_ARCHITECTURE.md](./docs/MODULAR_ARCHITECTURE.md)** - Architecture deep dive
- **[docs/MIDDLEWARE_OPTIMIZATION.md](./docs/MIDDLEWARE_OPTIMIZATION.md)** - 🆕 Performance optimization guide

### 🔐 Key Features

- ✅ **HTTP-only cookies** - Tokens cannot be accessed by JavaScript (XSS protection)
- ✅ **Server-side route protection** - Next.js middleware validates before page loads
- ✅ **JWT validation** - Backend verification via `/api/v1/users/me`
- ✅ **3-layer optimization** - Decode → Cache → Backend (20-200x faster)
- ✅ **Modular architecture** - Single source of truth for routes and config
- ✅ **Type-safe** - Full TypeScript support with Zod validation
- ✅ **2FA/OTP support** - Optional OTP verification for login and registration

### Quick Auth Usage

```tsx
import { useAuth } from "@/hooks/use-auth";

function Component() {
  const { user, loginInitiate, logout, isLoading, isAuthenticated } = useAuth();
  
  // Login (returns tokens, sets HTTP-only cookies automatically)
  await loginInitiate({ username, password });
  
  // Logout (clears cookies)
  await logout();
  
  // Check authentication (synchronous - middleware handles protection)
  // If your component renders on a protected route, user is authenticated
  if (isAuthenticated) {
    // Show protected content
  }
}
```

### Adding Protected Routes

```typescript
// Edit: src/config/routes.ts
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin/dashboard',
  '/my-new-route', // ← Add here, automatically protected!
];
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
