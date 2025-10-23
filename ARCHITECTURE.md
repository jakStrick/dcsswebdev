# 2FA System Architecture Diagram

## System Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User visits  │
│personal.html │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ Clicks "Create Account"  │
│ Fills in:                │
│  • Name                  │
│  • Email                 │
│  • Phone (+1234567890)   │
│  • Password              │
│  ☑ Enable 2FA            │
│  ✓ Turnstile             │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ POST /api/auth/register          │
│ {                                │
│   name, email, password,         │
│   phoneNumber,                   │
│   twoFactorEnabled: true         │
│ }                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Validate & Hash Password         │
│ SHA-256(password)                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ INSERT INTO users                │
│ • phone_number                   │
│ • phone_verified = 1             │
│ • two_factor_enabled = 1         │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Return Success                   │
│ "Registration successful!"       │
└──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                           USER LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User visits  │
│personal.html │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ Enters Credentials       │
│  • Email                 │
│  • Password              │
│  ☑ Remember Me           │
│  ✓ Turnstile             │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ POST /api/auth/login             │
│ {                                │
│   email, password, rememberMe    │
│ }                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ SELECT * FROM users              │
│ WHERE email = ?                  │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Verify Password                  │
│ SHA-256(input) == stored_hash?   │
└──────────┬───────────────────────┘
           │
           ├─── Password Invalid ──► ❌ Return 401 Error
           │
           ├─── Password Valid ──────┐
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Check 2FA Status                 ││
│ two_factor_enabled == 1?         ││
└──────────┬───────────────────────┘│
           │                         │
           ├─── NO 2FA ──────────────┘
           │                         │
           │                         ▼
           │              ┌──────────────────────────┐
           │              │ Generate JWT Token       │
           │              │ Return to User           │
           │              │ → Redirect to Dashboard  │
           │              └──────────────────────────┘
           │
           ├─── YES 2FA ─────────┐
           │                     │
           ▼                     │
┌──────────────────────────────────┐│
│ Generate 6-Digit Code            ││
│ code = random(100000-999999)     ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Hash Code                        ││
│ code_hash = SHA-256(code)        ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ INSERT INTO verification_codes   ││
│ • user_id                        ││
│ • code_hash                      ││
│ • phone_number                   ││
│ • expires_at (now + 5 min)       ││
│ • attempts = 0                   ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Send SMS via Twilio              ││
│ POST https://api.twilio.com/...  ││
│ Body: "Your code is: 123456"     ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Return 2FA Required Response     ││
│ {                                ││
│   requiresTwoFactor: true,       ││
│   userId: 1,                     ││
│   maskedPhone: "+1 (***) ***-1234"│
│   expiresAt: "..."               ││
│ }                                ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Frontend:                        ││
│ • Store tempAuthData in          ││
│   sessionStorage                 ││
│ • Show "Code sent to..."         ││
│ • Redirect to verify-2fa.html    ││
└──────────────────────────────────┘│
                                     │
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                          2FA VERIFICATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────┐
│ verify-2fa.html                      │
│ ┌──────────────────────────────────┐ │
│ │  Enter Verification Code         │ │
│ │  [_] [_] [_] [_] [_] [_]         │ │
│ │                                  │ │
│ │  Sent to: +1 (***) ***-1234      │ │
│ │  Expires in: 4:32                │ │
│ │                                  │ │
│ │  ☐ Trust this device for 30 days│ │
│ │                                  │ │
│ │  [Resend Code (60s)]             │ │
│ └──────────────────────────────────┘ │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ User Enters/Pastes Code          │
│ Auto-submit on 6th digit         │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ POST /api/auth/verify-2fa        │
│ {                                │
│   userId, code,                  │
│   trustDevice, rememberMe        │
│ }                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ SELECT FROM verification_codes   │
│ WHERE user_id = ? AND            │
│       verified = 0               │
└──────────┬───────────────────────┘
           │
           ├─── Not Found ──► ❌ "Invalid code"
           │
           ├─── Found ──────────┐
           │                    │
           ▼                    │
┌──────────────────────────────────┐│
│ Check Expiration                 ││
│ expires_at > now?                ││
└──────────┬───────────────────────┘│
           │                         │
           ├─── Expired ──► ❌ "Code expired"
           │                         │
           ├─── Valid ──────────────┘
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Check Attempts                   ││
│ attempts < 3?                    ││
└──────────┬───────────────────────┘│
           │                         │
           ├─── >= 3 ──► ❌ "Too many attempts"
           │                         │
           ├─── < 3 ────────────────┘
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Hash Submitted Code              ││
│ SHA-256(input_code)              ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Compare Hashes                   ││
│ input_hash == stored_hash?       ││
└──────────┬───────────────────────┘│
           │                         │
           ├─── Mismatch ────────────┘
           │                         │
           │                         ▼
           │              ┌──────────────────────────┐
           │              │ Increment attempts       │
           │              │ Return Error             │
           │              │ User can retry (2 left)  │
           │              └──────────────────────────┘
           │
           ├─── Match ──────────────┐
           │                        │
           ▼                        │
┌──────────────────────────────────┐│
│ ✅ Code Valid!                   ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Trust Device Checked?            ││
└──────────┬───────────────────────┘│
           │                         │
           ├─── YES ────────────────┘
           │                         │
           │                         ▼
           │              ┌──────────────────────────┐
           │              │ Generate Fingerprint     │
           │              │ userAgent + screenRes    │
           │              │                          │
           │              │ INSERT trusted_devices   │
           │              │ trusted_until = +30 days │
           │              └──────────────────────────┘
           │
           ├─── NO ─────────────────┐
           │                        │
           ▼                        │
┌──────────────────────────────────┐│
│ Generate JWT Token               ││
│ • userId, email, name            ││
│ • exp: 30d or 1d (rememberMe)    ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Delete Verification Code         ││
│ UPDATE verified = 1              ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Return Success Response          ││
│ {                                ││
│   success: true,                 ││
│   token: "eyJhbGc...",           ││
│   user: { ... }                  ││
│ }                                ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Frontend:                        ││
│ • Store token in localStorage    ││
│ • Redirect to dashboard          ││
└──────────────────────────────────┘│


┌─────────────────────────────────────────────────────────────────────────┐
│                           RESEND CODE FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│ User Clicks "Resend Code"        │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ 60-Second Cooldown Starts        │
│ Button disabled                  │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ POST /api/auth/resend-2fa        │
│ { userId, phoneNumber }          │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Check Rate Limit                 │
│ COUNT codes WHERE                │
│   created_at > (now - 10 min)    │
└──────────┬───────────────────────┘
           │
           ├─── >= 5 ──► ❌ "Too many requests"
           │
           ├─── < 5 ────────────────┐
           │                        │
           ▼                        │
┌──────────────────────────────────┐│
│ Invalidate Old Codes             ││
│ UPDATE verified = -1             ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Generate New Code                ││
│ Insert to DB                     ││
│ Send via Twilio                  ││
└──────────┬───────────────────────┘│
           │                         │
           ▼                         │
┌──────────────────────────────────┐│
│ Return Success                   ││
│ New 5-minute timer starts        ││
└──────────────────────────────────┘│
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS TABLE                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────┬─────────────────────────────────┐
│ Column               │ Type         │ Description                     │
├──────────────────────┼──────────────┼─────────────────────────────────┤
│ id                   │ INTEGER PK   │ Auto-increment                  │
│ name                 │ TEXT         │ Full name                       │
│ email                │ TEXT UNIQUE  │ Login email                     │
│ password_hash        │ TEXT         │ SHA-256 hashed password         │
│ phone_number         │ TEXT         │ E.164 format (+12345678901)     │
│ phone_verified       │ INTEGER      │ 0 or 1                          │
│ two_factor_enabled   │ INTEGER      │ 0 or 1                          │
│ backup_codes         │ TEXT         │ JSON array (future use)         │
│ created_at           │ TEXT         │ ISO timestamp                   │
│ last_login           │ TEXT         │ ISO timestamp                   │
└──────────────────────┴──────────────┴─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        VERIFICATION_CODES TABLE                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────┬─────────────────────────────────┐
│ Column               │ Type         │ Description                     │
├──────────────────────┼──────────────┼─────────────────────────────────┤
│ id                   │ INTEGER PK   │ Auto-increment                  │
│ user_id              │ INTEGER FK   │ References users(id)            │
│ code_hash            │ TEXT         │ SHA-256 hashed code             │
│ phone_number         │ TEXT         │ Recipient phone                 │
│ expires_at           │ TEXT         │ ISO timestamp (now + 5 min)     │
│ created_at           │ TEXT         │ ISO timestamp                   │
│ verified             │ INTEGER      │ -1=invalid, 0=pending, 1=used   │
│ attempts             │ INTEGER      │ Failed verification count       │
└──────────────────────┴──────────────┴─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         TRUSTED_DEVICES TABLE                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────┬─────────────────────────────────┐
│ Column               │ Type         │ Description                     │
├──────────────────────┼──────────────┼─────────────────────────────────┤
│ id                   │ INTEGER PK   │ Auto-increment                  │
│ user_id              │ INTEGER FK   │ References users(id)            │
│ device_fingerprint   │ TEXT         │ UserAgent + Screen Resolution   │
│ trusted_at           │ TEXT         │ ISO timestamp                   │
│ trusted_until        │ TEXT         │ ISO timestamp (+30 days)        │
│ last_used            │ TEXT         │ ISO timestamp                   │
└──────────────────────┴──────────────┴─────────────────────────────────┘
```

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            API STRUCTURE                                 │
└─────────────────────────────────────────────────────────────────────────┘

/api/auth/
    ├── login.js              POST   Password auth + 2FA trigger
    ├── register.js           POST   User creation with 2FA setup
    ├── verify.js             POST   JWT token verification
    ├── verify-2fa.js         POST   SMS code verification
    ├── send-2fa.js           POST   Send SMS code
    └── resend-2fa.js         POST   Resend SMS code

/api/data/
    └── personal.js           GET    Fetch user data (protected)
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SECURITY STACK                                  │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1: Bot Protection
    └── Cloudflare Turnstile (on all forms)

Layer 2: Password Security
    └── SHA-256 hashing via Web Crypto API

Layer 3: Two-Factor Authentication
    ├── SMS codes (6 digits, 5-min expiry)
    ├── SHA-256 code hashing
    ├── Attempt tracking (max 3)
    └── Rate limiting (5 SMS / 10 min)

Layer 4: Session Management
    ├── JWT tokens (HS256)
    ├── Configurable expiry (1d or 30d)
    └── localStorage storage

Layer 5: Device Trust
    ├── Fingerprinting (UA + Screen)
    ├── 30-day trust period
    └── Revocable (future feature)

Layer 6: Rate Limiting
    ├── SMS sending (3-5 per 10 min)
    ├── Verification attempts (3 per code)
    └── Cloudflare edge protection

Layer 7: Audit Trail
    └── Activity logging (future enhancement)
```

## Cost Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MONTHLY COSTS                                  │
└─────────────────────────────────────────────────────────────────────────┘

Twilio Phone Number
    ├── Cost: $1.00/month
    └── SMS Capability Required

Twilio SMS (US)
    ├── Cost: $0.0079 per message
    ├── 100 logins = $0.79
    ├── 500 logins = $3.95
    └── 1000 logins = $7.90

Cloudflare D1 (Free Tier)
    ├── 5 GB storage
    ├── 5 Million reads/day
    └── Cost: $0.00

Cloudflare Pages (Free Tier)
    ├── 100,000 requests/day
    ├── 500 builds/month
    └── Cost: $0.00

═══════════════════════════════════════════════════════════════════════════
TOTAL (100 logins/month): ~$1.79/month
═══════════════════════════════════════════════════════════════════════════
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TECH STACK                                      │
└─────────────────────────────────────────────────────────────────────────┘

Frontend
    ├── HTML5
    ├── CSS3 (Custom styling, WordPress-inspired)
    ├── Vanilla JavaScript (ES6+)
    └── Cloudflare Turnstile Widget

Backend
    ├── Cloudflare Pages Functions (Serverless)
    ├── JavaScript/Node.js Runtime
    └── Web Crypto API (SHA-256)

Database
    ├── Cloudflare D1 (SQLite)
    └── SQL Schema

External Services
    ├── Twilio SMS API
    └── Cloudflare Edge Network

Security
    ├── SHA-256 Password Hashing
    ├── JWT Tokens (HS256)
    ├── Turnstile Bot Protection
    └── CORS Headers

Storage
    ├── localStorage (JWT tokens)
    └── sessionStorage (Temp auth data)
```

---

_Architecture Diagram - Last Updated: January 2024_
