import React from 'react';
import Select from 'react-select';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import '../css/prism.css';


import { deepCopy } from './utilCore.js';


const customStyles = {
    control: (provided) => ({
        ...provided,
        width: '350px',
        fontSize: '14px'
    }),
};

const styleOverflowable = {
    overflowY: 'auto',
    float: 'left',
    width: '100%',
    height: '400px',
    position: 'relative'
};

function parseJson(text) {
    try {
        const json = JSON.parse(text);
        return json;
    } catch (error) {
        return undefined;
    }
};

function stringifyViewSpec(json) {
    return JSON.stringify(json, null, 2)
}

class DataSourceEditor extends React.Component {
    constructor(props) {
        super(props);

        this.viewManager = props.viewManager;
        this.dataManager = this.viewManager.dataManager;
        this.saveFn = props.saveFn;
        this.cancelFn = props.cancelFn;
    
        const viewSpecOriginal = deepCopy(props.viewSpecification);
        this.state = {
            showEditor: false,
            viewSpec: viewSpecOriginal,
            viewSpecText: stringifyViewSpec(viewSpecOriginal),        
            message: ""
        }
    }

    handleSelectChange(index, event) {
        console.log(index, event);
        this.setState((state, props) => {                        
            if (event !== null) {
                if(index >= state.viewSpec.dataColumn.length){
                    state.viewSpec.dataColumn.push(event.value)
                } else {
                    state.viewSpec.dataColumn[index] = event.value;
                }                
            }
            state.viewSpecText = stringifyViewSpec(state.viewSpec);
            return state;
        });
    }

    handleNameChange(event) {
        this.setState((state) => {
            state.viewSpec.name = event.target.value;
            state.viewSpecText = stringifyViewSpec(state.viewSpec);
            return state;
        });
    }

    handleSaveClick() {        
        this.saveFn(this.state.viewSpec);
    }

    handleCancelClick() {
        this.cancelFn();
    }

    handleEditorCheckboxChanged(event) {
        let checked = event.target.checked;
        this.setState((state) => {
            state.showEditor = checked;
            return state;
        });
    }

    handleEditorChange(newValue) {
        const json = parseJson(newValue);
        if (json) {
            this.setState((state) => {
                state.viewSpecText = newValue;
                state.viewSpec = json;
                state.message = "";
                console.log(state);
                return state;
            });
        } else {
            this.setState((state) => {
                state.viewSpecText = newValue;
                state.message = "invalid JSON";
                return state;
            });
        }
    }


    render() {

        const showErrorAndCancel = (message) => {
            return <div>{message}<button className="blueButton" onClick={this.handleCancelClick.bind(this)} style={{marginLeft:"3px"}}>Cancel</button></div>
        }

        // determine available table columns        
        const specifiedTable = this.state.viewSpec.dataTable;
        const metaData = this.dataManager.metaData.filter(table => table.name === specifiedTable);
        if (!metaData.length) {            
            return showErrorAndCancel("table not found: " + specifiedTable);
        }        
        const availableColumns = metaData[0].columns.map(x => ({
            value: x,
            label: x
        }));

        const dataSourceIndices = new Array(this.state.viewSpec.maxNumDatasources).fill().map((val, idx) => idx);

        const getColumnAtIndex = (idx) => {
            if(idx >= this.state.viewSpec.dataColumn.length){
                return undefined
            } else {
                const columnName = this.state.viewSpec.dataColumn[idx];
                return {
                    value: columnName,
                    label: columnName
                }
            }
        }

        return (
            
            <div>
                <table style={{ width: '100%'}} className='blueTable'>
                    <tbody>
                        <tr>
                            <td>
                                <button className="blueButton" onClick={this.handleSaveClick.bind(this)} style={{marginLeft:"3px"}}>Save</button>                            
                                <button className="blueButton" onClick={this.handleCancelClick.bind(this)} style={{marginLeft:"3px"}}>Cancel</button>                           
                                <label>
                                    <input type="checkbox"
                                        checked={this.state.showEditor}
                                        onChange={this.handleEditorCheckboxChanged.bind(this)}
                                        style={{marginLeft:"3px", marginRight:"3px"}} />
                                    JSON editor
                                </label>
                            </td>
                            <td style={{textAlign:"right"}}>                                                                
                                <div>{this.state.message}</div>
                            </td>
                        </tr>
                        {
                            this.state.showEditor ?
                                (
                                    <tr>
                                        <td colSpan={2}>
                                            <div style={styleOverflowable}><Editor
                                                value={this.state.viewSpecText}
                                                highlight={(code) => highlight(code, languages.js)}
                                                onValueChange={this.handleEditorChange.bind(this)}
                                                padding={10}
                                                style={{
                                                    background: "white",
                                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                                    fontSize: 12,
                                                }}
                                            /></div>
                                        </td>
                                    </tr>
                                ) : (<tr>
                                    <td colSpan={2}>
                                        <div style={{ width: "500px", height: '350px', overflow: 'auto' }}>
                                            <table style={{ width: '100%' }}><tbody>
                                                <tr key="name-row"><td><input type="text" value={this.state.viewSpec.name} onInput={this.handleNameChange.bind(this)}></input></td></tr>
                                                {dataSourceIndices.map(index => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div style={{ display: 'flex' }}>
                                                                <Select
                                                                    value={getColumnAtIndex(index)}
                                                                    onChange={this.handleSelectChange.bind(this, index)}
                                                                    options={availableColumns}
                                                                    styles={customStyles}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>))
                                                }
                                            </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>)
                        }

                    </tbody>
                </table>
            </div>
        )
    }
}

export default DataSourceEditor