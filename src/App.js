import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CustomCircleMarker from './components/CustomCircleMarker';
import { IoIosWater } from 'react-icons/io';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import Swal from 'sweetalert2';
import axios from 'axios';
import './App.css';

const dt_node_1 = [17.44773337470836, 78.34853368169597];
const dt_node_2 = [17.44711288989055, 78.34927584903512];
const dt_node_3 = [17.446087802969153, 78.35051801020884];

const newNode1 = [dt_node_1[0] - 0.0002, dt_node_1[1] - 0.0002];
const newNode2 = [dt_node_2[0] - 0.0002, dt_node_2[1] - 0.0002];
const newNode3 = [dt_node_3[0] - 0.0002, dt_node_3[1] - 0.0002];
const newNode4 = [dt_node_1[0] + 0.0002, dt_node_1[1] + 0.0002];
const newNode5 = [dt_node_2[0] + 0.0002, dt_node_2[1] + 0.0002];
const newNode6 = [dt_node_3[0] + 0.0002, dt_node_3[1] + 0.0002];


// Arranged in a order to Create Proper Rectangle 
const polygonCoordinates = [newNode1, newNode2, newNode3, newNode6, newNode5, newNode4];


const mapPosition = [17.44695, 78.34891];

const data = [
  {
    "Node ID": "Node-1",
    "Node Location": [17.44773337470836, 78.34853368169597],
    "Data String Parameters": [
      "Temperature", 
      "Uncompensated_TDS" , 
      "Compensated_TDS", 
      "Voltage_TDS"
    ]
  },
  {
    "Node ID": "Node-2",
    "Node Location": [17.44711288989055, 78.34927584903512],
    "Data String Parameters": [
      "Temperature", 
      "Uncompensated_TDS" , 
      "Compensated_TDS", 
      "Voltage_TDS"
    ]
  },
  {
    "Node ID": "Node-3",
    "Node Location": [17.446087802969153, 78.35051801020884],
    "Data String Parameters": [
      "Temperature", 
      "Uncompensated_TDS" , 
      "Compensated_TDS", 
      "Voltage_TDS"
    ]
  }
];

function App() {
  const [markers, setMarkers] = useState([]);
  const [clickedNode, setClickedNode] = useState(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);

  const [clickedLatLng, setClickedLatLng] = useState(null);
  const [clickedCoordinates, setClickedCoordinates] = useState(null);

  const [latitudeInput, setLatitudeInput] = useState('17.447356');
  const [longitudeInput, setLongitudeInput] = useState('78.349047');
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);

  const [lastNodeCrossed, setLastNodeCrossed] = useState(null); 

  const mapRef = useRef();

  const clearMarkers = () => {
    setMarkers([]);
  };

  const handleRemoveMarker = (index) => {
    if (index !== null) {
      const updatedMarkers = markers.filter((_, i) => i !== index);
      setMarkers(updatedMarkers);
      setSelectedMarkerIndex(null);
    }
  };

  const isPointNearLine = (point, line, tolerance) => {
    const [x, y] = point;
  
    for (let i = 0; i < line.length - 1; i++) {
      const [x1, y1] = line[i];
      const [x2, y2] = line[i + 1];
  
      // Calculate the distance from the point to the line segment
      const distance = Math.hypot(x - x1, y - y1) + Math.hypot(x - x2, y - y2);
  
      // Check if the distance is within the tolerance
      if (Math.abs(distance - Math.hypot(x2 - x1, y2 - y1)) <= tolerance) {
        return true;
      }
    }
  
    return false;
  };
  
  const getNearestNode = (markerPosition) => {
    const distances = {
      Node1: mapRef.current.distance(markerPosition, [dt_node_1[0], dt_node_1[1]]),
      Node2: mapRef.current.distance(markerPosition, [dt_node_2[0], dt_node_2[1]]),
      Node3: mapRef.current.distance(markerPosition, [dt_node_3[0], dt_node_3[1]]),
    };
  
    const nearestNode = Object.keys(distances).reduce((a, b) => (distances[a] < distances[b] ? a : b));
  
    return { node: nearestNode, distance: distances[nearestNode] };
  };
  

  const handleMapClick = (e) => {
    console.log("handleMapClick Called ");
    const latitude = e.latlng.lat;
    const longitude = e.latlng.lng;
    setClickedLatLng({ latitude, longitude });
    console.log(latitude, longitude);
  
    const rectangleBounds = L.latLngBounds([newNode1, newNode2, newNode3, newNode6]);
  
    // Check if the clicked point is inside the rectangle
    if (rectangleBounds.contains([latitude, longitude])) {
      console.log("Marker added");
  
      // Get the distances to neighboring nodes
      const distanceToNode1 = mapRef.current.distance([latitude, longitude], newNode1);
      const distanceToNode2 = mapRef.current.distance([latitude, longitude], newNode2);
      const distanceToNode3 = mapRef.current.distance([latitude, longitude], newNode3);
  
      // Calculate the total distance between neighboring nodes
      const totalDistance1 = mapRef.current.distance(newNode1, newNode2);
      const totalDistance2 = mapRef.current.distance(newNode2, newNode3);
      const totalDistance3 = mapRef.current.distance(newNode3, newNode1);
  
      // Calculate the percentages along the line segment
      const percentage1 = (distanceToNode1 / totalDistance1) * 100;
      let percentage2 = (distanceToNode2 / totalDistance2) * 100;
      const percentage3 = (distanceToNode3 / totalDistance3) * 100;

      if (percentage1 < 100) {
        percentage2 = percentage2 - 100;
      }
  
      console.log('Nearest Node 1:', newNode1);
      console.log('Nearest Node 2:', newNode2);
      console.log('Nearest Node 3:', newNode3);
      console.log('Distance to Nearest Node 1:', distanceToNode1.toFixed(2), 'meters');
      console.log('Distance to Nearest Node 2:', distanceToNode2.toFixed(2), 'meters');
      console.log('Distance to Nearest Node 3:', distanceToNode3.toFixed(2), 'meters');
      console.log('Percentage along the Line 1-2:', percentage1.toFixed(2), '%');
      console.log('Percentage along the Line 2-3:', percentage2.toFixed(2), '%');
      console.log('Percentage along the Line 3-1:', percentage3.toFixed(2), '%');
  
      // Proceed to add a marker
      const newMarker = {
        position: [latitude, longitude],
        flowrate: 0,
        totalflow: 0,
      };
      setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
      setLatitudeInput('');
      setLongitudeInput('');
    } else {
      // The clicked point is not inside the rectangle, show an alert
      console.log("Invalid Placement - Outside Rectangle");
      Swal.fire({
        title: 'Invalid Placement',
        text: 'Please place the marker inside the rectangle.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };
  
  

  // Nearest Node Calculator with distance
  // const handleMapClick = (e) => {
  //   console.log("handleMapClick Called ");
  //   const latitude = e.latlng.lat;
  //   const longitude = e.latlng.lng;
  //   setClickedLatLng({ latitude, longitude });
  //   console.log(latitude, longitude);
  
  //   const rectangleBounds = L.latLngBounds([newNode1, newNode2, newNode3, newNode6]);
  
  //   // Check if the clicked point is inside the rectangle
  //   if (rectangleBounds.contains([latitude, longitude])) {
  //     console.log("Marker added");
  //     const newMarker = {
  //       position: [latitude, longitude],
  //       flowrate: 0,
  //       totalflow: 0,
  //     };
  //     setMarkers([...markers, newMarker]);
  //     setLatitudeInput('');
  //     setLongitudeInput('');
  
  //     // Get the nearest node details
  //     const nearestNodeDetails = getNearestNode([latitude, longitude]);
  //     console.log('Nearest Node:', nearestNodeDetails.node);
  //     console.log('Distance to Nearest Node:', nearestNodeDetails.distance.toFixed(2), 'meters');
  //   } else {
  //     // The clicked point is not inside the rectangle, show an alert
  //     console.log("Invalid Placement");
  //     Swal.fire({
  //       title: 'Invalid Placement',
  //       text: 'Please place the marker inside the rectangle.',
  //       icon: 'error',
  //       confirmButtonText: 'OK',
  //     });
  //   }
  // };

  
//Rectangle Working Code 
//   const handleMapClick = (e) => {
//   console.log("handleMapClick Called ");
//   const latitude = e.latlng.lat;
//   const longitude = e.latlng.lng;
//   setClickedLatLng({ latitude, longitude });
//   console.log(latitude, longitude);

//   // Log if the point is near the rectangle
//   console.log(
//     'Is point near rectangle:',
//     isPointNearLine([latitude, longitude], [newNode1, newNode2, newNode3, newNode6, newNode5, newNode4], 0.0001)
//   );

//   // Check if the clicked point is close enough to the rectangle
//   if (isPointNearLine([latitude, longitude], [newNode1, newNode2, newNode3, newNode6, newNode5, newNode4], 0.0001)) {
//     // The clicked point is inside the rectangle, proceed to add a marker
//     console.log("Marker added");
//     const newMarker = {
//       position: [latitude, longitude],
//       flowrate: 0,
//       totalflow: 0,
//     };
//     setMarkers([...markers, newMarker]);
//     setLatitudeInput('');
//     setLongitudeInput('');
//   } else {
//     // The clicked point is not inside the rectangle, show an alert
//     console.log("Invalid Placement");
//     Swal.fire({
//       title: 'Invalid Placement',
//       text: 'Please place the marker inside the rectangle.',
//       icon: 'error',
//       confirmButtonText: 'OK',
//     });
//   }
// };

// const isPointInsideRectangle = (point, rectangle) => {
//   const [x, y] = point;
//   const [x1, y1, x2, y2, x3, y3, x4, y4] = rectangle;

//   const isInside = (x, y, x1, y1, x2, y2, x3, y3) => {
//     const d1 = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
//     const d2 = (x - x2) * (y3 - y2) - (y - y2) * (x3 - x2);
//     const d3 = (x - x3) * (y4 - y3) - (y - y3) * (x4 - x3);
//     const d4 = (x - x4) * (y1 - y4) - (y - y4) * (x1 - x4);
//     return (d1 > 0 && d2 > 0 && d3 > 0 && d4 > 0) || (d1 < 0 && d2 < 0 && d3 < 0 && d4 < 0);
//   };

//   return isInside(x, y, x1, y1, x2, y2, x3, y3) || isInside(x, y, x1, y1, x4, y4, x3, y3);
// };

  const logMarkerCoordinates = () => {
    markers.forEach((marker, index) => {
      console.log(`Marker ${index + 1}: ${marker.position}`);
    });
  };

  const buildPopupContent = (index) => {
    const marker = markers[index];
    if (marker && clickedLatLng) {
      return (
        <div>
          {`Marker ${index + 1} - Clicked Coordinates:`}
          <br />
          Latitude: {clickedLatLng.latitude}
          <br />
          Longitude: {clickedLatLng.longitude}
        </div>
      );
    } else {
      return (
        <div>
          {`Marker ${index + 1} - Coordinates:`}
          <br />
          Latitude: {marker.position[0].toFixed(6)}
          <br />
          Longitude: {marker.position[1].toFixed(6)}
        </div>
      );
    }
  };

  const addMarker = () => {
    if (latitudeInput && longitudeInput) {
      const newMarker = {
        position: [parseFloat(latitudeInput), parseFloat(longitudeInput)],
        temparature: 0,
        u_tds: 0,
        total_flow: 0,
        v_tds: 0,
      };
      setMarkers([...markers, newMarker]);
      setLatitudeInput((prev) => (prev === '' ? '' : (parseFloat(prev)).toString()));
      setLongitudeInput((prev) => (prev === '' ? '' : (parseFloat(prev)).toString()));
    }
  };

  
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.on('click', handleMapClick);

    // }
    const node1 = L.latLng(dt_node_1[0], dt_node_1[1]);
    const node2 = L.latLng(dt_node_2[0], dt_node_2[1]);
    const node3 = L.latLng(dt_node_3[0], dt_node_3[1]);

    const distanceNode1ToNode2 = node1.distanceTo(node2);
    const distanceNode2ToNode3 = node2.distanceTo(node3);
    const distanceNode1ToNode3 = node1.distanceTo(node3);

    console.log('Distance between Node 1 and Node 2:', distanceNode1ToNode2.toFixed(2), 'meters');
    console.log('Distance between Node 2 and Node 3:', distanceNode2ToNode3.toFixed(2), 'meters');
    console.log('Distance between Node 1 and Node 3:', distanceNode1ToNode3.toFixed(2), 'meters');


    // Log new coordinates
    console.log('New Node 1:', newNode1);
    console.log('New Node 2:', newNode2);
    console.log('New Node 3:', newNode3);
    console.log('New Node 4:', newNode4);
    console.log('New Node 5:', newNode5);
    console.log('New Node 6:', newNode6);

    // Draw a polygon with the new coordinates in red color
    L.polygon(polygonCoordinates, { color: 'red' }).addTo(mapRef.current);

  }

    const nodes = ["Node-1", "Node-2", "Node-3"];
    for (let i = 0; i < nodes.length; i++) {
      let url = "http://localhost:8080/desc/" + nodes[i];
      axios.get(url).then((response) => {
        data[nodes[i]] = response.data;
      });
    }
  }, [mapRef.current]);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Digital Twin Water Simulation</h1>
      <div className="main" id="map" style={{ width: '100%', textAlign: 'center' }}>
        <MapContainer
          ref={mapRef}
          center={mapPosition}
          zoom={18}
          style={{ maxWidth: '100%', height: '60vh' }}
          scrollWheelZoom={false}
          onClick={handleMapClick}
        >
          <TileLayer url='https://tile.openstreetmap.org/{z}/{x}/{y}.png' />
          {data.map((nodeData, index) => (
            <CustomCircleMarker
              key={index}
              nodeData={nodeData}
              setClickedNode={setClickedNode}
            />
          ))}
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker.position}
              icon={
                new L.divIcon({
                  className: 'custom-icon',
                  html: ReactDOMServer.renderToString(<IoIosWater size={30} color="blue" />),
                  iconSize: [30, 30],
                })
              }
            >
              <Popup>{buildPopupContent(index)}</Popup>
            </Marker>
          ))}
          <Polyline pathOptions={{ color: 'green', dashArray: '5' }} positions={[dt_node_1, dt_node_2, dt_node_3]} />
        </MapContainer>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div>
          <label>Latitude:</label>
          <input
            type="number"
            value={latitudeInput}
            // defaultValue={17.447356}
            onChange={(e) => setLatitudeInput(e.target.value)}
          />

          <label>Longitude:</label>
          <input
            type="number"
            value={longitudeInput}
            // defaultValue={78.349047}
            onChange={(e) => setLongitudeInput(e.target.value)}
          />
        </div>
        <button onClick={() => handleRemoveMarker(selectedMarkerIndex)}>Remove Marker</button>
        <button onClick={addMarker}>Add Marker</button>
        <button onClick={clearMarkers}>Clear Markers</button>
        <button onClick={logMarkerCoordinates}>Log Marker Coordinates</button>

        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Marker Name</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Remove Marker</th>
            </tr>
          </thead>
          <tbody>
            {markers.map((marker, index) => (
              <tr key={index}>
                <td>Marker {index + 1}</td>
                <td>{marker.position[0].toFixed(6)}</td>
                <td>{marker.position[1].toFixed(6)}</td>
                <td>
                  <button onClick={() => handleRemoveMarker(index)}>
                    Remove Marker
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
