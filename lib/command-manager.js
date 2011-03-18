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
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
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

var EventEmitter = require('pilot/event_emitter').EventEmitter;
var Trait = require("light-traits").Trait;

/**
 * Current requirements are around displaying the command line, and provision
 * of a 'history' command and cursor up|down navigation of history.
 * <p>Future requirements could include:
 * <ul>
 * <li>Multiple command lines
 * <li>The ability to recall key presses (i.e. requests with no output) which
 * will likely be needed for macro recording or similar
 * <li>The ability to store the command history either on the server or in the
 * browser local storage.
 * </ul>
 * <p>The execute() command doesn't really live here, except as part of that
 * last future requirement, and because it doesn't really have anywhere else to
 * live.
 */

/**
 * The array of requests that wish to announce their presence
 */
var requests = [];

/**
 * How many requests do we store?
 */
var maxRequestLength = 100;

/**
 * To create an invocation, you need to do something like this (all the ctor
 * args are optional):
 * <pre>
 * var request = new Request({
 *     command: command,
 *     args: args,
 *     typed: typed
 * });
 * </pre>
 * @constructor
 */
function Request(options) {
    options = options || {};
    options.start = new Date();

    return TRequest.create(options)
};
exports.Request = Request;
var TRequest = Trait.compose(Trait(EventEmitter), Trait({
    start: Trait.required,
    params: Trait.required,
    command: Trait.required,
    typed: Trait.required,

    _beginOutput: false,
    end: null,
    completed: false,
    error: false,
    constructor: Request,
    /**
     * Lazy init to register with the history should only be done on output.
     * init() is expensive, and won't be used in the majority of cases
     */
    _beginOutput: function() {
        this._begunOutput = true;
        this.outputs = [];

        requests.push(this);
        // This could probably be optimized with some maths, but 99.99% of the
        // time we will only be off by one, and I'm feeling lazy.
        while (requests.length > maxRequestLength) {
            requests.shiftObject();
        }

        exports._emit('output', { requests: requests, request: this });
    },
    /**
     * Sugar for:
     * <pre>request.error = true; request.done(output);</pre>
     */
    doneWithError: function(content) {
        this.error = true;
        this.done(content);
    },
    /**
     * Declares that this function will not be automatically done when
     * the command exits
     */
    async: function() {
        if (!this._begunOutput) {
            this._beginOutput();
        }
    },
    /**
     * Complete the currently executing command with successful output.
     * @param output Either DOM node, an SproutCore element or something that
     * can be used in the content of a DIV to create a DOM node.
     */
    output: function(content) {
        if (!this._begunOutput) {
            this._beginOutput();
        }

        if (typeof content !== 'string' && !(content instanceof Node)) {
            content = content.toString();
        }

        this.outputs.push(content);
        this._emit('output', {});

        return this;
    },
    /**
     * All commands that do output must call this to indicate that the command
     * has finished execution.
     */
    done: function(content) {
        this.completed = true;
        this.end = new Date();
        this.duration = this.end.getTime() - this.start.getTime();

        if (content) {
            this.output(content);
        }

        this._emit('output', {});
    }
}));

function Command(descriptor) {
    return TCommand.create(descriptor);
}
var TCommand = Trait({
    constructor: Command,
    name: Trait.required,
    params: Trait.required,
    exec: Trait.required,
    execute: function execute (env, params, typed) {
        params = params || {};
        this.exec(env, params, Request({
            command: this,
            env: env,
            params: params,
            typed: typed
        }));
    },
    toString: function toString() {
        var value
        value = this.name;
        if (this.description) value += " - " + this.description;
        return value
    }
});

exports['plugin:startup'] = function onPluginStartup(event) {
    var env, commands;

    env = event.env;

    if ((commands = event.plugin.commands)) {
        Object.keys(commands).forEach(function (name) {
            env.emit('command:install', {
                name: name,
                command: commands[name]
            });
            env.emit('command:startup', { name: name });
        });
    }
};

exports['plugin:shutdown'] = function onPluginShutdown(event) {
    var env, commands;

    env = event.env;

    if ((commands = event.plugin.commands)) {
        Object.keys(commands).forEach(function (name) {
            env.emit('command:uninstall', { name: name });
        });
    }
};

exports['command:install'] = function onCommandInstall(event) {
    var command;

    if ((command = event.command)) {
        if (typeof command === "function")
            command = { exec: command, params: [] };
        
        if (!command.params) command.params = [];
        if (!command.name) command.name = event.name;

        event.env.commands.installed[command.name] = new Command(command);
    }
};

exports['command:startup'] = function onCommandStartup(event) {
    var env, command;

    env = event.env;
    command = env.commands.installed[event.name];
    env.commands.enabled[command.name] = command;
};

exports['command:shutdown'] = function onCommandShutdown(event) {
    var commands, command;

    commands = event.env.commands;
    command = commands.enabled[event.name];
    delete commands.enabled[command.name];
    commands.disabled[command.name] = command;
};

exports['command:uninstall'] = function onCommandUninstall(event) {
    var env, commands, name;
    
    env = event.env;
    name = event.name;
    commands = env.commands;

    env.emit('command:shutdown', { name: name, reason: 'uninstall' });
    delete commands.enabled[name];
    delete commands.installed[name];
};

exports['command:execute'] = function onCommandExecute(event) {
    var env, command;
    env = event.env;
    command = env.commands.enabled[event.name];
    if (command) {
        command.execute(env, event.params);
        event.stop = true;
    }
};

exports.name = 'command-manager';
exports.description = 'Plugin that handles commands';
exports.types = { };
exports.startup = function sturtup(event) {
    var env, plugins

    env = event.env
    plugins = event.plugins

    env.on('plugin:startup', exports['plugin:startup']);
    env.on('plugin:shutdown', exports['plugin:shutdown']);

    env.on('command:install', exports['command:install']);
    env.on('command:uninstall', exports['command:uninstall']);
    env.on('command:startup', exports['command:startup']);
    env.on('command:shutdown', exports['command:shutdown']);
    env.on('command:execute', exports['command:execute']);

    Object.keys(plugins).forEach(function (name) {
        exports["plugin:startup"]({ env: env, plugin: plugins[name] });
    });
};

exports.shutdown = function shutdown(event) {
    var env = event.env

    env.removeListener('plugin:startup', exports['plugin:startup']);
    env.removeListener('plugin:shutdown', exports['plugin:shutdown']);

    env.removeListener('command:install', exports['command:install']);
    env.removeListener('command:uninstall', exports['command:uninstall']);
    env.removeListener('command:startup', exports['command:startup']);
    env.removeListener('command:shutdown', exports['command:shutdown']);
    env.removeListener('command:execute', exports['command:execute']);
};

exports.install = function install(event) {
    event.env.commands = { installed: {}, enabled: {}, disabled: {} };
    exports.types.command = event.env.commands.enabled;
};
exports.uninstall = function uninstall(event) {
    exports.shutdown({ reason: uninstall, env: env });
    delete event.env.commands;
};


});
