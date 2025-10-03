# Render Deployment Guide

## Prerequisites

1. A Render account (https://render.com)
2. This repository pushed to GitHub, GitLab, or Bitbucket
3. A PostgreSQL database (Render provides free PostgreSQL databases)

## Deployment Steps

### 1. Create a PostgreSQL Database on Render

1. Go to your Render dashboard
2. Click "New +" and select "PostgreSQL"
3. Fill in the database details:
   - **Name**: molla-invoice-db (or your preferred name)
   - **Database**: molla_invoice
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click "Create Database"
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### 2. Deploy the Web Service

#### Option A: Using render.yaml (Recommended)

1. Push the `render.yaml` file to your repository
2. Go to Render dashboard
3. Click "New +" and select "Blueprint"
4. Connect your repository
5. Render will automatically detect the `render.yaml` and configure your service
6. Set the required environment variables (see below)

#### Option B: Manual Setup

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your repository
4. Configure the service:
   - **Name**: molla-invoice-generator
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free (or paid for production)

### 3. Configure Environment Variables

In your Render service settings, add the following environment variables:

#### Required Variables:

- **DATABASE_URL**: 
  - Value: Your PostgreSQL Internal Database URL from step 1
  - Example: `postgresql://user:password@host:5432/database`

- **SESSION_SECRET**: 
  - Value: A random, secure string (at least 32 characters)
  - Example: You can generate one using: `openssl rand -base64 32`

#### Authentication Variables (IMPORTANT):

This application uses Replit Auth for authentication. To deploy on Render, you have two options:

**Option 1: Continue Using Replit Auth**
- **REPLIT_DOMAINS**: Your Render service URL (e.g., `your-app.onrender.com`)
- **REPL_ID**: Your Replit application ID
- **ISSUER_URL**: `https://replit.com/oidc`

Note: You'll need to configure your Replit OAuth application to allow callbacks from your Render domain. This may require contacting Replit support or configuring OAuth settings in your Replit account.

**Option 2: Replace with Different Auth Provider** (Recommended for Production)
- Consider implementing Google OAuth, GitHub OAuth, or another authentication provider
- This requires modifying `server/replitAuth.ts` to use a different OAuth strategy

### 4. Push Database Schema

After your service is deployed:

1. Go to the Shell tab in your Render service
2. Run: `npm run db:push`
3. This will create all necessary database tables including:
   - users (authentication)
   - sessions (session storage)
   - clients (client management)
   - invoices (invoice records)
   - invoice_items (invoice line items)
   - settings (application settings)

### 5. Verify Deployment

1. Visit your Render service URL
2. You should see the MOLLA ENTERPRISES landing page
3. Test the authentication flow

## Important Notes

### Port Configuration
- Render automatically provides the `PORT` environment variable
- The application is already configured to use `process.env.PORT`
- Default Render port is 10000 (automatically handled)

### Database Migrations
- Use `npm run db:push` to update database schema
- Never manually edit the database
- The application uses Drizzle ORM for type-safe database operations

### Performance Considerations
- **Free Tier**: Services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep may be slow (15-30 seconds)
- **Upgrade**: Consider paid plans for production use to eliminate cold starts

### Troubleshooting

#### Build Failures
- Check that Node.js version 20.x is available
- Verify all dependencies are in `package.json` dependencies (not devDependencies)
- Review build logs for specific errors

#### Runtime Errors
- Check environment variables are set correctly
- Verify DATABASE_URL is the Internal Database URL
- Ensure database schema is pushed: `npm run db:push`

#### Authentication Issues
- Verify REPLIT_DOMAINS matches your Render service URL
- Check that REPL_ID is configured correctly
- Consider implementing alternative authentication for production

### Security Checklist

- [ ] SESSION_SECRET is a strong, random value
- [ ] DATABASE_URL uses the Internal Database URL (not External)
- [ ] All environment variables are set in Render dashboard (not committed to git)
- [ ] PostgreSQL database has a strong password
- [ ] Consider enabling HTTPS (automatically provided by Render)

## Production Recommendations

1. **Upgrade Database**: Free tier has storage and connection limits
2. **Upgrade Web Service**: Eliminate cold starts and increase resources
3. **Custom Domain**: Configure a custom domain for professional branding
4. **Monitoring**: Set up health checks and monitoring
5. **Backups**: Configure automated database backups
6. **Authentication**: Replace Replit Auth with a production OAuth provider

## Support

For Render-specific issues, refer to:
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com

For application issues, check the service logs in your Render dashboard.
