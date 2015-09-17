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
  attachWidget
} from 'phosphor-widget';

import {
  ACTIVE_CLASS, CONTENT_CLASS, DRAGGING_CLASS, FIRST_CLASS, FOOTER_CLASS, 
  HEADER_CLASS, LAST_CLASS, TAB_BAR_CLASS, Tab, TabBar
} from '../../lib/index';


describe('phosphor-tabs', () => {

  describe('TAB_BAR_CLASS', () => {

    it('should be `p-TabBar`', () => {
      expect(TAB_BAR_CLASS).to.be('p-TabBar');
    });

  });

  describe('HEADER_CLASS', () => {

    it('should be `p-TabBar-header`', () => {
      expect(HEADER_CLASS).to.be('p-TabBar-header');
    });

  });

  describe('CONTENT_CLASS', () => {

    it('should be `p-TabBar-content`', () => {
      expect(CONTENT_CLASS).to.be('p-TabBar-content');
    });

  });

  describe('FOOTER_CLASS', () => {

    it('should be `p-TabBar-footer`', () => {
      expect(FOOTER_CLASS).to.be('p-TabBar-footer');
    });

  });

  describe('DRAGGING_CLASS', () => {

    it('should be `p-mod-dragging`', () => {
      expect(DRAGGING_CLASS).to.be('p-mod-dragging');
    });

  });

  describe('ACTIVE_CLASS', () => {

    it('should be `p-mod-active`', () => {
      expect(ACTIVE_CLASS).to.be('p-mod-active');
    });

  });

  describe('FIRST_CLASS', () => {

    it('should be `p-mod-first`', () => {
      expect(FIRST_CLASS).to.be('p-mod-first');
    });

  });

  describe('LAST_CLASS', () => {

    it('should be `p-mod-last`', () => {
      expect(LAST_CLASS).to.be('p-mod-last');
    });

  });

  describe('Tabbar', () => {

    describe('.createNode()', () => {

      it('should create a DOM node for a tabbar', () => {
        var node = TabBar.createNode();
        var children = node.children;
        expect(children.length).to.be(3);
        expect(children[0].classList.contains(HEADER_CLASS)).to.be(true);
        expect(children[1].classList.contains(CONTENT_CLASS)).to.be(true);
        expect(children[2].classList.contains(FOOTER_CLASS)).to.be(true);
      });

    });

    describe('.tabMovedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabMovedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabSelectedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabSelectedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabCloseRequestedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabCloseRequestedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabDetachRequestedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabDetachRequestedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.selectedTabProperty', () => {

      it('should be a property', () => {
        expect(TabBar.selectedTabProperty instanceof Property).to.be(true);
      });

      it('should default to `null`', () => {
        var tabBar = new TabBar();
        expect(TabBar.selectedTabProperty.get(tabBar)).to.be(null);
      });

    });

    describe('.tabsMovableProperty', () => {

      it('should be a property', () => {
        expect(TabBar.tabsMovableProperty instanceof Property).to.be(true);
      });

      it('should default to `true`', () => {
        var tabBar = new TabBar();
        expect(TabBar.tabsMovableProperty.get(tabBar)).to.be(true);
      });

    });

    describe('#constructor()', () => {

     it('should accept no argumentst', () => {
       var tabBar = new TabBar();
       expect(tabBar instanceof TabBar).to.be(true);
     });

     it('should add the TAB_BAR_CLASS', () => {
       var tabBar = new TabBar();
       expect(tabBar.hasClass(TAB_BAR_CLASS)).to.be(true);
     });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        var tabBar = new TabBar();
        var tab = new Tab();
        tabBar.tabs = [tab];
        tabBar.dispose();
        expect(tabBar.tabs.length).to.be(0);
      });

    });

    describe('#tabMoved', () => {

      it('should be emitted when a tab is moved', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        tabBar.tabMoved.connect(() => { called = true; })
        tabBar.moveTab(1, 0);
        expect(called).to.be(true);
      });

    });

    describe('#tabSelected', () => {

      it('should be emitted when a tab is moved', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        tabBar.tabSelected.connect(() => { called = true; })
        tabBar.selectedTab = tab1;
        expect(called).to.be(true);
      });

    });

    describe('#tabCloseRequested', () => {

      it('should be emitted when a tab is closed', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tab0.closable = true;
        tab0.selected = true;
        attachWidget(tabBar, document.body);
        tab0.closeIconNode.click();
        // TODO: hook this up
        return;
        expect(called).to.be(true);
      });

    });

    describe('#tabDetachRequested', () => {

      it('should be emitted when a tab is detached', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        tabBar.tabDetachRequested.connect(() => { called = true; })
        // TODO: simulate a mouse click
        return;
        expect(called).to.be(true);
      });
    });

    describe('#previousTab', () => {

      it('should give the previous tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        tabBar.selectedTab = tab1;
        tabBar.selectedTab = tab0;
        expect(tabBar.previousTab).to.eql(tab1);
      });

      it('should be read-only', () => {
        var tabBar = new TabBar();
        expect(() => { tabBar.previousTab = null } ).to.throwError();
      });

    });

    describe('#previousTab', () => {

      it('should give the selected tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.selectedTab).to.be(tab0);
        tabBar.selectedTab = tab1;
        expect(tabBar.selectedTab).to.eql(tab1);
      });

      it('should be a pure delegate to the selectedTabProperty', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.selectedTab).to.be(tab0);
        expect(TabBar.selectedTabProperty.get(tabBar)).to.eql(tab0);
        TabBar.selectedTabProperty.set(tabBar, tab1);
        expect(tabBar.selectedTab).to.eql(tab1);
      });

    });

    describe('#tabsMovable', () => {

      it('should be a read/write boolean', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabsMovable).to.be(true);
        tabBar.tabsMovable = false;
        expect(tabBar.tabsMovable).to.be(false);
      });

      it('should be a pure delegate to the tabsMovableProperty', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabsMovable).to.be(true);
        expect(TabBar.tabsMovableProperty.get(tabBar)).to.be(true);
        TabBar.tabsMovableProperty.set(tabBar, false);
        expect(tabBar.tabsMovable).to.be(false);
      });

    });

    describe('#tabs', () => {

      it('should be a list of tab objects', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabs.length).to.be(2);
        tabBar.tabs = [tab1];
        expect(tabBar.tabs.length).to.be(1);
      });

    });

    describe('#tabCount', () => {

      it('should the current number of tabs', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabCount).to.be(2);
        tabBar.tabs = [tab1];
        expect(tabBar.tabCount).to.be(1);
      });

      it('should be read-only', () => {
        var tabBar = new TabBar();
        expect(() => { tabBar.tabCount = 1; }).to.throwError();
      });

    });

    describe('#tabAt()', () => {

      it('should return the tab at the given index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabAt(0)).to.eql(tab0);
        expect(tabBar.tabAt(1)).to.eql(tab1);
      });

      it('should return `undefined` in the index is out of range', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabAt(2)).to.be(void 0);
        expect(tabBar.tabAt(-1)).to.be(void 0);
      });

    });

    describe('#tabIndex()', () => {

      it('should return index the given tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabIndex(tab0)).to.be(0);
        expect(tabBar.tabIndex(tab1)).to.be(1);
      });

      it('should return `-1` if the tab is not in the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0];
        expect(tabBar.tabIndex(tab1)).to.be(-1);
      });

    });

    describe('#addTab()', () => {

      it('should add a tab to the bar end of the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        tabBar.tabs = [tab0];
        var index = tabBar.addTab(tab1);
        expect(index).to.be(1);
        expect(tabBar.tabIndex(tab1)).to.be(1);
      });

      it('should move an existing tab to the end', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        var tab2 = new Tab();
        tabBar.tabs = [tab0, tab1, tab2];
        var index = tabBar.addTab(tab0);
        expect(index).to.be(2)
        expect(tabBar.tabIndex(tab0)).to.be(2);
      });

    });

    describe('#insertTab()', () => {

      it('should add a tab to the bar at the given index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        var tab2 = new Tab();
        tabBar.tabs = [tab0];
        var index = tabBar.insertTab(0, tab1);
        expect(index).to.be(0);
        expect(tabBar.tabIndex(tab1)).to.be(0);
        index = tabBar.insertTab(1, tab2);
        expect(index).to.be(1);
        expect(tabBar.tabIndex(tab2)).to.be(1);
      });

      it('should move an existing tab to the index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        var tab2 = new Tab();
        tabBar.tabs = [tab0, tab1, tab2];
        var index = tabBar.insertTab(0, tab2);
        expect(index).to.be(0);
        expect(tabBar.tabIndex(tab2)).to.be(0);
      });

      it('should clamp to the bounds of the tabs', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab();
        var tab1 = new Tab();
        var tab2 = new Tab();
        tabBar.tabs = [tab0];
        var index = tabBar.insertTab(-1, tab1);
        expect(index).to.be(0);
        expect(tabBar.tabIndex(tab1)).to.be(0);
        index = tabBar.insertTab(10, tab2);
        expect(index).to.be(2);
        expect(tabBar.tabIndex(tab2)).to.be(2);
      });

    });

    describe('#moveTab()', () => {

      it('should move a tab within the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('1');
        var tab1 = new Tab('2');
        var tab2 = new Tab('3');
        tabBar.tabs = [tab0, tab1, tab2];
        var success = tabBar.moveTab(0, 1);
        expect(success).to.be(true);
        expect(tabBar.tabIndex(tab0)).to.be(1);
        success = tabBar.moveTab(1, 2);
        expect(success).to.be(true);
        expect(tabBar.tabIndex(tab0)).to.be(2);
      });

      it('should return `false` if out of range', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('1');
        var tab1 = new Tab('2');
        var tab2 = new Tab('3');
        tabBar.tabs = [tab0, tab1, tab2];
        expect(tabBar.moveTab(0, -1)).to.be(false);
        expect(tabBar.moveTab(3, 0)).to.be(false);
      });
    });

  });

});
