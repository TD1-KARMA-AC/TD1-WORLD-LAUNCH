# Supabase Setup for NeuroBlock Marketplace

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `td1-neuroblock` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for setup

### 2. Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/migrations/001_neuroblock_schema.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Wait for "Success" message

### 4. Create Storage Buckets

Run this SQL in the SQL Editor:

```sql
-- Create private bucket for Sell Mode blocks
INSERT INTO storage.buckets (id, name, public)
VALUES ('neuroblocks-private', 'neuroblocks-private', false)
ON CONFLICT (id) DO NOTHING;

-- Create public bucket for Contribute Mode blocks
INSERT INTO storage.buckets (id, name, public)
VALUES ('neuroblocks-contrib', 'neuroblocks-contrib', true)
ON CONFLICT (id) DO NOTHING;
```

### 5. Set Up Storage Policies

Run this SQL to allow uploads and downloads:

```sql
-- Private bucket: Users can upload their own blocks
CREATE POLICY "Users can upload private blocks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'neuroblocks-private' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Private bucket: Users can download blocks they purchased
CREATE POLICY "Users can download purchased blocks"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'neuroblocks-private' AND
  EXISTS (
    SELECT 1 FROM purchases p
    JOIN product_versions pv ON p.product_version_id = pv.id
    WHERE p.user_id = auth.uid()
    AND pv.storage_path = name
    AND p.status = 'completed'
  )
);

-- Contrib bucket: Authenticated users can upload
CREATE POLICY "Users can upload contrib blocks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'neuroblocks-contrib');

-- Contrib bucket: Everyone can download
CREATE POLICY "Public can download contrib blocks"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'neuroblocks-contrib');
```

### 6. Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (default enabled)
3. Optionally enable:
   - **GitHub** (for developers)
   - **Google** (for easier signup)
4. Configure email templates if needed

### 7. Set Up Row Level Security (RLS)

The migration should have created RLS policies, but verify:

```sql
-- Verify RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_versions ENABLE ROW LEVEL SECURITY;
```

### 8. Environment Variables

Add to your `.env.local` or environment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Testing the Setup

### Test Database Connection

```javascript
// test-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test query
const { data, error } = await supabase.from('products').select('count')
console.log('Connection test:', error ? 'Failed' : 'Success')
```

### Test Storage

```javascript
// Test upload
const file = new File(['test'], 'test.txt', { type: 'text/plain' })
const { data, error } = await supabase
  .storage
  .from('neuroblocks-contrib')
  .upload('test/test.txt', file)

console.log('Storage test:', error ? 'Failed' : 'Success')
```

## Migration File Location

The complete schema is in:
```
supabase/migrations/001_neuroblock_schema.sql
```

## What Gets Created

### Tables
- `products` - NeuroBlock listings
- `product_versions` - Versioned NeuroBlocks
- `purchases` - Purchase records
- `download_tokens` - Time-limited download access
- `validation_queue` - Validation job queue
- `user_profiles` - Extended user information

### Storage Buckets
- `neuroblocks-private` - Encrypted Sell Mode blocks
- `neuroblocks-contrib` - Public Contribute Mode blocks

### Functions
- `check_purchase_access()` - Verify user can download
- `generate_download_token()` - Create time-limited tokens
- `cleanup_expired_tokens()` - Auto-cleanup function

## Next Steps

1. ✅ Database schema created
2. ✅ Storage buckets created
3. ✅ Policies configured
4. ⏳ Update NeuroBlock frontend to use Supabase instead of localStorage
5. ⏳ Add authentication to NeuroBlock pages
6. ⏳ Implement file upload to Supabase Storage

## Troubleshooting

### "relation does not exist"
- Make sure you ran the migration SQL
- Check that you're using the correct database

### "permission denied"
- Check RLS policies are correct
- Verify user is authenticated
- Check storage bucket policies

### "bucket not found"
- Make sure you created the buckets
- Check bucket names match exactly

## Support

If you run into issues:
1. Check Supabase logs: Dashboard → Logs
2. Check SQL errors in SQL Editor
3. Verify environment variables are set correctly

