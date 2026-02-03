import { useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any;

/**
 * SpriteLoader - loads and injects SVG sprites into the browser extension
 *
 * Solves cross-browser <use href> handling for external SVG files:
 * - Chrome supports <use href="sprite.svg#icon-name">
 * - Firefox requires injecting the sprite into the DOM
 *
 * The component automatically:
 * 1. Loads sprite.symbol.svg from the extension
 * 2. Parses SVG and injects it into the DOM (hidden)
 * 3. Allows all <use href="#icon-name"> to work in both browsers
 */
export function SpriteLoader() {
  useEffect(() => {
    const loadAndInjectSprite = async () => {
      try {
        // Check whether the sprite is already loaded
        if (document.querySelector('#snack-uikit-sprite')) {
          return;
        }

        // Get the sprite URL
        let spriteUrl: string;

        try {
          // Try to use chrome.runtime.getURL
          spriteUrl = chrome.runtime.getURL('sprite.symbol.svg');
        } catch {
          // Fallback when chrome.runtime is unavailable
          spriteUrl = './sprite.symbol.svg';
        }

        // Load the sprite
        const response = await fetch(spriteUrl);
        if (!response.ok) {
          throw new Error(`Failed to load sprite: ${response.status}`);
        }

        const svgText = await response.text();

        // Parse the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        if (!svgElement) {
          throw new Error('No SVG element found in sprite file');
        }

        // Configure the SVG for injection
        svgElement.id = 'snack-uikit-sprite';
        svgElement.style.display = 'none';
        svgElement.style.position = 'absolute';
        svgElement.style.width = '0';
        svgElement.style.height = '0';
        svgElement.style.pointerEvents = 'none';

        // Insert at the beginning of the body
        document.body.insertBefore(svgElement, document.body.firstChild);
      } catch (_error) {
        // Silently ignore sprite loading errors
        // In production, icons may still work via fallback
      }
    };

    loadAndInjectSprite();

    // Cleanup on unmount
    return () => {
      const spriteElement = document.querySelector('#snack-uikit-sprite');
      if (spriteElement) {
        spriteElement.remove();
      }
    };
  }, []);

  return null;
}
