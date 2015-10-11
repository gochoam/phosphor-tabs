/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import * as arrays
  from 'phosphor-arrays';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  hitTest, overrideCursor
} from 'phosphor-domutil';

import {
  Message
} from 'phosphor-messaging';

import {
  Property
} from 'phosphor-properties';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  Widget
} from 'phosphor-widget';

import {
  Tab
} from './tab';


/**
 * The start drag distance threshold.
 */
const DRAG_THRESHOLD = 5;

/**
 * The detach distance threshold.
 */
const DETACH_THRESHOLD = 20;

/**
 * The tab transition duration. Keep in sync with CSS.
 */
const TRANSITION_DURATION = 150;


/**
 * The arguments object for the [[tabDetachRequestedSignal]].
 */
export
interface ITabDetachArgs {
  /**
   * The tab of interest.
   */
  tab: Tab;

  /**
   * The index of the tab.
   */
  index: number;

  /**
   * The current mouse client X position.
   */
  clientX: number;

  /**
   * The current mouse client Y position.
   */
  clientY: number;
}


/**
 * The arguments object for various tab bar signals
 */
export
interface ITabIndexArgs {
  /**
   * The index associated with the tab.
   */
  index: number;

  /**
   * The tab associated with the signal.
   */
  tab: Tab;
}


/**
 * The arguments object for the [[tabMovedSignal]].
 */
export
interface ITabMoveArgs {
  /**
   * The previous index of the tab.
   */
  fromIndex: number;

  /**
   * The current index of the tab.
   */
  toIndex: number;
}


/**
 * A widget which displays a row of tabs.
 *
 * #### Notes
 * A `TabBar` widget does not support child widgets. Adding children
 * to a `TabBar` will result in undefined behavior.
 */
export
class TabBar extends Widget {
  /**
   * The class name added to TabBar instances.
   */
  static p_TabBar = 'p-TabBar';

  /**
   * The class name added to the tab bar header div.
   */
  static p_TabBar_header = 'p-TabBar-header';

  /**
   * The class name added to the tab bar content div.
   */
  static p_TabBar_content = 'p-TabBar-content';

  /**
   * The class name added to the tab bar footer div.
   */
  static p_TabBar_footer = 'p-TabBar-footer';

  /**
   * A class name added to the tab bar when dragging.
   */
  static p_mod_dragging = 'p-mod-dragging';

  /**
   * A class name added to the active drag tab.
   */
  static p_mod_active = 'p-mod-active';

  /**
   * A class name added to the first tab in the tab bar.
   */
  static p_mod_first = 'p-mod-first';

  /**
   * A class name adde to the last tab in the tab bar.
   */
  static p_mod_last = 'p-mod-last';

  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var header = document.createElement('div');
    var content = document.createElement('div');
    var footer = document.createElement('div');
    header.className = TabBar.p_TabBar_header;
    content.className = TabBar.p_TabBar_content;
    footer.className = TabBar.p_TabBar_footer;
    node.appendChild(header);
    node.appendChild(content);
    node.appendChild(footer);
    return node;
  }

  /**
   * A signal emitted when a tab is moved.
   *
   * **See also:** [[tabMoved]]
   */
  static tabMovedSignal = new Signal<TabBar, ITabMoveArgs>();

  /**
   * A signal emitted when a tab is selected.
   *
   * **See also:** [[tabSelected]]
   */
  static tabSelectedSignal = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when the user clicks a tab close icon.
   *
   * **See also:** [[tabCloseRequested]
   */
  static tabCloseRequestedSignal = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   *
   * **See also:** [[tabDetachRequested]]
   */
  static tabDetachRequestedSignal = new Signal<TabBar, ITabDetachArgs>();

  /**
   * The property descriptor for the selected tab.
   *
   * This controls which tab is selected in the tab bar.
   *
   * **See also:** [[selectedTab]]
   */
  static selectedTabProperty = new Property<TabBar, Tab>({
    value: null,
    coerce: (owner, val) => (val && owner.tabIndex(val) !== -1) ? val : null,
    changed: (owner, old, val) => owner._onSelectedTabChanged(old, val),
  });

  /**
   * The property descriptor for the tabs movable property
   *
   * THis controls whether tabs are movable by the user.
   *
   * **See also:** [[tabsMovable]]
   */
  static tabsMovableProperty = new Property<TabBar, boolean>({
    value: true,
  });

  /**
   * Construct a new tab bar.
   */
  constructor() {
    super();
    this.addClass(TabBar.p_TabBar);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this._previousTab = null;
    this._tabs.length = 0;
    super.dispose();
  }

  /**
   * A signal emitted when a tab is moved.
   *
   * #### Notes
   * This is a pure delegate to the [[tabMovedSignal]].
   */
  get tabMoved(): ISignal<TabBar, ITabMoveArgs> {
    return TabBar.tabMovedSignal.bind(this);
  }

  /**
   * A signal emitted when a tab is selected.
   *
   * #### Notes
   * This is a pure delegate to the [[tabSelectedSignal]].
   */
  get tabSelected(): ISignal<TabBar, ITabIndexArgs> {
    return TabBar.tabSelectedSignal.bind(this);
  }

  /**
   * A signal emitted when the user clicks a tab close icon.
   *
   * #### Notes
   * This is a pure delegate to the [[tabCloseRequestedSignal]].
   */
  get tabCloseRequested(): ISignal<TabBar, ITabIndexArgs> {
    return TabBar.tabCloseRequestedSignal.bind(this);
  }

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   *
   * #### Notes
   * This is a pure delegate to the [[tabDetachRequestedSignal]].
   */
  get tabDetachRequested(): ISignal<TabBar, ITabDetachArgs> {
    return TabBar.tabDetachRequestedSignal.bind(this);
  }

  /**
   * Get the previously selected tab.
   *
   * #### Notes
   * This is a read-only property.
   *
   * This will be `null` if there is no valid previous tab.
   */
  get previousTab(): Tab {
    return this._previousTab;
  }

  /**
   * Get the selected tab.
   *
   * #### Notes
   * This is a pure delegate to the [[selectedTabProperty]].
   */
  get selectedTab(): Tab {
    return TabBar.selectedTabProperty.get(this);
  }

  /**
   * Set the selected tab.
   *
   * #### Notes
   * This is a pure delegate to the [[selectedTabProperty]].
   */
  set selectedTab(value: Tab) {
    TabBar.selectedTabProperty.set(this, value);
  }

  /**
   * Get whether the tabs are movable by the user.
   *
   * #### Notes
   * This is a pure delegate to the [[tabsMovableProperty]].
   */
  get tabsMovable(): boolean {
    return TabBar.tabsMovableProperty.get(this);
  }

  /**
   * Set whether the tabs are movable by the user.
   *
   * #### Notes
   * This is a pure delegate to the [[tabsMovableProperty]].
   */
  set tabsMovable(value: boolean) {
    TabBar.tabsMovableProperty.set(this, value);
  }

  /**
   * Get a shallow copy of the array of tabs.
   *
   * #### Notes
   * When only iterating over the tabs, it can be faster to use
   * the tab query methods, which do not perform a copy.
   *
   * **See also:** [[tabCount]], [[tabAt]]
   */
  get tabs(): Tab[] {
    return this._tabs.slice();
  }

  /**
   * Set the tabs for the tab bar.
   *
   * #### Notes
   * This will clear the current tabs and add the specified tabs.
   * Depending on the desired outcome, it can be more efficient to
   * use one of the tab manipulation methods.
   *
   * **See also:** [[addTab]], [[insertTab]], [[removeTab]]
   */
  set tabs(tabs: Tab[]) {
    this.clearTabs();
    tabs.forEach(tab => this.addTab(tab));
  }

  /**
   * Get the number of tabs in the tab bar.
   *
   * #### Notes
   * This is a read-only property.
   *
   * **See also:** [[tabs]], [[tabAt]]
   */
  get tabCount(): number {
    return this._tabs.length;
  }

  /**
   * Get the tab at a specific index.
   *
   * @param index - The index of the tab of interest.
   *
   * @returns The tab at the specified index, or `undefined` if the
   *   index is out of range.
   *
   * **See also:** [[tabCount]], [[tabIndex]]
   */
  tabAt(index: number): Tab {
    return this._tabs[index | 0];
  }

  /**
   * Get the index of a specific tab.
   *
   * @param tab - The tab of interest.
   *
   * @returns The index of the specified tab, or `-1` if the tab is
   *   not contained within the tab bar.
   *
   * **See also:** [[tabCount]], [[tabAt]]
   */
  tabIndex(tab: Tab): number {
    return this._tabs.indexOf(tab);
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * @param tab - The tab to add to the tab bar.
   *
   * @returns The new index of the tab.
   *
   * #### Notes
   * If the tab is already contained within the tab bar, it will first
   * be removed.
   *
   * The tab *must not* be contained by any other tab bar.
   *
   * **See also:** [[insertTab]], [[moveTab]]
   */
  addTab(tab: Tab): number {
    return this.insertTab(this._tabs.length, tab);
  }

  /**
   * Insert a tab into the tab bar at the given index.
   *
   * @param index - The index at which to insert the tab. This will be
   *   clamped to the bounds of the tabs.
   *
   * @param tab - The tab to add to the tab bar.
   *
   * @returns The new index of the tab.
   *
   * #### Notes
   * If the tab is already contained within the tab bar, it will first
   * be removed.
   *
   * The tab *must not* be contained by any other tab bar.
   *
   * **See also:** [[addTab]], [[moveTab]]
   */
  insertTab(index: number, tab: Tab): number {
    this.removeTab(tab);
    return this._insertTab(index, tab);
  }

  /**
   * Move a tab from one index to another.
   *
   * @param fromIndex - The index of the tab to move.
   *
   * @param toIndex - The target index of the tab.
   *
   * @returns `true` if the move was successful, or `false` if either
   *   index is out of range.
   *
   * #### Notes
   * This can be more efficient than re-inserting an existing tab.
   *
   * **See also:** [[addTab]], [[insertTab]]
   */
  moveTab(fromIndex: number, toIndex: number): boolean {
    this._releaseMouse();
    return this._moveTab(fromIndex, toIndex);
  }

  /**
   * Remove the tab at a specific index.
   *
   * @param index - The index of the tab of interest.
   *
   * @returns The removed tab, or `undefined` if the index is out
   *   of range.
   *
   * **See also:** [[removeTab]], [[clearTabs]]
   */
  removeTabAt(index: number): Tab {
    this._releaseMouse();
    return this._removeTab(index);
  }

  /**
   * Remove a specific tab from the tab bar.
   *
   * @param tab - The tab of interest.
   *
   * @returns The index occupied by the tab, or `-1` if the tab is
   *   not contained by the tab bar.
   *
   * **See also:** [[removeTabAt]], [[clearTabs]]
   */
  removeTab(tab: Tab): number {
    this._releaseMouse();
    var i = this._tabs.indexOf(tab);
    if (i !== -1) this._removeTab(i);
    return i;
  }

  /**
   * Remove all tabs from the tab bar.
   *
   * **See also:** [[removeTab]], [[removeTabAt]]
   */
  clearTabs(): void {
    while (this._tabs.length > 0) {
      this.removeTabAt(this._tabs.length - 1);
    }
  }

  /**
   * Add a tab to the tab bar at the given client X position.
   *
   * @param tab - The tab to attach to the tab bar.
   *
   * @param clientX - The current client X mouse position.
   *
   * @returns `true` if the tab was attached, `false` otherwise.
   *
   * #### Notes
   * This method is intended for use by code which supports tear-off
   * tab interfaces. It will insert the tab at the specified location
   * and grab the mouse to continue the tab drag. It assumes that the
   * left mouse button is currently pressed.
   *
   * This is a no-op if the tab is already contained by the tab bar,
   * if the tabs are not movable, or if a tab drag is in progress.
   */
  attachTab(tab: Tab, clientX: number): boolean {
    // Bail if there is a drag in progress or the tabs aren't movable.
    if (this._dragData || !this.tabsMovable) {
      return false;
    }

    // Bail if the tab is already part of the tab bar.
    if (this._tabs.indexOf(tab) !== -1) {
      return false;
    }

    // Insert and select the new tab.
    var index = this._tabs.length;
    this._insertTab(index, tab);
    this.selectedTab = tab;

    // Setup the drag data object.
    var content = <HTMLElement>this.node.firstChild.nextSibling;
    var tabRect = tab.node.getBoundingClientRect();
    var data = this._dragData = new DragData();
    data.tab = tab;
    data.tabIndex = index;
    data.tabLeft = tab.node.offsetLeft;
    data.tabWidth = tabRect.width;
    data.pressX = tabRect.left + Math.floor(0.4 * tabRect.width);
    data.pressY = tabRect.top + (tabRect.height >> 1);
    data.tabPressX = Math.floor(0.4 * tabRect.width);
    data.tabLayout = snapTabLayout(this._tabs);
    data.contentRect = content.getBoundingClientRect();
    data.cursorGrab = overrideCursor('default');
    data.dragActive = true;

    // Add the extra mouse event listeners.
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);

    // Add the dragging style classes.
    tab.addClass(TabBar.p_mod_active);
    this.addClass(TabBar.p_mod_dragging);

    // Update the drag tab position.
    this._updateDragPosition(clientX);

    return true;
  }

  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(<MouseEvent>event);
      break;
    case 'mousedown':
      this._evtMouseDown(<MouseEvent>event);
      break;
    case 'mousemove':
      this._evtMouseMove(<MouseEvent>event);
      break;
    case 'mouseup':
      this._evtMouseUp(<MouseEvent>event);
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('mousedown', <any>this);
    this.node.addEventListener('click', <any>this);
  }

  /**
   * A message handler invoked on a `'before-dettach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', <any>this);
    this.node.removeEventListener('click', <any>this);
  }

  /**
   * Handle the `'click'` event for the tab bar.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left click.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if the click is not on a tab.
    var index = hitTestTabs(this._tabs, event.clientX, event.clientY);
    if (index < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // If the click was on a node contained by the close icon node
    // of a closable tab, emit the `tabCloseRequested` signal.
    var tab = this._tabs[index];
    var target = <HTMLElement>event.target;
    if (tab.closable && tab.closeIconNode.contains(target)) {
      this.tabCloseRequested.emit({ index: index, tab: tab });
    }
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Bail if a previous drag is still transitioning.
    if (this._dragData) {
      return;
    }

    // Do nothing of the press is not on a tab.
    var index = hitTestTabs(this._tabs, event.clientX, event.clientY);
    if (index < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Do nothing further if the press was on the tab close icon.
    var tab = this._tabs[index];
    if (tab.closeIconNode.contains(<HTMLElement>event.target)) {
      return;
    }

    // Setup the drag if the tabs are movable.
    if (this.tabsMovable) {
      var tabRect = tab.node.getBoundingClientRect();
      var data = this._dragData = new DragData();
      data.tab = tab;
      data.tabIndex = index;
      data.tabLeft = tab.node.offsetLeft;
      data.tabWidth = tabRect.width;
      data.pressX = event.clientX;
      data.pressY = event.clientY;
      data.tabPressX = event.clientX - tabRect.left;
      document.addEventListener('mouseup', <any>this, true);
      document.addEventListener('mousemove', <any>this, true);
    }

    // Update the selected tab to the pressed tab.
    this.selectedTab = tab;
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Mouse move events are never propagated since this handler
    // is only installed when during a left mouse drag operation.
    event.preventDefault();
    event.stopPropagation();

    // Bail if there is no drag in progress.
    if (!this._dragData) {
      return;
    }

    // Check to see if the drag threshold has been exceeded, and
    // start the tab drag operation the first time that occurrs.
    var data = this._dragData;
    if (!data.dragActive) {
      var dx = Math.abs(event.clientX - data.pressX);
      var dy = Math.abs(event.clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      // Fill in the remaining drag data.
      var content = <HTMLElement>this.node.firstChild.nextSibling;
      data.tabLayout = snapTabLayout(this._tabs);
      data.contentRect = content.getBoundingClientRect();
      data.cursorGrab = overrideCursor('default');
      data.dragActive = true;

      // Add the dragging style classes.
      data.tab.addClass(TabBar.p_mod_active);
      this.addClass(TabBar.p_mod_dragging);
    }

    // Check to see if the detach threshold has been exceeded, and
    // emit the detach request signal the first time that occurrs.
    // If the drag data gets set to null, the mouse was released.
    if (!data.detachRequested && shouldDetach(data.contentRect, event)) {
      data.detachRequested = true;
      this.tabDetachRequested.emit({
        tab: data.tab,
        index: data.tabIndex,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      if (!this._dragData) {
        return;
      }
    }

    // Update the drag tab position.
    this._updateDragPosition(event.clientX);
  }

  /**
   * Handle the `'mouseup'` event for the tab bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Mouse move events are never propagated since this handler
    // is only installed when during a left mouse drag operation.
    event.preventDefault();
    event.stopPropagation();

    // Bail if there is no drag in progress.
    if (!this._dragData) {
      return;
    }

    // Remove the extra mouse handlers.
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);

    // Store a local reference to the drag data.
    var data = this._dragData;

    // If the drag is not active, clear the reference and bail.
    if (!data.dragActive) {
      this._dragData = null;
      return;
    }

    // Compute the approximate final relative tab offset.
    var idealLeft: number;
    if (data.tabTargetIndex === data.tabIndex) {
      idealLeft = 0;
    } else if (data.tabTargetIndex > data.tabIndex) {
      var tl = data.tabLayout[data.tabTargetIndex];
      idealLeft = tl.left + tl.width - data.tabWidth - data.tabLeft;
    } else {
      var tl = data.tabLayout[data.tabTargetIndex];
      idealLeft = tl.left - data.tabLeft;
    }

    // Position the tab to its final position, subject to limits.
    var maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    var adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.node.style.left = adjustedLeft + 'px';

    // Remove the active class from the tab so it can be transitioned.
    data.tab.removeClass(TabBar.p_mod_active);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Bail if the drag data has been changed or released.
      if (this._dragData !== data) {
        return;
      }

      // Clear the drag data reference.
      this._dragData = null;

      // Clear the relative tab positions.
      for (var i = 0, n = this._tabs.length; i < n; ++i) {
        this._tabs[i].node.style.left = '';
      }

      // Clear the cursor grab and drag styles.
      data.cursorGrab.dispose();
      data.tab.removeClass(TabBar.p_mod_active);
      this.removeClass(TabBar.p_mod_dragging);

      // Finally, move the drag tab to its final index location.
      if (data.tabTargetIndex !== -1) {
        this._moveTab(data.tabIndex, data.tabTargetIndex);
      }
    }, TRANSITION_DURATION);
  }

  /**
   * Update the drag tab position for the given mouse X position.
   *
   * This method is a no-op if an active drag is not in progress.
   */
  private _updateDragPosition(clientX: number): void {
    // Bail if there is not an active drag.
    var data = this._dragData;
    if (!data || !data.dragActive) {
      return;
    }

    // Compute the target bounds of the drag tab.
    var offsetLeft = clientX - data.contentRect.left;
    var targetLeft = offsetLeft - data.tabPressX;
    var targetRight = targetLeft + data.tabWidth;

    // Reset the target tab index.
    data.tabTargetIndex = data.tabIndex;

    // Update the non-drag tab positions and the tab target index.
    for (var i = 0, n = this._tabs.length; i < n; ++i) {
      var style = this._tabs[i].node.style;
      var layout = data.tabLayout[i];
      var threshold = layout.left + (layout.width >> 1);
      if (i < data.tabIndex && targetLeft < threshold) {
        style.left = data.tabWidth + data.tabLayout[i + 1].margin + 'px';
        data.tabTargetIndex = Math.min(data.tabTargetIndex, i);
      } else if (i > data.tabIndex && targetRight > threshold) {
        style.left = -data.tabWidth - layout.margin + 'px';
        data.tabTargetIndex = i;
      } else if (i !== data.tabIndex) {
        style.left = '';
      }
    }

    // Update the drag tab position
    var idealLeft = clientX - data.pressX;
    var maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    var adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.node.style.left = adjustedLeft + 'px';
  }

  /**
   * Release the mouse grab and restore the tab positions.
   */
  private _releaseMouse(): void {
    // Bail early if there is no drag in progress.
    if (!this._dragData) {
      return;
    }

    // Remove the extra mouse listeners.
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);

    // Clear the drag data reference.
    var data = this._dragData;
    this._dragData = null;

    // If the drag is not active, there's nothing left to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the positions of the tabs.
    for (var i = 0, n = this._tabs.length; i < n; ++i) {
      this._tabs[i].node.style.left = '';
    }

    // Clear the cursor grab and drag styles.
    data.cursorGrab.dispose();
    data.tab.removeClass(TabBar.p_mod_active);
    this.removeClass(TabBar.p_mod_dragging);
  }

  /**
   * Insert a new tab into the tab bar at the given index.
   *
   * The tab should not already be contained in the tab bar.
   *
   * The mouse should be released before calling this method.
   */
  private _insertTab(index: number, tab: Tab): number {
    tab.selected = false;
    var i = arrays.insert(this._tabs, index, tab);
    var content = <HTMLElement>this.node.firstChild.nextSibling;
    content.appendChild(tab.node);
    if (!this.selectedTab) {
      this.selectedTab = tab;
    } else {
      this._updateTabOrdering();
    }
    return i;
  }

  /**
   * Move a tab to a new index in the tab bar.
   *
   * The mouse should be released before calling this method.
   */
  private _moveTab(fromIndex: number, toIndex: number): boolean {
    var i = fromIndex | 0;
    var j = toIndex | 0;
    if (!arrays.move(this._tabs, i, j)) {
      return false;
    }
    if (i === j) {
      return true;
    }
    this._updateTabOrdering();
    this.tabMoved.emit({ fromIndex: i, toIndex: j });
    return true;
  }

  /**
   * Remove and return the tab at the given index.
   *
   * The mouse should be released before calling this method.
   */
  private _removeTab(index: number): Tab {
    // Bail if the index is invalid.
    var i = index | 0;
    var tab = arrays.removeAt(this._tabs, i);
    if (!tab) {
      return void 0;
    }

    // Remove the tab from the DOM and reset its style.
    var content = <HTMLElement>this.node.firstChild.nextSibling;
    content.removeChild(tab.node);
    tab.selected = false;
    tab.node.style.left = '';
    tab.node.style.zIndex = '';
    tab.removeClass(TabBar.p_mod_active);
    tab.removeClass(TabBar.p_mod_first);
    tab.removeClass(TabBar.p_mod_last);

    // Update the selected tab. If the removed tab was the selected tab,
    // select the next best tab by starting with the previous tab, then
    // the next sibling, and finally the previous sibling. Otherwise,
    // update the state and tab ordering as appropriate.
    if (tab === this.selectedTab) {
      var next = this._previousTab || this._tabs[i] || this._tabs[i - 1];
      this.selectedTab = next;
      this._previousTab = null;
    } else if (tab === this._previousTab) {
      this._previousTab =  null;
      this._updateTabOrdering();
    } else {
      this._updateTabOrdering();
    }

    return tab;
  }

  /**
   * Update the Z-index and flex order of the tabs.
   */
  private _updateTabOrdering(): void {
    if (this._tabs.length === 0) {
      return;
    }
    var selectedTab = this.selectedTab;
    for (var i = 0, n = this._tabs.length, k = n - 1; i < n; ++i) {
      var tab = this._tabs[i];
      var style = tab.node.style;
      tab.removeClass(TabBar.p_mod_first);
      tab.removeClass(TabBar.p_mod_last);
      style.order = i + '';
      if (tab === selectedTab) {
        style.zIndex = n + '';
      } else {
        style.zIndex = k-- + '';
      }
    }
    this._tabs[0].addClass(TabBar.p_mod_first);
    this._tabs[n - 1].addClass(TabBar.p_mod_last);
  }

  /**
   * The change handler for the [[selectedTabProperty]].
   */
  private _onSelectedTabChanged(old: Tab, tab: Tab): void {
    if (old) old.selected = false;
    if (tab) tab.selected = true;
    this._previousTab = old;
    this._updateTabOrdering();
    this.tabSelected.emit({ index: this.tabIndex(tab), tab: tab });
  }

  private _tabs: Tab[] = [];
  private _previousTab: Tab = null;
  private _dragData: DragData = null;
}


/**
 * A struct which holds the drag data for a tab bar.
 */
class DragData {
  /**
   * The tab being dragged.
   */
  tab: Tab = null;

  /**
   * The offset left of the tab being dragged.
   */
  tabLeft = -1;

  /**
   * The offset width of the tab being dragged.
   */
  tabWidth = -1;

  /**
   * The index of the tab being dragged.
   */
  tabIndex = -1;

  /**
   * The orgian mouse X position in tab coordinates.
   */
  tabPressX = -1;

  /**
   * The tab target index upon mouse release.
   */
  tabTargetIndex = -1;

  /**
   * The array of tab layout objects snapped at drag start.
   */
  tabLayout: ITabLayout[] = null;

  /**
   * The mouse press client X position.
   */
  pressX = -1;

  /**
   * The mouse press client Y position.
   */
  pressY = -1;

  /**
   * The bounding client rect of the tab bar content node.
   */
  contentRect: ClientRect = null;

  /**
   * The disposable to clean up the cursor override.
   */
  cursorGrab: IDisposable = null;

  /**
   * Whether the drag is currently active.
   */
  dragActive = false;

  /**
   * Whether the detach request signal has been emitted.
   */
  detachRequested = false;
}


/**
 * An object which holds layout data for a tab.
 */
interface ITabLayout {
  /**
   * The left margin value for the tab.
   */
  margin: number;

  /**
   * The offset left position of the tab.
   */
  left: number;

  /**
   * The offset width of the tab.
   */
  width: number;
}


/**
 * Test if a mouse position lies outside the detach bound of a rect.
 */
function shouldDetach(rect: ClientRect, event: MouseEvent): boolean {
  return (
    (event.clientX < rect.left - DETACH_THRESHOLD) ||
    (event.clientX >= rect.right + DETACH_THRESHOLD) ||
    (event.clientY < rect.top - DETACH_THRESHOLD) ||
    (event.clientY >= rect.bottom + DETACH_THRESHOLD)
  );
}


/**
 * Get the index of the tab which intersect the client point, or -1.
 */
function hitTestTabs(tabs: Tab[], clientX: number, clientY: number): number {
  for (var i = 0, n = tabs.length; i < n; ++i) {
    if (hitTest(tabs[i].node, clientX, clientY)) {
      return i;
    }
  }
  return -1;
}


/**
 * Snap an array of the current tab layout values.
 */
function snapTabLayout(tabs: Tab[]): ITabLayout[] {
  var layout = new Array<ITabLayout>(tabs.length);
  for (var i = 0, n = tabs.length; i < n; ++i) {
    var node = tabs[i].node;
    var left = node.offsetLeft;
    var width = node.offsetWidth;
    var cstyle = window.getComputedStyle(tabs[i].node);
    var margin = parseInt(cstyle.marginLeft, 10) || 0;
    layout[i] = { margin: margin, left: left, width: width };
  }
  return layout;
}
