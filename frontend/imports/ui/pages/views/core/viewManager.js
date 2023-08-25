import { ColorManager } from './colorManager';
import { DataManager } from './dataManager';
import { InteractionHandler } from './interactionHandler';
import { deepCopy, areIdentical } from './utilCore';
import { getDefaultGrammar } from '../grammarView';
import { default_spec } from '../view_factory';

function intersectArrays(array1, array2) {
    const set = {};
    const intersection = [];
  
    for (let i = 0; i < array1.length; i++) {
      set[array1[i]] = true;
    }
  
    for (let i = 0; i < array2.length; i++) {
      if (set[array2[i]]) {
        intersection.push(array2[i]);
      }
    }

    return intersection;
  }

export class ViewManager {
    constructor() {

        this.dataManager = new DataManager(this);        
        this.colorManager = new ColorManager(this);

        this.selection = []
        this.OnSelectionChanged = new BABYLON.Observable();
                                
        this.grammar = undefined;
        this.grid = undefined;
        this.layouts = undefined;
        this.activeLayout = undefined;
        this.interactions = undefined;
        this.setGrammar(JSON.parse(getDefaultGrammar()))

        this.view_specifications = [];
        this.view_visibility = {};
        this.selectionOnLayoutChange = [];

        this.OnProjectLoaded = new BABYLON.Observable();        
        this.OnLayoutChanged = new BABYLON.Observable();
        
        this.OnAssignData = new BABYLON.Observable();
        this.OnClearData = new BABYLON.Observable();
        this.OnSelection = new BABYLON.Observable();                
        
        this.interactionHandler = new InteractionHandler(this);
    }    

    setGrammar(grammar) {
        this.grammar = deepCopy(grammar);
        this.grid = deepCopy(grammar.grid);
        this.layouts = deepCopy(grammar.layouts);
        this.activeLayout = grammar.initialLayout;        
        this.interactions = deepCopy(grammar.interactions);
    }

    getViewSpec(viewName) {
        for(let i=0; i<this.view_specifications.length; i++){
            const viewSpec = this.view_specifications[i];
            if(viewSpec.name == viewName){
                return deepCopy(viewSpec);
            }            
        }
        return undefined;
    }

    getGrammar() {        
        return deepCopy(this.grammar);
    }

    updateWorkspace() {
        const layout = this.layouts[this.activeLayout];
        this.OnLayoutChanged.notifyObservers(deepCopy(layout));
    }

    stepBack() {
        this.activeLayout = this.grammar.initialLayout;
        this.updateWorkspace();
    }

    changeLayout(layoutName) {
        if(layoutName == this.activeLayout){
            return;
        }
        const newLayout = this.layouts[layoutName];
        if(newLayout == undefined){
            throw Error("unknown layout: " + layoutName)
        }
        this.activeLayout = layoutName;
        this.updateWorkspace();
    }

    notifyInteraction(viewName, eventArgs){
        this.interactionHandler.processInteraction(viewName, eventArgs);
    }
    
    notifySelectionChanged(newSelection) {
        if(!areIdentical(newSelection, this.selection)){
            
            for(let i=0; i<this.dataManager.RBCData.length; i++){
                this.dataManager.RBCData[i].selection_state = 0; 
            }
            for(let i=0; i<newSelection.length; i++){
                this.dataManager.RBCData[newSelection[i]].selection_state = 1;
            }
            this.selection = deepCopy(newSelection);            
            this.OnSelectionChanged.notifyObservers(this.selection);
        }        
    }

    notifySelectionEvent(viewName, eventType, selectedIndices=[]) {
        console.log(viewName, eventType, selectedIndices);
        if(eventType == "select"){
            if(!selectedIndices.length){
                return;
            }
            if(this.selection.length){
                this.selection = intersectArrays(selectedIndices, this.selection);
            } else {
                this.selection = deepCopy(selectedIndices);
            }
        } else if (eventType == "deselect") {
            this.selection = []; 
        }
        this.OnSelectionChanged.notifyObservers({sourceName : viewName, indices: this.selection, eventType : eventType});
    }

    notifyViewSpecificationsChanged(specifications) {        
        this.view_specifications = specifications;
    }
}