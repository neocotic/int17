// [int17](http://neocotic.com/int17) 0.1.0  
// Copyright (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

(function () {

  'use strict';

  // Private constants
  // -----------------

      // Name of the arguments attribute used internally by the `handlers`.
  var ARGS_ATTRIBUTE = 'int17-args'
      // Default locale to be used if none could be derived.
    , DEFAULT_LOCALE = 'en'
      // Save the previous value of the global `int17` variable.
    , PREVIOUS_INT17 = this.int17
      // Regular expression used to replace arguments in messages.
    , R_ARGUMENT     = /\$([1-9]\d*)/gi
      // Regular expression used to split locales.
    , R_LOCALE       = /[\-_]/
      // Regular expression used to extract the parent segment from locales.
    , R_PARENT       = /^([^\-_]+)[\-_]/
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

  // Retrieve the target value on an object.  
  // Optionally, the search can be case-insensitive which will take slightly longer as all
  // properties are checked until a match is found.
  function findProp(obj, target, ignoreCase) {
    if (!ignoreCase) return obj[target];
    target = target.toLowerCase();
    for (var prop in obj) {
      if (target === prop.toLowerCase()) return obj[prop];
    }
  }

  // Extract the arguments from the specified `element`.
  function getArgs(element) {
    var args = element.getAttribute(ARGS_ATTRIBUTE);
    return args ? args.split(';') : [];
  }

  // Return a validator for determining whether a value is a non-empty string.
  function isNonEmptyString(negate) {
    return function (value) {
      return (typeof value === 'string' && value.length) || negate;
    };
  }

  // Return a validator for determining whether a value is of the specified `type`.
  function isType(type, negate) {
    type = type && type.toLowerCase();
    return function (value) {
      var actualType = Object.prototype.toString.call(value).toLowerCase();
      return actualType === '[object ' + type + ']' || negate;
    };
  }

  // Return a replace for substituting placeholders within optimized messages.
  function replaceOptimized(placeholders) {
    return function (placeholder, name) {
      var replacement = findProp(placeholders, name.toLowerCase(), false);
      return typeof replacement === 'string' ? replacement : placeholder;
    };
  }

  // Return a replacer for substituting placeholders within potentially optimized messages.
  function replacer(placeholders, optimized) {
    return (optimized ? replaceOptimized : replaceStandard)(placeholders);
  }

  // Return a replace for substituting placeholders within non-optimized messages.
  function replaceStandard(placeholders) {
    return function (placeholder, name) {
      var replacement = findProp(placeholders, name.toLowerCase(), true);
      replacement     = replacement && replacement.content;
      return typeof replacement === 'string' ? replacement : placeholder;
    };
  }

  // Validate the specified `message`, throwing appropriate errors if any validations fail.  
  // It is recommended that this is used during development but disabled in production environments
  // to improve performance.
  function validateMessage(messageName, message) {
    var prefix = 'Message[' + messageName + ']';
    if (typeof message !== 'object')
      throw new TypeError(prefix + ' is not an object');
    if (typeof message.message !== 'string')
      throw new TypeError(prefix + '.message is not a string');
    if (message.hasOwnProperty('placeholders') &&
        typeof message.placeholders !== 'object') {
      throw new TypeError(prefix + '.placeholders is not an object');
    }
  }

  // Validate the specified `placeholder`, throwing appropriate errors if any validations fail.  
  // It is recommended that this is used during development but disabled in production environments
  // to improve performance.
  function validatePlaceholder(messageName, placeholderName, placeholder) {
    var prefix = 'Message[' + messageName + '].placeholders[' + placeholderName + ']';
    if (typeof placeholder !== 'object')
      throw new TypeError(prefix + ' is not an object');
    if (typeof placeholder.content !== 'string')
      throw new TypeError(prefix + '.content is not a string');
  }

  // Flatten all `args` passed into single array.
  function vargs(args) {
    var results = [];
    args = [].slice.call(args);
    for (var i = 0; i < args.length; i++) {
      results = results.concat(args[i]);
    }
    return results;
  }

  // Handlers
  // --------

      // Mapping for internationalization handlers.  
      // Each handler represents an attribute (based on the property name) and is called for each
      // attribute found within the node currently being processed.  
      // To specify arguments to be used as substitutions by a handler, that attribute should have
      // semi-colon separated values declared within an `int17-args` attribute on the same element.
  var handlers = {

          // Replace the HTML content of `element` with the named message looked up for `name`.
          'int17-content': function(element, name) {
            element.innerHTML = this.get(name, getArgs(element));
          }

          // Adds options to the `element` with the messages looked up for `names`.  
          // `names` should be semi-colon separated values where each value is treated as a message
          // name which themselves can be separated by colons to divide them into two parts. The
          // first part specifying the message name for the option's HTML contents while the second
          // specifies the actual value for the option.
        , 'int17-options': function(element, names) {
            names = names.replace(R_WHITESPACE, '').split(';');
            if (!names) return;
            var i, option, parts
              , args = getArgs(element);
            for (i = 0; i < names.length; i++) {
              option = document.createElement('option');
              parts  = names[i].match(R_VALUES);
              if (parts) {
                option.innerHTML = this.get(parts[1], args);
                option.value     = parts[2];
              } else {
                option.innerHTML = this.get(names[i], args);
              }
              element.appendChild(option);
            }
          }

          // Replace the value of the properties and/or attributes of `element` with the messages
          // looked up for their corresponding values.  
          // `values` should be semi-colon separated values where each value is itself made up of
          // two parts (separated by colons), the property path/attribute name and the message
          // name.  
          // Property paths are interperated as different from attribute names by beginning with a
          // full stop/period character and can well contain more (e.g. `.style.direction:dir`).
        , 'int17-values': function(element, values) {
            values = values.replace(R_WHITESPACE, '').split(';');
            if (!values) return;
            var expression, i, name, obj, paths, property
              , args = getArgs(element);
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
                  obj[paths[0]] = this.get(expression, args);
                  switch (paths[0]) {
                  case ARGS_ATTRIBUTE:
                    args = getArgs(element);
                    break;
                  case 'innerHTML':
                    this.traverse(element);
                    break;
                  }
                }
              } else {
                element.setAttribute(name, this.get(expression, args));
                if (name === ARGS_ATTRIBUTE) {
                  args = getArgs(element);
                }
              }
            }
          }

    }
    // List of internationalization attributes/handlers available.
  , attributes = (function () {
      var attribute, results = [];
      for (attribute in handlers) {
        if (handlers.hasOwnProperty(attribute)) {
          results.push(attribute);
        }
      }
      return results;
    }())
    // Selector containing the available internationalization attributes/handlers which are used by
    // `traverse` to query all elements.
  , selector   = '[' + attributes.join('],[') + ']';

  // Messenger
  // ---------

  // Creates a new instance of `Messenger` for the specified `int17`.
  function Messenger(int17) {
    this.int17 = int17;
    this.configure();
  }

  // Perform any optimizations and/or validations on the specified `message` and all of its
  // placeholders, where appropriate.  
  // Errors will be thrown if any validation failures occur during this process.
  Messenger.prototype.checkMessage = function(name, message) {
    var key, value;
    if (this.validate) {
      validateMessage(name, message);
    }
    for (key in message) {
      if (!message.hasOwnProperty(key)) continue;
      value = message[key];
      switch (key) {
      case 'placeholders':
        if (typeof value === 'object') {
          this.checkPlaceholders(name, value);
        }
        break;
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

  // Optimize and/or validate all of the specified `messages` along with all of their placeholders,
  // where possible.  
  // Errors will be thrown if any validation failures occur during this process.
  Messenger.prototype.checkMessages = function(messages) {
    var name;
    for (name in messages) {
      if (!messages.hasOwnProperty(name)) continue;
      this.checkMessage(name, messages[name]);
    }
    return messages;
  };

  // Optimize and/or validate all of the specified `placeholders`, where possible.  
  // Errors will be thrown if any validation failures occur during this process.
  Messenger.prototype.checkPlaceholders = function(messageName, placeholders) {
    var lcName, name, placeholder;
    for (name in placeholders) {
      if (!placeholders.hasOwnProperty(name)) continue;
      placeholder = placeholders[name];
      if (this.validate) {
        validatePlaceholder(messageName, name, placeholder);
      }
      if (this.optimize) {
        lcName = name.toLowerCase();
        delete placeholders[name];
        placeholders[lcName] = placeholder.content;
      }
    }
    return placeholders;
  };

  // Configure this `Messenger` based on the specified `options`.  
  // Default configuration values will be used for any options that are missing or invalid.
  Messenger.prototype.configure = function(options) {
    options = options || {};
    if (options.locale && !isType('array')(options.locale)) {
      options.locale = options.locale.split(R_LOCALE);
    }
    this.setUp('clean',     options, false,       isType('boolean'));
    this.setUp('encoding',  options, 'UTF-8',     isNonEmptyString());
    this.setUp('extension', options, '.json',     isNonEmptyString());
    this.setUp('fallback',  options, true,        isType('boolean'));
    this.setUp('fileName',  options, 'messages',  isNonEmptyString());
    this.setUp('folders',   options, false,       isType('boolean'));
    this.setUp('languages', options, [],          isType('array'));
    this.setUp('locale',    options, null,        isType('array'));
    this.setUp('optimize',  options, true,        isType('boolean'));
    this.setUp('path',      options, './locales', isNonEmptyString());
    this.setUp('separator', options, '/',         isNonEmptyString());
    this.setUp('validate',  options, true,        isType('boolean'));
    this.languages.sort();
    return this.reconfigure();
  };

  // Attempt to derive the locale from the current environment or fallback on `DEFAULT_LOCALE`.  
  // Locales are stored in segments so `'en-US'` would be stored as `['en', 'GB']`.
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
    var path = this.getLocaleParent(true) + this.separator;
    path    += this.folders ? this.fileName : this.locale.join('_');
    path    += this.extension;
    return relative ? path : this.resolvePath(path);
  };

  // Retrieve the absolute/relative path of the directory containing the file for the current
  // locale.
  Messenger.prototype.getLocaleParent = function(relative) {
    var path = this.getLocaleRoot(true);
    if (this.folders) {
      path += this.separator + this.locale.join('_');
    }
    return relative ? path : this.resolvePath(path);
  };

  // Retrieve the absolute/relative path of the root directory containing the locale files or
  // sub-directories.
  Messenger.prototype.getLocaleRoot = function(relative) {
    var path = this.path;
    return relative ? path : this.resolvePath(path);
  };

  // Asynchronously load the message resource into a local bundle.  
  // As the bundle is stored locally, subsequent calls will result in the previously loaded
  // messages.  
  // If no resource file could be found for the current locale, a second attempt is made so long as
  // the locale has a *parent* (e.g. `en-GB` but not `en`) and the relevant option is enabled;
  // otherwise, an appropriate error will be raised.
  Messenger.prototype.loadMessages = function(original, callback) {
    try {
      if (this.messages) return callOrThrow(this, callback, null, this.messages);
      this.deriveLocale();
      var that = this
        , xhr  = new XMLHttpRequest();
      xhr.open('GET', this.getLocaleFile(), true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              that.messages = that.parseMessages(xhr.responseText);
              callOrThrow(that, callback, null, that.messages);
            } catch (err) {
              callOrThrow(that, callback, err);
            }
          } else {
            if (that.fallback && original && that.locale.length > 1) {
              that.locale.pop();
              that.loadMessages(false, callback);
            } else {
              callOrThrow(that, callback, new Error(xhr.statusText));
            }
          }
        }
      };
      xhr.send(null);
    } catch (err) {
      callOrThrow(this, callback, err);
    }
  };

  // Synchronously load the message resource into a local bundle.  
  // As the bundle is stored locally, the previously loaded messages will be returned by subsequent
  // calls.  
  // If no resource file could be found for the current locale, a second attempt is made so long as
  // the locale has a *parent* (e.g. `en-GB` but not `en`) and the relevant option is enabled;
  // otherwise, an appropriate error will be thrown.
  Messenger.prototype.loadMessagesSync = function(original) {
    if (this.messages) return this.messages;
    this.deriveLocale();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.getLocaleFile(), false);
    xhr.send(null);
    if (xhr.status === 200) {
      return this.messages = this.parseMessages(xhr.responseText);
    } else if (this.fallback && original && this.locale.length > 1) {
      this.locale.pop();
      return this.loadMessagesSync(false);
    }
    throw new Error(xhr.statusText);
  };

  // Transform the `contents` of a locale resource file into a message bundle.  
  // The messages may be optimized and/or validated if the relevant options are enabled.
  Messenger.prototype.parseMessages = function(contents) {
    var messages = JSON.parse(contents);
    if (this.optimize || this.validate) {
      this.checkMessages(messages);
    }
    return messages;
  };

  // Placeholder to allow override of configuration settings without too much duplication.
  Messenger.prototype.reconfigure = function() {
    return this;
  };

  // Derive an absolute path from the relative `path` provided.
  Messenger.prototype.resolvePath = function(path) {
    var anchor  = document.createElement('a');
    anchor.href = path;
    return anchor.href;
  };

  // Set the value of the specified property on this `Messenger` as that taken from an object.  
  // All remaining arguments should be validation functions which, if any fail, results in the
  // default value being set instead.
  Messenger.prototype.setUp = function(property, obj, defaultValue) {
    var validators = [].slice.call(arguments, 3)
      , value      = obj[property];
    for (var i = 0; i < validators.length; i++) {
      if (!validators[i](value)) {
        value = this.hasOwnProperty(property) ? this[property] : defaultValue;
        break;
      }
    }
    this[property] = value;
  };

  // Internationalization
  // --------------------

  // Creates a new instance of `Internationalization`.
  function Internationalization() {
    this.messenger = new Messenger(this);
    this.node      = root.document;
  }

  // Retrieve the localized messages for each of the specified `names` in the order they were
  // given.  
  // The contents of `names` can be a mixture of strings and objects. When the latter is used, the
  // its `name` property specifies the name of the localized message and the `args` property should
  // be an array of arguments to be used as substitutions when fetching the message.  
  // Any additional arguments are used as substitutions for numeric placeholders, except where
  // `args` properties are specified.
  Internationalization.prototype.all = function(names) {
    var i, messageArgs, name
      , args     = vargs([].slice.call(arguments, 1))
      , messages = [];
    if (names) {
      for (i = 0; i < names.length; i++) {
        messageArgs = args;
        name        = names[i];
        if (typeof name === 'object') {
          messageArgs = name.args || messageArgs;
          name        = name.name;
        }
        messages.push(this.get(name, messageArgs));
      }
    }
    return messages;
  };

  // Set the value of the given attribute on all selected elements to the localized message for the
  // specified `name`.  
  // Any additional arguments are used as substitutions for numeric placeholders.
  Internationalization.prototype.attribute = function(selector, attr, name) {
    if (!this.node) return this;
    var args     = [].slice.call(arguments, 3)
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name, args);
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute(attr, message);
    }
    return this;
  };

  // Set the content of all selected elements to the localized message for the specified `name`.  
  // Any additional arguments are used as substitutions for numeric placeholders.
  Internationalization.prototype.content = function(selector, name) {
    if (!this.node) return this;
    var args     = [].slice.call(arguments, 2)
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name, args);
    for (var i = 0; i < elements.length; i++) {
      elements[i].innerHTML = message;
    }
    return this;
  };

  // Retrieve the localized message for the specified `name`.  
  // Any additional arguments are used as substitutions for numeric placeholders.
  Internationalization.prototype.get = function(name) {
    if (!name) return;
    var args    = vargs(arguments).slice(1)
      , message = this.messenger.getMessage(name);
    return message && this.substitute(message, args);
  };

  // Initialize this instance, optionall passing in `options` to modify the configuration.  
  // During this process the messages for the configured locale will be **asynchronously** loaded
  // from its resource file.
  Internationalization.prototype.init = function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options  = null;
    }
    var that = this;
    try {
      this.messenger.configure(options).loadMessages(true, function (err, messages) {
        callOrThrow(that, callback, err, messages);
      });
    } catch (err) {
      callOrThrow(this, callback, err);
    }
  };

  // Initialize this instance, optionall passing in `options` to modify the configuration.  
  // During this process the messages for the configured locale will be **synchronously** loaded
  // from its resource file.
  Internationalization.prototype.initSync = function(options) {
    this.messenger.configure(options).loadMessagesSync(true);
    return this;
  };

  // Asynchronously fetch all of the supported languages, optionally specifying a `parent` locale
  // for which only its *children* should be retrieved (e.g. `en` could fetch `en-GB` and `en-US`
  // but not `en`, `fr`, or `fr-BE`).  
  // To optimize the performance of this function, the languages are only populated once.  
  // The asynchronous aspect is only present in the overriden functionality available for the
  // node.js environment. However, the pattern also exists in the browser for consistency.  
  // Also, as the browser isn't aware of all available languages, the only languages in the results
  // can be the current locale and its *parent - if applicable - provided they aren't filtered out
  // by the `parent` argument. The only workaround for this is by using the `languages` option
  // during initialization.
  Internationalization.prototype.languages = function(parent, callback) {
    if (typeof parent === 'function') {
      callback = parent;
      parent   = null;
    }
    try {
      var languages = this.languagesSync(parent);
      callOrThrow(this, callback, null, languages);
    } catch (err) {
      callOrThrow(this, callback, err);
    }
  };

  // Retrieve all of the supported languages, optionally specifying a `parent` locale for which
  // only its *children* should be retrieved (e.g. `en` could return `en-GB` and `en-US` but not
  // `en`, `fr`, or `fr-BE`).  
  // To optimize the performance of this function, the languages are only populated once.  
  // As the browser isn't aware of all available languages, the only languages in the results can
  // be the current locale and its *parent* - if applicable - provided they aren't filtered out by
  // the `parent` argument. The only workaround for this is by using the `languages` option during
  // initialization.
  Internationalization.prototype.languagesSync = function(parent) {
    var languages = this.messenger.languages;
    if (parent) return filterLanguages(parent, this.languagesSync());
    if (!languages.length) {
      languages.push(this.messenger.locale.join('-'));
    }
    return languages.slice();
  };

  // Retrieve the current locale (e.g. `en`, `en-GB`).
  Internationalization.prototype.locale = function() {
    return this.messenger.locale.join('-');
  };

  // Map all of the specified `names` to their corresponding localized messages.  
  // The contents of `names` can be a mixture of strings and objects. When the latter is used, the
  // its `name` property specifies the name of the localized message and the `args` property should
  // be an array of arguments to be used as substitutions when fetching the message.  
  // The resulting map will use name parts as keys (strings or `name` property of objects).  
  // Any additional arguments are used as substitutions for numeric placeholders, except where
  // `args` properties are specified.
  Internationalization.prototype.map = function(names) {
    var i, messageArgs, name
      , args     = vargs([].slice.call(arguments, 1))
      , messages = {};
    if (names) {
      for (i = 0; i < names.length; i++) {
        messageArgs = args;
        name        = names[i];
        if (typeof name === 'object') {
          messageArgs = name.args || messageArgs;
          name        = name.name;
        }
        messages[name] = this.get(name, messageArgs);
      }
    }
    return messages;
  };

  // Create HTML option elements containing the localized message for each of the specified `names`
  // and inserts them into all selected elements.  
  // The contents of `names` can be a mixture of strings and objects. When the latter is used, the
  // its `name` property specifies the localized message for the option's HTML contents, the
  // `value` property specifies the actual value for the option, and the `args` property should be
  // an array of arguments to be used as substitutions when fetching the message.  
  // Any additional arguments are used as substitutions for numeric placeholders, except where
  // `args` properties are specified.
  Internationalization.prototype.options = function(selector, names) {
    if (!this.node || !names) return this;
    var i, j, messageArgs, name, option
      , args     = [].slice.call(arguments, 2)
      , elements = this.node.querySelectorAll(selector);
    for (i = 0; i < elements.length; i++) {
      for (j = 0; j < names.length; j++) {
        messageArgs = args;
        name        = names[j];
        option      = document.createElement('option');
        if (typeof name === 'object') {
          messageArgs  = name.args || messageArgs;
          name         = name.name;
          option.value = name.value;
        }
        option.innerHTML = this.get(name, messageArgs);
        elements[i].appendChild(option);
      }
    }
    return this;
  };

  // Set the value of the given property on all selected elements to the localized message for the
  // specified `name`.  
  // Properties can be identified using paths (e.g. `style.direction`) to change the values of
  // *deep* properties.  
  // Any additional arguments are used as substitutions for numeric placeholders.
  Internationalization.prototype.property = function(selector, prop, name) {
    if (!this.node) return this;
    var element, i, obj
      , args     = [].slice.call(arguments, 3)
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name, args)
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

  // Retrieve the message contents with all occurrences of placeholders replaced, including numeric
  // placeholders which represent argument indices.  
  // Internal placeholders are replaced first, followed by the arguments to improve performance.
  Internationalization.prototype.substitute = function(message, args) {
    var optimized    = this.messenger.optimize
      , placeholders = message.placeholders
      , str          = message.message || '';
    if (placeholders) {
      str = str.replace(R_PLACEHOLDER, replacer(placeholders, optimized));
    }
    if (args && args.length) {
      str = str.replace(R_ARGUMENT, function (arg, index) {
        index = index - 1;
        return typeof args[index] === 'string' ? args[index] : arg;
      });
    }
    return str;
  };

  // Traverse the DOM from the specified `element`, falling back on the configured `node` if not
  // provided, and handling all recognized int17 attributes accordingly.
  Internationalization.prototype.traverse = function(element) {
    if (isType('string')(element)) {
      element = this.node.querySelector(element);
    }
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
          if (this.messenger.clean) {
            child.removeAttribute(attribute);
          }
        }
      }
      if (this.messenger.clean) {
        child.removeAttribute(ARGS_ATTRIBUTE);
      }
    }
    return this;
  };

  // Int17
  // -----

  // Creates a new instance of `Int17`.
  function Int17() {
    this.cache   = {};
    this.version = '0.1.0';
  }

  // Remove all internally cached references to shared `Internationalization` instances.
  Int17.prototype.clearCache = function() {
    this.cache = {};
    return this;
  };

  // Create a new instance of `Internationalization`.  
  // Optionally, named instances can be created and shared. If `name` is specified the cache will
  // be checked for existing references and will only create a new instance if one could not be
  // found.
  Int17.prototype.create = function(name) {
    if (name) return this.cache[name] = this.cache[name] || new Internationalization();
    return new Internationalization();
  };

  // Run int17 in *noConflict* mode, returning the `int17` variable to its previous owner.  
  // Returns a reference to `int17`.
  Int17.prototype.noConflict = function() {
    root.int17 = PREVIOUS_INT17;
    return this;
  };

  // Expose the public API based on the available environment.
  var define = root.define;
  if (typeof module === 'object' && module.exports) {
    // node.js requires some additional work.
    require('./node').override(Internationalization, Messenger);
    module.exports = new Int17();
  } else if (typeof define === 'function' && define.amd) {
    // Define the module for CommonJS frameworks.
    define('int17', function () {
      return new Int17();
    });
  } else {
    // Fallback on a simple variable attached to the global object.
    root.int17 = new Int17();
  }

}).call(this);
