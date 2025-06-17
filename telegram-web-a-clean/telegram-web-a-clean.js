// ==UserScript==
// @name         Telegram Web A Clean
// @namespace    http://tampermonkey.net/
// @version      0.1
// @match        https://web.telegram.org/a/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const menuItemsToRemove = new Set([
      'Boost Channel',
      'Send a Gift',
      'Wallet',
      'My Stories',
      'Telegram Features',
      'Report a Bug',
      'Install App'
  ]);

  const cleanups = [];
  let observer = null;
  let intervalId = null;

  function cleanup() {
      cleanups.forEach(fn => fn());
      cleanups.length = 0;

      if (observer) {
          observer.disconnect();
          observer = null;
      }

      if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
      }
  }

  function cleanNode(node) {
      if (!(node instanceof Element)) return;

      const storyToggler = node.querySelector('#StoryToggler');
      if (storyToggler) {
          storyToggler.remove();
      }

      node.querySelectorAll('.Reactions').forEach(el => el.remove());

      node.querySelectorAll('.MenuItem, [role="menuitem"]').forEach(item => {
          const text = item.textContent?.trim();
          if (text && menuItemsToRemove.has(text)) {
              item.remove();
          }
      });

      node.querySelectorAll('[data-testid*="boost"], [data-testid*="gift"]')
          .forEach(el => el.remove());
  }

  function initObserver() {
      observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
              if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(cleanNode);
              }
          });

          document.querySelectorAll('.Reactions').forEach(el => el.remove());
      });

      if (document.body) {
          observer.observe(document.body, {
              childList: true,
              subtree: true
          });
      }

      cleanups.push(() => {
          if (observer) {
              observer.disconnect();
              observer = null;
          }
      });
  }

  function initInterval() {
      intervalId = setInterval(() => {
          document.querySelectorAll('.Reactions').forEach(el => el.remove());
      }, 1000);

      cleanups.push(() => {
          if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
          }
      });
  }

  function run() {
      console.log('[Telegram Cleaner] Running cleanup...');

      cleanup();

      cleanNode(document.body);
      initObserver();
      initInterval();
  }

  let currentUrl = location.href;
  function checkUrlChange() {
      if (location.href !== currentUrl) {
          currentUrl = location.href;
          console.log('[Telegram Cleaner] URL changed, re-running...');
          setTimeout(run, 100);
      }
  }

  document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
          console.log('[Telegram Cleaner] Page became visible, re-running...');
          run();
      }
  });

  setInterval(checkUrlChange, 500);

  run();
})();
