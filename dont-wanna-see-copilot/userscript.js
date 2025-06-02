// ==UserScript==
// @name         GitHub No Copilot
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Remove Copilot elements from GitHub
// @author       outslept
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    /* Header Copilot chat and menu - always visible */
    .AppHeader-CopilotChat,
    react-partial[partial-name="copilot-chat"],
    react-partial[partial-name="global-copilot-menu"] {
      display: none !important;
    }

    /* Dashboard Copilot container - only on homepage */
    .copilotPreview__container,
    copilot-dashboard-entrypoint {
      display: none !important;
    }

    /* Home header - only on homepage */
    h2.my-2 {
      display: none !important;
    }

    /* Flash warning messages about Copilot setup */
    .flash-warn:has([href="/settings/copilot"]) {
      display: none !important;
    }

    /* Diff view Ask Copilot buttons - only on PR files pages */
    react-partial[partial-name="copilot-code-chat"],
    [data-testid="copilot-ask-menu"],
    [data-testid="more-copilot-button"] {
      display: none !important;
    }

    /* Menu items with Copilot links - in sidebar */
    a[href="/settings/copilot"] {
      display: none !important;
    }

    /* Command palette Copilot items */
    [data-command-name="search-copilot-chat"] {
      display: none !important;
    }

    /* Search results Copilot section */
    .ActionList-sectionDivider:has(h3:contains("Copilot")) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  function isHomePage() {
    return window.location.pathname === '/' || window.location.pathname === '/home';
  }

  function isPRFilesPage() {
    return /^\/[^\/]+\/[^\/]+\/pull\/\d+\/files/.test(window.location.pathname);
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

    // Always remove header elements
    document.querySelectorAll('.AppHeader-CopilotChat').forEach(el => {
      el.remove();
      removedCount++;
    });

    // Only on homepage
    if (isHomePage()) {
      // Remove dashboard Copilot container
      document.querySelectorAll('.copilotPreview__container, copilot-dashboard-entrypoint').forEach(el => {
        el.remove();
        removedCount++;
      });

      // Remove Home header
      document.querySelectorAll('h2.my-2').forEach(header => {
        if (header.textContent.trim() === 'Home') {
          header.remove();
          removedCount++;
        }
      });
    }

    // Only on PR files pages
    if (isPRFilesPage()) {
      // Remove Ask Copilot button containers
      document.querySelectorAll('react-partial[partial-name="copilot-code-chat"]').forEach(el => {
        el.remove();
        removedCount++;
      });

      // Remove diff view Copilot buttons
      document.querySelectorAll('[data-testid="copilot-ask-menu"], [data-testid="more-copilot-button"]').forEach(btn => {
        btn.remove();
        removedCount++;
      });
    }

    // Only when sidebar is open
    if (isSidebarOpen()) {
      // Remove Copilot menu items by checking href
      document.querySelectorAll('a[href="/settings/copilot"]').forEach(link => {
        const listItem = link.closest('li');
        if (listItem) {
          listItem.remove();
          removedCount++;
        }
      });
    }

    // Only when search is open
    if (isSearchOpen()) {
      // Remove Copilot section from search results
      document.querySelectorAll('.ActionList-sectionDivider').forEach(section => {
        const title = section.querySelector('h3');
        if (title && title.textContent.trim() === 'Copilot') {
          section.remove();
          removedCount++;
        }
      });
    }

    // Always check for flash messages
    document.querySelectorAll('.flash-warn').forEach(flash => {
      if (flash.textContent.includes('GitHub Copilot setup') ||
          flash.querySelector('[href="/settings/copilot"]')) {
        flash.remove();
        removedCount++;
      }
    });

    // Always check for command palette items
    document.querySelectorAll('[data-command-name="search-copilot-chat"]').forEach(item => {
      item.remove();
      removedCount++;
    });

    // Clean up empty flash-messages container
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
      setTimeout(removeCopilotElements, 500);
    }
  }, 1000);

  setInterval(removeCopilotElements, 3000);

})();
