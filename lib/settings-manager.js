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

"use strict";

var Trait = require("light-traits").Trait;

var settings = {};

function Setting(descriptor, name) {
    // If instance of `Setting` is passed then it must be installed to the
    // different environment so we have to create another wrapper of the
    // enclosed setting.
    if (descriptor.constructor === Setting)
        descriptor = Object.getPrototypeOf(descriptor);

    descriptor.name = name;
    descriptor.defaultValue = descriptor.defaultValue || null;

    return TSetting.create(descriptor);
}
var TSetting = Trait({
    constructor: Setting,
    /**
     * Each setting must have a type that is registered by a type-manager.
     */
    type: Trait.required,
    /**
     * Each setting must have a unique name associated with the setting.
     */
    name: Trait.required,
    /**
     * Each setting must have `defaultValue` associated with it.
     */
    defaultValue: Trait.required,

    get: function get(env) {
        return env["setting:" + this.name];
    },
    set: function set(env, value) {
        var result = false;

        if (this.get(env) !== value) {
            env["setting:" + this.name] = value;
            env._emit("setting:set", {
                env: env,
                setting: this,
                value: value
            });
            result = true;
        }

        return result;
    },
    reset: function reset(env) {
        var result = false;

        if (this.get(env) !== this.defaultValue) {
            env._emit("setting:reset", {
                env: env,
                setting: this.defaultValue,
                value: value
            });
            result = this.set(env, this.defaultValue);
        }

        return result;
    }
});

// Function is called every time a plugin gets plugged, checks if plugin
// provides `types` or `settings` and registers those.
exports["plugin:startup"] = function onPluginStartup(event) {
    var env, settings;
    env = event.env;
    // Register types if provided. Important to register them first, since
    // settings may relay on them.
    // if (plugin.types)
        //types.registerTypes(plugin.types)
    // Registering settings if provided.
    if ((settings = event.plugin.settings)) {
        Object.keys(settings).forEach(function (name) {
            env._emit('setting:install', {
                env: env,
                settings: env.settings.enabled,
                setting: Setting(settings[name], name)
            });

        });
    }
};
// Function is called every time a plugin gets unplugged, checks if plugin
// provides `types` or `settings` and unregisters those.
exports["plugin:shutdown"] = function onPluginShutdown(event) {
    var env;
    env = event.env;

    if ((settings = event.plugin.settings)) {
        Object.keys(settings).forEach(function (name) {
            env._emit('setting:uninstall', {
                env: env,
                setting: env.settings.installed[name]
            });
        });
    }
};

exports['setting:install'] = function onSettingInstall(event) {
    var env, setting

    env = event.env;
    setting = event.setting;

    env.settings.installed[setting.name] = setting;
};

exports['setting:uninstall'] = function onSettingUninstall(event) {
    delete event.env.settings.installed[event.setting.name];
};

// Function called every time anything gets set on the environment, with an 
// `event` containing `name` and `value` properties.
function onSet(event) {
    var env, name, settings;

    env = event.env;
    name = event.name;
    settings = env.settings.enabled;

    env._emit('setting:set', {
        env: env,
        name: name,
        value: event.value
    })
}

exports['setting:reset'] = function onReset(event) {
};

exports['type:install'] = function onTypeInstall(event) {
    var type = event.descriptor;
};
exports['type:uninstall'] = function onTypeUninstall(event) {
    var type = event.descriptor;
};

function unregister(env, name) {
    var settings, setting

    settings = env.settings;
    setting = settings.enabled[name];
    settings.disabled[name] = setting;
    delete settings.enabled[name];

    env._emit('setting:uninstall', {
        env: env,
        setting: setting
    });
}

exports.name = 'setting-manager';
exports.description = 'Plugin observes setting changes';
exports.version = '0.0.1';
exports.types = {
    settingValue: {}
};
exports.commands = {
    set: {
        description: 'Sets a setting',
        params: [
            {
                name: 'name',
                type: 'setting',
                description: 'The name of the setting to display or alter'
            },
            {
                name: 'value',
                type: 'settingValue',
                description: 'The new value for the chosen setting'
            }
        ],
        exec: function (env, params) {
            onSet({
                env: env,
                name: params.name,
                value: params.value
            })
        }
    }
}

exports.install = function install(event) {
    event.env.settings = { enabled: {}, disabled: {}, installed: {} };
    exports.types.setting = event.env.settings.installed;
};

exports.uninstall = function uninstall(event) {
    delete event.env.settings;
};

exports.startup = function startup(data) {
    var env = data.env, plugins = data.plugins;

    // Listen to all the env variable set's.
    // env.on('set', onSet);

    env.on('setting:install', exports['setting:install']);
    env.on('setting:uninstall', exports['setting:uninstall']);
    env.on('setting:reset', exports['setting:reset']);

    env.on('type:install', exports['type:install']);
    env.on('type:uninstall', exports['type:uninstall']);

    // Register listener to register all the plug-ins that will be plugged.
    env.on('plugin:startup', exports['plugin:startup']);

    // Register listener to unregister all the plug-ins that will be unplugged.
    env.on('plugin:shutdown', exports['plugin:shutdown']);

    // Go through all plugged plug-ins and register them.
    Object.keys(plugins).forEach(function (name) {
        exports['plugin:startup']({ env: env, plugin: plugins[name] });
    });
};

exports.shutdown = function shutdown(data) {
    var env = data.env, plugins = data.plugins;

    env.removeListener("set", onSet);
    env.removeListener('setting:reset', exports['setting:reset']);
    env.removeListener('plugin:startup', exports['plugin:startup']);
    env.removeListener('plugin:shutdown', exports['plugin:shutdown']);
    env.removeListener('type:install', exports['type:install']);
    env.removeListener('type:uninstall', exports['type:uninstall']);

    Object.keys(plugins).forEach(function (name) {
        onPluginShutdown({ env: env, plugin: plugins[name] });
    });
};

});
