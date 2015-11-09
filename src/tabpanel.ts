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
 * A panel which combines a `TabBar` and a `StackedPanel`.
 *
 * #### Notes
 * Children for this panel should be added to the [[widgets]] list.
 */
export
class TabPanel extends BoxPanel {
  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.addClass(TAB_PANEL_CLASS);

    this._tabs.items = this._stack.children;
    this._tabs.currentItemChanged.connect(this.onCurrentItemChanged, this);
    this._tabs.itemCloseRequested.connect(this.onItemCloseRequested, this);

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
   * Get the currently selected widget.
   *
   * #### Notes
   * This is a convenience alias to the `currentItem` property of the
   * tab bar.
   */
  get currentWidget(): Widget {
    return this._tabs.currentItem;
  }

  /**
   * Set the currently selected widget.
   *
   * #### Notes
   * This is a convenience alias to the `currentItem` property of the
   * tab bar.
   */
  set currentWidget(widget: Widget) {
    this._tabs.currentItem = widget;
  }

  /**
   * Get whether the tabs are movable by the user.
   *
   * #### Notes
   * This is a convenience alias to the `tabsMovable` property of the
   * tab bar.
   */
  get tabsMovable(): boolean {
    return this._tabs.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   *
   * #### Notes
   * This is a convenience alias to the `tabsMovable` property of the
   * tab bar.
   */
  set tabsMovable(movable: boolean) {
    this._tabs.tabsMovable = movable;
  }

  /**
   * Get the observable list of widgets for the tab panel.
   *
   * #### Notes
   * Widgets to arrange in the tab panel should be added to this list.
   *
   * This is a read-only alias of the `children` property of the
   * stacked panel.
   */
  get widgets(): IChildWidgetList {
    return this._stack.children;
  }

  /**
   * Get the tab bar associated with the tab panel.
   *
   * #### Notes
   * The items in the tab bar are automatically synchronized with the
   * children of the stacked panel.
   *
   * This is a read-only property.
   */
  get tabs(): TabBar<Widget> {
    return this._tabs;
  }

  /**
   * Get the stacked panel associated with the tab panel.
   *
   * #### Notes
   * The children of the stacked panel are automatically synchronized
   * with the items in the tab bar.
   *
   * This is a read-only property.
   */
  get stack(): StackedPanel {
    return this._stack;
  }

  /**
   * Handle the `currentItemChanged` signal from the tab bar.
   *
   * #### Notes
   * This can be reimplemented by subclasses as needed.
   *
   * The default implementation of this method synchronizes the current
   * tab item with current widget of the stacked panel.
   */
  protected onCurrentItemChanged(sender: TabBar<Widget>, args: IChangedArgs<Widget>): void {
    this._stack.currentWidget = args.newValue;
  }

  /**
   * Handle the `itemCloseRequested` signal from the tab bar.
   *
   * #### Notes
   * This can be reimplemented by subclasses as needed.
   *
   * The default implementation of this method closes the widget if the
   * widget's title object has its `closable` flag set to `true`.
   */
  protected onItemCloseRequested(sender: TabBar<Widget>, args: Widget): void {
    if (args.title.closable) args.close();
  }

  private _tabs = new TabBar<Widget>();
  private _stack = new StackedPanel();
}
