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
  Message, sendMessage
} from 'phosphor-messaging';

import {
  NodeWrapper
} from 'phosphor-nodewrapper';

import {
  IListChangedArgs, IObservableList, ListChangeType
} from 'phosphor-observablelist';

import {
  IChangedArgs, Property
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
 * The class name added to a tab bar and tab when dragging.
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
 * The tear-off distance threshold.
 */
const TEAR_OFF_THRESHOLD = 20;

/**
 * The tab transition duration.
 */
const TRANSITION_DURATION = 150;  // Keep in sync with CSS.


/**
 * An object which can be added to a tab bar.
 */
export
interface ITabItem {
  /**
   * The title object which provides data for the item's tab.
   *
   * #### Notes
   * This should be a read-only property.
   */
  title: Title;
}


/**
 * A widget which displays a list of tab items as a row of tabs.
 */
export
class TabBar<T extends ITabItem> extends Widget {
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
   * A signal emitted when the user clicks a tab item's close icon.
   *
   * **See also:** [[itemCloseRequested]]
   */
  static itemCloseRequestedSignal = new Signal<TabBar<ITabItem>, ITabItem>();

  /**
   * The property descriptor for the currently selected tab item.
   *
   * **See also:** [[currentItem]]
   */
  static currentItemProperty = new Property<TabBar<ITabItem>, ITabItem>({
    name: 'currentItem',
    value: null,
    coerce: (owner, value) => owner._coerceCurrentItem(value),
    changed: (owner, old, value) => { owner._onCurrentItemChanged(old, value); },
    notify: new Signal<TabBar<ITabItem>, IChangedArgs<ITabItem>>(),
  });

  /**
   * The property descriptor for the observable list of tab items.
   *
   * **See also:** [[items]]
   */
  static itemsProperty = new Property<TabBar<ITabItem>, IObservableList<ITabItem>>({
    name: 'items',
    value: null,
    coerce: (owner, value) => value || null,
    changed: (owner, old, value) => { owner._onItemsChanged(old, value); },
  });

  /**
   * The property descriptor for whether the tabs are user-movable.
   *
   * **See also:** [[tabsMovable]]
   */
  static tabsMovableProperty = new Property<TabBar<ITabItem>, boolean>({
    name: 'tabsMovable',
    value: false,
    changed: owner => { owner._releaseMouse(); },
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
   * A signal emitted when the user clicks a tab item's close icon.
   *
   * #### Notes
   * This is a pure delegate to the [[itemCloseRequestedSignal]].
   */
  get itemCloseRequested(): ISignal<TabBar<T>, T> {
    return TabBar.itemCloseRequestedSignal.bind(this);
  }

  /**
   * Get the currently selected tab item.
   *
   * #### Notes
   * This is a pure delegate to the [[currentItemProperty]].
   */
  get currentItem(): T {
    return TabBar.currentItemProperty.get(this) as T;
  }

  /**
   * Set the currently selected tab item.
   *
   * #### Notes
   * This is a pure delegate to the [[currentItemProperty]].
   */
  set currentItem(value: T) {
    TabBar.currentItemProperty.set(this, value);
  }

  /**
   * A signal emitted when the current tab item is changed.
   *
   * #### Notes
   * This is the notify signal for the [[currentItemProperty]].
   */
  get currentItemChanged(): ISignal<TabBar<T>, IChangedArgs<T>> {
    return TabBar.currentItemProperty.notify.bind(this);
  }

  /**
   * Get the list of tab items for the tab bar.
   *
   * #### Notes
   * This is a pure delegate to the [[itemsProperty]].
   */
  get items(): IObservableList<T> {
    return TabBar.itemsProperty.get(this) as IObservableList<T>;
  }

  /**
   * Set the list tab items for the tab bar.
   *
   * #### Notes
   * This is a pure delegate to the [[itemsProperty]].
   */
  set items(value: IObservableList<T>) {
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
   * Get the tab bar header node.
   *
   * #### Notes
   * This can be used to add extra header content.
   */
  get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar body node.
   *
   * #### Notes
   * This can be used to add extra body content.
   */
  get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * This can be used to access the content node.
   *
   * This is the node which holds the tab nodes. Modifying the content
   * of this node indiscriminately can lead to undesired behavior.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This can be used to add extra footer content.
   */
  get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
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
   * Process a message sent to the tab bar.
   *
   * @param msg - The message sent to the tab bar.
   *
   * #### Notes
   * Subclasses may reimplement this method as needed.
   */
  processMessage(msg: Message): void {
    if (msg.type === 'tear-off-request') {
      this.onTearOffRequest(msg as TearOffMessage<T>);
    } else {
      super.processMessage(msg);
    }
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   *
   * #### Notes
   * This will cause the tab bar to stop handling mouse events and to
   * restore the tabs their non-dragged positions. It is intended to
   * be called by subclasses which implement [[onTearOffRequest]].
   */
  protected releaseMouse(): void {
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'tear-off-request'` message.
   *
   * #### Notes
   * This may be reimplemented by subclasses to support tear-off tabs.
   *
   * The reimplementation should take whatever action is necessary for
   * its use case to continue the drag from the given client position.
   * This will typically involve creating a new DOM node to represent
   * the drag item, and may or may not include removing the specified
   * item from the tab bar.
   *
   * If the reimplementation handles the tear-off, it should call the
   * [[releaseMouse]] method so that the tab bar ceases its handling
   * of mouse events.
   *
   * The default implementation of this handler is a no-op.
   */
  protected onTearOffRequest(msg: TearOffMessage<T>): void { }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   *
   * This handler updates the flex order and z-index of the tabs.
   */
  protected onUpdateRequest(msg: Message): void {
    for (let i = 0, n = this._tabs.length, k = n - 1; i < n; ++i) {
      let tab = this._tabs[i];
      let style = tab.node.style;
      if (tab.hasClass(CURRENT_CLASS)) {
        style.zIndex = n + '';
      } else {
        style.zIndex = k-- + '';
      }
      style.order = i + '';
      tab.toggleClass(FIRST_CLASS, i === 0);
      tab.toggleClass(LAST_CLASS, i === n - 1);
    }
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

    // Emit the close requested signal if the close icon was clicked.
    let tab = this._tabs[index];
    if (tab.closeNode.contains(event.target as HTMLElement)) {
      this.itemCloseRequested.emit(tab.item);
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
      let tabRect = tab.node.getBoundingClientRect();
      let data = this._dragData = new DragData<T>();
      data.tab = tab;
      data.tabIndex = index;
      data.tabLeft = tab.node.offsetLeft;
      data.tabWidth = tabRect.width;
      data.pressX = event.clientX;
      data.pressY = event.clientY;
      data.tabPressX = event.clientX - tabRect.left;
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
    let data = this._dragData;
    if (!data) {
      return;
    }

    // Check to see if the drag threshold has been exceeded, and
    // start the tab drag operation the first time that occurs.
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
      data.tab.addClass(DRAGGING_CLASS);
      this.addClass(DRAGGING_CLASS);
    }

    // Check to see if the tear-off threshold has been exceeded.
    if (!data.tearOffRequested && tearOffExceeded(data.contentRect, event)) {
      // Only make the tear-off request once per drag action.
      data.tearOffRequested = true;

      // Send the tear-off request message to the tab bar.
      let item = data.tab.item;
      let clientX = event.clientX;
      let clientY = event.clientY;
      sendMessage(this, new TearOffMessage(item, clientX, clientY));

      // Do nothing further if the mouse has been released.
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
    let tabs = this._tabs;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let style = tabs[i].node.style;
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

    // Update the drag tab position.
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
    let data = this._dragData;
    if (!data) {
      return;
    }

    // Remove the extra mouse handlers.
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);

    // If the drag is not active, clear the reference and bail.
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

    // Remove the dragging class from the tab so it can be transitioned.
    data.tab.removeClass(DRAGGING_CLASS);

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
      this.removeClass(DRAGGING_CLASS);

      // Finally, move the tab item to the new location.
      let fromIndex = data.tabIndex;
      let toIndex = data.tabTargetIndex;
      if (toIndex !== -1 && fromIndex !== toIndex) {
        this.items.move(fromIndex, toIndex);
        // Force an update to prevent flicker on IE.
        sendMessage(this, Widget.MsgUpdateRequest);
      }
    }, TRANSITION_DURATION);
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Bail early if there is no drag in progress.
    let data = this._dragData;
    if (!data) {
      return;
    }

    // Clear the drag data reference.
    this._dragData = null;

    // Remove the extra mouse listeners.
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);

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
    data.tab.removeClass(DRAGGING_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * The coerce handler for the [[currentItemProperty]].
   */
  private _coerceCurrentItem(item: T): T {
    let list = this.items;
    return (item && list && list.contains(item)) ? item : null;
  }

  /**
   * The change handler for the [[currentItemProperty]].
   */
  private _onCurrentItemChanged(oldItem: T, newItem: T): void {
    let oldTab = arrays.find(this._tabs, tab => tab.item === oldItem);
    let newTab = arrays.find(this._tabs, tab => tab.item === newItem);
    if (oldTab) oldTab.removeClass(CURRENT_CLASS);
    if (newTab) newTab.addClass(CURRENT_CLASS);
    this.update();
  }

  /**
   * The change handler for the [[itemsProperty]].
   */
  private _onItemsChanged(oldList: IObservableList<T>, newList: IObservableList<T>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Disconnect the old list and dispose the old tabs.
    if (oldList) {
      oldList.changed.disconnect(this._onItemsListChanged, this);
      let content = this.contentNode;
      while (this._tabs.length) {
        let tab = this._tabs.pop();
        content.removeChild(tab.node);
        tab.dispose();
      }
    }

    // Create the new tabs and connect the new list.
    if (newList) {
      let content = this.contentNode;
      for (let i = 0, n = newList.length; i < n; ++i) {
        let tab = new Tab(newList.get(i));
        content.appendChild(tab.node);
        this._tabs.push(tab);
      }
      newList.changed.connect(this._onItemsListChanged, this);
    }

    // Update the current item.
    this.currentItem = newList && newList.get(0);

    // Update the tab node order.
    this.update();
  }

  /**
   * The change handler for the items list `changed` signal.
   */
  private _onItemsListChanged(sender: IObservableList<T>, args: IListChangedArgs<T>): void {
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
  }

  /**
   * The handler invoked on a items list change of type `Add`.
   */
  private _onItemsListAdd(args: IListChangedArgs<T>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Create the tab for the new tab item.
    let tab = new Tab(args.newValue as T);

    // Add the tab to the same location in the internal array.
    arrays.insert(this._tabs, args.newIndex, tab);

    // Add the tab node to the DOM. The position is irrelevant.
    this.contentNode.appendChild(tab.node);

    // Select the tab if no tab is currently selected.
    if (!this.currentItem) this.currentItem = tab.item;

    // Update the tab node order.
    this.update();
  }

  /**
   * The handler invoked on a items list change of type `Move`.
   */
  private _onItemsListMove(args: IListChangedArgs<T>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Move the tab in the array. DOM position is irrelevant.
    arrays.move(this._tabs, args.oldIndex, args.newIndex);

    // Update the tab node order.
    this.update();
  }

  /**
   * The handler invoked on a items list change of type `Remove`.
   */
  private _onItemsListRemove(args: IListChangedArgs<T>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Remove the tab from the internal array.
    let tab = arrays.removeAt(this._tabs, args.oldIndex);

    // Remove the tab node from the DOM.
    this.contentNode.removeChild(tab.node);

    // Patch up the current item if needed.
    if (this.currentItem === tab.item) {
      let list = this.items;
      this.currentItem = list.get(args.oldIndex) || list.get(-1);
    }

    // Dispose of the old tab.
    tab.dispose();

    // Update the tab node order.
    this.update();
  }

  /**
   * The handler invoked on a items list change of type `Replace`.
   */
  private _onItemsListReplace(args: IListChangedArgs<T>): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Create the new tabs for the new tab items.
    let newItems = args.newValue as T[];
    let newTabs = newItems.map(item => new Tab(item));

    // Replace the tabs in the internal array.
    let oldItems = args.oldValue as T[];
    let oldTabs = this._tabs.splice(args.newIndex, oldItems.length, ...newTabs);

    // Remove the old tabs from the DOM.
    let content = this.contentNode;
    oldTabs.forEach(tab => { content.removeChild(tab.node); });

    // Add the new tabs to the DOM. Their position is irrelevant.
    newTabs.forEach(tab => { content.appendChild(tab.node); });

    // Patch up the current item if needed.
    let curr = this.currentItem;
    if (oldItems.indexOf(curr) !== -1) {
      this.currentItem = null;
      if (newItems.indexOf(curr) !== -1) {
        this.currentItem = curr;
      } else {
        let list = this.items;
        this.currentItem = list.get(args.newIndex) || list.get(-1);
      }
    }

    // Dispose of the old tabs.
    oldTabs.forEach(tab => { tab.dispose(); });

    // Update the tab node order.
    this.update();
  }

  /**
   * The handler invoked on a items list change of type `Set`.
   */
  private _onItemsListSet(args: IListChangedArgs<T>): void {
    // If the item was not actually changed, there is nothing to do.
    if (args.oldValue === args.newValue) {
      return;
    }

    // Ensure the mouse is released.
    this._releaseMouse();

    // Create the tab for the new tab item.
    let newTab = new Tab(args.newValue as T);

    // Swap the new tab in the internal array.
    let oldTab = this._tabs[args.newIndex];
    this._tabs[args.newIndex] = newTab;

    // Swap the new tab node in the DOM.
    this.contentNode.replaceChild(newTab.node, oldTab.node);

    // Patch up the current item if needed.
    if (this.currentItem === oldTab.item) {
      this.currentItem = newTab.item;
    }

    // Dispose of the old tab.
    oldTab.dispose();

    // Update the tab node order.
    this.update();
  }

  private _tabs: Tab<T>[] = [];
  private _dragData: DragData<T> = null;
}


/**
 * A message class for `'tear-off-request'` messages.
 *
 * #### Notes
 * A message of this type is sent to a tab bar when the user drags
 * a tab beyond the tear-off threshold which surrounds the tab bar.
 */
export
class TearOffMessage<T extends ITabItem> extends Message {
  /**
   * Construct a new tear off request message.
   *
   * @param item - The tab item being dragged by the user.
   *
   * @param clientX - The current client X position of the mouse.
   *
   * @param clientY - The current client Y position of the mouse.
   */
  constructor(item: T, clientX: number, clientY: number) {
    super('tear-off-request');
    this._item = item;
    this._clientX = clientX;
    this._clientY = clientY;
  }

  /**
   * The tab item being dragged by the user.
   *
   * #### Notes
   * This is a read-only property.
   */
  get item(): T {
    return this._item;
  }

  /**
   * The current client X position of the mouse.
   *
   * #### Notes
   * This is a read-only property.
   */
  get clientX(): number {
    return this._clientX;
  }

  /**
   * The current client Y position of the mouse.
   *
   * #### Notes
   * This is a read-only property.
   */
  get clientY(): number {
    return this._clientY;
  }

  private _item: T;
  private _clientX: number;
  private _clientY: number;
}


/**
 * An object which manages a tab node for a tab bar.
 */
class Tab<T extends ITabItem> extends NodeWrapper implements IDisposable {
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
  constructor(item: T) {
    super();
    this.addClass(TAB_CLASS);
    this._item = item;

    let title = item.title;
    this.textNode.textContent = title.text;
    this.toggleClass(CLOSABLE_CLASS, title.closable);
    if (title.icon) exAddClass(this.iconNode, title.icon);
    if (title.className) exAddClass(this.node, title.className);

    title.changed.connect(this._onTitleChanged, this);
  }

  /**
   * Dispose of the resources held by the tab.
   */
  dispose(): void {
    this._item = null;
    clearSignalData(this);
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
   * Get the close icon node for the tab.
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
  get item(): T {
    return this._item;
  }

  /**
   * The handler for the title `changed` signal.
   */
  private _onTitleChanged(sender: Title, args: IChangedArgs<any>): void {
    switch (args.name) {
    case 'text':
      this._onTitleTextChanged(args as IChangedArgs<string>);
      break;
    case 'icon':
      this._onTitleIconChanged(args as IChangedArgs<string>);
      break;
    case 'closable':
      this._onTitleClosableChanged(args as IChangedArgs<boolean>);
      break;
    case 'className':
      this._onTitleClassNameChanged(args as IChangedArgs<string>);
      break;
    }
  }

  /**
   * A method invoked when the title text changes.
   */
  private _onTitleTextChanged(args: IChangedArgs<string>): void {
    this.textNode.textContent = args.newValue;
  }

  /**
   * A method invoked when the title icon changes.
   */
  private _onTitleIconChanged(args: IChangedArgs<string>): void {
    let node = this.iconNode;
    if (args.oldValue) exRemClass(node, args.oldValue);
    if (args.newValue) exAddClass(node, args.newValue);
  }

  /**
   * A method invoked when the title closable flag changes.
   */
  private _onTitleClosableChanged(args: IChangedArgs<boolean>): void {
    this.toggleClass(CLOSABLE_CLASS, args.newValue);
  }

  /**
   * A method invoked when the title class name changes.
   */
  private _onTitleClassNameChanged(args: IChangedArgs<string>): void {
    let node = this.node;
    if (args.oldValue) exRemClass(node, args.oldValue);
    if (args.newValue) exAddClass(node, args.newValue);
  }

  private _item: T;
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
class DragData<T extends ITabItem> {
  /**
   * The tab object being dragged.
   */
  tab: Tab<T> = null;

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
   * The original mouse X position in tab coordinates.
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
   * Whether a tear-off request as been made.
   */
  tearOffRequested = false;
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
 * Perform a client position hit test an array of tabs.
 *
 * Returns the index of the first matching node, or `-1`.
 */
function hitTestTabs(tabs: Tab<ITabItem>[], clientX: number, clientY: number): number {
  for (let i = 0, n = tabs.length; i < n; ++i) {
    if (hitTest(tabs[i].node, clientX, clientY)) return i;
  }
  return -1;
}


/**
 * Get a snapshot of the current tab layout values.
 */
function snapTabLayout(tabs: Tab<ITabItem>[]): ITabLayout[] {
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
 * Test if a mouse position exceeds the tear-off threshold.
 */
function tearOffExceeded(rect: ClientRect, event: MouseEvent): boolean {
  return (
    (event.clientX < rect.left - TEAR_OFF_THRESHOLD) ||
    (event.clientX >= rect.right + TEAR_OFF_THRESHOLD) ||
    (event.clientY < rect.top - TEAR_OFF_THRESHOLD) ||
    (event.clientY >= rect.bottom + TEAR_OFF_THRESHOLD)
  );
}
