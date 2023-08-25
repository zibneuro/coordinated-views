import React from 'react';
import ReactDOM from 'react-dom';

import './home.html'
import '/imports/ui/css/goldenlayout-base.css';
import '/imports/ui/css/goldenlayout-light-theme.css';


import { Template } from 'meteor/templating';
import { ViewManager } from './views/core/viewManager';

import ProjectControl from './views/projectView';
import ViewSpecificationsControl from './views/viewSpecifications';
import GrammarControl from './views/grammarView.js';
import GridControl from './views/gridLayout.js';


Template.home.onRendered(() => {

    const GoldenLayout = require('golden-layout');
    const viewManager = new ViewManager()

    viewManager.dataManager.loadInitialData(() => {

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
                                        component: 'project-control',
                                        title: 'Session',
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    },
                                    {
                                        type: 'react-component',
                                        component: 'view-specifications-control',
                                        title: 'View specifications',
                                        isClosable: false,
                                        props: { viewManager : viewManager }
                                    },
                                    {
                                        type: 'react-component',
                                        component: 'grammar-control',
                                        title: 'Interaction grammar',
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
                
        let container = document.getElementById('layoutContainer');
        myLayout = new GoldenLayout(config, container);

        myLayout.registerComponent("project-control", ProjectControl);
        myLayout.registerComponent("view-specifications-control", ViewSpecificationsControl);
        myLayout.registerComponent("grammar-control", GrammarControl);
        myLayout.registerComponent("grid-control", GridControl);
        
        window.React = React;
        window.ReactDOM = ReactDOM;

        myLayout.init();
    });

});
