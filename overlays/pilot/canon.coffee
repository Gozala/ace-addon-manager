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

  # Just an adapter for old commands.
  env = null
  
  tempdb = []

  exports.name = 'canon-adapter'
  exports.removeCommand = -> console.log 'removeCommand', arguments
  exports.addCommand = (command) ->
    if env
      env.emit 'command:install', name: command.name, command: command
      env.emit 'command:startup', name: command.name
    else
      tempdb.push command

  exports.getCommand = -> console.log 'getCommand', arguments
  exports.getCommandNames = -> console.log 'getCommandNames', arguments
  exports.findKeyCommand = (_env, name) ->
    # Ugly hack that uses global `env` instead of one being passed to it
    # and reason for it is a broken `env` that contains nothing.
    env.commands.enabled[name]
  exports.exec = (name, _env, scope, params) ->
    env.editor = _env.editor
    env.emit 'command:execute', params: params, name: name, scope: scope
  exports.execKeyCommand = -> console.log 'execKeyCommand', arguments
  exports.upgradeType = -> console.log 'upgradeType', arguments

  # Hack to get an access to the environment to which plugins will be installed
  exports.startup = (event) ->
    env = event.env
    for command in tempdb
      exports.addCommand command

  exports
