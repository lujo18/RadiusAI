# SlideForge Frontend

Modern Next.js/React frontend for SlideForge - AI-powered carousel automation platform.

## Features

- 🎨 Beautiful landing page with hero, features, and testimonials
- 🔐 Authentication pages (login/signup) with form validation
- 💰 Pricing page with subscription tiers
- 📊 Comprehensive dashboard with:
  - Content generation controls
  - Weekly performance analytics
  - A/B testing insights
  - Content calendar
  - Style guide editor
  - Connected accounts management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Date Utils**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/page.tsx     # Login page
│   │   ├── signup/page.tsx    # Signup page
│   │   ├── pricing/page.tsx   # Pricing page
│   │   ├── dashboard/page.tsx # Main dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API client & services
│   │   └── auth.ts           # Auth utilities
│   └── types/                 # TypeScript types
│       └── index.ts          # Shared types
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Pages Overview

### Landing Page (`/`)
- Hero section with CTA
- Features grid showcasing automation capabilities
- How it works section
- Social proof testimonials
- Pricing preview
- Footer with navigation

### Authentication
- **Login** (`/login`): Email/password login with social options
- **Signup** (`/signup`): Registration with validation and trial CTA

### Pricing (`/pricing`)
- Three tier plans: Starter, Pro, Agency
- Feature comparison
- FAQ section
- Trial promotion

### Dashboard (`/dashboard`)
Main tabs:
1. **Overview**: Stats, charts, upcoming posts, generation controls
2. **Content Calendar**: Visual calendar with scheduled posts
3. **Analytics**: A/B test results, AI insights, performance metrics
4. **Style Guide**: Brand guidelines editor, connected accounts

## API Integration

The app expects a backend API with these endpoints:

```
POST /api/auth/login
POST /api/auth/signup
POST /api/content/generate
GET  /api/content/scheduled
GET  /api/analytics
GET  /api/style-guide
PUT  /api/style-guide
```

API client configured in `src/lib/api.ts` with:
- Automatic token injection
- Error handling
- Response interceptors

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SlideForge
```

## Customization

### Branding
- Update colors in `tailwind.config.ts`
- Modify logo/name in navigation components
- Adjust primary color gradient

### Features
- Add new dashboard tabs in `dashboard/page.tsx`
- Extend API services in `src/lib/api.ts`
- Add types in `src/types/index.ts`

## Notes

- TypeScript errors are expected until dependencies are installed
- The dashboard uses mock data - connect to real API for live data
- Authentication uses localStorage - implement secure token handling for production
- Charts use Recharts - highly customizable for different visualizations

## Next Steps

1. Run `npm install` to install all dependencies
2. Set up backend API (FastAPI/Node.js)
3. Connect authentication endpoints
4. Implement real-time analytics
5. Add WebSocket for live updates
6. Set up payment processing (Stripe)
7. Deploy to Vercel/Netlify

## License

MIT
