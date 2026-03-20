# Pre-Deployment Checklist

Use this checklist to ensure your application is ready for production deployment.

## Frontend (Netlify)

### Code Preparation
- [x] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] No `console.log()` or debug code remaining
- [ ] All environment variables defined in `frontend/.env.example`
- [ ] API endpoints use `NEXT_PUBLIC_API_URL` environment variable
- [ ] Images optimized and use Next.js Image component
- [ ] No hardcoded localhost URLs (except dev)
- [ ] Error boundaries added for major sections
- [ ] Loading states implemented for async operations

### Configuration Files
- [x] `netlify.toml` configured with build command and publish directory
- [x] `.env.example` created with all required variables
- [x] `next.config.js` optimized for production
- [x] Production domain configured in netlify.toml

### Dependencies
- [ ] `npm ci` installs deterministic dependencies
- [ ] No unused dependencies in `package.json`
- [ ] Security vulnerabilities checked: `npm audit`
- [ ] All critical dependencies up to date

### Testing
- [ ] Manual testing on localhost:3000
- [ ] Test with production API URL (if available)
- [ ] Browser console clean (no errors/warnings)
- [ ] Responsive design tested on mobile/tablet
- [ ] Authentication flow tested
- [ ] API calls tested and working

### Netlify Setup
- [ ] GitHub repository connected to Netlify
- [ ] Build command set to: `npm run build`
- [ ] Publish directory set to: `.next`
- [ ] Node.js version pinned to 20
- [ ] Environment variables added (see DEPLOYMENT.md):
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_BASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate auto-enabled

### Pre-Launch
- [ ] Test production build locally: `npm run build && npm start`
- [ ] Check Netlify deploy preview before production
- [ ] DNS records updated (if using custom domain)
- [ ] All redirects in `netlify.toml` verified

---

## Backend (Digital Ocean)

### Code Preparation
- [ ] Python dependencies in `requirements.txt` are pinned versions
- [ ] All FastAPI routes tested and documented
- [ ] Error handling implemented for all endpoints
- [ ] Logging configured for production (`LOG_LEVEL=INFO`)
- [ ] Database queries optimized
- [ ] No debug code or print statements
- [ ] CORS middleware properly configured for production domains
- [ ] Health check endpoint `/health` responds correctly

### Configuration Files
- [x] `Dockerfile` created and tested locally
- [x] `.dockerignore` excludes unnecessary files
- [x] `docker-compose.yml` for local development
- [x] `.env.example` created with all required variables
- [x] `app.yaml` configured for Digital Ocean App Platform

### Environment Variables
- [ ] All variables from `backend/.env.example` documented
- [ ] Critical variables identified and secured:
  - [ ] `GEMINI_API_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STATE_SECRET_KEY`
- [ ] No hardcoded secrets in code or config files
- [ ] Use Digital Ocean Secrets/Environment Variables feature

### Database & Services
- [ ] Supabase project created and accessible
- [ ] Database credentials validated
- [ ] RLS (Row Level Security) policies enforced
- [ ] Migrations up to date
- [ ] Database backups configured (Supabase or DO)
- [ ] Third-party API keys obtained:
  - [ ] Google Gemini API key
  - [ ] Stripe API keys
  - [ ] TikTok API credentials
  - [ ] PostForMe API key

### Docker Build & Testing
- [ ] Docker image builds locally: `docker build -t test -f backend/Dockerfile .`
- [ ] Image runs successfully: `docker run -p 8000:8000 test`
- [ ] Health check responds: `curl http://localhost:8000/health`
- [ ] Image under 500MB (or acceptable size)
- [ ] Multi-stage build working (optimized image)

### Digital Ocean Setup

#### Option A: App Platform
- [ ] GitHub repository authorized to Digital Ocean
- [ ] App created and configured
- [ ] Source directory set to `backend`
- [ ] HTTP port set to 8000
- [ ] Health check set to `/health`
- [ ] All environment variables added
- [ ] Auto-deploy on main branch enabled
- [ ] Maximum concurrency set appropriately
- [ ] Resource limits configured

#### Option B: Container Registry + Manual
- [ ] Digital Ocean Container Registry created
- [ ] Docker image pushed successfully
- [ ] Image accessible from Container Registry dashboard
- [ ] Docker credentials configured on deployment machine

### Monitoring & Logging
- [ ] Error tracking configured (Sentry, or DO logs)
- [ ] Application logs accessible
- [ ] Health check alerts enabled
- [ ] CPU/Memory monitoring enabled
- [ ] Database connection monitoring enabled

### Security Checklist
- [ ] No `DEBUG=True` or debug mode in production
- [ ] HTTPS/SSL enforced everywhere
- [ ] Environment variables use strong random secrets
- [ ] API rate limiting configured
- [ ] CORS restricted to trusted origins
- [ ] JWT tokens configured
- [ ] Database passwords strong and unique
- [ ] Third-party API keys rotated regularly
- [ ] Firewall/access control rules reviewed
- [ ] Dependencies scanned for vulnerabilities

### Performance Optimization
- [ ] Database indexes optimized
- [ ] API response times acceptable (<200ms typical)
- [ ] Caching strategy implemented
- [ ] Large responses paginated
- [ ] Background jobs configured (if applicable)

### Testing
- [ ] API endpoints tested locally with production config
- [ ] All routes respond correctly
- [ ] Error responses properly formatted
- [ ] Authentication/authorization working
- [ ] Rate limiting functional
- [ ] Webhooks tested (Stripe, etc.)
- [ ] Database RLS policies enforced

### Pre-Launch
- [ ] DNS configured to point to Digital Ocean app
- [ ] SSL certificate auto-enabled and valid
- [ ] Smoke test: `curl https://api.yourdomain.com/health`
- [ ] Test API from frontend on staging domain
- [ ] Performance acceptable under load
- [ ] All integrations connected and tested

---

## Combined Deployment

### GitHub Actions
- [x] Workflow files created (`.github/workflows/`)
- [ ] Frontend deploy workflow configured
- [ ] Backend deploy workflow configured
- [ ] Required secrets added to GitHub:
  - [ ] `NETLIFY_AUTH_TOKEN`
  - [ ] `NETLIFY_SITE_ID`
  - [ ] `DO_API_TOKEN`
  - [ ] `DO_APP_ID`

### Integration Testing
- [ ] Frontend can reach backend API
- [ ] Cross-origin requests working (CORS)
- [ ] Authentication flow end-to-end
- [ ] API responses match frontend expectations
- [ ] Error handling works both sides
- [ ] Webhooks deliver correctly

### Monitoring & Alerts
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring set up
- [ ] Alert contact info configured
- [ ] Incident response procedure documented

### Documentation
- [ ] [DEPLOYMENT.md](DEPLOYMENT.md) reviewed and complete
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] API endpoints documented
- [ ] Runbook for common issues created

---

## Launch Checklist

Final checks before going live:

- [ ] All code reviewed and tested
- [ ] Deployments tested on staging
- [ ] Team notified of go-live time
- [ ] Monitoring dashboards open
- [ ] Rollback plan documented
- [ ] Support team briefed
- [ ] Analytics tracking verified
- [ ] Legal/Privacy pages up to date
- [ ] "System Status" page ready (optional)
- [ ] First user onboarded and tested

### Post-Launch (First 24h)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user activity flowing correctly
- [ ] Email/notification systems working
- [ ] Database queries performing well
- [ ] No spike in error logs
- [ ] Custom domain SSL certificate valid
- [ ] Backups running successfully

---

## Quick Links

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Full deployment guide
- [backend/.env.example](../../backend/.env.example) - Backend environment template
- [frontend/.env.example](../../frontend/.env.example) - Frontend environment template
- [Netlify Docs](https://docs.netlify.com/)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Production Deployment](https://nextjs.org/docs/going-to-production)

---

## Support

If you encounter issues during deployment, check:

1. **Environment Variables**: Verify all variables are set correctly
2. **Logs**: Check deployment logs in Netlify/Digital Ocean dashboards
3. **Configuration Files**: Review `netlify.toml`, `app.yaml`, `next.config.js`
4. **Build Output**: Run `npm run build` and `docker build` locally to debug
5. **Documentation**: See DEPLOYMENT.md for detailed troubleshooting

**Questions?** Refer to each platform's official documentation or raise an issue.
