import { SelectionEvent, CustomEvent } from './interactionEvent.js';
import { SelectionAction, CustomAction } from './action';
import { deepCopy } from './utilCore.js';
import { Observable } from 'babylonjs';


export class InteractionHandler {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.OnAction = new Observable();
    }

    process(source_view, interactionEvent) {
        // retrieve actions specified in grammar for this source_view
        const interactions = this.viewManager.grammar.interactions;
        if (!interactions[source_view]) {
            console.log("no interactions specified for", source_view);
            return;
        }

        const actionsForView = interactions[source_view];
        if (!Array.isArray(actionsForView)) {
            console.log(`syntax error: interactions of view '${source_view}' must be array not dict.`)
        }

        const actionsToPerform = [];
        let targetLayout = undefined;
        for (let actionIdx = 0; actionIdx < actionsForView.length; actionIdx++) {
            const interaction = actionsForView[actionIdx];
            const filter = interaction.filter;
            const action = interaction.action;

            // check filter condition for this action
            let filterSatisfied = true;
            if (filter) {
                const layoutName = filter.currentLayout;
                if (layoutName !== undefined) {
                    filterSatisfied &= layoutName === this.viewManager.activeLayout;
                }
                const numSelectedRange = filter.numSelectedRange;
                if (numSelectedRange !== undefined) {
                    filterSatisfied &= interactionEvent.satisfiesNumSelectedRange(numSelectedRange);
                }
                const interactionType = filter.interactionType;
                if (interactionType !== undefined) {
                    filterSatisfied &= interactionEvent.satisfiesInteractionType(interactionType);
                }
                const selectedEntityType = filter.selectedEntityType;
                if (selectedEntityType !== undefined) {
                    filterSatisfied &= interactionEvent.satisfiesSelectedEntityType(selectedEntityType);
                }
            }

            if (filterSatisfied) {

                if (action.changeLayout !== undefined) {                    
                    targetLayout = deepCopy(action.changeLayout);
                }

                if (interactionEvent instanceof SelectionEvent) {
                    const operations = ["assignData", "clearData", "assignSelectionAsData", "assignSelection", "intersectSelection", "unionSelection", "clearSelection"];
                    for (let opIdx = 0; opIdx < operations.length; opIdx++) {
                        const operation = operations[opIdx];
                        const targetViews = action[operation];
                        if (targetViews !== undefined) {
                            if (this.checkAreValidTargetViews(targetViews, source_view, operation)) {
                                actionsToPerform.push(
                                    new SelectionAction(this.viewManager, targetViews, operation, interactionEvent)
                                );
                            }
                        }
                    }
                } else if (interactionEvent instanceof CustomEvent) {
                    const operations = ["assignData"];
                    for (let opIdx = 0; opIdx < operations.length; opIdx++) {
                        const operation = operations[opIdx];
                        const targetViews = action[operation];
                        if (targetViews !== undefined) {
                            if (this.checkAreValidTargetViews(targetViews, source_view, operation)) {
                                actionsToPerform.push(
                                    new CustomAction(this.viewManager, targetViews, interactionEvent)
                                );
                            }
                        }
                    }
                    console.log(actionsToPerform);
                }
            }

            if (targetLayout !== undefined) {
                //this.OnAction.clear();
                this.viewManager.changeLayout(targetLayout);
                const updateDelay = 1000; // tbd: check when views from new workspace have rendered
                window.setTimeout(this.performActions.bind(this), updateDelay, actionsToPerform);
            } else {
                this.performActions(actionsToPerform);    
            }            
        }
    }

    performActions(actionsToPerform) {
        for (let actionIdx = 0; actionIdx < actionsToPerform.length; actionIdx++) {
            this.OnAction.notifyObservers(actionsToPerform[actionIdx]);
        }
    }

    checkAreValidTargetViews(views, source_view, operation) {
        if (!Array.isArray(views)) {
            console.log(`syntax error: interactions of view '${source_view}': '${operation}' must be array of view names.`)
            return false;
        } else {
            return true;
        }
    }
}