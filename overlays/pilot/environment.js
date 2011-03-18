/* vim:ts=4:sts=4:sw=4:
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
 * The Original Code is DomTemplate.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com) (original author)
 *   Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
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
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {

var EventEmitter = require('./event_emitter').EventEmitter;

/**
 * Environment is an object holding were plugins, system or users can share
 * properties with each other, concept is similar and pretty much inspired by
 * Unix environment. Environments also can be thought as a D-BUS since property
 * changes and messages can be exchanged between it's consumers.
 *
 * Environment function takes optional `environment` argument. This allows
 * creation of sub-environments of the given `environment`, which is powerful
 * since all the properties of the parent environment are shared with a sub
 * environments (using prototype chain), but not other way round. This way all
 * the plugins can be added to the top environment so that they can be shared
 * across all sub environments.
 * @param {Environment} [environment]
 *    Optional parent environment
 * @returns {Environment}
 */
function Environment(environment) {
  return Object.create(environment || Environment.prototype);
}
Environment.prototype = Object.create(EventEmitter, {
    emit: { value: function emit(type, event) {
        event.env = this;
        this._emit(type, event);
    }, enumerable: true },
    /**
     * Retrieves environment property with the given `name`, unless it
     * conflicts with an environment methods `get` and `set`.
     * @param {String} name
     *    Name of the property.
     */
    get: { value: function get(name) {
      if (name in Environment.prototype)
          throw new Error("Can't get property with reserved name: " + name);

        return this[name];
    }, enumerable: true },
    /**
     * Setting environment property with the given `name` and `value` and
     * emits `set` event on itself to notify all the observes.
     * @param {String} name
     *    Name of the property.
     * @param {Object} value
     *    Value to be set.
     */
    set: { value: function set(name, value) {
        if (name in Environment.prototype)
          throw new Error("Can't set property with reserved name: " + name);

        // Notifying all the listeners that property was set.
        this._emit('set', {
          name: name,
          value: this[name] = value,
          env: this
        });

        return value;
    }, enumerable: true }
});
exports.Environment = Environment;

});
