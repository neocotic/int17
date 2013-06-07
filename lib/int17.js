// [int17](http://neocotic.com/int17) 0.3.0  
// Copyright (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

(function () {

  'use strict';

  // Private constants
  // -----------------

      // Default locale to be used if none could be derived.
  var DEFAULT_LOCALE  = 'en'
      // Map of HTML entities for escaping.
    , ENTITY_MAP      = {
          '&':  '&amp;'
        , '<':  '&lt;'
        , '>':  '&gt;'
        , '"':  '&quot;'
        , '\'': '&#x27;'
        , '/':  '&#x2F;'
      }
      // List of method names whose result is escaped for HTML interpolation.
    , ESCAPE_METHODS  = ['all', 'get', 'map']
      // Save the previous value of the global `int17` variable.
    , PREVIOUS_INT17  = this.int17
      // Regular expression used for escaping HTML entities.
    , R_ESCAPE        = (function () {
        var keys = [];
        for (var key in ENTITY_MAP) {
          keys.push(key);
        }
        return new RegExp('[' + keys.join('') + ']', 'g');
      })()
      // Regular expression used to split locales.
    , R_LOCALE        = /[\-_]/
      // Regular expression used to extract the parent segment from locales.
    , R_PARENT        = /^([^\-_]+)[\-_]/
      // Regular expression used to replace placeholders in messages.
    , R_PLACEHOLDER   = /\$(\w+)\$/gi
      // Regular expression used to replace substitutions in messages.
    , R_SUBSTITUTION  = /\$([1-9]\d*)/gi
      // Regular expression used to seperate key/value pairs.
    , R_VALUES        = /^([^:]+):(.+)$/
      // Regular expression used to replace whitespace.
    , R_WHITESPACE    = /\s/g
      // Name of the substitutions attributes used internally by the `handlers`, including HTML5
      // data attributes.
    , SUBS_ATTRIBUTES = ['i18n-subs', 'data-i18n-subs'];

  // Support older versions of the substitution attributes for backwards compatibility.
  (function () {
    var i, len = SUBS_ATTRIBUTES.length;
    for (i = 0; i < len; i++) {
      SUBS_ATTRIBUTES.push(SUBS_ATTRIBUTES[i].replace('i18n', 'int17'));
    }
  })();

  // Private variables
  // -----------------

      // Reference to the global object.
  var root     = this
      // Quick reference to core prototype functions.
    , slice    = Array.prototype.slice
    , toString = Object.prototype.toString;

  // Private functions
  // -----------------

  // Return the type of the specified `object`.
  function type(object) {
    return toString.call(object).toLowerCase().slice(8, -1);
  }

  // Call `callback` in the specified `context` if it's a valid function.  
  // All other arguments will be passed on to `callback` but if the first argument is non-null this
  // indicates an error which will be thrown if `callback` is invalid.
  function callOrThrow(context, callback) {
    var args = slice.call(arguments, 2);
    if (type(callback) === 'function') {
      callback.apply(context, args);
    } else if (args[0]) {
      throw args[0];
    }
  }

  // Escape the `string` provided to HTML interpolation.
  function escape(string) {
    if (!string) return '';
    return ('' + string).replace(R_ESCAPE, function (match) {
      return ENTITY_MAP[match];
    });
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

  // Retrieve the placeholder with the specified `name`.  
  // The search can be case-sensitive to improve performance.
  function findPlaceholder(placeholders, name, ignoreCase) {
    if (!ignoreCase) return placeholders[name];
    name = name.toLowerCase();
    for (var placeholder in placeholders) {
      if (name === placeholder.toLowerCase()) return placeholders[placeholder];
    }
  }

  // Extract any substitutions from the specified `element`.
  function getSubstitutions(element) {
    var i, subs
      , results = [];
    for (i = 0; i < SUBS_ATTRIBUTES.length; i++) {
      subs    = element.getAttribute(SUBS_ATTRIBUTES[i]);
      results = results.concat(subs ? subs.split(';') : []);
    }
    return results;
  }

  // Return a validator for determining whether a value is a non-empty string.
  function isNonEmptyString(negate) {
    return function (value) {
      return (type(value) === 'string' && value.length) || negate;
    };
  }

  // Return a validator for determining whether a value is of the named type.
  function isType(name, negate) {
    name = name && name.toLowerCase();
    return function (value) {
      return type(value) === name || negate;
    };
  }

  // Transform the `contents` of a locale resource file into a message bundle.
  function parseMessages(contents) {
    return contents && JSON.parse(contents);
  }

  // Retrieve the message contents with all occurrences of placeholders replaced, including numeric
  // placeholders which represent substitution indices.  
  // Internal placeholders are replaced first, followed by the substitutions to improve
  // performance.  
  // The replacement of placeholders can be case-sensitive to improve performance when looking up
  // their values.
  function substitute(message, substitutions, ignoreCase) {
    var placeholders = message.placeholders
      , str          = message.message || '';
    if (placeholders) {
      str = str.replace(R_PLACEHOLDER, function (placeholder, name) {
        var replacement = findPlaceholder(placeholders, name, ignoreCase);
        replacement     = replacement && replacement.content;
        return type(replacement) === 'string' ? replacement : placeholder;
      });
    }
    if (substitutions && substitutions.length) {
      str = str.replace(R_SUBSTITUTION, function (sub, index) {
        index = index - 1;
        return type(substitutions[index]) === 'string' ? substitutions[index] : sub;
      });
    }
    return str;
  }

  // Flatten all `args` passed into single array.
  function vargs(args) {
    var results = [];
    args = slice.call(args);
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
      // To specify substitutions by a handler, that element should also have semi-colon separated
      // values declared within a substition attribute (e.g. `i18n-subs`).
  var handlers = {

          // Replace the HTML content of `element` with the named message looked up for `name`.
          'i18n-content': function(element, name) {
            element.innerHTML = this.get(name, getSubstitutions(element));
          }
        , 'int17-content': 'i18n-content'
        , 'data-i18n-content': 'i18n-content'
        , 'data-int17-content': 'i18n-content'

          // Adds options to the `element` with the messages looked up for `names`.  
          // `names` should be semi-colon separated values where each value is treated as a message
          // name which themselves can be separated by colons to divide them into two parts. The
          // first part specifying the message name for the option's HTML contents while the second
          // specifies the actual value for the option.
        , 'i18n-options': function(element, names) {
            names = names.replace(R_WHITESPACE, '').split(';');
            if (!names) return;
            var i, option, parts
              , subs = getSubstitutions(element);
            for (i = 0; i < names.length; i++) {
              option = document.createElement('option');
              parts  = names[i].match(R_VALUES);
              if (parts) {
                option.innerHTML = this.get(parts[1], subs);
                option.value     = parts[2];
              } else {
                option.innerHTML = this.get(names[i], subs);
              }
              element.appendChild(option);
            }
          }
        , 'int17-options': 'i18n-options'
        , 'data-i18n-options': 'i18n-options'
        , 'data-int17-options': 'i18n-options'

          // Replace the value of the properties and/or attributes of `element` with the messages
          // looked up for their corresponding values.  
          // `values` should be semi-colon separated values where each value is itself made up of
          // two parts (separated by colons), the property path/attribute name and the message
          // name.  
          // Property paths are interperated as different from attribute names by beginning with a
          // full stop/period character and can well contain more (e.g. `.style.direction:dir`).
        , 'i18n-values': function(element, values) {
            values = values.replace(R_WHITESPACE, '').split(';');
            if (!values) return;
            var expression, i, name, obj, paths, property
              , subs = getSubstitutions(element);
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
                  obj[paths[0]] = this.get(expression, subs);
                  if (~SUBS_ATTRIBUTES.indexOf(paths[0])) {
                    subs = getSubstitutions(element);
                  } else if (paths[0] === 'innerHTML') {
                    this.traverse(element);
                  }
                }
              } else {
                element.setAttribute(name, this.get(expression, subs));
                if (~SUBS_ATTRIBUTES.indexOf(name)) {
                  subs = getSubstitutions(element);
                }
              }
            }
          }
        , 'int17-values': 'i18n-values'
        , 'data-i18n-values': 'i18n-values'
        , 'data-int17-values': 'i18n-values'

      }
      // List of internationalization attributes/handlers available.  
      // During the population of this list, attribute aliases are mapped. Doing this now avoids
      // the need for a a second iteration through the handlers, therefore improving performance.
    , attributes = (function () {
        var attribute
          , results = [];
        for (attribute in handlers) {
          if (!handlers.hasOwnProperty(attribute)) continue;
          if (type(handlers[attribute]) === 'string') {
            handlers[attribute] = handlers[handlers[attribute]];
          }
          results.push(attribute);
        }
        return results;
      })()
      // Selector containing the available internationalization attributes/handlers which are used
      // by `traverse` to query all elements.
    , selector   = '[' + attributes.join('],[') + ']';

  // Messenger
  // ---------

  // Creates a new instance of `Messenger` for the specified `int17`.
  function Messenger(int17) {
    this.int17 = int17;
    this.configure();
  }

  // Configure this `Messenger` based on the specified `options`.  
  // Default configuration values will be used for any options that are missing or invalid.  
  // *Warning:* This function removes all previously fetched messages so `loadMessages` should be
  // called immediately after to avoid unpredictable behaviour.
  Messenger.prototype.configure = function(options) {
    options = options || {};
    if (options.locale && type(options.locale) !== 'array') {
      options.locale = options.locale.split(R_LOCALE);
    }
    delete this.messages;
    this.setUp('clean',      options, false,       isType('boolean'));
    this.setUp('encoding',   options, 'UTF-8',     isNonEmptyString());
    this.setUp('extension',  options, '.json',     isNonEmptyString());
    this.setUp('fallback',   options, false,       isType('boolean'));
    this.setUp('fileName',   options, 'messages',  isNonEmptyString());
    this.setUp('folders',    options, false,       isType('boolean'));
    this.setUp('ignoreCase', options, true,        isType('boolean'));
    this.setUp('languages',  options, [],          isType('array'));
    this.setUp('locale',     options, null,        isType('array'));
    this.setUp('path',       options, './locales', isNonEmptyString());
    this.setUp('separator',  options, '/',         isNonEmptyString());
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
              that.messages = that.parse(xhr.responseText);
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
      return this.messages = this.parse(xhr.responseText);
    } else if (this.fallback && original && this.locale.length > 1) {
      this.locale.pop();
      return this.loadMessagesSync(false);
    }
    throw new Error(xhr.statusText);
  };

  // Transform the `contents` of a locale resource file into a message bundle.  
  // This can be extended to modify the way in which a `Messenger` builds the message bundle.
  Messenger.prototype.parse = parseMessages;

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
    var validators = slice.call(arguments, 3)
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
    // Create the `escape` namespace for methods enabling HTML interpolation.
    var i
      , that = this;
    this.escape = {};
    function bindEscape(method) {
      that.escape[method] = function () {
        var result
          , alreadyEscaping = that.escaping;
        that.escaping       = true;
        try {
          result = that[method].apply(that, slice.call(arguments));
        } finally {
          if (!alreadyEscaping) delete that.escaping;
        }
        return result;
      };
    }
    for (i = 0; i < ESCAPE_METHODS.length; i++) {
      bindEscape(ESCAPE_METHODS[i]);
    }
  }

  // Retrieve the localized messages for each of the specified `names` in the order they were
  // given.  
  // The contents of `names` can be a mixture of strings and objects. When the latter is used, the
  // its `name` property specifies the name of the localized message and the `subs` property should
  // be an array to be used as substitutions when fetching the message.  
  // Any additional arguments are used as substitutions for numeric placeholders, except where
  // `subs` properties are specified.  
  // Call `escape.all` if you want to escape the messages for HTML interpolation.
  Internationalization.prototype.all = function(names) {
    var i, messageSubs, name
      , messages = []
      , subs     = vargs(slice.call(arguments, 1));
    if (names) {
      for (i = 0; i < names.length; i++) {
        messageSubs = subs;
        name        = names[i];
        if (type(name) === 'object') {
          messageSubs = name.subs || messageSubs;
          name        = name.name;
        }
        messages.push(this.get(name, messageSubs));
      }
    }
    return messages;
  };

  // Set the value of the given attribute on all selected elements to the localized message for the
  // specified `name`.  
  // Any additional arguments are used as substitutions for numeric placeholders.
  Internationalization.prototype.attribute = function(selector, attr, name) {
    if (!this.node) return this;
    var subs     = vargs(slice.call(arguments, 3))
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name, subs);
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute(attr, message);
    }
    return this;
  };

  // Set the content of all selected elements to the localized message for the specified `name`.  
  // Any additional arguments are used as substitutions for numeric placeholders.
  Internationalization.prototype.content = function(selector, name) {
    if (!this.node) return this;
    var subs     = vargs(slice.call(arguments, 2))
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name, subs);
    for (var i = 0; i < elements.length; i++) {
      elements[i].innerHTML = message;
    }
    return this;
  };

  // Retrieve the localized message for the specified `name`.  
  // Any additional arguments are used as substitutions for numeric placeholders.  
  // Call `escape.get` if you want to escape the message for HTML interpolation.
  Internationalization.prototype.get = function(name) {
    if (!name) return;
    var subs    = vargs(slice.call(arguments, 1))
      , message = this.messenger.getMessage(name);
    message = message && substitute(message, subs, this.messenger.ignoreCase);
    return this.escaping ? escape(message) : message;
  };

  // Initialize this instance, optionall passing in `options` to modify the configuration.  
  // During this process the messages for the configured locale will be **asynchronously** loaded
  // from its resource file.
  Internationalization.prototype.init = function(options, callback) {
    if (type(options) === 'function') {
      callback = options;
      options  = null;
    }
    var that = this;
    try {
      this.messenger.configure(options).loadMessages(true, function (err) {
        callOrThrow(that, callback, err);
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
  // Node.js environment. However, the pattern also exists in the browser for consistency.  
  // Also, as the browser isn't aware of all available languages, the only languages in the results
  // can be the current locale provided it isn't filtered out by the `parent` argument. The only
  // workaround for this is by using the `languages` option during initialization.
  Internationalization.prototype.languages = function(parent, callback) {
    if (type(parent) === 'function') {
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
  // be the current locale provided it isn't filtered out by the `parent` argument. The only
  // workaround for this is by using the `languages` option during initialization.
  Internationalization.prototype.languagesSync = function(parent) {
    var languages = this.messenger.languages;
    if (parent) return filterLanguages(parent, this.languagesSync());
    if (!languages.length) {
      languages.push(this.messenger.locale.join('-'));
    }
    return slice.call(languages);
  };

  // Retrieve the current locale (e.g. `en`, `en-GB`).
  Internationalization.prototype.locale = function() {
    return this.messenger.locale.join('-');
  };

  // Map all of the specified `names` to their corresponding localized messages.  
  // The contents of `names` can be a mixture of strings and objects. When the latter is used, the
  // its `name` property specifies the name of the localized message and the `subs` property should
  // be an array to be used as substitutions when fetching the message.  
  // The resulting map will use name parts as keys (strings or `name` property of objects).  
  // Any additional arguments are used as substitutions for numeric placeholders, except where
  // `subs` properties are specified.  
  // Call `escape.map` if you want to escape the messages for HTML interpolation.
  Internationalization.prototype.map = function(names) {
    var i, messageSubs, name
      , messages = {}
      , subs     = vargs(slice.call(arguments, 1));
    if (names) {
      for (i = 0; i < names.length; i++) {
        messageSubs = subs;
        name        = names[i];
        if (type(name) === 'object') {
          messageSubs = name.subs || messageSubs;
          name        = name.name;
        }
        messages[name] = this.get(name, messageSubs);
      }
    }
    return messages;
  };

  // Create HTML option elements containing the localized message for each of the specified `names`
  // and inserts them into all selected elements.  
  // The contents of `names` can be a mixture of strings and objects. When the latter is used, the
  // its `name` property specifies the localized message for the option's HTML contents, the
  // `value` property specifies the actual value for the option, and the `subs` property should be
  // an array to be used as substitutions when fetching the message.  
  // Any additional arguments are used as substitutions for numeric placeholders, except where
  // `subs` properties are specified.
  Internationalization.prototype.options = function(selector, names) {
    if (!this.node || !names) return this;
    var i, j, messageSubs, name, option
      , elements = this.node.querySelectorAll(selector)
      , subs     = vargs([].slice.call(arguments, 2));
    for (i = 0; i < elements.length; i++) {
      for (j = 0; j < names.length; j++) {
        messageSubs = subs;
        name        = names[j];
        option      = document.createElement('option');
        if (type(name) === 'object') {
          if (name.value) {
            option.value = name.value;
          }
          messageSubs  = name.subs || messageSubs;
          name         = name.name;
        }
        option.innerHTML = this.get(name, messageSubs);
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
    var element, i, obj, paths
      , subs     = vargs(slice.call(arguments, 3))
      , elements = this.node.querySelectorAll(selector)
      , message  = this.get(name, subs);
    for (i = 0; i < elements.length; i++) {
      element = elements[i];
      obj     = element;
      paths   = prop.split('.');
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

  // Traverse the DOM from the specified `element`, falling back on the configured `node` if not
  // provided, and handling all recognized int17 attributes accordingly.  
  // `element` can either be a DOM node or a query selector string.
  Internationalization.prototype.traverse = function(element) {
    if (type(element) === 'string') {
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
        for (j = 0; j < SUBS_ATTRIBUTES.length; j++) {
          child.removeAttribute(SUBS_ATTRIBUTES[j]);
        }
      }
    }
    return this;
  };

  // Int17
  // -----

  // Creates a new instance of `Int17`.
  function Int17() {
    this.cache   = {};
    this.version = '0.3.0';
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

  // Iterates over all of the `messages` provided and removes all meta data.  
  // This is useful for build systems wanting to optimize/minify message bundles for their
  // production environment.
  Int17.prototype.optimize = function(messages) {
    messages = type(messages) === 'string' ? this.parse(messages) : messages;
    if (!messages) return messages;
    var message, placeholder, placeholders;
    for (message in messages) {
      delete messages[message].description;
      placeholders = messages[message].placeholders;
      if (!placeholders) continue;
      for (placeholder in placeholders) {
        delete placeholders[placeholder].example;
      }
    }
    return messages;
  };

  // Transform the `contents` of a locale resource file into a message bundle.
  Int17.prototype.parse = parseMessages;

  // Expose the public API based on the available environment.
  var define = root.define;
  if (typeof module === 'object' && module.exports) {
    // Node.js requires some additional work.
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
