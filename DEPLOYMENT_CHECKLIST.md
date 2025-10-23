# 2FA Deployment Checklist

Use this checklist to ensure proper deployment of the SMS-based 2FA system.

---

## Pre-Deployment

### ✅ Twilio Setup

- [ ] Created Twilio account at https://www.twilio.com/try-twilio
- [ ] Verified email address
- [ ] Verified phone number
- [ ] Purchased phone number with SMS capabilities (~$1/month)
- [ ] Noted down Account SID (starts with 'AC')
- [ ] Noted down Auth Token (revealed from console)
- [ ] Noted down Phone Number (format: +12345678901)
- [ ] Tested sending SMS from Twilio Console

### ✅ Cloudflare Configuration

- [ ] Logged into Cloudflare Dashboard
- [ ] Located dcsswebdev Pages project
- [ ] Navigated to Settings → Environment variables

### ✅ Environment Variables

Added these variables for **both Production and Preview**:

- [ ] `TWILIO_ACCOUNT_SID` = Your Account SID
- [ ] `TWILIO_AUTH_TOKEN` = Your Auth Token
- [ ] `TWILIO_PHONE_NUMBER` = Your Twilio number (+12345678901)
- [ ] `JWT_SECRET` = Random 64-character hex string

**Generate JWT_SECRET**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ Database Migration

- [ ] Opened terminal in project root
- [ ] Ran: `npx wrangler d1 execute DB --file=./schema-2fa.sql --remote`
- [ ] Verified success message
- [ ] Verified tables created: `npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table';" --remote`

Expected tables:

- users (with new columns)
- personal_data
- verification_codes
- trusted_devices

---

## Deployment

### ✅ Code Review

- [ ] Reviewed all modified files for sensitive data
- [ ] Confirmed no credentials in code
- [ ] Checked .gitignore includes sensitive files
- [ ] Verified wrangler.jsonc has no secrets

### ✅ Git Commit

```bash
git add .
git commit -m "Add SMS-based 2FA with Twilio integration"
git push origin main
```

### ✅ Cloudflare Deployment

- [ ] Push triggered automatic deployment
- [ ] Watched deployment logs in Cloudflare dashboard
- [ ] Deployment completed successfully
- [ ] No build errors

---

## Post-Deployment Testing

### ✅ Registration Flow

- [ ] Navigated to https://yourdomain.pages.dev/personal.html
- [ ] Clicked "Create Account" tab
- [ ] Filled in:
  - [ ] Full Name: Test User
  - [ ] Email: test@example.com
  - [ ] Phone: +1234567890 (your verified number)
  - [ ] Password: TestPass123!
  - [ ] Confirm Password: TestPass123!
- [ ] Checked "Enable two-factor authentication"
- [ ] Completed Turnstile verification
- [ ] Submitted form
- [ ] Saw success message
- [ ] Account created in database

### ✅ Login Flow (2FA Enabled)

- [ ] Entered registered email and password
- [ ] Completed Turnstile
- [ ] Submitted login form
- [ ] Saw "Verification code sent to +1 (**_) _**-7890"
- [ ] Received SMS on phone
- [ ] Redirected to verify-2fa.html

### ✅ Code Verification

- [ ] Saw 6 input boxes
- [ ] 5-minute countdown timer started
- [ ] Entered 6-digit code from SMS
- [ ] Code auto-submitted
- [ ] Saw "Verification successful!"
- [ ] Redirected to personal-dashboard.html
- [ ] Dashboard loaded correctly
- [ ] JWT token stored in localStorage

### ✅ Trust Device

- [ ] Logged out
- [ ] Logged back in
- [ ] Received SMS code
- [ ] On verify-2fa.html, checked "Trust this device"
- [ ] Entered code and verified
- [ ] Logged in successfully
- [ ] (Note: Device trust bypass not yet implemented - will still see 2FA)

### ✅ Resend Code

- [ ] Logged out
- [ ] Logged in again
- [ ] On verify-2fa.html, clicked "Resend Code"
- [ ] 60-second cooldown started
- [ ] Received new SMS
- [ ] Old code no longer works
- [ ] New code works correctly

### ✅ Code Expiration

- [ ] Logged in
- [ ] On verify-2fa.html, waited 5 minutes
- [ ] Countdown reached 0:00
- [ ] Tried submitting expired code
- [ ] Saw error "Verification code has expired"
- [ ] Resent code successfully

### ✅ Failed Attempts

- [ ] Logged in
- [ ] On verify-2fa.html, entered wrong code
- [ ] Saw "Invalid verification code"
- [ ] Entered wrong code 2 more times (3 total)
- [ ] Saw error about maximum attempts
- [ ] Code invalidated
- [ ] Had to resend new code

### ✅ Rate Limiting

- [ ] Attempted to resend code multiple times quickly
- [ ] After 5 resends within 10 minutes
- [ ] Saw error "Too many requests. Please wait 10 minutes."
- [ ] Rate limit working correctly

### ✅ Login Without 2FA

- [ ] Created new account without checking "Enable 2FA"
- [ ] Logged in with that account
- [ ] No SMS sent
- [ ] Directly redirected to dashboard
- [ ] Normal login flow preserved

---

## Verification

### ✅ Database Checks

```bash
# Check users table structure
npx wrangler d1 execute DB --command="PRAGMA table_info(users);" --remote

# Check verification_codes table
npx wrangler d1 execute DB --command="SELECT * FROM verification_codes LIMIT 5;" --remote

# Check trusted_devices table
npx wrangler d1 execute DB --command="SELECT * FROM trusted_devices LIMIT 5;" --remote
```

### ✅ Cloudflare Logs

- [ ] Checked Pages Functions logs
- [ ] No error messages
- [ ] API endpoints responding correctly
- [ ] No 500 errors

### ✅ Twilio Console

- [ ] Checked Message Logs
- [ ] SMS messages sent successfully
- [ ] No delivery failures
- [ ] Cost tracking shows expected charges

---

## Security Verification

### ✅ Environment Variables

- [ ] Checked Cloudflare dashboard
- [ ] Environment variables are encrypted
- [ ] Not visible in public code
- [ ] Not in git history

### ✅ API Security

- [ ] CORS headers working
- [ ] Turnstile verification required
- [ ] JWT tokens have expiration
- [ ] Passwords are hashed (SHA-256)
- [ ] 2FA codes are hashed
- [ ] Rate limiting active

### ✅ Code Security

- [ ] No credentials in source code
- [ ] No sensitive data logged
- [ ] Error messages don't leak information
- [ ] Input validation on all endpoints

---

## Documentation

### ✅ Files Created

- [ ] verify-2fa.html (2FA verification page)
- [ ] functions/api/auth/verify-2fa.js (verification endpoint)
- [ ] functions/api/auth/send-2fa.js (SMS sending)
- [ ] functions/api/auth/resend-2fa.js (resend endpoint)
- [ ] schema-2fa.sql (database migration)
- [ ] SETUP_2FA.md (full documentation)
- [ ] ENV_SETUP.md (quick reference)
- [ ] 2FA_IMPLEMENTATION_SUMMARY.md (overview)
- [ ] DEPLOYMENT_CHECKLIST.md (this file)

### ✅ Files Modified

- [ ] personal.html (registration + login with 2FA)
- [ ] functions/api/auth/login.js (2FA trigger)
- [ ] functions/api/auth/register.js (phone storage)

---

## Monitoring

### ✅ First Week

- [ ] Monitor Twilio usage daily
- [ ] Check Cloudflare Functions analytics
- [ ] Review error logs
- [ ] Monitor SMS delivery success rate
- [ ] Check for abuse/spam

### ✅ Ongoing

- [ ] Weekly Twilio billing review
- [ ] Monthly security audit
- [ ] Update Twilio credentials quarterly
- [ ] Rotate JWT_SECRET annually

---

## Rollback Plan (If Issues Arise)

### Option 1: Disable 2FA for All Users

```bash
npx wrangler d1 execute DB --command="UPDATE users SET two_factor_enabled = 0;" --remote
```

### Option 2: Revert Code

```bash
git revert HEAD
git push origin main
```

### Option 3: Emergency Bypass

Temporarily comment out 2FA check in `login.js`:

```javascript
// if (user.two_factor_enabled === 1 && user.phone_number) {
//   ... 2FA flow
// }
```

---

## Success Criteria

✅ **All items checked above**

- SMS messages delivered within 30 seconds
- Code verification works correctly
- Rate limiting prevents abuse
- Trusted devices stored properly
- No errors in production logs
- User experience is smooth
- Documentation is complete

---

## Known Issues / Limitations

1. **Device Trust Not Implemented**

   - Trusted devices stored but not checked
   - Users always see 2FA (even trusted)
   - Requires additional logic in login.js

2. **No Settings Page**

   - Can't toggle 2FA after registration
   - Can't update phone number
   - Can't view trusted devices
   - Can't revoke device trust

3. **No Backup Codes**

   - Database column exists
   - Feature not implemented
   - Users locked out if phone lost

4. **Trial Account Limits**
   - Twilio trial has $15.50 credit
   - Only verified numbers can receive SMS
   - Upgrade required for production use

---

## Next Steps (Optional Enhancements)

Priority order:

1. **High Priority**

   - [ ] Implement device trust bypass in login.js
   - [ ] Create 2FA settings page
   - [ ] Add backup codes feature

2. **Medium Priority**

   - [ ] Add WebAuthn/Passkeys support
   - [ ] Create activity log viewer
   - [ ] Add email notifications for 2FA changes

3. **Low Priority**
   - [ ] Custom SMS templates
   - [ ] Multi-language support
   - [ ] Analytics dashboard

---

## Support Contacts

- **Twilio Support**: https://support.twilio.com/
- **Cloudflare Support**: https://support.cloudflare.com/
- **Project Docs**: See SETUP_2FA.md

---

## Completion

**Deployment Date**: ******\_\_\_******

**Deployed By**: ******\_\_\_******

**Status**:

- [ ] ✅ Successful - All tests passed
- [ ] ⚠️ Partial - Some issues (document below)
- [ ] ❌ Failed - Rolled back (document reason below)

**Notes**:

```
[Add any notes, issues encountered, or special configurations here]
```

---

**Signature**: ******\_\_\_****** **Date**: ******\_\_\_******

---

_End of Deployment Checklist_
