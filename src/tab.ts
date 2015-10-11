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
 * An object which manages a node for a tab bar.
 */
export
class Tab extends NodeWrapper {
  /**
   * The class name added to Tab instances.
   */
  static p_Tab = 'p-Tab';

  /**
   * The class name added to a tab text node.
   */
  static p_Tab_text = 'p-Tab-text';

  /**
   * The class name added to a tab icon node.
   */
  static p_Tab_icon = 'p-Tab-icon';

  /**
   * The class name added to a tab close node.
   */
  static p_Tab_close = 'p-Tab-close';

  /**
   * The class name added to a selected tab.
   */
  static p_mod_selected = 'p-mod-selected';

  /**
   * The class name added to a closable tab.
   */
  static p_mod_closable = 'p-mod-closable';

  /**
   * Create the DOM node for a tab.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var icon = document.createElement('span');
    var text = document.createElement('span');
    var close = document.createElement('span');
    icon.className = Tab.p_Tab_icon;
    text.className = Tab.p_Tab_text;
    close.className = Tab.p_Tab_close;
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
    this.addClass(Tab.p_Tab);
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
    return this.hasClass(Tab.p_mod_selected);
  }

  /**
   * Set whether the tab is selected.
   */
  set selected(selected: boolean) {
    this.toggleClass(Tab.p_mod_selected, selected);
  }

  /**
   * Get whether the tab is closable.
   */
  get closable(): boolean {
    return this.hasClass(Tab.p_mod_closable);
  }

  /**
   * Set whether the tab is closable.
   */
  set closable(closable: boolean) {
    this.toggleClass(Tab.p_mod_closable, closable);
  }

  /**
   * Get the DOM node for the tab close icon.
   */
  get closeIconNode(): HTMLElement {
    return <HTMLElement>this.node.lastChild;
  }
}
