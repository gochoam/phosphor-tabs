/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import expect = require('expect.js');

// import {
//   Message
// } from 'phosphor-messaging';

// import {
//   IChangedArgs
// } from 'phosphor-properties';

// import {
//   StackedPanel
// } from 'phosphor-stackedpanel';

// import {
//   Widget
// } from 'phosphor-widget';

// import {
//   TabBar, TabPanel
// } from '../../lib/index';


// class LogWidget extends Widget {

//   messages: string[] = [];

//   processMessage(msg: Message): void {
//     super.processMessage(msg);
//     this.messages.push(msg.type);
//   }
// }


// class LogTabPanel extends TabPanel {

//   static messages: string[] = [];

//   static methods: string[] = [];

//   processMessage(msg: Message): void {
//     super.processMessage(msg);
//     LogTabPanel.messages.push(msg.type);
//   }

//   protected onCurrentItemChanged(sender: TabBar<Widget>, args: IChangedArgs<Widget>): void {
//     super.onCurrentItemChanged(sender, args);
//     LogTabPanel.methods.push('onCurrentItemChanged');
//   }

//   protected onItemCloseRequested(sender: TabBar<Widget>, args: Widget): void {
//     super.onItemCloseRequested(sender, args);
//     LogTabPanel.methods.push('onItemCloseRequested');
//   }
// }


// class CustomPanel extends TabPanel {

//   static createTabBar(): TabBar<Widget> {
//     let bar = new TabBar<Widget>();
//     bar.id = 'custom-tab-bar';
//     return bar;
//   }

//   static createStackedPanel(): StackedPanel {
//     let stack = new StackedPanel();
//     stack.id = 'custom-stacked-panel';
//     return stack;
//   }
// }


// function createContent(title: string): Widget {
//   let widget = new LogWidget();
//   widget.title.text = title;
//   return widget;
// }


// function createTabPanel(): LogTabPanel {
//   let tabPanel = new LogTabPanel();
//   tabPanel.widgets.assign([createContent('0'), createContent('1')]);
//   return tabPanel;
// }


describe('phosphor-tabs', () => {

  describe('stub', () => {

    it('should pass', () => {

    });

  });

  // describe('TabPanel', () => {

  //   describe('.createTabBar()', () => {

  //     it('should create a TabBar', () => {
  //       let bar = TabPanel.createTabBar();
  //       expect(bar instanceof TabBar).to.be(true);
  //       expect(bar.id).to.be('');
  //     });

  //     it('should be overridable by a subclass', () => {
  //       let bar = CustomPanel.createTabBar();
  //       expect(bar instanceof TabBar).to.be(true);
  //       expect(bar.id).to.be('custom-tab-bar');
  //     });

  //     it('should be called to create the tab bar', () => {
  //       let panel = new CustomPanel();
  //       expect(panel.tabs.id).to.be('custom-tab-bar');
  //     });

  //   });

  //   describe('.createStackedPanel()', () => {

  //     it('should create a StackedPanel', () => {
  //       let stack = TabPanel.createStackedPanel();
  //       expect(stack instanceof StackedPanel).to.be(true);
  //       expect(stack.id).to.be('');
  //     });

  //     it('should be overridable by a subclass', () => {
  //       let stack = CustomPanel.createStackedPanel();
  //       expect(stack instanceof StackedPanel).to.be(true);
  //       expect(stack.id).to.be('custom-stacked-panel');
  //     });

  //     it('should be called to create the stacked panel', () => {
  //       let panel = new CustomPanel();
  //       expect(panel.stack.id).to.be('custom-stacked-panel');
  //     });

  //   });

  //   describe('#constructor()', () => {

  //     it('should accept no arguments', () => {
  //       let tabPanel = new TabPanel();
  //       expect(tabPanel instanceof TabPanel).to.be(true);
  //     });

  //     it('should add the `p-TabPanel` class', () => {
  //       let tabPanel = new TabPanel();
  //       expect(tabPanel.hasClass('p-TabPanel')).to.be(true);
  //     });

  //     it('should add a TabBar and a StackPanel', () => {
  //       let tabPanel = new TabPanel();
  //       expect(tabPanel.children.get(0) instanceof TabBar).to.be(true);
  //       expect(tabPanel.children.get(1) instanceof StackedPanel).to.be(true);
  //     });

  //   });

  //   describe('#dispose()', () => {

  //     it('should dispose of the resources held by the widget', () => {
  //       let tabPanel = new TabPanel();
  //       tabPanel.widgets.add(new Widget());
  //       tabPanel.dispose();
  //       expect(tabPanel.tabs).to.be(null);
  //     });

  //   });

  //   describe('#currentWidget', () => {

  //     it('should get the currently selected widget', () => {
  //       let tabPanel = new TabPanel();
  //       let widget = new Widget();
  //       tabPanel.widgets.add(widget);
  //       expect(tabPanel.currentWidget).to.be(widget);
  //     });

  //     it('should set the currently selected widget', () => {
  //       let tabPanel = new TabPanel();
  //       let widget0 = new Widget();
  //       let widget1 = new Widget();
  //       tabPanel.widgets.assign([widget0, widget1]);
  //       expect(tabPanel.currentWidget).to.be(widget0);
  //       tabPanel.currentWidget = widget1;
  //       expect(tabPanel.currentWidget).to.be(widget1);
  //     });

  //     it('should be an alias to the currentItem property of the tab bar', () => {
  //       let tabPanel = new TabPanel();
  //       let widget0 = new Widget();
  //       let widget1 = new Widget();
  //       tabPanel.widgets.assign([widget0, widget1]);
  //       expect(tabPanel.currentWidget).to.be(widget0);
  //       expect(tabPanel.tabs.currentItem).to.be(widget0);
  //       tabPanel.tabs.currentItem = widget1;
  //       expect(tabPanel.currentWidget).to.be(widget1);
  //     });

  //   });

  //   describe('#tabsMovable', () => {

  //     it('should get whether the tabs are movable by the user', () => {
  //       let tabPanel = new TabPanel();
  //       expect(tabPanel.tabsMovable).to.be(false);
  //     });

  //     it('should set whether the tabs are movable by the user', () => {
  //       let tabPanel = new TabPanel();
  //       tabPanel.tabsMovable = true;
  //       expect(tabPanel.tabsMovable).to.be(true);
  //     });

  //     it('should be an alias to the tabsMovable property of the tab bar', () => {
  //       let tabPanel = new TabPanel();
  //       tabPanel.tabs.tabsMovable = true;
  //       expect(tabPanel.tabsMovable).to.be(true);
  //       tabPanel.tabsMovable = false;
  //       expect(tabPanel.tabs.tabsMovable).to.be(false);
  //     });

  //   });

  //   describe('#widgets', () => {

  //     it('should get the observable list of widgets for the panel', () => {
  //       let tabPanel = createTabPanel();
  //       let called = false;
  //       expect(tabPanel.widgets.length).to.be(2);
  //       tabPanel.widgets.changed.connect(() => { called = true; });
  //       tabPanel.widgets.move(0, 1);
  //       expect(called).to.be(true);
  //     });

  //     it('should be read-only', () => {
  //       let tabPanel = createTabPanel();
  //       expect(() => { tabPanel.widgets = null; }).to.throwError();
  //     });

  //     it('should be an alias of the children property of the stacked panel', () => {
  //       let tabPanel = createTabPanel();
  //       expect(tabPanel.widgets.get(0)).to.be(tabPanel.stack.children.get(0));
  //       tabPanel.stack.children.move(0, 1);
  //       expect(tabPanel.widgets.get(0)).to.be(tabPanel.stack.children.get(0));
  //     });

  //   });

  //   describe('#tabs', () => {

  //     it('should get the tab bar associated with the tab panel', () => {
  //       let tabPanel = createTabPanel();
  //       expect(tabPanel.tabs instanceof TabBar).to.be(true);
  //     });

  //     it('should synchronize the items with the children of the stack panel', () => {
  //       let tabPanel = createTabPanel();
  //       let item = tabPanel.widgets.get(1);
  //       tabPanel.tabs.currentItem = item;
  //       expect(tabPanel.stack.currentWidget).to.be(item);
  //     });

  //     it('should be read only', () => {
  //       let tabPanel = createTabPanel();
  //       expect(() => { tabPanel.tabs = null; }).to.throwError();
  //     });

  //   });

  //   describe('#stack', () => {

  //     it('should get the stacked panel associated with the tab panel', () => {
  //       let tabPanel = createTabPanel();
  //       expect(tabPanel.stack instanceof StackedPanel).to.be(true);
  //     });

  //     it('should synchronize the children with the items in the tab bar', () => {
  //       let tabPanel = createTabPanel();
  //       let item = tabPanel.widgets.get(1);
  //       tabPanel.tabs.currentItem = item;
  //       expect(tabPanel.stack.currentWidget).to.be(item);
  //     });

  //     it('should be read only', () => {
  //       let tabPanel = createTabPanel();
  //       expect(() => { tabPanel.stack = null; }).to.throwError();
  //     });

  //   });

  //   describe('#onCurrentItemChanged', () => {

  //     it('should synchronize the current tab with the current widget of the stacked panel', () => {
  //       let tabPanel = createTabPanel();
  //       let item = tabPanel.widgets.get(1);
  //       LogTabPanel.methods = [];
  //       tabPanel.tabs.currentItem = item;
  //       expect(LogTabPanel.methods.indexOf('onCurrentItemChanged')).to.not.be(-1);
  //       expect(tabPanel.stack.currentWidget).to.be(item);
  //     });

  //   });

  //   describe('#onItemCloseRequested', () => {

  //     it('should close the widget if the widget is closable', () => {
  //       let tabPanel = createTabPanel();
  //       let called = false;
  //       let widget = tabPanel.widgets.get(0);
  //       widget.title.closable = true;
  //       Widget.attach(tabPanel, document.body);
  //       LogTabPanel.methods = [];
  //       tabPanel.tabs.itemCloseRequested.emit(widget);
  //       let index = LogTabPanel.methods.indexOf('onItemCloseRequested');
  //       expect(index).to.not.be(-1);
  //     });

  //   });

  // });

});
