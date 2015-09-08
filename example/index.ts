/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  Widget, attachWidget
} from 'phosphor-widget';

import {
  Tab, TabPanel
} from '../lib/index';

import './index.css';


function createContent(title: string): Widget {
  var widget = new Widget();
  widget.addClass('content');
  widget.addClass(title.toLowerCase());
  TabPanel.setTab(widget, new Tab(title));
  return widget;
}


function main(): void {
  var red = createContent('Red');
  var yellow = createContent('Yellow');
  var blue = createContent('Blue');
  var green = createContent('Green');

  var panel = new TabPanel()
  panel.id = 'main';
  panel.widgets = [red, yellow, blue, green];

  attachWidget(panel, document.body);

  window.onresize = () => panel.update();
}


window.onload = main;
