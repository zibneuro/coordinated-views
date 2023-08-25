import React, { useState } from 'react';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another


const styleOverflowable = {
    overflowY: 'auto',
    float: 'left',
    width: '100%',
    height: '740px',
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

export function getDefaultGrammar() {
    const jsonText = 
`{
  "grid" : {
    "cols" : 12,
    "rowHeight" : 100,
    "width" : 1200
  },
  "layouts" : {    
    "L1" : [{"x": 0, "y": 0, "w": 6, "h": 5},
      {"x": 6, "y": 0, "w": 6, "h": 5},
      {"x": 0, "y": 5, "w": 12, "h": 2}
     ]    
  },
  "initialLayout" : "L1",
  "interactions" : {}
}`;
  return jsonText;     
}

class GrammarControl extends React.Component {
    constructor(props) {
        super(props);

        this.viewManager = props.viewManager;
        this.dataManager = this.viewManager.dataManager;

        this.state = {
            message : "",
            code: JSON.stringify(this.viewManager.grammar, null, 2),
        }
        
        let that = this;
        this.viewManager.OnProjectLoaded.add(()=>{
          //console.log("project", this.viewManager.grammar);
          that.setState((state)=>{
            state.code = JSON.stringify(that.viewManager.grammar, null, 2);
            return state;
          })
        })
        
    }

    handleChange(newValue) {        
        const json = parseJson(newValue);
        if(json){            
            this.setState((state, props) => {
                state.code = newValue;
                state.message = "";
                return state;
            });
            this.viewManager.setGrammar(json);
        } else {
            this.setState((state, props) => {
                state.code = newValue;
                state.message = "invalid json";
                return state;
            });
        }
    }

    handleApply() {
        if(this.state.message == ""){
            this.viewManager.updateWorkspace();
        }        
    }

    handleStepBack() {
        if(this.state.message == ""){
            this.viewManager.stepBack();
        }        
    }

    render() {
        return (
            <table style={{ width: "100%" }}>
                <tbody>
                    <tr>
                        <td><button onClick={this.handleStepBack.bind(this)} className='blueButton'>Step back</button></td>
                        <td>{this.state.message}</td>
                        <td style={{ textAlign: "right" }}>                            
                             <button onClick={this.handleApply.bind(this)} className='redButton'>Apply</button></td>
                    </tr>
                    <tr>                        
                        <td colSpan={3}><div style={styleOverflowable}><Editor
                            value={this.state.code}
                            onValueChange={this.handleChange.bind(this)}
                            highlight={(code) => highlight(code, languages.js)}
                            padding={10}
                            style={{
                                background: "white",
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 12,
                            }}
                        /></div></td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

export default GrammarControl

