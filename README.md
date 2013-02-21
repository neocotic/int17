                __       _    _______  
     __        /\ \__  /' \  /\____  \ 
    /\_\    ___\ \ ,_\/\_, \ \/__//' /'
    \/\ \ /' _ `\ \ \/\/_/\ \    /' /' 
     \ \ \/\ \/\ \ \ \_  \ \ \  /' /'  
      \ \_\ \_\ \_\ \__\  \ \_\/\_/'   
       \/_/\/_/\/_/\/__/   \/_/\//     

[int17][] is a pure JavaScript library providing [internationalization and localization][].

[![Build Status](https://secure.travis-ci.org/neocotic/int17.png)](http://travis-ci.org/neocotic/int17)

It can be used normally in any browser as well as in the [node.js][] environment (especially with
[Express][]).

* [Install](#install)
* [Examples](#examples)
* [API](#api)
   * [Int17](#int17)
     * [Instances](#instances)
     * [Miscellaneous](#miscellaneous)
   * [Internationalization](#internationalization)
     * [Setup](#setup)
     * [Browser Only](#browser-only)
     * [Locales](#locales)
     * [Messages](#messages)
     * [Miscellaneous](#miscellaneous-1)
* [Locale Files](#locale-files)
* [Attributes](#attributes)
* [Express](#express)
* [Bugs](#bugs)
* [Questions](#questions)

## Install

Install from [npm][]:

``` bash
$ npm install int17
```

## Examples

In the browser:

``` html
<html>
  <head>
    <script src="/path/to/int17.js"></script>
    <script>
      (function () {
        var i18n = int17.create();
        i18n.init({ locale: 'en-GB' }, function (err) {
          if (err) throw err;
          i18n.traverse();
        });
      }());
    </script>
  </head>
  <body>
    <h1 int17-args="2013" int17-content="date_header"></h1>
    <div>
      <p int17-values=".style.direction:dir;.innerHTML:main_body"></p>
      <span int17-content="my_label"></span>
      <select int17-options="default_option:-1;option1;option2"></select>
    </div>
  </body>
</html>
```

In [node.js][]:

``` javascript
var i18n = require('int17').create();
i18n.initSync({ locale: 'en-GB' });

console.log(i18n.get('welcome'));
```

Both using the same [JSON][] structure, inspired by that used by
[Google Chrome extensions][chrome.i18n]:

``` javascript
{
  "date_header": {
    "message": "The date is $DATE$!",
    "placeholders": {
      "date": {
        "content": "$1",
        "example": "2012"
      }
    }
  },
  "default_option": {
    "message": "All"
  },
  "main_body": {
    "message": "This is an example of $name$'s greatness!",
    "placeholders": {
      "name": {
        "content": "int17"
      }
    }
  },
  "my_label": {
    "message": "Options example:"
  },
  "option1": {
    "message": "1st option"
  },
  "option2": {
    "message": "2nd option"
  },
  "welcome": {
    "message": "Hello, World!",
    "description": "Simple welcome message"
  }
}
```

## API

### Int17
The global `int17` variable in the browser or the return value of `require('int17')` in [node.js][]
is an instance of `Int17`. This is used to expose factory functionality required to get started
with globalizing your application.

#### Instances

##### `create([name])`
Returns a new instance of [Internationalization](#internationalization). Optionally, if a `name` is
specified, a shared instance can be retrieved/created which is most useful within [node.js][] as it
saves passing an object reference between modules.

``` javascript
var i18n1 = int17.create();
var i18n2 = int17.create('i18n');
var i18n3 = int17.create('i18n');
console.log(i18n1 == i18n2); // "false"
console.log(i18n2 == i18n3); // "true"
```

##### `clearCache()`
Removes all internal references to shared instances which are created by
[create([name])](#createname).

``` javascript
var i18n1 = int17.create('i18n');
var i18n2 = int17.create('i18n');
int17.clearCache();
var i18n3 = int17.create('i18n');
var i18n4 = int17.create('i18n');
console.log(i18n1 == i18n2); // "true"
console.log(i18n1 == i18n3); // "false"
console.log(i18n3 == i18n4); // "true"
```

#### Miscellaneous

##### `noConflict()`
Returns `int17` in a no-conflict state, reallocating the `int17` global variable name to its
previous owner, where possible.

This is really just intended for use within a browser.

``` html
<head>
  <script src="/path/to/conflict-lib.js"></script>
  <script src="/path/to/int17.js"></script>
  <script>
    var int17nc = int17.noConflict();
    // Conflicting lib works again and use int17nc for this library onwards...
  </script>
</head>
```

##### `version`
The current version of `int17`.

``` javascript
console.log(int17.version); // "0.1.0"
```

### Internationalization
An instance of `Internationalization` is returned by [create([name])](#createname) and is your new
best friend when it comes to all your internationalization needs.

#### Setup

##### `init([options], [callback(err)])`
Initializes the instance with any [options](#options) provided before asynchronously loading the
localalized messages from their resource file/URL.

``` javascript
i18n.init(options, function (err) {
  if (err) throw err;
  // Do anything...
});
```

##### `initSync([options])`
Initializes the instance with any [options](#options) provided before synchronously
(thread-blocking) loading the localized messages from their resource file/URL.

``` javascript
i18n.init(options);
// Do anything...
```

##### Options
The following options are recognised by these methods (all of which are optional):

<table>
  <tr>
    <th>Option</th>
    <th>Description</th>
    <th>Default Value</th>
  </tr>
  <tr>
    <td>clean</td>
    <td>
      Remove all recognized <a href="#attributes">int17 attributes</a> are removed from each
      processed element when <a href="#traverseelement">traverse([element])</a> is called.
    </td>
    <td><code>false</code></td>
  </tr>
  <tr>
    <td>encoding</td>
    <td>Encoding to be used when reading locale files.</td>
    <td><code>'UTF-8'</code></td>
  </tr>
  <tr>
    <td>extension</td>
    <td>File extension used by your locale files.</td>
    <td><code>'.json'</code></td>
  </tr>
  <tr>
    <td>fallback</td>
    <td>
      If there is a problem reading the file for the current locale, retry using the parent of the
      current locale (if applicable) or, in <a href="http://nodejs.org">node.js</a> only, one of
      its child locales (again, if applicable).
      <br>
      The fallback process may only retry once and then the appropriate error is thrown but may
      impact performance when used in production.
    </td>
    <td><code>false</code></td>
  </tr>
  <tr>
    <td>fileName</td>
    <td>
      Base file name used by your locale files.
      <br>
      This is only relevant when the <em>folders</em> option is enabled.
      <br>
      See the <a href="#locale-files">Locale Files</a> section for more information and examples.
    </td>
    <td><code>'messages'</code></td>
  </tr>
  <tr>
    <td>folders</td>
    <td>
      Use a folder-based file structure for your locale files.
      <br>
      See the <a href="#locale-files">Locale Files</a> section for more information and examples.
    </td>
    <td><code>false</code></td>
  </tr>
  <tr>
    <td>languages</td>
    <td>
      Specify a pre-defined list of available languages.
      <br>
      See the <a href="#languages">Languages</a> section for more information on the benefits of
      this option.
    </td>
    <td><code>[]</code></td>
  </tr>
  <tr>
    <td>locale</td>
    <td>
      Specify the locale whose messages are to be retrieved.
      <br>
      By default, <code>int17</code> attempts to derive the best locale based on your environment
      before falling back on <code>'en'</code>.
    </td>
    <td><em>Derived</em></td>
  </tr>
  <tr>
    <td>optimize</td>
    <td>
      Optimize the memory usage and improve lookup performance slightly with a small increase in
      initialization time.
      <br>
      As optimization involves iterating over all messages within the locale file this may impact
      performance when used in production but, if you're already using the <em>validate</em>
      option, this won't increase the delay to initialization much as it already invokes the
      iteration.
    </td>
    <td><code>true</code></td>
  </tr>
  <tr>
    <td>path</td>
    <td>
      Absolute/relative file path pointing at the root directory containing the locale
      files/folders.
    </td>
    <td><code>'./locales'</code></td>
  </tr>
  <tr>
    <td>separator</td>
    <td>
      File separator to be used when building file paths.
    </td>
    <td>
      Browser: <code>'/'</code>
      <br>
      <a href="http://nodejs.org">node.js</a>:
      <a href="http://nodejs.org/api/path.html#path_path_sep">path.sep</a>
    </td>
  </tr>
  <tr>
    <td>validate</td>
    <td>
      Check the contents of the locale file once loaded to ensure all messages are entirely valid,
      throwing an appropriate error if any messages are found to be invalid.
      <br>
      As validation involves iterating over all messages within the locale file this may impact
      performance when used in production but, if you're already using the <em>optimize</em>
      option, this won't increase the delay to initialization much as it already invokes the
      iteration.
    </td>
    <td><code>true</code></td>
  </tr>
</table>

#### Browser Only

##### `attribute(selector, attr, name, [...])`
Sets the value of the specified attribute on all of the selected elements with the message for the
specified `name`. All remaining arguments are used to replace indexed placeholders within the
message before it is returned.

``` javascript
i18n.attribute('a', 'title', 'link_title');
i18n.attribute('a.download', 'title', 'open_file');
```

##### `content(selector, name, [...])`
Replaces the contents of all of the selected elements with the message for the specified `name`.
All remaining arguments are used to replace indexed placeholders within the message before it is
returned.

``` javascript
i18n.content('h1', 'page_header');
i18n.content('p', 'welcome', 'World');
```

##### `node`
The element whose children are within scope of all [browser only](#browser-only) methods. By
default this references `window.document` but this can be changed to reduce the scope of
internationalization and improve performance of some of these methods.

``` javascript
console.log(i18n.node); // "HTMLDocument"
```

##### `options(selector, names, [...])`
Creates option elements containing the messages for the specified `names` and appends the to all of
the selected elements. All remaining arguments are used to replace indexed placeholders within the
message before it is returned.

`names` can consist of a mix of strings and objects containing a `name` string and, optionally, an
`args` list as well as a `value`. When used, the optional `args` property of a name object
overrides any replacement arguments passed to the method when that particular message is processed
while the `value` property is transfered to that option.

``` javascript
i18n.options('select', [
  { name: 'default_option', value: '-1' },
  'option1',
  { name: 'option2' },
  { name: 'option2', args: ['2'] }
], 'Two');
```

##### `property(selector, prop, name, [...])`
Sets the value of the specified property on all of the selected elements with the message for the
specified `name`. All remaining arguments are used to replace indexed placeholders within the
message before it is returned.

`prop` can be identified using paths to change the values of *deep* properties.

``` javascript
i18n.property('p', 'style.direction', 'dir');
i18n.property('p', 'innerHTML', 'welcome', 'World');
```

##### `traverse([element])`
Searches the children of the specified `element` (defaulting to [node](#node)) for elements with
any of the recognized [HTML attributes](#attributes) and then processes each child accordingly.

`element` can either be an HTML element node or a query selector string which, when used, will be
used to query the children of [node](#node) for the actual element to be traversed.

``` javascript
// Traverses the children of i18n.node
i18n.traverse();
// Both of these do the same thing: traverses the children of <body> element
i18n.traverse(document.body);
i18n.traverse('body');
```

#### Locales

##### `languages([parent], [callback(err, languages)])`
Retrieves a list of available languages for the current environment. Optionally, this can be
filtered to only include languages that extend from a specific `parent` locale, excluding the
`parent` itself.

The [languages](#languages) are initially fetched asynchronously so a `callback` function must be
provided in order to use the results. However, this does not really happen in the browser where
[languagesSync([parent])](#languagessyncparent) is called while still supporting the callback
pattern.

``` javascript
// Fetch all available languages
i18n.languages(function (err, languages) {
  if (err) throw err;
  doSomething(languages);     // e.g. "en", "en-GB", "en-US", "fr"
});
// Fetch available languages that extend from "en"
i18n.languages('en', function (err, languages) {
  if (err) throw err;
  doSomethingElse(languages); // e.g. "en-GB", "en-US"
});
```

##### `languagesSync([parent])`
Returns a list of available languages for the current environment. Optionally, this can be
filtered to only include languages that extend from a specific `parent` locale, excluding the
`parent` itself.

The [languages](#languages) are initially fetched synchronously (thread-blocking).

``` javascript
// Return all available languages
doSomething(i18n.languagesSync());         // e.g. "en", "en-GB", "en-US", "fr"
// Return available languages that extend from "en"
doSomethingElse(i18n.languagesSync('en')); // e.g. "en-GB", "en-US"
```

##### Languages
The list of available languages is populated only with the current locale in the browser but, in
[node.js][], the locale root directory is scanned and detects locales from the children file/folder
names.

Alternatively, the [*languages* option](#options) can be used to pre-populate the list. This is
extremely beneficial in a browser as there's no other way of [int17][] knowing what languages are
available in your configuration.

Regardless, the list is only populated when no languages have previously been fetched (or provided
- in the previous statement's case) and results are cached to improve the performance of subsequent
requests.

##### `locale()`
Returns the current locale.

``` javascript
console.log(i18n.locale()); // e.g. "en", "en-GB"
```

#### Messages

##### `all(names, [...])`
Returns a list of messages for each of the specified `names`. All remaining arguments are used to
replace indexed placeholders within each message before they are returned.

`names` can consist of a mix of strings and objects containing a `name` string and, optionally, an
`args` list as well. When used, the optional `args` property of a name object overrides any
replacement arguments passed to the method when that particular message is processed.

``` javascript
doSomething(i18n.all([
  'my_message',
  { name: 'welcome' },
  { name: 'welcome', args: [] },
  { name: 'welcome', args: ['Universe'] }
], 'World'));
// [
//   'Lorem ipsum',
//   'Hello, World!',
//   'Hello, $1!',
//   'Hello, Universe!'
// ]
```

##### `get(name, [...])`
Returns the message for the specified `name`. All remaining arguments are used to replace indexed
placeholders within the message before it is returned.

``` javascript
console.log(i18n.get('welcome'));          // "Hello, $1!"
console.log(i18n.get('welcome', 'World')); // "Hello, World!"
```

##### `map(names, [...])`
Maps each of the specified `names` to their corresponding message. All remaining arguments are used
to replace indexed placeholders within each message before they are returned.

`names` can consist of a mix of strings and objects containing a `name` string and, optionally, an
`args` list as well. When used, the optional `args` property of a name object overrides any
replacement arguments passed to the method when that particular message is processed.

``` javascript
doSomething(i18n.map([
  'my_message',
  { name: 'welcome' },
  { name: 'welcome', args: ['Universe'] }
], 'World'));
// {
//   my_message: 'Lorem ipsum',
//   welcome:    'Hello, Universe!'
// }
```

#### Miscellaneous

##### `express(app, [namespace])`
Extends the `app` provided to expose the instance to [Express][]. Optionally, a `namespace` can be
specified to customize what property name is used to access the int17 functionality via requests
and responses.

See the [Express](#express) section for more information and examples.

## Locale Files

TODO: Provide overview and example(s)

## Attributes

The [traverse([element])](#traverseelement) method automatically recognizes int17-specific HTML
attributes and handles each element they're attached to accordingly.

##### `int17-args`
TODO: Provide description and example(s)

##### `int17-content`
TODO: Provide description and example(s)

##### `int17-options`
TODO: Provide description and example(s)

##### `int17-values`
TODO: Provide description and example(s)

## Express

If you love [Express][] as much as I do, you'll be happy to know that you don't have to do any
fancy hacking to get it to work well with [int17][].

Just configure it:

``` javascript
var express = require('express'),
    i18n    = require('int17').create();

// ...

// During app's configuration...
app.configure(function () {
  // ...

  // Binds the int17 instance to requests and responses handled by app
  i18n.express(app);

  // ...
});
```

That's it! Now you can use it in your view:

``` javascript
app.get('/', function (req, res) {
  res.render('index', {
      header: req.int17.get('page_header'),
      intro:  req.int17.get('welcome_message')
  });
});
```

And just as easily in your templates:

```
<% include header %>
<h1><%- int17.get('page_header_prefix') %> <%- header %></h1>
<p><%- intro %></p>
<% include footer %>
```

*Note:* This example is using the [ejs][] template engine.

## Bugs

If you have any problems with this library or would like to see the changes currently in
development you can do so here;

https://github.com/neocotic/int17/issues

## Questions?

Take a look at `docs/int17.html` to get a better understanding of what the code is doing.

If that doesn't help, feel free to follow me on Twitter, [@neocotic][].

However, if you want more information or examples of using this library please visit the project's
homepage;

http://neocotic.com/int17

[@neocotic]: https://twitter.com/neocotic
[chrome.i18n]: http://developer.chrome.com/extensions/i18n.html
[ejs]: https://github.com/visionmedia/ejs
[express]: http://expressjs.com
[int17]: http://neocotic.com/int17
[internationalization and localization]: http://en.wikipedia.org/wiki/Internationalization_and_localization
[json]: http://www.json.org
[node.js]: http://nodejs.org
[npm]: http://npmjs.org
