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
  Property
} from 'phosphor-properties';

import {
  Signal
} from 'phosphor-signaling';

import {
  StackedPanel
} from 'phosphor-stackedpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  Tab, TabBar, TabPanel
} from '../../lib/index';


function createContent(title: string): Widget {
  var widget = new Widget();
  TabPanel.setTab(widget, new Tab(title));
  return widget;
}


describe('phosphor-tabs', () => {

  describe('TabPanel', () => {

    describe('.p_TabPanel', () => {

      it('should be `p-TabPanel`', () => {
        expect(TabPanel.p_TabPanel).to.be('p-TabPanel');
      });

    });

    describe('.currentChangedSignal', () => {

      it('should be a Signal', () => {
        expect(TabPanel.currentChangedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabProperty', () => {

      it('should be a Property', () => {
        expect(TabPanel.tabProperty instanceof Property).to.be(true);
      });

      it('should default to `null`', () => {
        var tabPanel = new TabPanel();
        expect(TabPanel.tabProperty.get(tabPanel)).to.be(null);
      });

    });

    describe('.getTab', () => {

      it('should get the tab for the given widget', () => {
        var tabPanel = new TabPanel();
        var tab = new Tab('1');
        TabPanel.setTab(tabPanel, tab);
        expect(TabPanel.getTab(tabPanel)).to.eql(tab);
      });

      it('should be a pure delegate to `tabProperty`', () => {
        var tabPanel = new TabPanel();
        var tab = new Tab('1');
        TabPanel.tabProperty.set(tabPanel, tab);
        expect(TabPanel.getTab(tabPanel)).to.eql(tab);
        expect(TabPanel.tabProperty.get(tabPanel)).to.eql(tab);
      });

    });

    describe('.setTab', () => {

      it('should set the tab for the given widget', () => {
        var tabPanel = new TabPanel();
        var tab = new Tab('1');
        expect(TabPanel.getTab(tabPanel)).to.be(null);
        TabPanel.setTab(tabPanel, tab);
        expect(TabPanel.getTab(tabPanel)).to.eql(tab);
      });

      it('should be a pure delegate to `tabProperty`', () => {
        var tabPanel = new TabPanel();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        TabPanel.setTab(tabPanel, tab0);
        expect(TabPanel.tabProperty.get(tabPanel)).to.eql(tab0);
      });

    });

    describe('#constructor()', () => {

     it('should accept no arguments', () => {
        var tabPanel = new TabPanel();
        expect(tabPanel instanceof TabPanel).to.be(true);
     });

     it('should add the `p-TabPanel` class', () => {
        var tabPanel = new TabPanel();
        expect(tabPanel.hasClass(TabPanel.p_TabPanel)).to.be(true);
     });

     it('should add a TabBar and a StackPanel', () => {
        var tabPanel = new TabPanel();
        expect(tabPanel.childAt(0) instanceof TabBar).to.be(true);
        expect(tabPanel.childAt(1) instanceof StackedPanel).to.be(true);
     });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        var widget = createContent('red');
        var tabPanel = new TabPanel();
        tabPanel.addWidget(widget);
        tabPanel.dispose();
        expect(() => { tabPanel.widgets.length; } ).to.throwError();
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current widget is changed', () => {
        var called = false;
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1]
        tabPanel.currentChanged.connect(() => { called = true; });
        tabPanel.currentWidget = widget1;
        expect(called).to.be(true);
      });

    });

    describe('#currentWidget', () => {

      it('should get the currently selected widget', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1]
        expect(tabPanel.currentWidget).to.eql(widget0);
      });

      it('should set the currently selected widget', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1]
        tabPanel.currentWidget = widget1;
        expect(tabPanel.currentWidget).to.eql(widget1);
      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        var tabPanel = new TabPanel();
        expect(tabPanel.tabsMovable).to.be(true);
      });

      it('should set whether the tabs are movable by the user', () => {
        var tabPanel = new TabPanel();
        tabPanel.tabsMovable = false;
        expect(tabPanel.tabsMovable).to.be(false);
      });

    });

    describe('#widgets', () => {

      it('should get a shallow copy of the array of widgets', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        expect(tabPanel.widgets).to.eql([widget0, widget1]);
      });

      it('should set the widgets for the tab panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        tabPanel.widgets = [widget1, widget0]
        expect(tabPanel.widgets).to.eql([widget1, widget0]);
      });

    });

    describe('#widgetCount', () => {

      it('should get the number of widgets in the tab panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        expect(tabPanel.widgetCount).to.be(2);
      });

      it('should be ready-only', () => {
        var tabPanel = new TabPanel();
        expect(() => { tabPanel.widgetCount = 0; }).to.throwError();
      });

    });

    describe('#widgetAt()', () => {

      it('should get the widget at a specific index', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        expect(tabPanel.widgetAt(0)).to.eql(widget0);
        expect(tabPanel.widgetAt(1)).to.eql(widget1);
      });

      it('should return `undefined` if the index is out of range', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        expect(tabPanel.widgetAt(-1)).to.be(void 0);
        expect(tabPanel.widgetAt(3)).to.be(void 0);
      });

    });

    describe('#widgetIndex()', () => {

      it('should get the index of a specific widget', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        expect(tabPanel.widgetIndex(widget0)).to.be(0);
        expect(tabPanel.widgetIndex(widget1)).to.be(1);
      });

      it('should return `-1` if the widget is not contained in the tab panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0];
        expect(tabPanel.widgetIndex(widget1)).to.be(-1);
      });

    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0];
        tabPanel.addWidget(widget1);
        expect(tabPanel.widgetIndex(widget1)).to.be(1);
      });

      it('should move an existing widget to the end of the panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1];
        tabPanel.addWidget(widget0);
        expect(tabPanel.widgetIndex(widget0)).to.be(1);
        expect(tabPanel.widgets.length).to.be(2);
      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget into the panel at the given index', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget2];
        tabPanel.insertWidget(1, widget1);
        expect(tabPanel.widgetIndex(widget1)).to.be(1);
      });

      it('should be clamped to the bounds of the widgets', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget2];
        tabPanel.insertWidget(3, widget1);
        expect(tabPanel.widgetIndex(widget1)).to.be(2);
        tabPanel.insertWidget(-1, widget1);
        expect(tabPanel.widgetIndex(widget1)).to.be(0);
      });

      it('should fail if the `TabPanel.tab` property as not been set', () => {
        var widget = new Widget();
        var tabPanel = new TabPanel();
        expect(() => { tabPanel.insertWidget(0, widget); }).to.throwError();
      });

    });

    describe('#moveWidget()', () => {

      it('should move a widget from one index to another', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1, widget2];
        tabPanel.moveWidget(0, 2);
        expect(tabPanel.widgetIndex(widget0)).to.be(2);
      });

      it('should return `false` if index out of range', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1, widget2];
        expect(tabPanel.moveWidget(1, 3)).to.be(false);
        expect(tabPanel.moveWidget(-1, 1)).to.be(false);
      });

    });

    describe('#removeWidgetAt()', () => {

      it('should remove the widget at a specific index', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1, widget2];
        expect(tabPanel.removeWidgetAt(0)).to.eql(widget0);
        expect(tabPanel.widgets.length).to.be(2);
      });

      it('should return `undefined` if index out of range', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1, widget2];
        expect(tabPanel.removeWidgetAt(-1)).to.be(void 0);
        expect(tabPanel.removeWidgetAt(3)).to.be(void 0);
        expect(tabPanel.widgets.length).to.be(3);
      });

    });

    describe('#removeWidget()', () => {

      it('should remove the widget from the panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1, widget2];
        expect(tabPanel.removeWidget(widget1)).to.eql(1);
        expect(tabPanel.widgets.length).to.be(2);
      });

      it('should return `-1` if not contained in the panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget2];
        expect(tabPanel.removeWidget(widget1)).to.be(-1);
      });

    });

    describe('#clearWidgets()', () => {

      it('should remove all widgets from the panel', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        tabPanel.widgets = [widget0, widget1, widget2];
        tabPanel.clearWidgets();
        expect(tabPanel.widgets.length).to.be(0);
      });

    });

    context('when the `tabCloseRequested` signal is emitted', () => {

      it('should close the targeted widget', () => {
        var widget0 = createContent('red');
        var widget1 = createContent('green');
        var widget2 = createContent('blue');
        var tabPanel = new TabPanel();
        var tab = TabPanel.getTab(widget1);
        var tabBar = tabPanel.childAt(0) as TabBar;
        tabPanel.widgets = [widget0, widget1, widget2];
        tabBar.tabCloseRequested.emit({ index: 1, tab: tab });
        requestAnimationFrame(() => {
          expect(tabPanel.widgets).to.eql([widget0, widget2]);
        });

      });

    });

  });

});
