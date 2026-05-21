const { contextBridge, ipcRenderer } = require('electron');

// Safe, minimal bridge APIs for UI coordination if needed later
contextBridge.exposeInMainWorld('browserAPI', {
  logStatus: (msg) => console.log(`[Browser System]: ${msg}`)
});

// Layer 2: Aggressive Script Execution Prevention & DOM Interception
window.addEventListener('DOMContentLoaded', () => {
  const badPatterns = [/analytics/i, /telemetry/i, /doubleclick/i, /pixel/i, /adsystem/i];

  const shouldBlock = (string) => badPatterns.some(pattern => pattern.test(string));

  // Intercept element creation API before scripts can load natively
  const originalCreateElement = document.createElement;
  document.createElement = function (tagName, options) {
    const element = originalCreateElement.call(document, tagName, options);
    
    if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'iframe') {
      const setter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src') ||
                     Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
                     
      if (setter && setter.set) {
        Object.defineProperty(element, 'src', {
          set: function (value) {
            if (shouldBlock(value)) {
              console.log(`[DOM Filter] Stripped elements pointing to: ${value}`);
              setter.set.call(this, 'about:blank');
              return;
            }
            setter.set.call(this, value);
          },
          get: function () {
            return setter.get.call(this);
          }
        });
      }
    }
    return element;
  };

  // Continuous Mutation Observer to catch injected tracking frames or scripts
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element layer
          const tag = node.tagName.toLowerCase();
          const src = node.getAttribute('src') || '';
          const id = node.getAttribute('id') || '';
          const className = node.getAttribute('class') || '';

          if (tag === 'script' || tag === 'iframe' || shouldBlock(src) || shouldBlock(id) || shouldBlock(className)) {
            console.log(`[Mutation Guard] Nuked tracking element matching class/src/id context.`);
            node.remove();
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
});
