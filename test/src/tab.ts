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

    describe('.createNode()', () => {

      it('should create a DOM node for a tab', () => {
        var node = Tab.createNode();
        var children = node.children;
        expect(children.length).to.be(3);
        expect(children[0].classList.contains('p-Tab-icon')).to.be(true);
        expect(children[1].classList.contains('p-Tab-text')).to.be(true);
        expect(children[2].classList.contains('p-Tab-close')).to.be(true);
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
        expect(tab.hasClass('p-Tab')).to.be(true);
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
        expect(tab.hasClass('p-mod-selected')).to.be(false);
      });

      it('should be writable', () => {
        var tab = new Tab();
        tab.selected = true;
        expect(tab.hasClass('p-mod-selected')).to.be(true);
      });

    });

    describe('#closable', () => {

      it('should reflect `p-mod-closable`', () => {
        var tab = new Tab();
        expect(tab.closable).to.be(false);
        expect(tab.hasClass('p-mod-closable')).to.be(false);
      });

      it('should be writable', () => {
        var tab = new Tab();
        tab.closable = true;
        expect(tab.hasClass('p-mod-closable')).to.be(true);
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
