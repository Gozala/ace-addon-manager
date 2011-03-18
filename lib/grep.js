define(function(require, exports, module) {

/**
 * Calculates the score for use in suggestions from
 * a result array `match` of `RegExp#exec`.
 */

var SCORE_BASE = 0.3;
var SCORE_LENGTH = 0.25;
var SCORE_INDEX = 1 - SCORE_BASE - SCORE_LENGTH;

function matchScore(match) {
    var inputLength, value
    
    value = null
    if (match) {
        inputLength = match.input.length;
        value = SCORE_BASE +
                SCORE_LENGTH * Math.sqrt(match[0].length / inputLength) +
                SCORE_INDEX  * (1 - match.index / inputLength);
    }
    return value
}


/**
 * A helper function to grep a list of suggestion objects / strings by user
 * input.
 * Returns an array of filtered options, each of them assigned `score`.
 *
 * @param {Object[]|String[]} options
 *      List of options
 * @param {String|RegExp} pattern
 *      Pattern that filters the options.
 * @param {String} [key]
 *      Optional string to specify the target property to match with. If not
 *      provided match is performed on elements of `options` directly.
 */
exports.grep = function grep(options, pattern, key) {
    var result;
    
    result = options;

    if (options) {
        pattern = Pattern(pattern, 'i');
        if (!options.map) {
            options = Object.keys(options).map(function (name) {
                return options[name]
            });
        }
        result = options.map(function(value) {
            return {
                value: value,
                score: matchScore(pattern.exec(key ? value[key] : value))
            };
        }).filter(filterScored).sort(sortDescendingByScore);
    } else if (!pattern) {
        result = [];
    }

    return result;
};

function filterScored(match) {
    return null !== match.score;
}
function sortDescendingByScore(a, b) {
    return b.score - a.score;
}

/**
 * Creates a regexp just like `RegExp`, except that it:
 * - falls back to an escaped version of `pattern` if the compile fails
 * - returns the `pattern` as is if it's already a regexp
 * @param {String|RegExp} pattern
 * @param {String} flags
 * @returns {RegExp}
 *
 * @examples
 *  RegExp("[")          // SyntaxError("unterminated character class")
 *  RegExp(/:/, "y")     // TypeError("can't supply flags when ...")
 *  Pattern("[")          // /\[/
 *  Pattern(/:/, "y")     // /:/
 */
function Pattern(pattern, flags) {
    if (!(pattern instanceof RegExp)) {
        try {
            pattern = new RegExp(pattern, flags);
        } catch (exception) {
            if (exception instanceof SyntaxError)
                pattern = new RegExp(regexpEscape(pattern), flags);
            else
                throw exception;
        }
    }
    return pattern;
}
exports.Pattern = Pattern;

/**
 * Returns the `pattern` with all regexp meta characters in it backslashed.
 * @param {String} pattern
 * @returns {String}
 */
function escapePattern(pattern) {
  return String(pattern).replace(/[.?*+^$|()\{\[\\]/g, '\\$&');
}

});
