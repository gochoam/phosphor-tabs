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
  IChangedArgs, Property
} from 'phosphor-properties';

import {
  ISignal, Signal
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
 * The class name added to a tab.
 */
const TAB_CLASS = 'p-TabBar-tab';

/**
 * The class name added to a tab text node.
 */
const TEXT_CLASS = 'p-TabBar-tab-text';

/**
 * The class name added to a tab icon node.
 */
const ICON_CLASS = 'p-TabBar-tab-icon';

/**
 * The class name added to a tab close node.
 */
const CLOSE_CLASS = 'p-TabBar-tab-close';

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
 * The start drag distance threshold.
 */
const DRAG_THRESHOLD = 5;

/**
 * The detach distance threshold.
 */
const DETACH_THRESHOLD = 20;

/**
 * The tab transition duration.
 */
const TRANSITION_DURATION = 150;  // Keep in sync with CSS.


/**
 * The arguments object for a `tabMoved` signal.
 */
export
interface ITabMovedArgs {
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
 * The arguments object for a `tabDetachRequested` signal.
 */
export
interface ITabDetachArgs {
  /**
   * The title being dragged by the user.
   */
  title: Title;

  /**
   * The DOM node for the tab being dragged.
   */
  node: HTMLElement;

  /**
   * The current client X position of the mouse.
   */
  clientX: number;

  /**
   * The current client Y position of the mouse.
   */
  clientY: number;
}


/**
 * A widget which displays titles as a row of selectable tabs.
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
    this._titles.length = 0;
    super.dispose();
  }

  /**
   * A signal emitted when a tab is moved by the user.
   */
  get tabMoved(): ISignal<TabBar, ITabMovedArgs> {
    return TabBarPrivate.tabMovedSignal.bind(this);
  }

  /**
   * A signal emitted when the user clicks a tab's close icon.
   */
  get tabCloseRequested(): ISignal<TabBar, Title> {
    return TabBarPrivate.tabCloseRequestedSignal.bind(this);
  }

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   */
  get tabDetachRequested(): ISignal<TabBar, ITabDetachArgs> {
    return TabBarPrivate.tabDetachRequestedSignal.bind(this);
  }

  /**
   * A signal emitted when the current title is changed.
   */
  get currentChanged(): ISignal<TabBar, IChangedArgs<Title>> {
    return TabBarPrivate.currentChangedSignal.bind(this);
  }

  /**
   * Get the currently selected title.
   */
  get currentTitle(): Title {
    return TabBarPrivate.currentTitleProperty.get(this);
  }

  /**
   * Set the currently selected title.
   */
  set currentTitle(value: Title) {
    TabBarPrivate.currentTitleProperty.set(this, value);
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(value: boolean) {
    this._tabsMovable = value;
  }

  /**
   * Get the tab bar header node.
   *
   * #### Notes
   * This can be used to add extra header content.
   *
   * This is a read-only property.
   */
  get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar body node.
   *
   * #### Notes
   * This can be used to add extra body content.
   *
   * This is a read-only property.
   */
  get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * Modifying this node can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This can be used to add extra footer content.
   *
   * This is a read-only property.
   */
  get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the number of title objects in the tab bar.
   *
   * @returns The number of title objects in the tab bar.
   */
  titleCount(): number {
    return this._titles.length;
  }

  /**
   * Get the title object at the specified index.
   *
   * @param index - The index of the title object of interest.
   *
   * @returns The title at the specified index, or `undefined`.
   */
  titleAt(index: number): Title {
    return this._titles[index];
  }

  /**
   * Get the index of the specified title object.
   *
   * @param title - The title object of interest.
   *
   * @returns The index of the specified title, or `-1`.
   */
  titleIndex(title: Title): number {
    return this._titles.indexOf(title);
  }

  /**
   * Add a title object to the end of the tab bar.
   *
   * @param title - The title object to add to the tab bar.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  addTitle(title: Title): void {
    this.insertTitle(this.titleCount(), title);
  }

  /**
   * Insert a title object at the specified index.
   *
   * @param index - The index at which to insert the title.
   *
   * @param title - The title object to insert into to the tab bar.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  insertTitle(index: number, title: Title): void {
    // Release the mouse before making changes.
    this._releaseMouse();

    // Insert the new title or move an existing title.
    let n = this.titleCount();
    let i = this.titleIndex(title);
    let j = Math.max(0, Math.min(index | 0, n));
    if (i !== -1) {
      if (j === n) j--;
      if (i === j) return;
      arrays.move(this._titles, i, j);
    } else {
      arrays.insert(this._titles, j, title);
      title.changed.connect(this._onTitleChanged, this);
      if (!this.currentTitle) this.currentTitle = title;
    }

    // Flip the dirty flag and schedule a full update.
    this._dirty = true;
    this.update();
  }

  /**
   * Remove the title object at the specified index.
   *
   * @param index - The index of the title of interest.
   *
   * #### Notes
   * If the index is out of range, this is a no-op.
   */
  removeTitleAt(index: number): void {
    // Release the mouse before making changes.
    this._releaseMouse();

    // Do nothing if the index is out of range.
    let i = index | 0;
    if (i < 0 || i >= this._titles.length) {
      return;
    }

    // Remove the title at the index and disconnect the handler.
    let title = arrays.removeAt(this._titles, i);
    title.changed.disconnect(this._onTitleChanged, this);

    // Selected the next best tab if removing the current tab.
    if (this.currentTitle === title) {
      this.currentTitle = this._titles[i] || this._titles[i - 1];
    }

    // Flip the dirty flag and schedule a full update.
    this._dirty = true;
    this.update();
  }

  /**
   * Remove a title object from the tab bar.
   *
   * @param title - The title object to remove from the tab bar.
   *
   * #### Notes
   * If the title is not in the tab bar, this is a no-op.
   */
  removeTitle(title: Title): void {
    this.removeTitleAt(this.titleIndex(title));
  }

  /**
   * Remove all title objects from the tab bar.
   */
  clearTitles(): void {
    // Release the mouse before making changes.
    this._releaseMouse();

    // Remove and disconnect all titles.
    while (this._titles.length > 0) {
      let title = this._titles.pop();
      title.changed.disconnect(this._onTitleChanged, this);
    }

    // Flip the dirty flag and schedule a full update.
    this._dirty = true;
    this.update();
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   *
   * #### Notes
   * This will cause the tab bar to stop handling mouse events and to
   * restore the tabs to their non-dragged positions.
   */
  releaseMouse(): void {
    this._releaseMouse();
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
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
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
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this._releaseMouse();
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this._dirty) {
      this._dirty = false;
      TabBarPrivate.updateTabs(this);
    } else {
      TabBarPrivate.updateZOrder(this);
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

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Do nothing if the click is not on a tab.
    let i = TabBarPrivate.hitTestTabs(this, event.clientX, event.clientY);
    if (i < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the click if the title is not closable.
    let title = this._titles[i];
    if (!title.closable) {
      return;
    }

    // Ignore the click if the close icon wasn't clicked.
    let icon = TabBarPrivate.closeIconNode(this, i);
    if (!icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the tab close requested signal.
    this.tabCloseRequested.emit(title);
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Do nothing if the press is not on a tab.
    let i = TabBarPrivate.hitTestTabs(this, event.clientX, event.clientY);
    if (i < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the press if it was on a close icon.
    let icon = TabBarPrivate.closeIconNode(this, i);
    if (icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Setup the drag data if the tabs are movable.
    if (this._tabsMovable) {
      this._dragData = TabBarPrivate.initDrag(i, event);
      document.addEventListener('mousemove', this, true);
      document.addEventListener('mouseup', this, true);
      document.addEventListener('contextmenu', this, true);
    }

    // Update the current title.
    this.currentTitle = this._titles[i];
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Suppress the event during a drag.
    event.preventDefault();
    event.stopPropagation();

    // Update the tab drag positions.
    TabBarPrivate.moveDrag(this, this._dragData, event);
  }

  /**
   * Handle the `'mouseup'` event for the tab bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if it's not a left mouse release.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Suppress the event during a drag operation.
    event.preventDefault();
    event.stopPropagation();

    // Remove the extra mouse event listeners.
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);

    // End the drag operation.
    TabBarPrivate.endDrag(this, this._dragData, event, {
      clear: () => {
        this._dragData = null;
      },
      move: (i, j) => {
        let k = j < i ? j : j + 1;
        let content = this.contentNode;
        let children = content.children;
        arrays.move(this._titles, i, j);
        content.insertBefore(children[i], children[k]);
        this.tabMoved.emit({ fromIndex: i, toIndex: j });
        this.update();
      },
    });
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Remove the extra mouse listeners.
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Abort the drag operation and clear the drag data.
    TabBarPrivate.abortDrag(this, this._dragData);
    this._dragData = null;
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirty = true;
    this.update();
  }

  private _dirty = false;
  private _tabsMovable = false;
  private _titles: Title[] = [];
  private _dragData: DragData = null;
}


/**
 * A struct which holds the drag data for a tab bar.
 */
class DragData {
  /**
   * The tab node being dragged.
   */
  tab: HTMLElement = null;

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
  targetIndex = -1;

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
   * Whether the drag has been aborted.
   */
  dragAborted = false;

  /**
   * Whether a detach request as been made.
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
 * The namespace for the `TabBar` class private data.
 */
namespace TabBarPrivate {
  /**
   * A signal emitted when the current title is changed.
   */
  export
  const currentChangedSignal = new Signal<TabBar, IChangedArgs<Title>>();

  /**
   * A signal emitted when a tab is moved by the user.
   */
  export
  const tabMovedSignal = new Signal<TabBar, ITabMovedArgs>();

  /**
   * A signal emitted when the user clicks a tab's close icon.
   */
  export
  const tabCloseRequestedSignal = new Signal<TabBar, Title>();

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   */
  export
  const tabDetachRequestedSignal = new Signal<TabBar, ITabDetachArgs>();

  /**
   * The property descriptor for the currently selected title.
   */
  export
  const currentTitleProperty = new Property<TabBar, Title>({
    name: 'currentTitle',
    value: null,
    coerce: coerceCurrentTitle,
    changed: onCurrentTitleChanged,
    notify: currentChangedSignal,
  });

  /**
   * Get the close icon node for the tab at the specified index.
   */
  export
  function closeIconNode(owner: TabBar, index: number): HTMLElement {
    return owner.contentNode.children[index].lastChild as HTMLElement;
  }

  /**
   * Get the index of the tab node at a client position, or `-1`.
   */
  export
  function hitTestTabs(owner: TabBar, x: number, y: number): number {
    let nodes = owner.contentNode.children;
    for (let i = 0, n = nodes.length; i < n; ++i) {
      if (hitTest(nodes[i] as HTMLElement, x, y)) return i;
    }
    return -1;
  }

  /**
   * Update the tab bar tabs to match the current titles.
   *
   * This is a full update which also updates the tab Z order.
   */
  export
  function updateTabs(owner: TabBar) {
    let count = owner.titleCount();
    let content = owner.contentNode;
    let children = content.children;
    let current = owner.currentTitle;
    while (children.length > count) {
      content.removeChild(content.lastChild);
    }
    while (children.length < count) {
      content.appendChild(createTabNode());
    }
    for (let i = 0; i < count; ++i) {
      let node = children[i] as HTMLElement;
      updateTabNode(node, owner.titleAt(i));
    }
    updateZOrder(owner);
  }

  /**
   * Update the Z order of the tabs to match the current titles.
   *
   * This is a partial update which updates the Z order and the current
   * tab class. It assumes the tab count is the same as the title count.
   */
  export
  function updateZOrder(owner: TabBar) {
    let count = owner.titleCount();
    let content = owner.contentNode;
    let children = content.children;
    let current = owner.currentTitle;
    for (let i = 0; i < count; ++i) {
      let node = children[i] as HTMLElement;
      if (owner.titleAt(i) === current) {
        node.classList.add(CURRENT_CLASS);
        node.style.zIndex = count + '';
      } else {
        node.classList.remove(CURRENT_CLASS);
        node.style.zIndex = count - i - 1 + '';
      }
    }
  }

  /**
   * Initialize a new drag data object for a tab bar.
   *
   * This should be called on 'mousedown' event.
   */
  export
  function initDrag(tabIndex: number, event: MouseEvent): DragData {
    let data = new DragData();
    data.tabIndex = tabIndex;
    data.pressX = event.clientX;
    data.pressY = event.clientY;
    return data;
  }

  /**
   * Update the drag positions of the tabs for a tab bar.
   *
   * This should be called on a `'mousemove'` event.
   */
  export
  function moveDrag(owner: TabBar, data: DragData, event: MouseEvent): void {
    // Ensure the drag threshold is exceeded before moving the tab.
    if (!data.dragActive) {
      let dx = Math.abs(event.clientX - data.pressX);
      let dy = Math.abs(event.clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      // Fill in the missing drag data measurements.
      let content = owner.contentNode;
      let tab = content.children[data.tabIndex] as HTMLElement;
      let tabRect = tab.getBoundingClientRect();
      data.tab = tab;
      data.tabLeft = tab.offsetLeft;
      data.tabWidth = tabRect.width;
      data.tabPressX = data.pressX - tabRect.left;
      data.contentRect = content.getBoundingClientRect();
      data.tabLayout = snapTabLayout(owner);
      data.cursorGrab = overrideCursor('default');

      // Style the tab bar and tab for relative position dragging.
      tab.classList.add(DRAGGING_CLASS);
      owner.addClass(DRAGGING_CLASS);
      data.dragActive = true;
    }

    // Emit the detach request signal if the threshold is exceeded.
    if (!data.detachRequested && detachExceeded(data.contentRect, event)) {
      let node = data.tab;
      let clientX = event.clientX;
      let clientY = event.clientY;
      let title = owner.titleAt(data.tabIndex);
      owner.tabDetachRequested.emit({ title, node, clientX, clientY });
      data.detachRequested = true;
      if (data.dragAborted) {
        return;
      }
    }

    // Compute the target bounds of the drag tab.
    let offsetLeft = event.clientX - data.contentRect.left;
    let targetLeft = offsetLeft - data.tabPressX;
    let targetRight = targetLeft + data.tabWidth;

    // Reset the target tab index.
    data.targetIndex = data.tabIndex;

    // Update the non-drag tab positions and the tab target index.
    let tabs = owner.contentNode.children;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let layout = data.tabLayout[i];
      let style = (tabs[i] as HTMLElement).style;
      let threshold = layout.left + (layout.width >> 1);
      if (i < data.tabIndex && targetLeft < threshold) {
        style.left = data.tabWidth + data.tabLayout[i + 1].margin + 'px';
        data.targetIndex = Math.min(data.targetIndex, i);
      } else if (i > data.tabIndex && targetRight > threshold) {
        style.left = -data.tabWidth - layout.margin + 'px';
        data.targetIndex = i;
      } else if (i !== data.tabIndex) {
        style.left = '';
      }
    }

    // Update the drag tab position.
    let idealLeft = event.clientX - data.pressX;
    let maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    let adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.style.left = adjustedLeft + 'px';
  }

  /**
   * A handler object for drag end callbacks.
   */
  export
  interface IEndHandler {
    /**
     * Clear the the drag data reference.
     */
    clear: () => void;

    /**
     * Move a tab from one index to another.
     */
    move: (i: number, j: number) => void;
  }

  /**
   * End the drag operation for a tab bar.
   *
   * This should be called on a `'mouseup'` event.
   */
  export
  function endDrag(owner: TabBar, data: DragData, event: MouseEvent, handler: IEndHandler): void {
    // Bail early if the drag is not active.
    if (!data.dragActive) {
      handler.clear();
      return;
    }

    // Compute the approximate final relative tab offset.
    let idealLeft: number;
    if (data.targetIndex === data.tabIndex) {
      idealLeft = 0;
    } else if (data.targetIndex > data.tabIndex) {
      let tl = data.tabLayout[data.targetIndex];
      idealLeft = tl.left + tl.width - data.tabWidth - data.tabLeft;
    } else {
      let tl = data.tabLayout[data.targetIndex];
      idealLeft = tl.left - data.tabLeft;
    }

    // Position the tab to its final position, subject to limits.
    let maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    let adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.style.left = adjustedLeft + 'px';

    // Remove the dragging class from the tab so it can be transitioned.
    data.tab.classList.remove(DRAGGING_CLASS);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Do nothing if the drag has been aborted.
      if (data.dragAborted) {
        return;
      }

      // Clear the drag data reference.
      handler.clear();

      // Reset the positions of the tabs.
      resetTabPositions(owner);

      // Clear the cursor grab and drag styles.
      data.cursorGrab.dispose();
      owner.removeClass(DRAGGING_CLASS);

      // Finally, move the tab to its new location.
      if (data.targetIndex !== -1 && data.tabIndex !== data.targetIndex) {
        handler.move(data.tabIndex, data.targetIndex);
      }
    }, TRANSITION_DURATION);
  }

  /**
   * Abort the drag operation for a tab bar.
   *
   * This should be called to cancel a drag immediately.
   */
  export
  function abortDrag(owner: TabBar, data: DragData): void {
    // Indicate the drag has been aborted, which allows the drag
    // end handler and detach request emitter to return early.
    data.dragAborted = true;

    // If the drag is not active, there's nothing more to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the tabs to their non-dragged positions.
    resetTabPositions(owner);

    // Clear the cursor override and extra styling classes.
    data.cursorGrab.dispose();
    data.tab.classList.remove(DRAGGING_CLASS);
    owner.removeClass(DRAGGING_CLASS);
  }

  /**
   * The coerce handler for the `currentTitle` property.
   */
  function coerceCurrentTitle(owner: TabBar, value: Title): Title {
    return (value && owner.titleIndex(value) !== -1) ? value : null;
  }

  /**
   * The change handler for the `currentTitle` property.
   */
  function onCurrentTitleChanged(owner: TabBar): void {
    owner.update();
  }

  /**
   * Create an uninitialized DOM node for a tab.
   */
  function createTabNode(): HTMLElement {
    let node = document.createElement('li');
    let icon = document.createElement('span');
    let text = document.createElement('span');
    let close = document.createElement('span');
    text.className = TEXT_CLASS;
    close.className = CLOSE_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(close);
    return node;
  }

  /**
   * Update a tab node to reflect the state of a title.
   */
  function updateTabNode(node: HTMLElement, title: Title): void {
    let icon = node.firstChild as HTMLElement;
    let text = icon.nextSibling as HTMLElement;
    let suffix = title.closable ? ' ' + CLOSABLE_CLASS : '';
    if (title.className) {
      node.className = TAB_CLASS + ' ' + title.className + suffix;
    } else {
      node.className = TAB_CLASS + suffix;
    }
    if (title.icon) {
      icon.className = ICON_CLASS + ' ' + title.icon;
    } else {
      icon.className = ICON_CLASS;
    }
    text.textContent = title.text;
  }

  /**
   * Reset the tabs to their unadjusted positions.
   */
  function resetTabPositions(owner: TabBar): void {
    let children = owner.contentNode.children;
    for (let i = 0, n = children.length; i < n; ++i) {
      (children[i] as HTMLElement).style.left = '';
    }
  }

  /**
   * Get a snapshot of the current tab layout values.
   */
  function snapTabLayout(owner: TabBar): ITabLayout[] {
    let layout: ITabLayout[] = [];
    let children = owner.contentNode.children;
    for (let i = 0, n = children.length; i < n; ++i) {
      let node = children[i] as HTMLElement;
      let left = node.offsetLeft;
      let width = node.offsetWidth;
      let cstyle = window.getComputedStyle(node);
      let margin = parseInt(cstyle.marginLeft, 10) || 0;
      layout.push({ margin, left, width });
    }
    return layout;
  }

  /**
   * Test if a mouse position exceeds the detach threshold.
   */
  function detachExceeded(rect: ClientRect, event: MouseEvent): boolean {
    return (
      (event.clientX < rect.left - DETACH_THRESHOLD) ||
      (event.clientX >= rect.right + DETACH_THRESHOLD) ||
      (event.clientY < rect.top - DETACH_THRESHOLD) ||
      (event.clientY >= rect.bottom + DETACH_THRESHOLD)
    );
  }
}
