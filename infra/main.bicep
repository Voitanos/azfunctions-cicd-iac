param location string = resourceGroup().location

@description('Resource name prefix')
param resourceNamePrefix string
var envResourceNamePrefix = toLower(resourceNamePrefix)

@description('Deployment name (used as parent ID for child deployments)')
param deploymentNameId string = '0000000000'

@description('Name of the staging deployment slot')
var functionAppStagingSlot = 'staging'

/* ###################################################################### */
// Create app configuration to store settings
/* ###################################################################### */
resource azAppConfiguration 'Microsoft.AppConfiguration/configurationStores@2021-10-01-preview' = {
  name: '${envResourceNamePrefix}-appconfig-${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard'
  }
}
// set two default values for APP_VERSION & COMMIT_HASH
resource appConfigKey_AppVersion 'Microsoft.AppConfiguration/configurationStores/keyValues@2021-10-01-preview' = {
  name: 'APP_VERSION'
  parent: azAppConfiguration
  properties: {
    value: '0.0.0'
  }
}
resource appConfigKey_CommitHash 'Microsoft.AppConfiguration/configurationStores/keyValues@2021-10-01-preview' = {
  name: 'COMMIT_HASH'
  parent: azAppConfiguration
  properties: {
    value: '0000000000000000000000000000000000000000'
  }
}

/* ###################################################################### */
// Create storage account for function app prereq
/* ###################################################################### */
resource azStorageAccount 'Microsoft.Storage/storageAccounts@2021-08-01' = {
  name: '${envResourceNamePrefix}storage'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
}

/* ###################################################################### */
// Create Application Insights
/* ###################################################################### */
resource azAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${envResourceNamePrefix}-ai-${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

/* ###################################################################### */
// Create Function App (+Server Farm ASP)
//   - NOTE: set app settings later
/* ###################################################################### */
resource azHostingPlan 'Microsoft.Web/serverfarms@2021-03-01' = {
  name: '${envResourceNamePrefix}-asp-${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'linux'
  sku: {
    name: 'S1'
  }
  properties: {
    reserved: true
  }
}

resource azFunctionApp 'Microsoft.Web/sites@2021-03-01' = {
  name: '${envResourceNamePrefix}-app-${uniqueString(resourceGroup().id)}'
  kind: 'functionapp'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    httpsOnly: true
    serverFarmId: azHostingPlan.id
    clientAffinityEnabled: true
    reserved: true
    siteConfig: {
      alwaysOn: true
      linuxFxVersion: 'NODE|18'
    }
  }
}

/* ###################################################################### */
// Create Function App's staging slot for
//   - NOTE: set app settings later
/* ###################################################################### */
resource azFunctionSlotStaging 'Microsoft.Web/sites/slots@2021-03-01' = {
  name: functionAppStagingSlot
  parent: azFunctionApp
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    enabled: true
    httpsOnly: true
  }
}

/* ###################################################################### */
// Configure & set app settings on function app's deployment slots
/* ###################################################################### */
// set specific app settings to be a slot specific values
resource functionSlotConfig 'Microsoft.Web/sites/config@2021-03-01' = {
  name: 'slotConfigNames'
  parent: azFunctionApp
  properties: {
    appSettingNames: [
      'APP_CONFIGURATION_LABEL'
    ]
  }
}

/* ###################################################################### */
// set the app settings on function app's deployment slots
/* ###################################################################### */
/* base app settings for all accounts */
var BASE_SLOT_APPSETTINGS = {
  APP_CONFIGURATION_NAME: azAppConfiguration.name
  APPINSIGHTS_INSTRUMENTATIONKEY: azAppInsights.properties.InstrumentationKey
  APPLICATIONINSIGHTS_CONNECTION_STRING: 'InstrumentationKey=${azAppInsights.properties.InstrumentationKey}'
  AzureWebJobsStorage: 'DefaultEndpointsProtocol=https;AccountName=${azStorageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${azStorageAccount.listKeys().keys[0].value}'
  FUNCTIONS_EXTENSION_VERSION: '~3'
  FUNCTIONS_WORKER_RUNTIME: 'node'
  WEBSITE_CONTENTSHARE: toLower(azStorageAccount.name)
  WEBSITE_CONTENTAZUREFILECONNECTIONSTRING: 'DefaultEndpointsProtocol=https;AccountName=${azStorageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${azStorageAccount.listKeys().keys[0].value}'
}

@description('Set app settings on production slot')
resource functionAppProdSettings 'Microsoft.Web/sites/config@2021-03-01' = {
  name: 'appsettings'
  parent: azFunctionApp
  properties: union(BASE_SLOT_APPSETTINGS, { APP_CONFIGURATION_LABEL: 'production' })
}
@description('Set app settings on staging slot')
resource functionAppStagingSettings 'Microsoft.Web/sites/slots/config@2021-03-01' = {
  name: 'appsettings'
  parent: azFunctionSlotStaging
  properties: union(BASE_SLOT_APPSETTINGS, { APP_CONFIGURATION_LABEL: 'staging' })
}

/* ###################################################################### */
// grant resource [AzureFunction MSI] READ permissions > resource [APP CONFIGURATION] */
/* ###################################################################### */
module grantAppServiceToAppConfig 'appservice-appconfig-grant.bicep' = {
  name: '${deploymentNameId}-grant-appService-appConfig'
  params: {
    azAppConfigurationId: azAppConfiguration.id
    azFunctionAppId: azFunctionApp.id
    azFunctionAppPrincipalId: azFunctionApp.identity.principalId
  }
}

/* define outputs */
output appConfigName string = azAppConfiguration.name
output appConfigEndpoint string = azAppConfiguration.properties.endpoint
output appInsightsInstrumentionKey string = azAppInsights.properties.InstrumentationKey
output functionAppName string = azFunctionApp.name
output functionAppSlotName string = azFunctionSlotStaging.name
