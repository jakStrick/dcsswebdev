# Quick Setup - Environment Variables

## Required Environment Variables for Cloudflare Pages

Add these to your Cloudflare Pages project settings:

### Twilio Configuration (for SMS 2FA)

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12345678901
```

**Where to get these**:

1. Sign up at https://www.twilio.com/try-twilio
2. Go to Console: https://console.twilio.com/
3. Account SID and Auth Token are on the dashboard
4. Get a phone number: Phone Numbers → Buy a Number (~$1/month)

### JWT Secret

```
JWT_SECRET=your-random-secret-key-here
```

**Generate a secure secret**:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any random string generator
# Example: https://www.random.org/strings/
```

---

## How to Add Environment Variables

### Via Cloudflare Dashboard

1. Login to Cloudflare Dashboard
2. Go to **Workers & Pages**
3. Select your **dcsswebdev** project
4. Go to **Settings** → **Environment variables**
5. Click **Add variable**
6. Enter variable name and value
7. Select **Production** and **Preview** environments
8. Click **Save**
9. Repeat for all variables
10. **Redeploy** your project

### Important Notes

- ⚠️ **DO NOT** add these to `wrangler.jsonc` (they won't work and will be exposed in git)
- ✅ **DO** add them in Cloudflare Pages dashboard
- 🔒 Environment variables are encrypted and secure
- 🔄 You must redeploy after adding variables
- 🌍 Set variables for both Production and Preview environments

---

## Database Migration

After setting environment variables, apply the 2FA schema:

```bash
# Apply schema to remote D1 database
npx wrangler d1 execute DB --file=./schema-2fa.sql --remote

# Verify tables were created
npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

Expected output should include:

- `users`
- `personal_data`
- `verification_codes`
- `trusted_devices`

---

## Testing Your Setup

### 1. Test Twilio Connection

```bash
# Using curl (replace with your credentials)
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  --data-urlencode "Body=Test message" \
  --data-urlencode "From=+12345678901" \
  --data-urlencode "To=+19876543210" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

### 2. Test Registration

1. Go to `https://yourdomain.pages.dev/personal.html`
2. Click "Create Account"
3. Fill in all fields including phone number
4. Check "Enable two-factor authentication"
5. Submit form
6. Should see success message

### 3. Test Login with 2FA

1. Enter registered email and password
2. Submit login form
3. Should see "Verification code sent to +1 (**_) _**-1234"
4. Check your phone for SMS
5. Enter 6-digit code on verification page
6. Should redirect to dashboard

---

## Troubleshooting Checklist

- [ ] Environment variables are set in Cloudflare Pages dashboard
- [ ] Variables are set for BOTH Production and Preview
- [ ] Project was redeployed after adding variables
- [ ] D1 database migration was applied (`schema-2fa.sql`)
- [ ] Twilio account has sufficient credit
- [ ] Phone numbers are in E.164 format (+12345678901)
- [ ] For trial accounts: recipient phone is verified in Twilio Console

---

## What Each Variable Does

| Variable              | Purpose                        | Example                    |
| --------------------- | ------------------------------ | -------------------------- |
| `TWILIO_ACCOUNT_SID`  | Identifies your Twilio account | `AC1234567890abcdef...`    |
| `TWILIO_AUTH_TOKEN`   | Authenticates API requests     | `abcdef1234567890...`      |
| `TWILIO_PHONE_NUMBER` | Sender phone number for SMS    | `+12025551234`             |
| `JWT_SECRET`          | Signs JWT tokens for sessions  | `a1b2c3d4e5f6...` (random) |

---

## Security Reminders

🔒 **NEVER**:

- Commit secrets to Git
- Share Auth Token publicly
- Use same JWT_SECRET in multiple projects
- Hardcode credentials in code

✅ **ALWAYS**:

- Use environment variables
- Rotate JWT_SECRET periodically
- Monitor Twilio usage
- Use HTTPS in production
- Keep auth tokens secure

---

## Quick Reference - File Locations

```
dcsswebdev/
├── personal.html                        # Login/Registration page
├── verify-2fa.html                      # 2FA code entry page
├── personal-dashboard.html              # Protected dashboard
├── schema-2fa.sql                       # Database migration
├── SETUP_2FA.md                         # Full documentation
├── ENV_SETUP.md                         # This file
└── functions/
    └── api/
        └── auth/
            ├── login.js                 # Login + 2FA trigger
            ├── register.js              # User registration
            ├── verify-2fa.js            # Code verification
            ├── resend-2fa.js            # Resend SMS code
            └── send-2fa.js              # Send initial SMS
```

---

## Next Steps

After completing setup:

1. ✅ Set all environment variables
2. ✅ Run database migration
3. ✅ Deploy to Cloudflare Pages
4. ✅ Test registration with phone number
5. ✅ Test login with 2FA
6. ✅ Test code verification
7. ✅ Test resend functionality

Optional enhancements (not yet implemented):

- Create 2FA settings page
- Add backup codes
- Implement WebAuthn/Passkeys
- Add device management UI

---

## Support Resources

- **Full Documentation**: See `SETUP_2FA.md`
- **Twilio Docs**: https://www.twilio.com/docs/sms
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **D1 Database Docs**: https://developers.cloudflare.com/d1/

For billing questions:

- Twilio Pricing: https://www.twilio.com/sms/pricing
- Cloudflare Pages Pricing: https://developers.cloudflare.com/pages/platform/pricing/
