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
   TAB_PANEL_CLASS, Tab, TabBar, TabPanel
} from '../../lib/index';


describe('phosphor-tabs', () => {

  describe('TAB_PANEL_CLASS', () => {

    it('should be `p-TabPanel`', () => {
      expect(TAB_PANEL_CLASS).to.be('p-TabPanel');
    });

  });

  describe('TabPanel', () => {

    describe('.currentChangedSignal', () => {

      it('should be a Signal', () => {

      });

    });

    describe('.tabProperty', () => {

      it('should be a Property', () => {

      });

      it('should default to `null`', () => {

      });

    });

    describe('.getTab', () => {

      it('should get the tab for the given widget', () => {

      });

      it('should be a pure delegate to `tabProperty`', () => {

      });

    });

    describe('.setTab', () => {

      it('should set the tab for the given widget', () => {

      });

      it('should be a pure delegate to `tabProperty`', () => {

      });

    });

    describe('#constructor()', () => {

     it('should accept no arguments', () => {
        var tabPanel = new TabPanel();
        expect(tabPanel instanceof TabPanel).to.be(true);
     });

     it('should add the TAB_PANELCLASS', () => {
        var tabPanel = new TabPanel();
        expect(tabPanel.hasClass(TAB_PANEL_CLASS)).to.be(true);
     });

     it('should add a TabBar and a StackPanel', () => {
        var tabPanel = new TabPanel();
        
     });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {

      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the current widget is changed', () => {

      });

    });

    describe('#currentWidget', () => {

      it('should get the currently selected widget', () => {

      });

      it('should set the currently selected widget', () => {

      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {

      });

      it('should set whether the tabs are movable by the user', () => {

      });

    });

    describe('#widgets', () => {

      it('should get a shallow copy of the array of widgets', () => {

      });

      it('should set the widgets for the tab panel', () => {

      });
      
    });

    describe('#widgetCount', () => {

      it('should get the number of widgets in the tab panel', () => {

      });

      it('should be ready-only', () => {

      });   

    });

    describe('#widgetAt()', () => {

      it('should get the widget at a specific index', () => {

      });

      it('should return `undefined` if the index is out of range', () => {

      });
      
    });

    describe('#widgetIndex()', () => {

      it('should get the index of a specific widget', () => {

      });

      it('should return `-1` if the widget is not contained in the tab panel', () => {

      });
      
    });

    describe('#addWidget()', () => {

      it('should add a widget to the end of the panel', () => {

      });

      it('should move an existing widget to the end of the panel', () => {

      });

    });

    describe('#insertWidget()', () => {

      it('should insert a widget into the panel at the given index', () => {

      });

      it('should be clamped to the bounds of the widgets', () => {

      });
      
      it('should be move an existing widget', () => {

      });

    });

    describe('#moveWidget()', () => {

      it('should move a widget from one index to another', () => {

      });
      
      it('should return `false` if index out of range', () => {

      });

    });

    describe('#removeWidgetAt()', () => {

      it('should remove the widget at a specific index', () => {

      });

      it('should return `undefined` if index out of range', () => {

      });
      
    });

    describe('#removeWidget()', () => {

      it('should remove the widget from the panel', () => {

      });

      it('should return `-1` if not contained in the panel', () => {

      });
    });

    describe('#clearWidgets()', () => {

      it('should remove all widgets from the panel', () => {

      });
      
    });


  });

});
