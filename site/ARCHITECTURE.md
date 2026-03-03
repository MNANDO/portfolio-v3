# Architecture

## Overview

Static portfolio site with a blog CMS. Content is managed through an authenticated admin page, stored in S3, and statically generated with Astro at build time. Builds are triggered automatically when content changes.

## System Diagram

```
                          ADMIN FLOW                                 
                                                                     
  Browser (/admin)                                                   
       │                                                             
       ▼                                                             
  Cognito Hosted UI ──► Login ──► Redirect back with auth code       
       │                                                             
       ▼ (JWT access token)                                          
  API Gateway (REST)                                                 
  ├── Cognito User Pool Authorizer (validates JWT on every request)  
  ├── POST   /posts         → Lambda: createPost                     
  ├── GET    /posts         → Lambda: listPosts                      
  ├── GET    /posts/{slug}  → Lambda: getPost                        
  ├── PUT    /posts/{slug}  → Lambda: updatePost                     
  └── DELETE /posts/{slug}  → Lambda: deletePost                     
       │                                                             
       ▼                                                             
  S3 Content Bucket (posts/{slug}.json)                              
       │                                                             
       ▼ (S3 PutObject / DeleteObject event)                         
  EventBridge                                                        
  ├── Rule 1 → Lambda: syncToDynamo → DynamoDB (blog-posts table)    
  └── Rule 2 → CodeBuild: site-build pipeline                        
                                                                     

                        READER FLOW                                  
                                                                     
  Browser ──► CloudFront ──► S3 Site Bucket (static Astro site)      
                                                                     

                      BUILD PIPELINES                                
                                                                     
  Pipeline 1: Site (Astro)                                           
  Triggers:                                                          
    - Git push to main (code changes in site/)                       
    - EventBridge (new/updated/deleted blog post in S3)              
  Steps:                                                             
    1. CodeBuild pulls repo                                          
    2. pnpm install && astro build (S3 loader fetches blog JSON)     
    3. aws s3 sync dist/ → S3 site bucket                            
    4. CloudFront cache invalidation                                 
                                                                     
  Pipeline 2: API (Lambda)                                           
  Triggers:                                                          
    - Git push to main (code changes in api/)                        
  Steps:                                                             
    1. CodeBuild pulls repo                                          
    2. npm install && bundle Lambda handlers                         
    3. Update Lambda function code                                   
                                                                     
```

## AWS Services

| Service | Purpose |
|---|---|
| **S3** (site bucket) | Hosts the static Astro site |
| **S3** (content bucket) | Stores blog post JSON files (source of truth) |
| **CloudFront** | CDN for the static site |
| **API Gateway** (REST) | CRUD API for admin, secured with Cognito authorizer |
| **Lambda** (x5-6) | API handlers (CRUD) + DynamoDB sync |
| **Cognito** | User Pool + Hosted UI for admin authentication |
| **DynamoDB** | Blog post index for fast listing/querying by date and tags |
| **EventBridge** | S3 events → trigger DynamoDB sync + site rebuild |
| **CodeBuild** (x2) | Site build pipeline + API deploy pipeline |

## Authentication

Uses Cognito Hosted UI with a single admin user. No sign-up flow.

1. User visits `/admin` → app checks for JWT token in sessionStorage
2. No token → redirect to Cognito Hosted UI login page
3. User logs in → Cognito redirects back to `/admin?code=xxx`
4. Admin page exchanges auth code for tokens via Cognito `/oauth2/token` endpoint
5. Access token is sent as `Authorization: Bearer <token>` on all API calls
6. API Gateway validates the token via a Cognito User Pool authorizer
7. Token refresh handled client-side when token expires

## DynamoDB Table Design

**Table: `blog-posts`**

| Attribute | Type | Key |
|---|---|---|
| `slug` | String | Partition Key |
| `title` | String | |
| `description` | String | |
| `date` | String (ISO 8601) | Sort Key on GSI |
| `draft` | Boolean | |
| `tags` | String Set | |

**GSI: `date-index`** — enables listing posts sorted by date.

DynamoDB is populated via EventBridge when blog JSON files are written to or deleted from S3. It serves as a queryable index; S3 remains the source of truth for full post content.

## Monorepo Structure

```
/
├── site/                    ← Astro project
│   ├── src/
│   │   ├── components/
│   │   │   └── admin/
│   │   │       ├── AdminApp.tsx      (auth gating + routing)
│   │   │       ├── PostForm.tsx      (create/edit form)
│   │   │       └── PostList.tsx      (list + delete)
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro
│   │   ├── lib/
│   │   │   ├── api-client.ts         (fetch calls to API Gateway)
│   │   │   ├── auth.ts               (Cognito auth helpers)
│   │   │   ├── s3-loader.ts          (build-time S3 content loader)
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── index.astro
│   │   │   ├── admin.astro
│   │   │   └── blog/
│   │   │       ├── index.astro
│   │   │       └── [slug].astro
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── content.config.ts
│   ├── astro.config.mjs
│   ├── package.json
│   └── tsconfig.json
│
├── api/                     ← Lambda functions
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── createPost.ts         (POST /posts)
│   │   │   ├── getPost.ts            (GET /posts/{slug})
│   │   │   ├── listPosts.ts          (GET /posts)
│   │   │   ├── updatePost.ts         (PUT /posts/{slug})
│   │   │   └── deletePost.ts         (DELETE /posts/{slug})
│   │   └── lib/
│   │       └── s3.ts                 (shared S3 client)
│   ├── package.json
│   └── tsconfig.json
│
└── infra/                   ← IaC (CDK, SAM, or Terraform)
```
