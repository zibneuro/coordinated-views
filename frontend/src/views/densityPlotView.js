import React from 'react';
import createScatterplot from 'regl-scatterplot';
import { viridisColormap } from '../core/colorManager';
import CoordinatedView from '../core/coordinatedView';

import { deepCopy } from '../core/utilCore';


const styleBackground = {
  backgroundColor: "white",
  color: "white"
}

class DensityPlot extends CoordinatedView {
  constructor(props) {
    super(props);

    this.myRef = React.createRef();
    
    this.has_color = true; 
    this.configuration = props.configuration;
    this.previousSelection = [];
    
    this.scatterplot = undefined;
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
    const indicesNew = interactionEvent.applyOperations(this.name, this.dataTable, this.previousSelection);
    this.previousSelection = deepCopy(indicesNew);
    this.scatterplot.select(indicesNew, { preventEvent: true });        
  }


  handleSelect(eventArgs) {      
    const nx = this.configuration.density_grid_shape[0];
    const ny = this.configuration.density_grid_shape[1];

    const range_x = this.currentData.data_ranges[0];
    const range_y = this.currentData.data_ranges[1];
    const columns = this.currentData.columns;

    const getValueRange = (bin_i, n_bins, min_value, max_value) => {
      const delta = max_value - min_value;
      const bin_min = min_value + bin_i * delta / n_bins;
      const bin_max = min_value + (bin_i+1) * delta / n_bins;
      return [bin_min, bin_max];
    }

    let filters = [];
    
    for(let i=0; i<eventArgs.points.length; i++){
      const idx = eventArgs.points[i];

      const coords_value = this.currentData.values.coords_value[idx];
      const bin_ix = coords_value[0];
      const bin_iy = coords_value[1];

      let value_range_x = getValueRange(bin_ix, nx, range_x[0], range_x[1]);
      let value_range_y = getValueRange(bin_iy, ny, range_y[0], range_y[1]);

      filters.push([value_range_x, value_range_y]);
    }
   
    let filter_data = {
      "table" : this.dataTable,
      "columns" : [columns[0], columns[1]],
      "bin_ranges" : filters,
      "selection_name" : "global"
    }

    //console.log(filter_data);
    this.dataManager.setDensityPlotSelection(filter_data);

  }


  handleDeselect() {
    //console.log("notify deselect", this.name);
    //this.previousSelection = [];
    //this.notifyInteraction(new SelectionEvent(this.name, this.dataTable).setDeselect());
  }


  render() {
    return <div style={styleBackground}><canvas ref={this.myRef} width={this.width} height={this.height} /></div>
  }


  componentDidMount() {
    const canvas = this.myRef.current;
    canvas.fillStyle = "white";
    if(this.dataColumn.length < 2){
      return;
    }

    const { width, height } = canvas.getBoundingClientRect();

    this.scatterplot = createScatterplot({
      canvas,
      width,
      height,
      pointSize: this.configuration.point_size,
      opacityInactiveMax: this.configuration.point_opacity,
      lassoOnLongPress: true,
      lassoColor: "#ffa500",
      pointColor: this.has_color ? viridisColormap : ["#4682b4"],       
      colorBy: this.has_color ? 'valueA' : undefined,
      keyMap: { alt: 'lasso', shift: 'rotate' }
    });    

        
    let that = this;    
    this.dataManager.getDensityValues((data) => {

      this.currentData = data;

      const nx = this.configuration.density_grid_shape[0];
      const ny = this.configuration.density_grid_shape[1];
      const min_value = data.values.min_value;
      const max_value = data.values.max_value;
      const delta = max_value - min_value;
      const coords_value = data.values.coords_value;

      

      const norm_value = (v) => {        
        if(delta === 0){
          return 0
        } else {
          return (v-min_value)/delta;
        }      
      }

      const norm_coord = (i, ni) => {
        return -1 + 2*i/ni
      }
      
      const values_plot = coords_value.map(v => [norm_coord(v[0],nx), norm_coord(v[1],ny), norm_value(v[2])]);
                  
      that.scatterplot.draw(values_plot);

      that.scatterplot.subscribe("select", this.handleSelect.bind(this));
      that.scatterplot.subscribe("deselect", this.handleDeselect.bind(this));
     
    }, this.dataTable, this.dataColumn, this.configuration.format, this.configuration.density_grid_shape);

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

export default DensityPlot