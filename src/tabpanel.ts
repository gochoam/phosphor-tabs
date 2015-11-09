/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  BoxPanel
} from 'phosphor-boxpanel';

import {
  IChangedArgs
} from 'phosphor-properties';

// import {
//   ISignal, Signal
// } from 'phosphor-signaling';

import {
  StackedPanel
} from 'phosphor-stackedpanel';

import {
  IChildWidgetList, Widget
} from 'phosphor-widget';

import {
  TabBar
} from './tabbar';


/**
 * The class name added to TabPanel instances.
 */
const TAB_PANEL_CLASS = 'p-TabPanel';


/**
 * A panel which provides a tabbed layout for child widgets.
 *
 * #### Notes
 * A `TabPanel` is a combination of a `TabBar` and a `StackedPanel`.
 *
 * Widgets should be added to the tab panel's `widgets` list (instead
 * of its `children` list) so that the widgets are properly added to
 * the internal stacked panel.
 */
export
class TabPanel extends BoxPanel {
  /**
   * A signal emitted when the current widget is changed.
   *
   * **See also:** [[currentChanged]]
   */
  // static currentChangedSignal = new Signal<TabPanel, IWidgetIndexArgs>();

  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.addClass(TAB_PANEL_CLASS);

    this._tabs.items = this._stack.children;
    this._tabs.currentChanged.connect(this._onCurrentChanged, this);

    BoxPanel.setStretch(this._tabs, 0);
    BoxPanel.setStretch(this._stack, 1);

    this.direction = BoxPanel.TopToBottom;
    this.spacing = 0;

    this.children.add(this._tabs);
    this.children.add(this._stack);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._tabs = null;
    this._stack = null;
    super.dispose();
  }

  /**
   * A signal emitted when the current widget is changed.
   *
   * #### Notes
   * This is a pure delegate to the [[currentChangedSignal]].
   */
  // get currentChanged(): ISignal<TabPanel, IWidgetIndexArgs> {
  //   return TabPanel.currentChangedSignal.bind(this);
  // }

  /**
   * Get the currently selected widget.
   */
  get currentWidget(): Widget {
    return this._tabs.currentItem;
  }

  /**
   * Set the currently selected widget.
   */
  set currentWidget(widget: Widget) {
    this._tabs.currentItem = widget;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabs.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(movable: boolean) {
    this._tabs.tabsMovable = movable;
  }

  /**
   * Get the observable list of widgets for the tab panel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get widgets(): IChildWidgetList {
    return this._stack.children;
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _onCurrentChanged(sender: TabBar<Widget>, args: IChangedArgs<Widget>): void {
    this._stack.currentWidget = args.newValue;
  }

  private _tabs = new TabBar<Widget>();
  private _stack = new StackedPanel();
}
