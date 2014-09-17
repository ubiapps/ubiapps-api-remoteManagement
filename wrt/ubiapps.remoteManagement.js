(function () {

  RMModule = function (obj) {
    WebinosService.call(this, obj);
  };

  // Inherit all functions from WebinosService
  RMModule.prototype = Object.create(WebinosService.prototype);
  RMModule.prototype.constructor = RMModule;

  // Register to the service discovery
  _webinos.registerServiceConstructor("http://ubiapps.com/api/remotemanagement", RMModule);

  RMModule.prototype.bindService = function (bindCB, serviceId) {
    this.startApp = startApp;
    this.stopApp = stopApp;
    this.getInstalledApps = getInstalledApps;
    this.installApp = installApp;
    this.removeApp = removeApp;
    this.wipe = wipe;

    if (typeof bindCB.onBind === 'function') {
      bindCB.onBind(this);
    }
  };

  function installApp(appURL, success, fail) {
    var rpc = webinos.rpcHandler.createRPC(this, "installApp", [appURL]);
    webinos.rpcHandler.executeRPC(rpc,
      function (res) {
        if (typeof success !== 'undefined') {
          success(res);
        }
      },
      function (err) {
        if (typeof fail !== 'undefined') {
          fail(err);
        }
      }
    );
  }

  function startApp(installId, success, fail) {
    var rpc = webinos.rpcHandler.createRPC(this, "startApp", [installId]);
    webinos.rpcHandler.executeRPC(rpc, function (res) {
      if (typeof success !== 'undefined') {
        success(res);
      }
    }, function (err) {
      if (typeof fail !== 'undefined') {
        fail(err);
      }
    });
  }

  function stopApp(installId, success, fail) {
    var rpc = webinos.rpcHandler.createRPC(this, "stopApp", [installId]);
    webinos.rpcHandler.executeRPC(rpc, function (res) {
      if (typeof success !== 'undefined') {
        success(res);
      }
    }, function (err) {
      if (typeof fail !== 'undefined') {
        fail(err);
      }
    });
  }

  function isAppRunning(installId, success) {
    var rpc = webinos.rpcHandler.createRPC(this, "isAppRunning", [installId]);
    webinos.rpcHandler.executeRPC(rpc, function (res) {
      if (typeof success !== 'undefined') {
        success(res);
      }
    });
  }

  function getInstalledApps(success, fail) {
    var rpc = webinos.rpcHandler.createRPC(this, "getInstalledApps");
    webinos.rpcHandler.executeRPC(rpc, function (lst) {
      if (typeof success !== 'undefined') {
        success(lst);
      }
    }, function (err) {
      if (typeof fail !== 'undefined') {
        fail(err);
      }
    });
  }

  function removeApp(installId, success, fail) {
    var rpc = webinos.rpcHandler.createRPC(this, "removeApp", [installId]);
    webinos.rpcHandler.executeRPC(rpc, function (res) {
      if (typeof success !== 'undefined') {
        success(res);
      }
    }, function (err) {
      if (typeof fail !== 'undefined') {
        fail(err);
      }
    });
  }

  function wipe(success, fail) {
    var rpc = webinos.rpcHandler.createRPC(this, "wipe");
    webinos.rpcHandler.executeRPC(rpc, function (result) {
      if (typeof success === 'function') {
        success(result);
      }
    }, function (err) {
      if (typeof fail === 'function') {
        fail(err);
      }
    });
  }
}());
