const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });
const axios = require("axios");
const comb = require("js-combinatorics");

async function TSPAlgo (activities, placeid, order, travelMode){ //order by activity_id instead of name
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

    // run brute-TSP algo (<=9 loc + 1 start), test threshold max load time <5 seconds>
    if(activities.length <= 10)
    {
        let calculateDistance = (route, distMatrix) => {
            let totalDist = 0;
            let routeLen = route.length
            for(let i = 0; i<routeLen-1; i++) {
                totalDist += distMatrix[route[i]][route[i+1]];
            }
            totalDist += distMatrix[route[routeLen-1]][route[0]];
            return totalDist;
        }

        let bruteTSP = (distMatrix) => {
            const n = distMatrix.length;
            let activityNodes = '';
            for(let i=0;i<distMatrix.length;i++) // raw city index input for permutation lib
            {
                activityNodes += i.toString(); // '012..'
            }
            let shortestRoute = [];
            let minDist = Infinity;
            const perms = new comb.Permutation(activityNodes);
            for (const perm of perms)
            {
                const currentRoute = perm.map(Number); // convert array to number
                if(currentRoute[0] == 0)
                {
                    const currentDistance = calculateDistance(currentRoute, distMatrix);
                    if(currentDistance < minDist)
                    {
                        minDist = currentDistance;
                        shortestRoute = currentRoute;
                    }
                }
            }
            console.log("Brute TSP");
            return {shortestRoute, minDist};
        }

        //capture result and reorder
        const {shortestRoute, minDist} = bruteTSP(tspDistMatrix);
        const newOrderActivities = [];
        for(let i=0;i < activities.length;i++)
        {
            newOrderActivities[i] = activities[shortestRoute[i]];
        }
        console.log("Mode of travel: ", travelMode);
        console.log("Shortest Route: ", newOrderActivities);
        console.log("Min Dist: ", minDist);
    }
    else
    {
        let twoOpt = (route, distMatrix) => {
            const routeLen = route.length;
            let improved = true;
            let minDist = 0;

            while(improved){
                improved = false;
                for(let i=1; i<routeLen; i++)
                {
                    for(let k=i+1; k<routeLen-1; k++)
                    {
                        const a = route[i-1];
                        const b = route[i];
                        const c = route[k];
                        const d = route[k+1];

                        const oldDist = distMatrix[a][b] + distMatrix[c][d];
                        const newDist = distMatrix[a][c] + distMatrix[b][d];

                        if(newDist < oldDist)
                        {
                            route.splice(i, k-i+1, ...route.slice(i, k+1).reverse());
                            improved = true;
                        }
                    }
                }
            }
            for(let i=0;i<routeLen-1;i++)
            {
                minDist += distMatrix[route[i]][route[i+1]]; 
            }
            minDist += distMatrix[route[routeLen-1]][route[0]]
            console.log("2-opt")
            return {route, minDist}
        }
        let defaultRoute = [];
        for(let i=0;i<activities.length;i++)
        {
            defaultRoute[i] = i;
        }
        const {route, minDist} = twoOpt(defaultRoute, tspDistMatrix);
        console.log(route);
        const newOrderActivities = [];
        for(let i=0;i < activities.length;i++)
        {
            newOrderActivities[i] = activities[route[i]];
        }
        console.log("Mode of travel: ", travelMode);
        console.log("Shortest Route: ", newOrderActivities);
        console.log("Min Dist: ", minDist);
    }
}

module.exports = TSPAlgo;