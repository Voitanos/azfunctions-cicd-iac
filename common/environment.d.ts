/*
 * Define environment variables passed into the functions via App Settings in
 * the Azure Function App config.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Azure App Configuration resource name.
       *
       * @type {string}
       * @memberof ProcessEnv
       */
       APP_CONFIGURATION_NAME: string;

      /**
       * Azure App Configuration label.
       *
       * @type {string}
       * @memberof ProcessEnv
       */
       APP_CONFIGURATION_LABEL: string;
    }
  }
}

export { };
