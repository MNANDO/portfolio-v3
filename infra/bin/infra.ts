#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/stacks/pipeline-stack';

const app = new cdk.App();

new PipelineStack(app, 'PipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  s3SiteBucket: process.env.S3_SITE_BUCKET ?? '',
  cloudfrontDistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID ?? '',
});
