# Login Flow Update - Frontend Implementation

## ✅ Changes Applied

### 1. **Updated API Types** (`src/lib/api/auth.ts`)

#### Login Initiate Request
```typescript
{
  username_or_email: string,  // Changed from separate 'username' field
  password: string
}
```

#### Login Initiate Response (Two Variants)
**When OTP is enabled:**
```typescript
{
  message: string,
  email: string,
  expires_in_minutes: number,
  remaining_attempts: number
}
```

**When OTP is disabled:**
```typescript
{
  access_token: string,
  token_type: string
}
```

#### Login Verify Request
```typescript
{
  username_or_email: string,  // Changed from 'email' - MUST match initiate
  code: string                 // Changed from 'otp'
}
```

#### Login Verify Response
```typescript
{
  access_token: string,
  token_type: string
}
```

### 2. **Updated API Methods** (`src/lib/api/auth.ts`)

- `loginInitiate()`: Now handles two response types (OTP vs direct token)
- `loginVerify()`: Stores token directly from response
- Removed dependency on `success` and `data` wrapper fields

### 3. **Updated Auth Hook** (`src/hooks/use-auth.ts`)

- `loginInitiate()`: Checks response type using type guards
  - If `message` and `email` exist → OTP required
  - If `access_token` exists → Direct login
- `loginVerify()`: Simplified to just store token and redirect
- Both methods show appropriate toast notifications

### 4. **Updated Login Page** (`src/app/auth/login/page.tsx`)

- Step 1: Sends `username_or_email` and `password`
- Step 2: Sends `username_or_email` (same as step 1) and `code`
- **Critical:** Username/email must be consistent across both steps
- Improved error display with JSON parsing for validation errors

---

## 🔄 Complete Login Flow

### Scenario 1: OTP Enabled (REQUIRE_LOGIN_OTP=True)

```
User enters: username/email + password
    ↓
POST /login/initiate
    ↓
Response: { message, email, expires_in_minutes, remaining_attempts }
    ↓
Show OTP input
    ↓
User enters: 6-digit code
    ↓
POST /login/verify with { username_or_email, code }
    ↓
Response: { access_token, token_type }
    ↓
Store token → Redirect to /dashboard
```

### Scenario 2: OTP Disabled (REQUIRE_LOGIN_OTP=False)

```
User enters: username/email + password
    ↓
POST /login/initiate
    ↓
Response: { access_token, token_type }
    ↓
Store token → Redirect to /dashboard
```

---

## ⚠️ Breaking Changes

1. **Field Name Changes:**
   - Login verify now uses `username_or_email` instead of `email`
   - OTP field changed from `otp` to `code`

2. **Response Structure:**
   - No more `success` wrapper field
   - No more `data` wrapper object
   - Direct response fields based on operation

3. **Token Storage:**
   - Backend uses single `access_token` (no separate refresh token in response)
   - Frontend stores same token for both access and refresh slots

---

## ✅ Validation

- Username/email: Minimum 3 characters
- Password: Minimum 6 characters
- Code: Exactly 6 digits
- All validation errors are parsed and displayed as bulleted lists

---

## 🧪 Testing Checklist

- [ ] Login with username (OTP enabled)
- [ ] Login with email (OTP enabled)
- [ ] Login with username (OTP disabled)
- [ ] Login with email (OTP disabled)
- [ ] Invalid credentials error handling
- [ ] Invalid OTP error handling
- [ ] Network error handling
- [ ] Validation error display
- [ ] Token storage and dashboard access
- [ ] Consistency: same identifier in initiate and verify

---

## 📝 Notes

- The frontend maintains the `username` variable name internally but maps it to `username_or_email` in API calls
- The `userEmail` state is still used to display which email received the OTP
- Error messages are now parsed from JSON arrays for better UX
- Network errors show user-friendly "Unable to connect to server" message
