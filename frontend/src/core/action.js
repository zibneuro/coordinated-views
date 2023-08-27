import { deepCopy } from './utilCore.js';

class Action {
    constructor(viewManager, targetViews) {
        this.viewManager = viewManager;
        this.targetViews = deepCopy(targetViews);
    }

    isTargetView(viewName){
        return this.targetViews.indexOf(viewName) !== -1;
    }
}

export class SelectionAction extends Action {
    constructor(viewManager, targetViews, operationType, selectionEvent) {
        super(viewManager, targetViews);
        this.operationType = operationType;

        this.sourceViewName = selectionEvent.source_view_name;
        this.sourceViewTable = selectionEvent.source_view_table;                
        this.indices = new Set(selectionEvent.indices);                
    }

    operationUpdatesData() {        
        const dataOperations = ["assignData", "clearData", "assignSelectionAsData"]
        return dataOperations.indexOf(this.operationType) !== -1;
    }

    getMappedIndices(viewTable){
        let indicesForOp = new Set();
        const tableMapping = this.viewManager.dataManager.table_mapping;
        
        const mapping = tableMapping.find(m => m.left_table === this.sourceViewTable && m.right_table === viewTable);
        const leftKey = mapping.left_key;
        const rightKey = mapping.right_key;            
        
        const leftTable = this.viewManager.dataManager.cacheExpanded[this.sourceViewTable];
        const rightTable = this.viewManager.dataManager.cacheExpanded[viewTable];

        const leftKeyValues = new Set();                    
        const indicesArray = Array.from(this.indices);
        for(let i = 0; i<indicesArray.length; i++){
            const index = indicesArray[i];                                
            leftKeyValues.add(leftTable[index][leftKey]);
        }            
        
        for(let i = 0; i<rightTable.length; i++){
            if(leftKeyValues.has(rightTable[i][rightKey])){
                indicesForOp.add(i);
            }
        }
        return indicesForOp;
    }

    applyOperation(viewTable, currentIndices){
        if(this.operationType === "clearData" || this.operationType === "clearSelection"){
            return [];
        }

        let indicesForOp = this.sourceViewTable === viewTable ? this.indices : this.getMappedIndices(viewTable);
        if(this.operationType === "assignSelectionAsData" || this.operationType === "assignSelection"){
            return Array.from(indicesForOp);            
        } else if (this.operationType === "intersectSelection") {
            if(!currentIndices.length){
                return Array.from(indicesForOp);
            }
            return currentIndices.filter(idx => indicesForOp.has(idx));
        } else if (this.operationType === "unionSelection") {
            const unionSet = new Set([...indicesForOp, ...currentIndices])
            const union = Array.from(unionSet);            
            return union;
        } else {
            console.log(`invalid operation '${this.operationType}`);
        } 
    }    
}


export class CustomAction extends Action {
    constructor(viewManager, targetViews, customEvent) {
        super(viewManager, targetViews);
        this.data = deepCopy(customEvent.data);                
        this.dataType = customEvent.dataType;
    }    
}
