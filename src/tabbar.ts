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
  NodeWrapper
} from 'phosphor-nodewrapper';

import {
  IListChangedArgs, IObservableList, ListChangeType, ObservableList
} from 'phosphor-observablelist';

import {
  IPropertyChangedArgs, Property
} from 'phosphor-properties';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  Title, Widget
} from 'phosphor-widget';


/**
 * The class name added to TabBar instances.
 */
const TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to the tab bar header node.
 */
const HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to the tab bar body node.
 */
const BODY_CLASS = 'p-TabBar-body';

/**
 * The class name added to the tab bar content node.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to the tab bar footer node.
 */
const FOOTER_CLASS = 'p-TabBar-footer';

/**
 * The class name added to Tab instances.
 */
const TAB_CLASS = 'p-Tab';

/**
 * The class name added to a tab text node.
 */
const TEXT_CLASS = 'p-Tab-text';

/**
 * The class name added to a tab icon node.
 */
const ICON_CLASS = 'p-Tab-icon';

/**
 * The class name added to a tab close node.
 */
const CLOSE_CLASS = 'p-Tab-close';

/**
 * A class name added to the tab bar when dragging.
 */
const DRAGGING_CLASS = 'p-mod-dragging';

/**
 * The class name added to the current tab.
 */
const CURRENT_CLASS = 'p-mod-current';

/**
 * The class name added to a closable tab.
 */
const CLOSABLE_CLASS = 'p-mod-closable';

/**
 * A class name added to the active drag tab.
 */
const ACTIVE_CLASS = 'p-mod-active';

/**
 * A class name added to the first tab in the tab bar.
 */
const FIRST_CLASS = 'p-mod-first';

/**
 * A class name added to the last tab in the tab bar.
 */
const LAST_CLASS = 'p-mod-last';

/**
 * The start drag distance threshold.
 */
const DRAG_THRESHOLD = 5;

/**
 * The tear off distance threshold.
 */
const TEAR_THRESHOLD = 20;

/**
 * The tab transition duration. Keep in sync with CSS.
 */
const TRANSITION_DURATION = 150;


/**
 * An object which can be added to a tab bar.
 */
export
interface ITabItem {
  /**
   * The title object which provides data for the tab.
   *
   * This should be a read-only constant property.
   */
  title: Title;
}


/**
 * A widget which displays a list of tab items as a row of tabs.
 *
 * #### Notes
 * A TabBar does **not** support child widget.
 */
export
class TabBar extends Widget {
  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let header = document.createElement('div');
    let body = document.createElement('div');
    let content = document.createElement('ul');
    let footer = document.createElement('div');
    header.className = HEADER_CLASS;
    body.className = BODY_CLASS;
    content.className = CONTENT_CLASS;
    footer.className = FOOTER_CLASS;
    body.appendChild(content);
    node.appendChild(header);
    node.appendChild(body);
    node.appendChild(footer);
    return node;
  }

  /**
   * A signal emitted when a closable items's close icon is clicked.
   *
   * **See also:** [[itemCloseRequested]]
   */
  static itemCloseRequestedSignal = new Signal<TabBar, ITabItem>();

  /**
   * The property descriptor for the currently selected item.
   *
   * **See also:** [[currentItem]]
   */
  static currentItemProperty = new Property<TabBar, ITabItem>({
    value: null,
    coerce: (owner, value) => owner._coerceCurrentItem(value),
    changed: (owner, old, value) => owner._onCurrentItemChanged(old, value),
  });

  /**
   * The property descriptor for the tab bar items list.
   *
   * **See also:** [[items]]
   */
  static itemsProperty = new Property<TabBar, IObservableList<ITabItem>>({
    create: owner => owner._createItemsList(),
    coerce: (owner, value) => value || null,
    changed: (owner, old, value) => owner._onItemsChanged(old, value),
  });

  /**
   * The property descriptor for whether the tabs are user-movable.
   *
   * **See also:** [[tabsMovable]]
   */
  static tabsMovableProperty = new Property<TabBar, boolean>({
    value: true,
    changed: owner => owner._releaseMouse(),
  });

  /**
   * Construct a new tab bar.
   */
  constructor() {
    super();
    this.addClass(TAB_BAR_CLASS);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this.items = null;
    super.dispose();
  }

  /**
   * A signal emitted when a closable items's close icon is clicked.
   *
   * #### Notes
   * This is a pure delegate to the [[itemCloseRequestedSignal]].
   */
  get itemCloseRequested(): ISignal<TabBar, ITabItem> {
    return TabBar.itemCloseRequestedSignal.bind(this);
  }

  /**
   * Get the currently selected item.
   *
   * #### Notes
   * This is a pure delegate to the [[currentItemProperty]].
   */
  get currentItem(): ITabItem {
    return TabBar.currentItemProperty.get(this);
  }

  /**
   * Set the currently selected item.
   *
   * #### Notes
   * This is a pure delegate to the [[currentItemProperty]].
   */
  set currentItem(value: ITabItem) {
    TabBar.currentItemProperty.set(this, value);
  }

  /**
   * A signal emitted when the current items changes.
   *
   * #### Notes
   * This is the changed signal for the [[currentItemProperty]].
   */
  get currentTabChanged(): ISignal<TabBar, IPropertyChangedArgs<TabBar, ITabItem>> {
    return TabBar.currentItemProperty.getChanged(this);
  }

  /**
   * Get the tab items list for the tab bar.
   *
   * #### Notes
   * This is a pure delegate to the [[itemsProperty]].
   */
  get items(): IObservableList<ITabItem> {
    return TabBar.itemsProperty.get(this);
  }

  /**
   * Set the tab items list for the tab bar.
   *
   * #### Notes
   * This is a pure delegate to the [[itemsProperty]].
   */
  set items(value: IObservableList<ITabItem>) {
    TabBar.itemsProperty.set(this, value);
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
      this._evtClick(event as MouseEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    }
  }

  /**
   * Get the tab bar header node.
   *
   * #### Notes
   * This can be used by subclasses to add extra header content.
   */
  protected get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar body node.
   *
   * #### Notes
   * This can be used by subclasses to add extra body content.
   */
  protected get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * This can be used by subclasses to access the content node.
   *
   * This is the node which holds the tab nodes. Modifying the content
   * of this node directly can lead to undefined behavior.
   */
  protected get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This can be used by subclasses to add extra footer content.
   */
  protected get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

  /**
   * A method invoked when the tear off threshold is exceeded.
   *
   * @param item - The tab item which should be torn off.
   *
   * @param event - The current mouse event for the drag.
   *
   * #### Notes
   * This should be reimplemented by subclasses which support tear off
   * tabs. It will be called once the first time the tear off threshold
   * is exceeded during a drag operation. The subclass need only remove
   * the tab item from the tab bar to terminate the drag operation.
   *
   * The default implementation of this method is a no-op.
   */
  protected tearOffItem(item: ITabItem, event: MouseEvent): void { }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('click', this);
  }

  /**
   * A message handler invoked on a `'before-dettach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', this);
    this.node.removeEventListener('click', this);
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
    let index = hitTestTabs(this._tabs, event.clientX, event.clientY);
    if (index < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Do nothing if the click was not on a close icon node.
    let tab = this._tabs[index];
    if (!tab.closeNode.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the `itemCloseRequested` signal if the item is closable.
    if (tab.item.title.closable) this.itemCloseRequested.emit(tab.item);
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

    // Do nothing if the press is not on a tab.
    let index = hitTestTabs(this._tabs, event.clientX, event.clientY);
    if (index < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Do nothing if the press was on a close icon node.
    let tab = this._tabs[index];
    if (tab.closeNode.contains(event.target as HTMLElement)) {
      return;
    }

    // Setup the drag if the tabs are movable.
    if (this.tabsMovable) {
      let data = this._dragData = new DragData();
      let rect = tab.node.getBoundingClientRect();
      data.tab = tab;
      data.tabIndex = index;
      data.tabLeft = tab.node.offsetLeft;
      data.tabWidth = tab.node.offsetWidth;
      data.tabPressX = event.clientX - rect.left;
      data.pressX = event.clientX;
      data.pressY = event.clientY;
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

    // Update the current item to the pressed item.
    this.currentItem = tab.item;
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
    let data = this._dragData;
    if (!data.dragActive) {
      let dx = Math.abs(event.clientX - data.pressX);
      let dy = Math.abs(event.clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      // Fill in the remaining drag data.
      data.contentRect = this.contentNode.getBoundingClientRect();
      data.tabLayout = snapTabLayout(this._tabs);
      data.cursorGrab = overrideCursor('default');
      data.dragActive = true;

      // Add the dragging style classes.
      data.tab.addClass(ACTIVE_CLASS);
      this.addClass(DRAGGING_CLASS);
    }

    // Check to see if the tear off threshold has been exceeded, and
    // invoke the tear off method the first time that occurrs. If the
    // drag data is set to null, it indicates the mouse was released.
    if (!data.tearOffAttempted && tearExceeded(data.contentRect, event)) {
      data.tearOffAttempted = true;
      this.tearOffItem(data.tab.item, event);
      if (!this._dragData) {
        return;
      }
    }

    // Compute the target bounds of the drag tab.
    let offsetLeft = event.clientX - data.contentRect.left;
    let targetLeft = offsetLeft - data.tabPressX;
    let targetRight = targetLeft + data.tabWidth;

    // Reset the target tab index.
    data.tabTargetIndex = data.tabIndex;

    // Update the non-drag tab positions and the tab target index.
    for (let i = 0, n = this._tabs.length; i < n; ++i) {
      let style = this._tabs[i].node.style;
      let layout = data.tabLayout[i];
      let threshold = layout.left + (layout.width >> 1);
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
    let idealLeft = event.clientX - data.pressX;
    let maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    let adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.node.style.left = adjustedLeft + 'px';
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
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);

    // If the drag is not active, clear the reference and bail.
    let data = this._dragData;
    if (!data.dragActive) {
      this._dragData = null;
      return;
    }

    // Compute the approximate final relative tab offset.
    let idealLeft: number;
    if (data.tabTargetIndex === data.tabIndex) {
      idealLeft = 0;
    } else if (data.tabTargetIndex > data.tabIndex) {
      let tl = data.tabLayout[data.tabTargetIndex];
      idealLeft = tl.left + tl.width - data.tabWidth - data.tabLeft;
    } else {
      let tl = data.tabLayout[data.tabTargetIndex];
      idealLeft = tl.left - data.tabLeft;
    }

    // Position the tab to its final position, subject to limits.
    let maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    let adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.node.style.left = adjustedLeft + 'px';

    // Remove the active class from the tab so it can be transitioned.
    data.tab.removeClass(ACTIVE_CLASS);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Bail if the drag data has been changed or released.
      if (this._dragData !== data) {
        return;
      }

      // Clear the drag data reference.
      this._dragData = null;

      // Clear the relative tab positions.
      for (let i = 0, n = this._tabs.length; i < n; ++i) {
        this._tabs[i].node.style.left = '';
      }

      // Clear the cursor grab and drag styles.
      data.cursorGrab.dispose();
      data.tab.removeClass(ACTIVE_CLASS);
      this.removeClass(DRAGGING_CLASS);

      // Finally, move the tab title the new location.
      let fromIndex = data.tabIndex;
      let toIndex = data.tabTargetIndex;
      if (toIndex !== -1 && fromIndex !== toIndex) {
        this.items.move(fromIndex, toIndex);
      }
    }, TRANSITION_DURATION);
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
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);

    // Clear the drag data reference.
    let data = this._dragData;
    this._dragData = null;

    // If the drag is not active, there's nothing left to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the positions of the tabs.
    for (let i = 0, n = this._tabs.length; i < n; ++i) {
      this._tabs[i].node.style.left = '';
    }

    // Clear the cursor grab and drag styles.
    data.cursorGrab.dispose();
    data.tab.removeClass(ACTIVE_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * Update the flex order and Z-index of the tabs.
   */
  private _updateTabOrdering(): void {
    let n = this._tabs.length;
    if (n === 0) {
      return;
    }
    for (let i = 0, k = n - 1; i < n; ++i) {
      let tab = this._tabs[i];
      let style = tab.node.style;
      tab.removeClass(FIRST_CLASS);
      tab.removeClass(LAST_CLASS);
      if (tab.hasClass(CURRENT_CLASS)) {
        style.zIndex = n + '';
      } else {
        style.zIndex = k-- + '';
      }
      style.order = i + '';
    }
    this._tabs[0].addClass(FIRST_CLASS);
    this._tabs[n - 1].addClass(LAST_CLASS);
  }

  /**
   * Create and connect a new observable items list.
   */
  private _createItemsList(): IObservableList<ITabItem> {
    let list = new ObservableList<ITabItem>();
    list.changed.connect(this._onItemsListChanged, this);
    return list;
  }

  /**
   * Find the tab associated with the given tab item.
   */
  private _findTab(item: ITabItem): Tab {
    return arrays.find(this._tabs, tab => tab.item === item) || null;
  }

  /**
   * The coerce handler for the [[currentItemProperty]].
   */
  private _coerceCurrentItem(item: ITabItem): ITabItem {
    if (!item) return null;
    let items = this.items;
    if (!items) return null;
    return items.indexOf(item) !== -1 ? item : null;
  }

  /**
   * The change handler for the [[currentItemProperty]].
   */
  private _onCurrentItemChanged(oldItem: ITabItem, newItem: ITabItem): void {
    let oldTab = oldItem ? this._findTab(oldItem) : null;
    let newTab = newItem ? this._findTab(newItem) : null;
    if (oldTab) oldTab.removeClass(CURRENT_CLASS);
    if (newTab) newTab.addClass(CURRENT_CLASS);
    this._previousItem = oldItem;
    this._updateTabOrdering();
  }

  /**
   * The change handler for the [[itemsProperty]].
   */
  private _onItemsChanged(oldList: IObservableList<ITabItem>, newList: IObservableList<ITabItem>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Disconnect the change listener for the old list.
    // Remove and dispose of the old tabs.
    if (oldList) {
      oldList.changed.disconnect(this._onItemsListChanged, this);
      let content = this.contentNode;
      while (this._tabs.length) {
        let tab = this._tabs.pop();
        content.removeChild(tab.node);
        tab.dispose();
      }
    }

    // Create and add the new tabs.
    // Connect the change listener for the new list.
    if (newList) {
      let content = this.contentNode;
      for (let i = 0, n = newList.length; i < n; ++i) {
        let tab = new Tab(newList.get(i));
        content.appendChild(tab.node);
        this._tabs.push(tab);
      }
      newList.changed.connect(this._onItemsListChanged, this);
    }

    // Update the current item, previous item, and tab ordering.
    this.currentItem = (newList && newList.get(0)) || null;
    this._previousItem = null;
    this._updateTabOrdering();
  }

  /**
   * The change handler for the items list `changed` signal.
   */
  private _onItemsListChanged(sender: IObservableList<ITabItem>, args: IListChangedArgs<ITabItem>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Delegate the change to a specific handler.
    switch (args.type) {
    case ListChangeType.Add:
      this._onItemsListAdd(args);
      break;
    case ListChangeType.Move:
      this._onItemsListMove(args);
      break;
    case ListChangeType.Remove:
      this._onItemsListRemove(args);
      break;
    case ListChangeType.Replace:
      this._onItemsListReplace(args);
      break;
    case ListChangeType.Set:
      this._onItemsListSet(args);
      break;
    }

    // Update the tab ordering.
    this._updateTabOrdering();
  }

  /**
   * The handler invoked on a items list change of type `Add`.
   */
  private _onItemsListAdd(args: IListChangedArgs<ITabItem>): void {
    // Create the tab for the new tab item.
    let tab = new Tab(args.newValue as ITabItem);

    // Add the tab to the same location in the internal array.
    arrays.insert(this._tabs, args.newIndex, tab);

    // Add the tab node to the DOM. The position is irrelevant.
    this.contentNode.appendChild(tab.node);

    // Select the tab if no tab is currently selected.
    if (!this.currentItem) this.currentItem = tab.item;
  }

  /**
   * The handler invoked on a items list change of type `Move`.
   */
  private _onItemsListMove(args: IListChangedArgs<ITabItem>): void {
    // Simply move the tab in the array. DOM position is irrelevant.
    arrays.move(this._tabs, args.oldIndex, args.newIndex);
  }

  /**
   * The handler invoked on a items list change of type `Remove`.
   */
  private _onItemsListRemove(args: IListChangedArgs<ITabItem>): void {
    // Remove the tab from the internal array.
    let tab = arrays.removeAt(this._tabs, args.oldIndex);

    // Remove the tab node from the DOM.
    this.contentNode.removeChild(tab.node);

    // Patch up the current and previous items if needed.
    if (this.currentItem === tab.item) {
      let next: ITabItem;
      let items = this.items;
      if (items.length === 0) {
        next = null;
      } else if (this._previousItem) {
        next = this._previousItem;
      } else if (args.oldIndex < items.length) {
        next = items.get(args.oldIndex);
      } else {
        next = items.get(items.length - 1);
      }
      this.currentItem = next;
      this._previousItem = null;
    } else if (this._previousItem === tab.item) {
      this._previousItem = null;
    }

    // Dispose of the tab.
    tab.dispose();
  }

  /**
   * The handler invoked on a items list change of type `Replace`.
   */
  private _onItemsListReplace(args: IListChangedArgs<ITabItem>): void {
    // Create the new tabs for the new tab items.
    let newItems = args.newValue as ITabItem[];
    let newTabs = newItems.map(item => new Tab(item));

    // Replace the tabs in the internal array.
    let oldItems = args.oldValue as ITabItem[];
    let oldTabs = this._tabs.splice(args.newIndex, oldItems.length, ...newTabs);

    // Remove the old tabs from the DOM.
    let content = this.contentNode;
    oldTabs.forEach(tab => { content.removeChild(tab.node); });

    // Add the new tabs to the DOM. Their position is irrelevant.
    newTabs.forEach(tab => { content.appendChild(tab.node); });

    // TODO patch up current/previous

    // Dispose of the old tabs.
    oldTabs.forEach(tab => { tab.dispose(); });
  }

  /**
   * The handler invoked on a items list change of type `Set`.
   */
  private _onItemsListSet(args: IListChangedArgs<ITabItem>): void {
    // If the item was not actually changed, there is nothing to do.
    if (args.oldValue === args.newValue) {
      return;
    }

    // Create the tab for the new tab item.
    let newTab = new Tab(args.newValue as ITabItem);

    // Swap the new tab in the internal array.
    let oldTab = this._tabs[args.newIndex];
    this._tabs[args.newIndex] = newTab;

    // Swap the new tab node in the DOM.
    this.contentNode.replaceChild(newTab.node, oldTab.node);

    // Patch up the current and previous items if needed.
    if (this.currentItem = oldTab.item) {
      let temp = this._previousItem;
      this.currentItem = newTab.item;
      this._previousItem = temp;
    } else if (this._previousItem === oldTab.item) {
      this._previousItem = newTab.item;
    }

    // Dispose of the old tab.
    oldTab.dispose();
  }

  private _tabs: Tab[] = [];
  private _dragData: DragData = null;
  private _previousItem: ITabItem = null;
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
 * A struct which holds the drag data for a tab bar.
 */
class DragData {
  /**
   * The tab node being dragged.
   */
  tab: Tab = null;

  /**
   * The index of the tab being dragged.
   */
  tabIndex = -1;

  /**
   * The offset left of the tab being dragged.
   */
  tabLeft = -1;

  /**
   * The offset width of the tab being dragged.
   */
  tabWidth = -1;

  /**
   * The orginal mouse X position in tab coordinates.
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
   * Whether a tear off attempt has been made.
   */
  tearOffAttempted = false;
}


/**
 * An object which manages a node for a tab bar.
 */
class Tab extends NodeWrapper implements IDisposable {
  /**
   * Create the DOM node for a tab.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('li');
    let icon = document.createElement('span');
    let text = document.createElement('span');
    let close = document.createElement('span');
    icon.className = ICON_CLASS;
    text.className = TEXT_CLASS;
    close.className = CLOSE_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(close);
    return node;
  }

  /**
   * Construct a new tab.
   *
   * @param item - The tab item to associate with the tab.
   */
  constructor(item: ITabItem) {
    super();
    this.addClass(TAB_CLASS);
    this._item = item;

    let title = item.title;
    this.textNode.textContent = title.text;
    this.toggleClass(CLOSABLE_CLASS, title.closable);
    if (title.icon) exAddClass(this.iconNode, title.icon);
    if (title.className) exAddClass(this.node, title.className);

    Property.getChanged(title).connect(this._onTitleChanged, this);
  }

  /**
   * Dispose of the resources held by the tab.
   */
  dispose(): void {
    clearSignalData(this);
    this._item = null;
  }

  /**
   * Test whether the tab is disposed.
   */
  get isDisposed(): boolean {
    return this._item === null;
  }

  /**
   * Get the icon node for the tab.
   *
   * #### Notes
   * This is a read-only property.
   */
  get iconNode(): HTMLElement {
    return this.node.childNodes[0] as HTMLElement;
  }

  /**
   * Get the text node for the tab.
   *
   * #### Notes
   * This is a read-only property.
   */
  get textNode(): HTMLElement {
    return this.node.childNodes[1] as HTMLElement;
  }

  /**
   * Get the close node for the tab.
   *
   * #### Notes
   * This is a read-only property.
   */
  get closeNode(): HTMLElement {
    return this.node.childNodes[2] as HTMLElement;
  }

  /**
   * Get the tab item associated with the tab.
   *
   * #### Notes
   * This is a read-only property.
   */
  get item(): ITabItem {
    return this._item;
  }

  /**
   * Handle the property changed signal for the item title.
   */
  private _onTitleChanged(sender: Title, args: IPropertyChangedArgs<Title, any>): void {
    switch (args.property) {
    case Title.textProperty:
      this.textNode.textContent = args.newValue;
      break;
    case Title.iconProperty:
      if (args.oldValue) exRemClass(this.iconNode, args.oldValue);
      if (args.newValue) exAddClass(this.iconNode, args.newValue);
      break;
    case Title.closableProperty:
      this.toggleClass(CLOSABLE_CLASS, args.newValue);
      break;
    case Title.classNameProperty:
      if (args.oldValue) exRemClass(this.node, args.oldValue);
      if (args.newValue) exAddClass(this.node, args.newValue);
      break;
    }
  }

  private _item: ITabItem;
}


/**
 * Add a whitespace separated class name to the given node.
 */
function exAddClass(node: HTMLElement, name: string): void {
  let list = node.classList;
  let parts = name.split(/\s+/);
  for (let i = 0, n = parts.length; i < n; ++i) {
    if (parts[i]) list.add(parts[i]);
  }
}


/**
 * Remove a whitespace separated class name to the given node.
 */
function exRemClass(node: HTMLElement, name: string): void {
  let list = node.classList;
  let parts = name.split(/\s+/);
  for (let i = 0, n = parts.length; i < n; ++i) {
    if (parts[i]) list.remove(parts[i]);
  }
}


/**
 * Get a snapshot of the current tab layout values.
 */
function snapTabLayout(tabs: Tab[]): ITabLayout[] {
  let layout = new Array<ITabLayout>(tabs.length);
  for (let i = 0, n = tabs.length; i < n; ++i) {
    let node = tabs[i].node;
    let left = node.offsetLeft;
    let width = node.offsetWidth;
    let cstyle = window.getComputedStyle(node);
    let margin = parseInt(cstyle.marginLeft, 10) || 0;
    layout[i] = { margin: margin, left: left, width: width };
  }
  return layout;
}


/**
 * Performm a client position hit test an array of tabs.
 *
 * Returns the index of the first matching node, or `-1`.
 */
function hitTestTabs(tabs: Tab[], clientX: number, clientY: number): number {
  for (let i = 0, n = tabs.length; i < n; ++i) {
    if (hitTest(tabs[i].node, clientX, clientY)) return i;
  }
  return -1;
}


/**
 * Test if a mouse position exceeds the tear off threshold.
 */
function tearExceeded(rect: ClientRect, event: MouseEvent): boolean {
  return (
    (event.clientX < rect.left - TEAR_THRESHOLD) ||
    (event.clientX >= rect.right + TEAR_THRESHOLD) ||
    (event.clientY < rect.top - TEAR_THRESHOLD) ||
    (event.clientY >= rect.bottom + TEAR_THRESHOLD)
  );
}
