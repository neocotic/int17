// [int17](http://neocotic.com/int17) 0.0.1  
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
var R_LOCALE = /[-_]/;

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

// Override
// --------

// TODO: Comment
module.exports.override = function(Internationalization, Messenger) {

  // Messenger
  // ---------

  // TODO: Comment
  Messenger.prototype.extractLocale = function() {};

  // TODO: Comment
  Messenger.prototype.loadMessages = function(callback) {
    if (this.messages) return callback(null, this.messages);
    this.deriveLocale();
    var that = this;
    fs.readFile(this.getLocaleFile(), this.encoding, function(err, data) {
      if (err) {
        // TODO: Support finding cibling locales as well (e.g. en-US -> en-GB)
        if (that.fallback && that.locale.length > 1) {
          that.locale.pop();
          return that.loadMessages(callback);
        } else {
          return callback(err);
        }
      }
      that.messages = that.parseMessages(data);
      callback(null, that.messages);
    });
  };

  // TODO: Comment
  Messenger.prototype.loadMessagesSync = function() {
    if (this.messages) return this.messages;
    this.deriveLocale();
    var data;
    try {
      data = fs.readFileSync(this.getLocaleFile(), this.encoding);
    } catch (err) {
      // TODO: Support finding cibling locales as well (e.g. en-US -> en-GB)
      if (this.fallback && this.locale.length > 1) {
        this.locale.pop();
        return this.loadMessagesSync();
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
  Internationalization.prototype.languages = function(callback) {
    var dir       = this.messenger.getLocaleRoot()
      , languages = this.messenger.languages
      , that      = this;
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
  Internationalization.prototype.languagesSync = function() {
    var dir       = this.messenger.getLocaleRoot()
      , languages = this.messenger.languages;
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
