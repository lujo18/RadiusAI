

### Production

Backend (PY)
1. Put environmental variables inside cloud handler
   1. Switch ENV to "production" inside cloud env

gcloud run deploy myservice \
  --update-env-vars GEMINI_API_KEY=prod_key_here \
  --update-env-vars ENV=production