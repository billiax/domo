# Domo Privacy Policy

## Data Collection

Domo does **not** collect, transmit, or store any user data on external servers.

## Data Storage

All plugin data, settings, and configuration are stored locally in your browser using `chrome.storage.local` and `localStorage`. This data never leaves your device unless you explicitly:

1. Use the optional community plugin registry (fetches plugin definitions from a configured URL)
2. Use the export feature to save a backup file

## Permissions

- **storage / unlimitedStorage**: Store plugin data and settings locally
- **scripting**: Inject plugin CSS/HTML/JS into web pages
- **tabs**: Detect active tab for plugin matching
- **sidePanel**: Display the plugin management panel
- **webNavigation**: Detect SPA navigation events
- **declarativeNetRequest**: Modify Content-Security-Policy headers to allow plugin JS execution
- **host_permissions (<all_urls>)**: Required to inject plugins on any website

## Third-Party Services

Domo does not integrate with any third-party analytics, tracking, or advertising services.

## Contact

For questions about this privacy policy, please open an issue in the project repository.
