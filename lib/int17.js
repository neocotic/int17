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
      // Save the previous value of the global `int17` variable.
    , PREVIOUS_INT17 = this.int17
      // Regular expression used to replace arguments in messages.
    , R_ARGUMENT     = /\$([1-9]\d*)/gi
      // Regular expression used to split locales.
    , R_LOCALE       = /[-_]/
      // Regular expression used to replace placeholders in messages.
    , R_PLACEHOLDER  = /\$(\w+)\$/gi
      // Regular expression used to seperate key/value pairs.
    , R_VALUES       = /^([^:]+):(.+)$/
      // Regular expression used to replace whitespace.
    , R_WHITESPACE   = /\s/g;

  // Private variables
  // -----------------

  // TODO: Comment
  var root = this;

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
    this.messenger.reset();
    // TODO: Apply options
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
        , 'int17-values': function(element, values) {
            values = values.replace(R_WHITESPACE, '').split(';');
            if (!values) return;
            var expression, i, name, obj, paths, property;
            for (i = 0; i < values.length; i++) {
              property = values[i].match(R_VALUES);
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
                  if (paths[0] === 'innerHTML') {
                    this.traverse(element);
                  }
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
        if (handler.hasOwnProperty(attribute)) {
          results.push(attribute);
        }
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
    this.reset();
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
          if (typeof value === 'object') {
            this.checkPlaceholders(name, value);
          }
        case 'message':
          break;
        default:
          if (this.optimize) {
            delete message[key];
          }
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
      if (this.validate) {
        validatePlaceholder(messageName, name, placeholder);
      }
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
    if (!this.locale) {
      this.locale = (this.extractLocale() || DEFAULT_LOCALE).split(R_LOCALE);
    }
    return this.locale;
  };

  // TODO: Comment
  Messenger.prototype.extractLocale = function() {
    var html = document.getElementsByTagName('html')[0];
    if (html && html.lang) return html.lang;
    if (navigator.language) return navigator.language;
  }

  // TODO: Comment
  Messenger.prototype.getMessage = function(messageName) {
    return this.messages[messageName];
  };

  // TODO: Comment
  Messenger.prototype.getLocaleFile = function(relative) {
    var path = this.getLocaleParent(true) + '/';
    path    += this.folders ? this.localeFileName : this.locale.join('_');
    path    += this.localeExtension;
    return relative ? path : resolvePath(path);
  };

  // TODO: Comment
  Messenger.prototype.getLocaleParent = function(relative) {
    var path = this.getLocaleRoot(true);
    if (this.folders) {
      path += '/' + this.locale.join('_');
    }
    return relative ? path : resolvePath(path);
  };

  // TODO: Comment
  Messenger.prototype.getLocaleRoot = function(relative) {
    var path = this.localePath;
    return relative ? path : resolvePath(path);
  };

  // TODO: Comment
  Messenger.prototype.loadMessages = function(original, callback) {
    if (this.messages) return callback(null, this.messages);
    this.deriveLocale();
    var that = this
      , xhr  = new XMLHttpRequest();
    xhr.open('GET', this.getLocaleFile(), true);
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
          if (that.fallback && original && that.locale.length > 1) {
            that.locale.pop();
            that.loadMessages(false, callback);
          } else{
            callback(new Error(xhr.statusText));
          }
        }
      }
    };
    xhr.send(null);
  };

  // TODO: Comment
  Messenger.prototype.loadMessagesSync = function(original) {
    if (this.messages) return this.messages;
    this.deriveLocale();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.getLocaleFile(), false);
    xhr.send(null);
    if (xhr.status === 200) {
      return this.messages = this.parseMessages(xhr.responseText);
    } else if (this.fallback && original && that.locale.length > 1) {
      this.locale.pop();
      return this.loadMessagesSync(false);
    } else {
      throw new Error(xhr.statusText);
    }
  };

  // TODO: Comment
  Messenger.prototype.parseMessages = function(str) {
    var messages = JSON.parse(str);
    if (this.optimize || this.validate) {
      this.checkMessages(messages);
    }
    return messages;
  };

  Messenger.prototype.reset = function() {
    this.encoding        = 'UTF-8';
    this.fallback        = true;
    this.folders         = false;
    this.languages       = [];
    this.localeExtension = '.json';
    this.localeFileName  = 'messages';
    this.localePath      = './locales';
    this.optimize        = true;
    this.validate        = true;
  };

  // TODO: Comment
  Messenger.prototype.resolvePath = function(path) {
    var anchor  = document.createElement('a');
    anchor.href = path;
    return anchor.href;
  };

  // Internationalization
  // --------------------

  // TODO: Comment
  function Internationalization() {
    this.node = root.document;
  }

  // TODO: Comment
  Internationalization.prototype.all = function(names) {
    if (!names) return;
    var messages = [];
    for (var i = 0; i < names.length; i++) {
      messages.push(this.get(names[i]));
    }
    return messages;
  };

  // TODO: Comment
  Internationalization.prototype.attribute = function(selector, attr, name) {
    if (!this.node) return this;
    var elements = this.node.querySelectorAll(selector)
      , message  = this.get(name);
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute(attr, message);
    }
    return this;
  };

  // TODO: Comment
  Internationalization.prototype.content = function(selector, name) {
    if (!this.node) return this;
    var elements = this.node.querySelectorAll(selector)
      , message  = this.get(name);
    for (var i = 0; i < elements.length; i++) {
      elements[i].innerHTML = message;
    }
    return this;
  };

  // TODO: Comment
  Internationalization.prototype.get = function(name) {
    if (!name) return;
    var args    = [].slice.call(arguments, 1);
      , message = this.messenger.getMessage(name);
    return message && this.substitute(message, args);
  };

  // TODO: Comment
  Internationalization.prototype.init = function(options, callback) {
    var that = this;
    configure(this, options);
    this.messenger.loadMessages(true, function(err, messages) {
      callOrThrow(that, callback, err, messages);
    });
  };

  // TODO: Comment
  Internationalization.prototype.initSync = function(options) {
    configure(this, options);
    this.messenger.loadMessagesSync(true);
    return this;
  };

  // TODO: Comment
  Internationalization.prototype.languages = function(parent, callback) {
    if (typeof parent === 'function') {
      callback = parent;
      parent   = null;
    }
    var languages = this.messenger.languages;
    if (!languages.length) {
      languages.push(this.messenger.locale.join('-'));
    }
    if (parent && parent !== languages[0].slice(0, parent.length)) {
      callOrThrow(this, callback, null, []);
    }
    callOrThrow(this, callback, null, languages.slice());
  };

  // TODO: Comment
  Internationalization.prototype.languagesSync = function(parent) {
    var languages = this.messenger.languages;
    if (!languages.length) {
      languages.push(this.messenger.locale.join('-'));
    }
    if (parent && parent !== languages[0].slice(0, parent.length)) return [];
    return languages.slice();
  };

  // TODO: Comment
  Internationalization.prototype.locale = function() {
    return this.messenger.locale.join('-');
  };

  // TODO: Comment
  Internationalization.prototype.map = function(names) {
    if (!names) return;
    var messages = {};
    for (var i = 0; i < names.length; i++) {
      if (messages[names[i]]) continue;
      messages[names[i]] = this.get(names[i]);
    }
    return messages;
  };

  // TODO: Comment
  Internationalization.prototype.options = function(selector, names) {
    if (!this.node || !names) return this;
    var i, j, option
      , elements = this.node.querySelectorAll(selector)
      , messages = this.all(names);
    for (i = 0; i < elements.length; i++) {
      for (j = 0; j < messages.length; j++) {
        option = document.createElement('option');
        option.innerHTML = messages[j];
        elements[i].appendChild(option);
      }
    }
    return this;
  };

  // TODO: Comment
  Internationalization.prototype.property = function(selector, prop, name) {
    if (!this.node) return this;
    var element, i, obj
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name)
      , paths    = prop.split('.');
    for (i = 0; i < elements.length; i++) {
      element = elements[i];
      obj     = element;
      while (obj && paths.length > 1) {
        obj = obj[paths.shift()];
      }
      if (obj) {
        obj[paths[0]] = message;
        if (paths[0] === 'innerHTML') {
          this.traverse(element);
        }
      }
    }
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
    element = element || this.node;
    if (!element) return this;
    var attribute, child, i, j, value
      , children = element.querySelectorAll(selector);
    for (i = 0; i < children.length; i++) {
      child = children[i];
      for (j = 0; j < attributes.length; j++) {
        attribute = attributes[j];
        value     = child.getAttribute(attribute);
        if (value) {
          handlers[attribute].call(this, child, value);
        }
      }
    }
    return this;
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
    require('./node').override(Internationalization, Messenger);
    module.exports = int17;
  } else if (typeof define === 'function' && define.amd) {
    define('int17', function() {
      return int17;
    });
  } else {
    this.int17 = int17;
  }

}).call(this);
