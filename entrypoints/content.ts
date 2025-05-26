import { browser } from 'wxt/browser';
import Mark from 'mark.js';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    let isStyleSheetInjected = false;
    const containerId = 'httpHeaderSpy';

    /**
     * Pauseable Timer
     */
    class Timer {
      private timerId: number = 0;
      private start: Date = new Date();
      private remaining: number;
      private element: HTMLElement | null;

      constructor(private callback: (requestId: string) => void, delay: number, private requestId: string) {
        this.remaining = delay;
        this.element = document.getElementById(containerId)?.querySelector(`[data-request-id='${requestId}']`) || null;
        this.resume();
      }

      pause() {
        window.clearTimeout(this.timerId);
        this.remaining -= new Date().getTime() - this.start.getTime();
        if (this.element !== null) {
          this.element.classList.remove('fadeOutFast');
        }
      }

      reset(callback: (requestId: string) => void, delay: number) {
        window.clearTimeout(this.timerId);
        if (this.element !== null) {
          this.element.classList.remove('fadeOutFast');
        }
        this.timerId = window.setTimeout(() => callback(this.requestId), delay);
      }

      resume() {
        this.start = new Date();
        this.timerId = window.setTimeout(() => this.callback(this.requestId), this.remaining);
      }
    }

    /**
     * Remove panel
     */
    function removePanel(requestId: string) {
      const element = document.getElementById(containerId)?.querySelector(`[data-request-id='${requestId}']`);
      if (element !== null && element !== undefined && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }

    /**
     * Fade out panel
     */
    function fadeOutPanel(requestId: string) {
      const element = document.getElementById(containerId)?.querySelector(`[data-request-id='${requestId}']`);
      if (element !== null && element !== undefined) {
        element.classList.add('fadeOutFast');
        element.classList.remove('visible');
      }
      new Timer(removePanel, 300, requestId);
    }

    /**
     * Check if a value is defined
     */
    function isDefined(value: any): boolean {
      return typeof value !== 'undefined' && value !== null;
    }

    /**
     * Append element to another element
     */
    function appendChild(parent: HTMLElement, ...children: HTMLElement[]) {
      for (const child of children) {
        parent.appendChild(child);
      }
    }

    /**
     * Remove element from container
     */
    function removeElementFromContainer(element: HTMLElement | null, animate = false) {
      if (element === null) {
        return;
      }
      if (!animate) {
        element.remove();
        return;
      }
      element.classList.add('fadeOut');
      element.addEventListener('webkitAnimationEnd', () => {
        element.remove();
      });
    }

    /**
     * Create the infoBox
     */
    function createContainer(options: any) {
      let containerElement = document.getElementById(containerId);
      if (containerElement !== null) {
        return containerElement;
      }
      
      containerElement = document.createElement(options.hidePanelAfterTimeout ? 'div' : 'details');
      containerElement.id = containerId;
      containerElement.classList.add(options.location);
      
      if (options.renderMode === 'microMode') {
        containerElement.classList.add('noMargin');
      }

      if (options.hidePanelAfterTimeout) {
        containerElement.classList.add('noToolbar');
      }

      if (document.body) {
        appendChild(document.body, containerElement);
      } else {
        appendChild(document.documentElement, containerElement);
      }

      document.onkeyup = (event) => {
        if (!isDefined(document.getElementById(containerId))) {
          return;
        }

        event = event || window.event;
        let isEscape = false;
        if ('key' in event) {
          isEscape = (event.key === 'Escape' || event.key === 'Esc');
        } else {
          isEscape = ((event as KeyboardEvent).keyCode === 27);
        }
        
        if (isEscape && containerElement instanceof HTMLDetailsElement) {
          containerElement.open = false;
        }
      };

      if (options.hideonhover && options.hideonhover !== "") {
        containerElement.addEventListener("mouseover", () => {
          if (containerElement) {
            containerElement.style.display = 'none';
            setTimeout(() => {
              if (containerElement) {
                containerElement.style.display = 'block';
              }
            }, options.hideonhover * 1000);
          }
        });
      }

      return containerElement;
    }

    browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
      switch (message.msg) {
        case 'isStyleSheetInjected':
          sendResponse({ isStyleSheetInjected });
          break;
          
        case 'styleSheetIsInjected':
          isStyleSheetInjected = true;
          break;
          
        case 'requestTypeSelectionDidChange':
          document.getElementById(containerId)?.querySelectorAll('.requestTypes .type').forEach((element) => {
            const typeElement = element as HTMLElement;
            if (message.activeRequestTypes.indexOf(typeElement.dataset.type) !== -1) {
              typeElement.classList.add('active');
              document.getElementById(containerId)?.querySelectorAll(`[data-request-type='${typeElement.dataset.type}']`).forEach((el) => {
                el.classList.remove('hidden');
                el.classList.add('visible');
              });
            } else {
              typeElement.classList.remove('active');
              document.getElementById(containerId)?.querySelectorAll(`[data-request-type='${typeElement.dataset.type}']`).forEach((el) => {
                el.classList.remove('visible');
                el.classList.add('hidden');
              });
            }
          });
          break;
          
        case 'responseCompleted':
        case 'tabActivated':
        case 'tabCreated':
        case 'tabUpdated':
          const options = message.options;
          const containerElement = createContainer(options);
          const requestIds = Object.keys(message.headers);
          
          
          break;
      }
      
      return true; // Keep the message channel open for async responses
    });
  }
});
