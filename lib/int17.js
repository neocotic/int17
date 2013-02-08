// [int17](http://neocotic.com/int17) 0.0.1  
// (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

(function() {

  // Private constants
  // -----------------

      // TODO: Comment
  var DEFAULT_LOCALE = 'en'
      // Error message for subsequent initialization attempts for `int17`.
    , ERR_INIT       = 'int17 is already initialized'
      // Save the previous value of the global `int17` variable.
    , PREVIOUS_INT17 = this.int17
      // Regular expression used to replace arguments in messages.
    , R_ARGUMENT     = /\$([1-9]\d*)/gi
      // Regular expression used to replace placeholders in messages.
    , R_PLACEHOLDER  = /\$(\w+)\$/gi
      // Regular expression used to seperate key/value pairs.
    , R_VALUES       = /^([^:]+):(.+)$/
      // Regular expression used to replace whitespace.
    , R_WHITESPACE   = /\s/g;

  // Private variables
  // -----------------

      // TODO: Comment
  var initialized = false
      // TODO: Comment
    , root        = this;

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
  function configure(int17, options) {
    // TODO: Apply options
  }

  // TODO: Comment
  function extractLocale() {
    var html = document.getElementsByTagName('html')[0];
    if (html && html.lang) return html.lang;
    // TODO: Code other possible derivations (e.g. `navigator.language`)
  }

  // TODO: Comment
  function findProp(obj, target, ignoreCase) {
    if (!ignoreCase) return obj[target];
    target = target.toLowerCase();
    for (var prop in obj) {
      if (target === prop.toLowerCase()) return obj[prop];
    }
  }

  // TODO: Comment
  function replaceOptimized(placeholders, placeholder, name) {
    return function(placeholder, name) {
      var replacement = findProp(placeholders, name.toLowerCase(), false);
      return typeof replacement === 'string' ? replacement : placeholder;
    };
  }

  // TODO: Comment
  function replacer(placeholders, optimized) {
    return (optimized ? replaceOptimized : replaceStandard)(placeholders);
  }

  // TODO: Comment
  function replaceStandard(placeholders, placeholder, name) {
    return function(placeholder, name) {
      var replacement = findProp(placeholders, name.toLowerCase(), true);
      replacement     = replacement && replacement.content;
      return typeof replacement === 'string' ? replacement : placeholder;
    };
  }

  // TODO: Comment
  function resolve(url) {
    if (!url) return url;
    var ele  = document.createElement('a');
    ele.href = url;
    return ele.href;
  }

  // TODO: Comment
  function validateMessage(messageName, message) {
    var prefix = 'Message[' + messageName + ']';
    if (typeof message !== 'object') {
      throw new TypeError(prefix + ' is not an object');
    } else if (typeof message.message !== 'string') {
      throw new TypeError(prefix + '.message is not a string');
    } else if (message.hasOwnProperty('placeholders')
        && typeof message.placeholders !== 'object') {
      throw new TypeError(prefix + '.placeholders is not an object');
    }
  }

  // TODO: Comment
  function validatePlaceholder(messageName, placeholderName, placeholder) {
    var prefix = 'Message[' + messageName + '].placeholders[' + placeholderName
        + ']';
    if (typeof placeholder !== 'object') {
      throw new TypeError(prefix + ' is not an object');
    } else if (typeof placeholder.content !== 'string') {
      throw new TypeError(prefix + '.content is not a string');
    }
  }

  // Handlers
  // --------

      // Mapping for internationalization handlers.  
      // Each handler represents an attribute (based on the property name) and
      // is called for each attribute found within the node currently being
      // processed.
  var handlers = {
          // Replace the HTML content of `element` with the named message
          // looked up for `name`.
          'int17-content': function(element, name) {
            element.innerHTML = this.get(name);
          }
          // Adds options to the `select` element with the messages looked up
          // for `names`.
        , 'int17-options': function(select, names) {
            names = names.replace(R_WHITESPACE, '').split(',');
            if (!names) return;
            var i, option;
            for (i = 0; i < names.length; i++) {
              option = document.createElement('option');
              option.innerHTML = this.get(names[i]);
              select.appendChild(option);
            }
          }
          // Replace the value of the properties and/or attributes of `element`
          // with the messages looked up for their corresponding values.
        , 'int17-values': function(element, map) {
            map = map.replace(R_WHITESPACE, '').split(';');
            if (!map) return;
            var expression, i, name, obj, paths, property;
            for (i = 0; i < map.length; i++) {
              property = map.match(R_VALUES);
              if (!property) continue;
              name       = property[1];
              expression = property[2];
              if (name[0] === '.') {
                paths = name.slice(1).split('.');
                obj   = element;
                while (obj && paths.length > 1) {
                  obj = obj[paths.shift()];
                }
                if (obj) {
                  obj[paths[0]] = this.get(expression);
                  this.traverse(element);
                }
              } else {
                element.setAttribute(name, this.get(expression));
              }
            }
          }
    }
    // List of internationalization attributes/handlers available.
  , attributes = (function() {
      var attribute, results = [];
      for (attribute in handler) {
        if (handler.hasOwnProperty(attribute)) results.push(attribute);
      }
      return results;
    }())
    // Selector containing the available internationalization
    // attributes/handlers which is used by `traverse` to query all elements.
  , selector   = '[' + attributes.join('],[') + ']';

  // Messenger
  // ---------

  // TODO: Comment
  function Messenger() {
    // TODO: Complete
    this.localeExtension = '.json';
    this.localePath      = './locales';
    this.optimize        = true;
    this.validate        = true;
  }

  // TODO: Comment
  Messenger.prototype.checkMessage = function(name, message) {
    var key, value;
    if (this.validate) validateMessage(name, message);
    for (key in message) {
      if (!message.hasOwnProperty(key)) continue;
      value = message[key];
      switch (key) {
        case 'placeholders':
          if (typeof value === 'object') this.checkPlaceholders(name, value);
        case 'message':
          break;
        default:
          if (this.optimize) delete message[key];
      }
    }
    return message;
  };

  // TODO: Comment
  Messenger.prototype.checkMessages = function(messages) {
    var name;
    for (name in messages) {
      if (!messages.hasOwnProperty(name)) continue;
      this.checkMessage(name, messages[name]);
    }
    return messages;
  };

  // TODO: Comment
  Messenger.prototype.checkPlaceholders = function(messageName, placeholders) {
    var lcName, name, placeholder;
    for (name in placeholders) {
      if (!placeholders.hasOwnProperty(name)) continue;
      placeholder = placeholders[name];
      if (this.validate) validatePlaceholder(messageName, name, placeholder);
      if (optimize) {
        lcName = name.toLowerCase();
        delete placeholders[name];
        placeholders[lcName] = placeholder.content;
      }
    }
    return placeholders;
  };

  // TODO: Comment
  Messenger.prototype.deriveLocale = function() {
    this.locale = this.locale || extractLocale() || DEFAULT_LOCALE;
    // TODO: Sanatize locale (e.g. replace '-' with '_')
    return this.locale;
  };

  // TODO: Comment
  Messenger.prototype.getMessage = function(messageName) {
    return this.messages[messageName];
  };

  // TODO: Comment
  Messenger.prototype.loadMessages = function(callback) {
    if (this.messages) return callback(null, this.messages);
    this.deriveLocale();
    var that = this
      , xhr  = new XMLHttpRequest();
    xhr.open('GET', this.resolvePath(), true);
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            that.messages = that.parseMessages(xhr.responseText);
            callback(null, that.messages);
          } catch (err) {
            callback(err);
          }
        } else {
          callback(new Error(xhr.statusText));
        }
      }
    };
    xhr.send(null);
  };

  // TODO: Comment
  Messenger.prototype.loadMessagesSync = function() {
    if (this.messages) return this.messages;
    this.deriveLocale();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.resolvePath(), false);
    xhr.send(null);
    if (xhr.status === 200) {
      return this.messages = this.parseMessages(xhr.responseText);
    } else {
      throw new Error(xhr.statusText);
    }
  };

  // TODO: Comment
  Messenger.prototype.parseMessages = function(str) {
    var messages = JSON.parse(str);
    if (this.optimize || this.validate) this.checkMessages(messages);
    return messages;
  };

  // TODO: Comment
  Messenger.prototype.resolvePath = function() {
    return resolve(this.localePath + '/' + this.locale + this.localeExtension);
  };

  // Internationalization
  // --------------------

  // TODO: Comment
  function Internationalization() {
    this.messenger = new Messenger();
  }

  // TODO: Comment
  Internationalization.prototype.get = function(name) {
    if (!name) return;
    var args    = [].slice.call(arguments, 1);
      , message = this.messenger.getMessage(name);
    return message && this.substitute(message, args);
  };

  // TODO: Comment
  Internationalization.prototype.init = function(options, callback) {
    if (initialized) callOrThrow(this, callback, new Error(ERR_INIT));
    var that = this;
    configure(this, options);
    this.messenger.loadMessages(function(err, messages) {
      initialized = !err;
      callOrThrow(that, callback, err, messages);
    });
  };

  // TODO: Comment
  Internationalization.prototype.initSync = function(options) {
    if (initialized) throw new Error(ERR_INIT);
    configure(this, options);
    this.messenger.loadMessagesSync();
    initialized = true;
    return this;
  };

  // TODO: Comment
  Internationalization.prototype.substitute = function(message, args) {
    var optimized    = this.messenger.optimize
      , placeholders = message.placeholders
      , str          = message.message || '';
    if (placeholders) {
      str = str.replace(R_PLACEHOLDER, replacer(placeholders, optimized));
    }
    if (args && args.length) {
      str = str.replace(R_ARGUMENT, function(arg, index) {
        index = index - 1;
        return typeof args[index] === 'string' ? args[index] : arg;
      });
    }
    return str;
  };

  // TODO: Comment
  Internationalization.prototype.traverse = function(element) {
    if (!element) element = document;
    var attribute, child, i, j, value
      , children = element.querySelectorAll(selector);
    for (i = 0; i < children.length; i++) {
      child = children[i];
      for (j = 0; j < attributes.length; j++) {
        attribute = attributes[j];
        value     = child.getAttribute(attribute);
        if (value) handlers[attribute].call(this, child, value);
      }
    }
  };

  // int17 setup
  // -----------

  // TODO: Comment
  var int17 = new Internationalization();

  // Public constants
  // ----------------

  // Current version of int17.
  int17.VERSION = '0.0.1';

  // Public functions
  // ----------------

  // Run int17 in *noConflict* mode, returning the `int17` variable to its
  // previous owner.  
  // Returns a reference to `int17`.
  int17.noConflict = function() {
    root.int17 = PREVIOUS_INT17;
    return int17;
  };

  // Finalize
  // --------

  // Build the publicly exposed API.
  if (typeof module === 'object' && module.exports) {
    require('./node').override(int17);
    module.exports = int17;
  } else if (typeof define === 'function' && define.amd) {
    define('int17', function() {
      return int17;
    });
  } else {
    this.int17 = int17;
  }

}).call(this);
