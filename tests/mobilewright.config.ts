import { defineConfig, type MobilewrightConfig } from 'mobilewright';
import { MobileNextDriver } from '@mobilewright/driver-mobilenext';
import { browserStackDriver } from '@browserstack/mobilewright';

function requireEnv(names: Array<string>) {
  for (const name of names) {
    if (!(name in process.env)) {
      throw new Error(`Environment variable ${name} must be set before running tests`);
    }
  }
}

const config: MobilewrightConfig = {
  // tests are in the current directory
  testDir: '.',

  // if a test fails, don't try it again
  retries: 0,

  // extra headroom for fixture teardown
  timeout: 120_000,

  // bundle identifier of our app under test
  bundleId: 'com.mobilenext.Milliways',

  // beforeEach already terminates and launches the app, so skip the fixture's
  // own launch — otherwise every test launches twice and waits ~2s for
  // foreground each time
  autoAppLaunch: false,

  // enable paralllelism on all tests, not just their files
  fullyParallel: true,

  // how many workers (devices) at the same time?
  workers: process.env.CI ? 2 : 1,

  projects: [
    {
      name: "ios-simulator",
      use: {
        platform: "ios",
        deviceType: "simulator",
        installApps: ["../ios/build/Milliways-simulator.zip"],
      },
    },
    {
      name: "ios",
      use: {
        platform: "ios",
        deviceType: "real",
        osVersion: ">=18",
        installApps: ["../ios/build/Milliways-unsigned.ipa"],
      }
    },
  ],

  // we want both list on screen, and an html directory
  reporter: [
    ['list'],
    ['html', { outputFolder: 'mobilewright-report' }],
  ],
};

// if environmet exists, we'll use another driver and allocate a device on the cloud otherwise we run it on a device locally with mobilecli
const provider = process.env['PROVIDER'] || "mobilecli";
switch (provider) {
  case 'mobilenext':
  requireEnv(['MOBILENEXT_API_KEY']);
  config.driver = new MobileNextDriver({
    apiKey: process.env['MOBILENEXT_API_KEY'],
  });
  break;

  case 'browserstack':
  requireEnv(['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY']);
  config.driver = new browserStackDriver({});
  break;

  case 'mobilecli':
  // default driver, local only
  break;

  default:
  throw new Error(`Unknown provider ${provider}`);
}

export default defineConfig(config);

