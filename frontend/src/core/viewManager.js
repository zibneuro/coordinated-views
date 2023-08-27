import { ColorManager } from './colorManager';
import { DataManager } from './dataManager';
import { InteractionHandler } from './interactionHandler';
import { deepCopy } from './utilCore';
import { getDefaultGrammar } from './grammarView';
import { Observable } from 'babylonjs';

export class ViewManager {
    constructor() {

        this.dataManager = new DataManager(this);        
        this.colorManager = new ColorManager(this);

        this.selection = []
                                
        this.grammar = undefined;
        this.grid = undefined;
        this.layouts = undefined;
        this.activeLayout = undefined;
        this.interactions = undefined;
        this.setGrammar(JSON.parse(getDefaultGrammar()))

        this.view_specifications = [];
        this.selectionOnLayoutChange = [];

        this.OnProjectLoaded = new Observable();        
        this.OnLayoutChanged = new Observable();
                       
        this.interactionHandler = new InteractionHandler(this);
    }    

    setGrammar(grammar) {
        this.grammar = deepCopy(grammar);
        this.view_specifications = deepCopy(grammar.views);
        this.grid = deepCopy(grammar.grid);
        this.layouts = deepCopy(grammar.layouts);
        this.activeLayout = grammar.initialLayout;        
        this.interactions = deepCopy(grammar.interactions);
    }

    getViewSpec(viewName) {
        for(let i=0; i<this.view_specifications.length; i++){
            const viewSpec = this.view_specifications[i];
            if(viewSpec.name === viewName){
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
        if(layoutName === this.activeLayout){
            return;
        }
        const newLayout = this.layouts[layoutName];
        if(newLayout === undefined){
            throw Error("unknown layout: " + layoutName)
        }
        this.activeLayout = layoutName;
        this.updateWorkspace();
    }

    notifyInteraction(viewName, eventArgs){
        this.interactionHandler.processInteraction(viewName, eventArgs);
    }
    

    notifyViewSpecificationsChanged(specifications) {        
        this.grammar.views = specifications;
        this.setGrammar(this.grammar);
        this.OnProjectLoaded.notifyObservers();
    }
}