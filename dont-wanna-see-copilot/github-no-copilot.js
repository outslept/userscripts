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
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const cleanups = [];
  let observer = null;
  let intervalId = null;
  let initialized = false;

  function injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
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

  function removeCopilotElements() {
      [
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
      ].forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
      });

      if (window.location.pathname === '/') {
          document.querySelectorAll('h2.my-2').forEach(header => {
              if (header.textContent.trim() === 'Home') {
                  header.remove();
              }
          });
      }

      if (/^\/[^/]+\/[^/]+\/issues\/\d+/.test(window.location.pathname)) {
          document.querySelectorAll('[data-testid="sidebar-section"]').forEach(section => {
              const title = section.querySelector('h3');
              if (title && title.textContent.trim() === 'Development') {
                  section.remove();
              }
          });
      }

      const portalRoot = document.getElementById('__primerPortalRoot__');
      if (portalRoot && portalRoot.children.length > 0) {
          document.querySelectorAll('a[href="/settings/copilot"]').forEach(link => {
              const listItem = link.closest('li');
              if (listItem) {
                  listItem.remove();
              }
          });
      }

      const searchDialog = document.getElementById('search-suggestions-dialog');
      if (searchDialog && searchDialog.hasAttribute('open')) {
          document.querySelectorAll('.ActionList-sectionDivider').forEach(section => {
              const title = section.querySelector('h3');
              if (title && title.textContent.trim() === 'Copilot') {
                  section.remove();
              }
          });
      }

      document.querySelectorAll('.flash-warn').forEach(flash => {
          if (flash.textContent.includes('GitHub Copilot setup') ||
              flash.querySelector('[href="/settings/copilot"]')) {
              flash.remove();
          }
      });

      const flashContainer = document.querySelector('.flash-messages');
      if (flashContainer && !flashContainer.children.length) {
          flashContainer.remove();
      }
  }

  function initObserver() {
      observer = new MutationObserver((mutations) => {
          let shouldClean = false;

          mutations.forEach(mutation => {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  for (const node of mutation.addedNodes) {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                          if (node.matches && (
                              node.matches('[class*="copilot" i]') ||
                              node.matches('[data-testid*="copilot" i]') ||
                              node.querySelector && (
                                  node.querySelector('[class*="copilot" i]') ||
                                  node.querySelector('[data-testid*="copilot" i]')
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
              removeCopilotElements();
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

  function run() {
      cleanup();
      removeCopilotElements();
      initObserver();
  }

  function init() {
      if (!initialized) {
          injectCSS();

          document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                  run();
              }
          });

          initialized = true;
      }

      run();
  }

  init();

  document.addEventListener('pjax:end', run);
  document.addEventListener('turbo:render', run);

  let currentUrl = location.href;
  setInterval(() => {
      if (location.href !== currentUrl) {
          currentUrl = location.href;
          run();
      }
  }, 1000);

})();
