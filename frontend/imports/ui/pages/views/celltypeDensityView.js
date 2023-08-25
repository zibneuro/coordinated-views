import React, { PropTypes } from 'react';
import { VegaLite, Signal } from 'react-vega'
import CoordinatedView from './core/coordinatedView';
import { deepCopy } from './core/utilCore';


function getCelltypes() {
    return {
        0:"L2",
        1:"L34",
        2:"L4py",
        3:"L4sp",
        4:"L4ss",
        5:"L5st",
        6:"L5tt",
        7:"L6cc",
        8:"L6ccinv",
        9:"L6ct",
        10:"VPM",
        11:"SymL1",
        12:"SymL2",
        13:"SymL3",
        14:"SymL4",
        15:"SymL5",
        16:"SymL6",
        17:"L1",
        18:"L23Trans",
        19:"L45Sym",
        20:"L45Peak",
        21:"L56Trans",
    }
}

class CelltypeDensityView extends CoordinatedView {
    constructor(props) {
      super(props);      

      this.colors = this.viewManager.colorManager.getDefaultPropertyColors(22);      
      this.state.data = [];
    }

    getDomain() {
        let domain = [];
        for(let i=0; i<22; i++){
            domain.push(getCelltypes()[i]);
        }
        console.log(domain);
        return domain;
    }

    updateSelection(interactionEvent) {        
        let currentIndices = this.state.data.map(row => row.rowIdx);        
        let newIndices = interactionEvent.applyOperations(this.name, this.table, currentIndices);

        let that = this;
        this.dataManager.loadValues((data) => {      
            let values = data.values;
            that.setState((state) => {
                state.data = values;
                return state;
            });            
            
          }, this.table, newIndices, ["rowIdx", "z", "neuron_id", "celltype"], "expanded");
      }

    getData() {        
        let annotated = this.state.data.map((row, idx) => {
            return {
                celltype : getCelltypes()[row.celltype],
                color : this.colors[row.celltype],
                z : row.z
            }
        })

        console.log(annotated);

        return { 
          "table" : annotated
        };             
    }

    getSpec() {
      return {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "description": "A simple scatter plot example.",         
          "data": {
              "name": "table"
          },
          "mark" : "line",
          "transform": [
            {
              "as" : ["foo", "bar"],
              "density": "z",
              "bandwidth" : 10
            }
          ],
          "encoding": {
            "y": {"field": "bar", "type": "quantitative"},
            "x": {"field": "foo", "type": "quantitative"},
          },              
          "config": {              
              "legend": {"disable": false},
              "view": {
                  "actions": false
              }
          },          
          "height": 0.75 * this.height,
          "width": 0.8 * this.width,
      }
    }

    render() {
      return <VegaLite 
          spec = {this.getSpec()} 
          data = {this.getData()}           
      />      
    }

    componentDidMount() {
        let that = this;
        this.dataManager.loadValues((data) => {      
            let values = data.values;
            that.setState((state) => {
                state.data = values;
                return state;
            });            
            
          }, this.table, [], ["rowIdx", "z", "neuron_id", "celltype"], "expanded");
        super.componentDidMount();
    }
}

export default CelltypeDensityView