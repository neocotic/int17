// [int17](http://neocotic.com/int17) 0.1.0  
// (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

(function() {

  // Private constants
  // -----------------

      // Default locale to be used if none could be derived.
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

  // Reference to the global object.
  var root = this;

  // Private functions
  // -----------------

  // Call `callback` in the specified `context` if it's a valid function.  
  // All other arguments will be passed on to `callback` but if the first
  // argument is non-null this indicates an error which will be thrown if
  // `callback` is invalid.
  function callOrThrow(context, callback) {
    var args = [].slice.call(arguments, 2);
    if (typeof callback === 'function') {
      callback.apply(context, args);
    } else if (args[0]) {
      throw args[0];
    }
  }

  // Retrieve the target value on an object.  
  // Optionally, the search can be case-insensitive which will take slightly
  // longer as all properties are checked until a match is found.
  function findProp(obj, target, ignoreCase) {
    if (!ignoreCase) return obj[target];
    target = target.toLowerCase();
    for (var prop in obj) {
      if (target === prop.toLowerCase()) return obj[prop];
    }
  }

  // Return a validator for determining whether a value is *empty* or not.
  function isEmpty(negate) {
    return function(value) {
      return !value.length || negate;
    };
  }

  // Return a validator for determining whether a value is a non-empty string.
  function isNonEmptyString(negate) {
    return function(value) {
      return (typeof value === 'string' && value.length) || negate;
    };
  }

  // Return a validator for determining whether a value is of the specified
  // `type`.
  function isType(type, negate) {
    type = type && type.toLowerCase();
    return function(value) {
      var actualType = Object.prototype.toString.call(value).toLowerCase();
      return actualType === '[object ' + type + ']' || negate;
    };
  }

  // Return a replace for substituting placeholders within optimized messages.
  function replaceOptimized(placeholders, placeholder, name) {
    return function(placeholder, name) {
      var replacement = findProp(placeholders, name.toLowerCase(), false);
      return typeof replacement === 'string' ? replacement : placeholder;
    };
  }

  // Return a replacer for substituting placeholders within potentially
  // optimized messages.
  function replacer(placeholders, optimized) {
    return (optimized ? replaceOptimized : replaceStandard)(placeholders);
  }

  // Return a replace for substituting placeholders within non-optimized
  // messages.
  function replaceStandard(placeholders, placeholder, name) {
    return function(placeholder, name) {
      var replacement = findProp(placeholders, name.toLowerCase(), true);
      replacement     = replacement && replacement.content;
      return typeof replacement === 'string' ? replacement : placeholder;
    };
  }

  // Set the value of the specified property on `this` as taken from an
  // object.  
  // All remaining arguments should be validation functions which, if any fail,
  // results in the default value being set instead.  
  // It is important that this is called with a specific context so that the
  // property is set on the correct object (i.e. `this`).
  function setUp(property, obj, defaultValue) {
    var validators = [].slice.call(arguments, 3)
      , value      = obj[property];
    for (var i = 0; i < validators.length; i++) {
      if (!validators[i].call(this, value)) {
        value = defaultValue;
        break;
      }
    }
    this[property] = value;
  }

  // Validate the specified `message`, throwing appropriate errors if any
  // validations fail.  
  // It is recommended that this is used during development but disabled in
  // production environments to improve performance.
  function validateMessage(messageName, message) {
    var prefix = 'Message[' + messageName + ']';
    if (typeof message !== 'object')
      throw new TypeError(prefix + ' is not an object');
    if (typeof message.message !== 'string')
      throw new TypeError(prefix + '.message is not a string');
    if (message.hasOwnProperty('placeholders')
        && typeof message.placeholders !== 'object') {
      throw new TypeError(prefix + '.placeholders is not an object');
    }
  }

  // Validate the specified `placeholder`, throwing appropriate errors if any
  // validations fail.  
  // It is recommended that this is used during development but disabled in
  // production environments to improve performance.
  function validatePlaceholder(messageName, placeholderName, placeholder) {
    var prefix = 'Message[' + messageName + '].placeholders[' + placeholderName
        + ']';
    if (typeof placeholder !== 'object')
      throw new TypeError(prefix + ' is not an object');
    if (typeof placeholder.content !== 'string')
      throw new TypeError(prefix + '.content is not a string');
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

          // Adds options to the `element` with the messages looked up for
          // `names`.  
          // `names` should be semi-colon separated values where each value is
          // treated as a message name which themselves can be separated by
          // colons to divide them into two parts. The first part specifying
          // the message name for the option's HTML contents while the second
          // specifies the actual value for the option.
        , 'int17-options': function(element, names) {
            names = names.replace(R_WHITESPACE, '').split(';');
            if (!names) return;
            var i, option, parts;
            for (i = 0; i < names.length; i++) {
              option = document.createElement('option');
              parts  = names[i].match(R_VALUES);
              if (parts) {
                option.innerHTML = this.get(parts[1]);
                option.value     = parts[2];
              } else {
                option.innerHTML = this.get(names[i]);
              }
              element.appendChild(option);
            }
          }

          // Replace the value of the properties and/or attributes of `element`
          // with the messages looked up for their corresponding values.  
          // `values` should be semi-colon separated values where each value is
          // itself made up of two parts (separated by colons), the property
          // path/attribute name and the message name.  
          // Property paths are interperated as different from attribute names
          // by beginning with a full stop/period character and can well
          // contain more (e.g. `.style.direction:dir`).
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

  // Creates a new instance of `Messenger`.
  function Messenger() {
    this.configure();
  }

  // Perform any optimizations and/or validations on the specified `message`
  // and all of its placeholders, where appropriate.  
  // Errors will be thrown if any validation failures occur during this
  // process.
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

  // Optimize and/or validate all of the specified `messages` along with all
  // of their placeholders, where possible.  
  // Errors will be thrown if any validation failures occur during this
  // process.
  Messenger.prototype.checkMessages = function(messages) {
    var name;
    for (name in messages) {
      if (!messages.hasOwnProperty(name)) continue;
      this.checkMessage(name, messages[name]);
    }
    return messages;
  };

  // Optimize and/or validate all of the specified `placeholders`, where
  // possible.  
  // Errors will be thrown if any validation failures occur during this
  // process.
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

  // Configure this `Messenger` based on the specified `options`.  
  // Default configuration values will be used for any options that are missing
  // or invalid.
  Messenger.prototype.configure = function(options) {
    options = options || {};
    setUp.call(this, 'encoding',  options, 'UTF-8',     isNonEmptyString());
    setUp.call(this, 'extension', options, '.json',     isNonEmptyString());
    setUp.call(this, 'fallback',  options, true,        isType('boolean'));
    setUp.call(this, 'fileName',  options, 'messages',  isNonEmptyString());
    setUp.call(this, 'folders',   options, false,       isType('boolean'));
    setUp.call(this, 'languages', options, [],          isType('array'));
    setUp.call(this, 'optimize',  options, true,        isType('boolean'));
    setUp.call(this, 'path',      options, './locales', isNonEmptyString());
    setUp.call(this, 'validate',  options, true,        isType('boolean'));
    this.languages.sort();
    return this;
  };

  // Attempt to derive the locale from the current environment or fallback on
  // the `DEFAULT_LOCALE`.  
  // Locales are stored in segments so `'en-US'` would be stored as
  // `['en', 'GB']`.
  Messenger.prototype.deriveLocale = function() {
    if (!this.locale) {
      this.locale = (this.extractLocale() || DEFAULT_LOCALE).split(R_LOCALE);
    }
    return this.locale;
  };

  // Attempt to extract the locale from the current runtime environment.
  Messenger.prototype.extractLocale = function() {
    var html = document.getElementsByTagName('html')[0];
    if (html && html.lang) return html.lang;
    if (navigator.language) return navigator.language;
  };

  // Retrieve the named message from the bundle.
  Messenger.prototype.getMessage = function(name) {
    return this.messages[name];
  };

  // Retrieve the absolute/relative path of the file for the current locale.
  Messenger.prototype.getLocaleFile = function(relative) {
    var path = this.getLocaleParent(true) + '/';
    path    += this.folders ? this.fileName : this.locale.join('_');
    path    += this.extension;
    return relative ? path : resolvePath(path);
  };

  // Retrieve the absolute/relative path of the directory containing the file
  // for the current locale.
  Messenger.prototype.getLocaleParent = function(relative) {
    var path = this.getLocaleRoot(true);
    if (this.folders) {
      path += '/' + this.locale.join('_');
    }
    return relative ? path : resolvePath(path);
  };

  // Retrieve the absolute/relative path of the root directory containing
  // locale files or sub-directories.
  Messenger.prototype.getLocaleRoot = function(relative) {
    var path = this.path;
    return relative ? path : resolvePath(path);
  };

  // Asynchronously load the message resource into a local bundle.  
  // As the bundle is stored locally, subsequent calls will result in the
  // previously loaded messages.  
  // If no resource file could be found for the current locale, a second
  // attempt is made so long as the locale has a *parent* (e.g. `en-GB` but not
  // `en`) and the relevant option is enabled; otherwise, an appropriate
  // error will be raised.
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

  // Synchronously load the message resource into a local bundle.  
  // As the bundle is stored locally, the previously loaded messages will be
  // returned by subsequent calls.  
  // If no resource file could be found for the current locale, a second
  // attempt is made so long as the locale has a *parent* (e.g. `en-GB` but not
  // `en`) and the relevant option is enabled; otherwise, an appropriate
  // error will be thrown.
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
    }
    throw new Error(xhr.statusText);
  };

  // Transform the `contents` of a locale resource file into a message
  // bundle.  
  // The messages may be optimized and/or validated if the relevant options are
  // enabled.
  Messenger.prototype.parseMessages = function(contents) {
    var messages = JSON.parse(contents);
    if (this.optimize || this.validate) {
      this.checkMessages(messages);
    }
    return messages;
  };

  // Derive an absolute path from the relative `path` provided.
  Messenger.prototype.resolvePath = function(path) {
    var anchor  = document.createElement('a');
    anchor.href = path;
    return anchor.href;
  };

  // Internationalization
  // --------------------

  // Creates a new instance of `Internationalization`.
  function Internationalization() {
    this.messenger = new Messenger();
    this.node      = root.document;
  }

  // Retrieve the localized messages for each of the specified `names` in the
  // order they were given.
  Internationalization.prototype.all = function(names) {
    // TODO: Support substitutions (update comment)
    var messages = [];
    if (names) {
      for (var i = 0; i < names.length; i++) {
        messages.push(this.get(names[i]));
      }
    }
    return messages;
  };

  // Set the value of the given attribute on all selected elements to the
  // localized message for the specified `name`.
  Internationalization.prototype.attribute = function(selector, attr, name) {
    // TODO: Support substitutions (update comment)
    if (!this.node) return this;
    var elements = this.node.querySelectorAll(selector)
      , message  = this.get(name);
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute(attr, message);
    }
    return this;
  };

  // Set the content of all selected elements to the localized message for the
  // specified `name`.
  Internationalization.prototype.content = function(selector, name) {
    // TODO: Support substitutions (update comment)
    if (!this.node) return this;
    var elements = this.node.querySelectorAll(selector)
      , message  = this.get(name);
    for (var i = 0; i < elements.length; i++) {
      elements[i].innerHTML = message;
    }
    return this;
  };

  // Retrieve the localized message for the specified `name`.  
  // Any additional arguments are used as substitutions for numeric
  // placeholders.
  Internationalization.prototype.get = function(name) {
    if (!name) return;
    var args    = [].slice.call(arguments, 1)
      , message = this.messenger.getMessage(name);
    return message && this.substitute(message, args);
  };

  // Initialize this instance, optionall passing in `options` to modify the
  // configuration.  
  // During this process the messages for the configured locale will be
  // **asynchronously** loaded from its resource file.
  Internationalization.prototype.init = function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options  = null;
    }
    var that = this;
    this.messenger.configure(options).loadMessages(true, function(err, msgs) {
      callOrThrow(that, callback, err, msgs);
    });
  };

  // Initialize this instance, optionall passing in `options` to modify the
  // configuration.  
  // During this process the messages for the configured locale will be
  // **synchronously** loaded from its resource file.
  Internationalization.prototype.initSync = function(options) {
    this.messenger.configure(options).loadMessagesSync(true);
    return this;
  };

  // Asynchronously fetch all of the supported languages, optionally specifying
  // a `parent` locale for which only it and its *children* should be retrieved
  // (e.g. `en` could fetch `en`, `en-GB`, `en-US` but not `fr` or `fr-BE`).  
  // To optimize the performance of this function, the languages are only
  // populated once.  
  // The asynchronous aspect is only present in the overriden functionality
  // available for the node.js environment. However, the pattern also exists in
  // the browser for consistency.  
  // Also, as the browser isn't aware of all available languages, the only
  // languages in the results can be the current locale and its *parent - if
  // applicable - provided they aren't filtered out by the `parent` argument.
  // The only workaround for this is by using the `languages` option during
  // initialization.
  Internationalization.prototype.languages = function(parent, callback) {
    if (typeof parent === 'function') {
      callback = parent;
      parent   = null;
    }
    callOrThrow(this, callback, null, this.languagesSync(parent));
  };

  // Retrieve all of the supported languages, optionally specifying a `parent`
  // locale for which only it and its *children* should be retrieved
  // (e.g. `en` could return `en`, `en-GB`, `en-US` but not `fr` or `fr-BE`).  
  // To optimize the performance of this function, the languages are only
  // populated once.  
  // As the browser isn't aware of all available languages, the only languages
  // in the results can be the current locale and its *parent* - if
  // applicable - provided they aren't filtered out by the `parent` argument.
  // The only workaround for this is by using the `languages` option during
  // initialization.
  Internationalization.prototype.languagesSync = function(parent) {
    var languages = this.messenger.languages;
    if (!languages.length) {
      languages.push(this.messenger.locale.join('-'));
      languages.sort();
    }
    if (parent) {
      var filtered = [];
      if (parent === languages[0].slice(0, parent.length)) {
        if (parent.length !== languages[0].length) {
          filtered.push(parent);
        }
        filtered.push(languages[0]);
      }
      return filtered;
    }
    return languages.slice();
  };

  // Retrieve the current locale (e.g. `en`, `en-GB`).
  Internationalization.prototype.locale = function() {
    return this.messenger.locale.join('-');
  };

  // Retrieve the localized messages for each of the specified `names` in the
  // order they were given.
  // Map all of the specified `names` to their corresponding localized
  // messages.
  Internationalization.prototype.map = function(names) {
    // TODO: Support substitutions (update comment) (possible here?)
    var messages = {};
    if (names) {
      for (var i = 0; i < names.length; i++) {
        if (messages[names[i]]) continue;
        messages[names[i]] = this.get(names[i]);
      }
    }
    return messages;
  };

  // Create HTML option elements containing the localized message for each of
  // the specified `names` and inserts them into all selected elements.  
  // The contents of `names` can be a mixture of strings and objects. When the
  // latter is used, the its `content` property specifies the localized message
  // for the option's HTML contents and the `value` property specifies the
  // actual value for the option.
  Internationalization.prototype.options = function(selector, names) {
    // TODO: Support substitutions (update comment)
    if (!this.node || !names) return this;
    var i, j, option
      , elements = this.node.querySelectorAll(selector);
    for (i = 0; i < elements.length; i++) {
      for (j = 0; j < names.length; j++) {
        option = document.createElement('option');
        if (typeof names[j] === 'object') {
          option.innerHTML = this.get(names[j].content);
          option.value     = names[j].value;
        } else {
          option.innerHTML = this.get(names[j]);
        }
        elements[i].appendChild(option);
      }
    }
    return this;
  };

  // Set the value of the given property on all selected elements to the
  // localized message for the specified `name`.  
  // Properties can be identified using paths (e.g. `style.direction`) to
  // change the values of *deep* properties.
  Internationalization.prototype.property = function(selector, prop, name) {
    // TODO: Support substitutions (update comment)
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

  // Retrieve the message contents with all occurrences of placeholders
  // replaced, including numeric placeholders which represent arguments.  
  // Internal placeholders are replaced first, followed by the arguments to
  // improve performance.
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

  // Traverse the DOM from the specified `element`, falling back on the
  // configured `node` if not provided, and handling all recognized int17
  // attributes accordingly.
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

  // int17
  // -----

  // Creates a new instance of `int17`.
  function int17() {
    this.cache   = {};
    this.version = '0.1.0';
  }

  // Remove all internally cached references to shared `Internationalization`
  // instances.
  int17.prototype.clearCache = function() {
    this.cache = {};
    return this;
  };

  // Create a new instance of `Internationalization`.  
  // Optionally, named instances can be created and shared. If `name` is
  // specified the cache will be checked for existing references and will only
  // create a new instance if one could not be found.
  int17.prototype.create = function(name) {
    if (name)
      return this.cache[name] = this.cache[name] || new Internationalization();
    return new Internationalization();
  };

  // Run int17 in *noConflict* mode, returning the `int17` variable to its
  // previous owner.  
  // Returns a reference to `int17`.
  int17.prototype.noConflict = function() {
    root.int17 = PREVIOUS_INT17;
    return this;
  };

  // Expose the public API based on the available environment.
  if (typeof module === 'object' && module.exports) {
    // node.js requires some additional work.
    require('./node').override(Internationalization, Messenger);
    module.exports = new int17();
  } else if (typeof define === 'function' && define.amd) {
    // Define the module for CommonJS frameworks.
    define('int17', function() {
      return new int17();
    });
  } else {
    // Fallback on a simple variable attached to the global object.
    root.int17 = new int17();
  }

}).call(this);
