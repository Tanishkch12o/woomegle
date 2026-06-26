const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

(async function() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  const client = await CDP({port: chrome.port});
  const {Network, Page, Runtime, Log} = client;

  await Promise.all([Network.enable(), Page.enable(), Runtime.enable(), Log.enable()]);

  Runtime.consoleAPICalled(api => {
    const msg = api.args.map(a => a.value || a.description).join(' ');
    console.log(`[CONSOLE ${api.type}] ${msg}`);
  });
  
  Runtime.exceptionThrown(exception => {
    console.log(`[EXCEPTION] ${exception.exceptionDetails.exception.description}`);
  });

  await Page.navigate({url: 'https://woomegle.com/chat'});
  await Page.loadEventFired();
  
  // wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  await client.close();
  await chrome.kill();
})();
