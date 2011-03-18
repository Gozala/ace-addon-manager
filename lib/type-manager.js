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
 *
 * ***** END LICENSE BLOCK ***** */
define(function(require, exports, module) {

'use strict';

var Trait = require('light-traits').Trait;
var grep = require('./grep').grep;
var typeUtils = require('pilot/typecheck'),
    isFunction = typeUtils.isFunction,
    isArray = Array.isArray,
    isObject = typeUtils.isObject;

var ERR_INVALID_VALUE = 'Invalid value: `{{value}}` for type `{{type}}`.';

function Type(options) {
    var descriptor;

    descriptor = options.descriptor;

    if (isFunction(descriptor))
        descriptor = { suggest: descriptor }
    else if (isArray(descriptor))
        descriptor = { suggest: grep.bind(null, descriptor, undefined) }
    else if (isObject(descriptor) && !descriptor.suggest)
        descriptor = { suggest: grep.bind(null, descriptor, undefined) }

    descriptor.name = options.name;

    return Trait(descriptor).create(Type.prototype);
}
Type.prototype = Trait({
     /**
     * If there is some concept of a higher value, return it,
     * otherwise return undefined.
     */
    increment: function(value) {
        return undefined;
    },
    /**
     * If there is some concept of a lower value, return it,
     * otherwise return undefined.
     */
    decrement: function(value) {
        return undefined;
    },
    /**
     * There is interesting information (like predictions) in a conversion of
     * nothing, the output of this can sometimes be customized.
     * @return Conversion
     */
    getDefault: function getDefault() {
        this.suggest.apply(this, arguments)[0]
    },
    valueOf: function valueOf(input, env) {
        var value = this.suggest(input, env);
        if (value.length !== 1) {
            throw new TypeError(ERR_INVALID_VALUE.
                                replace('{{type}}', this.name).
                                replace('{{value}}', input));
        }
        return value[0];
    }
}).create(Type.prototype);

// Function is called every time a plugin gets plugged, checks if plugin
// provides `types` or `settings` and registers those.
exports['plugin:startup'] = function onStartup(event) {
    var env = event.env, types = event.plugin.types;
    if (types) {
        Object.keys(types).forEach(function (name) {
            register(env, types[name], name)
        })
    }
};

// Function is called every time a plugin gets unplugged, checks if plugin
// provides `types` or `settings` and unregisters those.
exports['plugin:shutdown'] = function onShutdown(event) {
    var types, env, plugin;

    env = event.name
    plugin = event.plugin
    if ((types = plugin.types)) {
        Object.keys(types).forEach(function (name) {
            unregister(env, name)
        })
    }
};

exports['type:install'] = function onTypeInstall(event) {
    var env = event.env, type = event.descriptor, types = env.types;

    types.enabled[type.name] = type;
    delete types.disabled[type.name];
};
exports['type:failure'] = function onTypeFailed(event) {
    var env = event.env, type = event.type, types = env.types;

    types.disabled[type.name] = type;
};

function getType(env, name, enabled) {
    var types;

    types = env.types;
    return enabled === true ? types.enabled[name] :
           enabled === false ? types.disabled[name] :
           types.enabled[name] || types.disabled[name];
}

function register(env, descriptor, name) {
    var baseType, base, types;

    base = descriptor.base;
    types = env.types.enabled;

    // If type derives from other getting a base type form environment.
    if (base) baseType = types[base];
    // If base type is already registered or if type has no base we create
    // a new type out of the given type `descriptor` and signal environment.
    if (baseType || !base) {
        env._emit('type:install', {
            env: env,
            types: types,
            descriptor: Type({ name: name, descriptor: descriptor })
        });

    // Otherwise we signal to the environment that type is can't be registered
    // since base was not found.
    } else {
        env._emit('type:failure', {
            env: env,
            descriptor: descriptor,
            reason: 'base type is not registered'
        });
    }
}

exports.name = "type-manager";
exports.version = "0.0.1";
exports.description = [
    'Plugin looks for all installed plugins and specifically for a `types`',
    'property that is supposed to be a map of defined types and registers them',
    'Plugin emits following events on the environment:',
    '',
    '   - "type:install"        When new type is registered.',
    '   - "type:failure"        When type registered that depenends on other,',
    '                           not yet registered type'
].join('\n');

exports.commands = {
    setType: function setType(env, params) {
        var name, type;
        if ((type = env.types.enabled[params.name]))
            params.value = type.valueOf(params.value, env);
    }
};

exports.startup = function startup(event) {
    var env = event.env, plugins = event.plugins;

    // Listening to the plugin startup / shutdowns
    env.on('plugin:startup', exports['plugin:startup']);
    env.on('plugin:shutdown', exports['plugin:shutdown']);
    env.on('type:install', exports['type:install']);

    // Plugging all the active plugins
    Object.keys(plugins).forEach(function(name) {
        exports['plugin:startup']({ env: env, plugin: plugins[name] });
    });
}

exports.shutdown = function shutdown(event) {
    var env, enabled, disabled;

    env = event.env;
    enabled = env.types.enabled;
    disabled = env.types.disabled;

    Object.keys(enabled).forEach(function(type) {
        exports['type:uninstall'](env, type.name);
    });
};

exports.install = function install(event) {
    event.env.types = { enabled: {}, disabled: {}, installed: {} };
};

exports.uninstall = function uninstall(event) {
    delete event.env.types;
};

});
