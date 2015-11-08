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
  hitTest
} from 'phosphor-domutil';

import {
  Message
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
 * An object which can be added to a tab bar.
 */
export
interface ITabItem {
  /**
   * The title object which provides data for the item's tab.
   *
   * #### Notes
   * This should be a read-only constant property.
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
   * **See also:** [[closeRequested]]
   */
  static closeRequestedSignal = new Signal<TabBar<ITabItem>, ITabItem>();

  /**
   * A signal emitted when the current tab item is changed.
   *
   * **See also:** [[currentChanged]]
   */
  static currentChangedSignal = new Signal<TabBar<ITabItem>, IChangedArgs<ITabItem>>();

  /**
   * The property descriptor for the currently selected tab item.
   *
   * **See also:** [[currentItem]]
   */
  static currentItemProperty = new Property<TabBar<ITabItem>, ITabItem>({
    name: 'currentItem',
    value: null,
    coerce: (owner, value) => owner._coerceCurrentItem(value),
    changed: (owner, old, value) => owner._onCurrentItemChanged(old, value),
    notify: TabBar.currentChangedSignal,
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
    changed: (owner, old, value) => owner._onItemsChanged(old, value),
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
    this.items = null;
    super.dispose();
  }

  /**
   * A signal emitted when the user clicks a tab item's close icon.
   *
   * #### Notes
   * This is a pure delegate to the [[itemCloseRequestedSignal]].
   */
  get closeRequested(): ISignal<TabBar<T>, T> {
    return TabBar.closeRequestedSignal.bind(this);
  }

  /**
   * A signal emitted when the current tab item is changed.
   *
   * #### Notes
   * This is a pure delegate to the [[currentChangedSignal]].
   */
  get currentChanged(): ISignal<TabBar<T>, IChangedArgs<T>> {
    return TabBar.currentChangedSignal.bind(this);
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
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-dettach'` message.
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

    // Do nothing if the click was not on a close icon node.
    let tab = this._tabs[index];
    if (!tab.closeNode.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the close requested signal if the item is closable.
    if (tab.item.title.closable) this.closeRequested.emit(tab.item);
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
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

    // Update the current item to the pressed item.
    this.currentItem = tab.item;
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
    // Simply move the tab in the array. DOM position is irrelevant.
    arrays.move(this._tabs, args.oldIndex, args.newIndex);

    // Update the tab node order.
    this.update();
  }

  /**
   * The handler invoked on a items list change of type `Remove`.
   */
  private _onItemsListRemove(args: IListChangedArgs<T>): void {
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
