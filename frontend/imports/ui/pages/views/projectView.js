import React, { useState } from 'react';
import { deepCopy } from './core/utilCore';


class ProjectControl extends React.Component {
  constructor(props) {
    super(props);

    this.viewManager = props.viewManager;
    this.dataManager = this.viewManager.dataManager;

    this.state = {
      objects: [], // Holds the existing JSON objects from the server
      newObjectName: '', // Holds the name of the new object being added
      newObjectData: '', // Holds the data of the new object being added
      isLoading: false, // Tracks if data is being loaded from the server
    };
  }

  componentDidMount() {
    this.loadObjects();
  }

  loadObjects = async () => {
    try {
      this.setState({ isLoading: true });
      const response = await fetch(this.dataManager.getMatrixServerURL("")); // Replace with your server URL
      const objects = await response.json();
      //console.log(objects);
      this.setState({ objects, isLoading: false });
    } catch (error) {
      console.error('Error loading objects:', error);
      this.setState({ isLoading: false });
    }
  };

  deleteObject = async (objectName) => {
    try {
      await fetch(this.dataManager.getMatrixServerURL("") + `${objectName}`, {
        method: 'DELETE',
      }); // Replace with your server URL
      this.setState((prevState) => ({
        objects: prevState.objects.filter(
          (object) => object.name !== objectName
        ),
      }));
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  };

  applyObject = (object) => {
    //console.log(object);
    this.viewManager.notifyViewSpecificationsChanged(deepCopy(object.data.viewSpec));
    this.viewManager.setGrammar(object.data.grammar);
    this.viewManager.OnProjectLoaded.notifyObservers();
    this.viewManager.updateWorkspace();
    //console.log(JSON.parse(object.data));
  }

  handleNameChange = (event) => {
    this.setState({ newObjectName: event.target.value });
  };

  handleDataChange = (event) => {
    this.setState({ newObjectData: event.target.value });
  };

  addObject = async (event) => {
    event.preventDefault();
    const { newObjectName, newObjectData } = this.state;
    const spec = this.viewManager.view_specifications;
    const specData = {
        viewSpec : spec,
        grammar : this.viewManager.getGrammar()
    }    
    if (!newObjectName || !spec) return;

    try {
      const response = await fetch(this.dataManager.getMatrixServerURL(""), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newObjectName, data: specData }),
      }); // Replace with your server URL
      //const createdObject = await response.json();
      this.loadObjects();
      /*
      this.setState((prevState) => ({
        objects: [...prevState.objects, createdObject],
        newObjectName: '',
        newObjectData: '',
      }));
      */
    } catch (error) {
      console.error('Error adding object:', error);
    }
  };

  render() {
    const { objects, newObjectName, newObjectData, isLoading } = this.state;

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <div className='codeTextHeader'>Load session</div>
        <table style={{width:"100%"}}>
            <tbody>
            {objects.map((object) => (
                <tr key={object.name}>
                    <td className='codeText'>{object.name}</td>
                    <td style={{textAlign:'right'}}><button className='blueButton' onClick={() => this.deleteObject(object.name)}>
                        Delete
                    </button>
                    <button className='redButton' style={{marginLeft:5}} onClick={() => this.applyObject(object)}>
                Apply
              </button></td>
                </tr>
            ))}
            </tbody>
        </table>
        
        <div className='codeTextHeader'>Save session</div>
        <form onSubmit={this.addObject}>
          <input
            type="text"
            value={newObjectName}
            onChange={this.handleNameChange}
            placeholder="session name"
          />         
          <button className='blueButton' type="submit">Save</button>
        </form>
      </div>
    );
  }
}

export default ProjectControl;


