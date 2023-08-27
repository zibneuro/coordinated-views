import React from 'react';

import ReglScatterPlot from './scatterPlotView';
import ParallelCoordinates from './parallelCoordinatesView';
import AnatomicalView from './anatomicalView';
import VoltageTraceView from './voltageTraceView';
import TimeControlView from './timeControlView';
import VegaView from './vegaView';
import DensityPlot from './densityPlotView';


class ViewFactory {

    constructor(viewManager) {
        this.viewManager = viewManager;
    }

    getView(viewName, viewSpec, width, height) {
        const headerSP = 45;
        let view = undefined;
        if (viewSpec.type === "regl-scatterplot" || viewSpec.type === "regl-scatterplot-large" || viewSpec.type === "scatterplot PCA" ||
            viewSpec.type === "regl-scatterplot neurons" || viewSpec.type === "regl-scatterplot synapses") {
            let embedding = viewSpec.type === "scatterplot PCA" ? "PCA" : "none";
            view = <ReglScatterPlot
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height - headerSP}
                embedding={embedding}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type === "plotly-parallelcoords") {
            view = <ParallelCoordinates
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type.indexOf("anatomical-view") !== -1) {
            view = <AnatomicalView
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type === "voltage-trace") {
            view = <VoltageTraceView
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type === "time-control") {
            view = <TimeControlView
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type === "barchart-celltypes") {
            view = <VegaView
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type === "barchart-celltypes-synapses") {
            view = <VegaView
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />
        } else if (viewSpec.type === "density-2-channel" || viewSpec.type === "density-3-channel") {
            view = <DensityPlot
                viewManager={this.viewManager}
                dataColumn={viewSpec.dataColumn}
                name={viewName}
                width={width}
                height={height}
                dataTable={viewSpec.dataTable}
                configuration={viewSpec.configuration}
            />

        } else {
            view = <div>unknown view type: {viewSpec.type}</div>
        }
        return view;
    }
}

export default ViewFactory

