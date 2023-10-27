/* istanbul ignore next */
import * as AppInsights from "applicationinsights";
import { DefaultAzureCredential } from "@azure/identity";
import { AppConfigurationClient }  from "@azure/app-configuration";
import { Constants } from "./";

/**
 * Setup AppInsights with common settings
 *
 * @export
 */
export async function initDefaultConfig(): Promise<void> {
  /* check if AppInsights already configured...
   *   > determined if `defaultClient` set & if `app.name` set
   *   > if not, bail on the config (don't double setup)
   */
  if (AppInsights.defaultClient?.commonProperties['app.name']) {
    return;
  }

  // enable stream of of live metrics
  AppInsights.setup().setSendLiveMetrics(true);

  // auto populate all azure properties, like the cloud RoleName
  AppInsights.defaultClient.setAutoPopulateAzureProperties(true);

  // set the current tagged app & version of the function app
  return await setAppDetails();
}

export async function setAppDetails(): Promise<void> {
  // setup azure credentials
  const credential = new DefaultAzureCredential();

  // init appConfiguration client
  const appConfigClient = new AppConfigurationClient(`https://${process.env.APP_CONFIGURATION_NAME}.azconfig.io`, credential);

  // get properties
  const appVersion = await appConfigClient.getConfigurationSetting({
    label: process.env.APP_CONFIGURATION_LABEL,
    key: Constants.AppSettings.APP_VERSION
  });

  // set the current tagged app & version of the function app
  AppInsights.defaultClient.context.tags[AppInsights.defaultClient.context.keys.applicationVersion] = appVersion.value;

  return Promise.resolve();
}
