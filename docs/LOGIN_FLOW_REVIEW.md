# Login, Role & Onboarding Flow Review

## Overview
This document explains the complete authentication, role verification, and onboarding flow in the Attendify system.

---

## 1. Login Flow

### Step 1: User Initiates Login (`/auth/login`)
```tsx
// File: src/app/auth/login/page.tsx
// User enters credentials -> loginInitiate()
```

**Process:**
1. User submits username/email and password
2. `useAuth.loginInitiate()` calls backend auth API
3. Two possible responses:
   - **OTP Required**: Shows OTP input screen
   - **Direct Token**: Proceeds to Step 2

### Step 2: Token Storage
```ts
// File: src/lib/api/auth.ts -> setTokens()
// Tokens stored as HTTP-only cookies via /api/auth/set-tokens
```

**Process:**
1. Backend returns `access_token`
2. Frontend calls `/api/auth/set-tokens` to store as HTTP-only cookie
3. **Token cache is cleared** to force fresh validation
4. Redirect to `/profile/create`

### Step 3: Middleware Intercepts Request
```ts
// File: src/middleware.ts
// Every request goes through middleware for auth check
```

**Process:**
1. Middleware reads `access_token` cookie
2. Validates token by calling backend directly: `NEXT_PUBLIC_USER_API_URL/me`
3. Fetches user profile: `NEXT_PUBLIC_BACKEND_API_URL/v1/profiles/user/{userId}`
4. Determines user role and onboarding status
5. Redirects based on state (see Decision Tree below)

---

## 2. Role & Profile Logic

### Profile Structure
```ts
{
  id: number;              // Profile ID
  user_id: number;         // User ID
  role: "Admin" | "Faculty" | "Student";
  organization_id: number | null;  // Required for non-Admin users
  email: string;
  username: string;
  // ... other fields
}
```

### Role Determination

#### Admin Users
- **Role**: `"Admin"` or `"Admin"` (case-sensitive check)
- **Organization**: NOT required
- **Onboarded**: Immediately after profile creation
- **Redirect**: `/admin/dashboard`

#### Faculty Users
- **Role**: `"Faculty"`
- **Organization**: REQUIRED (`organization_id != null`)
- **Onboarded**: Only if `organization_id` is set
- **Redirect**: `/faculty/dashboard`

#### Student Users
- **Role**: `"Student"`
- **Organization**: REQUIRED (`organization_id != null`)
- **Onboarded**: Only if `organization_id` is set
- **Redirect**: `/student/dashboard`

---

## 3. Onboarding Flow

### When User Needs Onboarding
A user needs to complete onboarding if:
1. No profile exists (404 response from backend)
2. Profile exists BUT `userRole` is undefined/null
3. For non-Admin: `organization_id` is null

### Onboarding Process
```tsx
// File: src/app/profile/create/page.tsx
// Multi-step form to complete user profile
```

**Steps:**
1. **About You**: Bio, avatar image
2. **School & Program**: Select organization and program
3. **Face Submission**: Upload face photo for recognition

**On Submit:**
1. PATCH `/api/profiles/mine` with form data
2. Backend updates profile with `organization_id`, `program_id`, etc.
3. Redirect to `/` to trigger middleware re-routing
4. Middleware fetches fresh profile and redirects to correct dashboard

---

## 4. Middleware Decision Tree

```
Request to Any Route
  │
  ├─ Has access_token cookie?
  │  ├─ NO → Is Protected Route?
  │  │        ├─ YES → Redirect to /auth/login
  │  │        └─ NO → Allow
  │  │
  │  └─ YES → Validate Token
  │           ├─ INVALID → Treat as no token
  │           │
  │           └─ VALID → Fetch Profile
  │                    ├─ Profile Fetch Error → Redirect to /error/service-unavailable
  │                    │
  │                    ├─ Profile NOT Found (404) → userRole = undefined
  │                    │
  │                    └─ Profile Found → Determine Role
  │                                      │
  │                                      ├─ Admin → userRole = "Admin"
  │                                      │
  │                                      ├─ Faculty/Student with organization_id
  │                                      │  → userRole = role from profile
  │                                      │
  │                                      └─ Faculty/Student WITHOUT organization_id
  │                                         → userRole = undefined (needs onboarding)
  │
  └─ Route-Based Redirects:
       │
       ├─ AUTH ROUTE (/, /auth/login, /auth/signup)
       │  ├─ isAuthenticated && userRole exists → Redirect to role dashboard
       │  └─ isAuthenticated && NO userRole → Redirect to /profile/create
       │
       ├─ PROTECTED ROUTE (dashboard, etc)
       │  ├─ !isAuthenticated → Redirect to /auth/login
       │  ├─ isAuthenticated && NO userRole → Redirect to /profile/create
       │  └─ isAuthenticated && wrong role → Redirect to correct dashboard
       │
       └─ /profile/create
          ├─ !isAuthenticated → Redirect to /auth/login
          └─ isAuthenticated → Allow (for onboarding)
```

---

## 5. Key Environment Variables

These must be set correctly in Cloud Run:

```env
NEXT_PUBLIC_USER_API_URL=https://attendify-auth-xxx.run.app/api/v1/users
NEXT_PUBLIC_AUTH_API_URL=https://attendify-auth-xxx.run.app/api/v1/auth
NEXT_PUBLIC_BACKEND_API_URL=https://attendify-backend-xxx.run.app/api/v1
NEXT_PUBLIC_APP_URL=https://attendify-frontend-xxx.run.app
```

**Critical**: Middleware calls these URLs directly (not internal API routes) because Edge Middleware cannot reliably fetch internal routes.

---

## 6. Important Files

### Authentication
- `src/middleware.ts` - Route protection, token validation, role routing
- `src/lib/api/auth.ts` - Auth API client
- `src/hooks/use-auth.ts` - Auth React hook
- `src/app/api/auth/set-tokens/route.ts` - HTTP-only cookie setter

### Profile Management
- `src/app/profile/create/page.tsx` - Onboarding UI
- `src/app/api/profiles/mine/route.ts` - Profile proxy endpoint
- `src/lib/api/profiles.ts` - Profile API client

### Configuration
- `src/config/auth.ts` - Auth constants, cookie config
- `src/config/routes.ts` - Route definitions (AUTH_ROUTES, PROTECTED_ROUTES)

---

## 7. Recent Fixes Applied

### Fix #1: Direct Backend Calls from Middleware
**Problem**: Edge Middleware couldn't fetch internal `/api/session/me` routes  
**Solution**: Middleware now calls backend APIs directly using environment variables

### Fix #2: Token Cache Clearing on Login
**Problem**: Stale cache entries marked tokens as invalid after fresh login  
**Solution**: `/api/auth/set-tokens` now clears cache when setting new cookies

### Fix #3: Redirect to /profile/create Instead of /
**Problem**: Redirecting to `/` (AUTH_ROUTE) caused loops  
**Solution**: After login, redirect to `/profile/create`, middleware handles final routing

### Fix #4: Role-Based Redirect from Profile Creation
**Problem**: Profile creation hardcoded redirect to `/student/dashboard`  
**Solution**: Now redirects to `/` to let middleware determine correct dashboard based on role

---

## 8. Testing Checklist

After deployment, verify:

- [ ] Login with Admin account → Redirects to `/admin/dashboard`
- [ ] Login with Faculty account → Redirects to `/faculty/dashboard`  
- [ ] Login with Student account → Redirects to `/student/dashboard`
- [ ] New user without profile → Redirects to `/profile/create`
- [ ] User with profile but no organization → Redirects to `/profile/create`
- [ ] After completing onboarding → Redirects to correct dashboard
- [ ] Accessing wrong role route → Redirects to correct dashboard
- [ ] Unauthenticated access to protected route → Redirects to login
- [ ] Token expiration → Redirects to login

---

## 9. Debug Logs to Monitor

After deployment, check Cloud Run logs for:

```
[MIDDLEWARE] Processing: {pathname}
[MIDDLEWARE] Access token present: true
[MIDDLEWARE] Starting token verification for token: ...
[MIDDLEWARE] Calling backend directly: {url}
[MIDDLEWARE] Backend response status: 200
[MIDDLEWARE] Token validated successfully, userId: {id}
[MIDDLEWARE] Calling backend profile endpoint: {url}
[MIDDLEWARE] Profile fetch status: 200
[MIDDLEWARE] Got profile with role: {role}, organization_id: {id}, onboarded: true
[MIDDLEWARE] User has role {role}, redirecting to dashboard
[MIDDLEWARE] Redirecting {pathname} -> {dashboard}
```

**Success Pattern:**
1. Token validates (200)
2. Profile fetched (200)
3. Role determined correctly
4. Redirected to correct dashboard

**Failure Patterns to Watch:**
- `Backend response status: 401` → Invalid token
- `Backend response status: 404` → Profile not found
- `Backend response status: 500` → Backend error
- `NEXT_PUBLIC_*_API_URL not configured` → Missing env vars
