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
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Kevin Dangoor (kdangoor@mozilla.com)
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

var Trait = require('light-traits').Trait

// # Reason constants #
// The bootstrap functions accept a reason parameter, which explains to the
// plugin why it's being called.
// The reason constants are:
var APP_STARTUP = 'startup';        // The application is starting up.
var APP_SHUTDOWN = 'shutdown';      // The application is shutting down.
var PLUGIN_ENABLE = 'enable';       // The plugin is being enabled.
var PLUGIN_DISABLE = 'disable';     // The plugin is being disabled.
var PLUGIN_INSTALL = 'install';     // The plugin is being installed.
var PLUGIN_UNINSTALL = 'uninstall'; // The plugin is being uninstalled.
var PLUGIN_UPGRADE = 'upgrade';     // The plugin is being upgraded.
var PLUGIN_DOWNGRADE = 'downgrade'; // The plugin is being downgraded.

// # Status constants #
// The plugin can be in a different state in time.
var ENABLED = 'enabled';
var DISABLED = 'disabled';
var UNINSTALLED = 'uninstalled';

// Namespace used under environment.
var NS = "plugin";

/**
 * Name of this plugin.
 */
exports.name = 'plugin-manager';
/**
 * Version of the plugin.
 */
exports.version = '0.0.1';
/**
 * Plugin description.
 */
exports.description = [
    'Plugin manager allows you to install, uninstall, start and stop',
    'plugins. Plugin is just an object that contains only one required',
    'property `name` that represents unique name of the plugin.',
    'Optionally `version` property can be implemented, otherwise plugin',
    'version will default to `0.0.0`.',
    'Plugin manager also looks for following properties / endpoints:',
    '',
    '   - install',
    '   - uninstall',
    '   - startup',
    '   - shutdown',
    '',
    'All of which are functions and are called when associated actions',
    'takes place. All of this functions are passed an object containing',
    'associated `env` environment that can be used to set up a listeners',
    'on the events emitted by this or other plugins. This plugin emits',
    'following events:',
    '',
    '   - "plugin:install"      Emitted when some plugin is installed.',
    '   - "plugin:uninstall"    Emitted when some plugin is uninstalled.',
    '   - "plugin:startup"      Emitted when some plugin is started.',
    '   - "plugin:shutdown"     Emitted when some plugin is stopped.'
].join('\n');

/**
 * Function wraps given plugin `descriptor` object into a plugin object, to
 * provide standard API for starting, stopping and doing some other operations
 * on plugin. Also please note that object returned is not an instance of
 * `Plugin` even though it has `constructor` property with a value `Plugin`,
 * this allows plugins with their custom inheritance chains.
 * @See TPlugin
 */
function Plugin(descriptor) {
    // If instance of `Plugin` is passed then it must be installed to the
    // different environment so we have to create another wrapper of the
    // enclosed environment.
    if (descriptor.constructor === Plugin)
        descriptor = Object.getPrototypeOf(descriptor);
    // If version is not provided by a plugin default version is generated.
    if (!descriptor.version) descriptor.version = '0.0.0';

    return TPlugin.create(descriptor);
}
var TPlugin = Trait({
    /**
     * Method is added to all plugins to allow duck type checking if object is
     * a `Plugin`.
     */
    constructor: Plugin,
    /**
     * All plugins objects need to implement `name` property with unique name
     * of that plugin.
     * @type {String}
     */
    name: Trait.required,
    /**
     * All plugins are supposed to have a version. In a future this property may
     * become a mandatory to all the plugin objects, but at this point it is
     * optional and it defaults to `"0.0.0"`. Version is supposed to be in
     * [semver](http://semver.org/) format.
     * @type {String}
     */
    version: Trait.required,
    /**
     * Status of the enclosed plugin. Plugin can be `'enabled'`, `'disabled'` or
     * `'uninstalled'`.
     * @type {Number}
     */
    status: DISABLED,
    /**
     * This method **may** be implemented by plugin object and if it is
     * implemented it is called when the plugin needs to start itself up.
     * This happens at application launch time or when the plugin is enabled
     * after being disabled (or after it has been shut down in order to install
     * an update. As such, this can be called many times during the lifetime of
     * the application.
     *
     * There are several scenarios in which the `startup()` function may be
     * called:
     * for example:
     * - When the plugin is first installed, assuming that it's both compatible
     *   with the application and is enabled.
     * - When the plugin becomes enabled using the plugin manager.
     * - When the application is started up, if extension is enabled and
     *   compatible with the application.
     *
     * @param {Object} data
     *      A JavaScript object containing basic information for the plugin,
     *      these are: `plugin`, `reason`, `env`.
     */
    startup: function startup(data) {
        var descriptor, status = this.status;

        if (status === DISABLED) {
            data.plugin = this;
            descriptor = Object.getPrototypeOf(this);
            if ('startup' in descriptor) descriptor.startup(data);
            // Fall back to the old naming convention.
            else if ('plug' in descriptor) descriptor.plug(data);
            // Changing status of the plugin to 'enabled'.
            this.status = ENABLED;
            // Notifying environment that plugin is enabled.
            data.env._emit(NS + ':startup', data);
        }
    },
    /**
     * This method **may** be implemented by plugin object. If implemented
     * method is called when plugin needs to shut itself down, such as when
     * the application is quitting or when the extension is about to be
     * upgraded or disabled. Any user interface that has been injected must be
     * removed, tasks shut down, and objects disposed of.
     *
     * Some examples of when the `shutdown()` function may be called:
     * - When the extension is uninstalled, if it's currently enabled.
     * - When the extension becomes disabled.
     * - When the user quits the application, if the extension is enabled.
     *
     * @param {Object} data
     *      A JavaScript object containing basic information for the plugin,
     *      these are: `plugin`, `reason`, `env`.
     */
    shutdown: function shutdown(data) {
        var descriptor, status = this.status;

        if (status === ENABLED) {
            data.plugin = this;
            descriptor = Object.getPrototypeOf(this);
            if ('shutdown' in descriptor) descriptor.shutdown(data);
            // Fall back to the old naming convention.
            else if ('unplug' in descriptor) descriptor.unplug(data);
            // Changing status of the plugin to 'disabled'.
            this.status = DISABLED;
            // Notifying environment that plugin is disabled.
            data.env._emit(NS + ':shutdown', data);
        }
    },
    /**
     * This method **may** be implemented by plugin object. If implemented
     * method is called when plugin is installed, upgraded, or downgraded.
     * @param {Object} data
     *      A JavaScript object containing basic information for the plugin,
     *      these are: `plugin`, `reason`, `env`.
     */
    install: function install(data) {
        var status = this.status, descriptor = Object.getPrototypeOf(this);

        data.plugin = this;
        // If plugin implements install hook calling it so that it can do a
        // necessary stuff.
        if ('install' in descriptor) descriptor.install(data);
        // Notifying environment that plugin is 'installed'.
        data.env._emit(NS + ':install', data);
    },
    /**
     * This method **may** be implemented by plugin object. If implemented
     * method is called before plugin is uninstalled.
     * @param {Object} data
     *      A JavaScript object containing basic information for the plugin,
     *      these are: `plugin`, `reason`, `env`.
     */
    uninstall: function uninstall(data) {
        var status = this.status, descriptor = Object.getPrototypeOf(this);

        data.plugin = this;
        if ('uninstall' in descriptor) descriptor.uninstall(data);
        // Setting status to 'uninstalled'
        this.status = UNINSTALLED;
        // Notifying environment that plugin is 'uninstalled'
        data.env._emit(NS + ':uninstall', data);
    }
});

/**
 * Returns plugins installed / enabled / disabled in the given `env`
 * environment. If `enabled` is `true` then map of started plugins is returned
 * else if `enabled` is `false` then map of non started plugins is returned
 * if `enabled` is not passed then map of all installed plugins is returned.
 * @param {Environment} env
 *      Environment where plugin was installed or any of it's sub-environments.
 * @param {Boolean} [enabled]
 *      If `true` looks only in plugins that are started-up if `false` looks
 *      only into disabled plugins. If omitted or `undefined` looks into all
 *      installed plugins.
 */
function getPlugins(env, enabled) {
    var type = enabled ? 'enabled' : false === enabled ? 'disabled' :
               'installed';

    return env.plugins[type];
}
exports.getPlugins = getPlugins;

/**
 * Installs this plugin into given environment and starts it up.
 */
function initialize(env) {
    // Adding `plugin` namespace with sub maps where plugins of this
    // environment will be stored. This is only supposed to be used
    // internally by this plugin all the other consumers should listen
    // to the "plugin:*" events.
    var plugins = env.plugins = { enabled: {}, disabled: {}, installed: {} };
    // Creating this plugin.
    var plugin = Plugin({
        name: exports.name,
        version: exports.version,
        description: exports.description
    });

    // Setting up all the plugin related event listeners.
    env.on(NS + ':startup', exports['plugin:startup']);
    env.on(NS + ':shutdown', exports['plugin:shutdown']);
    env.on(NS + ':install', exports['plugin:install']);
    env.on(NS + ':uninstall', exports['plugin:uninstall']);

    // Manually installing plugin created so that it will report itself
    // correctly.
    plugin.install({ env: env });
    plugin.startup({ env: env });
}

/**
 * Installs given `plugin`. If plugin does not has `name` property exception
 * is going to be thrown. If plugin with this `name` is already installed
 * plugin installation will fail and `false` will be returned. If plugin
 * is installed successfully "plugins:install" event will be emitted on the
 * given `env` and `true` will be returned.
 * @param {Object} descriptor
 *      Plugin descriptor that must have `name` property.
 * @param {Object} data
 *      Data that must contain `env` property on which "plugins:install"
 *      event will be emitted.
 * @returns {Boolean}
 *      `true` if install was successful and `false` if install failed.
 */
exports.install = function install(env, descriptor, reason) {
    var result = false, reason = reason || PLUGIN_INSTALL;
    // If environment does not contains plugins it means that plugin-manager
    // plugin is not installed yet.
    if (!env.plugins) initialize(env);

    // Creating a plugin from the given plugin descriptor.
    plugin = Plugin(descriptor);
    console.log(plugin.name)
    // If plugin with that name is not yet installed we install it.
    if (!getPlugins(env)[plugin.name]) {
        // Installing plugin.
        plugin.install({ env: env, reason: reason });
        result = true;
    }
    return result;
};

/**
 * Uninstall a plugin with the given `name` from the given `env` environment.
 * If uninstall was successful "plugins:uninstall" event is emitted on the
 * environment and `true` is returned. If plugins `uninstall` hook throws
 * exception it will propagate through to the caller of this function.
 * @param {Environment} env
 *      Environment where plugin have to be uninstalled from.
 * @param {String} name
 *      Name of the plugin that has to be uninstalled.
 * @param {String} [reason="uninstall"]
 *      Reason for plugin to be uninstalled.
 * @returns {Boolean}
 *      `true` if install was successful and `false` if install failed.
 */
exports.uninstall = function uninstall (env, name, reason) {
    var result = false, plugin, reason = reason || PLUGIN_UNINSTALL;
    // Getting a plugin with that name from the installed plugins.
    if ((plugin = getPlugins(env)[name])) {
        // Shut down plugin if started
        shutdown(env, name, reason);
        // Uninstall plugin.
        plugin.uninstall({ env: env, reason: reason });
        result = true;
    }
    return result;
};

/**
 * Starts up plugin with the given `name` from the given `env` environment.
 * If startup is successful `"plugins:startup"` event is emitted on the
 * environment and `true` is returned.
 * @param {Environment} env
 *      Environment where plugin is installed and have to be started.
 * @param {String} name
 *      Name of the plugin that has to be started.
 * @param {String} [reason="enable"]
 *      Reason for plugin startup.
 */
exports.startup = function startup(env, name, reason) {
    var result = false, reason = reason || PLUGIN_ENABLE, plugin;
    // Getting disabled plugin with given `name` from environment.
    if ((plugin = getPlugins(env, false)[name])) {
        // Starting up plugin.
        plugin.startup({
            env: env,
            reason: reason,
            plugins: getPlugins(env, true)
        });
        result = true;
    }
    return result;
};

/**
 * Shutdown a plugin with the given `name` from the given `env` environment.
 * @param {Environment} env
 *      Environment where plugin is installed and have to be started.
 * @param {String} name
 *      Name of the plugin that has to be started.
 * @param {String} [reason="disable"]
 *      Reason for plugin startup.
 */
exports.shutdown =function shutdown(env, name, reason) {
    var result = false, reason = reason || PLUGIN_DISABLE, plugin;

    // Getting enabled plugin from the given environment.
    if ((plugin = getPlugins(env, true)[name])) {
        // Shutting down plugin.
        plugin.shutdown({ env: env, reason: reason });
        result = true;
    }
    return result;
};

/**
 * This function is a listener that is called every time any plugin is started
 * up. It moves started plugin from the map of disabled plugins to the map of
 * enabled plugins of the given environment.
 */
exports['plugin:startup'] = function onStartup(event) {
    var plugins = event.env.plugins, plugin = event.plugin, name = plugin.name;

    delete plugins.disabled[name];
    plugins.enabled[name] = plugin;
};

/**
 * This function is a listen that is called every time any plugin is shut down.
 * It moves plugin from the map of enabled plugins to the map of disabled
 * plugins of the given environment.
 */
exports['plugin:shutdown'] = function onShutdown(event) {
    var plugins = event.env.plugins, plugin = event.plugin, name = plugin.name;

    delete plugins.enabled[name];
    plugins.disabled[name] = plugin;
};

/**
 * This function is a listen that is called every time any plugin is installed.
 * It adds plugins to the maps of installed and disabled plugins of the given
 * environment.
 */
exports['plugin:install'] = function onInstall(event) {
    var plugins = event.env.plugins, plugin = event.plugin, name = plugin.name;

    plugins.disabled[name] = plugins.installed[name] = plugin;
};

/**
 * This function is a listen that is called every time any plugin is
 * uninstalled. It removes plugin from the maps of enabled disabled and
 * installed plugins of the given environment.
 */
exports['plugin:uninstall'] = function onUninstall(event) {
    var plugins = event.env.plugins, name = event.plugin.name;

    delete plugins.installed[name];
    delete plugins.enabled[name];
    delete plugins.disabled[name];
};

});
