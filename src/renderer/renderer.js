const tabsContainer = document.getElementById('tabsContainer');
const viewContainer = document.getElementById('viewContainer');
const newTabBtn = document.getElementById('newTabBtn');
const urlInput = document.getElementById('urlInput');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const refreshBtn = document.getElementById('refreshBtn');
const progressBar = document.getElementById('progressBar');
const engineSelect = document.getElementById('engineSelect');

// Feature Toggles and Sidebars
const toggleBookmarksBtn = document.getElementById('toggleBookmarksBtn');
const toggleAiBtn = document.getElementById('toggleAiBtn');
const bookmarkSidebar = document.getElementById('bookmarkSidebar');
const aiSidebar = document.getElementById('aiSidebar');
const addBookmarkBtn = document.getElementById('addBookmarkBtn');
const bookmarksList = document.getElementById('bookmarksList');
const aiChatOutput = document.getElementById('aiChatOutput');
const aiInput = document.getElementById('aiInput');
const sendAiBtn = document.getElementById('sendAiBtn');
const customTooltip = document.getElementById('customTooltip');

let tabs = [];
let activeTabId = null;
let savedBookmarks = JSON.parse(localStorage.getItem('aurora_bookmarks')) || [];

class Tab {
  constructor(id, targetUrl = 'https://www.google.com') {
    this.id = id;
    this.summarySnapshot = "No snapshot generated yet.";
    
    this.tabEl = document.createElement('div');
    this.tabEl.className = 'tab';
    this.tabEl.innerHTML = `
      <span class="tab-title">Loading...</span>
      <button class="close-tab-btn">&times;</button>
    `;
    
    this.webviewEl = document.createElement('webview');
    this.webviewEl.setAttribute('src', targetUrl);
    this.webviewEl.setAttribute('preload', '../main/preload.js');
    
    tabsContainer.appendChild(this.tabEl);
    viewContainer.appendChild(this.webviewEl);
    
    this.setupEvents();
  }

  setupEvents() {
    this.tabEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-tab-btn')) {
        closeTab(this.id);
      } else {
        switchTab(this.id);
      }
    });

    // Custom AI Tab Hover Preview Triggers
    this.tabEl.addEventListener('mouseenter', (e) => {
      if (this.id === activeTabId) return;
      customTooltip.textContent = this.summarySnapshot;
      customTooltip.style.display = 'block';
    });

    this.tabEl.addEventListener('mousemove', (e) => {
      customTooltip.style.left = (e.pageX + 15) + 'px';
      customTooltip.style.top = (e.pageY + 15) + 'px';
    });

    this.tabEl.addEventListener('mouseleave', () => {
      customTooltip.style.display = 'none';
    });

    this.webviewEl.addEventListener('did-start-loading', () => {
      if (activeTabId === this.id) {
        progressBar.style.opacity = '1';
        progressBar.style.width = '30%';
      }
    });

    this.webviewEl.addEventListener('did-stop-loading', async () => {
      if (activeTabId === this.id) {
        progressBar.style.width = '100%';
        setTimeout(() => {
          if (progressBar.style.width === '100%') progressBar.style.opacity = '0';
        }, 250);
      }
      this.updateNavigationState();

      // Background DOM Text Extraction for Hover Summaries
      try {
        const textContext = await this.webviewEl.executeJavaScript(`
          (() => {
            const nodes = document.querySelectorAll('h1, p');
            return Array.from(nodes).map(n => n.innerText).join(' ').substring(0, 400);
          })()
        `);
        if (textContext && textContext.trim().length > 10) {
          this.summarySnapshot = `Snippet: "${textContext.trim().substring(0, 120)}..."`;
        } else {
          this.summarySnapshot = "Empty canvas page data.";
        }
      } catch (e) {
        this.summarySnapshot = "Unable to process page text details.";
      }
    });

    this.webviewEl.addEventListener('page-title-updated', (e) => {
      this.tabEl.querySelector('.tab-title').textContent = e.title;
    });

    this.webviewEl.addEventListener('did-navigate', (e) => {
      if (activeTabId === this.id) urlInput.value = e.url;
    });
  }

  updateNavigationState() {
    if (activeTabId === this.id) {
      backBtn.disabled = !this.webviewEl.canGoBack();
      forwardBtn.disabled = !this.webviewEl.canGoForward();
    }
  }

  activate() {
    this.tabEl.classList.add('active');
    this.webviewEl.classList.add('visible');
    urlInput.value = this.webviewEl.getURL() || '';
    this.updateNavigationState();
  }

  deactivate() {
    this.tabEl.classList.remove('active');
    this.webviewEl.classList.remove('visible');
  }

  destroy() {
    this.tabEl.remove();
    this.webviewEl.remove();
  }
}

function createNewTab(url) {
  const id = Date.now().toString();
  const newTab = new Tab(id, url);
  tabs.push(newTab);
  switchTab(id);
}

function switchTab(id) {
  if (activeTabId === id) return;
  tabs.forEach(tab => {
    if (tab.id === id) {
      tab.activate();
      activeTabId = id;
    } else {
      tab.deactivate();
    }
  });
}

function closeTab(id) {
  const index = tabs.findIndex(tab => tab.id === id);
  if (index === -1) return;
  tabs[index].destroy();
  tabs.splice(index, 1);
  if (tabs.length === 0) { createNewTab(); return; }
  if (activeTabId === id) {
    const nextIdx = index === 0 ? 0 : index - 1;
    switchTab(tabs[nextIdx].id);
  }
}

// Multi-Engine Adaptive Address Execution Block
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let input = urlInput.value.trim();
    if (!input) return;

    if (!/^https?:\/\//i.test(input) && !input.includes('.')) {
      // Pull configuration context directly from the selector value chosen
      const baseEngine = engineSelect.value;
      input = `${baseEngine}${encodeURIComponent(input)}`;
    } else if (!/^https?:\/\//i.test(input)) {
      input = `https://${input}`;
    }

    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) activeTab.webviewEl.src = input;
  }
});

// Sidebar Drawer Control Mechanics
toggleBookmarksBtn.addEventListener('click', () => bookmarkSidebar.classList.toggle('open'));
toggleAiBtn.addEventListener('click', () => aiSidebar.classList.toggle('open'));

// Bookmarks Array Persistence Logic
function renderBookmarks() {
  bookmarksList.innerHTML = '';
  savedBookmarks.forEach(b => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.textContent = b.title || b.url;
    item.addEventListener('click', () => {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (activeTab) activeTab.webviewEl.src = b.url;
    });
    bookmarksList.appendChild(item);
  });
}

addBookmarkBtn.addEventListener('click', () => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (activeTab) {
    const url = activeTab.webviewEl.getURL();
    const title = activeTab.tabEl.querySelector('.tab-title').textContent || url;
    if (!savedBookmarks.some(b => b.url === url)) {
      savedBookmarks.push({ title, url });
      localStorage.setItem('aurora_bookmarks', JSON.stringify(savedBookmarks));
      renderBookmarks();
    }
  }
});

// Sidebar Local Simulation AI Chat Responses
async function handleAiPrompt() {
  const text = aiInput.value.trim();
  if (!text) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'user-msg';
  userDiv.textContent = text;
  aiChatOutput.appendChild(userDiv);
  aiInput.value = '';

  const aiDiv = document.createElement('div');
  aiDiv.className = 'ai-msg';
  aiDiv.textContent = "Analyzing document content elements...";
  aiChatOutput.appendChild(aiDiv);
  aiChatOutput.scrollTop = aiChatOutput.scrollHeight;

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  let documentAnalysis = "No active page data found.";
  
  if (activeTab) {
    try {
      documentAnalysis = await activeTab.webviewEl.executeJavaScript(`document.title`);
    } catch(err) {}
  }

  // Simulating quick contextual feedback loop on active element tab
  setTimeout(() => {
    aiDiv.textContent = `[Aurora Core AI Feed]: Processed your request regarding context on "${documentAnalysis}". Elements look secure under Layer 2 filters.`;
    aiChatOutput.scrollTop = aiChatOutput.scrollHeight;
  }, 800);
}

sendAiBtn.addEventListener('click', handleAiPrompt);
aiInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAiPrompt(); });

backBtn.addEventListener('click', () => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (activeTab && activeTab.webviewEl.canGoBack()) activeTab.webviewEl.goBack();
});
forwardBtn.addEventListener('click', () => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (activeTab && activeTab.webviewEl.canGoForward()) activeTab.webviewEl.goForward();
});
refreshBtn.addEventListener('click', () => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (activeTab) activeTab.webviewEl.reload();
});

// Setup baseline browser components
renderBookmarks();
createNewTab();
