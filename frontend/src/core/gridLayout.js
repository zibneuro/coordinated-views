import React from 'react';
import GridLayout from "react-grid-layout";


import "../css/grid.css";

import ViewFactory from '../views/viewFactory';

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
        this.viewFactory = new ViewFactory(this.viewManager);

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
          
        let width = cellProps.w * grid.width / grid.cols - 2 * margin;
        let height = cellProps.h * grid.rowHeight - header;
        const viewName = cellProps.view;

        const viewSpec = this.viewManager.getViewSpec(viewName);
        if(viewSpec === undefined){
            return <div>not specified: {viewName}</div>
        }
        
        let isScatterPlot = viewSpec.type.indexOf("regl") !== -1;
        let isAnatomicalView = viewSpec.type.indexOf("anatomical") !== -1;
        let isDendriteView = false;        
        if(viewSpec.configuration){
            isDendriteView = viewSpec.configuration.presetCamera === "case-study-2";
        } 

        // tbd: move interaction hints to configuration 
        let hint = undefined;
        if(isScatterPlot){
            hint = "lasso select: ALT + left mouse; reset: double click"
        } else if (isAnatomicalView){
            if(isDendriteView){
                hint = "click on dendrite segment to place probe";
            } else {
                hint = "lasso select: ALT + left mouse; reset: double click";
            }
        }
        let view = undefined;
        if (viewSpec) {

            view = this.viewFactory.getView(viewName, viewSpec, width, height);                        
            /*
            <tr>
                <td style={styleGridCellInfo}>{JSON.stringify(cellProps)} {index}</td>
            </tr>
            */

            const formatSPDatasource = () => {
                let rows = [];
                if(viewSpec.dataColumn.length < 2){
                    //rows.push(<tr key={"x"}><td className='redText'>no datasources specified</td></tr>)                        
                    return rows;
                }
                
                rows.push(<tr key={"x"}><td className='blueText'>x: {viewSpec.dataColumn[0]}</td></tr>)
                rows.push(<tr key={"y"}><td className='blueText'>y: {viewSpec.dataColumn[1]}</td></tr>)                
                if(viewSpec.dataColumn.length === 3){
                    rows.push(<tr key={"c"}><td className='blueText'>c: {viewSpec.dataColumn[2]}</td></tr>)
                } else {
                    rows.push(<tr key={"c"}><td className='blueText'>c: n/a</td></tr>)                    
                } 

                return rows;                                         
            }

            const formatHint = (hint) => {
                return <tr key={"info"}><td className='orangeText'>{hint}</td></tr>
            }

            let annotated = <table style={{ width: 100}} className="noMargin">
                <tbody>
                    <tr>
                        <td className='codeText'>{viewName}</td>
                    </tr>                    
                    {hint !== undefined && formatHint(hint)}
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

        //console.log(gridCellProps);

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

