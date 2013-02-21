// [int17](http://neocotic.com/int17) 0.1.0  
// Copyright (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

'use strict';

// Module dependencies
// -------------------

var fs   = require('fs')
  , Path = require('path');

// Private constants
// -----------------

    // Regular expression used to split locales.
var R_LOCALE = /[\-_]/
    // Regular expression used to extract the parent segment from locales.
  , R_PARENT = /^([^\-_]+)[\-_]/;

// Private functions
// -----------------

// Call `callback` in the specified `context` if it's a valid function.  
// All other arguments will be passed on to `callback` but if the first argument is non-null this
// indicates an error which will be thrown if `callback` is invalid.
function callOrThrow(context, callback) {
  var args = [].slice.call(arguments, 2);
  if (typeof callback === 'function') {
    callback.apply(context, args);
  } else if (args[0]) {
    throw args[0];
  }
}

// Filter only `languages` that extend from the specified `parent` locale.
function filterLanguages(parent, languages) {
  var i, match
    , results = [];
  for (i = 0; i < languages.length; i++) {
    match = languages[i].match(R_PARENT);
    if (match && match[1] === parent) {
      results.push(languages[i]);
    }
  }
  return results;
}

// Return a validator for determining whether a value is a non-empty string.
function isNonEmptyString(negate) {
  return function (value) {
    return (typeof value === 'string' && value.length) || negate;
  };
}

// Override
// --------

// Extend the two *classes* provided, making them compatible with the node.js runtime environment.
module.exports.override = function(Internationalization, Messenger) {

  // Messenger
  // ---------

  // Prevent any attempt to extract the locale from the current environment.
  Messenger.prototype.extractLocale = function() {};

  // Asynchronously load the message resource into a local bundle.  
  // As the bundle is stored locally, subsequent calls will result in the previously loaded
  // messages.  
  // If no resource file could be found for the current locale, a second attempt is made so long as
  // the locale has a *parent* or *child* and the relevant option is enabled; otherwise, an
  // appropriate error will be raised.
  Messenger.prototype.loadMessages = function(original, callback) {
    try {
      if (this.messages) return callOrThrow(this, callback, null, this.messages);
      this.deriveLocale();
      var that = this;
      fs.readFile(this.getLocaleFile(), this.encoding, function (err, data) {
        if (err) {
          if (that.fallback && original) {
            if (that.locale.length > 1) {
              that.locale.pop();
              return that.loadMessages(false, callback);
            } else {
              return that.int17.languages(that.locale[0], function (_err, children) {
                if (_err) return callOrThrow(that, callback, _err);
                if (children.length > 1) {
                  that.locale = children[1].split(R_LOCALE);
                  return that.loadMessages(false, function (err, messages) {
                    callOrThrow(that, callback, err, messages);
                  });
                }
                callOrThrow(that, callback, err);
              });
            }
          }
          return callOrThrow(that, callback, err);
        }
        try {
          that.messages = that.parseMessages(data);
          callOrThrow(that, callback, null, that.messages);
        } catch (err) {
          callOrThrow(that, callback, err);
        }
      });
    } catch (err) {
      callOrThrow(this, callback, err);
    }
  };

  // Synchronously load the message resource into a local bundle.  
  // As the bundle is stored locally, the previously loaded messages will be returned by subsequent
  // calls.  
  // If no resource file could be found for the current locale, a second attempt is made so long as
  // the locale has a *parent* or *child*  and the relevant option is enabled; otherwise, an
  // appropriate error will be thrown.
  Messenger.prototype.loadMessagesSync = function(original) {
    if (this.messages) return this.messages;
    this.deriveLocale();
    var data;
    try {
      data = fs.readFileSync(this.getLocaleFile(), this.encoding);
    } catch (err) {
      if (this.fallback && original) {
        if (this.locale.length > 1) {
          this.locale.pop();
          return this.loadMessagesSync(false);
        } else {
          var children = this.int17.languagesSync(this.locale[0]);
          if (children.length) {
            this.locale = children[0].split(R_LOCALE);
            return this.loadMessagesSync(false);
          }
        }
      }
      throw err;
    }
    return this.messages = this.parseMessages(data);
  };

  // Reconfigure this `Messenger` based on the specified `options`.  
  // Default configuration values will be used for any options that are missing or invalid.
  Messenger.prototype.reconfigure = function(options) {
    options = options || {};
    this.setUp('separator', options, Path.sep, isNonEmptyString());
    return this;
  };

  // Derive an absolute path from the relative `path` provided.
  Messenger.prototype.resolvePath = function(path) {
    return Path.resolve(process.cwd(), path);
  };

  // Internationalization
  // --------------------

  // Extend the specified express `app` to allow for clean interactions between express and
  // int17.  
  // Optionally, a `namespace` can be provided to change the name used to access this instance
  // (e.g. `i18n` instead of `int17`).  
  // Requests will have a reference to this instance of int17 as well as locals within responses
  // and dynamic helpers (for backwards compatibility).
  Internationalization.prototype.express = function(app, namespace) {
    namespace = namespace || 'int17';
    if (!app) return;
    var that = this;
    app.use(function (req, res, next) {
      req[namespace] = that;
      // Support for express v3.
      if (res.locals) {
        res.locals[namespace] = that;
      }
      next();
    });
    // Support for express v2.
    if (app.dynamicHelpers) {
      var helpers = {};
      helpers[namespace] = this;
      app.dynamicHelpers(helpers);
    }
    return this;
  };

  // Asynchronously fetch all of the supported languages, optionally specifying a `parent` locale
  // for which only its *children* should be retrieved (e.g. `en` could fetch `en-GB` and `en-US`
  // but not `en`, `fr`, or `fr-BE`).  
  // To optimize the performance of this function, the languages are only populated once.  
  // The languages are derived from the file structure within the locales root directory.
  // Optionally, these can be pre-populated by using the `languages` option during initialization.
  Internationalization.prototype.languages = function(parent, callback) {
    if (typeof parent === 'function') {
      callback = parent;
      parent   = null;
    }
    try {
      var dir       = this.messenger.getLocaleRoot()
        , languages = this.messenger.languages
        , that      = this;
      if (parent) {
        return this.languages(function (err, languages) {
          callOrThrow(that, callback, err, err ? null : filterLanguages(parent, languages));
        });
      }
      if (languages.length)
        return callOrThrow(this, callback, null, languages.slice());
      fs.readdir(dir, function (err, files) {
        if (err) return callOrThrow(that, callback, err);
        var count = 0;
        files.forEach(function (file) {
          fs.stat(Path.join(dir, file), function (err, stats) {
            if (err) return callOrThrow(that, callback, err);
            var language;
            if (that.messenger.folders) {
              if (stats.isDirectory()) {
                language = file;
              }
            } else if (Path.extname(file) === that.messenger.extension) {
              language = Path.basename(file, that.messenger.extension);
            }
            if (language) {
              languages.push(language.replace(R_LOCALE, '-'));
            }
            if (++count === files.length) {
              languages.sort();
              callOrThrow(that, callback, null, languages.slice());
            }
          });
        });
      });
    } catch (err) {
      callOrThrow(this, callback, err);
    }
  };

  // Retrieve all of the supported languages, optionally specifying a `parent` locale for which
  // only its *children* should be retrieved (e.g. `en` could return `en-GB` and `en-US` but not
  // `en`, `fr`, or `fr-BE`).  
  // To optimize the performance of this function, the languages are only populated once.  
  // The languages are derived from the file structure within the locales root directory.
  // Optionally, these can be pre-populated by using the `languages` option during initialization.
  Internationalization.prototype.languagesSync = function(parent) {
    var dir       = this.messenger.getLocaleRoot()
      , languages = this.messenger.languages
      , that      = this;
    if (parent) return filterLanguages(parent, this.languagesSync());
    if (languages.length) return languages.slice();
    var files = fs.readdirSync(dir);
    files.forEach(function (file) {
      var language
        , stats = fs.statSync(Path.join(dir, file));
      if (that.messenger.folders) {
        if (stats.isDirectory()) {
          language = file;
        }
      } else if (Path.extname(file) === that.messenger.extension) {
        language = Path.basename(file, that.messenger.extension);
      }
      if (language) {
        languages.push(language.replace(R_LOCALE, '-'));
      }
    });
    languages.sort();
    return languages.slice();
  };

};
