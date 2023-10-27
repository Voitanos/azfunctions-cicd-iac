/**
 * Keys of application settings stored in the Azure App Configuration resource.
 *
 * @export
 * @class AppSettings
 */
export class AppSettings {
  /**
   * Application version.
   *
   * @static
   * @type {string}
   * @memberof AppSettings
   */
  public static APP_VERSION: string = 'APP_VERSION';

  /**
   * SHA of the commit from the currently deployed codebase.
   *
   * @static
   * @type {string}
   * @memberof AppSettings
   */
  public static COMMIT_HASH: string = 'COMMIT_HASH';
}
