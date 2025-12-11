import browser from 'webextension-polyfill';

import { createUrlCondition } from './createUrlCondition';

const CSP_RULE_ID_OFFSET = 200000;

export function getCspRules(urlFilters: string[]): browser.DeclarativeNetRequest.Rule[] {
  const action = {
    type: 'modifyHeaders' as const,
    responseHeaders: [
      { header: 'Content-Security-Policy', operation: 'remove' as const },
      { header: 'Content-Security-Policy-Report-Only', operation: 'remove' as const },
    ],
  };

  const resourceTypes = ['main_frame', 'sub_frame'] as browser.DeclarativeNetRequest.ResourceType[];

  if (urlFilters.length === 0) {
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

  return urlFilters.map((urlFilter, index) => {
    const urlCondition = createUrlCondition(urlFilter);
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

