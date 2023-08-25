import '/imports/ui/pages/layout.html';
import '/imports/ui/pages/home.js';
import '/imports/ui/css/cortexinsilico3d.scss';
import '/imports/ui/css/coordinatedViews.css';
import 'bootstrap/dist/js/bootstrap.bundle';


import {Router} from 'meteor/iron:router';

Router.configure({
    layoutTemplate: 'layout',
});

Router.route('/', {
    name: 'home',    
});

