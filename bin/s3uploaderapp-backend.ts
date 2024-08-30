#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3UploaderAppBackendStack } from '../lib/s3uploaderapp-backend-stack';


const app = new cdk.App();
new S3UploaderAppBackendStack(app, 'S3UploaderAppBackendStack');