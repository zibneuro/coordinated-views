import React from 'react';
import { getValueOrDefault } from './utilCore';
import { SelectionAction, CustomAction } from './action';

class CoordinatedView extends React.Component {
    constructor(props) {
      super(props);
          
      this.viewManager = props.viewManager;      
      this.interactionHandler = this.viewManager.interactionHandler;
      this.dataManager = this.viewManager.dataManager;
      this.configuration = getValueOrDefault(props.configuration, {});
      this.width = props.width;
      this.height = props.height;  
      this.viewIsValid = false;                                  

      this.name = props.name;
      this.dataTable = props.dataTable;
      this.dataColumn = props.dataColumn;      
      this.state = {}; 
      this.data = []; 
      this.selection = [];
    }

    notifyInteraction(interactionEvent){
        try {
            this.interactionHandler.process(this.name, interactionEvent);
        } catch(e) {
            console.log(e);
        }
    }

    receiveAction(action){
        if(action instanceof SelectionAction){
            if(action.operationUpdatesData()){
                this.data = action.applyOperation(this.dataTable, this.selection);
            } else {
                this.selection = action.applyOperation(this.dataTable, this.selection);
            }
            this.updateSelection();
        } else if (action instanceof CustomAction) {
            this.updateCustomData(action.dataType, action.data);
        }
    }

    updateSelection() {       
    }

    updateCustomData(dataType, data) {        
    }

    componentDidMount() {         
        let that = this;
        this.eventHandler = this.interactionHandler.OnAction.add((action) => {
            if(action.isTargetView(this.name)){
                that.receiveAction(action);            
            }
        });
        this.viewIsValid = true;
    }

    componentWillUnmount() {
        this.viewIsValid = false;        
        this.interactionHandler.OnAction.remove(this.eventHandler);        
    }   
}

export default CoordinatedView