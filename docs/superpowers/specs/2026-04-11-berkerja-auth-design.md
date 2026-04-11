# Design: Supabase Email/Password Authentication

## 1. Overview

Add sign-up, sign-in, sign-out, and session management to Berkerja using Supabase Auth with email + password. This replaces the current header-based UUID input with proper user accounts.

## 2. Approach

Use Supabase's built-in email/password auth. Sessions managed via `@supabase/ssr` cookies. No additional dependencies needed — `@supabase/ssr` is already in the tech stack.

## 3. User Flows

### Sign-up
1. User visits `/register`
2. Fills email + password + confirm-password
3. Submits → `supabase.auth.signUp({ email, password })`
4. On success → redirect to `/cv`
5. On error → show inline error message

### Sign-in
1. User visits `/login`
2. Fills email + password
3. Submits → `supabase.auth.signInWithPassword({ email, password })`
4. On success → redirect to `/cv`
5. On error → show inline error message

### Sign-out
1. User clicks sign-out in header
2. `supabase.auth.signOut()` clears session cookies
3. Redirect to `/login`

### Session persistence
- `@supabase/ssr` handles cookie reading/writing on server and client
- `createClient()` in `src/lib/supabase/server.ts` reads auth cookies on every server request
- `createClient()` in `src/lib/supabase/client.ts` reads auth cookies on the client

## 4. Pages

### `/login`
- Email input, password input, submit button, link to register
- Error display for invalid credentials

### `/register`
- Email input, password input, confirm-password input, submit button, link to login
- Client-side validation: passwords match, not empty
- Error display for failed sign-up

## 5. Components

### `AuthForm` (shared structure for login + register)
- Email input, password input, submit button
- Link to the other auth page
- Error message display

### `UserBadge` (replaces current UUID header input)
- Shows user email
- Sign-out button
- Hidden when not authenticated

## 6. Route Protection

Authenticated routes: `/cv`, `/keywords`, `/jobs`

Client-side check: `supabase.auth.getUser()` on mount. If no session → redirect to `/login`.

The dashboard layout checks auth and redirects, so users can't access protected pages without a session.

## 7. Schema Changes

None required.

`profiles.id` (UUID) maps to `auth.users.id`. RLS policies already enforce `auth.uid() = user_id` for CVs, keywords, and jobs.

## 8. Environment Variables

No new env vars needed. Supabase URL and anon key already configured.

## 9. Testing

- Sign-up flow: register → redirected to CV page, session cookie set
- Sign-in flow: login → redirected to CV page, session cookie set  
- Sign-out flow: sign-out → redirected to login, session cleared
- Unauthenticated access: visiting `/cv` without session → redirect to `/login`
- Protected routes: CV list loads only current user's CVs