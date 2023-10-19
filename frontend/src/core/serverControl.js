import React from 'react';
import { DEFAULT_SERVER_SETTINGS } from './defaults';


export function getServerURL(serverName) {
    const customUrl = window.sessionStorage.getItem(serverName);        
    if(customUrl){
        return customUrl;
    } else if(DEFAULT_SERVER_SETTINGS[serverName] !== undefined){        
        return DEFAULT_SERVER_SETTINGS[serverName]        
    } else {
        throw Error(serverName);
    }    
}


function isValidUrl(url) {
    try {
        new URL(url);
    } catch (_) {
        return false;
    }
    return true;
}


class ServerControl extends React.Component {
    constructor(props) {
        super(props);

        this.viewManager = props.viewManager;
        this.dataManager = this.viewManager.dataManager;

        this.state = {
            urlDataServer: getServerURL("DATA_SERVER"),
            urlComputeServer: getServerURL("COMPUTE_SERVER")
        }
    }

    handleUrlChange(event, server) {
        this.setState((state) => {
            if(server === "DATA_SERVER"){
                state.urlDataServer = event.target.value;
            } else if (server === "COMPUTE_SERVER") {
                state.urlComputeServer = event.target.value;
            }
            
            return state;
        });
    }

    handleSaveClick() {        
        console.log(this.state.urlDataServer, isValidUrl(this.state.urlDataServer));
        if (isValidUrl(this.state.urlDataServer)) {
            window.sessionStorage.setItem("DATA_SERVER", this.state.urlDataServer);

        }
        if (isValidUrl(this.state.urlComputeServer)) {
            window.sessionStorage.setItem("COMPUTE_SERVER", this.state.urlComputeServer);
        }

        window.location.reload();
    }

    render() {                
        const inputColor = this.dataManager.dataServerConnected ? "white" : "lightcoral";

        return <table style={{ width: '100%' }}><tbody>
            <tr>
                <td>
                    <div className='codeTextHeader'>Connections</div>
                </td>
            </tr>
            <tr>
                <td>
                    <input style={{ width: '95%', backgroundColor: inputColor }} type="text" value={this.state.urlDataServer} onInput={(event) => this.handleUrlChange(event, "DATA_SERVER")}></input>
                </td>
            </tr>
            <tr>
                <td>
                    <input style={{ width: '95%', backgroundColor: "white" }} type="text" value={this.state.urlComputeServer} onInput={(event) => this.handleUrlChange(event, "COMPUTE_SERVER")}></input>
                </td>
            </tr>                        
            <tr>
                <td>
                    <button className="blueButton" onClick={this.handleSaveClick.bind(this)}>Reconnect</button>
                </td>
            </tr>
        </tbody>
        </table>
    }
}

export default ServerControl

