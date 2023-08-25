import React, { useState } from 'react';
import { deepCopy } from './core/utilCore';

import Select from 'react-select';
import DataSourceEditor from './dataSourceEditor';
import { string } from 'prop-types';

const customStyles = {
    control: (provided) => ({
      ...provided,
      width: '250px',
      fontSize: '14px'
    }),
  };

class ViewSpecificationsControl extends React.Component {
    constructor(props) {
        super(props);

        this.viewManager = props.viewManager;
        this.dataManager = this.viewManager.dataManager;

        this.available_view_types = this.dataManager.available_views;        

        console.log(this.available_view_types);

        this.state = {
            objects: this.viewManager.view_specifications,
            editingIndex: -1,            
            selected_view_add: this.dataManager.available_views[0].type
        };

        let that = this;
        this.viewManager.OnProjectLoaded.add(()=>{
            that.setState((state) => {
                state.objects = this.viewManager.view_specifications;
                return state;
            })
        })

        console.log(this.state.objects);
    }

    getViewId() {
        let id = this.state.objects.reduce((max, obj) => (obj.id > max ? obj.id : max), 0);
        return id + 1;
    }

    handleViewOptionChange(event) {        
        console.log(event)
        this.setState((state, props) => {
            if(event){
                state.selected_view_add = event.value;            
            } else {
                state.selected_view_add = undefined;            
            }         
            
            return state;
        });
    }

    handleViewAddClick(event) {        
        if(!this.state.selected_view_add){
            return;
        }
        let newView = deepCopy(this.dataManager.available_views.find(view => view.type === this.state.selected_view_add));        
        newView.id = this.getViewId();        
        newView.name = "view " + newView.id.toString();
        newView.data_sources = [];        
        let that = this;
        this.setState((state, props) => {
            state.objects.push(newView);
            console.log(state.objects);
            that.notifyChanged(state.objects);
            return state;
        });        
    }

    notifyChanged(specifications) {
        this.viewManager.notifyViewSpecificationsChanged(deepCopy(specifications));        
    }

    handleApply() {        
        this.viewManager.updateWorkspace()        
    }

    handleEditClick = (index) => {        
        this.setState({ editingIndex: index });
    };
    

    handleSaveClick = (viewSpec) => {        
        let that = this;
        this.setState((state) => {            
            state.objects[state.editingIndex] = deepCopy(viewSpec);
            that.notifyChanged(state.objects);
            state.editingIndex = -1;            
            return state;
        })
    };

    handleCancelClick = () => {
        this.setState({ editingIndex: -1, editedName: '' });
    };

    handleRemoveClick = (index) => {                
        let that = this;
        this.setState((state, props)=>{
            const { objects } = this.state;
            objects.splice(index, 1);            
            state.objects = objects;
            that.notifyChanged(state.objects);
            return state;
        });
    };

    render() {
        let formatDatasources = (dataSources) => {
            string = ""
            for (let k = 0; k < dataSources.length; k++) {
                if (k == 0) {
                    string += dataSources[k];
                } else {
                    string += " / " + dataSources[k];
                }     
            }                        
            if (string.length == 0) {
                //return <div className='redText'>no datasources specified</div>;
                return <div className='redText'></div>;
            } else {
                return <div className='blueText'>{string}</div>
            }           
        }

        let formatViewHeader = (id, type) => {
            return <div className='codeText'>{id}: {type}</div>
        }

        const { objects, editingIndex, editedName } = this.state;        
        const { selectedOption } = this.state.selected_view_add;
        
        return (            
            <table style={{ width: '100%' }}><tbody>
                <tr>
                    <td>
                        <div style={{ display: 'flex' }}>
                            <Select
                                value={selectedOption}
                                onChange={this.handleViewOptionChange.bind(this)}
                                options={this.dataManager.available_views.map(x => ({value: x.type, label: x.type}))}
                                styles={customStyles}
                            />
                            <button className='blueButton' onClick={this.handleViewAddClick.bind(this)}>Add</button>
                        </div>
                    </td>
                    <td style={{textAlign:"right"}}>
                        <button className='redButton' onClick={this.handleApply.bind(this)}>Apply</button>
                    </td>
                </tr>
                <tr>
                    <td colSpan={2}>
                        <div style={{ height: "700px", overflow: "auto" }}>
                            <table style={{ width: '100%' }}><tbody>
                                {objects.map((object, index) => (
                                    <tr key={object.id}>
                                        <td>
                                            {index === editingIndex ? (
                                                <table style={{width:"100%"}}>
                                                    <tbody>
                                                        <tr>                                                            
                                                            <td>
                                                                {formatViewHeader(object.name, object.type)}
                                                            </td>                                                            
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <div>
                                                                    <DataSourceEditor viewManager={this.viewManager}
                                                                        saveFn={this.handleSaveClick.bind(this)}
                                                                        cancelFn={this.handleCancelClick.bind(this)}                                                                       
                                                                        viewSpecification = {object}
                                                                    ></DataSourceEditor>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div>
                                                    <table>
                                                        <tbody>
                                                            <tr>                                                                
                                                                <td style={{ width: '100%' }}>
                                                                    {formatViewHeader(object.name, object.type)}
                                                                </td>
                                                                <td>
                                                                    <button className='blueButton' onClick={() => this.handleEditClick(index)}>Edit</button>
                                                                </td>
                                                                <td>
                                                                    <button className='blueButton' onClick={() => this.handleRemoveClick(index)}>Remove</button>
                                                                </td>
                                                            </tr>
                                                            <tr>                                                                
                                                                <td colSpan={3}>
                                                                    {formatDatasources(object.data_sources)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </td>
                </tr>

            </tbody>
            </table>

        );
    }
}


export default ViewSpecificationsControl