(function () {
  function status(message) {
    if (window.SEKIGAHARA_READY) return;
    var node = document.getElementById('boot-status');
    if (node) node.textContent = message;
  }
  window.addEventListener('error', function (event) {
    status('Sekigahara could not start: ' + (event.message || 'a script was blocked') +
      '. This file needs a JavaScript-enabled web viewer (iOS 15.4 or newer), not a source-code or Files preview. Please share this message and your viewer app name.');
  });
  window.addEventListener('unhandledrejection', function (event) {
    status('Sekigahara startup was interrupted: ' + String(event.reason) +
      '. Try a JavaScript-enabled web viewer and report this message if it continues.');
  });
  setTimeout(function () {
    status('The viewer ran JavaScript, but the game has not finished starting. Check that this app runs full webpages, not HTML previews. Please report your HTML app name, iOS version and this message. Your existing saves have not been deleted.');
  }, 12000);
}());
