/* istanbul ignore next */
import * as AppInsights from "applicationinsights";
import * as AppInsightsUtils from "../common/AppInsightsUtils";
import {
  Context,
  HttpRequest
} from "@azure/functions"
import azureFunction from './function';
import { Constants } from "../common";

export const EVENT_SOURCE = 'simplemath';

/* setup Azure Application Insights */
if (!AppInsights.defaultClient) {
  // set default config
  AppInsightsUtils.initDefaultConfig();
  // set app name
  AppInsights.defaultClient.commonProperties = { 'app.name': EVENT_SOURCE};
  // start App Insights
  AppInsights.start();
}

/**
 * Default export wrapped with Application Insights FaaS context propagation
 *
 * @export
 * @param {*} context
 * @param {*} req
 * @return {*}
 */
 export default async function contextPropagatingHttpTrigger(context: Context, req: HttpRequest) {
  // start an AI Correlation Context using the provided Azure Function context
  const correlationContext = AppInsights.startOperation(context, req);

  // wrap the Function runtime with correlationContext
  return AppInsights.wrapWithCorrelationContext(async () => {
    const startTime = Date.now(); // Start trackRequest timer

    try {
      // run the function
      await azureFunction(context, req);
    } catch (error) {
      AppInsights.defaultClient.trackException({
        exception: new Error(`Error in function execution: ${error.message}`),
        properties: { source: EVENT_SOURCE },
        severity: AppInsights.Contracts.SeverityLevel.Error
      });
    } finally {
      // track request on completion
      AppInsights.defaultClient.trackRequest({
        name: context.req.method + " " + context.req.url,
        resultCode: context.res?.status,
        success: ((parseInt(context.res?.status) >= 200 ) && (parseInt(context.res?.status) < 400 )),
        url: req.url,
        duration: Date.now() - startTime,
        id: correlationContext.operation.parentId,
      });
    }

    AppInsights.defaultClient.flush();
  }, correlationContext)();
}
