@description('Resource ID of Function App resource')
param azFunctionAppId string

@description('Principal ID of Function App Managed Identity')
param azFunctionAppPrincipalId string

@description('Resource ID of App Configuration')
param azAppConfigurationId string

@description('Built-in Role: App Configuration Data Reader')
var appConfigurationDataReader_builtInRoleID = '516239f1-63e1-4d78-a4de-a74fb236a071'



// get built in role definition
resource azAppConfigReaderRoleDef 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' existing = {
  scope: resourceGroup()
  name: appConfigurationDataReader_builtInRoleID
}

// grant functionapp MSI Reader => App Config
resource functionAppRoleAppConfig 'Microsoft.Authorization/roleAssignments@2020-10-01-preview' = {
  scope: resourceGroup()
  name: guid(azAppConfigurationId, azAppConfigReaderRoleDef.id, azFunctionAppId)
  properties: {
    roleDefinitionId: azAppConfigReaderRoleDef.id
    principalId: azFunctionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}
