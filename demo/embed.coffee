### vim:set autoread :
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
###

'use strict'

define (require, exports, module) ->
  'use strict'

  # Adds ES5 functionality to the browsers that don't have it built-in.
  # TODO: Replace this with -> https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js 
  require 'pilot/fixoldbrowsers'
  ace = require 'ace/ace'
  { launch } = require 'ace/launcher'
  
  launch {}
  ###
  `ace.create({
  // This is an order in which plug-ins are going to be
  // loaded so if your plug-in A depends on B it should
  // appear earlier in the array.
  plugins: [
    {   name: 'logger',
        install: function (data) {
            var env = data.env;
            env.on("plugin:startup", function(event) {
                console.log(event.type, event.plugin.name, event.plugin);
            });
            env.on("type:install", function(event) {
                console.log(event.type, event.descriptor.name, event.descriptor);
            });
            env.on("setting:install", function(event) {
                console.log(event.type, event.setting.name, event.setting);
            });
        }
    },
    require("pilot/index"),
    require("pilot/canon"),
    require("ace-addon-manager/type-manager"),
    // For the moment settings-manager should at the top
    // so that settings will get picked up.
    require("ace-addon-manager/settings-manager"),

    exports,
    require("cockpit/index"),
    require("ace/defaults"),

    // themes
    require("ace/theme-manager"),
    require("ace/theme/twilight"),
    require("ace/theme/textmate"),
    require("ace/theme/clouds_midnight"),
    require("ace/theme/cobalt"),
    require("ace/theme/dawn"),
    require("ace/theme/eclipse"),
    require("ace/theme/idle_fingers"),
    require("ace/theme/kr_theme"),
    require("ace/theme/mono_industrial"),
    require("ace/theme/monokai"),
    require("ace/theme/pastel_on_dark"),
    // modes
    require("ace/mode-manager"),
    require("ace/mode/javascript"),
    require("ace/mode/css"),
    require("ace/mode/html"),
    require("ace/mode/xml"),
    require("ace/mode/python"),
    require("ace/mode/php"),
    require("ace/mode/java"),
    require("ace/mode/ruby"),
    require("ace/mode/text")
  ]
})`
###
