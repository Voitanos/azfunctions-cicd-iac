# TotalView - Zarya

Demo showing how to deploy Azure Functions 100% from GitHub with CI/CD & IaC with zero credentials.

Learn more: [How to: CI/CD/IaC for Azure Function Apps and GitHub Actions](https://www.voitanos.io/blog/how-to-cicd-iac-for-azure-function-apps-with-github-actions-step-by-step/)

## Azure Functions in this project

### [Heartbeat](./heartbeat)

Used to ensure the function app has deployed.

### [Simplemath](./simplemath)

Used to ensure the function app has deployed.

## Deployment

All deployment to the Azure resource that hosts this Azure Function app is managed through GitHub actions. These cover the following scenarios:

1. development of functions (*ie: off the **master** branch*)
1. deployment to production (*ie: on the **master** branch*)

### Deployment of Azure resources

This repo employs the concept of [infrastructure as code (IaC)](https://en.wikipedia.org/wiki/Infrastructure_as_code) for the creation of all Azure resources needed in this solution.

See the **[./infra/README.md](./infra/README.md)** folder for details and additional setup steps.

### Development of Azure Functions

All development of functions on branches **!master** or **!development**  are automatically built & tested by the [Build app & run all tests](./.github/workflows/build-test-deploy.yml) workflow.

When a branch is pushed to any branch other than the **master** branch, this workflow builds & runs all unit tests.

Nothing is deployed in this case.

A manual publish of a draft release triggers the production slot swapping.
