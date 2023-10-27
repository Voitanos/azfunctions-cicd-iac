import {
  AzureFunction,
  Context,
  HttpRequest
} from '@azure/functions'
import * as AppInsights from 'applicationinsights';
import { add } from "./simpleMath";

/**
 * Azure Function
 *
 * @param {Context} context
 * @param {HttpRequest} req
 * @return {*}  {Promise<void>}
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    // trace the request
    AppInsights.defaultClient.trackTrace({
      message: 'HTTP request received',
      properties: {
        source: require('./').EVENT_SOURCE,
        requestQuery: JSON.stringify(req.query)
      },
      severity: AppInsights.Contracts.SeverityLevel.Verbose
    });

    const rawOperandA = new URLSearchParams(req.query).get('operandA');
    const rawOperandB = new URLSearchParams(req.query).get('operandB');

    if (!rawOperandA || !rawOperandA) {
      AppInsights.defaultClient.trackTrace({
        message: 'Invalid request: missing expected query parameters',
        properties: {
          source: require('./').EVENT_SOURCE,
          requestQuery: JSON.stringify(req.query)
        },
        severity: AppInsights.Contracts.SeverityLevel.Verbose
      });

      context.res = {
        status: 400,
        body: `Missing arguments 'operandA' & 'operandB' on querystring.`
      }
      context.done();
    } else {
      let operandA: number;
      let operandB: number;
      try {
        operandA = parseInt(rawOperandA as string);
      } catch { throw new Error('Unable to cast operandA as number.'); }
      try {
        operandB = parseInt(rawOperandB as string);
      } catch { throw new Error('Unable to cast operandB as number.'); }

      if (isNaN(operandA) || isNaN(operandB)) {
        throw new Error('Both operandA & operandB must be numbers.');
      }

      context.res = {
        status: 200,
        body: `The result of ${operandA} + ${operandB} = ${await add(operandA, operandB)}`
      };

      context.done();
    }
  } catch (error) {
    // track error
    AppInsights.defaultClient.trackException({
      exception: error,
      severity: AppInsights.Contracts.SeverityLevel.Critical
    });

    // respond with error
    context.res = {
      status: 400,
      body: error.message
    };
    context.done();
  }

};

export default httpTrigger;
