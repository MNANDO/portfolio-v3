import * as cdk from 'aws-cdk-lib/core';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  s3SiteBucket: string;
  cloudfrontDistributionId: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // ── Site pipeline ────────────────────────────────────────────────────────
    const siteProject = new codebuild.Project(this, 'SiteBuild', {
      projectName: 'portfolio-site-build',
      source: codebuild.Source.gitHub({
        owner: 'MNANDO',
        repo: 'portfolio-v3',
        webhook: true,
        webhookFilters: [
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH)
            .andBranchIs('main')
            .andFilePathIs('^site/.*'),
        ],
      }),
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.site.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          S3_SITE_BUCKET: { value: props.s3SiteBucket },
          CLOUDFRONT_DISTRIBUTION_ID: { value: props.cloudfrontDistributionId },
        },
      },
    });

    siteProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:DeleteObject', 's3:ListBucket', 's3:GetObject'],
      resources: [
        `arn:aws:s3:::${props.s3SiteBucket}`,
        `arn:aws:s3:::${props.s3SiteBucket}/*`,
      ],
    }));

    siteProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        `arn:aws:cloudfront::${this.account}:distribution/${props.cloudfrontDistributionId}`,
      ],
    }));

    // ── API pipeline ─────────────────────────────────────────────────────────
    const apiProject = new codebuild.Project(this, 'ApiBuild', {
      projectName: 'portfolio-api-build',
      source: codebuild.Source.gitHub({
        owner: 'MNANDO',
        repo: 'portfolio-v3',
        webhook: true,
        webhookFilters: [
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH)
            .andBranchIs('main')
            .andFilePathIs('^api/.*'),
        ],
      }),
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.api.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
    });

    apiProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['lambda:UpdateFunctionCode'],
      resources: [
        `arn:aws:lambda:${this.region}:${this.account}:function:createPost`,
        `arn:aws:lambda:${this.region}:${this.account}:function:getPost`,
        `arn:aws:lambda:${this.region}:${this.account}:function:listPosts`,
        `arn:aws:lambda:${this.region}:${this.account}:function:updatePost`,
        `arn:aws:lambda:${this.region}:${this.account}:function:deletePost`,
      ],
    }));
  }
}
