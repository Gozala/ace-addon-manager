/* vim:set autoread :
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
*/
'use strict';define(function(require, exports, module) {
  'use strict';  var ace;
  require('pilot/fixoldbrowsers');
  ace = require('ace/ace');
  return ace.create({
    /*
    This is an order in which plug-ins are going to be
    loaded so if your plug-in A depends on B it should
    appear earlier in the array.
    */
    plugins: [
      {
        name: 'logger',
        install: function(_arg) {
          var env;
          env = _arg.env;
          env.on('plugin:startup', function(_arg) {
            var plugin, type;
            type = _arg.type, plugin = _arg.plugin;
            return console.log(type, plugin.name, plugin);
          });
          env.on('type:install', function(_arg) {
            var descriptor, type;
            type = _arg.type, descriptor = _arg.descriptor;
            return console.log(type, descriptor.name, descriptor);
          });
          return env.on('setting:install', function(_arg) {
            var setting, type;
            type = _arg.type, setting = _arg.setting;
            return console.log(type, setting.name, setting);
          });
        }
      }, require('pilot/canon'), require('ace-addon-manager/type-manager'), require('ace-addon-manager/settings-manager'), require('ace-addon-manager/theme-manager'), require('ace-addon-manager/mode-manager'), require('ace-addon-manager/command-manager'), require('ace-addon-manager/launcher'), require('ace/modes'), require('ace/themes'), require('pilot-adapter')
    ]
  });
});