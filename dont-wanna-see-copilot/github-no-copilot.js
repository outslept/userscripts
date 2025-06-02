// ==UserScript==
// @name         GitHub No Copilot
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Remove Copilot elements from GitHub
// @author       outslept
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 1000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 1000);
        });
      }
    });
  }

  waitForPageLoad().then(() => {
    initializeCopilotRemover();
  });

  function initializeCopilotRemover() {
    const style = document.createElement('style');
    style.textContent = `
      .AppHeader-CopilotChat,
      react-partial[partial-name="copilot-chat"],
      react-partial[partial-name="global-copilot-menu"] {
        display: none !important;
      }

      .copilotPreview__container,
      copilot-dashboard-entrypoint {
        display: none !important;
      }

      h2.my-2 {
        display: none !important;
      }

      .flash-warn:has([href="/settings/copilot"]) {
        display: none !important;
      }

      react-partial[partial-name="copilot-code-chat"],
      [data-testid="copilot-ask-menu"],
      [data-testid="more-copilot-button"] {
        display: none !important;
      }

      a[href="/settings/copilot"] {
        display: none !important;
      }

      [data-command-name="search-copilot-chat"] {
        display: none !important;
      }

      .ActionList-sectionDivider:has(h3:contains("Copilot")) {
        display: none !important;
      }

      [data-testid="sidebar-section"]:has(h3:contains("Development")) {
        display: none !important;
      }

      [data-testid="open-in-copilot-agent-button"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    function isHomePage() {
      return window.location.pathname === '/';
    }

    function isPRFilesPage() {
      return /^\/[^\/]+\/[^\/]+\/pull\/\d+\/files/.test(window.location.pathname);
    }

    function isIssuePage() {
      return /^\/[^\/]+\/[^\/]+\/issues\/\d+/.test(window.location.pathname);
    }

    function isSidebarOpen() {
      const portalRoot = document.getElementById('__primerPortalRoot__');
      return portalRoot && portalRoot.children.length > 0;
    }

    function isSearchOpen() {
      const searchDialog = document.getElementById('search-suggestions-dialog');
      return searchDialog && searchDialog.hasAttribute('open');
    }

    function removeCopilotElements() {
      let removedCount = 0;

      document.querySelectorAll('.AppHeader-CopilotChat').forEach(el => {
        el.remove();
        removedCount++;
      });

      if (isHomePage()) {
        document.querySelectorAll('.copilotPreview__container, copilot-dashboard-entrypoint').forEach(el => {
          el.remove();
          removedCount++;
        });

        document.querySelectorAll('h2.my-2').forEach(header => {
          if (header.textContent.trim() === 'Home') {
            header.remove();
            removedCount++;
          }
        });
      }

      if (isPRFilesPage()) {
        document.querySelectorAll('react-partial[partial-name="copilot-code-chat"]').forEach(el => {
          el.remove();
          removedCount++;
        });

        document.querySelectorAll('[data-testid="copilot-ask-menu"], [data-testid="more-copilot-button"]').forEach(btn => {
          btn.remove();
          removedCount++;
        });
      }

      if (isIssuePage()) {
        document.querySelectorAll('[data-testid="sidebar-section"]').forEach(section => {
          const title = section.querySelector('h3');
          if (title && title.textContent.trim() === 'Development') {
            section.remove();
            removedCount++;
          }
        });

        document.querySelectorAll('[data-testid="open-in-copilot-agent-button"]').forEach(btn => {
          btn.remove();
          removedCount++;
        });
      }

      if (isSidebarOpen()) {
        document.querySelectorAll('a[href="/settings/copilot"]').forEach(link => {
          const listItem = link.closest('li');
          if (listItem) {
            listItem.remove();
            removedCount++;
          }
        });
      }

      if (isSearchOpen()) {
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

      document.querySelectorAll('[data-command-name="search-copilot-chat"]').forEach(item => {
        item.remove();
        removedCount++;
      });

      const flashContainer = document.querySelector('.flash-messages');
      if (flashContainer && !flashContainer.children.length) {
        flashContainer.remove();
        removedCount++;
      }

      return removedCount;
    }

    removeCopilotElements();

    let currentPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        setTimeout(() => {
          removeCopilotElements();
        }, 1000);
      }
    }, 1000);

    setInterval(() => {
      removeCopilotElements();
    }, 5000);
  }
})();
