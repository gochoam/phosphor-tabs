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
 * The class name added to the tab bar header div.
 */
const HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to the tab bar content div.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to the tab bar footer div.
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
 * The class name added to a selected tab.
 */
const SELECTED_CLASS = 'p-mod-selected';

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
   * The title object to remove.
   */
  title: Title;

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
 * A widget which displays a list of titles as a row of tabs.
 *
 * #### Notes
 * A `TabBar` widget does not support child widgets. Adding children
 * to a `TabBar` will result in undefined behavior.
 */
export
class TabBar extends Widget {
  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let header = document.createElement('div');
    let content = document.createElement('ul');
    let footer = document.createElement('div');
    header.className = HEADER_CLASS;
    content.className = CONTENT_CLASS;
    footer.className = FOOTER_CLASS;
    node.appendChild(header);
    node.appendChild(content);
    node.appendChild(footer);
    return node;
  }

  /**
   * A signal emitted when the user clicks a tab close icon.
   *
   * This will only be emitted for tabs with a `closable` title.
   *
   * **See also:** [[tabCloseRequested]
   */
  static tabCloseRequestedSignal = new Signal<TabBar, Title>();

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   *
   * This is only emitted once per drag action, on the first time the
   * detach threshold is exceeded.
   *
   * **See also:** [[tabDetachRequested]]
   */
  static tabDetachRequestedSignal = new Signal<TabBar, ITabDetachArgs>();

  /**
   * The property descriptor for the previous tab.
   *
   * This controls which tab is selected if and when the selected tab
   * is removed. This is updated automatically at the appropriate time.
   *
   * **See also:** [[previousTab]]
   */
  static previousTabProperty = new Property<TabBar, Title>({
    value: null,
    coerce: (owner, value) => owner._titles.contains(value) ? value : null,
  });

  /**
   * The property descriptor for the selected tab.
   *
   * This controls the currently selected tab in the tab bar.
   *
   * **See also:** [[selectedTab]]
   */
  static selectedTabProperty = new Property<TabBar, Title>({
    value: null,
    coerce: (owner, value) => owner._titles.contains(value) ? value : null,
    changed: (owner, old, value) => owner._onSelectedTabChanged(old, value),
  });

  /**
   * The property descriptor for the tabs movable property
   *
   * This controls whether tabs are movable by the user.
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
    this._titles.changed.connect(this._onTitlesChanged, this);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    clearSignalData(this._titles);
    this._tabs.forEach(tab => tab.dispose());
    this._tabs.length = 0;
    this._titles.clear();
    this._releaseMouse();
    super.dispose();
  }

  /**
   * A signal emitted when the user clicks a tab close icon.
   *
   * #### Notes
   * This is a pure delegate to the [[tabCloseRequestedSignal]].
   */
  get tabCloseRequested(): ISignal<TabBar, Title> {
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
   * This is a pure delegate to the [[previousTabProperty]].
   */
  get previousTab(): Title {
    return TabBar.previousTabProperty.get(this);
  }

  /**
   * Set the previously selected tab.
   *
   * #### Notes
   * This is a pure delegate to the [[previousTabProperty]].
   */
  set previousTab(value: Title) {
    TabBar.previousTabProperty.set(this, value);
  }

  /**
   * Get the selected tab.
   *
   * #### Notes
   * This is a pure delegate to the [[selectedTabProperty]].
   */
  get selectedTab(): Title {
    return TabBar.selectedTabProperty.get(this);
  }

  /**
   * Set the selected tab.
   *
   * #### Notes
   * This is a pure delegate to the [[selectedTabProperty]].
   */
  set selectedTab(value: Title) {
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
   * Get the mutable list of title objects which drive the tabs.
   *
   * #### Notes
   * This is a read-only property.
   */
  get tabs(): IObservableList<Title> {
    return this._titles;
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
   * Get the tab bar header node.
   */
  protected get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   */
  protected get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   */
  protected get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

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

    // Emit the `tabCloseRequested` signal if the title is closable.
    if (tab.title.closable) this.tabCloseRequested.emit(tab.title);
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

    // Update the selected tab to the pressed tab.
    this.selectedTab = tab.title;
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

    // Check to see if the detach threshold has been exceeded, and
    // emit the detach request signal the first time that occurrs.
    // If the drag data gets set to null, the mouse was released.
    if (!data.detachRequested && shouldDetach(data.contentRect, event)) {
      data.detachRequested = true;
      this.tabDetachRequested.emit({
        title: data.tab.title,
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
        this._titles.move(fromIndex, toIndex);
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
   * Update the drag tab position for the given mouse X position.
   *
   * This method is a no-op if an active drag is not in progress.
   */
  private _updateDragPosition(clientX: number): void {
    // Bail if there is not an active drag.
    let data = this._dragData;
    if (!data || !data.dragActive) {
      return;
    }

    // Compute the target bounds of the drag tab.
    let offsetLeft = clientX - data.contentRect.left;
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
    let idealLeft = clientX - data.pressX;
    let maxLeft = data.contentRect.width - (data.tabLeft + data.tabWidth);
    let adjustedLeft = Math.max(-data.tabLeft, Math.min(idealLeft, maxLeft));
    data.tab.node.style.left = adjustedLeft + 'px';
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
      if (tab.hasClass(SELECTED_CLASS)) {
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
   * The change handler for the [[selectedTabProperty]].
   */
  private _onSelectedTabChanged(old: Title, tab: Title): void {
    if (old) {
      let i = this._titles.indexOf(old);
      this._tabs[i].removeClass(SELECTED_CLASS);
    }
    if (tab) {
      let i = this._titles.indexOf(tab);
      this._tabs[i].addClass(SELECTED_CLASS);
    }
    this.previousTab = old;
    this._updateTabOrdering();
  }

  /**
   *
   */
  private _onTitlesChanged(list: ObservableList<Title>, args: IListChangedArgs<Title>): void {
    // this._releaseMouse();
    // switch (args.type) {
    // case ListChangeType.Add:
    //   this._onTitleAdded(args);
    //   break;
    // case ListChangeType.Move:
    //   this._onTitleMoved(args);
    //   break;
    // case ListChangeType.Remove:
    //   this._onTitleRemoved(args);
    //   break;
    // case ListChangeType.Replace:
    //   this._onTitlesReplaced(args);
    //   break;
    // case ListChangeType.Set:
    //   this._onTitleSet(args);
    //   break;
    // }
    // this._updateTabOrdering();
  }

  // /**
  //  *
  //  */
  // private _onTitleAdded(args: IListChangedArgs<Title>): void {
  //   // Create a tab node for the new title.
  //   let title = args.newValue as Title;
  //   let tabNode = createTabNode(title);

  //   // Fetch the sibling node and store the new node.
  //   let nextNode = this._tabNodes[args.newIndex];
  //   arrays.insert(this._tabNodes, args.newIndex, tabNode);

  //   // Add the new tab node to the content node.
  //   this.contentNode.insertBefore(tabNode, nextNode);

  //   // Connect the change listener for the title data.
  //   Property.getChanged(title).connect(this._onTitleChanged, this);
  // }

  // /**
  //  *
  //  */
  // private _onTitleMoved(args: IListChangedArgs<Title>): void {
  //   // Do nothing if the title was not actually moved.
  //   if (args.oldIndex === args.newIndex) {
  //     return;
  //   }

  //   // Move the respective tab node in the internal array.
  //   arrays.move(this._tabNodes, args.oldIndex, args.newIndex);
  // }

  // /**
  //  *
  //  */
  // private _onTitleRemoved(args: IListChangedArgs<Title>): void {
  //   // Disconnect the change listener for the title data.
  //   let title = args.newValue as Title;
  //   Property.getChanged(title).disconnect(this._onTitleChanged, this);

  //   // Remove the respective tab node from the internal array.
  //   let tabNode = arrays.removeAt(this._tabNodes, args.oldIndex);

  //   // Remove the tab node from the content node.
  //   this.contentNode.removeChild(tabNode);
  // }

  // /**
  //  *
  //  */
  // private _onTitlesReplaced(args: IListChangedArgs<Title>): void {

  // }

  // /**
  //  *
  //  */
  // private _onTitleSet(args: IListChangedArgs<Title>): void {
  //   // Do nothing if the title was not actually changed.
  //   if (args.oldValue === args.newValue) {
  //     return;
  //   }

  //   // Disconnect the change listener for the old title.
  //   let oldTitle = args.oldValue as Title;
  //   Property.getChanged(oldTitle).disconnect(this._onTitleChanged, this);

  //   // Remove the old tab node from the content node.
  //   this.contentNode.removeChild(this._tabNodes[args.newIndex]);

  //   // Create and a new tab node for the new title.
  //   let newTitle = args.newValue as Title;
  //   let tabNode = createTabNode(newTitle);

  //   // Store the new tab node in the internal array.
  //   this._tabNodes[args.newIndex] = tabNode;

  //   // Add the new tab node to the content node.
  //   this.contentNode.insertBefore(tabNode, this._tabNodes[args.newIndex + 1]);

  //   // Connect the change listener for the new title data.
  //   Property.getChanged(newTitle).connect(this._onTitleChanged, this);
  // }

  private _tabs: Tab[] = [];
  private _dragData: DragData = null;
  private _titles = new ObservableList<Title>();
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
   * Whether the detach request signal has been emitted.
   */
  detachRequested = false;
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
   * @param title - The title object which drives the tab.
   */
  constructor(title: Title) {
    super();
    this.addClass(TAB_CLASS);
    this._title = title;

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
    this._title = null;
  }

  /**
   * Test whether the tab is disposed.
   */
  get isDisposed(): boolean {
    return this._title === null;
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
   * Get the title object which drives the tab.
   *
   * #### Notes
   * This is a read-only property.
   */
  get title(): Title {
    return this._title;
  }

  /**
   * Handle the property changed signal for the tab title.
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

  private _title: Title;
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
