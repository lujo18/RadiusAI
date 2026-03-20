# Deployment Guide for Radius

This guide covers deploying the Radius application to Netlify (frontend) and Digital Ocean (backend).

## Table of Contents
1. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
2. [Backend Deployment (Digital Ocean)](#backend-deployment-digital-ocean)
3. [Environment Variables](#environment-variables)
4. [Post-Deployment Checks](#post-deployment-checks)

---

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account
- GitHub repository connected to Netlify

### Step 1: Link Repository to Netlify
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Select your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 20 (set in netlify.toml)

### Step 2: Set Environment Variables in Netlify
In Netlify Settings → Environment:

```
NEXT_PUBLIC_API_URL=https://api.useradius.app
NEXT_PUBLIC_BASE_URL=https://useradius.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-public-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_NAME=Radius
```

### Step 3: Deploy
Push to main branch - Netlify automatically builds and deploys

### Configuration Files Used
- `netlify.toml` - Netlify build config
- `.env.example` - Reference for environment variables
- `next.config.js` - Next.js production configuration

---

## Backend Deployment (Digital Ocean)

### Option A: Using Digital Ocean App Platform (Recommended)

#### Prerequisites
- Digital Ocean account
- GitHub repository connected to Digital Ocean

#### Step 1: Create New App
1. Go to Digital Ocean → Apps
2. Click "Create App"
3. Select GitHub as source
4. Choose your repository
5. Set source directory to `backend`

#### Step 2: Configure App Settings
- **Type:** Web Service
- **Port:** 8000
- **HTTP Path:** `/health` (for health checks)

#### Step 3: Set Environment Variables
In App Platform settings, add all variables from `backend/.env.example`:

```
ENV=production
GEMINI_API_KEY=your-key
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
SUPABASE_JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
POST_FOR_ME_API_KEY=your-key
LATE_API_KEY=your-key
GROQ_API_KEY=your-key
TIKTOK_CLIENT_KEY=your-key
TIKTOK_CLIENT_SECRET=your-secret
STATE_SECRET_KEY=your-random-secret
FRONTEND_URL=https://useradius.app
BACKEND_URL=https://api.useradius.app
```

#### Step 4: Deploy
Configure build command in app.yaml:
```
build_command: pip install -r requirements.txt
run_command: uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

#### Step 5: Set Custom Domain
In App Platform → Settings:
- Add domain: `api.useradius.app`

---

### Option B: Using Docker (Manual Deployment)

#### Prerequisites
- Digital Ocean account with Container Registry
- Docker installed locally
- `doctl` CLI configured

#### Step 1: Build Docker Image
```bash
cd backend
docker build -t registry.digitalocean.com/your-registry/radius-api:latest .
```

#### Step 2: Push to Digital Ocean Registry
```bash
doctl registry login
docker push registry.digitalocean.com/your-registry/radius-api:latest
```

#### Step 3: Create App Platform Service
1. Digital Ocean → Apps → Create App
2. Select "Container" as source
3. Use your registry image
4. Configure as above

#### Step 4: Verify Deployment
```bash
curl https://api.useradius.app/health
# Should return: {"status": "healthy", "database": "supabase"}
```

---

### Option C: Using App Platform with GitHub Actions

See `.github/workflows/deploy-backend.yml` for automated deployment on push to main.

---

## Environment Variables

### Frontend (.env.local / Netlify)
| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `https://api.useradius.app` |
| `NEXT_PUBLIC_BASE_URL` | Frontend base URL | `https://useradius.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | From Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase public key | From Supabase dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | From Stripe dashboard |

### Backend (.env / Digital Ocean)
See `backend/.env.example` for complete list. Critical variables:
- `GEMINI_API_KEY` - Google AI API key
- `SUPABASE_*` - Database connection
- `STRIPE_*` - Payment processing
- `FRONTEND_URL` - For CORS
- `BACKEND_URL` - For OAuth callbacks

---

## Post-Deployment Checks

### 1. Health Checks
```bash
# Frontend
curl https://useradius.app/

# Backend
curl https://api.useradius.app/health
```

### 2. Database Connection
```bash
# Backend will log connection status on startup
# Check Digital Ocean logs: Apps → Your App → Logs
```

### 3. API Integration
- Test user signup/login flow
- Test template generation with Gemini
- Test Stripe webhook (if applicable)
- Check CORS headers

### 4. Monitor Logs
- **Frontend:** Netlify → Deploys → Build logs
- **Backend:** Digital Ocean → Apps → Your App → Logs

---

## Troubleshooting

### Frontend Build Fails
- Check Node version matches netlify.toml (20)
- Verify all environment variables in Netlify
- Check build logs in Netlify dashboard
- Run `npm run build` locally to debug

### Backend Won't Start
- Check **all required** environment variables are set
- Verify Supabase connection: `curl $SUPABASE_URL/rest/v1/`
- Check Digital Ocean logs for error messages
- Verify Docker image builds locally: `docker build -t test .`

### CORS Errors
- Verify `FRONTEND_URL` matches actual frontend domain
- Check backend CORS middleware in `main.py`
- Might need to clear browser cache

### API Calls Timeout
- Check backend `/health` endpoint responds
- Verify network connectivity between Digital Ocean and Supabase
- Check API rate limits/quotas

---

## Updating Deployments

### Frontend (Netlify)
Simply push to main branch - automatic rebuild/deploy

### Backend (Digital Ocean App Platform)
1. Push to main branch OR
2. Manual trigger: Apps → Your App → Trigger Deploy

### Backend (Docker)
```bash
# Local rebuild
docker build -t registry.digitalocean.com/your-registry/radius-api:v2.0 .
docker push registry.digitalocean.com/your-registry/radius-api:v2.0

# Update App Platform with new image tag
```

---

## Security Checklist

- [ ] All environment variables use production-grade secrets
- [ ] Supabase RLS policies are enforced
- [ ] Stripe webhook secret configured
- [ ] CORS only allows trusted domains
- [ ] No hardcoded secrets in code
- [ ] SSL certificates enabled (automatic on both platforms)
- [ ] Database backups configured (Supabase automates)
- [ ] Monitor failed health checks
- [ ] Set up error tracking (consider Sentry)
- [ ] Regular security updates for dependencies

---

## Support & Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/learn/basics/deploying-nextjs-app)
