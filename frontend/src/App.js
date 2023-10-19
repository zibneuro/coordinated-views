import React from 'react';
import ReactDOM from 'react-dom';

import './css/goldenlayout-base.css';
import './css/goldenlayout-light-theme.css';
import './css/coordinatedViews.css';

import { ViewManager } from './core/viewManager';
import ProjectControl from './core/projectView';
import ViewSpecificationsControl from './core/viewSpecifications';
import GrammarControl from './core/grammarView.js';
import GridControl from './core/gridLayout.js';
import ServerControl from './core/serverControl';
import EmptyControl from './core/emptyControl';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    return <div style={{ "marginLeft": "10px", "marginRight": "10px", "paddingLeft": "1px", "paddingRight": "1px", "paddingBottom": "1px", "paddingTop": "1px" }}>
      <div ref={this.myRef} style={{ "height": "800px" }}></div>
    </div>
  }

  
  componentDidMount() {
    const viewManager = new ViewManager()
    const GoldenLayout = require('golden-layout');

    viewManager.dataManager.loadInitialData((serverConnected) => {

        let config = {
            dimensions: {
            },
            settings: {
                showPopoutIcon: false,
                reorderEnabled: false,
            },
            content: [{
                type: 'row',
                content: [
                    {
                        type: 'column',
                        width: 30,
                        content: [
                            {
                                type: 'stack',
                                id: "sidebar",
                                content: [
                                    {
                                        type: 'react-component',
                                        component: 'server-control',
                                        title: 'Server',
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    },
                                    {
                                        type: 'react-component',
                                        component: 'project-control',
                                        title: 'Session',
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    },
                                    {
                                        type: 'react-component',
                                        component: 'view-specifications-control',
                                        title: 'Views',
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    },
                                    {
                                        type: 'react-component',
                                        component: 'grammar-control',
                                        title: 'Grammar',
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    }                                 
                                ]
                            }
                        ]
                    },
                    {
                        type: 'column',
                        width: 70,
                        content: [
                            {
                                type: 'stack',
                                id: "sidebar",
                                content: [
                                    {
                                        type: 'react-component',                                        
                                        component: "grid-control",
                                        title: 'Workspace',                                        
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    }
                                ]
                            },
                        ]
                    }              
                ]
            }]
        };
                        
        let myLayout = new GoldenLayout(config, this.myRef.current);

        myLayout.registerComponent("server-control", ServerControl);
        if(serverConnected){
            myLayout.registerComponent("project-control", ProjectControl);
            myLayout.registerComponent("view-specifications-control", ViewSpecificationsControl);
            myLayout.registerComponent("grammar-control", GrammarControl);
            myLayout.registerComponent("grid-control", GridControl);        
        } else {
            myLayout.registerComponent("project-control", EmptyControl);
            myLayout.registerComponent("view-specifications-control", EmptyControl);
            myLayout.registerComponent("grammar-control", EmptyControl);
            myLayout.registerComponent("grid-control", EmptyControl);        
        }
        
        window.React = React;
        window.ReactDOM = ReactDOM;

        myLayout.init();
    });
  } 
}

export default App
