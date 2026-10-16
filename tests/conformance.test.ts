/**
 * Mobilewright conformance suite — exercises every public mobilewright API against Milliways.
 * For a readable example of mobilewright, see milliways.test.ts instead.
 *
 * Run:
 *   npx mobilewright test conformance.test.ts
 */

import { test, expect } from '@mobilewright/test';
import type { Device, Locator, Screen } from '@mobilewright/core';
import { existsSync, readFileSync } from 'node:fs';

type Point = { x: number; y: number };

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const MILLIWAYS_README = 'https://github.com/mobile-next/Milliways/blob/main/README.md';
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openMenu(screen: Screen) {
  await screen.getByLabel('New Order').tap();
  await expect(screen.getByText('MAIN DISHES')).toBeVisible();
}

async function openMenuItem(screen: Screen, name: string) {
  await openMenu(screen);
  await screen.getByText(name).scrollIntoViewIfNeeded();
  await screen.getByText(name).tap();
  await expect(screen.getByLabel('Add to Order')).toBeVisible();
}

async function openCartWithCoffee(screen: Screen) {
  await openMenuItem(screen, 'Coffee');
  await screen.getByLabel('Add to Order').tap();
  await screen.getByText('View Order').tap();
  await expect(screen.getByLabel('Place Order')).toBeVisible();
}

async function openAccount(screen: Screen) {
  await screen.getByLabel('person.circle').tap();
  await expect(screen.getByText('My Account')).toBeVisible();
}

async function openEditProfile(screen: Screen) {
  await openAccount(screen);
  await screen.getByText('Edit Profile').tap();
  await expect(screen.getByLabel('Display name')).toBeVisible();
}

async function openReadme(screen: Screen) {
  await openAccount(screen);
  await screen.getByText('README').tap();
  await expect(screen.getByWebView()).toBeVisible();
}

async function relaunchAppWithCleanData(device: Device, bundleId: string) {
  await device.terminateApp(bundleId);
  await device.clearAppData(bundleId);
  await device.launchApp(bundleId);
}

async function centerOf(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function quantity(screen: Screen): Locator {
  return screen.getByTestId('quantity-value');
}

// mobilewright's expect has no .rejects, so catch the error ourselves
async function expectToThrow(action: Promise<unknown>) {
  let didThrow = false;
  try {
    await action;
  } catch {
    didThrow = true;
  }
  expect(didThrow).toBe(true);
}

// iOS asks "Open in Milliways?" only until the user accepts it once
function acceptOpenInMilliwaysIfAsked(screen: Screen) {
  screen.once('dialog', async (dialog) => {
    await dialog.tap('Open');
  });
}

function startsWith(buffer: Buffer, magic: number[]): boolean {
  return magic.every((byte, i) => buffer[i] === byte);
}

// ---------------------------------------------------------------------------
// getByText
// ---------------------------------------------------------------------------

test.describe('getByText', () => {
  test('matches a complete string', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('Ameglian Major Cow')).toBeVisible();
  });

  test('matches a complete string with exact: true', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('Ameglian Major Cow', { exact: true })).toBeVisible();
  });

  test('is case sensitive by default', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('ameglian major cow')).toHaveCount(0);
  });

  test('does not match a partial string by default', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('Ameglian')).toHaveCount(0);
  });

  test('matches a partial string with exact: false', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('Major Cow', { exact: false })).toBeVisible();
  });

  test('is case insensitive with exact: false', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('AMEGLIAN MAJOR COW', { exact: false })).toBeVisible();
  });

  test('matches a partial, case insensitive string with exact: false', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('major c', { exact: false })).toBeVisible();
  });

  test('matches a partial regex', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText(/Major Cow/)).toBeVisible();
  });

  test('matches an anchored regex for the complete string', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText(/^Ameglian Major Cow$/)).toBeVisible();
  });

  test('regex is case sensitive without the i flag', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText(/^ameglian major cow$/)).toHaveCount(0);
  });

  test('regex is case insensitive with the i flag', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText(/^AMEGLIAN MAJOR COW$/i)).toBeVisible();
  });

  test('regex with character classes matches several elements', async ({ screen }) => {
    await openMenu(screen);
    // ₭35.00 and ₭38.00
    await expect(screen.getByText(/^₭3\d\.\d{2}$/)).toHaveCount(2);
  });

  test('regex with alternation', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText(/^(MAIN DISHES|DRINKS)$/)).toHaveCount(2);
  });

  test('matches a non-ascii currency sign', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('₭35.00')).toBeVisible();
  });

  test('matches an emoji', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText('Pro Cosmic Foodie 🌌')).toBeVisible();
  });

  test('matches an apostrophe', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText("Today's special soup, ingredients vary by solar system")).toBeVisible();
  });

  test('matches a multiplication sign', async ({ screen }) => {
    await openCartWithCoffee(screen);
    await expect(screen.getByText('1 × ₭4.50')).toBeVisible();
  });

  test('matches superscript digits', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText(/10⁸⁰⁰⁰⁰⁰/)).toHaveCount(1);
  });

  test('matches a minus sign that is not a hyphen', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    await expect(screen.getByText('−')).toBeVisible();
    await expect(screen.getByText('-')).toHaveCount(0);
  });

  test('finds nothing for text that is not on screen', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('Vogon Poetry')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// getByLabel, getByPlaceholder, getByTestId, getByType, getByRole
// ---------------------------------------------------------------------------

test.describe('getByLabel', () => {
  test('matches a complete label', async ({ screen }) => {
    await expect(screen.getByLabel('New Order')).toBeVisible();
  });

  test('is case sensitive by default', async ({ screen }) => {
    await expect(screen.getByLabel('new order')).toHaveCount(0);
  });

  test('does not match a partial label by default', async ({ screen }) => {
    await expect(screen.getByLabel('New')).toHaveCount(0);
  });

  test('matches a partial, case insensitive label with exact: false', async ({ screen }) => {
    await expect(screen.getByLabel('new ORD', { exact: false })).toBeVisible();
  });

  test('matches an SF Symbol label', async ({ screen }) => {
    await expect(screen.getByLabel('person.circle')).toBeVisible();
  });

  test('matches a text field by its label', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByLabel('Email')).toHaveValue('glorpax@milliways.space');
  });
});

test.describe('getByPlaceholder', () => {
  test('matches a complete placeholder', async ({ screen }) => {
    await openCartWithCoffee(screen);
    await expect(screen.getByPlaceholder('Coupon code')).toBeVisible();
  });

  test('is case sensitive by default', async ({ screen }) => {
    await openCartWithCoffee(screen);
    await expect(screen.getByPlaceholder('coupon code')).toHaveCount(0);
  });

  test('matches a partial, case insensitive placeholder with exact: false', async ({ screen }) => {
    await openCartWithCoffee(screen);
    await expect(screen.getByPlaceholder('COUPON', { exact: false })).toBeVisible();
  });

  test('finds a text field that already has a value', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByPlaceholder('Display name')).toHaveValue('Glorpax');
  });
});

test.describe('getByTestId', () => {
  test('finds the quantity buttons and value', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    await expect(screen.getByTestId('quantity-decrease')).toBeVisible();
    await expect(screen.getByTestId('quantity-increase')).toBeVisible();
    await expect(quantity(screen)).toHaveText('1');
  });

  test('taps by test id', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    await screen.getByTestId('quantity-increase').tap();
    await screen.getByTestId('quantity-increase').tap();
    await screen.getByTestId('quantity-decrease').tap();
    await expect(quantity(screen)).toHaveText('2');
  });

  test('finds an SF Symbol identifier', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByTestId('cart')).toBeVisible();
  });

  test('does not match a partial test id', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    await expect(screen.getByTestId('quantity')).toHaveCount(0);
  });
});

test.describe('getByType', () => {
  test('finds text fields', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByType('TextField')).toHaveCount(3);
  });

  test('is case insensitive', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByType('textfield')).toHaveCount(3);
  });

  test('finds buttons', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    // close, −, +, Add to Order
    await expect(screen.getByType('Button')).toHaveCount(4);
  });
});

test.describe('getByRole', () => {
  test('finds a button by its complete name', async ({ screen }) => {
    await expect(screen.getByRole('button', { name: 'New Order' })).toBeVisible();
  });

  test('does not match a partial name string', async ({ screen }) => {
    await expect(screen.getByRole('button', { name: 'New' })).toHaveCount(0);
  });

  test('finds a button by a partial regex name', async ({ screen }) => {
    await expect(screen.getByRole('button', { name: /Order/ })).toBeVisible();
  });

  test('finds a button by a case insensitive regex name', async ({ screen }) => {
    await expect(screen.getByRole('button', { name: /^new order$/i })).toBeVisible();
  });

  test('role name is case sensitive', async ({ screen }) => {
    await expect(screen.getByRole('button', { name: 'new order' })).toHaveCount(0);
  });

  test('finds text fields', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByRole('textfield')).toHaveCount(3);
    await expect(screen.getByRole('textfield', { name: 'Phone' })).toBeEmpty();
  });

  test('finds switches', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByRole('switch', { name: 'Babel fish translation' })).toBeChecked();
  });

  test('finds images', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByRole('image', { name: 'Avatar' })).toBeVisible();
  });

  test('finds static text', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByRole('text', { name: 'Hi Glorpax!' })).toBeVisible();
  });

  test('finds the navigation bar as a header', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByRole('header')).toHaveCount(1);
  });

  test('finds an alert', async ({ screen }) => {
    await openMenuItem(screen, 'Dark Matter Martini');
    await screen.getByLabel('Add to Order').tap();
    await expect(screen.getByRole('alert')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Locator composition
// ---------------------------------------------------------------------------

test.describe('locator composition', () => {
  test('chains a locator inside another', async ({ screen }) => {
    await openEditProfile(screen);
    const newsletter = screen.getByRole('switch', { name: 'Galactic newsletter' });
    await expect(newsletter.getByText('Galactic newsletter')).toBeVisible();
  });

  test('filter by hasText string', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByRole('button').filter({ hasText: 'README' })).toHaveCount(1);
  });

  test('filter by hasText regex', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByRole('button').filter({ hasText: /^(README|Edit Profile)$/ })).toHaveCount(2);
  });

  test('filter by hasNotText', async ({ screen }) => {
    await openAccount(screen);
    const listButtons = screen.getByRole('button').filter({ has: screen.getByTestId('chevron.forward') });
    await expect(listButtons.filter({ hasNotText: 'README' })).toHaveText('Edit Profile');
  });

  test('filter by has', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByRole('button').filter({ has: screen.getByTestId('chevron.forward') })).toHaveCount(2);
  });

  test('filter by hasNot', async ({ screen }) => {
    await openAccount(screen);
    const buttons = screen.getByRole('button');
    const total = await buttons.count();
    await expect(buttons.filter({ hasNot: screen.getByTestId('chevron.forward') })).toHaveCount(total - 2);
  });

  test('and matches elements satisfying both locators', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    // "Coffee" is both the title and the image label
    await expect(screen.getByText('Coffee')).toHaveCount(2);
    await expect(screen.getByText('Coffee').and(screen.getByRole('image'))).toHaveCount(1);
  });

  test('or matches elements satisfying either locator', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('MAIN DISHES').or(screen.getByText('DRINKS'))).toHaveCount(2);
  });

  test('or works when only one side exists', async ({ screen }) => {
    await openMenu(screen);
    await expect(screen.getByText('MAIN DISHES').or(screen.getByText('DESSERTS'))).toHaveCount(1);
  });

  test('first, last and nth pick by document order', async ({ screen }) => {
    await openAccount(screen);
    const pastOrderDates = screen.getByText(/, 2065$/);
    await expect(pastOrderDates).toHaveCount(3);
    await expect(pastOrderDates.first()).toHaveText('Feb 17, 2065');
    await expect(pastOrderDates.nth(1)).toHaveText('Jun 3, 2065');
    await expect(pastOrderDates.last()).toHaveText('Oct 12, 2065');
  });

  test('nth with a negative index counts from the end', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/, 2065$/).nth(-1)).toHaveText('Oct 12, 2065');
  });

  test('nth out of range finds nothing', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/, 2065$/).nth(3)).toHaveCount(0);
  });

  test('count returns the number of matches', async ({ screen }) => {
    await openAccount(screen);
    expect(await screen.getByText('Delivered across the galaxy').count()).toBe(3);
  });

  test('all returns one locator per match', async ({ screen }) => {
    await openAccount(screen);
    const dates = await screen.getByText(/, 2065$/).all();
    const texts = [];
    for (const date of dates) {
      texts.push(await date.getText());
    }
    expect(texts).toEqual(['Feb 17, 2065', 'Jun 3, 2065', 'Oct 12, 2065']);
  });

  test('exists is true for a present element and false for a missing one', async ({ screen }) => {
    expect(await screen.getByLabel('New Order').exists()).toBe(true);
    expect(await screen.getByLabel('Old Order').exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Locator actions
// ---------------------------------------------------------------------------

test.describe('locator actions', () => {
  test('tap', async ({ screen }) => {
    await screen.getByLabel('New Order').tap();
    await expect(screen.getByText('MAIN DISHES')).toBeVisible();
  });

  test('doubleTap taps twice', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    await screen.getByTestId('quantity-increase').doubleTap();
    await expect(quantity(screen)).toHaveText('3');
  });

  test('longPress on a home screen icon opens its context menu, by locator and at coordinates', async ({ screen }) => {
    await screen.pressButton('HOME');
    // the dock shows on every home screen page
    const safari = screen.getByLabel('Safari');
    const editHomeScreen = screen.getByText('Edit Home Screen');

    await safari.longPress({ duration: 1000 });
    await expect(editHomeScreen).toBeVisible();
    await screen.pressButton('HOME');
    await expect(editHomeScreen).toBeHidden();

    const center = await centerOf(safari);
    await screen.longPress(center.x, center.y, 1000);
    await expect(editHomeScreen).toBeVisible();
    await screen.pressButton('HOME');
    await expect(editHomeScreen).toBeHidden();
  });

  test('fill replaces the existing text', async ({ screen }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Display name').fill('Zaphod');
    await expect(screen.getByLabel('Display name')).toHaveValue('Zaphod');
  });

  test('fill types non-ascii text', async ({ screen }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Display name').fill('Zaphod Beeblebrox ₭ 🌌');
    await expect(screen.getByLabel('Display name')).toHaveValue('Zaphod Beeblebrox ₭ 🌌');
  });

  test('fill an empty field', async ({ screen }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Phone').fill('42424242');
    await expect(screen.getByLabel('Phone')).toHaveValue('42424242');
  });

  test('clear empties a text field', async ({ screen }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Email').clear();
    await expect(screen.getByLabel('Email')).toBeEmpty();
    await expect(screen.getByText('Email is required')).toBeVisible();
  });

  test('check and uncheck switches', async ({ screen }) => {
    await openEditProfile(screen);
    const newsletter = screen.getByRole('switch', { name: 'Galactic newsletter' });
    await newsletter.check();
    await expect(newsletter).toBeChecked();
    await newsletter.uncheck();
    await expect(newsletter).not.toBeChecked();
  });

  test('check is a no-op on an already checked switch', async ({ screen }) => {
    await openEditProfile(screen);
    const babelFish = screen.getByRole('switch', { name: 'Babel fish translation' });
    await babelFish.check();
    await expect(babelFish).toBeChecked();
  });

  test('setChecked', async ({ screen }) => {
    await openEditProfile(screen);
    const babelFish = screen.getByRole('switch', { name: 'Babel fish translation' });
    await babelFish.setChecked(false);
    await expect(babelFish).not.toBeChecked();
    await babelFish.setChecked(true);
    await expect(babelFish).toBeChecked();
  });

  test('swipe left on a list row reveals delete', async ({ screen }) => {
    await openCartWithCoffee(screen);
    await screen.getByText('1 × ₭4.50').swipe({ direction: 'left' });
    await screen.getByLabel('Delete').tap();
    await expect(screen.getByText('View Order')).toBeHidden();
    await screen.getByLabel('Shopping Cart').tap();
    await expect(screen.getByText('Your order is empty')).toBeVisible();
  });

  test('scrollIntoViewIfNeeded scrolls down to an element', async ({ screen }) => {
    await openMenu(screen);
    await screen.getByText(/Shipping beyond/).scrollIntoViewIfNeeded();
    await expect(screen.getByText(/Shipping beyond/)).toBeVisible();
  });

  test('scrollIntoViewIfNeeded scrolls back up with direction: down', async ({ screen }) => {
    await openMenu(screen);
    await screen.getByText(/Shipping beyond/).scrollIntoViewIfNeeded();
    await screen.getByText('Ameglian Major Cow').scrollIntoViewIfNeeded({ direction: 'down' });
    await expect(screen.getByText('Ameglian Major Cow')).toBeVisible();
  });

  test('scrollIntoViewIfNeeded with maxSwipes', async ({ screen }) => {
    await openMenu(screen);
    await screen.getByText('Dark Matter Martini').scrollIntoViewIfNeeded({ maxSwipes: 5 });
    await expect(screen.getByText('Dark Matter Martini')).toBeVisible();
  });

  test('locator screenshot is a png', async ({ screen }) => {
    const png = await screen.getByLabel('New Order').screenshot();
    expect(startsWith(png, PNG_MAGIC)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Locator queries
// ---------------------------------------------------------------------------

test.describe('locator queries', () => {
  test('getText reads a label', async ({ screen }) => {
    await openAccount(screen);
    expect(await screen.getByText(/^Hi /).getText()).toBe('Hi Glorpax!');
  });

  test('getValue reads a text field', async ({ screen }) => {
    await openEditProfile(screen);
    expect(await screen.getByLabel('Email').getValue()).toBe('glorpax@milliways.space');
  });

  test('getValue of an empty text field is empty', async ({ screen }) => {
    await openEditProfile(screen);
    expect(await screen.getByLabel('Phone').getValue()).toBe('');
  });

  test('isVisible', async ({ screen }) => {
    expect(await screen.getByLabel('New Order').isVisible()).toBe(true);
  });

  test('isEnabled is false for a disabled button', async ({ screen }) => {
    await openEditProfile(screen);
    const save = screen.getByRole('button', { name: 'Save' });
    expect(await save.isEnabled()).toBe(true);
    await screen.getByLabel('Email').clear();
    await expect(save).toBeDisabled();
    expect(await save.isEnabled()).toBe(false);
  });

  test('isChecked', async ({ screen }) => {
    await openEditProfile(screen);
    expect(await screen.getByRole('switch', { name: 'Babel fish translation' }).isChecked()).toBe(true);
    expect(await screen.getByRole('switch', { name: 'Galactic newsletter' }).isChecked()).toBe(false);
  });

  test('isSelected is false for a plain button', async ({ screen }) => {
    expect(await screen.getByLabel('New Order').isSelected()).toBe(false);
  });

  test('isFocused is true for the text field being edited', async ({ screen }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Email').tap();
    expect(await screen.getByLabel('Email').isFocused()).toBe(true);
    expect(await screen.getByLabel('Display name').isFocused()).toBe(false);
  });

  test('boundingBox is inside the screen', async ({ screen, device }) => {
    const size = await device.screenSize();
    const box = await screen.getByLabel('New Order').boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
  });

  test('waitFor visible', async ({ screen }) => {
    await screen.getByLabel('New Order').tap();
    await screen.getByText('MAIN DISHES').waitFor({ state: 'visible' });
  });

  test('waitFor hidden', async ({ screen }) => {
    await screen.getByLabel('New Order').tap();
    await screen.getByText('Welcome to Milliways').waitFor({ state: 'hidden' });
  });

  test('waitFor disabled and enabled', async ({ screen }) => {
    await openEditProfile(screen);
    const save = screen.getByRole('button', { name: 'Save' });
    await screen.getByLabel('Email').clear();
    await save.waitFor({ state: 'disabled' });
    await screen.getByLabel('Email').fill('glorpax@milliways.space');
    await save.waitFor({ state: 'enabled' });
  });

  test('waitFor times out for an element that never shows', async ({ screen }) => {
    await expectToThrow(screen.getByText('Vogon Poetry').waitFor({ timeout: 1000 }));
  });

  test('tap times out for an element that never shows', async ({ screen }) => {
    await expectToThrow(screen.getByText('Vogon Poetry').tap({ timeout: 1000 }));
  });
});

// ---------------------------------------------------------------------------
// expect matchers
// ---------------------------------------------------------------------------

test.describe('expect matchers', () => {
  test('toBeVisible and not.toBeVisible', async ({ screen }) => {
    await expect(screen.getByLabel('New Order')).toBeVisible();
    await expect(screen.getByLabel('Old Order')).not.toBeVisible();
  });

  test('toBeHidden', async ({ screen }) => {
    await expect(screen.getByText('MAIN DISHES')).toBeHidden();
  });

  test('toBeEnabled and toBeDisabled', async ({ screen }) => {
    await openEditProfile(screen);
    const save = screen.getByRole('button', { name: 'Save' });
    await expect(save).toBeEnabled();
    await screen.getByLabel('Display name').clear();
    await expect(save).toBeDisabled();
    await expect(save).not.toBeEnabled();
  });

  test('toBeChecked and not.toBeChecked', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByRole('switch', { name: 'Babel fish translation' })).toBeChecked();
    await expect(screen.getByRole('switch', { name: 'Galactic newsletter' })).not.toBeChecked();
  });

  test('not.toBeSelected', async ({ screen }) => {
    await expect(screen.getByLabel('New Order')).not.toBeSelected();
  });

  test('toBeFocused', async ({ screen }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Phone').tap();
    await expect(screen.getByLabel('Phone')).toBeFocused();
    await expect(screen.getByLabel('Email')).not.toBeFocused();
  });

  test('toHaveText with a complete string', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toHaveText('Hi Glorpax!');
  });

  test('toHaveText does not match a partial string', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).not.toHaveText('Glorpax');
  });

  test('toHaveText is case sensitive by default', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).not.toHaveText('hi glorpax!');
  });

  test('toHaveText with ignoreCase', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toHaveText('HI GLORPAX!', { ignoreCase: true });
  });

  test('toHaveText with a regex', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toHaveText(/^Hi \w+!$/);
  });

  test('toHaveText with a case insensitive regex', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toHaveText(/glorpax/i);
  });

  test('toContainText with a partial string', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toContainText('Glorpax');
  });

  test('toContainText is case sensitive by default', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).not.toContainText('glorpax');
  });

  test('toContainText with ignoreCase', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toContainText('GLORPAX', { ignoreCase: true });
  });

  test('toContainText with a regex', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText(/^Hi /)).toContainText(/Glor\w+/);
  });

  test('toHaveCount', async ({ screen }) => {
    await openAccount(screen);
    await expect(screen.getByText('Delivered across the galaxy')).toHaveCount(3);
    await expect(screen.getByText('Delivered across the galaxy')).not.toHaveCount(2);
  });

  test('toBeEmpty and not.toBeEmpty', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByLabel('Phone')).toBeEmpty();
    await expect(screen.getByLabel('Email')).not.toBeEmpty();
  });

  test('toHaveValue with a complete string', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByLabel('Email')).toHaveValue('glorpax@milliways.space');
  });

  test('toHaveValue does not match a partial string', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByLabel('Email')).not.toHaveValue('glorpax');
  });

  test('toHaveValue with a regex', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByLabel('Email')).toHaveValue(/@milliways\.space$/);
  });

  test('toHaveValue with a case insensitive regex', async ({ screen }) => {
    await openEditProfile(screen);
    await expect(screen.getByLabel('Email')).toHaveValue(/^GLORPAX@/i);
  });

  test('assertion with a custom timeout fails fast', async ({ screen }) => {
    await expectToThrow(expect(screen.getByText('Vogon Poetry')).toBeVisible({ timeout: 1000 }));
  });

  test('expect.soft keeps the test running', async ({ screen }) => {
    await expect.soft(screen.getByLabel('New Order')).toBeVisible();
    await expect(screen.getByText('Welcome to Milliways')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

test.describe('screen', () => {
  test('tap at coordinates', async ({ screen }) => {
    const center = await centerOf(screen.getByLabel('New Order'));
    await screen.tap(center.x, center.y);
    await expect(screen.getByText('MAIN DISHES')).toBeVisible();
  });

  test('doubleTap at coordinates', async ({ screen }) => {
    await openMenuItem(screen, 'Coffee');
    const plus = await centerOf(screen.getByTestId('quantity-increase'));
    await screen.doubleTap(plus.x, plus.y);
    await expect(quantity(screen)).toHaveText('3');
  });

  test('swipe up scrolls the menu', async ({ screen }) => {
    await openMenu(screen);
    await screen.swipe('up');
    await screen.swipe('up');
    await expect(screen.getByText('Ameglian Major Cow')).not.toBeVisible();
  });

  test('swipe with distance and duration', async ({ screen }) => {
    await openMenu(screen);
    await screen.swipe('up', { distance: 300, duration: 300 });
    await screen.swipe('down', { distance: 600, duration: 300 });
    await expect(screen.getByText('Ameglian Major Cow')).toBeVisible();
  });

  test('gesture with a single pointer drags the menu', async ({ screen, device }) => {
    await openMenu(screen);
    const { width, height } = await device.screenSize();
    await screen.gesture({
      pointers: [[
        { x: width / 2, y: height * 0.8, time: 0 },
        { x: width / 2, y: height * 0.2, time: 300 },
      ]],
    });
    await expect(screen.getByText('Ameglian Major Cow')).not.toBeVisible();
  });

  // iOS has no back button
  test('goBack is not supported on iOS', async ({ screen }) => {
    await expect(screen.goBack()).rejects.toThrow('unsupported button: BACK');
  });

  test('pressButton HOME leaves the app', async ({ screen, device, bundleId }) => {
    await screen.pressButton('HOME');
    // the app leaves the foreground after pressButton returns, so read it until it does
    await expect.poll(async () => (await device.getForegroundApp()).bundleId).not.toBe(bundleId);
  });

  test('viewTree returns the hierarchy', async ({ screen }) => {
    const tree = await screen.viewTree();
    expect(JSON.stringify(tree)).toContain('Welcome to Milliways');
  });

  test('screenshot as png', async ({ screen }) => {
    expect(startsWith(await screen.screenshot(), PNG_MAGIC)).toBe(true);
  });

  test('screenshot as jpeg with quality', async ({ screen }) => {
    expect(startsWith(await screen.screenshot({ format: 'jpeg', quality: 50 }), JPEG_MAGIC)).toBe(true);
  });

  test('screenshot with scale is smaller', async ({ screen }) => {
    const full = await screen.screenshot();
    const half = await screen.screenshot({ scale: 0.5 });
    expect(half.length).toBeLessThan(full.length);
  });

  test('screenshot with clip', async ({ screen }) => {
    const full = await screen.screenshot();
    const clipped = await screen.screenshot({ clip: await screen.getByLabel('New Order').boundingBox() });
    expect(clipped.length).toBeLessThan(full.length);
  });

  test('screenshot to a path', async ({ screen }, testInfo) => {
    const path = testInfo.outputPath('screen.png');
    await screen.screenshot({ path });
    expect(existsSync(path)).toBe(true);
    expect(startsWith(readFileSync(path), PNG_MAGIC)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

test.describe('dialogs', () => {
  async function askForMartini(screen: Screen) {
    await openMenuItem(screen, 'Dark Matter Martini');
    await screen.getByLabel('Add to Order').tap();
  }

  test('waitForEvent reads title, message and buttons', async ({ screen }) => {
    await openMenuItem(screen, 'Dark Matter Martini');
    const ageCheck = screen.waitForEvent('dialog');
    await screen.getByLabel('Add to Order').tap();
    const dialog = await ageCheck;
    expect(dialog.type()).toBe('confirm');
    expect(dialog.isSystem()).toBe(false);
    expect(dialog.title()).toBe('You must be 18 or older to order a Dark Matter Martini');
    expect(dialog.message()).toBe('');
    expect(dialog.buttons()).toEqual(['Cancel', "I'm 18 or older"]);
    await dialog.dismiss();
  });

  test('dismiss taps the cancel button', async ({ screen }) => {
    await openMenuItem(screen, 'Dark Matter Martini');
    const ageCheck = screen.waitForEvent('dialog');
    await screen.getByLabel('Add to Order').tap();
    await (await ageCheck).dismiss();
    await expect(screen.getByLabel('Add to Order')).toBeVisible();
  });

  test('tap a button by name', async ({ screen }) => {
    await openMenuItem(screen, 'Dark Matter Martini');
    const ageCheck = screen.waitForEvent('dialog');
    await screen.getByLabel('Add to Order').tap();
    await (await ageCheck).tap("I'm 18 or older");
    await expect(screen.getByText('1 items')).toBeVisible();
  });

  test('waitForEvent with a predicate', async ({ screen }) => {
    await openMenuItem(screen, 'Dark Matter Martini');
    const ageCheck = screen.waitForEvent('dialog', (dialog) => dialog.title().includes('18 or older'));
    await screen.getByLabel('Add to Order').tap();
    await (await ageCheck).dismiss();
  });

  test('waitForEvent with predicate and timeout options', async ({ screen }) => {
    await openMenuItem(screen, 'Dark Matter Martini');
    const ageCheck = screen.waitForEvent('dialog', { predicate: (dialog) => dialog.type() === 'confirm', timeout: 10_000 });
    await screen.getByLabel('Add to Order').tap();
    await (await ageCheck).dismiss();
  });

  test('waitForEvent times out when no dialog shows', async ({ screen }) => {
    await expectToThrow(screen.waitForEvent('dialog', { timeout: 1000 }));
  });

  test('on handles every dialog', async ({ screen }) => {
    const titles: string[] = [];
    screen.on('dialog', async (dialog) => {
      titles.push(dialog.title());
      await dialog.dismiss();
    });
    await askForMartini(screen);
    await expect(screen.getByLabel('Add to Order')).toBeVisible();
    await screen.getByLabel('Add to Order').tap();
    await expect(screen.getByLabel('Add to Order')).toBeVisible();
    expect(titles).toEqual([
      'You must be 18 or older to order a Dark Matter Martini',
      'You must be 18 or older to order a Dark Matter Martini',
    ]);
  });

  test('once handles only the first dialog', async ({ screen }) => {
    let handled = 0;
    screen.once('dialog', async (dialog) => {
      handled++;
      await dialog.dismiss();
    });
    await askForMartini(screen);
    await expect(screen.getByLabel('Add to Order')).toBeVisible();
    const second = screen.waitForEvent('dialog');
    await screen.getByLabel('Add to Order').tap();
    await (await second).dismiss();
    expect(handled).toBe(1);
  });

  test('off removes a handler', async ({ screen }) => {
    let handled = 0;
    const handler = async () => {
      handled++;
    };
    screen.on('dialog', handler);
    screen.off('dialog', handler);
    await openMenuItem(screen, 'Dark Matter Martini');
    const ageCheck = screen.waitForEvent('dialog');
    await screen.getByLabel('Add to Order').tap();
    await (await ageCheck).dismiss();
    expect(handled).toBe(0);
  });

  test('system permission prompt', async ({ screen, device, bundleId }) => {
    await relaunchAppWithCleanData(device, bundleId!);
    await device.setGeolocation(LONDON);
    await openEditProfile(screen);
    const permissionPrompt = screen.waitForEvent('dialog');
    await screen.getByText('Use my location').tap();
    const prompt = await permissionPrompt;
    expect(prompt.type()).toBe('permission');
    expect(prompt.isSystem()).toBe(true);
    expect(prompt.message()).toBe('Milliways uses your location to plan delivery across the galaxy.');
    await prompt.dismiss();
    await expect(screen.getByText("Couldn't get your location")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Web view
// ---------------------------------------------------------------------------

test.describe('web view', () => {
  test('getByWebView finds the web view', async ({ screen }) => {
    await openReadme(screen);
    await expect(screen.getByWebView()).toHaveCount(1);
  });

  test('native locators see inside the web view', async ({ screen }) => {
    await openReadme(screen);
    await expect(screen.getByWebView().getByText('Milliways Demo App')).toBeVisible({ timeout: 20_000 });
  });

  test('page reports url and title', async ({ screen }) => {
    await openReadme(screen);
    const page = await screen.getByWebView().page();
    await expect(page).toHaveURL(MILLIWAYS_README);
    await expect(page).toHaveURL(/README\.md$/);
    await expect(page).toHaveTitle(/Milliways/);
    expect(await page.title()).toContain('README');
  });

  test('page locators and web matchers', async ({ screen }) => {
    await openReadme(screen);
    const page = await screen.getByWebView().page();
    await expect(page.getByRole('heading', { name: 'Milliways Demo App' })).toBeVisible();
    await expect(page.getByText('Milliways Demo App', { exact: true }).first()).toBeAttached();
    await expect(page.getByRole('link', { name: 'Mobilewright' }).first()).toHaveAttribute('href', /mobilewright/);
    await expect(page.locator('article h1')).toHaveText('Milliways Demo App');
    await expect(page.locator('article h1')).toContainText('Demo');
  });

  test('page evaluate runs javascript', async ({ screen }) => {
    await openReadme(screen);
    const page = await screen.getByWebView().page();
    expect(await page.evaluate(() => document.location.hostname)).toBe('github.com');
  });

  test('page navigation', async ({ screen }) => {
    await openReadme(screen);
    const page = await screen.getByWebView().page();
    await page.goto('https://github.com/mobile-next/Milliways');
    await page.waitForURL(/Milliways$/);
    await page.goBack();
    await expect(page).toHaveURL(MILLIWAYS_README);
  });
});

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------

test.describe('device', () => {
  test('screenSize', async ({ device }) => {
    const size = await device.screenSize();
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(size.width);
    expect(size.scale).toBeGreaterThanOrEqual(1);
  });

  test('getOrientation and setOrientation', async ({ device }) => {
    expect(await device.getOrientation()).toBe('portrait');
    try {
      await device.setOrientation('landscape');
      expect(await device.getOrientation()).toBe('landscape');
    } finally {
      await device.setOrientation('portrait');
    }
  });

  test('getForegroundApp is the app under test', async ({ device, bundleId }) => {
    expect((await device.getForegroundApp()).bundleId).toBe(bundleId);
  });

  test('listApps includes the app under test', async ({ device, bundleId }) => {
    const bundleIds = (await device.listApps()).map((app) => app.bundleId);
    expect(bundleIds).toContain(bundleId);
  });

  test('terminateApp and launchApp', async ({ screen, device, bundleId }) => {
    await screen.getByLabel('New Order').tap();
    await device.terminateApp(bundleId!);
    await device.launchApp(bundleId!);
    await expect(screen.getByText('Welcome to Milliways')).toBeVisible();
  });

  test('clearAppData resets the saved profile', async ({ screen, device, bundleId }) => {
    await openEditProfile(screen);
    await screen.getByLabel('Display name').fill('Trillian');
    await screen.getByRole('button', { name: 'Save' }).tap();
    await expect(screen.getByText('Hi Trillian!')).toBeVisible();
    await relaunchAppWithCleanData(device, bundleId!);
    await openAccount(screen);
    await expect(screen.getByText('Hi Glorpax!')).toBeVisible();
  });

  test('openUrl opens a deep link', async ({ screen, device }) => {
    acceptOpenInMilliwaysIfAsked(screen);
    await device.openUrl('milliways://account');
    await expect(screen.getByText('My Account')).toBeVisible();
  });

  test('goto is an alias for openUrl', async ({ screen, device }) => {
    acceptOpenInMilliwaysIfAsked(screen);
    await device.goto('milliways://account');
    await expect(screen.getByText('My Account')).toBeVisible();
  });

  test('setGeolocation drives the app location', async ({ screen, device, bundleId }) => {
    await relaunchAppWithCleanData(device, bundleId!);
    await device.setGeolocation(LONDON);
    await openEditProfile(screen);
    const permissionPrompt = screen.waitForEvent('dialog');
    await screen.getByText('Use my location').tap();
    const prompt = await permissionPrompt;
    const deliveryAlert = screen.waitForEvent('dialog');
    await prompt.accept();
    const alert = await deliveryAlert;
    expect(alert.title()).toBe('Delivering to Earth');
    await alert.accept();
  });

  test('setGeolocation with null clears the override', async ({ device }) => {
    await device.setGeolocation(LONDON);
    await device.setGeolocation(null);
  });

  test('startRecording and stopRecording produce a video', async ({ screen, device }, testInfo) => {
    const output = testInfo.outputPath('recording.mp4');
    await device.startRecording({ output, timeLimit: 30 });
    await openMenu(screen);
    const result = await device.stopRecording();
    expect(result.output ?? result.url).toBeTruthy();
  });

  test('setFoldState', async ({ device }) => {
    test.skip(true, 'needs a foldable device');
    await device.setFoldState('open');
  });

  test('uninstallApp and installApp', async ({ screen, device, bundleId }) => {
    const appPath = '../ios/build/Milliways-simulator.zip';
    test.skip(!existsSync(appPath), 'simulator build only');
    await device.uninstallApp(bundleId!);
    expect((await device.listApps()).map((app) => app.bundleId)).not.toContain(bundleId);
    await device.installApp(appPath);
    await device.launchApp(bundleId!);
    await expect(screen.getByText('Welcome to Milliways')).toBeVisible();
  });
});
