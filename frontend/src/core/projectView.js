import React from 'react';
import { deepCopy } from './utilCore';


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
      const response = await fetch(this.dataManager.getDataServerURL("")); // Replace with your server URL
      let objects = await response.json();
      if(!Array.isArray(objects)){
        objects = [objects];
      }
      //console.log(objects);
      this.setState({ objects, isLoading: false });
    } catch (error) {
      console.error('Error loading objects:', error);
      this.setState({ isLoading: false });
    }
  };

  deleteObject = async (objectName) => {
    try {
      await fetch(this.dataManager.getDataServerURL("") + `${objectName}`, {
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
    this.viewManager.setGrammar(object.data.grammar);
    this.viewManager.OnProjectLoaded.notifyObservers();
    this.viewManager.updateWorkspace();    
  }

  handleNameChange = (event) => {
    this.setState({ newObjectName: event.target.value });
  };

  handleDataChange = (event) => {
    this.setState({ newObjectData: event.target.value });
  };

  addObject = async (event) => {
    event.preventDefault();
    const newObjectName = this.state.newObjectName;
    const grammar = deepCopy(this.viewManager.getGrammar());
    grammar.views = deepCopy(this.viewManager.view_specifications);
    
    const specData = {        
        grammar : grammar
    }    
    if (!newObjectName || !grammar) return;

    try {
      await fetch(this.dataManager.getDataServerURL(""), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newObjectName, data: specData }),
      });       
      this.loadObjects();      
    } catch (error) {
      console.error('Error adding object:', error);
    }
  };

  render() {
    let objects = this.state.objects;
    
    const newObjectName = this.state.newObjectName;
    const isLoading = this.state.isLoading; 

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


