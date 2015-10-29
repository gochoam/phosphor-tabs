/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  NodeWrapper
} from 'phosphor-nodewrapper';


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
 * The class name added to a selected tab.
 */
const SELECTED_CLASS = 'p-mod-selected';

/**
 * The class name added to a closable tab.
 */
const CLOSABLE_CLASS = 'p-mod-closable';


/**
 * An object which manages a node for a tab bar.
 */
export
class Tab extends NodeWrapper {
  /**
   * Create the DOM node for a tab.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
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
   * @param text - The initial text for the tab.
   */
  constructor(text?: string) {
    super();
    this.addClass(TAB_CLASS);
    if (text) this.text = text;
  }

  /**
   * Get the text for the tab.
   */
  get text(): string {
    return (<HTMLElement>this.node.children[1]).textContent;
  }

  /**
   * Set the text for the tab.
   */
  set text(text: string) {
    (<HTMLElement>this.node.children[1]).textContent = text;
  }

  /**
   * Get whether the tab is selected.
   */
  get selected(): boolean {
    return this.hasClass(SELECTED_CLASS);
  }

  /**
   * Set whether the tab is selected.
   */
  set selected(selected: boolean) {
    this.toggleClass(SELECTED_CLASS, selected);
  }

  /**
   * Get whether the tab is closable.
   */
  get closable(): boolean {
    return this.hasClass(CLOSABLE_CLASS);
  }

  /**
   * Set whether the tab is closable.
   */
  set closable(closable: boolean) {
    this.toggleClass(CLOSABLE_CLASS, closable);
  }

  /**
   * Get the DOM node for the tab close icon.
   */
  get closeIconNode(): HTMLElement {
    return <HTMLElement>this.node.lastChild;
  }
}
