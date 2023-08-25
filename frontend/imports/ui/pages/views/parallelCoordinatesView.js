import React from 'react';
import Plot from 'react-plotly.js';
import { deepCopy } from './core/utilCore';
import CoordinatedView from './core/coordinatedView';
import { SelectionEvent } from './core/interactionEvent';



const params_name_mapping = {
    'ephys.NaTa_t.soma.gNaTa_tbar':'s.Na_t',
    'ephys.Nap_Et2.soma.gNap_Et2bar':'s.Na_p',
    'ephys.K_Pst.soma.gK_Pstbar':'s.K_p',
    'ephys.K_Tst.soma.gK_Tstbar':'s.K_t',
    'ephys.SK_E2.soma.gSK_E2bar':'s.SK',
    'ephys.SKv3_1.soma.gSKv3_1bar':'s.Kv_3.1',
    'ephys.Ca_HVA.soma.gCa_HVAbar':'s.Ca_H',
    'ephys.Ca_LVAst.soma.gCa_LVAstbar':'s.Ca_L',
    'ephys.CaDynamics_E2_v2.soma.gamma':'s.Y',
    'ephys.CaDynamics_E2_v2.soma.decay':'s.T_decay',
    
    'ephys.none.soma.g_pas':'s.leak',
    'ephys.none.axon.g_pas':'ax.leak',
    'ephys.none.dend.g_pas':'b.leak',
    'ephys.none.apic.g_pas':'a.leak',
    
    'ephys.NaTa_t.axon.gNaTa_tbar':'ax.Na_t',
    'ephys.Nap_Et2.axon.gNap_Et2bar':'ax.Na_p',
    'ephys.K_Pst.axon.gK_Pstbar':'ax.K_p',
    'ephys.K_Tst.axon.gK_Tstbar':'ax.K_t',
    'ephys.SK_E2.axon.gSK_E2bar':'ax.SK',
    'ephys.SKv3_1.axon.gSKv3_1bar':'ax.Kv_3.1',
    'ephys.Ca_HVA.axon.gCa_HVAbar':'ax.Ca_H',
    'ephys.Ca_LVAst.axon.gCa_LVAstbar':'ax.Ca_L',
    'ephys.CaDynamics_E2_v2.axon.gamma':'ax.Y',
    'ephys.CaDynamics_E2_v2.axon.decay':'ax.T_decay',
    
    'ephys.Im.apic.gImbar':'a.I_m',
    'ephys.NaTa_t.apic.gNaTa_tbar':'a.Na_t',
    'ephys.SKv3_1.apic.gSKv3_1bar':'a.Kv_3.1',
    'ephys.Ca_HVA.apic.gCa_HVAbar':'a.Ca_H',
    'ephys.Ca_LVAst.apic.gCa_LVAstbar':'a.Ca_L',
    'ephys.SK_E2.apic.gSK_E2bar':'a.SK',
    'ephys.CaDynamics_E2_v2.apic.gamma':'a.Y',
    'ephys.CaDynamics_E2_v2.apic.decay':'a.T_decay',
    
    'ephys.SKv3_1.apic.offset':'a.Kv_3.1_offset',
    'ephys.SKv3_1.apic.slope':'a.Kv_3.1_slope',
    'scale_apical.scale': 'a.scale'
  }



// Set up the traces for the parallel coordinates
const data = [
  { A: 1, B: 3, C: 5 },
  { A: 2, B: 2, C: 6 },
  { A: 3, B: 5, C: 2 },
];

const dimensions = [
  { range: [0, 10], label: 'A', values: data.map(obj => obj.A) },
  { range: [0, 10], label: 'B', values: data.map(obj => obj.B) },
  { range: [0, 10], label: 'C', values: data.map(obj => obj.C) },
];


const traces = [
  {
    type: 'parcoords',
    line: {
      color: "blue", //data.map((_, index) => index),
      //colorscale: 'Viridis',
      //showscale: true,
      //reversescale: true,
      //cmin: 0,
      //cmax: data.length - 1,
    },
    dimensions: dimensions,
  },
];


function buildDimensions(data, values) {

  const getLabel = (name) => {
    if(params_name_mapping[column_name]){
      return params_name_mapping[column_name]
    } else {
      return name;
    }
  } 

  let dimensions = [];
  for (let col_idx = 0; col_idx < data.columns.length; col_idx++) {
    column_name = data.columns[col_idx];
    let range = [data.data_ranges.min[col_idx], data.data_ranges.max[col_idx]]
    let valuesForColumn = values.map(x => x[column_name]);
    if(valuesForColumn.length){
      range = [Math.min(...valuesForColumn), Math.max(...valuesForColumn)];
    }
    dimensions.push({
      "range": range,
      "label": getLabel(column_name),
      "values": valuesForColumn
    })
  }
  return dimensions;
}

class ParallelCoordinates extends CoordinatedView {
  constructor(props) {
    super(props);
    
    this.state = {
      traces: traces
    }

    this.propagateEvents = false;
    this.previousSelection = [];
    /*
    this.observerSelectionChanged = this.viewManager.OnSelectionChanged.add((eventArgs) => {      
      let indices = eventArgs.indices;
      let isFilter = eventArgs.eventType == "select";
      this.loadTraces(false, isFilter, indices);
    });
    */
  }

  updateSelection(interactionEvent) {    
    console.log("receive", interactionEvent);
    const indicesNew = interactionEvent.applyOperations(this.name, this.table, this.previousSelection);
    this.previousSelection = deepCopy(indicesNew);
    this.propagateEvents = false;
    this.buildTraces2(false, indicesNew);
  }


  componentWillUnmount() {
    super.componentWillUnmount();
    if(this.observerSelectionChanged) {
      this.viewManager.OnSelectionChanged.remove(this.observerSelectionChanged);
    }
  }

  buildTraces(isFilter, selectedIndices) {    
    let values = [];
    let originalIndices = [];
    
    if(isFilter){
      for(let i=0; i<selectedIndices.length; i++){
        values.push(this.data.values[i]);
      }
      originalIndices = deepCopy(selectedIndices);
    } else {
      values = this.data.values;
      originalIndices = this.data.values.map((value, index) => {return index});
    }

    console.log(values, selectedIndices);

    let traces = [
      {
        type: 'parcoords',
        line: {
          color: "blue", //values.map((_, index) => index),
          //colorscale: 'Viridis',
          //showscale: true,
          //reversescale: true,
          //cmin: 0,
          //cmax: values.length - 1,
        },
        labelangle : 0,
        indices_original: originalIndices,
        dimensions: buildDimensions(this.data, values),
      }];

    this.setState((state, props) => {
      state.traces = traces;
      return state;
    });
  }

  buildTraces2(isFilter, selectedIndices) {    
    let values = this.data.values;
    //selectedIndices = [200, 300, 400, 500];

    const indexSet = new Set(selectedIndices);
    console.log(values, selectedIndices);
    const indicator = [];
    for(let i=0; i<values.length; i++){
      if(indexSet.has(i)){
        indicator.push(1);
      } else {
        indicator.push(0);
      }
    }
    
    let traces = [
      {
        type: 'parcoords',
        line: {
          //unselected: {
          //  line: {              
          //    color: 'orange'
          //  }
          //},
          color: values.map((_, index) => {
            return indicator[index];
          }),          
          colorscale: [[0, 'rgba(150, 150, 150, .2)'], [1, 'rgba(0, 0, 255, 1)']],
          //colorscale: 'Viridis',
          //showscale: true,
          //reversescale: true,
          //cmin: 0,
          //cmax: values.length - 1,
        },
        labelangle : 0,
        //indices_original: originalIndices,
        dimensions: buildDimensions(this.data, values),
      }];
    
    this.setState((state, props) => {
      state.traces = traces;
      return state;
    });
  }

  loadTraces(initialLoad, isFilter=true, selectedIndices=[]) {
    if(initialLoad){
      let that = this;
      this.dataManager.loadValues((data) => {
        console.log("parcoords", data);
        that.data = data;
        that.buildTraces2(false, selectedIndices);
      }, this.table, [], this.data_sources, "expanded");
    } else {
      this.buildTraces2(isFilter, selectedIndices);
    }      
  }

  componentDidMount() {    
    this.loadTraces(true);
    super.componentDidMount();
  }

  handleSelection(eventData) {
    const selectedPoints = eventData.points.map((point) => point.pointIndex);
    //this.setState({ selectedPoints });

    console.log('Selected Points:', selectedPoints);
  }

  handleEvent(eventData) {
    const dimensions = eventData.data[0].dimensions;
    //console.log(dimensions);

    let nTotal = dimensions[0].values.length;
    let filtered_indices = dimensions[0].values.map((value, index) => {return index});
    
    for (let i = 0; i < dimensions.length; i++) {
      //console.log(dimensions[i].constraintrange);
      if (dimensions[i].constraintrange) {      
        let constraints = dimensions[i].constraintrange;        

        if(!Array.isArray(constraints[0])){
          constraints = [constraints];
      }
        
        const values = dimensions[i].values;    
        let meetConstraints = []              
        for(let k=0; k<constraints.length; k++){
          const min = constraints[k][0];
          const max = constraints[k][1];
                              
          meetConstraints = filtered_indices.reduce((accumulator, index) => {
              const value = values[index];
              if(value >= min && value <= max){
                accumulator.push(index);
              }
              return accumulator;
            }, meetConstraints);
        }
        filtered_indices = meetConstraints;
      }        
    }
    
    /*
    const indices_original = this.state.traces[0].indices_original
    if (filtered_indices.length < indices_original.length) {      
      let indices_original_filtered = [];
      for (let i = 0; i < filtered_indices.length; i++) {
        indices_original_filtered.push(indices_original[filtered_indices[i]]);        
      }
      this.notify(new SelectionEvent(this.name, this.table).setIndices(indices_original_filtered));
      //this.viewManager.notifySelectionEvent(this.name, "select", indices_original_filtered);
    }*/    
    if(this.propagateEvents){      
      this.notify(new SelectionEvent(this.name, this.table).setIndices(filtered_indices));                      
    } else {
      this.propagateEvents = true;
    }   
  }

  render() {

    const layout = {      
        margin: {
          l: 50, // left margin
          r: 50, // right margin
          t: 50, // top margin
          b: 50, // bottom margin
        },
        width: this.width,
        height: this.height
    }

    return <Plot
      data={this.state.traces}
      layout={layout}
      onUpdate={this.handleEvent.bind(this)}
    />
  };
};

export default ParallelCoordinates;