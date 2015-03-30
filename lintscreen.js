/**
 * @fileoverview eslint quick fixer
 * @author Maxwell Huang-Hobbs
 * based on the Compact Reporter by Nicholas C. Zakas
 */
"use strict";

var fs = require('fs')
    , es = require("event-stream")
    , mv = require('mv')
    , sh = require('execSync');

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};



function insertChar(state, line, column, str) {
    line --;
    var out = "";

    var offset =
        state.inserts[line]
            .filter(function (insert) {return insert[0] < column;})
            .map(function (insert) {return insert[1]})
            .reduce(function(a,b) {return a + b}, 0);

    var sline = state.buffer[line]
    //out += line + " " + sline + "\n"

    if (str < 0) {
        sline = sline.splice(offset + column, Math.abs(str), "")
        state.inserts[line].push((column, str))
    } else {
        sline = sline.splice(offset + column, 0, str)
        state.inserts[line].push((column, str.length))
    }

    //out += line + " " + sline + "\n"
    state.buffer[line] = sline


    return true, out;
}

function dropSpaces(state, line, column) {
    line --;
    var log = "";
    while (state.buffer[line].match(/\s$/g)) {
        state.buffer[line] = state.buffer[line].replace(/\s$/, "")
    }
    return true, log;
}

function fixDoubleQuotes(state, lineNo) {
    var log = ""
    var line = state.buffer[lineNo-1];
    console.log(line);

    var escaped = false;
    var inquote = false;
    for (var c=0; c<line.length; c++) {
        if (!escaped && line.charAt(c) == '/') {
            escaped = true;
            c++;
            if (c>=line.length) { break; }
        }

        if (line.charAt(c) == '\'') {
            inquote = !inquote;
        } else if (line.charAt(c) == '"' && !inquote) {
            line = line.splice(c, 1, '\'')
        }

        escaped = false;
    }
    console.log(line);
    state.buffer[lineNo-1] = line;
    return true, log
}

console.log(process.cwd());

function switchOnType(state, message) {
    switch (message.ruleId) {
    case 'comma-dangle':
        return insertChar(
                    state,
                    message.line,
                    message.column,
                    -1);
        break;
    case 'no-trailing-spaces':
        return dropSpaces(
                    state,
                    message.line,
                    message.column)
        break;
    case 'semi':
        return insertChar(
                    state,
                    message.line,
                    message.column,
                    ';');
        break;
    case 'quotes':
        return fixDoubleQuotes(
                    state,
                    message.line);
        break;
    case 'strict':
        state.needsStrict = true;
        break;
    default:
        return false, ""
    }
}

//------------------------------------------------------------------------------
// Eslint interface for the parser
//------------------------------------------------------------------------------

function eslintParser(results) {
    var output = "";
    var failed_output = "";
    results.forEach(function(result) {
        // for each file
        var messages = result.messages;
        if (messages.length > 0) {
            output += result.filePath+"\n"

            // initialize the state for this file
            var buffer = String(fs.readFileSync(result.filePath)).split("\n");
            var inserts = []
            for (var elem in buffer) {inserts.push([])}
            var state = {
                buffer: buffer,
                inserts: inserts,
                needsStrict: false
            }

            var doStrict = false;
            messages.forEach(function(message) {
                // for each message in that file

                // try to fix
                var fixed, log = switchOnType(state, message);

                // print output
                // formatted line and error type
                var msg = message.line + ":" + message.column 
                            + "\t" + message.ruleId;

                if (fixed) {output += "✓  \t" + msg + "\n" + log;}
                else {failed_output += "×  \t" + msg + "\n" + log;}
            });

            if (doStrict) {
                state.buffer = ["'use strict';\n"].concat(state.buffer);
            }

            try {
                fs.writeFileSync(result.filePath,
                    state.buffer.join("\n"),
                    'utf-8');
            } catch (err){ 
                console.log(err);
            }
        }
    });
    return output + "\n" + failed_output;
}

module.exports = {
    parser: eslintParser
}
