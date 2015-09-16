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
   CLOSABLE_CLASS, CLOSE_ICON_CLASS, ICON_CLASS, SELECTED_CLASS, TAB_CLASS, 
   TEXT_CLASS, Tab
} from '../../lib/index';


describe('phosphor-tabs', () => {

  describe('TAB_CLASS', () => {

    it('should be `p-Tab`', () => {
      expect(TAB_CLASS).to.be('p-Tab');
    });

  });

  describe('TEXT_CLASS', () => {

    it('should be `p-Tab-text`', () => {
      expect(TEXT_CLASS).to.be('p-Tab-text');
    });

  });

  describe('ICON_CLASS', () => {

    it('should be `p-Tab-icon`', () => {
      expect(ICON_CLASS).to.be('p-Tab-icon');
    });

  });

  describe('CLOSE_ICON_CLASS', () => {

    it('should be `p-Tab-close-icon`', () => {
      expect(CLOSE_ICON_CLASS).to.be('p-Tab-close-icon');
    });

  });

  describe('SELECTED_CLASS', () => {

    it('should be `p-mod-selected`', () => {
      expect(SELECTED_CLASS).to.be('p-mod-selected');
    });

  });

  describe('CLOSABLE_CLASS', () => {

    it('should be `p-mod-closable`', () => {
      expect(CLOSABLE_CLASS).to.be('p-mod-closable');
    });

  });

  describe('Tab', () => {

    describe('.createNode()', () => {

      it('should create a DOM node for a tab', () => {
        var node = Tab.createNode();
        var children = node.children;
        expect(children.length).to.be(3);
        expect(children[0].classList.contains(ICON_CLASS)).to.be(true);
        expect(children[1].classList.contains(TEXT_CLASS)).to.be(true);
        expect(children[2].classList.contains(CLOSE_ICON_CLASS)).to.be(true);
      });

    });

    describe('#constructor()', () => {

     it('should accept no arguments or a string argument', () => {
        var tab0 = new Tab();
        expect(tab0 instanceof Tab).to.be(true);
        expect(tab0.text).to.be('');
        var tab1 = new Tab('foo');
        expect(tab1.text).to.be('foo');
     });

     it('should add the TAB_CLASS', () => {
        var tab = new Tab();
        expect(tab.hasClass(TAB_CLASS)).to.be(true);
     });

    });

    describe('#text', () => {

      it('should be a read/write string reflecting the text span', () => {
        var tab = new Tab('hello');
        expect(tab.text).to.be('hello');
        tab.text = 'goodbye';
        expect(tab.text).to.be('goodbye');
        expect(tab.node.children[1].textContent).to.be('goodbye');
      });

    });

    describe('#selected', () => {

      it('should be read/write and reflect the SELECTED_CLASS', () => {
        var tab = new Tab();
        expect(tab.selected).to.be(false);
        expect(tab.hasClass(SELECTED_CLASS)).to.be(false);
        tab.selected = true;
        expect(tab.hasClass(SELECTED_CLASS)).to.be(true);
      });

    });

    describe('#closable', () => {

      it('should be read/write and reflect the CLOSABLE_CLASS', () => {
        var tab = new Tab();
        expect(tab.closable).to.be(false);
        expect(tab.hasClass(CLOSABLE_CLASS)).to.be(false);
        tab.closable = true;
        expect(tab.hasClass(CLOSABLE_CLASS)).to.be(true);
      });

    });

    describe('#closeIconNode', () => {

      it('should be node for the tab close icon', () => {
        var tab = new Tab();
        var node = tab.closeIconNode;
        expect(node.classList.contains(CLOSE_ICON_CLASS)).to.be(true);
      });
    });

  });

});
