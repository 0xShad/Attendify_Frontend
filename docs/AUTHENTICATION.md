# 🔐 Attendify Authentication Documentation

Complete authentication system guide for Attendify Frontend.

---

## 🚀 Quick Start

### Environment Setup
```bash
# .env.local
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Basic Usage
```tsx
import { useAuth } from "@/hooks/use-auth";

function LoginPage() {
  const { loginInitiate, loginVerify, isLoading } = useAuth();
  const [showOtp, setShowOtp] = useState(false);

  const handleLogin = async () => {
    const result = await loginInitiate({ 
      username_or_email: "user@example.com", 
      password: "pass123" 
    });
    
    if (result.requiresOTP) {
      setShowOtp(true); // Show OTP input
    }
    // Otherwise, auto-redirected to dashboard
  };
}
```

---

## 📚 Authentication Flows

### Registration (2-Step)

**Step 1: Initiate**
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

**Step 2: Verify**
```typescript
const { registerVerify } = useAuth();

await registerVerify({
  email: "user@example.com",
  otp: "123456"
});
// → Account created → Redirect to login
```

### Login (1 or 2-Step)

**Step 1: Initiate**
```typescript
const { loginInitiate } = useAuth();

const result = await loginInitiate({
  username_or_email: "johndoe",  // Username OR email
  password: "SecurePass123"
});

// Backend determines if OTP is required
if (result.requiresOTP) {
  // Show OTP input screen
} else {
  // Direct login → Auto-redirect to dashboard
}
```

**Step 2: Verify OTP** (if required)
```typescript
const { loginVerify } = useAuth();

await loginVerify({
  username_or_email: "johndoe",  // MUST match Step 1
  code: "123456"
});
// → Login complete → Redirect to dashboard
```

### Logout
```typescript
const { logout } = useAuth();

await logout();
// → Tokens cleared → Redirect to login
```

---

## 🔌 API Reference

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register/initiate` | Send OTP to email |
| `POST` | `/auth/register/verify` | Verify OTP, create account |
| `POST` | `/auth/login/initiate` | Login (OTP or token) |
| `POST` | `/auth/login/verify` | Verify OTP, get token |
| `GET` | `/users/me` | Get current user |

### Request/Response Types

#### Login Initiate
**Request:**
```typescript
{
  username_or_email: string,  // Username OR email
  password: string
}
```

**Response (OTP Required):**
```typescript
{
  message: string,
  email: string,
  expires_in_minutes: number,
  remaining_attempts: number
}
```

**Response (Direct Login):**
```typescript
{
  access_token: string,
  token_type: "bearer"
}
```

#### Login Verify
**Request:**
```typescript
{
  username_or_email: string,  // MUST match initiate
  code: string                 // 6-digit OTP
}
```

**Response:**
```typescript
{
  access_token: string,
  token_type: "bearer"
}
```

### useAuth Hook

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
  refreshUser: () => Promise<void>;
  clearError: () => void;
  
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

---

## 💻 Implementation Examples

### Login Page
```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { InputOTP } from "@/components/ui/input-otp";

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
      await loginVerify({ 
        username_or_email: username, 
        code: otp 
      });
    } else {
      // Step 1: Initiate
      const result = await loginInitiate({ 
        username_or_email: username, 
        password 
      });
      
      if (result.requiresOTP) {
        setShowOtp(true);
        setUserEmail(result.email || "");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!showOtp ? (
        <>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username or Email"
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
        </>
      ) : (
        <div>
          <p>OTP sent to {userEmail}</p>
          <InputOTP 
            value={otp} 
            onChange={setOtp} 
            maxLength={6} 
          />
          <button 
            type="button" 
            onClick={() => setShowOtp(false)}
          >
            Back to Login
          </button>
        </div>
      )}
      
      {error && <p className="text-red-500">{error}</p>}
      
      <button disabled={isLoading}>
        {isLoading 
          ? (showOtp ? "Verifying OTP..." : "Signing In...") 
          : (showOtp ? "Verify OTP" : "Login")
        }
      </button>
    </form>
  );
}
```

### Protected Dashboard
```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router]);

  if (isChecking) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Signup Page
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
    if (result.success) setStep("verify");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerVerify({ email: formData.email, otp });
  };

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify}>
        <p>OTP sent to {formData.email}</p>
        <input 
          value={otp} 
          onChange={(e) => setOtp(e.target.value)} 
          maxLength={6} 
        />
        {error && <p>{error}</p>}
        <button disabled={isLoading}>Verify OTP</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignup}>
      <input 
        placeholder="Email" 
        value={formData.email} 
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
      />
      <input 
        placeholder="Username" 
        value={formData.username} 
        onChange={(e) => setFormData({...formData, username: e.target.value})} 
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={formData.password} 
        onChange={(e) => setFormData({...formData, password: e.target.value})} 
      />
      <input 
        type="password" 
        placeholder="Confirm Password" 
        value={formData.confirmPassword} 
        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
      />
      {error && <p>{error}</p>}
      <button disabled={isLoading}>Sign Up</button>
    </form>
  );
}
```

---

## 🏗️ Architecture

### File Structure
```
src/
├── lib/api/
│   ├── auth.ts          # API client (500+ lines)
│   └── index.ts         # Exports
├── hooks/
│   └── use-auth.ts      # React hook
├── contexts/
│   └── AuthContext.tsx  # Global state
└── middleware/
    └── auth.ts          # Route protection
```

### Data Flow
```
UI Layer (Pages)
    ↓
useAuth Hook
    ↓
AuthContext (State)
    ↓
authAPI (HTTP Client)
    ↓
localStorage (Tokens)
    ↓
Backend API
```

### Token Management

- **Storage**: `localStorage` with keys `access_token` and `refresh_token`
- **Injection**: Automatically added to requests as `Bearer {token}`
- **Clearing**: Automatic on logout (client-side only, JWT is stateless)
- **Validation**: `isAuthenticated()` checks for `access_token`

---

## ⚠️ Important Notes

### Critical Requirements

1. **Username/Email Consistency**: The `username_or_email` field MUST be identical in both `loginInitiate()` and `loginVerify()` calls
2. **OTP Detection**: Backend controls OTP requirement via `REQUIRE_LOGIN_OTP` setting
3. **Token Keys**: All code now uses `access_token` and `refresh_token` (fixed from `accessToken`/`refreshToken`)
4. **Client-Side Logout**: No backend call needed (JWT is stateless)

### Validation Rules

- **Username/Email**: Minimum 3 characters
- **Password**: Minimum 8 characters, must include uppercase, lowercase, and number
- **OTP Code**: Exactly 6 digits
- **Names**: Can contain spaces and letters

### Error Handling

```typescript
// Errors are automatically parsed and displayed
// Network errors show: "Unable to connect to server"
// Validation errors show as bulleted lists
// All errors displayed via toast notifications
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access dashboard | Check `access_token` in localStorage |
| Network errors | Verify `NEXT_PUBLIC_AUTH_API_URL` in `.env.local` |
| OTP not showing | Check backend `REQUIRE_LOGIN_OTP` setting |
| Token not sent | Ensure user is logged in |
| TypeScript errors | Restart TS server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server" |

---

## ✅ Testing Checklist

- [ ] Register with OTP verification
- [ ] Login with OTP (when enabled)
- [ ] Login without OTP (when disabled)
- [ ] Login with username
- [ ] Login with email
- [ ] Protected routes redirect when not authenticated
- [ ] Logout clears tokens and redirects
- [ ] Tokens persist across page refreshes
- [ ] Error messages display correctly
- [ ] Loading states work properly

---

## 🔒 Security

- **Password Requirements**: 8+ chars, uppercase, lowercase, number
- **Token Storage**: localStorage (consider httpOnly cookies for production)
- **HTTPS**: Always use in production
- **OTP**: 6-digit, time-limited (backend enforced)
- **Environment Variables**: Never commit `.env.local`

---

## 📦 Dependencies

- **zod** - Schema validation
- **sonner** - Toast notifications
- **next** - Framework
- **react** - UI library

---

## 🎯 Key Features

✅ Type-safe with TypeScript  
✅ Zod schema validation  
✅ JWT authentication  
✅ OTP support (optional)  
✅ Toast notifications  
✅ Loading states  
✅ Error handling  
✅ Token persistence  
✅ Protected routes  

---

**Need Help?** Check the implementation examples above or review:
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/dashboard/page.tsx`
