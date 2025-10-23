# Two-Factor Authentication (2FA) Setup Guide

This document explains how to configure and use SMS-based two-factor authentication for the Personal Dashboard.

## Overview

The system uses Twilio for SMS delivery and supports:

- SMS verification codes (6-digit, 5-minute expiration)
- Trusted devices (30-day bypass)
- Rate limiting (max 5 SMS per 10 minutes)
- Attempt tracking (max 3 wrong code attempts)
- Optional 2FA (users can choose to enable/disable)

## Prerequisites

### 1. Twilio Account Setup

1. **Sign up for Twilio**:

   - Go to https://www.twilio.com/try-twilio
   - Create a free account (includes $15.50 trial credit)
   - Verify your email and phone number

2. **Get Your Credentials**:

   - Login to Twilio Console: https://console.twilio.com/
   - Copy your **Account SID** (starts with 'AC...')
   - Copy your **Auth Token** (click to reveal)

3. **Get a Phone Number**:
   - Go to Phone Numbers → Manage → Buy a number
   - Select a number with SMS capabilities (~$1/month)
   - Verify the number can send SMS messages
   - Copy your Twilio phone number (format: +12345678901)

### 2. Cloudflare Pages Configuration

1. **Navigate to Pages Settings**:

   - Go to your Cloudflare Dashboard
   - Select your Pages project (dcsswebdev)
   - Go to Settings → Environment variables

2. **Add Twilio Credentials**:
   Add the following environment variables:

   ```
   Variable Name: TWILIO_ACCOUNT_SID
   Value: Your Account SID (from step 1.2)
   Environment: Production and Preview

   Variable Name: TWILIO_AUTH_TOKEN
   Value: Your Auth Token (from step 1.2)
   Environment: Production and Preview

   Variable Name: TWILIO_PHONE_NUMBER
   Value: Your Twilio phone number (from step 1.3)
   Environment: Production and Preview
   ```

3. **Add JWT Secret** (if not already set):

   ```
   Variable Name: JWT_SECRET
   Value: A random secure string (e.g., generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   Environment: Production and Preview
   ```

4. **Save and Redeploy**:
   - Click "Save"
   - Trigger a new deployment (push to your repository or manual redeploy)

### 3. Database Migration

Run the 2FA schema migration:

```bash
# Apply the 2FA schema to your D1 database
npx wrangler d1 execute DB --file=./schema-2fa.sql --remote
```

This adds:

- `phone_number`, `phone_verified`, `two_factor_enabled`, `backup_codes` columns to `users` table
- `verification_codes` table for SMS codes
- `trusted_devices` table for device fingerprints

## User Flow

### Registration with 2FA

1. User visits `personal.html`
2. Clicks "Create Account" tab
3. Fills in:
   - Full Name
   - Email Address
   - Phone Number (optional, but required for 2FA)
   - Password and Confirmation
4. Checks "Enable two-factor authentication" checkbox
5. Completes Cloudflare Turnstile verification
6. Submits registration form

**Backend Process**:

- Validates phone number format (E.164: +12345678901)
- Stores user with `phone_number`, `phone_verified=1`, `two_factor_enabled=1`
- No SMS sent during registration

### Login with 2FA

1. User enters email and password on `personal.html`
2. Completes Turnstile verification
3. Submits login form

**Backend Process**:

- Verifies password with SHA-256 hash
- Checks `user.two_factor_enabled` and `user.phone_number`
- If 2FA enabled:
  - Generates random 6-digit code
  - Hashes code with SHA-256 and stores in `verification_codes` table
  - Sends SMS via Twilio API
  - Returns `requiresTwoFactor: true` response
- If 2FA disabled:
  - Generates JWT token
  - Returns normal login response

4. If 2FA required, frontend:
   - Stores temporary auth data in sessionStorage
   - Shows success message: "Verification code sent to +1 (**_) _**-5678"
   - Redirects to `verify-2fa.html`

### 2FA Code Verification

1. User sees `verify-2fa.html` with:

   - 6 input boxes (auto-focus, keyboard navigation)
   - Masked phone number display
   - 5-minute countdown timer
   - "Resend Code" button (60-second cooldown)
   - "Trust this device" checkbox

2. User enters 6-digit code (or pastes)
3. Code auto-submits when 6th digit entered

**Backend Process** (`/api/auth/verify-2fa`):

- Retrieves code from `verification_codes` table
- Hashes submitted code and compares with stored hash
- Checks expiration (5 minutes)
- Checks attempts (max 3)
- If valid:
  - Generates JWT token (30 days if "Remember Me", else 1 day)
  - If "Trust this device" checked:
    - Generates device fingerprint (user agent + screen resolution)
    - Stores in `trusted_devices` table (30-day trust)
  - Deletes verification code
  - Returns token

4. Frontend:
   - Stores JWT in localStorage
   - Redirects to `personal-dashboard.html`

### Resend Code

1. User clicks "Resend Code" button
2. 60-second cooldown starts

**Backend Process** (`/api/auth/resend-2fa`):

- Rate limiting: max 5 SMS per 10 minutes
- Invalidates old codes
- Generates new 6-digit code
- Sends new SMS
- Resets 5-minute timer

## Security Features

### Rate Limiting

- **Initial Send**: Max 3 SMS per 10 minutes (in `login.js`)
- **Resend**: Max 5 SMS per 10 minutes (in `resend-2fa.js`)
- **Verification Attempts**: Max 3 wrong codes before invalidation

### Code Security

- 6-digit random code (100,000 - 999,999)
- SHA-256 hashed before storage
- 5-minute expiration
- Single-use (deleted after verification)
- Automatic invalidation of old codes

### Device Trust

- Optional 30-day bypass for trusted devices
- Fingerprint based on user agent + screen resolution
- Stored in `trusted_devices` table
- Can be revoked from settings page (future feature)

### Password Security

- SHA-256 hashing (Web Crypto API)
- Minimum 8 characters
- Strength indicator during registration
- Never stored in plain text

## API Endpoints

### POST `/api/auth/login`

**Request**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response (2FA enabled)**:

```json
{
  "requiresTwoFactor": true,
  "userId": 1,
  "phoneNumber": "+12345678901",
  "maskedPhone": "+1 (***) ***-8901",
  "rememberMe": true,
  "expiresAt": "2024-01-01T12:05:00.000Z"
}
```

**Response (2FA disabled)**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}
```

### POST `/api/auth/register`

**Request**:

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "phoneNumber": "+12345678901",
  "twoFactorEnabled": true
}
```

**Response**:

```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### POST `/api/auth/verify-2fa`

**Request**:

```json
{
  "userId": 1,
  "code": "123456",
  "rememberMe": true,
  "trustDevice": true
}
```

**Response**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### POST `/api/auth/resend-2fa`

**Request**:

```json
{
  "userId": 1,
  "phoneNumber": "+12345678901"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Verification code resent successfully",
  "expiresAt": "2024-01-01T12:05:00.000Z"
}
```

## Testing

### Local Testing (Development)

1. Use Twilio test credentials (sandbox mode):

   - Test Account SID: Use your trial account
   - Verify recipient phone numbers in Twilio Console

2. Test flow:

   ```bash
   # Start local development server
   npm run dev

   # Navigate to http://localhost:8788/personal.html
   ```

3. Test scenarios:
   - Register with 2FA enabled
   - Login and receive SMS
   - Enter correct code
   - Enter wrong code (3 attempts)
   - Wait for code expiration (5 minutes)
   - Resend code
   - Trust device and re-login

### Production Testing

1. Deploy to Cloudflare Pages:

   ```bash
   git add .
   git commit -m "Add 2FA functionality"
   git push origin main
   ```

2. Verify environment variables are set

3. Test with real phone number

## Troubleshooting

### SMS Not Received

**Check**:

1. Twilio account has sufficient credit
2. Recipient phone number is verified (trial accounts)
3. Environment variables are set correctly
4. Check Twilio Console → Logs for delivery status

**Common Issues**:

- Phone number not in E.164 format
- Twilio trial account requires verified numbers
- Rate limiting exceeded

### Code Verification Fails

**Check**:

1. Code hasn't expired (5-minute window)
2. Haven't exceeded 3 attempts
3. Using most recent code (old codes are invalidated)
4. Code is exactly 6 digits

**Debug**:

- Check browser console for errors
- Check Cloudflare Pages logs
- Verify D1 database has `verification_codes` table

### Database Errors

**Check**:

1. Schema migration was applied: `npx wrangler d1 execute DB --file=./schema-2fa.sql --remote`
2. Table structure is correct: `npx wrangler d1 execute DB --command="PRAGMA table_info(users);" --remote`
3. D1 binding is configured in wrangler.jsonc

### Environment Variables Not Loading

**Check**:

1. Variables are set in Cloudflare Pages dashboard (not wrangler.jsonc)
2. Both Production and Preview environments have variables
3. Recent deployment after adding variables
4. No typos in variable names

## Future Enhancements

### Planned Features (Not Yet Implemented)

1. **2FA Settings Page** (`personal-2fa-settings.html`):

   - Toggle 2FA on/off
   - Update phone number
   - View trusted devices
   - Revoke device trust
   - Generate backup codes

2. **Backup Codes**:

   - 10 single-use codes for emergency access
   - Generate during 2FA setup
   - Store hashed in `users.backup_codes` column
   - Use when SMS unavailable

3. **WebAuthn/Passkeys** (mentioned by user):

   - Biometric authentication
   - Hardware security keys
   - More secure than SMS
   - Better UX (no code entry)

4. **Activity Log Page**:
   - View login history
   - See 2FA code requests
   - Monitor trusted devices

## Cost Estimation

### Twilio Costs (US)

- Phone number rental: ~$1.00/month
- SMS sending: ~$0.0079 per message
- Example: 100 logins/month = $0.79/month + $1.00 = **~$1.79/month**

### Cloudflare Costs

- D1 Database: Free tier (5GB storage, 5M reads/day)
- Pages Functions: Free tier (100K requests/day)
- **Total: $0/month** (within free tier)

### Total Monthly Cost: ~$1.79

## Support

For issues or questions:

1. Check this documentation
2. Review Cloudflare Pages logs
3. Check Twilio Console logs
4. Inspect browser console for frontend errors

## Security Best Practices

1. **Never commit credentials** to version control
2. Use environment variables for all secrets
3. Rotate JWT_SECRET periodically
4. Monitor Twilio usage for suspicious activity
5. Implement account lockout after multiple failed attempts
6. Use HTTPS for all production traffic
7. Regularly review trusted devices
8. Keep backup codes in secure location
9. Enable Twilio anomaly detection
10. Set up Cloudflare rate limiting rules

## Database Schema

### Users Table (Modified)

```sql
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN backup_codes TEXT;
```

### Verification Codes Table

```sql
CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  verified INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Trusted Devices Table

```sql
CREATE TABLE IF NOT EXISTS trusted_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_fingerprint TEXT NOT NULL,
  trusted_at TEXT DEFAULT (datetime('now')),
  trusted_until TEXT NOT NULL,
  last_used TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## License

This 2FA implementation is part of the DCSS Web Dev project.
