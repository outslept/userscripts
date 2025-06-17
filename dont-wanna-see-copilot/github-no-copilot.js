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

  const cleanups = [];
  let observer = null;
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
  }

  function removeBasicElements() {
      document.querySelectorAll('.AppHeader-CopilotChat').forEach(el => el.remove());
      document.querySelectorAll('react-partial[partial-name="copilot-chat"]').forEach(el => el.remove());
      document.querySelectorAll('react-partial[partial-name="global-copilot-menu"]').forEach(el => el.remove());
      document.querySelectorAll('react-partial[partial-name="copilot-code-chat"]').forEach(el => el.remove());
      document.querySelectorAll('.copilotPreview__container').forEach(el => el.remove());
      document.querySelectorAll('copilot-dashboard-entrypoint').forEach(el => el.remove());
      document.querySelectorAll('[data-testid="copilot-ask-menu"]').forEach(el => el.remove());
      document.querySelectorAll('[data-testid="more-copilot-button"]').forEach(el => el.remove());
      document.querySelectorAll('[data-testid="open-in-copilot-agent-button"]').forEach(el => el.remove());
      document.querySelectorAll('[data-command-name="search-copilot-chat"]').forEach(el => el.remove());
  }

  function removeHomeHeader() {
      if (window.location.pathname === '/') {
          document.querySelectorAll('h2.my-2').forEach(header => {
              if (header.textContent.trim() === 'Home') {
                  header.remove();
              }
          });
      }
  }

  function removeDevelopmentSection() {
      if (/^\/[^/]+\/[^/]+\/issues\/\d+/.test(window.location.pathname)) {
          document.querySelectorAll('[data-testid="sidebar-section"]').forEach(section => {
              const title = section.querySelector('h3');
              if (title && title.textContent.trim() === 'Development') {
                  section.remove();
              }
          });
      }
  }

  function removeSidebarLinks() {
      const portalRoot = document.getElementById('__primerPortalRoot__');
      if (portalRoot && portalRoot.children.length > 0) {
          document.querySelectorAll('a[href="/settings/copilot"]').forEach(link => {
              const listItem = link.closest('li');
              if (listItem) {
                  listItem.remove();
              }
          });
      }
  }

  function removeSearchSections() {
      const searchDialog = document.getElementById('search-suggestions-dialog');
      if (searchDialog && searchDialog.hasAttribute('open')) {
          document.querySelectorAll('.ActionList-sectionDivider').forEach(section => {
              const title = section.querySelector('h3');
              if (title && title.textContent.trim() === 'Copilot') {
                  section.remove();
              }
          });
      }
  }

  function removeFlashWarnings() {
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

  function cleanAll() {
      removeBasicElements();
      removeHomeHeader();
      removeDevelopmentSection();
      removeSidebarLinks();
      removeSearchSections();
      removeFlashWarnings();
  }

  function initObserver() {
      observer = new MutationObserver(() => {
          removeBasicElements();
          removeFlashWarnings();
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

  function init() {
      if (!initialized) {
          injectCSS();
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
