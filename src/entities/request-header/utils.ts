import { RequestHeader } from './types';

function getRule(header: RequestHeader) {
  return {
    id: header.id,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        { header: header.name, value: header.value, operation: chrome.declarativeNetRequest.HeaderOperation.SET },
      ],
    },
    condition: {
      urlFilter: undefined,
      resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest', 'other'],
    },
  };
}

type UpdateOverrideHeadersParams = Record<'headersToAdd' | 'allHeaders', RequestHeader[]>;

export async function updateOverrideHeaders({ allHeaders, headersToAdd }: UpdateOverrideHeadersParams) {
  const addRules = headersToAdd.filter(h => !h.disabled).map(getRule);
  const removeRuleIds = allHeaders.map(h => h.id);

  await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds });
}
