const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });
const axios = require("axios");
const comb = require("js-combinatorics");

async function TSPAlgo (activities, placeid, order, travelMode){
    let origins = [];
    let destinations = [];
    console.log(activities);
    console.log(placeid);
    console.log(order);
    console.log(travelMode);
    try{
        // Get Array of location

        if(travelMode == "DRIVE")
        {
            for(let i=0;i<activities.length;i++)
            {
                origins.push({
                    waypoint: {"placeId" : placeid[i]},
                    routeModifiers: {avoid_ferries: true}
                }); 

                destinations.push({
                    waypoint: {"placeId" : placeid[i]}
                });
            }

            // DRIVE CURL
            const postData = {
            "origins": origins,
            "destinations": destinations,
            "travelMode": travelMode,
            "routingPreference": "TRAFFIC_AWARE"
            };

            response = await axios.post(
                'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
                postData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.gMapsApiKey,
                        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters'
                    }
                }
            );
        }

        else if(travelMode == "TRANSIT")
        {
            for(let i=0;i<activities.length;i++)
            {
                origins.push({
                    waypoint: {"placeId" : placeid[i]}
                }); 

                destinations.push({
                    waypoint: {"placeId" : placeid[i]}
                });
            }

            // TRANSIT CURL
            const postData = {
            "origins": origins,
            "destinations": destinations,
            "travelMode": "TRANSIT"
            };

            response = await axios.post(
                'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
                postData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.gMapsApiKey,
                        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters'
                    }
                }
            );
        }
    }
    catch(error)
    {
        console.error(error.response?.data||error.message);
    }

    // reorder into proper matrix
    const numOfActivities = activities.length;
    const tspDistMatrix = Array.from(Array(numOfActivities), () => new Array(numOfActivities));
    rawMatrix = response.data;
    
    rawMatrix.forEach(item => {
        let length = 0;
        !item.distanceMeters ? length = 0:length = item.distanceMeters;
        tspDistMatrix[item.originIndex][item.destinationIndex] = length;
    });

    console.log({distMatrix: tspDistMatrix});
}

module.exports = TSPAlgo;