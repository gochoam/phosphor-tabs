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
        expect(called).to.be(true);
      });
    });

  });

});
