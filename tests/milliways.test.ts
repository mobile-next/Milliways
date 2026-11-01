/**
 * Milliways — The Restaurant at the End of the Universe
 *
 * Run:
 *   npx mobilewright test milliways.test.ts
 */

import { test, expect } from '@mobilewright/test';
import type { Device, Dialog, Screen } from '@mobilewright/core';

// test.use({ video: 'on' });

test.beforeEach(async ({ device, bundleId }) => {
  await device.terminateApp(bundleId!).catch(() => {});
  await device.launchApp(bundleId!);
});

test.afterEach(async ({ screen }, testInfo) => {
  if (testInfo.status === 'passed') {
    // failed tests already have screenshots attached, so only attach a screenshot if there isn't one
    const screenshot = await screen.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigateToMenu(screen: Screen) {
  await screen.getByLabel('New Order').tap();
  await expect(screen.getByText('MAIN DISHES')).toBeVisible();
}

async function addItemToCart(screen: Screen, itemName: string, quantity = 1) {
  await screen.getByText(itemName).scrollIntoViewIfNeeded();
  await screen.getByText(itemName).tap();

  for (let i = 1; i < quantity; i++) {
    await screen.getByLabel('+').tap();
  }

  await screen.getByLabel('Add to Order').tap();
}

async function openCart(screen: Screen) {
  await screen.getByLabel('Shopping Cart').tap();
}

function parsePrice(text: string): number {
  return parseFloat(text.replace('₭', ''));
}

async function openAccount(screen: Screen) {
  await screen.getByLabel('person.circle').tap();
}

// ---------------------------------------------------------------------------
// Full ordering flow — happy path E2E
// ---------------------------------------------------------------------------

test.describe('ordering flow', () => {
  test('complete order: add items, review cart, place order, see delivery', async ({ screen }) => {
    await navigateToMenu(screen);

    // Add a cow and a coffee
    await addItemToCart(screen, 'Ameglian Major Cow');
    await expect(screen.getByText('MAIN DISHES')).toBeVisible();
    await addItemToCart(screen, 'Coffee');

    // The sticky footer should reflect both items
    await expect(screen.getByText('View Order')).toBeVisible();
    await expect(screen.getByText('2 items')).toBeVisible();
    await expect(screen.getByText('₭39.50')).toBeVisible(); // 35 + 4.50

    // Tap into the cart and verify line items
    await screen.getByText('View Order').tap();
    await expect(screen.getByText('Ameglian Major Cow')).toBeVisible();
    await expect(screen.getByText('Coffee')).toBeVisible();
    await expect(screen.getByText('₭39.50')).toBeVisible(); // total

    // Place the order
    await screen.getByLabel('Place Order').tap();
    await expect(screen.getByText(/is on its way/)).toBeVisible();
    await expect(screen.getByText(/minutes for delivery/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Regression suite
// ---------------------------------------------------------------------------

test.describe('regression', () => {
  test('empty cart checkout does not crash (should fail)', async ({ screen }) => {
    // The app lets you place an order with zero items.
    // DeliveryView accesses items[0] unconditionally — this should crash.
    await navigateToMenu(screen);
    await openCart(screen);

    await expect(screen.getByText('Your order is empty')).toBeVisible();
    await screen.getByLabel('Place Order').tap();

    // If we get here without a crash, the bug is fixed.
    await expect(screen.getByText(/minutes for delivery/)).toBeVisible();
  });

  test('grammar: single item says "1 item" not "1 items" (should fail)', async ({ screen }) => {
    await navigateToMenu(screen);
    await addItemToCart(screen, 'Green Salad');

    // The footer should say "1 item" (singular), not "1 items"
    await expect(screen.getByText(/1 item/)).toBeVisible();
    await expect(screen.getByText('1 items')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Cart & pricing
// ---------------------------------------------------------------------------

test.describe('cart and pricing', () => {
  test('adding multiple quantities updates the price correctly', async ({ screen }) => {
    await navigateToMenu(screen);

    // Add 3x Quantum Shrimp Cascade at ₭38.00 each
    await addItemToCart(screen, 'Quantum Shrimp Cascade', 3);

    await expect(screen.getByText('3 items')).toBeVisible();
    await expect(screen.getByText('₭114.00')).toBeVisible(); // 38 * 3

    // Go to cart and verify the line item breakdown
    await screen.getByText('View Order').tap();
    await expect(screen.getByText('3 × ₭38.00')).toBeVisible();
    await expect(screen.getByText('₭114.00')).toBeVisible();
  });

  test('multi-item cart totals are accurate', async ({ screen }) => {
    await navigateToMenu(screen);

    // Build a mixed order
    await addItemToCart(screen, 'Ameglian Major Cow');           // ₭35.00
    await expect(screen.getByText('MAIN DISHES')).toBeVisible();

    await addItemToCart(screen, 'Green Salad');                  // ₭22.00
    await expect(screen.getByText('MAIN DISHES')).toBeVisible();

    await addItemToCart(screen, 'Coffee');  // ₭4.50

    // Total should be ₭61.50
    await expect(screen.getByText('3 items')).toBeVisible();
    await expect(screen.getByText('₭61.50')).toBeVisible();

    // Verify in the cart view
    await screen.getByText('View Order').tap();
    await expect(screen.getByText('₭61.50')).toBeVisible();
  });

  test('quantity cannot go below 1', async ({ screen }) => {
    await navigateToMenu(screen);
    await screen.getByText('Soup of the Day').tap();

    // Initial quantity is 1
    await expect(screen.getByText('1')).toBeVisible();

    // Try to decrease — should stay at 1
    await screen.getByLabel('−').tap();
    await screen.getByLabel('−').tap();
    await expect(screen.getByText('1')).toBeVisible();
    await expect(screen.getByText('0')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Menu discovery
// ---------------------------------------------------------------------------

test.describe('menu completeness', () => {
  test('all main dishes are listed with correct prices', async ({ screen }) => {
    await navigateToMenu(screen);

    const mainDishes = [
      { name: 'Ameglian Major Cow', price: '₭35.00' },
      { name: 'Green Salad', price: '₭22.00' },
      { name: 'Soup of the Day', price: '₭28.00' },
      { name: 'Quantum Shrimp Cascade', price: '₭38.00' },
      { name: 'Krikkit Fried Logic', price: '₭40.00' },
    ];

    for (const dish of mainDishes) {
      await expect(screen.getByText(dish.name)).toBeVisible();
    }
  });

  test('shipping disclaimer is visible at the bottom of the menu', async ({ screen }) => {
    await navigateToMenu(screen);
    await screen.getByText(/Shipping beyond/).scrollIntoViewIfNeeded();

    await expect(
      screen.getByText('* Shipping beyond 5 light-years distance might cost extra')
    ).toBeVisible();

    // Now we're at the bottom of the screen, let's scrollIntoViewIfNeeded by swiping down
    await screen.getByText("Green Salad").scrollIntoViewIfNeeded({ direction: "down" });
    await expect(screen.getByText("MAIN DISHES")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Account screen
// ---------------------------------------------------------------------------

test.describe('account', () => {
  test('profile shows user info, loyalty status, and stats', async ({ screen }) => {
    await openAccount(screen);

    await expect(screen.getByText('Hi Glorpax!')).toBeVisible();
    await expect(screen.getByText('Pro Cosmic Foodie 🌌')).toBeVisible();
    await expect(screen.getByText('My Account')).toBeVisible();
  });

  test('past orders total matches the displayed total spent (should fail)', async ({ screen }) => {
    await openAccount(screen);

    const priceElements = screen.getByText(/₭\d+\.\d+/);
    const count = await priceElements.count();

    // First price is the displayed total, rest are past orders
    const displayedTotal = parsePrice(await priceElements.nth(0).getText());
    let sum = 0;
    for (let i = 1; i < count; i++) {
      sum += parsePrice(await priceElements.nth(i).getText());
    }

    // The sum of past orders should equal the displayed total
    expect(sum).toBe(displayedTotal);
  });

});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

test.describe('coupons', () => {
  test('MARVIN coupon applies a ₭20 discount', async ({ screen }) => {
    await navigateToMenu(screen);
    await addItemToCart(screen, 'Ameglian Major Cow');  // ₭35.00
    await screen.getByText('View Order').tap();

    await screen.getByLabel('Coupon code').fill('MARVIN');
    await screen.getByText('Apply').tap();

    await expect(screen.getByText('-₭20.00')).toBeVisible();
    await expect(screen.getByText('₭15.00')).toBeVisible();  // 35 - 20
  });

  test('invalid coupon code shows an error', async ({ screen }) => {
    await navigateToMenu(screen);
    await addItemToCart(screen, 'Coffee');
    await screen.getByText('View Order').tap();

    await screen.getByLabel('Coupon code').fill('ZAPHOD');
    await screen.getByText('Apply').tap();

    await expect(screen.getByText('Invalid coupon code')).toBeVisible();
  });

  test('removing items after applying coupon causes negative total and crashes on checkout (should fail)', async ({ screen }) => {
    await navigateToMenu(screen);

    // Add items totalling more than the coupon value
    await addItemToCart(screen, 'Ameglian Major Cow');  // ₭35.00
    await expect(screen.getByText('MAIN DISHES')).toBeVisible();
    await addItemToCart(screen, 'Coffee');               // ₭4.50 — total ₭39.50

    await screen.getByText('View Order').tap();
    await expect(screen.getByText('₭39.50')).toBeVisible();

    // Apply coupon — total looks fine at ₭19.50
    await screen.getByLabel('Coupon code').fill('MARVIN');
    await screen.getByText('Apply').tap();
    await expect(screen.getByText('₭19.50')).toBeVisible();

    // Remove the expensive item — discount stays frozen at ₭20, total goes negative
    await screen.getByText('Ameglian Major Cow').swipe({ direction: 'left' });
    await screen.getByLabel('Delete').tap();

    // Total is now -₭15.50 (₭4.50 - ₭20.00)
    await expect(screen.getByText('₭-15.50')).toBeVisible();

    // Placing the order crashes the app
    await screen.getByLabel('Place Order').tap();
    await expect(screen.getByText(/minutes for delivery/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation & state
// ---------------------------------------------------------------------------

test.describe('navigation', () => {
  test('closing delivery returns to the welcome screen', async ({ screen }) => {
    await navigateToMenu(screen);
    await addItemToCart(screen, 'Soup of the Day');
    await screen.getByText('View Order').tap();
    await screen.getByLabel('Place Order').tap();

    // Verify we're on delivery
    await expect(screen.getByText(/is on its way/)).toBeVisible();

    // Close delivery
    await screen.getByLabel('Close').tap();

    // Should return to welcome
    await expect(screen.getByText('Welcome to Milliways')).toBeVisible();
    await expect(screen.getByLabel('New Order')).toBeVisible();
  });

  test('cart is cleared after completing an order', async ({ screen }) => {
    await navigateToMenu(screen);
    await addItemToCart(screen, 'Krikkit Fried Logic');
    await screen.getByText('View Order').tap();
    await screen.getByLabel('Place Order').tap();

    // Close delivery screen
    await screen.getByLabel('Close').tap();

    // Wait for welcome screen to appear after dismiss animation
    await expect(screen.getByText('Welcome to Milliways')).toBeVisible();

    // Start a new order — cart should be empty
    await screen.getByLabel('New Order').tap();
    await openCart(screen);
    await expect(screen.getByText('Your order is empty')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edit profile form
// ---------------------------------------------------------------------------

const GROOM_LAKE = { latitude: 37.2514326, longitude: -115.8452064 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

async function openEditProfile(screen: Screen) {
  await openAccount(screen);
  await screen.getByText('Edit Profile').tap();
  await expect(screen.getByLabel('Display name')).toBeVisible();
}

async function saveProfile(screen: Screen) {
  await screen.getByRole('button', { name: 'Save' }).tap();
  await expect(screen.getByText('My Account')).toBeVisible();
}

async function restartApp(device: Device, bundleId: string) {
  await device.terminateApp(bundleId);
  await device.launchApp(bundleId);
}

// tapping "Use my location" asks for permission first; returns that prompt, still open
async function askForMyLocation(screen: Screen): Promise<Dialog> {
  const permissionPrompt = screen.waitForEvent('dialog');
  await screen.getByText('Use my location').tap();
  return permissionPrompt;
}

function expectLocationPermissionPrompt(dialog: Dialog) {
  expect(dialog.type()).toBe('permission');
  expect(dialog.title()).toBe('Allow “Milliways” to use your location?');
  expect(dialog.message()).toBe('Milliways uses your location to plan delivery across the galaxy.');
  expect(dialog.buttons()).toEqual(['Allow Once', 'Allow While Using App', 'Don’t Allow']);
}

test.describe('edit profile', () => {
  test.beforeEach(async ({ device, bundleId }) => {
    // start every test from the default profile
    await device.terminateApp(bundleId!);
    await device.clearAppData(bundleId!);
    await device.launchApp(bundleId!);
  });

  test('form shows the default profile', async ({ screen }) => {
    await openEditProfile(screen);

    await expect(screen.getByLabel('Display name')).toHaveValue('Glorpax');
    await expect(screen.getByLabel('Email')).toHaveValue('glorpax@milliways.space');
    await expect(screen.getByRole('switch', { name: 'Galactic newsletter' })).not.toBeChecked();
    await expect(screen.getByRole('switch', { name: 'Babel fish translation' })).toBeChecked();
  });

  test('saving a new name updates the greeting', async ({ screen }) => {
    await openEditProfile(screen);

    await screen.getByLabel('Display name').fill('Zaphod');
    await saveProfile(screen);

    await expect(screen.getByText('Hi Zaphod!')).toBeVisible();
  });

  test('save is disabled while the email is empty', async ({ screen }) => {
    await openEditProfile(screen);

    await screen.getByLabel('Email').clear();

    await expect(screen.getByText('Email is required')).toBeVisible();
    await expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('profile survives an app restart', async ({ screen, device, bundleId }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Display name').fill('Trillian');
    await screen.getByLabel('Phone').fill('42424242');
    await screen.getByRole('switch', { name: 'Galactic newsletter' }).check();
    await screen.getByRole('switch', { name: 'Babel fish translation' }).uncheck();
    await saveProfile(screen);

    await restartApp(device, bundleId!);
    await openEditProfile(screen);

    await expect(screen.getByLabel('Display name')).toHaveValue('Trillian');
    await expect(screen.getByLabel('Phone')).toHaveValue('42424242');
    await expect(screen.getByRole('switch', { name: 'Galactic newsletter' })).toBeChecked();
    await expect(screen.getByRole('switch', { name: 'Babel fish translation' })).not.toBeChecked();
  });

  test('leaving without saving keeps the old profile', async ({ screen }) => {
    await openEditProfile(screen);

    await screen.getByLabel('Display name').fill('Arthur');
    await screen.getByRole('button', { name: 'My Account' }).tap();

    await expect(screen.getByText('Hi Glorpax!')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Delivery location
// ---------------------------------------------------------------------------

test.describe('delivery location', () => {
  test.beforeEach(async ({ device, bundleId }) => {
    // clearing app data also resets the location permission, so the prompt shows every time
    await device.terminateApp(bundleId!);
    await device.clearAppData(bundleId!);
    await device.launchApp(bundleId!);
  });

  test('anywhere on Earth warns that couriers are busy', async ({ screen, device }) => {
    await device.setGeolocation(LONDON);
    await openEditProfile(screen);

    const permissionPrompt = await askForMyLocation(screen);
    expectLocationPermissionPrompt(permissionPrompt);
    const deliveryAlert = screen.waitForEvent('dialog');
    await permissionPrompt.accept();

    const alert = await deliveryAlert;
    expect(alert.type()).toBe('alert');
    expect(alert.title()).toBe('Delivering to Earth');
    expect(alert.message()).toBe('Delivering to Earth might take more time than usual, our couriers are busy');
    await alert.accept();
    await expect(screen.getByText('Use my location')).toBeVisible();
  });

  test('Groom Lake gets a happy hour', async ({ screen, device }) => {
    await device.setGeolocation(GROOM_LAKE);
    await openEditProfile(screen);

    const permissionPrompt = await askForMyLocation(screen);
    const deliveryAlert = screen.waitForEvent('dialog');
    await permissionPrompt.accept();

    const alert = await deliveryAlert;
    expect(alert.title()).toBe('Groom Lake Happy Hour!');
    expect(alert.message()).toBe('');
  });
});
