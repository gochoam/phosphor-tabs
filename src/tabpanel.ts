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
  Property
} from 'phosphor-properties';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  IWidgetIndexArgs, StackedPanel
} from 'phosphor-stackedpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  Tab
} from './tab';

import {
  ITabIndexArgs, ITabMoveArgs, TabBar
} from './tabbar';


/**
 * A panel which provides a tabbed layout for child widgets.
 *
 * The `TabPanel` provides a convenient combination of a `TabBar` and
 * a `StackedPanel` which allows the user to toggle between widgets by
 * selecting the tab associated with a widget.
 *
 * #### Notes
 * Widgets should be added to a `TabPanel` using the `<prefix>Widget`
 * methods, **not** the `<prefix>Child` methods. The children of a
 * `TabPanel` should **not** be manipulated directly by user code.
 */
export
class TabPanel extends BoxPanel {
  /**
   * The class name added to TabPanel instances.
   */
  static p_TabPanel = 'p-TabPanel';

  /**
   * A signal emitted when the current widget is changed.
   *
   * **See also:** [[currentChanged]]
   */
  static currentChangedSignal = new Signal<TabPanel, IWidgetIndexArgs>();

  /**
   * The property descriptor for the tab attached property.
   *
   * This controls the tab used for a widget in a tab panel.
   *
   * #### Notes
   * If the tab for a widget is changed, the new tab will not be
   * reflected until the widget is re-inserted into the tab panel.
   * However, in-place changes to the tab's properties **will** be
   * reflected.
   *
   * **See also:** [[getTab]], [[setTab]]
   */
  static tabProperty = new Property<Widget, Tab>({
    value: null,
    coerce: (owner, value) => value || null,
  });

  /**
   * Get the tab for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The tab for the given widget.
   *
   * #### Notes
   * This is a pure delegate for the [[tabProperty]].
   */
  static getTab(widget: Widget): Tab {
    return TabPanel.tabProperty.get(widget);
  }

  /**
   * Set the tab for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param tab - The tab to use for the widget.
   *
   * #### Notes
   * This is a pure delegate for the [[tabProperty]].
   */
  static setTab(widget: Widget, tab: Tab): void {
    TabPanel.tabProperty.set(widget, tab);
  }

  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.addClass(TabPanel.p_TabPanel);

    var tabs = new TabBar();
    tabs.tabMoved.connect(this._onTabMoved, this);
    tabs.tabSelected.connect(this._onTabSelected, this);
    tabs.tabCloseRequested.connect(this._onTabCloseRequested, this);

    var stack = new StackedPanel();
    stack.currentChanged.connect(this._onCurrentChanged, this);
    stack.widgetRemoved.connect(this._onWidgetRemoved, this);

    BoxPanel.setStretch(tabs, 0);
    BoxPanel.setStretch(stack, 1);
    this.direction = BoxPanel.TopToBottom;
    this.spacing = 0;

    this._tabs = tabs;
    this._stack = stack;
    this.addChild(tabs);
    this.addChild(stack);
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
  get currentChanged(): ISignal<TabPanel, IWidgetIndexArgs> {
    return TabPanel.currentChangedSignal.bind(this);
  }

  /**
   * Get the currently selected widget.
   */
  get currentWidget(): Widget {
    return this._stack.currentWidget;
  }

  /**
   * Set the currently selected widget.
   */
  set currentWidget(widget: Widget) {
    var i = this._stack.childIndex(widget);
    this._tabs.selectedTab = this._tabs.tabAt(i);
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
   * Get a shallow copy of the array of widgets.
   *
   * #### Notes
   * When only iterating over the widgets, it can be faster to use
   * the widget query methods, which do not perform a copy.
   *
   * **See also:** [[widgetCount]], [[widgetAt]]
   */
  get widgets(): Widget[] {
    return this._stack.children;
  }

  /**
   * Set the widgets for the tab panel.
   *
   * #### Notes
   * This will clear the current widgets and add the specified widgets.
   * Depending on the desired outcome, it can be more efficient to use
   * one of the widget manipulation methods.
   *
   * **See also:** [[addWidget]], [[insertWidget]], [[removeWidget]]
   */
  set widgets(widgets: Widget[]) {
    this.clearWidgets();
    widgets.forEach(widget => this.addWidget(widget));
  }

  /**
   * Get the number of widgets in the tab panel.
   *
   * #### Notes
   * This is a read-only property.
   *
   * **See also:** [[widgets]], [[widgetAt]]
   */
  get widgetCount(): number {
    return this._stack.childCount;
  }

  /**
   * Get the widget at a specific index.
   *
   * @param index - The index of the widget of interest.
   *
   * @returns The widget widget at the specified index, or `undefined`
   *   if the index is out of range.
   *
   * **See also:** [[widgetCount]], [[widgetIndex]]
   */
  widgetAt(index: number): Widget {
    return this._stack.childAt(index);
  }

  /**
   * Get the index of a specific widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The index of the specified widget, or `-1` if the widget
   *   is not contained in the tab panel.
   *
   * **See also:** [[widgetCount]], [[widgetAt]]
   */
  widgetIndex(widget: Widget): number {
    return this._stack.childIndex(widget);
  }

  /**
   * Add a widget to the end of the panel.
   *
   * @param widget - The widget to add to the panel.
   *
   * @returns The new index of the widget.
   *
   * #### Notes
   * If the widget already exists in the panel, it will first be
   * removed.
   *
   * The `TabPanel.tab` attached property *must* be set with the
   * tab to use for the widget, or an error will be thrown. This
   * can be set via `TabPanel.setTab`.
   *
   * The `TabPanel.tab` attached property is assumed to remain
   * constant while the widget is contained by the tab panel.
   *
   * **See also:** [[insertWidget]], [[moveWidget]]
   */
  addWidget(widget: Widget): number {
    return this.insertWidget(this.widgetCount, widget);
  }

  /**
   * Insert a widget into the panel at the given index.
   *
   * @param index - The target index for the widget. This will be
   *   clamped to the bounds of the widgets.
   *
   * @param widget - The widget to insert into the panel.
   *
   * @returns The new index of the widget.
   *
   * #### Notes
   * If the widget already exists in the panel, it will first be
   * removed.
   *
   * The `TabPanel.tab` attached property *must* be set with the
   * tab to use for the widget, or an error will be thrown. This
   * can be set via `TabPanel.setTab`.
   *
   * The `TabPanel.tab` attached property is assumed to remain
   * constant while the widget is contained by the tab panel.
   *
   * **See also:** [[addWidget]], [[moveWidget]]
   */
  insertWidget(index: number, widget: Widget): number {
    var tab = TabPanel.getTab(widget);
    if (!tab) throw new Error('`TabPanel.tab` property not set');
    var i = this._stack.insertChild(index, widget);
    return this._tabs.insertTab(i, tab);
  }

  /**
   * Move a widget from one index to another.
   *
   * @param fromIndex - The index of the widget of interest.
   *
   * @param toIndex - The target index for the widget.
   *
   * @returns 'true' if the widget was moved, or `false` if either
   *   of the given indices are out of range.
   *
   * #### Notes
   * This can be more efficient than re-inserting an existing widget.
   *
   * **See also:** [[addWidget]], [[insertWidget]]
   */
  moveWidget(fromIndex: number, toIndex: number): boolean {
    return this._tabs.moveTab(fromIndex, toIndex);
  }

  /**
   * Remove the widget at a specific index.
   *
   * @param index - The index of the widget of interest.
   *
   * @returns The removed widget, or `undefined` if the index
   *   is out of range.
   *
   * **See also:** [[removeWidget]], [[clearWidgets]]
   */
  removeWidgetAt(index: number): Widget {
    return this._stack.removeChildAt(index);
  }

  /**
   * Remove a specific widget from the panel.
   *
   * @param child - The widget of interest.
   *
   * @returns The index which the widget occupied, or `-1` if the
   *   widget is not contained in the tab panel.
   *
   * **See also:** [[removeWidgetAt]], [[clearWidgets]]
   */
  removeWidget(widget: Widget): number {
    return this._stack.removeChild(widget);
  }

  /**
   * Remove all widgets from the tab panel.
   *
   * **See also:** [[removeWidget]], [[removeWidgetAt]]
   */
  clearWidgets(): void {
    this._stack.clearChildren();
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _onTabMoved(sender: TabBar, args: ITabMoveArgs): void {
    this._stack.moveChild(args.fromIndex, args.toIndex);
  }

  /**
   * Handle the `tabSelected` signal from the tab bar.
   */
  private _onTabSelected(sender: TabBar, args: ITabIndexArgs): void {
    this._stack.currentWidget = this._stack.childAt(args.index);
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _onTabCloseRequested(sender: TabBar, args: ITabIndexArgs): void {
    this._stack.childAt(args.index).close();
  }

  /**
   * Handle the `currentChanged` signal from the stacked panel.
   */
  private _onCurrentChanged(sender: StackedPanel, args: IWidgetIndexArgs): void {
    this.currentChanged.emit(args);
  }

  /**
   * Handle the `widgetRemoved` signal from the stacked panel.
   */
  private _onWidgetRemoved(sender: StackedPanel, args: IWidgetIndexArgs): void {
    this._tabs.removeTabAt(args.index);
  }

  private _tabs: TabBar;
  private _stack: StackedPanel;
}
