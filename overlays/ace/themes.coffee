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

define (require, exports, module) ->

  'use strict'

  exports.name = 'ace-themes'
  ### Execute following with node in 'ace/theme' dir to generate lines below:
  
  require('sys').print(['exports.themes ='].concat(
  require("fs").readdirSync(".").filter(function($) {
    return $.substr(-3) == '.js';
  }).map(function($) {
    var id = $.substr(0, $.length - 3);
    return "  '" + id + "': require 'ace/theme/" + id + "'";
  })).join('\n'))

  ###
  exports.themes =
    'clouds': require 'ace/theme/clouds'
    'clouds_midnight': require 'ace/theme/clouds_midnight'
    'cobalt': require 'ace/theme/cobalt'
    'dawn': require 'ace/theme/dawn'
    'eclipse': require 'ace/theme/eclipse'
    'idle_fingers': require 'ace/theme/idle_fingers'
    'kr_theme': require 'ace/theme/kr_theme'
    'merbivore': require 'ace/theme/merbivore'
    'merbivore_soft': require 'ace/theme/merbivore_soft'
    'mono_industrial': require 'ace/theme/mono_industrial'
    'monokai': require 'ace/theme/monokai'
    'pastel_on_dark': require 'ace/theme/pastel_on_dark'
    'textmate': require 'ace/theme/textmate'
    'twilight': require 'ace/theme/twilight'

  exports