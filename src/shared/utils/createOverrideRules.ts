import browser from 'webextension-polyfill';

import type { ResponseOverride } from '#entities/request-profile/types';

import { logger } from './logger';

const OVERRIDE_RULE_ID_OFFSET = 100000;

function testUrlPattern(pattern: string): boolean {
  try {
    if (typeof URLPattern !== 'undefined') {
      new URLPattern(pattern);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function convertUrlPatternToRegex(pattern: string): string {
  try {
    const urlPattern = pattern.trim();
    
    if (urlPattern.includes('*')) {
      return urlPattern.replace(/\*/g, '.*').replace(/\?/g, '\\?');
    }
    
    return urlPattern;
  } catch (error) {
    logger.warn('Failed to convert URL pattern to regex:', error);
    return pattern;
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
      
      const isValidPattern = testUrlPattern(urlPattern);
      
      if (!isValidPattern) {
        logger.warn(`Invalid URL pattern: ${urlPattern}`);
        return;
      }

      const encodedContent = encodeURIComponent(override.responseContent);
      const dataUrl = `data:application/json;charset=utf-8,${encodedContent}`;

      const regexFilter = convertUrlPatternToRegex(urlPattern);

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
          regexFilter,
          resourceTypes: allResourceTypes,
        },
      });

      logger.debug(`Created override rule for pattern: ${urlPattern}`);
    } catch (error) {
      logger.error(`Failed to create override rule for ${override.id}:`, error);
    }
  });

  return rules;
}
