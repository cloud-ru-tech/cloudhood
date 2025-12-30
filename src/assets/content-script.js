// This script runs in the isolated extension world
// It reads storage and communicates with the MAIN world script via window.postMessage

(function() {
  // Helper to communicate with the injected script
  function sendOverrides(overrides) {
    window.postMessage(
      {
        type: 'CLOUDHOOD_UPDATE_OVERRIDES',
        overrides,
      },
      window.location.origin,
    );
  }

  // Read storage and update overrides
  function updateOverrides() {
    chrome.storage.local.get(
      ['requestHeaderProfilesV1', 'selectedHeaderProfileV1', 'isPausedV1'],
      (result) => {
        const isPaused = result.isPausedV1;
        if (isPaused) {
          sendOverrides([]);
          return;
        }

        let profiles = [];
        const profilesData = result.requestHeaderProfilesV1;
        
        try {
          if (typeof profilesData === 'string') {
            profiles = JSON.parse(profilesData);
          } else if (Array.isArray(profilesData)) {
            profiles = profilesData;
          }
        } catch {
          // ignore
        }

        const selectedProfileId = result.selectedHeaderProfileV1;
        const profile = profiles.find(p => p.id === selectedProfileId);

        if (profile && profile.responseOverrides) {
          const activeOverrides = profile.responseOverrides
            .filter(o => !o.disabled && o.urlPattern && o.responseContent)
            .map(o => ({
              urlPattern: o.urlPattern,
              responseContent: o.responseContent,
            }));

          sendOverrides(activeOverrides);
        } else {
          sendOverrides([]);
        }
      }
    );
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      updateOverrides();
    }
  });

  // Initial update
  updateOverrides();
})();
