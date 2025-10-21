# Personal Dashboard Setup Guide

## 🔐 Secure Personal Dashboard with Cloudflare D1

This setup guide will help you configure your personal dashboard with authentication, persistent sessions, and D1 database integration.

## 📋 Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js** installed (v16 or higher)
3. **Wrangler CLI** - Cloudflare's command-line tool

## 🚀 Setup Steps

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

### Step 3: Create D1 Database

```bash
# Create the database
wrangler d1 create dcss-personal-db

# This will output a database ID - copy it!
```

### Step 4: Update wrangler.jsonc

Replace `YOUR_DATABASE_ID_HERE` in `wrangler.jsonc` with your actual database ID from Step 3.

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "dcss-personal-db",
    "database_id": "YOUR_ACTUAL_DATABASE_ID"
  }
]
```

### Step 5: Initialize Database Schema

```bash
# Run the schema to create tables
wrangler d1 execute dcss-personal-db --file=./schema.sql

# Optional: Add sample data for testing
wrangler d1 execute dcss-personal-db --file=./seed.sql
```

### Step 6: Install Dependencies

Create a `package.json` if you don't have one:

```json
{
  "name": "dcsswebdev",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "bcryptjs": "^2.4.3"
  }
}
```

Then install:

```bash
npm install
```

### Step 7: Generate JWT Secret

Generate a secure secret key for JWT tokens:

```bash
# On Windows PowerShell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
echo $secret

# On Linux/Mac
openssl rand -base64 32
```

Update `wrangler.jsonc` with your secret:

```jsonc
"vars": {
  "JWT_SECRET": "your_generated_secret_here"
}
```

### Step 8: Deploy to Cloudflare Pages

```bash
# Deploy your site
wrangler pages deploy . --project-name=dcsswebdev

# Or if using existing Pages project
wrangler pages publish .
```

## 🔑 Creating Your First User

### Option 1: Use Registration Page

1. Navigate to `https://your-domain.com/personal.html`
2. Click "Register" tab
3. Fill in your details and create an account

### Option 2: Manual Database Entry

Generate a password hash:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword', 10));"
```

Then insert into database:

```bash
wrangler d1 execute dcss-personal-db --command="INSERT INTO users (name, email, password_hash, created_at, last_login) VALUES ('Your Name', 'your@email.com', 'PASTE_HASH_HERE', datetime('now'), datetime('now'));"
```

## 📊 Database Schema

### Users Table

- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp
- `is_active` - Account status
- `role` - User role (default: 'user')

### Personal Data Table

- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Record title
- `description` - Short description
- `category` - Data category
- `content` - Main content
- `status` - active/inactive
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🛠️ Local Development

For local testing with Wrangler:

```bash
# Start local dev server with D1
wrangler pages dev . --d1=DB=dcss-personal-db

# Or use your existing server and proxy API calls
```

## 🔒 Security Considerations

1. **Change Default Secrets**: Update `JWT_SECRET` in production
2. **HTTPS Only**: Always use HTTPS in production
3. **Password Policy**: Enforce strong passwords (minimum 8 characters)
4. **Rate Limiting**: Consider adding rate limiting to prevent brute force
5. **Session Expiration**: Tokens expire after 24 hours (30 days if "Remember Me")

## 📝 Environment Variables

Set these in Cloudflare Pages dashboard under Settings > Environment Variables:

- `JWT_SECRET` - Your secure JWT secret key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS

## 🧪 Testing the Setup

1. Navigate to `/personal.html`
2. Register a new account
3. Login with your credentials
4. You should be redirected to `/personal-dashboard.html`
5. Verify data loads from D1 database

## 📱 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### Data

- `GET /api/data/personal` - Get user's personal data

## 🐛 Troubleshooting

### "Database not found" error

- Verify database ID in `wrangler.jsonc`
- Ensure database was created with correct name

### "Invalid token" errors

- Check JWT_SECRET is set correctly
- Verify token hasn't expired
- Clear localStorage and login again

### Workers not executing

- Ensure files are in `/functions` directory
- Check file naming matches API routes
- Verify Node.js compatibility is enabled

### bcrypt errors

- Ensure `node_compat: true` in wrangler.jsonc
- Install bcryptjs package
- Check Node.js version compatibility

## 🎨 Customization

### Adding More Data Fields

Edit `schema.sql` to add columns to `personal_data` table:

```sql
ALTER TABLE personal_data ADD COLUMN your_field TEXT;
```

### Styling

- Main login page styles are in `personal.html`
- Dashboard styles are in `personal-dashboard.html`
- Matches your existing site theme with gradients and animations

## 📚 Next Steps

Now that your authentication is set up, you can:

1. Add custom data tables to D1
2. Create additional dashboard views
3. Implement file upload to R2
4. Add real-time updates with Durable Objects
5. Set up email notifications with Workers

## 🆘 Support

For issues:

1. Check Cloudflare Pages logs
2. Review browser console for errors
3. Check D1 database contents with `wrangler d1 execute`
4. Verify API endpoints are accessible

---

**Important Security Note**: This setup stores user sessions client-side with JWT tokens. For enhanced security in production, consider implementing server-side session management with the `sessions` table.
