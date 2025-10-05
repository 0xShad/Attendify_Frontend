# API Client# Authentication API Documentation



This directory contains the API client implementation for Attendify Frontend.## Overview



## Quick ReferenceThis directory contains the authentication API client for the Attendify Frontend application. It provides a type-safe, validated interface for all authentication-related operations.



```typescript## Features

import { authAPI } from '@/lib/api';

- ✅ Type-safe API calls with TypeScript

// Check authentication status- ✅ Request validation using Zod schemas

const isLoggedIn = authAPI.isAuthenticated();- ✅ Automatic token management (access & refresh tokens)

- ✅ Error handling with custom ApiError class

// Get current user- ✅ JWT token refresh mechanism

const user = await authAPI.getCurrentUser();- ✅ LocalStorage-based token persistence



// Clear tokens on logout## Structure

authAPI.clearTokens();

``````

src/lib/api/

## Full Documentation├── auth.ts       # Main authentication API client

├── index.ts      # Central export point

For complete authentication documentation, see:└── README.md     # This file

📖 **[docs/AUTHENTICATION.md](../../../docs/AUTHENTICATION.md)**```



## Files## Usage



- **auth.ts** - Authentication API client (500+ lines)### Basic Import

  - Login/Registration flows

  - Token management```typescript

  - HTTP client with error handlingimport { authAPI } from '@/lib/api';

  - Zod schema validation```

  

- **index.ts** - Central export point### Login Example



## Key Features```typescript

import { authAPI } from '@/lib/api/auth';

✅ Type-safe TypeScript API  

✅ Zod request validation  try {

✅ Automatic token injection    const response = await authAPI.login({

✅ Custom error handling      email: 'student@example.com',

✅ localStorage persistence      password: 'SecurePassword123'

✅ JWT authentication    });

  

## Environment Setup  console.log('User:', response.data.user);

  // Tokens are automatically stored

```bash} catch (error) {

# .env.local  console.error('Login failed:', error.message);

NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/v1/auth}

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1```

```

### Signup Example

## Usage Pattern

```typescript

Instead of using `authAPI` directly, use the `useAuth()` hook:import { authAPI } from '@/lib/api/auth';



```typescripttry {

import { useAuth } from '@/hooks/use-auth';  const response = await authAPI.signup({

    firstName: 'John',

function MyComponent() {    lastName: 'Doe',

  const { loginInitiate, user, isAuthenticated } = useAuth();    email: 'john.doe@example.com',

      password: 'SecurePassword123',

  // Hook handles all API calls + state management    confirmPassword: 'SecurePassword123',

}    studentNumber: '2024001',

```    contactNumber: '+1234567890',

    dateOfBirth: '2000-01-01'

---  });

  

**For detailed examples, flows, and troubleshooting, see the main [Authentication Guide](../../../docs/AUTHENTICATION.md).**  console.log('Signup successful:', response.data);

} catch (error) {
  console.error('Signup failed:', error.message);
}
```

### OTP Verification Example

```typescript
import { authAPI } from '@/lib/api/auth';

try {
  const response = await authAPI.verifyOTP({
    email: 'john.doe@example.com',
    otp: '123456'
  });
  
  console.log('Verified user:', response.data.user);
  // Tokens are automatically stored after verification
} catch (error) {
  console.error('OTP verification failed:', error.message);
}
```

### Using with React Hook

```typescript
import { useAuth } from '@/hooks/use-auth';

function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const success = await login({
      email: 'student@example.com',
      password: 'password123'
    });
    
    if (success) {
      // User is logged in and redirected
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## API Methods

### `authAPI.login(credentials)`
Login user with email and password.

**Parameters:**
- `credentials.email` (string): User email
- `credentials.password` (string): User password

**Returns:** `Promise<LoginResponse>`

---

### `authAPI.signup(userData)`
Register a new user.

**Parameters:**
- `userData.firstName` (string): User's first name
- `userData.lastName` (string): User's last name
- `userData.email` (string): User's email
- `userData.password` (string): User's password
- `userData.confirmPassword` (string): Password confirmation
- `userData.studentNumber` (string): Student ID number
- `userData.contactNumber` (string): Phone number
- `userData.dateOfBirth` (string | Date): Date of birth

**Returns:** `Promise<SignupResponse>`

---

### `authAPI.verifyOTP(otpData)`
Verify OTP for account activation.

**Parameters:**
- `otpData.email` (string): User's email
- `otpData.otp` (string): 6-digit OTP code

**Returns:** `Promise<OTPResponse>`

---

### `authAPI.resendOTP(email)`
Resend OTP to user's email.

**Parameters:**
- `email` (string): User's email

**Returns:** `Promise<ApiResponse>`

---

### `authAPI.logout()`
Logout user and clear stored tokens.

**Returns:** `Promise<void>`

---

### `authAPI.refreshToken()`
Refresh access token using refresh token.

**Returns:** `Promise<{ accessToken: string }>`

---

### `authAPI.forgotPassword(data)`
Send forgot password email.

**Parameters:**
- `data.email` (string): User's email

**Returns:** `Promise<ApiResponse>`

---

### `authAPI.resetPassword(data)`
Reset password with token.

**Parameters:**
- `data.token` (string): Reset token from email
- `data.newPassword` (string): New password
- `data.confirmPassword` (string): Password confirmation

**Returns:** `Promise<ApiResponse>`

---

### `authAPI.getCurrentUser()`
Get current authenticated user data.

**Returns:** `Promise<User>`

---

### `authAPI.isAuthenticated()`
Check if user has valid access token.

**Returns:** `boolean`

---

### `authAPI.getAccessToken()`
Get current access token.

**Returns:** `string | null`

## Token Management

Tokens are automatically managed by the API client:

- **Access Token**: Stored in `localStorage` as `accessToken`
- **Refresh Token**: Stored in `localStorage` as `refreshToken`
- Tokens are automatically included in API requests
- Tokens are automatically cleared on logout

## Error Handling

The API uses a custom `ApiError` class for error handling:

```typescript
try {
  await authAPI.login(credentials);
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.statusCode);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
  }
}
```

## Validation Schemas

All request data is validated using Zod schemas before being sent to the API:

- `loginSchema` - Login credentials validation
- `signupSchema` - Signup data validation (includes password strength rules)
- `otpSchema` - OTP validation
- `forgotPasswordSchema` - Email validation
- `resetPasswordSchema` - Password reset validation

## Environment Variables

Configure the API base URL in your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## TypeScript Types

All request and response types are fully typed:

- `LoginRequest` & `LoginResponse`
- `SignupRequest` & `SignupResponse`
- `OTPRequest` & `OTPResponse`
- `User` - User data interface
- `ApiResponse<T>` - Generic API response
- `ApiError` - Error class

## Security Considerations

- All passwords must meet strength requirements (8+ chars, uppercase, lowercase, number)
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All API calls use HTTPS in production (configure in `.env.production`)
- Token refresh mechanism prevents session expiration

## Next Steps

1. Set up your backend API endpoints to match the defined routes
2. Configure environment variables
3. Implement token refresh interceptor if needed
4. Add role-based access control (RBAC) as needed
5. Consider implementing secure token storage (httpOnly cookies)
