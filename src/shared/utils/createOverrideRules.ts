import browser from 'webextension-polyfill';

import type { ResponseOverride } from '#entities/request-profile/types';

import { logger } from './logger';

const OVERRIDE_RULE_ID_OFFSET = 100000;

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export function getOverrideRules(responseOverrides: ResponseOverride[]): browser.DeclarativeNetRequest.Rule[] {
  const allResourceTypes = [
    'main_frame',
    'sub_frame',
    'stylesheet',
    'script',
    'image',
    'font',
    'object',
    'xmlhttprequest',
    'ping',
    'csp_report',
    'media',
    'websocket',
    'other',
  ] as browser.DeclarativeNetRequest.ResourceType[];

  const rules: browser.DeclarativeNetRequest.Rule[] = [];

  responseOverrides.forEach((override, index) => {
    if (!override.urlPattern.trim() || !override.responseContent.trim()) {
      return;
    }

    try {
      const urlPattern = override.urlPattern.trim();
      
      if (!isValidRegex(urlPattern)) {
        logger.warn(`Invalid URL regex: ${urlPattern}`);
        return;
      }

      const encodedContent = encodeURIComponent(override.responseContent);
      const dataUrl = `data:application/json;charset=utf-8,${encodedContent}`;

      rules.push({
        id: OVERRIDE_RULE_ID_OFFSET + index,
        priority: 1,
        action: {
          type: 'redirect' as const,
          redirect: {
            url: dataUrl,
          },
        },
        condition: {
          regexFilter: urlPattern,
          resourceTypes: allResourceTypes,
        },
      });

      logger.debug(`Created override rule for regex: ${urlPattern}`);
    } catch (error) {
      logger.error(`Failed to create override rule for ${override.id}:`, error);
    }
  });

  return rules;
}
