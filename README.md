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
│   ├── auth/              # Authentication pages (login, signup)
│   ├── dashboard/         # Dashboard page (protected route)
│   └── layout.tsx         # Root layout with AuthProvider
├── components/
│   ├── ui/                # Shadcn UI components
│   └── ...                # Custom components
├── contexts/
│   └── AuthContext.tsx    # Global authentication state
├── hooks/
│   └── use-auth.ts        # Authentication hook
├── lib/
│   └── api/
│       └── auth.ts        # Auth API client
└── middleware/
    └── auth.ts            # Route protection utilities
```

## Authentication

This project includes a complete authentication system. For detailed documentation, see:

- **[AUTH_GUIDE.md](./AUTH_GUIDE.md)** - Comprehensive authentication guide
- Quick setup: Copy `.env.local.example` → `.env.local` and configure your backend URL
- Uses JWT tokens with automatic refresh
- Supports 2FA/OTP for registration and optional login verification

### Quick Auth Usage

```tsx
import { useAuth } from "@/hooks/use-auth";

function Component() {
  const { user, loginInitiate, logout, isLoading } = useAuth();
  
  // Login
  await loginInitiate({ username, password });
  
  // Logout
  await logout();
}
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
