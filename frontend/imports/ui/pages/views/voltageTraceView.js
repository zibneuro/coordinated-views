import React, { PropTypes } from 'react';
import { VegaLite, Signal } from 'react-vega'
import CoordinatedView from './core/coordinatedView';
import { deepCopy } from './core/utilCore';


class VoltageTraceView extends CoordinatedView {
    constructor(props) {
      super(props);

      this.initialSegments = [30];
      
      this.state = {        
        selected_segments : [30],
        timeIdx : 275,
      }
    }

    receiveData(dataType, data){

      if(data.idx % 2 == 0 && this.name != "membrane potential"){
        return;
      } else if (data.idx % 2 == 1 && this.name != "membrane potential 2"){
        return;
      }

      if(dataType == "voltage_timeseries_points"){
        this.setState((state)=>{
          state.voltage_timeseries_points = data.voltage_timeseries_points;
          return state;
        });
      } 
      if(dataType == "time"){
        this.setState((state)=>{
          state.timeIdx = data.t_absolute;          
          return state;
        })
      }
      if(dataType == "dendrite_segment"){
        this.setState((state)=>{
          state.selected_segments = deepCopy(data.segment_ids);                      
          return state;
        })
      }
    }    

    getData() {  
      const getEmptyValues = () => {
        let values = [];
        for(let t = 275; t<375; t++){
          values.push({
            "time" : t,
            "dim_0" : 0
          })
        }
        return values
      }

      if(!this.state.voltage_timeseries_points){
        return { 
          "table" : getEmptyValues()
        }; 
      }
      
      let voltagesByTime = this.state.voltage_timeseries_points.voltage_traces;
      let t0 = this.state.voltage_timeseries_points.tstart;
      let selectedIndices = this.state ? this.state.selected_segments : this.initialSegments;
          
      const values = [];      
      const nTime = voltagesByTime.length;        
      for(let t = 0; t<nTime; t++){
        let datum = {
          "time" : t + t0
        }
        for(let k=0; k<selectedIndices.length; k++){
          const colIdx = selectedIndices[k];
          datum["dim_" + k.toString()] = voltagesByTime[t][colIdx];
        }        
        values.push(datum)
      }                  
      return { 
        "table" : values
      };
    }

    getLayers() {      
      let selectedIndices = this.state.selected_segments;
      const colors = this.viewManager.colorManager.getDefaultPropertyColors();
      const layers = selectedIndices.map((colIdx, i) => {
        return {
          "mark": {"type" : "line", "color" : colors[i]},
          "encoding": {
            "y" : {"field": "dim_"+i.toString(), "type": "quantitative", "axis" : {"title" : "potential at probe [mV]"}}
          }
        }
      })      
      layers.push({
          "mark": {"type" : "rule", "color" : "black", "size" : 2},             
          "encoding": { 
            "x" : {"datum" : this.state.timeIdx, "type": "quantitative"}
          }            
      });
      return layers;
    }

    getSpec() {
      return {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "description": "A simple scatter plot example.",         
          "data": {
              "name": "table"
          },
          "encoding": {
            "x": {"field": "time", "type": "quantitative", "axis" : {"title" : "time [ms]"}, "scale": {"domain": [275,375]}},
          },
          
          "layer" : this.getLayers(),
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
      //console.log(this.getData());
      let that = this;
      return <VegaLite 
          spec = {this.getSpec()} 
          data = {this.getData()}           
      />      
    }
}

export default VoltageTraceView