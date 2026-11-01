/**
 * Milliways — The Restaurant at the End of the Universe
 *
 * Run:
 *   npx mobilewright test milliways.test.ts
 */

import { test, expect } from '@mobilewright/test';
import type { Device, Dialog, Screen } from '@mobilewright/core';

// every test starts with a fresh launch of the app, see autoAppLaunch in mobilewright.config.ts

const GROOM_LAKE = { latitude: 37.2514326, longitude: -115.8452064 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

async function navigateToMenu(screen: Screen) {
  await screen.getByLabel('New Order').tap();
  await expect(screen.getByText('MAIN DISHES')).toBeVisible();
}

async function addItemToCart(screen: Screen, itemName: string) {
  await screen.getByText(itemName).scrollIntoViewIfNeeded();
  await screen.getByText(itemName).tap();
  await screen.getByLabel('Add to Order').tap();
  await expect(screen.getByText('View Order')).toBeVisible();
}

async function openEditProfile(screen: Screen) {
  await screen.getByLabel('person.circle').tap();
  await screen.getByText('Edit Profile').tap();
  await expect(screen.getByLabel('Display name')).toBeVisible();
}

async function relaunchApp(device: Device, bundleId: string) {
  await device.terminateApp(bundleId);
  await device.launchApp(bundleId);
}

// wipes the saved profile, and the location permission with it
async function relaunchAppWithCleanData(device: Device, bundleId: string) {
  await device.terminateApp(bundleId);
  await device.clearAppData(bundleId);
  await device.launchApp(bundleId);
}

// tapping "Use my location" asks for permission first; returns that prompt, still open
async function askForMyLocation(screen: Screen): Promise<Dialog> {
  const permissionPrompt = screen.waitForEvent('dialog');
  await screen.getByText('Use my location').tap();
  return permissionPrompt;
}

// accepts the permission prompt and returns the alert the app shows next
async function allowLocationAndGetDeliveryAlert(screen: Screen, permissionPrompt: Dialog): Promise<Dialog> {
  const deliveryAlert = screen.waitForEvent('dialog');
  await permissionPrompt.accept();
  return deliveryAlert;
}

test('order a meal, get it delivered, and start over with an empty cart', async ({ screen }) => {
  await navigateToMenu(screen);
  await addItemToCart(screen, 'Ameglian Major Cow');
  await addItemToCart(screen, 'Coffee');

  await expect(screen.getByText('2 items')).toBeVisible();
  await expect(screen.getByText('₭39.50')).toBeVisible(); // 35 + 4.50

  await screen.getByText('View Order').tap();
  await screen.getByLabel('Place Order').tap();
  await expect(screen.getByText(/is on its way/)).toBeVisible();
  await expect(screen.getByText(/minutes for delivery/)).toBeVisible();

  await screen.getByLabel('Close').tap();
  await expect(screen.getByText('Welcome to Milliways')).toBeVisible();

  await screen.getByLabel('New Order').tap();
  await screen.getByLabel('Shopping Cart').tap();
  await expect(screen.getByText('Your order is empty')).toBeVisible();
});

test('quantity stepper stays at 1 or above and multiplies the price', async ({ screen }) => {
  await navigateToMenu(screen);
  await screen.getByText('Quantum Shrimp Cascade').tap();

  await screen.getByLabel('−').tap();
  await expect(screen.getByText('1')).toBeVisible();

  await screen.getByLabel('+').tap();
  await screen.getByLabel('+').tap();
  await screen.getByLabel('Add to Order').tap();

  await expect(screen.getByText('3 items')).toBeVisible();
  await screen.getByText('View Order').tap();
  await expect(screen.getByText('3 × ₭38.00')).toBeVisible();
  await expect(screen.getByText('₭114.00')).toBeVisible();
});

test('only the MARVIN coupon gives a discount', async ({ screen }) => {
  await navigateToMenu(screen);
  await addItemToCart(screen, 'Ameglian Major Cow'); // ₭35.00
  await screen.getByText('View Order').tap();

  await screen.getByLabel('Coupon code').fill('ZAPHOD');
  await screen.getByText('Apply').tap();
  await expect(screen.getByText('Invalid coupon code')).toBeVisible();

  await screen.getByLabel('Coupon code').fill('MARVIN');
  await screen.getByText('Apply').tap();
  await expect(screen.getByText('-₭20.00')).toBeVisible();
  await expect(screen.getByText('₭15.00')).toBeVisible(); // 35 - 20
});

test('menu scrolls down to the shipping disclaimer and back up', async ({ screen }) => {
  await navigateToMenu(screen);

  await screen.getByText(/Shipping beyond/).scrollIntoViewIfNeeded();
  await expect(screen.getByText('* Shipping beyond 5 light-years distance might cost extra')).toBeVisible();

  await screen.getByText('Green Salad').scrollIntoViewIfNeeded({ direction: 'down' });
  await expect(screen.getByText('MAIN DISHES')).toBeVisible();
});

test('edited profile is saved and survives an app restart', async ({ screen, device, bundleId }) => {
  await relaunchAppWithCleanData(device, bundleId!);
  await openEditProfile(screen);

  await expect(screen.getByLabel('Display name')).toHaveValue('Glorpax');
  await expect(screen.getByRole('switch', { name: 'Galactic newsletter' })).not.toBeChecked();

  await screen.getByLabel('Email').clear();
  await expect(screen.getByText('Email is required')).toBeVisible();
  await expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

  await screen.getByLabel('Email').fill('trillian@milliways.space');
  await screen.getByLabel('Display name').fill('Trillian');
  await screen.getByRole('switch', { name: 'Galactic newsletter' }).check();
  await screen.getByRole('button', { name: 'Save' }).tap();
  await expect(screen.getByText('Hi Trillian!')).toBeVisible();

  await relaunchApp(device, bundleId!);
  await openEditProfile(screen);

  await expect(screen.getByLabel('Display name')).toHaveValue('Trillian');
  await expect(screen.getByLabel('Email')).toHaveValue('trillian@milliways.space');
  await expect(screen.getByRole('switch', { name: 'Galactic newsletter' })).toBeChecked();
});

test('delivering anywhere on Earth warns that couriers are busy', async ({ screen, device, bundleId }) => {
  await relaunchAppWithCleanData(device, bundleId!);
  await device.setGeolocation(LONDON);
  await openEditProfile(screen);

  const permissionPrompt = await askForMyLocation(screen);
  expect(permissionPrompt.type()).toBe('permission');
  expect(permissionPrompt.title()).toBe('Allow “Milliways” to use your location?');
  expect(permissionPrompt.buttons()).toEqual(['Allow Once', 'Allow While Using App', 'Don’t Allow']);

  const alert = await allowLocationAndGetDeliveryAlert(screen, permissionPrompt);
  expect(alert.title()).toBe('Delivering to Earth');
  expect(alert.message()).toBe('Delivering to Earth might take more time than usual, our couriers are busy');
  await alert.accept();
  await expect(screen.getByText('Use my location')).toBeVisible();
});

test('delivering to Groom Lake comes with a happy hour', async ({ screen, device, bundleId }) => {
  await relaunchAppWithCleanData(device, bundleId!);
  await device.setGeolocation(GROOM_LAKE);
  await openEditProfile(screen);

  const permissionPrompt = await askForMyLocation(screen);
  const alert = await allowLocationAndGetDeliveryAlert(screen, permissionPrompt);
  expect(alert.title()).toBe('Groom Lake Happy Hour!');
});
