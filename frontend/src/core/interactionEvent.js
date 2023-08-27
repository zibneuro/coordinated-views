export class InteractionEvent {
    constructor(source_view_name, source_view_table) {
        this.source_view_name = source_view_name;
        this.source_view_table = source_view_table;        
        this.selectedEntityType = undefined;        
    }

    satisfiesNumSelectedRange(numSelectedRange) {
        return false;
    }

    satisfiesInteractionType(typeName) {
        return false;
    }

    satisfiesSelectedEntityType(typeName) {
        return typeName === this.selectedEntityType;
    }
}

export class SelectionEvent extends InteractionEvent {   
    constructor(source_view_name, source_view_table) {
        super(source_view_name, source_view_table);
        
        this.selectedEntityType = "row_index";
        this.indices = new Set();

        this.isDeselect = false;
        this.isUpdate = false;
        this.isSelect = false;                
    }

    setDeselect() {
        this.isDeselect = true;
        return this;
    }

    setIndices(indices, isUpdate = false) {
        this.indices = new Set(indices);

        this.isUpdate = isUpdate;
        this.isSelect = true;
        return this;
    }


    /**
     * Check filter conditions
     * 
     * 
     * 
     */
    satisfiesNumSelectedRange(numSelectedRange) {
        if(Array.isArray(numSelectedRange)){
            return this.indices.size >= numSelectedRange[0] && this.indices.size <= numSelectedRange[1];
        } else if (Number.isInteger(numSelectedRange)) {
            return this.indices.size === numSelectedRange;
        } else {
            throw Error(numSelectedRange);
        }
    }

    satisfiesInteractionType(typeName) {
        if(typeName === "deselect"){
            return this.isDeselect;
        } else if(typeName === "select"){
            return this.isSelect;
        } else {
            return false;
        }
    }     
}


export class CustomEvent extends InteractionEvent {
    constructor(source_view_name, selected_entity_type) {
        super(source_view_name, undefined);
        
        this.selectedEntityType = selected_entity_type;
        this.data = undefined;
        this.dataType = undefined;
    }

    setData(data, dataType) {
        this.data = data;
        this.dataType = dataType;
        return this;
    }
}