/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  BoxLayout
} from 'phosphor-boxpanel';

import {
  IChangedArgs
} from 'phosphor-properties';

import {
  StackedPanel
} from 'phosphor-stackedpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  ITabItem, ITabMovedArgs, TabBar
} from './tabbar';


/**
 * The class name added to TabPanel instances.
 */
const TAB_PANEL_CLASS = 'p-TabPanel';

/**
 * The class name added to a TabPanel's tab bar.
 */
const TAB_BAR_CLASS = 'p-TabPanel-tabBar';

/**
 * The class name added to a TabPanel's stacked panel.
 */
const STACKED_PANEL_CLASS = 'p-TabPanel-stackedPanel';


/**
 * A widget which combines a `TabBar` and a `StackedPanel`.
 *
 * #### Notes
 * This is a simple panel which handles the common case of a tab bar
 * placed above a content area. The selected tab controls the widget
 * which is shown in the content area.
 *
 * For use cases which require more control than is provided by this
 * panel, the `TabBar` widget may be used independently.
 */
export
class TabPanel extends Widget {
  /**
   * Create a `TabBar` for a tab panel.
   *
   * @returns A new tab bar to use with a tab panel.
   *
   * #### Notes
   * This may be reimplemented by subclasses for custom tab bars.
   */
  static createTabBar(): TabBar {
    return new TabBar();
  }

  /**
   * Create a `StackedPanel` for a tab panel.
   *
   * @returns A new stacked panel to use with a tab panel.
   *
   * #### Notes
   * This may be reimplemented by subclasses for custom stacks.
   */
  static createStackedPanel(): StackedPanel {
    return new StackedPanel();
  }

  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.addClass(TAB_PANEL_CLASS);

    let type = this.constructor as typeof TabPanel;
    this._tabBar = type.createTabBar();
    this._stackedPanel = type.createStackedPanel();

    this._tabBar.addClass(TAB_BAR_CLASS);
    this._stackedPanel.addClass(STACKED_PANEL_CLASS);

    this._tabBar.tabMoved.connect(this.onTabMoved, this);
    this._tabBar.currentChanged.connect(this.onCurrentChanged, this);
    this._tabBar.tabCloseRequested.connect(this.onTabCloseRequested, this);
    this._stackedPanel.widgetRemoved.connect(this.onWidgetRemoved, this);

    let layout = new BoxLayout();
    layout.direction = BoxLayout.TopToBottom;
    layout.spacing = 0;

    BoxLayout.setStretch(this._tabBar, 0);
    BoxLayout.setStretch(this._stackedPanel, 1);

    layout.addChild(this._tabBar);
    layout.addChild(this._stackedPanel);

    this.layout = layout;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._tabBar = null;
    this._stackedPanel = null;
    super.dispose();
  }

  /**
   * Get the currently selected widget.
   */
  get currentWidget(): Widget {
    return this._tabBar.currentItem as Widget;
  }

  /**
   * Set the currently selected widget.
   */
  set currentWidget(widget: Widget) {
    this._tabBar.currentItem = widget;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabBar.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(movable: boolean) {
    this._tabBar.tabsMovable = movable;
  }

  /**
   * Get the tab bar associated with the tab panel.
   *
   * #### Notes
   * Modifying the tab bar directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get tabBar(): TabBar {
    return this._tabBar;
  }

  /**
   * Get the stacked panel associated with the tab panel.
   *
   * #### Notes
   * Modifying the stack directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get stackedPanel(): StackedPanel {
    return this._stackedPanel;
  }

  /**
   * Get the number of child widgets in the tab panel.
   *
   * @returns The number of child widgets in the tab panel.
   *
   * #### Notes
   * This delegates to the `childCount` method of the stacked panel.
   */
  childCount(): number {
    return this._stackedPanel.childCount();
  }

  /**
   * Get the child widget at the specified index.
   *
   * @param index - The index of the child widget of interest.
   *
   * @returns The child at the specified index, or `undefined`.
   *
   * #### Notes
   * This delegates to the `childAt` method of the stacked panel.
   */
  childAt(index: number): Widget {
    return this._stackedPanel.childAt(index);
  }

  /**
   * Get the index of the specified child widget.
   *
   * @param child - The child widget of interest.
   *
   * @returns The index of the specified child, or `-1`.
   *
   * #### Notes
   * This delegates to the `childIndex` method of the stacked panel.
   */
  childIndex(child: Widget): number {
    return this._stackedPanel.childIndex(child);
  }

  /**
   * Add a child widget to the end of the tab panel.
   *
   * @param child - The child widget to add to the tab panel.
   *
   * #### Notes
   * If the child is already contained in the panel, it will be moved.
   */
  addChild(child: Widget): void {
    this.insertChild(this.childCount(), child);
  }

  /**
   * Insert a child widget at the specified index.
   *
   * @param index - The index at which to insert the child.
   *
   * @param child - The child widget to insert into to the tab panel.
   *
   * #### Notes
   * If the child is already contained in the panel, it will be moved.
   */
  insertChild(index: number, child: Widget): void {
    if (child.parent !== this._stackedPanel) child.hide();
    this._stackedPanel.insertChild(index, child);
    this._tabBar.insertItem(index, child);
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   *
   * #### Notes
   * The default implementation updates the visible child widget.
   */
  protected onCurrentChanged(sender: TabBar, args: IChangedArgs<ITabItem>): void {
    let oldWidget = args.oldValue as Widget;
    let newWidget = args.newValue as Widget;
    if (oldWidget) oldWidget.hide();
    if (newWidget) newWidget.show();
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   *
   * #### Notes
   * The default implementation moves the child widget in the stack.
   */
  protected onTabMoved(sender: TabBar, args: ITabMovedArgs): void {
    let child = this._stackedPanel.childAt(args.fromIndex);
    this._stackedPanel.insertChild(args.toIndex, child);
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   *
   * #### Notes
   * The default implementation invokes the widget's `close` method.
   */
  protected onTabCloseRequested(sender: TabBar, item: ITabItem): void {
    (item as Widget).close();
  }

  /**
   * Handle the `widgetRemoved` signal from the stacked panel.
   *
   * #### Notes
   * The default implementation removes the widget from the tab bar.
   */
  protected onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    this._tabBar.removeItem(widget);
  }

  private _tabBar: TabBar;
  private _stackedPanel: StackedPanel;
}
