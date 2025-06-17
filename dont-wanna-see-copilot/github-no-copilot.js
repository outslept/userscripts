// ==UserScript==
// @name         GitHub No Copilot
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Remove Copilot elements from GitHub
// @author       outslept
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const NAME = 'GitHub No Copilot';
  const cleanups = [];
  let observer = null;
  let intervalId = null;
  let initialized = false;

  const CSS_SELECTORS = `
      .AppHeader-CopilotChat,
      react-partial[partial-name="copilot-chat"],
      react-partial[partial-name="global-copilot-menu"],
      react-partial[partial-name="copilot-code-chat"],
      .copilotPreview__container,
      copilot-dashboard-entrypoint,
      [data-testid="copilot-ask-menu"],
      [data-testid="more-copilot-button"],
      [data-testid="open-in-copilot-agent-button"],
      [data-command-name="search-copilot-chat"],
      a[href="/settings/copilot"] {
          display: none !important;
      }

      .flash-warn:has([href="/settings/copilot"]) {
          display: none !important;
      }

      .ActionList-sectionDivider:has(h3:contains("Copilot")) {
          display: none !important;
      }

      [data-testid="sidebar-section"]:has(h3:contains("Development")) {
          display: none !important;
      }

      .js-homepage h2.my-2 {
          display: none !important;
      }
  `;

  function injectCSS() {
      const style = document.createElement('style');
      style.textContent = CSS_SELECTORS;
      style.setAttribute('data-userscript', NAME);
      document.head.appendChild(style);

      cleanups.push(() => {
          if (style.parentNode) {
              style.parentNode.removeChild(style);
          }
      });
  }

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

  const pageUtils = {
      isHomePage: () => window.location.pathname === '/',
      isPRFilesPage: () => /^\/[^\/]+\/[^\/]+\/pull\/\d+\/files/.test(window.location.pathname),
      isIssuePage: () => /^\/[^\/]+\/[^\/]+\/issues\/\d+/.test(window.location.pathname),
      isSidebarOpen: () => {
          const portalRoot = document.getElementById('__primerPortalRoot__');
          return portalRoot && portalRoot.children.length > 0;
      },
      isSearchOpen: () => {
          const searchDialog = document.getElementById('search-suggestions-dialog');
          return searchDialog && searchDialog.hasAttribute('open');
      }
  };

  const REMOVAL_SELECTORS = [
      '.AppHeader-CopilotChat',
      'react-partial[partial-name="copilot-chat"]',
      'react-partial[partial-name="global-copilot-menu"]',
      'react-partial[partial-name="copilot-code-chat"]',
      '.copilotPreview__container',
      'copilot-dashboard-entrypoint',
      '[data-testid="copilot-ask-menu"]',
      '[data-testid="more-copilot-button"]',
      '[data-testid="open-in-copilot-agent-button"]',
      '[data-command-name="search-copilot-chat"]'
  ];

  function removeCopilotElements() {
      let removedCount = 0;

      REMOVAL_SELECTORS.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
              el.remove();
              removedCount++;
          });
      });

      if (pageUtils.isHomePage()) {
          document.querySelectorAll('h2.my-2').forEach(header => {
              if (header.textContent.trim() === 'Home') {
                  header.remove();
                  removedCount++;
              }
          });
      }

      if (pageUtils.isIssuePage()) {
          document.querySelectorAll('[data-testid="sidebar-section"]').forEach(section => {
              const title = section.querySelector('h3');
              if (title && title.textContent.trim() === 'Development') {
                  section.remove();
                  removedCount++;
              }
          });
      }

      if (pageUtils.isSidebarOpen()) {
          document.querySelectorAll('a[href="/settings/copilot"]').forEach(link => {
              const listItem = link.closest('li');
              if (listItem) {
                  listItem.remove();
                  removedCount++;
              }
          });
      }

      if (pageUtils.isSearchOpen()) {
          document.querySelectorAll('.ActionList-sectionDivider').forEach(section => {
              const title = section.querySelector('h3');
              if (title && title.textContent.trim() === 'Copilot') {
                  section.remove();
                  removedCount++;
              }
          });
      }

      document.querySelectorAll('.flash-warn').forEach(flash => {
          if (flash.textContent.includes('GitHub Copilot setup') ||
              flash.querySelector('[href="/settings/copilot"]')) {
              flash.remove();
              removedCount++;
          }
      });

      const flashContainer = document.querySelector('.flash-messages');
      if (flashContainer && !flashContainer.children.length) {
          flashContainer.remove();
          removedCount++;
      }

      if (removedCount > 0) {
          console.log(`[${NAME}] Removed ${removedCount} Copilot elements`);
      }

      return removedCount;
  }

  function initObserver() {
      observer = new MutationObserver((mutations) => {
          let shouldClean = false;

          mutations.forEach(mutation => {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  for (const node of mutation.addedNodes) {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                          const element = node;
                          if (element.matches && (
                              element.matches('[class*="copilot" i]') ||
                              element.matches('[data-testid*="copilot" i]') ||
                              element.querySelector && (
                                  element.querySelector('[class*="copilot" i]') ||
                                  element.querySelector('[data-testid*="copilot" i]')
                              )
                          )) {
                              shouldClean = true;
                              break;
                          }
                      }
                  }
              }
          });

          if (shouldClean) {
              setTimeout(removeCopilotElements, 50);
          }
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

  function initPeriodicCleanup() {
      intervalId = setInterval(removeCopilotElements, 10000);

      cleanups.push(() => {
          if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
          }
      });
  }

  function run() {
      console.log(`[${NAME}] Running cleanup...`);
      cleanup();
      removeCopilotElements();

      if (document.body) {
          initObserver();
          initPeriodicCleanup();
      }
  }

  function init() {
      if (!initialized) {
          injectCSS();

          document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                  console.log(`[${NAME}] Page became visible, re-running...`);
                  setTimeout(run, 100);
              }
          });

          initialized = true;
      }

      run();
  }

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      init();
  }

  document.addEventListener('pjax:end', () => {
      console.log(`[${NAME}] PJAX navigation detected`);
      setTimeout(run, 100);
  });

  document.addEventListener('turbo:render', () => {
      console.log(`[${NAME}] Turbo navigation detected`);
      setTimeout(run, 100);
  });

  let currentUrl = location.href;
  setInterval(() => {
      if (location.href !== currentUrl) {
          currentUrl = location.href;
          console.log(`[${NAME}] URL change detected: ${currentUrl}`);
          setTimeout(run, 200);
      }
  }, 1000);

})();
