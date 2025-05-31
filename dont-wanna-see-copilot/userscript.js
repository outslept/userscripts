// ==UserScript==
// @name         GitHub No Copilot
// @namespace    http://tampermonkey.net/
// @version      0.0
// @description  Remove Copilot elements from GitHub
// @author       outslept
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const s = document.createElement('style');
  s.textContent = `
      div[data-testid="sidebar-section"]:has(h3:contains("Development")) {
          display: none !important;
      }

      h2.my-2 {
          display: none !important;
      }

      .copilotPreview__container,
      copilot-dashboard-entrypoint,
      .AppHeader-CopilotChat,
      react-partial[partial-name="copilot-chat"],
      react-partial[partial-name="global-copilot-menu"] {
          display: none !important;
      }

      .flash-messages .flash-warn {
          display: none !important;
      }

      .ActionListItem[data-command-name="search-copilot-chat"] {
          display: none !important;
      }
  `;
  document.head.appendChild(s);

  function clean() {
      document.querySelectorAll('div[data-testid="sidebar-section"]').forEach(s => {
          if (s.textContent.includes('Development')) s.remove();
      });

      document.querySelectorAll('.AppHeader-CopilotChat').forEach(e => e.remove());

      document.querySelectorAll('.flash-messages .flash-warn').forEach(w => {
          if (w.textContent.includes('Copilot')) w.remove();
      });

      document.querySelectorAll('.copilotPreview__container, copilot-dashboard-entrypoint').forEach(c => c.remove());

      document.querySelectorAll('react-partial[partial-name="copilot-chat"], react-partial[partial-name="global-copilot-menu"]').forEach(r => r.remove());

      document.querySelectorAll('.ActionListItem[data-command-name="search-copilot-chat"]').forEach(i => i.remove());

      const m = document.querySelector('.flash-messages');
      if (m && !m.children.length) m.remove();
  }

  new MutationObserver(clean).observe(document.body, {
      childList: true,
      subtree: true
  });

  clean();
})();
