import browser from 'webextension-polyfill';

import type { ResponseOverride } from '#entities/request-profile/types';

import { createUrlCondition } from './createUrlCondition';

const CSP_RULE_ID_OFFSET = 200000;

export function getOverrideRules(responseOverrides: ResponseOverride[]): browser.DeclarativeNetRequest.Rule[] {
  if (responseOverrides.length === 0) {
    return [];
  }

  const action = {
    type: 'modifyHeaders' as const,
    responseHeaders: [
      { header: 'Content-Security-Policy', operation: 'remove' as const },
      { header: 'Content-Security-Policy-Report-Only', operation: 'remove' as const },
    ],
  };

  const resourceTypes = ['main_frame', 'sub_frame'] as browser.DeclarativeNetRequest.ResourceType[];

  const uniqueUrlPatterns = [...new Set(responseOverrides.map(o => o.urlPattern).filter(Boolean))];

  if (uniqueUrlPatterns.length === 0) {
    return [
      {
        id: CSP_RULE_ID_OFFSET,
        priority: 1,
        action,
        condition: {
          resourceTypes,
        },
      },
    ];
  }

  return uniqueUrlPatterns.map((urlPattern, index) => {
    const urlCondition = createUrlCondition(urlPattern);
    return {
      id: CSP_RULE_ID_OFFSET + index,
      priority: 1,
      action,
      condition: {
        ...urlCondition,
        resourceTypes,
      },
    };
  });
}

