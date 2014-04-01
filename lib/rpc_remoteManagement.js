/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2013 Sony Mobile Communications
 *
 ******************************************************************************/
(function () {
  var _impl = require("./remoteManagement_impl");

  var RPCWebinosService = require('webinos-jsonrpc2').RPCWebinosService;

  var RMService = function (rpcHandler, params) {
    // inherit from RPCWebinosService
    this.base = RPCWebinosService;
    this.base({
      api: 'http://ubiapps.com/api/remotemanagement',
      displayName: "Remote management",
      description: 'UbiApps Remote Management API.'
    });

    this.rpcHandler = rpcHandler;
  };

  RMService.prototype = new RPCWebinosService;

  RMService.prototype.startApp = function (params, successCB, errorCB) {
    return _impl.startApp(params[0], successCB, errorCB);
  };

  RMService.prototype.stopApp = function (params, successCB, errorCB) {
    return _impl.stopApp(params[0], successCB, errorCB);
  };

  RMService.prototype.isAppRunning = function (params, successCB, errorCB) {
    return _impl.isAppRunning(params[0], successCB);
  };

  RMService.prototype.getInstalledApps = function (params, successCB, errorCB) {
    return _impl.getInstalledApps(params, successCB, errorCB);
  };

  RMService.prototype.installApp = function(params, successCB, errorCB) {
    return _impl.installApp(params, successCB, errorCB);
  }

  RMService.prototype.removeApp = function(params, successCB, errorCB) {
    return _impl.removeApp(params, successCB, errorCB);
  }

  RMService.prototype.wipe = function(params, successCB, errorCB) {
    return _impl.wipe(successCB, errorCB);
  };

  // export our object
  exports.Service = RMService;

})();
