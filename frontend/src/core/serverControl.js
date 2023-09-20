import React from 'react';
import { DEFAULT_SERVER_SETTINGS } from './defaults';



export function getServerSettings() {
    return DEFAULT_SERVER_SETTINGS;
}

export function getSessionDataServerURL(defaultUrl) {
    let url = window.sessionStorage.getItem("dataServerURL")
    //console.log(url);
    if (url) {
        return url
    } else {
        return defaultUrl
    }
}

function setDataServerUrl(url) {
    window.sessionStorage.setItem("dataServerURL", url);
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

        //const currentUrl = getSessionDataServerURL(getServerSettings.DATA_SERVER_DEV);

        this.state = {
            urlDataServer: getServerSettings().DATA_SERVER_DEV,
            urlComputeServer: getServerSettings().COMPUTE_SERVER_DEV
        }
    }

    handleUrlChange(event) {
        this.setState((state) => {
            state.url = event.target.value;
            return state;
        });
    }

    handleSaveClick() {
        const url = this.state.url;
        if (isValidUrl(url)) {
            //console.log("save");
            setDataServerUrl(url);
            window.location.reload();
        }
    }

    render() {
        //const inputColor = isValidUrl(this.state.url) ? "white" : "LightCoral";
        const inputColor = "lightgrey";

        return <table style={{ width: '100%' }}><tbody>
            <tr>
                <td>
                    <div className='codeTextHeader'>Connections</div>
                </td>
            </tr>
            <tr>
                <td>
                    <input disabled style={{ width: '95%', backgroundColor: inputColor }} type="text" value={this.state.urlDataServer} onInput={this.handleUrlChange.bind(this)}></input>
                </td>
            </tr>
            <tr>
                <td>
                    <input disabled style={{ width: '95%', backgroundColor: inputColor }} type="text" value={this.state.urlComputeServer} onInput={this.handleUrlChange.bind(this)}></input>
                </td>
            </tr>                        
        </tbody>
        </table>
    }
}

/*
<tr>
    <td>
        <button disabled={true} className="blueButton" onClick={this.handleSaveClick.bind(this)}>Connect</button>
    </td>
</tr>
*/

export default ServerControl

