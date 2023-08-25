import { SelectionEvent } from './interactionEvent.js';
import { deepCopy } from './utilCore.js';

export class InteractionHandler {
    constructor(viewManager) {
        this.viewManager = viewManager;
    }

    processInteraction(source_view, interactionEvent){

        console.log(interactionEvent);
        if(interactionEvent instanceof SelectionEvent){
            interactionEvent.setViewManager(this.viewManager);
        }

        const interactions = this.viewManager.grammar.interactions;
        if(!interactions[source_view]){
            console.log("no interactions for", source_view);
            return
        }

        const actionsForView = interactions[source_view];
        if(!Array.isArray(actionsForView)){
            console.log(`syntax error: interactions of view '${source_view}' must be array not dict.`)
        }
        
    
        for(let actionIdx = 0; actionIdx < actionsForView.length; actionIdx++){
            const interaction = actionsForView[actionIdx];
            const filter = interaction.filter;
            const action = interaction.action;

            // check filter condition
            let filterSatisfied = true;            
            if(filter){
                const requiredLayoutName = filter.currentLayout;
                if(requiredLayoutName != this.viewManager.activeLayout){
                    filterSatisfied = false;                    
                }
                const numSelectedRange = filter.numSelectedRange;
                if(numSelectedRange !== undefined){
                    filterSatisfied &= interactionEvent.satisfiesNumSelectedRange(numSelectedRange);
                }
                const interactionType = filter.interactionType;
                if(interactionType !== undefined){
                    filterSatisfied &= interactionEvent.satisfiesInteractionType(interactionType);
                }
            }

            if(filterSatisfied){          

                if(action.assignData !== undefined) {                    
                    const actionArgs = {};
                    actionArgs.target_view_names = deepCopy(action.assignData);                    
                    actionArgs.data = deepCopy(interactionEvent.data);
                    //console.log(actionArgs);
                    this.viewManager.OnAssignData.notifyObservers(actionArgs);
                }

                if(action.changeLayout !== undefined){
                    console.log("change to layout", action.changeLayout);
                    if(action.changeLayout == "L2"){
                        this.viewManager.mySpecialIndices = Array.from(interactionEvent.indices);
                    } else {
                        this.viewManager.mySpecialIndices = [];
                    }
                    this.viewManager.changeLayout(action.changeLayout);
                    return; 
                }

                if(interactionEvent instanceof SelectionEvent) {
                    let assignViews = [];
                    let intersectViews = [];
                    let unionViews = [];
                    let clearViews = [];

                    if(action.assignSelection !== undefined) {
                        if(!Array.isArray(action.assignSelection)){
                            console.log(`syntax error: interactions of view '${source_view}': assignSelection must be array.`)
                        } else {
                            assignViews = deepCopy(action.assignSelection);
                        }
                    }

                    if(action.intersectSelection !== undefined) {
                        if(!Array.isArray(action.intersectSelection)){
                            console.log(`syntax error: interactions of view '${source_view}': intersectSelection must be array.`)
                        } else {
                            intersectViews = deepCopy(action.intersectSelection);
                        }
                    }

                    if(action.unionSelection !== undefined) {
                        if(!Array.isArray(action.unionSelection)){
                            console.log(`syntax error: interactions of view '${source_view}': unionSelection must be array.`)
                        } else {
                            unionViews = deepCopy(action.unionSelection);
                        }
                    }

                    if(action.clearSelection !== undefined) {
                        if(!Array.isArray(action.clearSelection)){
                            console.log(`syntax error: interactions of view '${source_view}': clearSelection must be array.`)
                        } else {
                            clearViews = deepCopy(action.clearSelection);
                        }
                    }
                                        
                    interactionEvent.setViewsForOperations(assignViews, intersectViews, unionViews, clearViews);
                    this.viewManager.OnSelection.notifyObservers(interactionEvent);
                }                                
            }
        }
    }
}