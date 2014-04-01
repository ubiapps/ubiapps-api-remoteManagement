(function() {
  var fs = require("fs");
  var path = require("path");
  var url = require("url");
  var child = require('child_process');
  var http = require("http");
  var webinosUtilities = require("webinos-utilities");
  var widgetLibrary;
  var signedOnly = false;
  var _runningApps = {};

  try {
    widgetLibrary = require("webinos-widget");
  } catch(e) {
    widgetLibrary = null;
    console.log("********** failed to load widget manager");
  }

  var getInstalledApps = function(params, successCB, errorCB) {
    console.log("getInstalledApps was invoked");
    var installedList = {};

    if (widgetLibrary !== null) {
      var idList = widgetLibrary.widgetmanager.getInstalledWidgets();
      for (var idx in idList) {
        var installId = idList[idx];
        var cfg = widgetLibrary.widgetmanager.getWidgetConfig(installId);
        if (cfg.startFile.contentType === "text/javascript") {
          cfg.runStatus = _runningApps.hasOwnProperty(installId) ? "running" : "not running";
        } else {
          cfg.runStatus = "unknown";
        }
        installedList[installId] = cfg;
      }
      successCB(installedList);
    } else {
      errorCB(new Error("widget library not loaded"));
    }
  };

  function downloadFile(fileURL, callback) {
    console.log('Downloading file: ' + fileURL);

    var parsed = url.parse(fileURL);
    var host = parsed.hostname;
    var port = parsed.port;
    var pathname = parsed.path;
    var filename = parsed.pathname.split('/').pop();

    var options = {
      host: host,
      port: port,
      path: pathname,
      auth: parsed.auth
    };

    // Create and execute request for the file.
    var clientReq = http.get(options, function (clientResponse) {
      // Download to temporary folder.
      var targetFilePath = path.join(webinosUtilities.webinosPath.webinosPath(), 'wrt/widgetDownloads');

      try {
        // Create the target path if it doesn't already exist.
        fs.statSync(targetFilePath);
      }  catch (e) {
        fs.mkdirSync(targetFilePath)
      }

      targetFilePath = targetFilePath + "/" + filename;
      var downloadfile = fs.createWriteStream(targetFilePath, {'flags': 'w'});
      downloadfile.on('close',function() { callback(true, targetFilePath); });

      clientResponse.setEncoding('binary');
      clientResponse.addListener('data', function (chunk) {
        downloadfile.write(chunk, encoding='binary');
      });

      clientResponse.addListener('end', function() {
        downloadfile.end();
        console.log('Finished downloading ' + fileURL);
      });
    });

    clientReq.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      callback(false);
    });
  }

  function doInstallWidget(wgtPath, callback) {
    console.log("installing " + wgtPath);

    // Callback for widget manager
    function handlePendingInstall(processingResult) {
      var installId = processingResult.getInstallId();

      if (processingResult.status) {
        // An error occurred.
        console.log('wm: pendingInstall error: install: ' + processingResult.status);
        if (installId) {
          widgetLibrary.widgetmanager.abortInstall(installId);
        }
        callback({ title: "widget installation", status: processingResult.status, text: processingResult.error.getReasonText() });
      } else {
        // Pending install OK => complete the install.
        if (signedOnly && processingResult.validationResult.status != widgetLibrary.WidgetConfig.STATUS_VALID) {
          console.log("failing installation of unsigned widget");
          callback({ title: "widget installation", status: processingResult.validationResult.status, text: "widget not signed - installation failed"});
        } else {
          console.log("******** completing install: " + installId);

          var result = widgetLibrary.widgetmanager.completeInstall(installId, true);
          if (result) {
            console.log('wm: completeInstall error: install: ' + result);
            callback({ title: "widget installation", status: result, text: "completing installation failed"});
          } else {
            console.log('wm: install complete');
            callback(null, installId);
          }
        }
      }
    }

    widgetLibrary.widgetmanager.prepareInstall(wgtPath, {}, handlePendingInstall);
  }

  var installApp = function(params, successCB, errorCB) {
    var appURL = params[0];
    if (widgetLibrary !== null) {
      console.log("installApp was invoked with " + appURL);

      downloadFile(appURL, function(ok, filePath) {
        if (ok) {
          doInstallWidget(filePath,function(err, installId) {
            successCB({
                "ok" : err === null,
                "installId": installId,
                "err" : err
              });
          });
        } else {
          errorCB(new Error("download failed"));
        }
      });
    } else {
      errorCB(new Error("widget library not loaded"));
    }
  };

  var removeApp = function(params, successCB, errorCB) {
    var installId = params[0];
    stopApp(installId);
    if (widgetLibrary !== null) {
      widgetLibrary.widgetmanager.uninstall(installId);
      successCB();
    } else {
      errorCB(new Error("widget library not loaded"));
    }
  };

  var startApp = function(installId, successCB, errorCB) {
    if (_runningApps.hasOwnProperty(installId)) {
      errorCB({ message: "app " + installId + " already running" });
    } else {
      if (widgetLibrary !== null) {
        var cfg = widgetLibrary.widgetmanager.getWidgetConfig(installId);
        if (cfg) {
          if (cfg.startFile.contentType === "text/javascript") {
            console.log("starting service widget " + cfg.installId);
            var widgetDir = widgetLibrary.widgetmanager.getWidgetDir(cfg.installId);
            var widgetPath = path.join(widgetDir,cfg.startFile.path);
            console.log("*** " + widgetPath);
            var childProc = child.fork(widgetPath,[],{cwd: widgetDir });
            console.log("*** forked: " + childProc.pid);
            _runningApps[cfg.installId] = childProc;
            childProc.on("close", function(code,signal) {
              console.log("service widget closed with code: " + code + " and signal " + signal);
            });
            childProc.on("exit", function(code,signal) {
              console.log("service widget ended with code: " + code + " and signal " + signal);
              if (_runningApps.hasOwnProperty(cfg.installId)) {
                delete _runningApps[cfg.installId];
              }
            });
            successCB();
          } else {
            errorCB(new Error("not a service widget - can only start service widgets"));
          }
        } else {
          errorCB(new Error("widget library failed to find app " + installId));
        }
      } else {
        errorCB(new Error("widget library not loaded"));
      }
    }
  };

  var stopApp = function(installId, successCB, errorCB) {
    if (!_runningApps.hasOwnProperty(installId)) {
      if (typeof errorCB === "function") {
        errorCB(new Error("app " + installId + " not running"));
      }
    } else {
      try {
        _runningApps[installId].kill();
        if (typeof successCB === "function") {
          successCB();
        }
      } catch (e) {
        if (typeof errorCB === "function") {
          errorCB(e);
        }
      }
    }
  };

  var isAppRunning = function(installId, successCB) {
    if (!_runningApps.hasOwnProperty(installId)) {
      successCB(false);
    } else {
      successCB(true);
    }
  };

  var wipe = function(successCB, errorCB) {
    console.log("wipe was invoked");
    if (widgetLibrary !== null) {
      var idList = widgetLibrary.widgetmanager.getInstalledWidgets();
      var totalCount = idList.length;
      var failedCount = 0;
      for (var installId in idList) {
        try {
          widgetLibrary.widgetmanager.uninstall(idList[installId]);
        } catch (e) {
          failedCount++;
        }
      }
      successCB({
        totalCount: totalCount,
        failedCount : failedCount
      });
    } else {
      errorCB(new Error("widget library not loaded"));
    }
  };

  module.exports = {
    startApp: startApp,
    stopApp: stopApp,
    isAppRunning: isAppRunning,
    getInstalledApps: getInstalledApps,
    installApp: installApp,
    removeApp: removeApp,
    wipe: wipe
  };
}());