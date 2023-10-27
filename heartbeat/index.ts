import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity";
import { AppConfigurationClient } from "@azure/app-configuration";
import { Constants } from "../common";

/* istanbul ignore next */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  let error: Error | undefined = undefined;
  let response: string;

  context.log('HTTP trigger function processed a request.');

  // setup azure credentials
  const credential = new DefaultAzureCredential();

  // init appConfiguration client
  const appConfigClient = new AppConfigurationClient(`https://${process.env.APP_CONFIGURATION_NAME}.azconfig.io`, credential);
  // get properties
  const settingAppVersion = await appConfigClient.getConfigurationSetting({
    key: Constants.AppSettings.APP_VERSION, label: process.env.APP_CONFIGURATION_LABEL
  });
  const settingCommitHash = await appConfigClient.getConfigurationSetting({
    key: Constants.AppSettings.COMMIT_HASH, label: process.env.APP_CONFIGURATION_LABEL
  });

  response = `The HTTP trigger executed successfully. APP_VERSION=${settingAppVersion.value} && COMMIT_HASH=${settingCommitHash.value}.`;

  // respond
  context.res = (!error)
    ? { status: 200, body: response }
    : { status: 400, body: error.message };

};

export default httpTrigger;
