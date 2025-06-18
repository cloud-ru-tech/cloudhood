import { useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any;

/**
 * SpriteLoader - компонент для загрузки и внедрения SVG-спрайтов в браузерном расширении
 *
 * Решает проблему кросс-браузерности <use href> для внешних SVG-файлов:
 * - Chrome поддерживает <use href="sprite.svg#icon-name">
 * - Firefox требует внедрения спрайта в DOM
 *
 * Компонент автоматически:
 * 1. Загружает sprite.symbol.svg из расширения
 * 2. Парсит SVG и внедряет его в DOM (невидимо)
 * 3. Позволяет всем <use href="#icon-name"> работать в обоих браузерах
 */
export function SpriteLoader() {
  useEffect(() => {
    const loadAndInjectSprite = async () => {
      try {
        // Проверяем, не загружен ли уже спрайт
        if (document.querySelector('#snack-uikit-sprite')) {
          return;
        }

        // Получаем URL спрайта
        let spriteUrl: string;

        try {
          // Пытаемся использовать chrome.runtime.getURL
          spriteUrl = chrome.runtime.getURL('sprite.symbol.svg');
        } catch {
          // Fallback для случаев, когда chrome.runtime недоступен
          spriteUrl = './sprite.symbol.svg';
        }

        // Загружаем спрайт
        const response = await fetch(spriteUrl);
        if (!response.ok) {
          throw new Error(`Failed to load sprite: ${response.status}`);
        }

        const svgText = await response.text();

        // Парсим SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        if (!svgElement) {
          throw new Error('No SVG element found in sprite file');
        }

        // Настраиваем SVG для внедрения
        svgElement.id = 'snack-uikit-sprite';
        svgElement.style.display = 'none';
        svgElement.style.position = 'absolute';
        svgElement.style.width = '0';
        svgElement.style.height = '0';
        svgElement.style.pointerEvents = 'none';

        // Добавляем в начало body
        document.body.insertBefore(svgElement, document.body.firstChild);
      } catch (_error) {
        // Тихо игнорируем ошибки загрузки спрайта
        // В production иконки все равно могут работать через fallback
      }
    };

    loadAndInjectSprite();

    // Очистка при размонтировании
    return () => {
      const spriteElement = document.querySelector('#snack-uikit-sprite');
      if (spriteElement) {
        spriteElement.remove();
      }
    };
  }, []);

  return null;
}
