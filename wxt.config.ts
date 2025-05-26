import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: '__MSG_extensionName__',
    short_name: '__MSG_extensionNameShort__',
    version: '2.0.49',
    description: '__MSG_extensionDescription__',
    author: { email: 'michiel@michielroos.com' },
    homepage_url: 'http://www.michielroos.com/',
    default_locale: 'en',
    permissions: [
      'tabs',
      'activeTab', 
      'storage',
      'webRequest'
    ],
    host_permissions: [
      'http://*/*',
      'https://*/*'
    ],
    web_accessible_resources: [{
      resources: ['Resources/HTML/plans.html', 'Resources/HTML/thanks.html'],
      matches: ['<all_urls>']
    }]
  }
});
