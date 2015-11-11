/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import expect = require('expect.js');

import {
  Message, sendMessage
} from 'phosphor-messaging';

import {
  IObservableList, ObservableList
} from 'phosphor-observablelist';

import {
  Property
} from 'phosphor-properties';

import {
  Signal
} from 'phosphor-signaling';

import {
  Widget
} from 'phosphor-widget';

import {
  ITabItem, TabBar, TearOffMessage
} from '../../lib/index';

import './index.css';


class LogTabBar extends TabBar<Widget> {

  messages: string[] = [];

  events: string[] = [];

  methods: string[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    this.messages.push(msg.type);
  }

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  releaseMouse(): void {
    super.releaseMouse();
    this.methods.push('releaseMouse');
  }

  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  onTearOffRequest(msg: TearOffMessage<Widget>): void {
    super.onTearOffRequest(msg);
    this.methods.push('onTearOffRequest');
  }

  onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}


class TearOffTabBar extends LogTabBar {

  tearOffMessages: TearOffMessage<Widget>[] = [];

  onTearOffRequest(msg: TearOffMessage<Widget>): void {
    super.onTearOffRequest(msg);
    this.tearOffMessages.push(msg);
    this.releaseMouse();
  }

}


function triggerMouseEvent(node: HTMLElement, eventType: string, options: any = {}) {
   options.bubbles = true;
   let clickEvent = new MouseEvent(eventType, options);
   node.dispatchEvent(clickEvent);
}


function createContent(title: string): Widget {
  let widget = new Widget();
  widget.title.text = title;
  widget.title.icon = 'dummy';
  widget.title.className = 'dummyClass';
  return widget;
}


function createTabBar(): LogTabBar {
  let tabBar = new LogTabBar();
  let widget0 = createContent('0');
  let widget1 = createContent('1');
  let items = new ObservableList<Widget>([widget0, widget1]);
  tabBar.items = items;
  tabBar.id = 'main';
  return tabBar;
}


function expectListEqual(list0: IObservableList<ITabItem>, list1: IObservableList<ITabItem>): void {
  expect(list0.length).to.eql(list1.length);
  for (let i = 0; i < list0.length; i++) {
    expect(list0.get(i)).to.eql(list1.get(i));
  }
}


describe('phosphor-tabs', () => {

  describe('Tabbar', () => {

    describe('.createNode()', () => {

      it('should create a DOM node for a tabbar', () => {
        let node = TabBar.createNode();
        let children = node.children;
        expect(children.length).to.be(3);
        expect(children[0].classList.contains('p-TabBar-header')).to.be(true);
        expect(children[1].classList.contains('p-TabBar-body')).to.be(true);
        expect(children[2].classList.contains('p-TabBar-footer')).to.be(true);
      });

    });

    describe('.itemCloseRequestedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.itemCloseRequestedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.currentItemProperty', () => {

      it('should be a property', () => {
        expect(TabBar.currentItemProperty instanceof Property).to.be(true);
      });

      it('should default to `null`', () => {
        let tab = new TabBar<Widget>();
        expect(TabBar.currentItemProperty.get(tab)).to.be(null);
      });

    });

    describe('.itemsProperty', () => {

      it('should be a property', () => {
        expect(TabBar.itemsProperty instanceof Property).to.be(true);
      });

      it('should default to `null`', () => {
        let tab = new TabBar<Widget>();
        expect(TabBar.itemsProperty.get(tab)).to.be(null);
      });

    });

    describe('.tabsMovableProperty', () => {

      it('should be a property', () => {
        expect(TabBar.tabsMovableProperty instanceof Property).to.be(true);
      });

      it('should default to `false`', () => {
        let tab = new TabBar<Widget>();
        expect(TabBar.tabsMovableProperty.get(tab)).to.be(false);
      });

    });

    describe('#constructor()', () => {

      it('should accept no argumentst', () => {
       let tabBar = new TabBar();
       expect(tabBar instanceof TabBar).to.be(true);
      });

      it('should add the `p-TabBar` class', () => {
       let tabBar = new TabBar();
       expect(tabBar.hasClass('p-TabBar')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let tabBar = createTabBar();
        tabBar.dispose();
        expect(tabBar.items).to.be(null);
      });

    });

    describe('#itemCloseRequested', () => {

      it('should be emitted when the user clicks a tab item close icon', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.itemCloseRequested.connect(() => { called = true; });
        Widget.attach(tabBar, document.body);
        let nodes = tabBar.node.querySelectorAll('.p-Tab-close');
        let node = nodes[0] as HTMLElement;
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let args = { clientX: rect.left + 1, clientY: rect.top + 1 };
        triggerMouseEvent(node, 'click', args);
        expect(called).to.be(true);
        Widget.detach(tabBar);
      });

      it('should be not emitted if it is not the left button', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.itemCloseRequested.connect(() => { called = true; });
        Widget.attach(tabBar, document.body);
        let nodes = tabBar.node.querySelectorAll('.p-Tab-close');
        let node = nodes[0] as HTMLElement;
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let args = {
          clientX: rect.left + 1,
          clientY: rect.top + 1,
          button: 1
        };
        triggerMouseEvent(node, 'click', args);
        expect(called).to.be(false);
        Widget.detach(tabBar);
      });

      it('should be not emitted if the click is not on the close node', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.itemCloseRequested.connect(() => { called = true; });
        Widget.attach(tabBar, document.body);
        let nodes = tabBar.node.querySelectorAll('.p-Tab-close');
        let node = nodes[0] as HTMLElement;
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let args = { clientX: rect.left + 100, clientY: rect.top + 1 };
        triggerMouseEvent(node, 'click', args);
        expect(called).to.be(false);
        Widget.detach(tabBar);
      });

    });

    describe('#currentItem', () => {

      it('should get the currently selected tab item', () => {
        let tabBar = createTabBar();
        expect(tabBar.currentItem).to.be(tabBar.items.get(0));
      });

      it('should set the currently selected tab item', () => {
        let tabBar = createTabBar();
        tabBar.currentItem = tabBar.items.get(1);
        expect(tabBar.currentItem).to.be(tabBar.items.get(1));
      });

      it('should be a pure delegate to the currentItemProperty', () => {
        let tabBar = createTabBar();
        TabBar.currentItemProperty.set(tabBar, tabBar.items.get(1));
        expect(tabBar.currentItem).to.be(tabBar.items.get(1));
        tabBar.currentItem = tabBar.items.get(0);
        let item = TabBar.currentItemProperty.get(tabBar);
        expect(item).to.be(tabBar.items.get(0));
      });

    });

    describe('#currentItemChanged', () => {

      it('should be emitted when the curent tab item is changed', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.currentItemChanged.connect((tabBar, args) => {
          expect(args.name).to.be('currentItem');
          expect(args.oldValue).to.be(tabBar.items.get(0));
          expect(args.newValue).to.be(tabBar.items.get(1));
          called = true;
        });
        tabBar.currentItem = tabBar.items.get(1);
      });

    });

    describe('#items', () => {

      it('should get the list of tab items for the tab bar', () => {
        let tabBar = new TabBar<Widget>();
        expect(tabBar.items).to.be(null);
      });

      it('should set the list of tab items for the tab bar', () => {
        let tabBar = createTabBar();
        expect(tabBar.items.length).to.be(2);
        expect(tabBar.items.get(0).title.text).to.be('0');
        expect(tabBar.items.get(1).title.text).to.be('1');
      });

      it('should be a pure delegate to the itemsProperty', () => {
        let tabBar = new TabBar<Widget>();
        let widget0 = createContent('0');
        let widget1 = createContent('1');
        let items = new ObservableList<Widget>([widget0, widget1]);
        TabBar.itemsProperty.set(tabBar, items);
        expectListEqual(tabBar.items, items);
        items = new ObservableList<Widget>([widget1, widget0]);
        tabBar.items = items;
        expectListEqual(TabBar.itemsProperty.get(tabBar), items);
      });

      it('should handle an `add`', () => {
        let tabBar = createTabBar();
        let widget = createContent('2');
        tabBar.items.add(widget);
        expect(tabBar.items.length).to.be(3);
        expect(tabBar.contentNode.children[2].textContent).to.be('2');
      });

      it('should handle a `move`', () => {
        let tabBar = createTabBar();
        tabBar.items.move(1, 0);
        expect(tabBar.currentItem).to.be(tabBar.items.get(1));
      });

      it('should handle a `remove`', () => {
        let tabBar = createTabBar();
        let item = tabBar.items.get(1);
        tabBar.items.removeAt(0);
        expect(tabBar.currentItem).to.be(item);
      });

      it('should handle a `replace`', () => {
        let tabBar = createTabBar();
        let items = [createContent('2'), createContent('3')];
        tabBar.items.replace(0, 1, items);
        expect(tabBar.items.length).to.be(3);
        expect(tabBar.contentNode.children[2].textContent).to.be('3');
      });

      it('should handle a `set`', () => {
        let tabBar = createTabBar();
        let widget = createContent('2');
        tabBar.items.set(0, widget);
        expect(tabBar.items.get(0)).to.be(widget);
        expect(tabBar.currentItem).to.be(widget);
      });

      it('should handle title changes', () => {
        let tabBar = createTabBar();
        let title = tabBar.items.get(0).title;
        title.text = 'foo';
        expect(tabBar.items.get(0).title.text).to.be('foo');
        tabBar.items.get(0).title.icon = 'bar';
        expect(tabBar.items.get(0).title.icon).to.be('bar');
        title.closable = false;
        expect(tabBar.items.get(0).title.closable).to.be(false);
        title.className = 'baz';
        expect(tabBar.items.get(0).title.className).to.be('baz');
      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        let tabBar = new TabBar<Widget>();
        expect(tabBar.tabsMovable).to.be(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let tabBar = new TabBar<Widget>();
        tabBar.tabsMovable = true;
        expect(tabBar.tabsMovable).to.be(true);
      });

      it('should be a pure delegate to the tabsMovableProperty', () => {
        let tabBar = new TabBar<Widget>();
        TabBar.tabsMovableProperty.set(tabBar, true);
        expect(tabBar.tabsMovable).to.be(true);
        tabBar.tabsMovable = false;
        expect(TabBar.tabsMovableProperty.get(tabBar)).to.be(false);
      });

    });

    describe('#headerNode', () => {

      it('should have a `p-TabBar-header` class', () => {
        let tabBar = new TabBar<Widget>();
        expect(tabBar.headerNode.className).to.be('p-TabBar-header');
      });

    });

    describe('#bodyNode', () => {

      it('should have a `p-TabBar-body` class', () => {
        let tabBar = new TabBar<Widget>();
        expect(tabBar.bodyNode.className).to.be('p-TabBar-body');
      });

    });

    describe('#contentNode', () => {

      it('should have a `p-TabBar-content` class', () => {
        let tabBar = new TabBar<Widget>();
        expect(tabBar.contentNode.className).to.be('p-TabBar-content');
      });

    });

    describe('#footerNode', () => {

      it('should have a `p-TabBar-footer` class', () => {
        let tabBar = new TabBar<Widget>();
        expect(tabBar.footerNode.className).to.be('p-TabBar-footer');
      });

    });

    describe('#releaseMouse', () => {

      it('should stop mouse events and restore tabs', () => {
        let tabBar = new TearOffTabBar();
        tabBar.tabsMovable = true;
        let widgets = [createContent('0'), createContent('1')];
        tabBar.items = new ObservableList<Widget>(widgets);
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientY: rect.top };
        let opts2 = { clientX: -200, clientY: rect.bottom };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('releaseMouse')).to.not.be(-1);
        tabBar.events = [];
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.events.indexOf('mousemove')).to.be(-1);
        Widget.detach(tabBar);
      });

    });

    describe('#onTearOffRequest', () => {

      it('should be invoked on a `tearoff-request`', () => {
        let tabBar = createTabBar();
        let widget = tabBar.items.get(0);
        let msg = new TearOffMessage<Widget>(widget, 0, 0);
        sendMessage(tabBar, msg);
        expect(tabBar.methods[0]).to.be('onTearOffRequest');
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `tear-off-request`', () => {
          let tabBar = createTabBar();
          let widget = tabBar.items.get(0);
          let msg = new TearOffMessage<Widget>(widget, 0, 0);
          sendMessage(tabBar, msg);
          expect(tabBar.messages[0]).to.be('tear-off-request');
        });

        it('should have an `item` property', () => {
          let tabBar = createTabBar();
          let widget = tabBar.items.get(0);
          let msg = new TearOffMessage<Widget>(widget, 0, 0);
          expect(msg.item).to.be(widget);
        });

        it('should have a `clientX` property', () => {
          let tabBar = createTabBar();
          let widget = tabBar.items.get(0);
          let msg = new TearOffMessage<Widget>(widget, 0, 0);
          expect(msg.clientX).to.be(0);
        });

        it('should have a `clientY` property', () => {
          let tabBar = createTabBar();
          let widget = tabBar.items.get(0);
          let msg = new TearOffMessage<Widget>(widget, 0, 0);
          expect(msg.clientY).to.be(0);
        });

      });

      it('should be called when a tab is detached leftward', (done) => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[1] as HTMLElement;
        let left = tabBar.contentNode.getBoundingClientRect().left;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: left - 200, clientY: rect.top + 1 };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.not.be(-1);
        triggerMouseEvent(tab, 'mouseup', opts2);
        // wait for the transition to complete
        setTimeout(() => {
          Widget.detach(tabBar);
          done();
        }, 500);
      });

      it('should be called when a tab is torn off downward', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let top = tabBar.contentNode.getBoundingClientRect().top;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: rect.left + 1, clientY: top - 200 };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.not.be(-1);
        Widget.detach(tabBar);
      });

      it('should be called when a tab is torn off upward', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let bottom = tabBar.contentNode.getBoundingClientRect().bottom;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: rect.left + 1, clientY: bottom + 200 };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.not.be(-1);
        Widget.detach(tabBar);
      });

      it('should be called when a tab is torn off rightward', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let right = tabBar.contentNode.getBoundingClientRect().right;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: right + 200, clientY: rect.top + 1 };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.not.be(-1);
        Widget.detach(tabBar);
      });

      it('should not be called when a tab is not moved far enough', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: rect.left, clientY: rect.top + 1 };
        triggerMouseEvent(tab, 'mousedown', opts1);
        // next event should be ignored
        triggerMouseEvent(tab, 'mousedown', opts2);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.be(-1);
        triggerMouseEvent(tab, 'mouseup', opts2);
        Widget.detach(tabBar);
      });

      it('should not be called when the left button is not used', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = {
          clientX: rect.left + 1,
          clientY: rect.top + 1,
          button: 1
        };
        let opts2 = {
          clientX: -200,
          clientY: rect.top + 1,
          button: 1
        };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.be(-1);
        triggerMouseEvent(tab, 'mouseup', opts2);
        Widget.detach(tabBar);
      });

      it('should not be called when tab is not selected', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: -10 };
        let opts2 = { clientX: -200, clientY: rect.bottom };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.be(-1);
        triggerMouseEvent(tab, 'mouseup', opts2);
        Widget.detach(tabBar);
      });

      it('should not be called when a close node is selected', () => {
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        Widget.attach(tabBar, document.body);
        let nodes = tabBar.node.querySelectorAll('.p-Tab-close');
        let node = nodes[0] as HTMLElement;
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: -200, clientY: rect.top + 1 };
        triggerMouseEvent(node, 'mousedown', opts1);
        triggerMouseEvent(node, 'mousemove', opts2);
        expect(tabBar.methods.indexOf('onTearOffRequest')).to.be(-1);
        triggerMouseEvent(node, 'mouseup', opts2);
        Widget.detach(tabBar);
      });

    });

    describe('#onAfterAttach()', () => {

      it('should be invoked just after the tab bar is attached', () => {
        let tabBar = new LogTabBar();
        Widget.attach(tabBar, document.body);
        expect(tabBar.methods.indexOf('onAfterAttach')).to.not.be(-1);
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `after-attach`', () => {
          let tabBar = new LogTabBar();
          Widget.attach(tabBar, document.body);
          expect(tabBar.messages[0]).to.be('after-attach');
        });

      });

      it('should add event listeners for click and mousedown', () => {
        let tabBar = new LogTabBar();
        let called = false;
        Widget.attach(tabBar, document.body);
        expect(tabBar.methods.indexOf('onAfterAttach')).to.not.be(-1);
        expect(tabBar.messages.indexOf('after-attach')).to.not.be(-1);
        triggerMouseEvent(tabBar.node, 'click');
        expect(tabBar.events.indexOf('click')).to.not.be(-1);
        triggerMouseEvent(tabBar.node, 'mousedown');
        expect(tabBar.events.indexOf('mousedown')).to.not.be(-1);
        Widget.detach(tabBar);
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should be invoked just before the tab bar is detached', () => {
        let tabBar = new LogTabBar();
        Widget.attach(tabBar, document.body);
        Widget.detach(tabBar);
        expect(tabBar.methods.indexOf('onBeforeDetach')).to.not.be(-1);
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `before-detach`', () => {
          let tabBar = new LogTabBar();
          Widget.attach(tabBar, document.body);
          tabBar.messages = [];
          Widget.detach(tabBar);
          expect(tabBar.messages[0]).to.be('before-detach');
        });

      });

      it('should remove event listeners for click and mousedown', () => {
        let tabBar = new LogTabBar();
        Widget.attach(tabBar, document.body);
        Widget.detach(tabBar);
        expect(tabBar.methods.indexOf('onBeforeDetach')).to.not.be(-1);
        expect(tabBar.messages.indexOf('before-detach')).to.not.be(-1);
        triggerMouseEvent(tabBar.node, 'click');
        expect(tabBar.events.indexOf('click')).to.be(-1);
        triggerMouseEvent(tabBar.node, 'mousedown');
        expect(tabBar.events.indexOf('mousedown')).to.be(-1);
      });

    });

    describe('#onUpdateRequest', () => {

      it('should be invoked when an update is requested', () => {
        let tabBar = new LogTabBar();
        sendMessage(tabBar, Widget.MsgUpdateRequest);
        expect(tabBar.methods[0]).to.be('onUpdateRequest');
      });

      context('`msg` parameter', () => {

        it('should have a `type` of `update-request`', () => {
          let tabBar = new LogTabBar();
          sendMessage(tabBar, Widget.MsgUpdateRequest);
          expect(tabBar.messages[0]).to.be('update-request');
        });

      });

      it('should update the style and classes of the tabs', () => {
        let tabBar = createTabBar();
        Widget.attach(tabBar, document.body);
        tabBar.currentItem = tabBar.items.get(1);
        sendMessage(tabBar, Widget.MsgUpdateRequest);
        expect(tabBar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
        expect(tabBar.messages.indexOf('update-request')).to.not.be(-1);
        let node0 = tabBar.contentNode.children[0] as HTMLElement;
        let node1 = tabBar.contentNode.children[1] as HTMLElement;
        expect(node0.className.indexOf('p-mod-first')).to.not.be(-1);
        expect(node1.className.indexOf('p-mod-current')).to.not.be(-1);
        expect(node1.className.indexOf('p-mod-last')).to.not.be(-1);
        expect(node0.style.zIndex).to.be('1');
        expect(node1.style.zIndex).to.be('2');
        expect(node0.style.order).to.be('0');
        expect(node1.style.order).to.be('1');
        Widget.detach(tabBar);
      });

    });

  });

});
