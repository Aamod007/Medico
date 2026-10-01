# Vercel Deployment Fixes

## Issues Fixed

### 1. ❌ Website Redirects to "Log in to Vercel" in Private Browser
### 2. ❌ "Unexpected token 'T', 'The page c...' is not valid JSON" Error

---

## Issue 1: Vercel Login Page in Private Browser

### Cause
Your Vercel deployment has **Deployment Protection** enabled, which requires authentication to view the site.

### Solution

#### ⚠️ CRITICAL STEPS (Must Do):

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Select Project**: "Medico"
3. **Settings → Deployment Protection**
4. **Change** from "Vercel Authentication" → **"Standard Protection"**
5. **Save** and **Redeploy**

#### Code Changes (Already Applied):
- ✅ Updated `middleware.ts` to allow public access to home and product pages
- ✅ Updated `layout.tsx` with explicit Clerk configuration

**File**: `apps/web/middleware.ts`
```typescript
// Public routes - accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/products(.*)",
  "/medicines(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/api/products(.*)",
  "/api/catalog(.*)",
]);
```

---

## Issue 2: JSON Parsing Error

### Cause
The frontend tried to parse HTML as JSON when:
- API endpoint returns HTML error page
- Middleware blocks API routes with authentication page
- Missing content-type validation

### Error Message
```
Unexpected token 'T', "The page c..." is not valid JSON
```

### Solution Applied

#### ✅ 1. Enhanced API Error Handling
**File**: `apps/web/src/lib/api.ts`

Added content-type validation:
```typescript
// Check if response is actually JSON
const contentType = res.headers.get("content-type");
if (!contentType || !contentType.includes("application/json")) {
  throw new Error("Server returned non-JSON response");
}
```

**Benefits**:
- Clear error messages instead of cryptic "Unexpected token" errors
- Easier debugging in production
- Prevents parsing HTML as JSON

#### ✅ 2. Environment Variable Configuration

**For Vercel**, add to Environment Variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=
# Leave empty to use Next.js API routes (recommended)

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://vakxcpryqrsqhviivvmv.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

**Note**: See `.env.vercel` file for actual values (this file is git-ignored for security)

---

## Testing After Deployment

### ✅ Test Checklist

#### 1. **Home Page** (Should Load Without Login)
```
https://your-domain.vercel.app/
```
- [ ] Page loads without authentication
- [ ] Categories display correctly
- [ ] Products grid shows items
- [ ] No console errors

#### 2. **API Endpoints** (Should Return JSON)
Test in browser or Postman:
```
https://your-domain.vercel.app/api/catalog/categories
https://your-domain.vercel.app/api/catalog/products
https://your-domain.vercel.app/api/catalog/brands
```

**Expected Response**:
```json
{
  "success": true,
  "data": [...]
}
```

❌ **If you see**:
- HTML response → Deployment Protection still enabled
- "Log in to Vercel" → Go back to step 1
- Supabase error → Check environment variables

#### 3. **Protected Routes** (Should Redirect to Sign-In)
```
https://your-domain.vercel.app/checkout
https://your-domain.vercel.app/orders
```
- [ ] Redirects to `/sign-in`
- [ ] Does NOT show Vercel login

#### 4. **Private/Incognito Browser**
- [ ] Open site in incognito mode
- [ ] Home page loads correctly
- [ ] Can browse products
- [ ] Checkout redirects to sign-in (not Vercel login)

---

## Debugging Guide

### If JSON Error Still Occurs:

#### Check Browser Console (F12)
Look for:
```
Non-JSON response received: <html>...
Server returned non-JSON response (404)
```

This tells you the API is returning HTML instead of JSON.

#### Check Network Tab
1. Open DevTools → Network
2. Filter: "Fetch/XHR"
3. Find failed request (red)
4. Click it → Response tab
5. Check if it's HTML or JSON

#### Common Issues:

| Response | Cause | Fix |
|----------|-------|-----|
| "Log in to Vercel" HTML | Deployment Protection ON | Disable in Vercel settings |
| Clerk sign-in page HTML | Middleware blocking API | Already fixed in middleware.ts |
| 404 HTML page | API route not found | Check deployment logs |
| Supabase 401 error | Wrong credentials | Update SUPABASE_SECRET_KEY |

---

## What Changed

### Files Modified:
1. ✅ `apps/web/middleware.ts` - Public route configuration
2. ✅ `apps/web/src/lib/api.ts` - JSON validation
3. ✅ `apps/web/src/app/layout.tsx` - Clerk provider config
4. ✅ `.env.vercel` - API URL configuration (git-ignored)

### Commits:
```bash
fix: Enable public access for home and product pages in private browser
fix: Add JSON content-type validation to prevent parsing HTML as JSON
```

---

## Quick Reference: Expected Behavior

| Route | Authenticated | Unauthenticated |
|-------|---------------|-----------------|
| `/` | ✅ Works | ✅ Works |
| `/products` | ✅ Works | ✅ Works |
| `/medicines` | ✅ Works | ✅ Works |
| `/cart` | ✅ Works | ✅ Works |
| `/checkout` | ✅ Works | ❌ Redirect to sign-in |
| `/orders` | ✅ Works | ❌ Redirect to sign-in |
| `/api/catalog/*` | ✅ JSON | ✅ JSON |

---

## Still Having Issues?

### 1. Check Vercel Deployment Logs
Vercel Dashboard → Project → Latest Deployment → Runtime Logs

### 2. Verify Environment Variables
Vercel Dashboard → Settings → Environment Variables

Required variables:
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### 3. Check Build Logs
Look for:
- Missing dependencies
- Build errors
- Environment variable warnings

### 4. Redeploy from Scratch
Sometimes Vercel caches cause issues:
1. Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. "Redeploy" → Check "Use existing Build Cache" = OFF

---

## Next Steps After Fix

1. ✅ **Disable Deployment Protection** in Vercel
2. ✅ **Add Environment Variables** in Vercel
3. ✅ **Redeploy** (automatic after env vars change)
4. ✅ **Test** all URLs above
5. ✅ **Test in incognito** browser
6. ✅ **Verify** no console errors

---

**Last Updated**: October 1, 2026
**Status**: Fixes deployed to `main` branch, awaiting Vercel configuration
