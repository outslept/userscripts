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

  const menuItemsToRemove = [
    'Boost Channel',
    'Send a Gift',
    'Wallet',
    'My Stories',
    'Telegram Features',
    'Report a Bug',
    'Install App'
  ];

  const cleanups = [];
  let observer = null;

  function cleanup() {
      cleanups.forEach(fn => fn());
      cleanups.length = 0;

      if (observer) {
          observer.disconnect();
          observer = null;
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
          if (text && menuItemsToRemove.includes(text)) {
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

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });

      cleanups.push(() => {
          if (observer) {
              observer.disconnect();
              observer = null;
          }
      });
  }

  function run() {
      cleanup();
      cleanNode(document.body);
      initObserver();
  }

  let currentUrl = location.href;
  setInterval(() => {
      if (location.href !== currentUrl) {
          currentUrl = location.href;
          run();
      }
  }, 500);

  run();

})();
