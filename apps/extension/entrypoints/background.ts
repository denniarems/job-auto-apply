export default defineBackground(() => {
  // Allow the side panel to be opened by clicking the extension action
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  console.log('Hello background!', { id: browser.runtime.id });
});
