## Version 0.3.0, 2013.06.11

* [#14](https://github.com/neocotic/int17/issues/14): Make HTML attributes more generic using `i18n` prefix
* [#15](https://github.com/neocotic/int17/issues/15): No longer optimize/validate messages during initialization (remove `optimize` and `validate` options)
* [#15](https://github.com/neocotic/int17/issues/15): Add `ignoreCase` option to control how placeholders are looked up
* [#16](https://github.com/neocotic/int17/issues/16): Add built-in [jQuery][] plugin support
* [#17](https://github.com/neocotic/int17/issues/17): Add `defaultLocale` option to allow specific fallback locale to be used
* [#17](https://github.com/neocotic/int17/issues/17): Add `messages` option to allow pre-defined message bundles to be used
* [#17](https://github.com/neocotic/int17/issues/17): No longer validate user-defined options
* [#17](https://github.com/neocotic/int17/issues/17): Consolidate utility functions into single object: `_`
* [#17](https://github.com/neocotic/int17/issues/17): Expose core internal classes (i.e. `Internationalization`, `Messenger`) via `int17`
* [#18](https://github.com/neocotic/int17/issues/18): Tidy code and make more readable

## Version 0.2.2, 2013.05.23

* [#10](https://github.com/neocotic/int17/issues/10): Fix error caused when type-checking global variables in browsers

## Version 0.2.1, 2013.04.10

* [#6](https://github.com/neocotic/int17/issues/6): Support HTML escaping
* [#7](https://github.com/neocotic/int17/issues/7): Fix bug with `property` method

## Version 0.2.0, 2013.04.08

* [#1](https://github.com/neocotic/int17/issues/1): Add support for HTML5 data attributes
* [#2](https://github.com/neocotic/int17/issues/2): Replace `int17-args` attribute with `int17-subs`
* [#4](https://github.com/neocotic/int17/issues/4): Document [bower][] installation

[bower]: http://twitter.github.io/bower/
[jquery]: http://jquery.com
