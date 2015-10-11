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
  Tab
} from '../../lib/index';


describe('phosphor-tabs', () => {

  describe('Tab', () => {

    describe('.p_Tab', () => {

      it('should be `p-Tab`', () => {
        expect(Tab.p_Tab).to.be('p-Tab');
      });

    });

    describe('.p_Tab_text', () => {

      it('should be `p-Tab-text`', () => {
        expect(Tab.p_Tab_text).to.be('p-Tab-text');
      });

    });

    describe('.p_Tab_icon', () => {

      it('should be `p-Tab-icon`', () => {
        expect(Tab.p_Tab_icon).to.be('p-Tab-icon');
      });

    });

    describe('.p_Tab_close', () => {

      it('should be `p-Tab-close`', () => {
        expect(Tab.p_Tab_close).to.be('p-Tab-close');
      });

    });

    describe('.p_mod_selected', () => {

      it('should be `p-mod-selected`', () => {
        expect(Tab.p_mod_selected).to.be('p-mod-selected');
      });

    });

    describe('.p_mod_closable', () => {

      it('should be `p-mod-closable`', () => {
        expect(Tab.p_mod_closable).to.be('p-mod-closable');
      });

    });

    describe('.createNode()', () => {

      it('should create a DOM node for a tab', () => {
        var node = Tab.createNode();
        var children = node.children;
        expect(children.length).to.be(3);
        expect(children[0].classList.contains(Tab.p_Tab_icon)).to.be(true);
        expect(children[1].classList.contains(Tab.p_Tab_text)).to.be(true);
        expect(children[2].classList.contains(Tab.p_Tab_close)).to.be(true);
      });

    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        var tab = new Tab();
        expect(tab instanceof Tab).to.be(true);
        expect(tab.text).to.be('');
      });

      it('should accept a string argument', () => {
        var tab = new Tab('foo');
        expect(tab.text).to.be('foo');
      });

      it('should add the `p-Tab` class', () => {
        var tab = new Tab();
        expect(tab.hasClass(Tab.p_Tab)).to.be(true);
      });

    });

    describe('#text', () => {

      it('should be a string reflecting the text span', () => {
        var tab = new Tab('hello');
        expect(tab.text).to.be('hello');
        expect(tab.node.children[1].textContent).to.be('hello');
      });

      it('should be writable', () => {
        var tab = new Tab();
        tab.text = 'goodbye';
        expect(tab.text).to.be('goodbye');
        expect(tab.node.children[1].textContent).to.be('goodbye');
      });

    });

    describe('#selected', () => {

      it('should reflect `p-mod-selected` class', () => {
        var tab = new Tab();
        expect(tab.selected).to.be(false);
        expect(tab.hasClass(Tab.p_mod_selected)).to.be(false);
      });

      it('should be writable', () => {
        var tab = new Tab();
        tab.selected = true;
        expect(tab.hasClass(Tab.p_mod_selected)).to.be(true);
      });

    });

    describe('#closable', () => {

      it('should reflect `p-mod-closable`', () => {
        var tab = new Tab();
        expect(tab.closable).to.be(false);
        expect(tab.hasClass(Tab.p_mod_closable)).to.be(false);
      });

      it('should be writable', () => {
        var tab = new Tab();
        tab.closable = true;
        expect(tab.hasClass(Tab.p_mod_closable)).to.be(true);
      });

    });

    describe('#closeIconNode', () => {

      it('should be the node for the tab close icon', () => {
        var tab = new Tab();
        var node = tab.closeIconNode;
        expect(tab.closeIconNode).to.be(tab.node.lastChild);
      });

      it('should be read-only', () => {
        var tab = new Tab();
        var node = tab.closeIconNode;
        expect(() => { tab.closeIconNode = null; }).to.throwError();
      });

    });

  });

});
