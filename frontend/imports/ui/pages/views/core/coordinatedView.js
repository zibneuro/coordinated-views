
import React, { PropTypes } from 'react';
import { deepCopy } from './utilCore';

class CoordinatedView extends React.Component {
    constructor(props) {
      super(props);
    
      this.viewManager = props.viewManager;
      this.table = props.table;
      this.data_sources = props.data_sources;      
      this.dataManager = this.viewManager.dataManager;
      this.width = props.width;
      this.height = props.height;
      this.name = props.name;
      
      this.state = {};                  
    }

    isTargetView(eventArgs) {
        const targetViewNames = eventArgs.target_view_names;
        return targetViewNames.length == 0 || targetViewNames.indexOf(this.name) != -1;
    }

    componentDidMount() {         
        let that = this;

        this.eventHandlerAssignData = this.viewManager.OnAssignData.add((eventArgs) => {
            if(this.isTargetView(eventArgs)){
                that.receiveData(eventArgs.data.data_type, eventArgs.data);
            }
            
        });
        
        this.eventHandlerSelection = this.viewManager.OnSelection.add((interactionEvent) => {
            if(interactionEvent.isTargetView(this.name)){
                that.updateSelection(interactionEvent);                     
            }                            
        });

        this.viewManager.view_visibility[this.name] = true;
    }

    componentWillUnmount() {
        this.viewManager.view_visibility[this.name] = false;

        this.viewManager.OnAssignData.remove(this.eventHandlerAssignData);
        this.viewManager.OnSelection.remove(this.eventHandlerSelection);
    }
    
    notify(eventArgs){
        this.viewManager.notifyInteraction(this.name, eventArgs);
    }

    receiveData(dataType, data) {
        console.log(this.name, "received data", dataType, data);
    }

    updateSelection(interactionEvent) {
        console.log(this.name, "update selection", interactionEvent);
    }
}

export default CoordinatedView