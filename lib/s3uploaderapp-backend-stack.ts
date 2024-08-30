import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
//APPSYNC
import * as appsync from 'aws-cdk-lib/aws-appsync';
//DYNAMODB
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
//S3
import * as s3 from 'aws-cdk-lib/aws-s3';



export class S3UploaderAppBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);




    //**************************APPSYNC**************************/
    //APPSYNC's API gives you a graphqlApi with apiKey ( for deploying APPSYNC )
    const api = new appsync.GraphqlApi(this, 'api', {
      name: "s3uploaderapp---api",
      definition: appsync.Definition.fromSchema(
        new appsync.SchemaFile({ filePath: "graphql/schema.gql" })
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            //set the expiration time to 1 year (365 days)
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        }
      }
    });


    //print graphqlApi Url on console after deploy APPSYNC
    new cdk.CfnOutput(this, 'GraphQlAPIUrl', {
      value: api.graphqlUrl
    });


    //print apiKey on console after deploy APPSYNC
    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || ''
    });
    //**************************APPSYNC**************************/




    //**************************DYNAMODB**************************/
    //creating table
    const table = new ddb.Table(this, 'table', {
      tableName: "s3uploaderapp---table",
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING }
    });


    //setting table as a datasource of endpoint
    const db_datasource = api.addDynamoDbDataSource('DBDataSource', table);


    //describing resolver for datasource
    db_datasource.createResolver('mutation-resolver', {
      typeName: "Mutation",
      fieldName: "create_uploader",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition('id').auto(),
        appsync.Values.projecting()
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    });


    //describing resolver for datasource
    db_datasource.createResolver('query-resolver-all', {
      typeName: "Query",
      fieldName: "all_uploaders",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList()
    });


    //describing resolver for datasource
    db_datasource.createResolver('query-resolver-one', {
      typeName: "Query",
      fieldName: "get_uploader",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('fileName', 'fileName'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    });
    //**************************DYNAMODB**************************/




    //**************************S3**************************/
    //creating s3 Bucket
    const bucket = new s3.Bucket(this, 'bucket', {
      bucketName: 's3uploaderapp---bucket',
      cors: [
        {
          allowedOrigins: ['http://localhost:3000', 'https://your-domain.com'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE
          ],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag', 'x-amz-meta-custom-header'],
          maxAge: 3000,
        },
      ],
    });


    //print BucketName on console after deploy s3 Bucket 
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName
    });
    //**************************S3**************************/
  }
}