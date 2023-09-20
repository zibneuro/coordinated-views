import React from 'react';
import CoordinatedView from '../core/coordinatedView';
import { deepCopy } from '../core/utilCore';
import { CustomEvent } from '../core/interactionEvent';


const parameterColumns = ['sample_idx_original','ephys.CaDynamics_E2_v2.apic.decay',
    'ephys.CaDynamics_E2_v2.apic.gamma', 'ephys.CaDynamics_E2_v2.axon.decay',
    'ephys.CaDynamics_E2_v2.axon.gamma', 'ephys.CaDynamics_E2_v2.soma.decay',
    'ephys.CaDynamics_E2_v2.soma.gamma', 'ephys.Ca_HVA.apic.gCa_HVAbar',
    'ephys.Ca_HVA.axon.gCa_HVAbar', 'ephys.Ca_HVA.soma.gCa_HVAbar',
    'ephys.Ca_LVAst.apic.gCa_LVAstbar', 'ephys.Ca_LVAst.axon.gCa_LVAstbar',
    'ephys.Ca_LVAst.soma.gCa_LVAstbar', 'ephys.Im.apic.gImbar',
    'ephys.K_Pst.axon.gK_Pstbar', 'ephys.K_Pst.soma.gK_Pstbar',
    'ephys.K_Tst.axon.gK_Tstbar', 'ephys.K_Tst.soma.gK_Tstbar',
    'ephys.NaTa_t.apic.gNaTa_tbar', 'ephys.NaTa_t.axon.gNaTa_tbar',
    'ephys.NaTa_t.soma.gNaTa_tbar', 'ephys.Nap_Et2.axon.gNap_Et2bar',
    'ephys.Nap_Et2.soma.gNap_Et2bar', 'ephys.SK_E2.apic.gSK_E2bar',
    'ephys.SK_E2.axon.gSK_E2bar', 'ephys.SK_E2.soma.gSK_E2bar',
    'ephys.SKv3_1.apic.gSKv3_1bar', 'ephys.SKv3_1.apic.offset',
    'ephys.SKv3_1.apic.slope', 'ephys.SKv3_1.axon.gSKv3_1bar',
    'ephys.SKv3_1.soma.gSKv3_1bar', 'ephys.none.apic.g_pas',
    'ephys.none.axon.g_pas', 'ephys.none.dend.g_pas',
    'ephys.none.soma.g_pas', 'scale_apical.scale']

class TimeControlView extends CoordinatedView {
    constructor(props) {
        super(props);

        this.state.time = 20;            
        this.state.t0 = 275; //this.dataManager.simulationData.voltage_timeseries_points.tstart
        this.state.tEnd = 375; //this.dataManager.simulationData.voltage_timeseries_points.tend           
        this.state.simulations = [];
        this.sampleIndices = [];
    }

    updateSelection() {                       
        if(this.selection.length === 0){
            this.setState(state => {
                state.simulations = [];
                return state;
            });
        } else {
            this.setSampleIndices(this.selection);    
        }          
      }

    setSampleIndices(indices) {
        this.sampleIndices = indices;
        let that = this;        
        this.dataManager.getValues((responseData) => {            
            let unloadedSimulations = [];
            let parameterValues = responseData.values;                
            for (let i = 0; i < parameterValues.length; i++) {
                unloadedSimulations.push({    
                    selectionIdx : indices[i],                
                    parameters : parameterValues[i],
                    voltage_timeseries_points : undefined
                });            
            }
            that.setState(state => {
                state.simulations = unloadedSimulations;
                return state;
            });
        }, this.dataTable, deepCopy(indices), parameterColumns);
    }

    
    onTimeChanged(t) {
        const newValue = parseInt(t.target.value);
        this.setState((state) => {
            state.time = newValue;            
            return state;
        });
        
        const data = {
            t_absolute: newValue,
            t_min: this.state.t0,
            t_max: this.state.tEnd,
            t_step: newValue - this.state.t0
        };
        this.notifyInteraction(new CustomEvent(this.name, "time").setData(data, "time"));
    }

    onLoadSimulation(simulationProps) { 
        let that = this;
        this.dataManager.getSimulation((simulationData) => {
            if(simulationData.voltage_timeseries_points){
                that.setState((state) => {
                    for(let i=0; i<this.state.simulations.length; i++){
                        if(state.simulations[i].parameters.sample_idx_original === simulationData.sample_idx_original){                        
                            state.simulations[i].voltage_timeseries_points = simulationData.voltage_timeseries_points;
                        }
                    }
                    return state;
                });
            } else {
                console.log("simulation failed for", simulationProps);
            }            
        }, simulationProps.parameters);                      
    }

    onShowSimulation(idx, simulationProps) {
        const data = {            
            idx : idx,
            voltage_timeseries_points : deepCopy(simulationProps.voltage_timeseries_points)
        }
        this.notifyInteraction(new CustomEvent(this.name, "simulation").setData(data, "voltage_timeseries_points"));
    }

    getParameterTable() {

        const formatParameterHeader = (text) => {
            return <div className='blueText'>{text.replace("ephys.", "")}</div>
        }

        const formatParameterValue = (value, idx) => {
            if(idx === 0){
                return <div className='parameterText'>{value}</div>
            } else {
                return <div className='parameterText'>{value.toExponential(4)}</div>
            }            
        }

        const getColHeaders = () => {
            return parameterColumns.map((valueHeader, idx) => {
                return <td key={"colHead" + idx.toString()}>{formatParameterHeader(valueHeader)}</td>
            });
        }

        const getHeaderRow = () => {
            return <tr key="headerRow"><td></td>{getColHeaders()}</tr>;
        }

        const getParamsForRow = (rowIdx, simulationProps) => {
            return parameterColumns.map((parameterName, idx) => {                
                const value = simulationProps.parameters[parameterName];               
                return <td key={"paramVals" + rowIdx.toString() + "_"  + idx.toString()}>{formatParameterValue(value, idx)}</td>                                                
            });
        }

        const getButton = (idx, simulationProps) => {
            if(simulationProps.voltage_timeseries_points){
                return <td>
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <button className='greenButton' style={{width:"48px"}} onClick={this.onShowSimulation.bind(this, 0, simulationProps)}>View1</button>
                                </td>
                                <td>
                                <button className='greenButton' style={{width:"48px"}} onClick={this.onShowSimulation.bind(this, 1, simulationProps)}>View2</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>                                        
                </td>
            } else {
                return <td>
                    <button className='blueButton' style={{width:"100px"}} onClick={this.onLoadSimulation.bind(this, simulationProps)}>Run</button>
                </td>
            }            
        }

        const getDataRow = (idx, simulationProps) => {
            return <tr key={"paramRow" + idx.toString()}>{getButton(idx, simulationProps)}{getParamsForRow(idx, simulationProps)}</tr>
        }

        return (            
            <table className='parameterTable'>
                <tbody>
                    {getHeaderRow()}                    
                    {this.state.simulations.map((simulationProps, idx) => getDataRow(idx, simulationProps))}
                </tbody>
            </table>
        )
    }

    render() {
        return (
            <table style={{ width: this.width, height: "170px", backgroundColor: "white", tableLayout: 'fixed'}}><tbody><tr><td>
                <input style={{ width: "100%"}} type="range" min={this.state.t0} max={this.state.tEnd} value={this.state.time} onChange={this.onTimeChanged.bind(this)} className="slider"></input>
            </td></tr>
                <tr>
                    <td>
                        <div style={{overflowX : "auto", width: "100%", overflowY : "auto", height: "100px"}}>
                            {this.getParameterTable()}
                        </div>
                    </td>
                </tr>
            </tbody></table>
        )
    }    
}

export default TimeControlView