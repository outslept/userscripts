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

  function removeStories() {
    document.querySelectorAll('#StoryToggler').forEach(el => el.remove());
  }

  function removeReactions() {
    document.querySelectorAll('.Reactions').forEach(el => el.remove());
  }

  function removeMenuItems() {
    document.querySelectorAll('.MenuItem, [role="menuitem"]').forEach(item => {
      const text = item.textContent?.trim();
      if (text && [
          'Boost Channel',
          'Send a Gift',
          'Wallet',
          'My Stories',
          'Telegram Features',
          'Report a Bug',
          'Install App'
        ].includes(text)) {
        item.remove();
      }
    });
  }

  function removeBoostGift() {
    document.querySelectorAll('[data-testid*="boost"], [data-testid*="gift"]')
      .forEach(el => el.remove());
  }

  function cleanAll() {
    removeStories();
    removeReactions();
    removeMenuItems();
    removeBoostGift();
  }

  function initObserver() {
    observer = new MutationObserver(() => {
      removeReactions();
      removeStories();
      removeMenuItems();
      removeBoostGift();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    cleanups.push(() => {
      observer.disconnect();
      observer = null;
    });
  }

  function run() {
    cleanup();
    cleanAll();
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
