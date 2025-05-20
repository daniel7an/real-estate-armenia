# Armenian Real Estate Website

A four-page real-estate website for Armenian houses using Next.js 14 (Pages Router), Supabase, Tailwind CSS, and deployed on Vercel.

## Features

- Landing page with featured properties
- Property details page
- User registration and login
- User dashboard for property management
- Property inquiry system

## Tech Stack

- **Frontend & API**: Next.js 14 with Pages Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Local Development

### Prerequisites

- Node.js 14+ and npm
- A Supabase account (free tier)

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd real-estate-armenia
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` to view the application.

## Database Setup

1. Create a new Supabase project.
2. In the SQL Editor, run the following SQL to create tables and enable Row Level Security:

```sql
create extension if not exists "uuid-ossp";

create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text not null
);

create table properties (
  id uuid primary key default uuid_generate_v4(),
  owner uuid references users(id) on delete cascade,
  title text,
  city text,
  price numeric,
  image_url text,
  created_at timestamptz default now()
);

create table inquiries (
  id uuid primary key default uuid_generate_v4(),
  property uuid references properties(id) on delete cascade,
  sender uuid references users(id) on delete cascade,
  message text,
  created_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table users enable row level security;
create policy "Users can view themselves" on users for select using ( id = auth.uid() );

alter table properties enable row level security;
create policy "Owners manage properties" on properties
  for all using ( owner = auth.uid() );
create policy "Anyone can view properties" on properties
  for select using ( true );

alter table inquiries enable row level security;
create policy "Relevant users" on inquiries
  for all using ( sender = auth.uid() or (
    select owner from properties where id = property ) = auth.uid() );
```

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and sign up/log in.
3. Click "Import Project" and select your GitHub repository.
4. Vercel will detect that it's a Next.js project automatically.
5. Add the following environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click "Deploy" and wait for the deployment to complete.

### Custom Domain (Optional)

If you have a custom domain (e.g., from GitHub Student Pack via Namecheap):
1. In Vercel project settings, go to "Domains".
2. Add your custom domain.
3. Follow Vercel's instructions to update your DNS settings.

## Free Tier Limitations

- **Supabase**: 500 MB database, 1 GB file storage, 5 GB bandwidth. Projects become paused after one week of inactivity.
- **Vercel (Hobby plan)**: 100 GB-hours serverless function execution, Unlimited Serverless Functions, 1M Edge Function invocations, 100 GB bandwidth.

## License

This project is open-source and available under the [MIT License](LICENSE).
