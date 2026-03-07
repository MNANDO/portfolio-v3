# Portfolio Site

Static portfolio site built with Astro, React, and Tailwind CSS. Hosted on S3 behind CloudFront. Includes an authenticated admin CMS for managing blog posts.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [AWS CLI](https://aws.amazon.com/cli/) configured with your account
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- An ACM certificate for your domain **in us-east-1** (required by CloudFront)

---

## 1. Deploy Infrastructure

`site-template.yaml` creates the S3 buckets and OAC resources, and wires up bucket policies to your existing CloudFront distribution. The distribution itself is managed separately in AWS — it is **not** created by this template.

### Step 1 — Create the stack and S3 buckets

```bash
sam deploy \
  --template-file site/site-bootstrap-template.yaml \
  --stack-name portfolio-site \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    SiteBucketName=YOUR_SITE_BUCKET_NAME \
    AssetsBucketName=YOUR_ASSETS_BUCKET_NAME
```

### Step 2 — Add bucket policies

Get your distribution ID from the AWS console (format: `E1XXXXXXXXX`), then deploy the full template to attach the bucket policies:

```bash
sam deploy \
  --template-file site/site-template.yaml \
  --stack-name portfolio-site \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    SiteBucketName=YOUR_SITE_BUCKET_NAME \
    AssetsBucketName=YOUR_ASSETS_BUCKET_NAME \
    DistributionId=YOUR_DISTRIBUTION_ID
```

### Step 3 — Configure the distribution

In the AWS console, update your CloudFront distribution to:
- Add the site bucket as the default origin using the `SiteOAC` origin access control created by the stack
- Add the assets bucket as a second origin using `AssetsOAC`, with path pattern `/assets/*`
- Set the default root object to `index.html`
- Add custom error responses: 403 and 404 → `/index.html` (for SPA routing)

---

## 2. Set Up Cognito (Admin Auth)

The admin CMS is gated behind Cognito. Create these manually in the AWS console or via CLI:

1. **User Pool** — create a user pool with the Hosted UI enabled
2. **App Client** — add an app client with the authorization code grant flow
3. **Admin user** — create a single user in the pool (no sign-up flow)
4. **Hosted UI domain** — configure a Cognito domain prefix

Collect these values for your `.env`:

| Env var | Where to find it |
|---|---|
| `PUBLIC_COGNITO_AUTHORITY` | `https://cognito-idp.REGION.amazonaws.com/USER_POOL_ID` |
| `PUBLIC_COGNITO_CLIENT_ID` | App client ID in the User Pool |
| `PUBLIC_COGNITO_REDIRECT_URI` | Must match the callback URL set in the app client (e.g. `https://yourdomain.com/admin`) |
| `PUBLIC_COGNITO_HOSTED_DOMAIN` | Your Cognito hosted UI domain (e.g. `https://your-prefix.auth.us-east-1.amazoncognito.com`) |
| `PUBLIC_COGNITO_IDENTITY_POOL_ID` | Identity Pool ID (if using federated identity for direct S3 uploads) |

---

## 3. Configure Environment Variables

Copy the example file and fill in values:

```bash
cp site/.env.example site/.env
```

```env
PUBLIC_SITE_URL=
PUBLIC_AWS_REGION=us-east-1
PUBLIC_S3_ASSETS_BUCKET=
PUBLIC_COGNITO_IDENTITY_POOL_ID=
PUBLIC_COGNITO_AUTHORITY=
PUBLIC_COGNITO_CLIENT_ID=
PUBLIC_COGNITO_REDIRECT_URI=
PUBLIC_COGNITO_HOSTED_DOMAIN=
```

---

## 4. Local Development

```bash
# From the repo root
pnpm install

# Start the dev server (localhost:4321)
cd site && pnpm dev
```

---

## 5. Build & Deploy the Site

```bash
# Build
cd site && pnpm build

# Sync to S3
aws s3 sync site/dist/ s3://YOUR_SITE_BUCKET_NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Commands

| Command | Action |
|---|---|
| `pnpm dev` | Start local dev server at `localhost:4321` |
| `pnpm build` | Build production site to `./dist/` |
| `pnpm preview` | Preview the build locally |
