import browser from 'webextension-polyfill';

import {
  BrowserStorageKey,
  CAPTURED_REQUESTS_SESSION_WRITE_DEBOUNCE_MS,
  RESPONSE_OVERRIDE_APPLY_ERRORS_LIMIT,
} from './shared/constants';
import { CapturedRequestsTabRecord } from './shared/types/capturedRequest';
import { browserAction } from './shared/utils/browserAPI';
import {
  isCapturedRequestEventsWorkerMessage,
  isCapturedRequestsSessionStartedWorkerMessage,
  parseCapturedRequestEventsFromUnknown,
} from './shared/utils/capturedRequestMessages';
import {
  appendCapturedRequestEvents,
  capturedRequestsSessionKey,
  dropCapturedRequestBodies,
  parseCapturedRequestsTabRecord,
  trimCapturedRequestEntries,
} from './shared/utils/capturedRequests';
import { logger, LogLevel } from './shared/utils/logger';
import {
  isResponseOverrideApplyErrorWorkerMessage,
  isServiceWorkerReloadMessage,
} from './shared/utils/responseOverrideMessages';
import { parseResponseOverrideApplyErrors } from './shared/utils/responseOverrides';
import { setBrowserCookies } from './shared/utils/setBrowserCookies';
import { setBrowserHeaders } from './shared/utils/setBrowserHeaders';
import { enableExtensionReload } from './utils/extension-reload';

logger.configure({
  minLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  showTimestamp: true,
  enabled: true,
});

// Simple check to verify background script execution
logger.info('🎯 Background script loaded successfully!');
// Duplicate in logger.debug to ensure visibility
logger.debug('🎯 Background script loaded successfully! (debug)');
logger.info('🔍 About to check storage contents...');

async function getCurrentTabUrl(): Promise<string | undefined> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.url;
  } catch {
    return undefined;
  }
}

// Check storage immediately on background script load
(async () => {
  try {
    const result = await browser.storage.local.get([
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ]);

    logger.group('📦 Storage contents on background script load:', true);
    logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
    logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
    logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
    logger.groupEnd();

    logger.debug('Background script load storage data:', JSON.stringify(result, null, 2));

    const currentTabUrl = await getCurrentTabUrl();
    await setBrowserHeaders(result, currentTabUrl);
    logger.info(`🏷️ Initial badge set for URL: ${currentTabUrl}`);
  } catch (error) {
    logger.error('Failed to check storage on background script load:', error);
  }
})();

// Initialize auto-reload only in development mode
if (process.env.NODE_ENV === 'development') {
  enableExtensionReload();
  logger.debug('Extension auto-reload enabled for development mode');
}

const BADGE_COLOR = '#ffffff';

async function appendResponseOverrideApplyError(message: {
  profileId: string;
  overrideId: number;
  reason: string;
}) {
  const result = await browser.storage.local.get(BrowserStorageKey.ResponseOverrideApplyErrors);
  const existingErrors = parseResponseOverrideApplyErrors(result[BrowserStorageKey.ResponseOverrideApplyErrors]);
  const nextErrors = [
    ...existingErrors,
    {
      profileId: message.profileId,
      overrideId: message.overrideId,
      reason: message.reason,
      timestamp: Date.now(),
    },
  ].slice(-RESPONSE_OVERRIDE_APPLY_ERRORS_LIMIT);

  await browser.storage.local.set({ [BrowserStorageKey.ResponseOverrideApplyErrors]: nextErrors });
}

const pendingCapturedRequestsByTab = new Map<number, CapturedRequestsTabRecord>();
const capturedRequestsWriteTimers = new Map<number, ReturnType<typeof setTimeout>>();
const capturedRequestsReadyTabs = new Set<number>();
const capturedRequestsLastUrlByTab = new Map<number, string>();
const capturedRequestsBufferedMessages = new Map<number, unknown[]>();
const capturedRequestsTabTasks = new Map<number, Promise<void>>();

function runCapturedRequestsTabTask(tabId: number, task: () => Promise<void>): Promise<void> {
  const previousTask = capturedRequestsTabTasks.get(tabId) ?? Promise.resolve();
  const nextTask = previousTask.catch(() => undefined).then(task);
  capturedRequestsTabTasks.set(tabId, nextTask);
  return nextTask;
}

async function readCapturedRequestsRecord(tabId: number): Promise<CapturedRequestsTabRecord> {
  const pendingRecord = pendingCapturedRequestsByTab.get(tabId);

  if (pendingRecord) {
    return pendingRecord;
  }

  const key = capturedRequestsSessionKey(tabId);
  const result = await browser.storage.session.get(key);
  return parseCapturedRequestsTabRecord(result[key]) ?? { entries: [] };
}

async function writeCapturedRequestsRecord(tabId: number, record: CapturedRequestsTabRecord) {
  const key = capturedRequestsSessionKey(tabId);

  try {
    await browser.storage.session.set({ [key]: record });
    pendingCapturedRequestsByTab.set(tabId, record);
    return;
  } catch {
    const withoutBodies = dropCapturedRequestBodies(record);

    try {
      await browser.storage.session.set({ [key]: withoutBodies });
      pendingCapturedRequestsByTab.set(tabId, withoutBodies);
      return;
    } catch {
      const trimmedRecord = trimCapturedRequestEntries(withoutBodies, Math.floor(withoutBodies.entries.length / 2));

      try {
        await browser.storage.session.set({ [key]: trimmedRecord });
        pendingCapturedRequestsByTab.set(tabId, trimmedRecord);
      } catch {
        logger.error('Failed to persist captured requests after quota fallback', { tabId });
      }
    }
  }
}

function scheduleCapturedRequestsWrite(tabId: number, record: CapturedRequestsTabRecord) {
  pendingCapturedRequestsByTab.set(tabId, record);
  const existingTimer = capturedRequestsWriteTimers.get(tabId);

  if (existingTimer !== undefined) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    capturedRequestsWriteTimers.delete(tabId);
    const pendingRecord = pendingCapturedRequestsByTab.get(tabId);

    if (!pendingRecord) {
      return;
    }

    writeCapturedRequestsRecord(tabId, pendingRecord).catch(error => {
      logger.error('Failed to write captured requests', error);
    });
  }, CAPTURED_REQUESTS_SESSION_WRITE_DEBOUNCE_MS);

  capturedRequestsWriteTimers.set(tabId, timer);
}

async function resetCapturedRequestsSession(tabId: number) {
  const existingTimer = capturedRequestsWriteTimers.get(tabId);

  if (existingTimer !== undefined) {
    clearTimeout(existingTimer);
    capturedRequestsWriteTimers.delete(tabId);
  }

  const emptyRecord: CapturedRequestsTabRecord = { entries: [] };
  pendingCapturedRequestsByTab.set(tabId, emptyRecord);
  await writeCapturedRequestsRecord(tabId, emptyRecord);
}

async function appendCapturedRequestEventsForTab(tabId: number, message: unknown) {
  const events = parseCapturedRequestEventsFromUnknown(message);

  if (events.length === 0) {
    return;
  }

  const currentRecord = await readCapturedRequestsRecord(tabId);
  const nextRecord = appendCapturedRequestEvents(currentRecord, events);
  scheduleCapturedRequestsWrite(tabId, nextRecord);
}

function bufferCapturedRequestEventsMessage(tabId: number, message: unknown) {
  const bufferedMessages = capturedRequestsBufferedMessages.get(tabId) ?? [];
  bufferedMessages.push(message);
  capturedRequestsBufferedMessages.set(tabId, bufferedMessages);
}

function takeBufferedCapturedRequestMessages(tabId: number): unknown[] {
  const bufferedMessages = capturedRequestsBufferedMessages.get(tabId) ?? [];
  capturedRequestsBufferedMessages.delete(tabId);
  return bufferedMessages;
}

async function beginCapturedRequestsNavigation(tabId: number, url: string) {
  if (capturedRequestsLastUrlByTab.get(tabId) === url) {
    return;
  }

  capturedRequestsLastUrlByTab.set(tabId, url);
  capturedRequestsReadyTabs.delete(tabId);
  capturedRequestsBufferedMessages.delete(tabId);
  await resetCapturedRequestsSession(tabId);
}

async function handleCapturedRequestsSessionStarted(tabId: number, tabUrl?: string) {
  if (capturedRequestsReadyTabs.has(tabId)) {
    return;
  }

  if (tabUrl) {
    capturedRequestsLastUrlByTab.set(tabId, tabUrl);
  }

  await resetCapturedRequestsSession(tabId);
  capturedRequestsReadyTabs.add(tabId);

  for (const bufferedMessage of takeBufferedCapturedRequestMessages(tabId)) {
    await appendCapturedRequestEventsForTab(tabId, bufferedMessage);
  }
}

async function handleCapturedRequestEvents(tabId: number, message: unknown) {
  if (!capturedRequestsReadyTabs.has(tabId)) {
    bufferCapturedRequestEventsMessage(tabId, message);
    return;
  }

  await appendCapturedRequestEventsForTab(tabId, message);
}

function clearCapturedRequestsTab(tabId: number) {
  const existingTimer = capturedRequestsWriteTimers.get(tabId);

  if (existingTimer !== undefined) {
    clearTimeout(existingTimer);
    capturedRequestsWriteTimers.delete(tabId);
  }

  capturedRequestsReadyTabs.delete(tabId);
  capturedRequestsLastUrlByTab.delete(tabId);
  capturedRequestsBufferedMessages.delete(tabId);
  capturedRequestsTabTasks.delete(tabId);
  pendingCapturedRequestsByTab.delete(tabId);
  browser.storage.session.remove(capturedRequestsSessionKey(tabId)).catch(() => undefined);
}

function getSenderTabId(sender: { tab?: { id?: number } }): number | null {
  const tabId = sender.tab?.id;
  return typeof tabId === 'number' ? tabId : null;
}

async function notify(message: unknown, sender: { tab?: { id?: number; url?: string } }) {
  logger.debug('Received message:', message);

  const senderTabId = getSenderTabId(sender);

  if (isCapturedRequestsSessionStartedWorkerMessage(message)) {
    if (senderTabId !== null) {
      const senderTabUrl = typeof sender.tab?.url === 'string' ? sender.tab.url : undefined;
      await runCapturedRequestsTabTask(senderTabId, () =>
        handleCapturedRequestsSessionStarted(senderTabId, senderTabUrl),
      );
    }

    return undefined;
  }

  if (isCapturedRequestEventsWorkerMessage(message)) {
    if (senderTabId !== null) {
      await runCapturedRequestsTabTask(senderTabId, () => handleCapturedRequestEvents(senderTabId, message));
    }

    return undefined;
  }

  if (isResponseOverrideApplyErrorWorkerMessage(message)) {
    await appendResponseOverrideApplyError(message);
    return undefined;
  }

  if (isServiceWorkerReloadMessage(message)) {
    logger.info('🔄 Reloading headers configuration');

    const result = await browser.storage.local.get([
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ]);

    logger.info('📦 Storage data for reload:', result);
    await Promise.all([setBrowserHeaders(result, await getCurrentTabUrl()), setBrowserCookies(result)]);
  }
  return undefined;
}

browser.runtime.onStartup.addListener(async function () {
  logger.info('Extension startup triggered');

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  // Detailed logging of storage contents on startup
  logger.info('📦 Storage contents on startup:');
  logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
  logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
  logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
  logger.debug('Startup storage data:', JSON.stringify(result, null, 2));

  logger.debug('Startup storage data:', result);

  if (Object.keys(result).length) {
    logger.info('🚀 Storage data found, setting browser headers on startup');
    try {
      await Promise.all([setBrowserHeaders(result, await getCurrentTabUrl()), setBrowserCookies(result)]);
    } catch (error) {
      logger.error('Failed to set browser headers on startup:', error);
    }
  } else {
    logger.info('📭 No storage data found on startup - extension will start with default settings');
  }
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
  logger.debug('Storage changes detected in area:', areaName, changes);

  if (areaName === 'local') {
    const relevantChanges = [
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ].some(key => Object.keys(changes).includes(key));

    if (relevantChanges) {
      logger.info('📝 Relevant storage changes detected, updating headers');
      const result = await browser.storage.local.get([
        BrowserStorageKey.Profiles,
        BrowserStorageKey.SelectedProfile,
        BrowserStorageKey.IsPaused,
      ]);
      logger.debug('Storage changes data:', result);
      try {
        await Promise.all([setBrowserHeaders(result, await getCurrentTabUrl()), setBrowserCookies(result)]);
      } catch (error) {
        logger.error('Failed to set browser headers on storage change:', error);
      }
    }
  }
});

browser.runtime.onInstalled.addListener(async details => {
  logger.info('Extension installed/updated:', details.reason);

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  // Detailed logging of storage contents on install/update
  logger.group('📦 Storage contents on install/update:', true);
  logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
  logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
  logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
  logger.debug('Install/update storage data:', JSON.stringify(result, null, 2));
  logger.groupEnd();

  logger.debug('Install/update storage data:', result);

  if (Object.keys(result).length) {
    logger.info('🔧 Storage data found, initializing browser headers on install/update');
    try {
      await Promise.all([setBrowserHeaders(result, await getCurrentTabUrl()), setBrowserCookies(result)]);
    } catch (error) {
      logger.error('Failed to set browser headers on install/update:', error);
    }
  } else {
    logger.info('📭 No storage data found on install/update - extension will start with default settings');
  }
});

browser.tabs.onActivated.addListener(async activeInfo => {
  logger.debug('Tab activated:', activeInfo);

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  logger.debug('Tab activation storage data:', result);

  if (Object.keys(result).length) {
    logger.info('📱 Tab activated, updating headers');
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      await setBrowserHeaders(result, tab.url);
    } catch (error) {
      logger.error('Failed to set browser headers on tab activation:', error);
    }
  } else {
    logger.debug('No storage data found on tab activation');
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTabs[0]?.id !== tabId) return;

  logger.debug('Active tab URL updated:', tab.url);

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  if (Object.keys(result).length) {
    try {
      await setBrowserHeaders(result, tab.url);
    } catch (error) {
      logger.error('Failed to set browser headers on tab URL update:', error);
    }
  }
});

browserAction.setBadgeBackgroundColor({ color: BADGE_COLOR });

browser.tabs.onRemoved.addListener(tabId => {
  clearCapturedRequestsTab(tabId);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const nextUrl = changeInfo.url;

  if (nextUrl === undefined) {
    return;
  }

  runCapturedRequestsTabTask(tabId, () => beginCapturedRequestsNavigation(tabId, nextUrl)).catch(error => {
    logger.error('Failed to reset captured requests on navigation', error);
  });
});

browser.runtime.onMessage.addListener((message: unknown, sender: { tab?: { id?: number } }) =>
  notify(message, sender),
);
