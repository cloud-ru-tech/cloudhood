#!/bin/bash

echo "🚀 Тестируем dev server для браузерного расширения..."

echo "📦 Собираем проект в dev режиме..."
BROWSER=chrome pnpm vite build --mode development

echo "📁 Проверяем файлы в build/chrome:"
ls -la build/chrome/ | grep -E "(manifest|popup|background)"

echo "✅ Проверяем содержимое ключевых файлов:"

if [ -f "build/chrome/manifest.json" ]; then
    echo "✓ manifest.json найден"
else
    echo "❌ manifest.json НЕ найден"
fi

if [ -f "build/chrome/popup.html" ]; then
    echo "✓ popup.html найден"
else
    echo "❌ popup.html НЕ найден"
    if [ -f "build/chrome/src/index.html" ]; then
        echo "📋 Копируем src/index.html → popup.html"
        cp build/chrome/src/index.html build/chrome/popup.html
        echo "✓ popup.html создан"
    fi
fi

if [ -f "build/chrome/background.bundle.js" ]; then
    echo "✓ background.bundle.js найден"
else
    echo "❌ background.bundle.js НЕ найден"
fi

echo "🎯 Готово! Расширение можно загрузить из build/chrome/"
echo "📖 Инструкция:"
echo "   1. Откройте chrome://extensions/"
echo "   2. Включите Developer mode"
echo "   3. Нажмите Load unpacked"
echo "   4. Выберите папку build/chrome"
