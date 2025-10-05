# 🏗️ Architecture Guide

**Complete system architecture documentation for Attendify Frontend**

**Version:** 2.1.0  
**Last Updated:** October 5, 2025  
**Status:** Production-Ready

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [File Structure](#file-structure)
- [Module Responsibilities](#module-responsibilities)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [Security Architecture](#security-architecture)
- [Performance Architecture](#performance-architecture)
- [Best Practices](#best-practices)

---

## 📖 Overview

Attendify Frontend is built with **Next.js 15.5.4** using the **App Router** with a **modular, layered architecture** for maintainability and scalability.

### Core Principles

1. **Separation of Concerns** - Each module has a single responsibility
2. **Single Source of Truth** - Configuration centralized in one place
3. **Type Safety** - Full TypeScript with strict mode
4. **Security First** - HTTP-only cookies, server-side validation
5. **Performance Optimized** - 3-layer caching, minimal backend calls

### Technology Stack

- **Framework:** Next.js 15.5.4 (App Router)
- **Language:** TypeScript 5.x
- **UI:** React 18+ with Shadcn UI
- **Styling:** Tailwind CSS
- **State:** React Context + Hooks
- **HTTP Client:** Fetch API with custom wrapper
- **Validation:** Zod schemas

---

## 🏛️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Client)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Pages      │  │  Components  │  │   Hooks         │    │
│  │              │  │              │  │                 │    │
│  │ • Login      │  │ • UI         │  │ • useAuth       │    │
│  │ • Dashboard  │  │ • Forms      │  │ • useMobile     │    │
│  │ • Profile    │  │ • Layout     │  │                 │    │
│  └──────┬───────┘  └──────────────┘  └────────┬────────┘    │
│         │                                      │            │
│         └──────────────────┬───────────────────┘            │
│                            ↓                                │
│                   ┌─────────────────┐                       │
│                   │  Auth Context   │                       │
│                   │  (Global State) │                       │
│                   └────────┬────────┘                       │
│                            ↓                                │
│                   ┌─────────────────┐                       │
│                   │   Auth API      │                       │
│                   │   Client        │                       │
│                   └────────┬────────┘                       │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
┌────────────────────────────┼────────────────────────────────┐
│                            ↓                                │
│                 Next.js Server (Edge Runtime)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Middleware                         │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ 1. Read HTTP-only cookies                      │ │  │
│  │  │ 2. Validate JWT (3 layers)                     │ │  │
│  │  │ 3. Check route permissions                     │ │  │
│  │  │ 4. Redirect if unauthorized                    │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (/api/auth)                  │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ • set-tokens   - Set HTTP-only cookies        │ │  │
│  │  │ • clear-tokens - Clear cookies                │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Page Components                       │  │
│  │  (Only render if middleware allows)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Backend API Calls
                             │
┌────────────────────────────┼────────────────────────────────┐
│                            ↓                                │
│                  Backend API Server                         │
│                      (FastAPI)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • /api/v1/auth/register/initiate                           │
│  • /api/v1/auth/register/verify                             │
│  • /api/v1/auth/login/initiate                              │
│  • /api/v1/auth/login/verify                                │
│  • /api/v1/users/me                                         │
│  • ...                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

### Complete Directory Structure

```
attendify-frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes (Server)
│   │   │   └── auth/                 # Auth API endpoints
│   │   │       ├── set-tokens/
│   │   │       │   └── route.ts      # Set HTTP-only cookies
│   │   │       └── clear-tokens/
│   │   │           └── route.ts      # Clear cookies
│   │   │
│   │   ├── auth/                     # Authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   └── signup/
│   │   │       └── page.tsx          # Signup page
│   │   │
│   │   ├── dashboard/                # Dashboard pages
│   │   │   └── page.tsx              # User dashboard
│   │   │
│   │   ├── admin/                    # Admin pages
│   │   │   └── dashboard/
│   │   │       └── page.tsx          # Admin dashboard
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   └── favicon.ico
│   │
│   ├── components/                   # React Components
│   │   ├── ui/                       # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── app-sidebar.tsx           # App sidebar
│   │   ├── site-header.tsx           # Site header
│   │   └── ...
│   │
│   ├── config/                       # 🎯 Configuration Layer
│   │   ├── index.ts                  # Barrel export
│   │   ├── auth.ts                   # Auth configuration
│   │   └── routes.ts                 # Route definitions
│   │
│   ├── contexts/                     # React Contexts
│   │   └── AuthContext.tsx           # Auth global state
│   │
│   ├── hooks/                        # Custom Hooks
│   │   ├── use-auth.ts               # Auth hook
│   │   └── use-mobile.ts             # Mobile detection
│   │
│   ├── lib/                          # Utilities & APIs
│   │   ├── api/                      # API Clients
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── auth.ts               # Auth API client
│   │   │   └── README.md             # API docs
│   │   │
│   │   ├── middleware/               # 🛡️ Middleware Utilities
│   │   │   ├── index.ts              # Barrel export
│   │   │   └── utils.ts              # Route checking
│   │   │
│   │   └── utils.ts                  # General utilities
│   │
│   ├── styles/                       # Global styles
│   │   └── globals.css
│   │
│   └── middleware.ts                 # ⚡ Next.js Middleware
│
├── public/                           # Static assets
│   ├── images/
│   └── ...
│
├── docs/                             # 📚 Documentation
│   ├── AUTHENTICATION_GUIDE.md
│   ├── MIDDLEWARE_GUIDE.md
│   └── ARCHITECTURE_GUIDE.md
│
├── .env.local.example                # Environment variables
├── next.config.ts                    # Next.js config
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
└── package.json                      # Dependencies
```

### Layer Overview

```
┌─────────────────────────────────────────────────┐
│  Presentation Layer (Pages & Components)        │
│  • User Interface                               │
│  • User Interactions                            │
│  • Display Logic                                │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Application Layer (Hooks & Contexts)           │
│  • Business Logic                               │
│  • State Management                             │
│  • Side Effects                                 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  API Layer (lib/api)                            │
│  • HTTP Requests                                │
│  • Data Transformation                          │
│  • Error Handling                               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Server Layer (Middleware & API Routes)         │
│  • Route Protection                             │
│  • Cookie Management                            │
│  • Server-Side Logic                            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Configuration Layer (config/)                  │
│  • Settings & Constants                         │
│  • Route Definitions                            │
│  • Environment Config                           │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Module Responsibilities

### Configuration Layer (`src/config/`)

**Purpose:** Centralized configuration management

#### `auth.ts`
**Exports:**
- `COOKIE_CONFIG` - Cookie names and expiration
- `VALIDATION_CONFIG` - JWT validation settings
- `REDIRECT_URLS` - Standard redirect destinations
- `getCookieOptions()` - Environment-specific settings

**Example:**
```typescript
import { COOKIE_CONFIG, REDIRECT_URLS } from '@/config/auth';

// Cookie name
const tokenName = COOKIE_CONFIG.ACCESS_TOKEN.name;

// Redirect URL
const loginUrl = REDIRECT_URLS.LOGIN;
```

#### `routes.ts`
**Exports:**
- `PROTECTED_ROUTES` - Require authentication
- `AUTH_ROUTES` - Redirect if authenticated
- `PUBLIC_ROUTES` - Always accessible
- Type exports for type safety

**Example:**
```typescript
import { PROTECTED_ROUTES } from '@/config/routes';

// Check if route is protected
const isProtected = PROTECTED_ROUTES.includes('/dashboard');
```

---

### Middleware Layer (`src/middleware.ts`)

**Purpose:** Server-side route protection and JWT validation

**Responsibilities:**
- ✅ Intercept all requests before page loads
- ✅ Read HTTP-only cookies
- ✅ Validate JWT tokens (3 layers)
- ✅ Check route permissions
- ✅ Redirect unauthorized users
- ✅ Cache validation results

**Flow:**
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get token from HTTP-only cookie
  const accessToken = request.cookies.get('access_token')?.value;
  
  // 2. Validate token (3 layers: decode → cache → backend)
  const isAuthenticated = await verifyToken(accessToken);
  
  // 3. Redirect based on authentication status
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    return NextResponse.redirect('/auth/login');
  }
  
  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect('/dashboard');
  }
  
  // 4. Allow request
  return NextResponse.next();
}
```

---

### API Routes Layer (`src/app/api/auth/`)

**Purpose:** Cookie management endpoints

#### `set-tokens/route.ts`
**Endpoint:** `POST /api/auth/set-tokens`

**Purpose:** Set authentication tokens as HTTP-only cookies

**Request:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens set successfully"
}
```

**Implementation:**
```typescript
export async function POST(request: Request) {
  const { accessToken, refreshToken } = await request.json();
  
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set access token
  cookieStore.set(
    COOKIE_CONFIG.ACCESS_TOKEN.name,
    accessToken,
    {
      ...getCookieOptions(isProduction),
      maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
    }
  );
  
  // Set refresh token
  cookieStore.set(
    COOKIE_CONFIG.REFRESH_TOKEN.name,
    refreshToken,
    {
      ...getCookieOptions(isProduction),
      maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
    }
  );
  
  return NextResponse.json({
    success: true,
    message: 'Tokens set successfully',
  });
}
```

#### `clear-tokens/route.ts`
**Endpoint:** `POST /api/auth/clear-tokens`

**Purpose:** Clear authentication cookies (logout)

**Response:**
```json
{
  "success": true,
  "message": "Tokens cleared successfully"
}
```

---

### API Client Layer (`src/lib/api/`)

**Purpose:** Backend communication and data transformation

#### `auth.ts`
**Class:** `AuthAPI`

**Methods:**
- `registerInitiate()` - Send OTP for registration
- `registerVerify()` - Verify OTP, create account
- `loginInitiate()` - Login (OTP or token)
- `loginVerify()` - Verify OTP, get token
- `setTokens()` - Store tokens in cookies (async)
- `clearTokens()` - Clear cookies (async)
- `isAuthenticated()` - Check auth status (sync)
- `getCurrentUser()` - Get user data
- `forgotPassword()` - Request password reset
- `resetPassword()` - Reset password with token

**Example:**
```typescript
class AuthAPI {
  async loginInitiate(credentials: LoginInitiateRequest) {
    const response = await this.client.post<LoginInitiateResponse>(
      AUTH_ENDPOINTS.LOGIN_INITIATE,
      credentials
    );
    
    // If token received, store in cookies
    if ('access_token' in response) {
      await this.setTokens(response.access_token, response.access_token);
    }
    
    return response;
  }
  
  async setTokens(accessToken: string, refreshToken: string) {
    // Calls POST /api/auth/set-tokens
    await fetch('/api/auth/set-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
  }
}
```

---

### Hooks Layer (`src/hooks/`)

**Purpose:** Reusable stateful logic

#### `use-auth.ts`
**Hook:** `useAuth()`

**Returns:**
- `user` - Current user object
- `isLoading` - Loading state
- `isAuthenticated` - Auth status
- `error` - Error message
- `loginInitiate()` - Step 1 of login
- `loginVerify()` - Step 2 of login
- `registerInitiate()` - Step 1 of registration
- `registerVerify()` - Step 2 of registration
- `logout()` - Clear tokens and redirect
- `refreshUser()` - Reload user data
- `clearError()` - Clear error state

**Example:**
```typescript
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
  
  // Initialize on mount
  useEffect(() => {
    const initAuth = async () => {
      const authenticated = authAPI.isAuthenticated();
      
      if (authenticated) {
        const user = await authAPI.getCurrentUser();
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    initAuth();
  }, []);
  
  // ... methods ...
  
  return {
    ...state,
    loginInitiate,
    loginVerify,
    logout,
    // ...
  };
}
```

---

### Context Layer (`src/contexts/`)

**Purpose:** Global state management

#### `AuthContext.tsx`
**Context:** `AuthContext`

**Provides:**
- User state
- Authentication status
- Auth methods

**Example:**
```typescript
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
```

---

### Utilities Layer (`src/lib/middleware/`)

**Purpose:** Helper functions for middleware

#### `utils.ts`
**Functions:**
- `isProtectedRoute()` - Check if route requires auth
- `isAuthRoute()` - Check if route is auth-related
- `isPublicRoute()` - Check if route is public

**Example:**
```typescript
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );
}
```

---

## 🔄 Data Flow

### Login Flow (with OTP)

```
1. User enters credentials
   ↓
2. Component calls useAuth().loginInitiate()
   ↓
3. Hook calls authAPI.loginInitiate()
   ↓
4. API client calls POST /api/v1/auth/login/initiate
   ↓
5. Backend sends OTP to email
   ↓
6. Backend returns { message, email, expires_in_minutes }
   ↓
7. API client returns to hook
   ↓
8. Hook returns { success: true, requiresOTP: true, email }
   ↓
9. Component shows OTP input
   ↓
10. User enters OTP
    ↓
11. Component calls useAuth().loginVerify()
    ↓
12. Hook calls authAPI.loginVerify()
    ↓
13. API client calls POST /api/v1/auth/login/verify
    ↓
14. Backend validates OTP
    ↓
15. Backend returns { access_token, token_type }
    ↓
16. API client calls await setTokens()
    ↓
17. setTokens() calls POST /api/auth/set-tokens
    ↓
18. API route sets HTTP-only cookies
    ↓
19. Hook calls router.push('/dashboard')
    ↓
20. Middleware intercepts navigation
    ↓
21. Middleware validates token (3 layers)
    ↓
22. Middleware allows access
    ↓
23. Dashboard page loads
```

### Dashboard Access Flow

```
1. User navigates to /dashboard
   ↓
2. Middleware intercepts request
   ↓
3. Middleware reads access_token cookie
   ↓
4. Layer 1: Decode JWT, check expiration (0ms)
   ↓
   └─> Expired? → Redirect to login
   ↓ Not expired
5. Layer 2: Check cache (1ms)
   ↓
   └─> Found in cache? → Allow access
   ↓ Not in cache
6. Layer 3: Validate with backend (200ms)
   ↓
7. Call GET /api/v1/users/me with token
   ↓
8. Backend validates JWT signature
   ↓
9. Backend checks user exists
   ↓
10. Backend returns user data or 401
    ↓
    ├─> Valid → Cache result, allow access
    │
    └─> Invalid → Redirect to login
```

---

## 🎨 Design Patterns

### 1. Module Pattern

**Description:** Organize related functionality into modules

**Example:**
```typescript
// config/auth.ts - Auth configuration module
export const COOKIE_CONFIG = { /* ... */ };
export const REDIRECT_URLS = { /* ... */ };
export const getCookieOptions = () => { /* ... */ };

// Usage
import { COOKIE_CONFIG, REDIRECT_URLS } from '@/config/auth';
```

### 2. Repository Pattern

**Description:** Separate data access from business logic

**Example:**
```typescript
// lib/api/auth.ts - Data access
class AuthAPI {
  async loginInitiate(credentials) {
    return await this.client.post(/* ... */);
  }
}

// hooks/use-auth.ts - Business logic
export function useAuth() {
  const loginInitiate = async (credentials) => {
    setState({ isLoading: true });
    const result = await authAPI.loginInitiate(credentials);
    setState({ isLoading: false });
    return result;
  };
}
```

### 3. Factory Pattern

**Description:** Create objects based on conditions

**Example:**
```typescript
// lib/api/auth.ts
export const getCookieOptions = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,  // Different for dev/prod
  sameSite: 'lax' as const,
  path: '/',
});
```

### 4. Observer Pattern

**Description:** React Context + Hooks for state updates

**Example:**
```typescript
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextValue>();

export function AuthProvider({ children }) {
  const auth = useAuth();  // Observable state
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Components observe changes
function MyComponent() {
  const { user } = useAuthContext();  // Subscribes to updates
  return <div>{user?.username}</div>;
}
```

### 5. Strategy Pattern

**Description:** Different validation strategies in middleware

**Example:**
```typescript
// middleware.ts
async function verifyToken(token: string): Promise<boolean> {
  // Strategy 1: Quick decode
  if (isTokenExpired(token)) {
    return false;
  }
  
  // Strategy 2: Cache lookup
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isValid;
  }
  
  // Strategy 3: Backend validation
  return await validateWithBackend(token);
}
```

### 6. Singleton Pattern

**Description:** Single instance of API client

**Example:**
```typescript
// lib/api/auth.ts
class AuthAPI {
  private static instance: AuthAPI;
  
  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }
}

export const authAPI = AuthAPI.getInstance();
```

---

## 🔒 Security Architecture

### Defense in Depth

**Multiple layers of security:**

```
Layer 1: HTTP-only Cookies
  └─> JavaScript cannot access tokens
  
Layer 2: Server-Side Middleware
  └─> Validates before page loads
  
Layer 3: JWT Validation
  └─> Verifies signature and expiration
  
Layer 4: Backend API
  └─> Final authorization check
```

### Token Security

**Access Token:**
- Stored in HTTP-only cookie
- 7-day expiration
- Cannot be accessed by JavaScript
- Automatically sent with requests
- Validated on every protected route

**Refresh Token:**
- Stored in HTTP-only cookie
- 30-day expiration
- Used to get new access token
- Cannot be accessed by JavaScript

### CSRF Protection

**SameSite Cookie:**
```typescript
{
  sameSite: 'lax',  // Prevents cross-site requests
}
```

**Benefits:**
- ✅ Cookies not sent on cross-origin POST requests
- ✅ Prevents CSRF attacks
- ✅ Still allows GET requests

### XSS Protection

**HTTP-Only Flag:**
```typescript
{
  httpOnly: true,  // JavaScript cannot access
}
```

**Benefits:**
- ✅ Tokens not accessible via `document.cookie`
- ✅ Protected from XSS attacks
- ✅ Even if attacker injects script, can't steal tokens

---

## ⚡ Performance Architecture

### 3-Layer Caching

**Layer 1: Client Decode (0ms)**
- Parse JWT payload
- Check expiration
- No network call

**Layer 2: In-Memory Cache (1ms)**
- Map-based cache
- 1-minute TTL
- 90-99% hit rate

**Layer 3: Backend Validation (200ms)**
- Only when cache misses
- Validates signature
- Confirms user exists

### Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Cache Hit** | N/A | 1ms | - |
| **Backend Calls** | 100% | 1-10% | 90-99% reduction |
| **Avg Response** | 200ms | 1-10ms | 20-200x faster |

### Code Splitting

**Automatic by Next.js:**
- Each page is a separate bundle
- Components lazy-loaded
- Dynamic imports for large components

**Example:**
```typescript
// Dynamic import for large component
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Skeleton />,
});
```

### Image Optimization

**Next.js Image Component:**
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  width={100}
  height={100}
  alt="Logo"
  priority  // Preload important images
/>
```

---

## 🎯 Best Practices

### 1. Configuration Management

**DO:**
```typescript
// ✅ Centralized config
import { COOKIE_CONFIG } from '@/config/auth';
const tokenName = COOKIE_CONFIG.ACCESS_TOKEN.name;
```

**DON'T:**
```typescript
// ❌ Hardcoded values
const tokenName = 'access_token';
```

### 2. Error Handling

**DO:**
```typescript
// ✅ Specific error handling
try {
  await authAPI.loginInitiate(credentials);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      setError('Invalid credentials');
    } else {
      setError('An error occurred');
    }
  }
}
```

**DON'T:**
```typescript
// ❌ Generic error handling
try {
  await authAPI.loginInitiate(credentials);
} catch (error) {
  console.log(error);  // Silent failure
}
```

### 3. Type Safety

**DO:**
```typescript
// ✅ Type-safe
import { type ProtectedRoute } from '@/config/routes';
const route: ProtectedRoute = '/dashboard';
```

**DON'T:**
```typescript
// ❌ No type safety
const route = '/dashboard';  // Could be any string
```

### 4. Async Operations

**DO:**
```typescript
// ✅ Await async operations
await authAPI.setTokens(token, refresh);
router.push('/dashboard');
```

**DON'T:**
```typescript
// ❌ Missing await
authAPI.setTokens(token, refresh);  // Not awaited!
router.push('/dashboard');  // Redirects before cookies set
```

### 5. State Management

**DO:**
```typescript
// ✅ Use hooks for stateful logic
const { user, isLoading, loginInitiate } = useAuth();
```

**DON'T:**
```typescript
// ❌ Direct API calls in components
const [user, setUser] = useState(null);
const handleLogin = async () => {
  const result = await authAPI.loginInitiate(/* ... */);
  setUser(result.user);  // Duplicate logic
};
```

---

## 📚 Related Documentation

- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - Auth system guide
- **[MIDDLEWARE_GUIDE.md](./MIDDLEWARE_GUIDE.md)** - Middleware optimization
- **[README.md](../README.md)** - Project overview

---

## 🔄 Version History

### v1.2.0 (Current - October 5, 2025)
- 3-layer JWT validation
- In-memory caching
- Performance optimizations
- Fixed login redirect bug

### v1.1.0 (October 4, 2025)
- HTTP-only cookie authentication
- Modular architecture
- Server-side route protection
- Comprehensive documentation

### v1.0.0 (Initial)
- localStorage-based auth
- Client-side protection

---

**🎉 You now understand the complete architecture of Attendify Frontend!**
