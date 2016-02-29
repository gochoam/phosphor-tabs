phosphor-tabs
=============

[![Build Status](https://travis-ci.org/phosphorjs/phosphor-tabs.svg)](https://travis-ci.org/phosphorjs/phosphor-tabs?branch=master)
[![Coverage Status](https://coveralls.io/repos/phosphorjs/phosphor-tabs/badge.svg?branch=master&service=github)](https://coveralls.io/github/phosphorjs/phosphor-tabs?branch=master)

Phosphor widgets for creating tab bars and tab panels. The resulting layout
shows a set of tabs that can be rearranged graphically by the user, displaying
a title and a "close" button.


Package Install
---------------

**Prerequisites**
- [node](http://nodejs.org/)

```bash
npm install --save phosphor-tabs
```


Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node](http://nodejs.org/)

```bash
git clone https://github.com/phosphorjs/phosphor-tabs.git
cd phosphor-tabs
npm install
```

**Rebuild**
```bash
npm run clean
npm run build
```


Run Tests
---------

Follow the source build instructions first.

```bash
# run tests in Firefox
npm test

# run tests in Chrome
npm run test:chrome

# run tests in IE
npm run test:ie
```


Build Docs
----------

Follow the source build instructions first.

```bash
npm run docs
```

Navigate to `docs/index.html`.


Build Example
-------------

Follow the source build instructions first.

```bash
npm run build:example
```

Navigate to `example/index.html`.


Supported Runtimes
------------------

The runtime versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- IE 11+
- Firefox 32+
- Chrome 38+


Bundle for the Browser
----------------------

Follow the package install instructions first.

Any bundler that understands how to `require()` files with `.js` and `.css`
extensions can be used with this package.


Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. Simply
omit the type declarations when using a language other than TypeScript.

The `phosphor-tabs` module provides two constructors: `TabBar` and `TabPanel`.
A tab bar displays several items as a row of tabs. A tab panel combines a
`TabBar` and a `StackedPanel` to handle the common case of a tab bar placed
above a content area. The selected tab controls the widget which is shown in
the content area.

The following snippet imports the required modules and creates some content.
The title is displayed in each tab followed by a "x" icon to close the
corresponding tab.

```typescript
import {
  TabPanel
} from 'phosphor-tabs';

import {
  Widget
} from 'phosphor-widget';

let one = new Widget();
one.title.text = 'One';

let two = new Widget();
two.title.text = 'Two';

let three = new Widget();
three.title.text = 'Three';
```

The `.addChild()` method adds content to the `TabPanel`, it takes as argument a
widget. Additionally it is possible to make the tabs movable, allowing
drag-and-drop  making the interface more dynamic. This can be switched on and
off assigning a boolean to `.tabsMovable`.


```typescript
let panel = new TabPanel();
panel.tabsMovable = true;
panel.addChild(one);
panel.addChild(two);
panel.addChild(three);

panel.attach(document.body);

window.onresize = () => { panel.update(); };

window.onload = () => { panel.attach(document.body); };
```


API
---

[API Docs](http://phosphorjs.github.io/phosphor-tabs/api/)
