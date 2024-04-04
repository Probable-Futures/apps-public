# Security Services

The Probable Futures AWS account has several services enabled to monitor the account.
This document provides an overview of the services and how they should be monitored by developers.

## Guard Duty

Amazon's Guard Duty is a threat detection service that monitors our AWS account for suspicious and malicious activity.
It watches activity on our account and creates a 'finding' when it discovers an anomaly.
Currently Guard Duty is not set to notify slack of findings when they occur, so it should be checked monthly.

## AWS Config

AWS Config is a service that provides detailed views of the configuration settings of AWS resources and services. It checks the configuration of resources against rules, which can be defined by AWS or created as custom rules.
Currently the default rules are enabled. There are some rule violations in the findings, but they have been audited by Jemurai and are not a concern.

## Security Hub

AWS Security Hub provides a consolidated view of your security status in AWS. It's similar to Config but does not have rules. As with AWS config, there are some failed security checks but they have been audited by Jermurai and are not a concern.

## IAM Access Analyzer

This service helps you identify the resources in your organization and accounts, such as Amazon S3 buckets or IAM roles, shared with an external entity. You shouldn't need to check it regularly, but it's helpful to know about if you want to audit IAM policies and s3 buckets.

## CloudTrail

This is a logging and auditing service. It tracks all actions performed by AWS users and creates an audit trail. You shouldn't need to think about this, unless there is a security issue or a resource is changed and you want to determine who is responsible.
