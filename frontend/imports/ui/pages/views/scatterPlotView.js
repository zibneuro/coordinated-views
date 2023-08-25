import React, { PropTypes } from 'react';
import createScatterplot from 'regl-scatterplot';
import { viridisColormapReverse, colorMapWhiteBlack } from './core/colorManager';
import CoordinatedView from './core/coordinatedView';

import * as d3 from 'd3';
import { scaleLinear } from 'd3-scale';
import { color, thresholdSturges } from 'd3';
import { deepCopy } from './core/utilCore';
import { SelectionEvent } from './core/interactionEvent';



const styleBackground = {
  backgroundColor: "white",
  color: "white"
}

class ReglScatterPlot extends CoordinatedView {
  constructor(props) {
    super(props);

    this.myRef = React.createRef();
    
    this.has_color = this.data_sources.length == 3 && props.embedding == "none";
    this.embedding = props.embedding;
    this.previousSelection = [];
    
    this.scatterplot = undefined;

    /*
    this.viewManager.OnSelectionChanged.add((eventArgs) => {
      if (this.scatterplot) {
        //if(this.name !== eventArgs.sourceName){
        let indices = eventArgs.indices;
        //console.log(this.name, indices);
        this.scatterplot.select(indices, { preventEvent: true });
        //}                
      }
    });
    */
  }

  getData() {
    return {
      table: this.getDataColumns()
    }
  }

  
  updateSelection(interactionEvent) {    
    //console.log("update select", interactionEvent);
    const points = this.scatterplot.get("points");
    if(!points.length){
      return;
    }
    const currentIndices = this.scatterplot.get("selectedPoints");
    const indicesNew = interactionEvent.applyOperations(this.name, this.table, this.previousSelection);
    this.previousSelection = deepCopy(indicesNew);
    this.scatterplot.select(indicesNew, { preventEvent: true });        
  }


  handleSelect(eventArgs) {    
    //console.log("notify select", this.points);
    //this.scatterplot.select([6421, 7782], { preventEvent: true }); 
    this.notify(new SelectionEvent(this.name, this.table).setIndices(eventArgs.points));
  }


  handleDeselect() {
    //console.log("notify deselect", this.name);
    this.previousSelection = [];
    this.notify(new SelectionEvent(this.name, this.table).setDeselect());
  }


  render() {
    return <div style={styleBackground}><canvas ref={this.myRef} width={this.width} height={this.height} /></div>
  }


  componentDidMount() {
    const canvas = this.myRef.current;
    canvas.fillStyle = "white";
    if(this.data_sources.length < 2){
      return;
    }

    const context = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();

    //const xScale = scaleLinear().domain([0, 42]);
    //const yScale = scaleLinear().domain([-5, 5]);

    //http://regl.party/api#context-loss-mitigation

    this.scatterplot = createScatterplot({
      canvas,
      width,
      height,
      pointSize: 2,
      lassoOnLongPress: true,
      lassoColor: "#ffa500",
      pointColor: this.has_color ? viridisColormapReverse : ["#4682b4"], 
      opacityInactiveMax: 0.3,
      colorBy: this.has_color ? 'valueA' : undefined,
      keyMap: { alt: 'lasso', shift: 'rotate' }
    });

    
    let format = this.embedding == "PCA" ? "flat-normalized-PCA" : "flat-normalized";
    let that = this;
    console.log(this.data_sources);
    this.dataManager.loadValues((data) => {

      that.currentData = data;
      //console.log("server response", this.name, data)

      let values = data.values;
      if(this.has_color){
        values = values.map(v => [v[0], v[1], 0.5*(v[2]+1)]);
      }            
      that.scatterplot.draw(values);

            
      if(this.viewManager.selectionOnLayoutChange.length){
        const preselectedIndices = this.viewManager.selectionOnLayoutChange;
        this.previousSelection = deepCopy(preselectedIndices);
        this.notify(new SelectionEvent(this.name, this.table).setIndices(preselectedIndices));
      }
      

      that.scatterplot.subscribe("select", this.handleSelect.bind(this));
      that.scatterplot.subscribe("deselect", this.handleDeselect.bind(this));
    }, this.table, [], this.data_sources, format);

    super.componentDidMount();
  }

  componentWillUnmount() {    
    super.componentWillUnmount(); 
    try{
      this.scatterplot.destroy();
    } catch (error){
      console.log(error);
    }
    
  }
}

export default ReglScatterPlot