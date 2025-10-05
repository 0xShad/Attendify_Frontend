# 🔐 Attendify Authentication Guide

**Complete authentication system documentation for Attendify Frontend**

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Architecture Overview](#-architecture-overview)
3. [API Reference](#-api-reference)
4. [Integration Guide](#-integration-guide)
5. [Migration Guide](#-migration-guide)
6. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Configure your backend URL
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Add AuthProvider

```tsx
// src/app/layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Use in Components

```tsx
import { useAuth } from "@/hooks/use-auth";

function LoginPage() {
  const { loginInitiate, loginVerify, isLoading } = useAuth();
  const [showOtp, setShowOtp] = useState(false);

  const handleLogin = async () => {
    const result = await loginInitiate({ username, password });
    
    if (result.requiresOTP) {
      setShowOtp(true);
    }
    // Otherwise, user is automatically redirected to dashboard
  };
}
```

---

## 🏗️ Architecture Overview

### Layer Structure

```
┌─────────────────────────────────────────────┐
│         UI Layer (Pages/Components)         │
│  /auth/login, /auth/signup, /dashboard     │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         React Hooks (useAuth)               │
│  login, signup, logout, error, loading     │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Context (AuthContext)                 │
│  Global state, single source of truth      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       API Client (authAPI)                  │
│  HTTP requests, token management, types    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Storage (localStorage)                │
│  accessToken, refreshToken                 │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Backend API                           │
│  /api/v1/auth/*                            │
└─────────────────────────────────────────────┘
```

### File Structure

```
src/
├── lib/api/
│   ├── auth.ts          # Auth API client (500+ lines)
│   └── index.ts         # Exports
├── hooks/
│   └── use-auth.ts      # React hook for auth
├── contexts/
│   └── AuthContext.tsx  # Global auth state
└── middleware/
    └── auth.ts          # Route protection
```

---

## 📚 API Reference

### Authentication Flows

#### **Registration Flow** (2 Steps)

**Step 1: Initiate Registration**
```typescript
const { registerInitiate } = useAuth();

await registerInitiate({
  email: "user@example.com",
  username: "johndoe",
  password: "SecurePass123",
  confirmPassword: "SecurePass123"
});
// → OTP sent to email
```

**Step 2: Verify OTP**
```typescript
const { registerVerify } = useAuth();

await registerVerify({
  email: "user@example.com",
  otp: "123456"
});
// → Account created, redirect to login
```

#### **Login Flow** (1 or 2 Steps)

**Step 1: Initiate Login**
```typescript
const { loginInitiate } = useAuth();

const result = await loginInitiate({
  username: "johndoe",
  password: "SecurePass123"
});

if (result.requiresOTP) {
  // Show OTP input (if backend requires it)
} else {
  // Login complete → redirect to dashboard
}
```

**Step 2: Verify OTP** (if required)
```typescript
const { loginVerify } = useAuth();

await loginVerify({
  email: "user@example.com",
  otp: "123456"
});
// → Login complete, redirect to dashboard
```

### useAuth Hook Methods

```typescript
interface UseAuthReturn {
  // Registration
  registerInitiate: (data: RegisterInitiateRequest) => Promise<{ success: boolean; email?: string }>;
  registerVerify: (data: RegisterVerifyRequest) => Promise<boolean>;
  
  // Login
  loginInitiate: (data: LoginInitiateRequest) => Promise<{ success: boolean; requiresOTP?: boolean; email?: string }>;
  loginVerify: (data: LoginVerifyRequest) => Promise<boolean>;
  
  // Other
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register/initiate` | Send OTP to email |
| `POST` | `/auth/register/verify` | Verify OTP, create account |
| `POST` | `/auth/login/initiate` | Login or send OTP |
| `POST` | `/auth/login/verify` | Verify OTP, get tokens |
| `POST` | `/auth/logout` | Logout user |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/me` | Get current user info |

### Type Definitions

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  studentNumber?: string;
  contactNumber?: string;
  dateOfBirth: string;
  isVerified: boolean;
  role: "student" | "admin" | "teacher";
  createdAt: string;
  updatedAt: string;
}

interface RegisterInitiateRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface LoginInitiateRequest {
  username: string;
  password: string;
}

interface RegisterVerifyRequest | LoginVerifyRequest {
  email: string;
  otp: string;  // 6-digit code
}
```

---

## 🔧 Integration Guide

### 1. Login Page

```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { loginInitiate, loginVerify, isLoading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showOtp) {
      // Step 2: Verify OTP
      await loginVerify({ email: userEmail, otp });
    } else {
      // Step 1: Initiate login
      const result = await loginInitiate({ username, password });
      
      if (result.success && result.requiresOTP) {
        setShowOtp(true);
        setUserEmail(result.email || "");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!showOtp ? (
        <>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </>
      ) : (
        <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
      )}
      
      {error && <p className="error">{error}</p>}
      <button disabled={isLoading}>
        {isLoading ? "Loading..." : showOtp ? "Verify OTP" : "Login"}
      </button>
    </form>
  );
}
```

### 2. Signup Page

```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function SignupPage() {
  const { registerInitiate, registerVerify, isLoading, error } = useAuth();
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [otp, setOtp] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await registerInitiate(formData);
    
    if (result.success) {
      setStep("verify");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerVerify({ email: formData.email, otp });
  };

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify}>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
        {error && <p>{error}</p>}
        <button disabled={isLoading}>Verify OTP</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignup}>
      <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
      <input placeholder="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
      <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
      <input type="password" placeholder="Confirm" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
      {error && <p>{error}</p>}
      <button disabled={isLoading}>Sign Up</button>
    </form>
  );
}
```

### 3. Protected Route (Dashboard)

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. Navigation Component

```tsx
import { useAuth } from "@/hooks/use-auth";

function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav>
      {isAuthenticated && user ? (
        <>
          <span>Welcome, {user.username}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/auth/login">Login</a>
      )}
    </nav>
  );
}
```

---

## 🔄 Migration Guide

### Old Method → New Method

| Old | New |
|-----|-----|
| `login()` | `loginInitiate()` + `loginVerify()` |
| `signup()` | `registerInitiate()` |
| `verifyOTP()` | `registerVerify()` or `loginVerify()` |
| `resendOTP()` | _(Not yet implemented)_ |

### Before (Old Flow)

```typescript
const { login, signup, verifyOTP } = useAuth();

// Login
await login({ email, password });

// Signup
await signup({ email, password, ...data });
await verifyOTP({ email, otp });
```

### After (New Flow)

```typescript
const { loginInitiate, loginVerify, registerInitiate, registerVerify } = useAuth();

// Login
const result = await loginInitiate({ username, password });
if (result.requiresOTP) {
  await loginVerify({ email, otp });
}

// Signup
await registerInitiate({ email, username, password, confirmPassword });
await registerVerify({ email, otp });
```

---

## 🐛 Troubleshooting

### Build Errors

**Error: `'` can be escaped with `&apos;`**
```tsx
// ❌ Wrong
<p>Don't have an account?</p>

// ✅ Correct
<p>Don&apos;t have an account?</p>
```

**Error: Variable assigned but never used**
```tsx
// ❌ Wrong
const fieldsToValidate = ["email", "password"];
const emailError = validate(email);

// ✅ Correct (remove unused variable)
const emailError = validate(email);
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Network error | Check `NEXT_PUBLIC_AUTH_API_URL` in `.env.local` |
| Token not sent | Ensure user is logged in, check localStorage |
| TypeScript errors | Run `npm run build`, restart TS server |
| CORS errors | Configure backend CORS to allow frontend domain |
| Can't find module | Restart TypeScript: `Ctrl+Shift+P` → "TypeScript: Restart TS Server" |

### Testing Checklist

- [ ] User can sign up with OTP verification
- [ ] User can log in (with/without OTP based on backend config)
- [ ] Protected routes redirect to login when not authenticated
- [ ] Logout clears tokens and redirects to login
- [ ] Tokens persist across page refreshes
- [ ] Error messages display correctly
- [ ] Loading states work properly
- [ ] No console errors

---

## 🎯 Key Features

✅ **Type-Safe** - Full TypeScript support  
✅ **Validated** - Zod schemas prevent invalid data  
✅ **Secure** - JWT tokens, password strength requirements  
✅ **User-Friendly** - Toast notifications, loading states  
✅ **Production-Ready** - Error handling, token refresh  
✅ **Flexible** - OTP optional for login (backend controlled)  
✅ **Well-Documented** - Examples and types included  

---

## 📝 Environment Variables

```env
# Required
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional
NEXT_PUBLIC_APP_NAME=Attendify
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔒 Security Notes

1. **Password Requirements**: 8+ chars, uppercase, lowercase, number
2. **Token Storage**: Currently localStorage (consider httpOnly cookies for production)
3. **Token Refresh**: Automatic refresh on 401 errors
4. **OTP**: 6-digit code, time-limited (backend enforced)
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit `.env.local`

---

## 📦 Dependencies

- **zod** - Schema validation
- **sonner** - Toast notifications
- **next** - Framework
- **react** - UI library

---

## 🎉 You're All Set!

Your authentication system is ready to use. Follow the integration guide above to connect your pages, and refer to the API reference for specific methods.

**Need help?** Check the troubleshooting section or review the example files in:
- `src/app/auth/login/page.example.tsx`
- `src/app/dashboard/page.example.tsx`
