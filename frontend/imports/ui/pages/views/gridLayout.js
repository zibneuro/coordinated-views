import React, { useState } from 'react';
import GridLayout from "react-grid-layout";


import "../../css/grid.css";

import ReglScatterPlot from './scatterPlotView';
import ParallelCoordinates from './parallelCoordinatesView';
import AnatomicalView from './anatomicalView';
import VoltageTraceView from './voltageTraceView';
import TimeControlView from './timeControlView';
import CelltypeView from './celltypeView';
import CelltypeDensityView from './celltypeDensityView';
import DensityPlot from './densityPlotView';


const gridItemStyle = {
    border: '1px solid lightgrey',
    backgroundColor : "white"
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


class GridControl extends React.Component {

    constructor(props) {
        super(props);

        this.viewManager = props.viewManager;
        this.dataManager = this.viewManager.dataManager;

        this.state = {
            layout: undefined
        }

        let that = this;
        this.viewManager.OnLayoutChanged.add((layout) => {
            that.setState((state, props) => {
                state.layout = layout;
                return state;
            })
        });
    }

    componentDidMount() {
    }

    getView(cellProps, grid) {
        const margin = 10
        const header = 15;
        const headerSP = 45;
          
        let width = cellProps.w * grid.width / grid.cols - 2 * margin;
        let height = cellProps.h * grid.rowHeight - header;
        const viewName = cellProps.view;

        const viewSpec = this.viewManager.getViewSpec(viewName);
        if(viewSpec === undefined){
            return <div>not specified: {viewName}</div>
        }
        
        let isScatterPlot = false;
        let view = undefined;
        if (viewSpec) {
            if (viewSpec.type == "regl-scatterplot" || viewSpec.type == "regl-scatterplot-large" || viewSpec.type == "scatterplot PCA" ||
                viewSpec.type == "regl-scatterplot neurons" || viewSpec.type == "regl-scatterplot synapses") {
                isScatterPlot = true;
                let embedding = viewSpec.type == "scatterplot PCA" ? "PCA" : "none";
                view = <ReglScatterPlot
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height-headerSP}
                    embedding={embedding}
                    table={viewSpec.table}
                />
            } else if (viewSpec.type == "plotly-parallelcoords") {
                view = <ParallelCoordinates
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                />
            } else if (viewSpec.type.indexOf("anatomical-view") != -1) {
                view = <AnatomicalView
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                    configuration={viewSpec.configuration}
                />
            } else if (viewSpec.type == "voltage-trace") {
                view = <VoltageTraceView
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                />
            } else if (viewSpec.type == "time-control") {
                view = <TimeControlView
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                />
            } else if (viewSpec.type == "barchart-celltypes") {
                view = <CelltypeView
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                />
            } else if (viewSpec.type == "barchart-celltypes-synapses") {
                view = <CelltypeView
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                />
            } else if (viewSpec.type == "celltype-density-synapses") {
                view = <CelltypeDensityView
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                />  
            } else if (viewSpec.type == "density-2-channel" || viewSpec.type == "density-3-channel") {
                view = <DensityPlot
                    viewManager={this.viewManager}
                    data_sources={viewSpec.data_sources}
                    name={viewName}
                    width={width}
                    height={height}
                    table={viewSpec.table}
                    configuration={viewSpec.configuration}
                />

            } else {
                view = <div>unknown view type: {viewSpec.type}</div>
            }
            
            /*
            <tr>
                <td style={styleGridCellInfo}>{JSON.stringify(cellProps)} {index}</td>
            </tr>
            */

            const formatSPDatasource = () => {
                let rows = [];
                if(viewSpec.data_sources.length < 2){
                    //rows.push(<tr key={"x"}><td className='redText'>no datasources specified</td></tr>)                        
                    return rows;
                }
                
                rows.push(<tr key={"x"}><td className='blueText'>x: {viewSpec.data_sources[0]}</td></tr>)
                rows.push(<tr key={"y"}><td className='blueText'>y: {viewSpec.data_sources[1]}</td></tr>)                
                if(viewSpec.data_sources.length == 3){
                    rows.push(<tr key={"c"}><td className='blueText'>c: {viewSpec.data_sources[2]}</td></tr>)
                } else {
                    rows.push(<tr key={"c"}><td className='blueText'>c: n/a</td></tr>)                    
                } 

                return rows;                                         
            }

            let annotated = <table style={{ width: 100}} className="noMargin">
                <tbody>
                    <tr>
                        <td className='codeText'>{viewName}</td>
                    </tr>                    
                    <tr>
                        <td>
                            {view}
                        </td>
                    </tr>
                    {isScatterPlot && (formatSPDatasource())}
                    </tbody></table>;
            return annotated;
        }        
    }

    render() {
        if (!this.state.layout) {
            return <div></div>
        }

        const grid = this.viewManager.grid;
        const layout = this.state.layout;
        
        const gridCellProps = [];
        for (let i = 0; i < layout.length; i++) {
            const randomKey = "grid-cell-" + getRandomInt(0, 1000000).toString();
            gridCellProps.push({
                key : randomKey,
                props : layout[i]
            });
        }

        console.log(gridCellProps);

        return (
            <GridLayout className="layout" cols={grid.cols} rowHeight={grid.rowHeight} width={grid.width}>
                {gridCellProps.map((cell, index) => (
                    <div key={cell.key} 
                         data-grid={{ x: cell.props.x, y: cell.props.y, w: cell.props.w, h: cell.props.h, static: true }}
                         style={gridItemStyle}>
                        {this.getView(cell.props, grid)}                        
                    </div>
                ))}
            </GridLayout>
        );
    }
}


export default GridControl

