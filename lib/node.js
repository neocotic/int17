// [int17](http://neocotic.com/int17) 0.1.0  
// (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

// Module dependencies
// -------------------

var fs   = require('fs')
  , Path = require('path');

// Private constants
// -----------------

    // Regular expression used to split locales.
var R_LOCALE = /[-_]/
    // TODO: Comment
  , R_PARENT = /^([^-_]+)[-_]?/;

// Private functions
// -----------------

// TODO: Comment
function callOrThrow(context, callback) {
  var args = [].slice.call(arguments, 2);
  if (typeof callback === 'function') {
    callback.apply(context, args);
  } else if (args[0]) {
    throw args[0];
  }
}

// TODO: Comment
function filterLanguages(parent, languages) {
  var i, language
    , results = [];
  for (i = 0; i < languages.length; i++) {
    language = languages[i].match(R_PARENT);
    if (language && language[1] === parent) {
      results.push(languages[i]);
    }
  }
  return results;
}

// Override
// --------

// TODO: Comment
module.exports.override = function(Internationalization, Messenger) {

  // Messenger
  // ---------

  // TODO: Comment
  Messenger.prototype.extractLocale = function() {};

  // TODO: Comment
  Messenger.prototype.loadMessages = function(original, callback) {
    if (this.messages) return callback(null, this.messages);
    this.deriveLocale();
    var that = this;
    fs.readFile(this.getLocaleFile(), this.encoding, function(err, data) {
      if (err) {
        if (that.fallback && original) {
          if (that.locale.length > 1) {
            that.locale.pop();
            return that.loadMessages(false, callback);
          } else {
            return that.languages(that.locale[0], function(_err, children) {
              if (_err) return callback(_err);
              if (children.length) {
                that.locale = children[0].split(R_LOCALE);
                return that.loadMessages(false, function(err, messages) {
                  callback(err, messages);
                });
              }
              throw err;
            });
          }
        }
        return callback(err);
      }
      try {
        that.messages = that.parseMessages(data);
        callback(null, that.messages);
      } catch (err) {
        callback(err);
      }
    });
  };

  // TODO: Comment
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
          var children = this.languagesSync(this.locale[0]);
          if (children.length) {
            this.locale = children[0].split(R_LOCALE);
            return this.loadMessagesSync(false);
          }
          throw err;
        }
      } else {
        throw err;
      }
    }
    return this.messages = this.parseMessages(data);
  };

  // TODO: Comment
  Messenger.prototype.resolvePath = function(path) {
    return Path.resolve(process.cwd(), path);
  };

  // Internationalization
  // --------------------

  // TODO: Comment
  Internationalization.prototype.languages = function(parent, callback) {
    if (typeof parent === 'function') {
      callack = parent;
      parent  = null;
    }
    var dir       = this.messenger.getLocaleRoot()
      , languages = this.messenger.languages
      , that      = this;
    if (parent) {
      return this.languages(function(err, languages) {
        if (err) return callOrThrow(that, callback, err);
        callOrThrow(that, callback, null, filterLanguages(parent, languages));
      });
    }
    if (languages.length)
      return callOrThrow(that, callback, null, languages.slice());
    fs.readdir(dir, function(err, files) {
      if (err) return callOrThrow(that, callback, err);
      var count = 0;
      files.forEach(function(file) {
        fs.stat(Path.join(dir, file), function(err, stats) {
          if (err) return callOrThrow(that, callback, err);
          var language;
          if (that.messenger.folders) {
            if (stats.isDirectory()) {
              language = file;
            }
          } else if (Path.extname(file) !== that.localeExtension) {
            language = Path.basename(file, that.localeExtension);
          }
          if (language) {
            languages.push(language.replace(R_LOCALE, '-'));
          }
          if (++count === files.length) {
            callOrThrow(that, callback, null, languages.slice());
          }
        });
      });
    });
  };

  // TODO: Comment
  Internationalization.prototype.languagesSync = function(parent) {
    var dir       = this.messenger.getLocaleRoot()
      , languages = this.messenger.languages;
    if (parent) return filterLanguages(parent, this.languagesSync());
    if (languages.length) return languages.slice();
    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
      var language
        , stats = fs.statSync(Path.join(dir, file));
      if (this.messenger.folders) {
        if (stats.isDirectory()) {
          language = file;
        }
      } else if (Path.extname(file) !== this.localeExtension) {
        language = Path.basename(file, this.localeExtension);
      }
      if (language) {
        languages.push(language.replace(R_LOCALE, '-'));
      }
    });
    return languages.slice();
  };

  // TODO: Complete Internationalization (incl. express extension functions)

};
