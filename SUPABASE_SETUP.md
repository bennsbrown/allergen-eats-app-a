
# Supabase Setup Guide for Business Authentication

## Overview

This app now supports **unique QR codes for each business** that are linked to their Google Sheet uploads. Each business has their own login and their QR code is uniquely generated and stored in the database.

## Features Implemented

- **Business Authentication**: Sign up and login system for businesses
- **Unique QR Codes**: Each business gets a unique QR code based on their user ID
- **Google Sheet Linking**: QR codes link to the Google Sheet URL uploaded by each business
- **Secure Data Storage**: Business data stored securely in Supabase with Row Level Security (RLS)

## Setup Instructions

### Step 1: Enable Supabase in Natively

1. Click the **Supabase** button in the Natively interface
2. Connect to your existing Supabase project, or create a new one at [supabase.com](https://supabase.com)
3. Once connected, Natively will automatically configure the environment variables

### Step 2: Run Database Setup SQL

In your Supabase project dashboard:

1. Go to the **SQL Editor**
2. Create a new query
3. Copy and paste the following SQL:

```sql
-- Create businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  google_sheet_url TEXT,
  qr_code_data TEXT NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);
```

4. Click **Run** to execute the SQL

### Step 3: Configure Email Authentication (Optional)

For production use, configure email settings in Supabase:

1. Go to **Authentication** > **Providers** > **Email**
2. Enable email confirmation if desired
3. Customize email templates under **Authentication** > **Email Templates**

## How It Works

### 1. Business Sign Up

When a business signs up:
- A new user account is created in Supabase Auth
- A unique business record is created in the `businesses` table
- A unique QR code URL is generated: `https://yourapp.com/menu/{user_id}`
- The QR code data is stored in the database

### 2. QR Code Generation

Each business's QR code:
- Is unique to their user ID
- Links to their specific menu data
- Can be downloaded and shared
- Remains the same even if they update their Google Sheet URL

### 3. Google Sheet Linking

When a business connects a Google Sheet:
- The URL is stored in their business record
- The QR code continues to point to their unique business ID
- Customers scanning the QR code will access data from the linked Google Sheet

### 4. Security

- **Row Level Security (RLS)**: Businesses can only access their own data
- **Authentication Required**: All business operations require login
- **Secure Storage**: Passwords are hashed, sessions are encrypted

## Database Schema

### businesses table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Account creation timestamp |
| user_id | UUID | Foreign key to auth.users |
| email | TEXT | Business email address |
| business_name | TEXT | Name of the business |
| google_sheet_url | TEXT | URL to the Google Sheet (nullable) |
| qr_code_data | TEXT | The URL encoded in the QR code |

## Usage Flow

### For Businesses:

1. **Sign Up**: Create an account with email, password, and business name
2. **Login**: Access the business dashboard
3. **View QR Code**: See your unique QR code on the dashboard
4. **Connect Google Sheet**: Enter your Google Sheet URL to link it
5. **Download/Share**: Download or share your QR code with customers

### For Customers:

1. **Scan QR Code**: Use phone camera to scan the business's QR code
2. **View Menu**: Access the menu data from the business's Google Sheet
3. **Filter by Allergens**: Use dietary filters to find suitable dishes

## API Hooks

### useAuth()

Manages authentication state and operations:

```typescript
const { user, session, loading, signUp, signIn, signOut, isConfigured } = useAuth();
```

- `user`: Current authenticated user
- `session`: Current session
- `loading`: Loading state
- `isConfigured`: Whether Supabase is configured
- `signUp(email, password, businessName)`: Create new account
- `signIn(email, password)`: Login
- `signOut()`: Logout

### useBusiness()

Manages business data:

```typescript
const { business, loading, updateGoogleSheetUrl, updateBusinessName } = useBusiness();
```

- `business`: Current business data
- `loading`: Loading state
- `updateGoogleSheetUrl(url)`: Update Google Sheet URL
- `updateBusinessName(name)`: Update business name

## Troubleshooting

### "Supabase Setup Required" Screen

If you see this screen:
1. Make sure you've clicked the Supabase button in Natively
2. Verify your Supabase project is connected
3. Check that environment variables are set

### Authentication Errors

- **"Invalid login credentials"**: Check email and password
- **"Email already registered"**: Use the login form instead
- **"User not found"**: Sign up for a new account

### Database Errors

- **"relation does not exist"**: Run the database setup SQL
- **"permission denied"**: Check RLS policies are created
- **"unique constraint violation"**: User already has a business record

## Next Steps

### For Production:

1. **Custom Domain**: Update QR code URLs to use your actual domain
2. **Email Templates**: Customize Supabase email templates with your branding
3. **Google Sheets API**: Implement automatic data import from Google Sheets
4. **QR Code Customization**: Add business logos to QR codes
5. **Analytics**: Track QR code scans and menu views

### Additional Features:

- Password reset functionality
- Business profile editing
- Multiple menu support
- Customer feedback system
- Menu item images upload

## Support

For issues or questions:
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the code in `lib/supabase.ts`, `hooks/useAuth.ts`, and `hooks/useBusiness.ts`
- Check console logs for detailed error messages
