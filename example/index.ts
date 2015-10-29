/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  Widget
} from 'phosphor-widget';

import {
  Tab, TabPanel
} from '../lib/index';

import './index.css';


function createContent(title: string): Widget {
  let widget = new Widget();
  widget.addClass('content');
  widget.addClass(title.toLowerCase());
  TabPanel.setTab(widget, new Tab(title));
  return widget;
}


function main(): void {
  let red = createContent('Red');
  let yellow = createContent('Yellow');
  let blue = createContent('Blue');
  let green = createContent('Green');

  let panel = new TabPanel()
  panel.id = 'main';
  panel.widgets = [red, yellow, blue, green];

  Widget.attach(panel, document.body);

  window.onresize = () => panel.update();
}


window.onload = main;
