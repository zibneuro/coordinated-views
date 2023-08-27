
import os
import json
import sys
import glob
import flask
import numpy as np
from flask_cors import CORS
from flask import request, jsonify
from flask_cors import cross_origin
from pathlib import Path
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler, StandardScaler


import util

app = flask.Flask(__name__)
CORS(app)


"""
########################################################################################
                                session storage
########################################################################################
"""

def write_objects_to_file(filenameProjects):
    with open(filenameProjects, 'w') as file:
        json.dump(objects, file)

@app.route('/dataServer/', methods=['GET'])
def get_objects():
    global objects
    return jsonify(objects)

@app.route('/dataServer/<name>', methods=['DELETE'])
def delete_object(name):
    global objects
    global filenameProjects
    objects = [obj for obj in objects if obj['name'] != name]
    write_objects_to_file(filenameProjects)    
    return jsonify({'message': 'Object deleted'})

@app.route('/dataServer/', methods=['POST'])
def add_object():

    def delete_object_by_property(json_list, property_name, property_value):
        filtered_list = [obj for obj in json_list if obj.get(property_name) != property_value]
        return filtered_list

    global objects
    global filenameProjects
    new_object = request.get_json()

    objects = delete_object_by_property(objects, "name", new_object["name"])
    objects.append(new_object)
    write_objects_to_file(filenameProjects)
    return jsonify(new_object)

"""
########################################################################################
                                end of session storage
########################################################################################
"""


@app.route("/dataServer/getMetaData", methods=["GET", "POST"])
@cross_origin()
def getMetaData():
    global tables
    global config

    if request.method == "POST":
        if request.data:
            data = request.get_json(force=True)
            
            meta_data = []            
            for tableName, tableData in tables.items():
                df = tableData["flat"]            
                meta_data.append({
                    "name" : tableName,
                    "num_rows" : df.shape[0],
                    "columns" : df.columns.to_list(),
                    "data_ranges" : get_data_ranges(df)                
                })

            response_data = {
                "meta_data" : meta_data,
                "available_views" : config["available_views"],
                "cached_tables" : config["cached_tables"],
                "table_mapping" : config["table_mapping"]
            }
            return json.dumps(response_data)

            
def get_data_ranges(df):
    ranges = {}
    ranges["min"] = df.min().to_list()
    ranges["max"] = df.max().to_list()
    return ranges 

def normalize(df, low=-1, high=1):
    scaler = MinMaxScaler(feature_range=(low, high))
    df_normalized = pd.DataFrame(scaler.fit_transform(df), columns=df.columns)
    return df_normalized


def getPCA(df):    
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df)
    
    pca = PCA(2)
    pca.fit(scaled_data)
    principal_components = pca.transform(scaled_data)

    min_max_scaler = MinMaxScaler(feature_range=(-1, 1))
    normalized_components = min_max_scaler.fit_transform(principal_components)

    return normalized_components.tolist()


@app.route("/dataServer/getResourceJSON", methods=["GET", "POST"])
@cross_origin()
def getResourceJSON():
    global resourceDir

    if request.method == "POST":
        if request.data:
            data = request.get_json(force=True)

            resourceName = data["filename"]
            filename = resourceDir/resourceName

            if(not os.path.exists(filename)):
                raise ValueError(filename)
            else:
                jsonData = util.loadJson(filename)

                response_data = {
                    "filename" : resourceName,
                    "jsonData" : jsonData
                }

                return json.dumps(response_data)



@app.route("/dataServer/getValues", methods=["GET", "POST"])
@cross_origin()
def getValues():
    global tables
    
    if request.method == "POST":
        if request.data:
            data = request.get_json(force=True)

            tableName = data["table"]
            df = tables[tableName]["flat"]

            columns = data["columns"]
            indices = data["indices"]
            format = data["format"]
            print(columns)
            print(set(columns) - set(df.columns))
            assert set(columns).issubset(set(df.columns))
            assert len(indices) == 0 or max(indices) < df.shape[0]            

            if(len(indices) == 0):
                filtered_df = df[columns]
            else:
                filtered_df = df.iloc[indices][columns]

            if(format == "expanded"):
                values = filtered_df.to_dict(orient="records")
            elif(format == "flat"):
                values = filtered_df.values.tolist()
            elif(format == "flat-normalized"):
                values = normalize(filtered_df).values.tolist()
            elif(format == "flat-normalized-PCA"):
                values = getPCA(filtered_df) 
            else:
                raise ValueError(format)

            response_data = {
                "columns" : columns,
                "indices" : indices,
                "values" : values,
                "data_ranges" : get_data_ranges(filtered_df)
            }
   
            return json.dumps(response_data)
    


@app.route("/dataServer/test", methods=["GET", "POST"])
@cross_origin()
def test():
    return "data server"


def load_tables(data_folder, max_num_rows = 50000):    
    csvFiles = glob.glob(os.path.join(data_folder,"*.csv"))
    tables = {}
    
    for filepath in csvFiles:   
        basename = os.path.basename(filepath) 

        print("start read: {}".format(basename))
        df = pd.read_csv(filepath, nrows=max_num_rows)    
        print("complete read")

        samplingSettings = config["sampling_settings"]
        #print(samplingSettings)
        if(basename in samplingSettings):
            settings = samplingSettings[basename]
            seed = settings["seed"]
            sampleSize = settings["number"]
            randomState = np.random.RandomState(seed)
            df = df.sample(sampleSize, random_state=randomState)

        columns_data = df.to_dict(orient="records")
        tables[basename] = {}
        tables[basename]["flat"] = df
        tables[basename]["records"] = columns_data

    return tables



def printUsageAndExit():
    print("Usage:")
    print("python data_server.py <data-folder> [<port>]")
    exit()


if __name__ == "__main__":
    if(len(sys.argv) not in [2,3]):
        printUsageAndExit()

    dataDir = Path(sys.argv[1])

    port = 5000
    if(len(sys.argv) == 3):
        port = int(sys.argv[2])

    resourceDir = dataDir/"resources"
    config = util.loadJson(dataDir/"config.json")
    tables = load_tables(dataDir)

    # init session storage
    objects = []
    filenameProjects = dataDir/"projects.json"

    # Load objects from the file on server startup
    try:
        with open(filenameProjects, 'r') as file:
            objects = json.load(file)
    except FileNotFoundError:
        objects = []

    app.run(host="localhost", port=port)
    


