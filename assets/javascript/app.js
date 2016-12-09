$(document).ready(function() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAnduVN32mv1-dXtd86tqwljNkhoZbRewM",
        authDomain: "train-schedule-9333c.firebaseapp.com",
        databaseURL: "https://train-schedule-9333c.firebaseio.com",
        storageBucket: "train-schedule-9333c.appspot.com",
        messagingSenderId: "858298159225"
    };
    firebase.initializeApp(config);

    // The rider who needs to see the schedule
    var rider = {
        // time in ms since 01/01/1970
        departureTime: 0,
        // the station the rider is departing from
        origin: "",
        // the riders destination
        destination: ""
    };

    // Add Train
    $("#id-add-train").on("click", function() {
        console.log('$("#id-add-train").on("click", function() {');
        // Init database variables.
        var dbRef = firebase.database();
        var trainRef = dbRef.ref().child("trains");

        // Grabbed values from text boxes
        var trainId = $("#id-train-id-input").val().trim();
        var departureTime = $("#id-start-time-input").val().trim();

        // Get the hours and minutes from form
        var hour = parseInt(departureTime.substr(0, 2));
        var min = parseInt(departureTime.substr(2, 2));
        var sec = parseInt(departureTime.substr(4, 2));

        if (isNaN(hour) || isNaN(min) || isNaN(sec) || hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
            alert("HHMMSS : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive, \nSS between 00 and 59 inclusive");
        } else {
            // date, hour, min, and sec are of type number
            // date is when train starts its route from home station
            var date = new Date();
            try {
                date.setHours(hour, min, sec);
                var json_obj = JSON.parse(json_str_train);
                json_obj.id = trainId;
                json_obj.departure_time = date.getTime();
                json_obj.outbound_stops.forEach(function(element) {
                    element.arrival = parseInt(element.sec_from_origin) + date.getTime();
                });
                json_obj.inbound_stops.forEach(function(element) {
                    element.arrival = parseInt(element.sec_from_origin) + date.getTime();
                });
                trainRef.push(json_obj);
            } catch (error) {
                console.log(error);
            }
        }
        // Don't refresh the page!
        return false;
    });

    // Capture Button Click
    $("#id-add-24-trains").on("click", function() {
        console.log('$("#id-add-24-trains").on("click", function() {');
        // Init database variables.
        var dbRef = firebase.database();
        var trainRef = dbRef.ref().child("trains");

        for (var i = 0; i < 24; i++) {
            var trainId = i.toString();
            var date = new Date();

            try {
                date.setHours(i, 0, 0);
                var json_obj = JSON.parse(json_str_train);
                json_obj.id = trainId;
                json_obj.departure_time = date.getTime();
                json_obj.outbound_stops.forEach(function(element) {
                    element.arrival = parseInt(element.sec_from_origin) + date.getTime();
                });
                json_obj.inbound_stops.forEach(function(element) {
                    element.arrival = parseInt(element.sec_from_origin) + date.getTime();
                });
                trainRef.push(json_obj);
            } catch (error) {
                console.log(error);
            }
        }
        // Don't refresh the page!
        return false;
    });

    // Capture Button Click
    $("#id-find-train").on("click", function() {
        console.log('$("#id-find-train").on("click", function() {');

        rider.origin = $("#id-origin-input").val().trim();
        rider.destination = $("#id-destination-input").val().trim();
        if (rider.origin === rider.destination) {
            alert("Origin and destination stations cannot be the same!");
        } else {
            // Get the hours and minutes from form
            var departureTime = $("#id-departure-time-input").val().trim();
            var hour = parseInt(departureTime.substr(0, 2));
            var min = parseInt(departureTime.substr(2, 2));
            var sec = parseInt(departureTime.substr(4, 2));
            var date = new Date();

            if (isNaN(hour) || isNaN(min) || isNaN(sec) || hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
                alert("HHMMSS : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive, \nSS between 00 and 59 inclusive");
            } else {
                try {
                    date.setHours(hour, min, sec);
                    rider.departureTime = date.getTime();
                } catch (error) {
                    console.log(error);
                }
                updateSchedules();
            }
        }
        console.log('rider: departureTime:' + rider.departureTime + '\n     : origin:' + rider.origin + '\n     :destination:' + rider.destination);
        // Don't refresh the page!
        return false;
    });

    // Capture Button Click
    $("#id-update-schedules").on("click", function() {
        console.log('$("#id-update-schedules").on("click", function() {');
        updateSchedules();
        // Don't refresh the page!
        return false;
    });

    function updateSchedules() {
        console.log('function updateSchedules() {');

        if (rider.departureTime === 0 || rider.origin === "" || rider.destination === "") {
            return false;
        }
        try {
            console.log('function updateSchedules() {');

            $('#table-train').empty(); // clear out the currently displayed schedules
            // Init database variables.
            var trainRef = firebase.database().ref().child("trains");
            //schedules - Sort by departure_time ascending
            trainRef.orderByChild("departure_time").once("value")
                .then(function(snapshot) {
                    snapshot.forEach(function(childSnapshot) {
                        var json_obj = childSnapshot.val();

                        var frequencyMin = 0; // interval between trains in minutes
                        var lastTrainArrival = 0; // time last train arrived at origin station
                        var direction = ""; // inbound or outbound

                        try {
                            // Evaluate input and test for direction, inbound or outbound
                            // All json objects in have a list of the stations in both outbound_stops and inbound_stops
                            var originIndex = json_obj.outbound_stops.findIndex(function(obj) {
                                return obj.station === rider.origin;
                            });
                            var destinationIndex = json_obj.outbound_stops.findIndex(function(obj) {
                                return obj.station === rider.destination;
                            });
                            // Check what happens if bad input            
                            if (originIndex === -1) {
                                var err = "Origin Station " + rider.origin + " does not exist.";
                                alert(err);
                                throw err;
                            } else if (destinationIndex === -1) {
                                var err = "Destination Station " + rider.destination + " does not exist.";
                                alert(err);
                                throw err;
                            }
                            // Set the direction
                            if (originIndex < destinationIndex) {
                                direction = "Outbound";
                            } else {
                                direction = "Inbound";
                            }

                            var id = json_obj.id;
                            var subSchedule = null;

                            if (direction === "Outbound") {
                                console.log('train outbound');
                                subSchedule = json_obj.outbound_stops;
                            } else if (direction === "Inbound") {
                                console.log('train inbound');
                                subSchedule = json_obj.inbound_stops;
                            }

                            subSchedule.forEach(function(stop) {
                                // If this is our departure station
                                if (stop.station === rider.origin) {
                                    if (lastTrainArrival !== 0) {
                                        frequencyMin = Math.round((stop.arrival - lastTrainArrival) / 60000);
                                    }
                                    lastTrainArrival = stop.arrival;
                                }
                                // if the train is still usable - it hasn't already passed
                                if (stop.station === rider.origin && stop.arrival > rider.departureTime) {
                                    var dateFormatString = 'MMMM Do YYYY, h:mm:ss a';
                                    var now = new Date();
                                    var str = direction + ' ' + rider.origin + ' to ' + rider.destination + ' Schedule for departure time ';
                                    $('#id-current-schedule').text(str + moment(rider.departureTime).format(dateFormatString));

                                    $('#id-time-of-schedule').text(moment(now.getTime()).format(dateFormatString));

                                    var minAway = Math.round((stop.arrival - now.getTime()) / 60000);
                                    var arrival = moment(stop.arrival).format(dateFormatString);
                                    var tr = $('<tr class="dyn_tr">');
                                    var td_str = '<td>' + id + '</td>' + '<td>' + rider.origin + '</td>' + '<td>' + rider.destination + '</td>' + '<td>' + frequencyMin + '</td>' + '<td>' + arrival + '</td>' + '<td>' + minAway + '</td>';
                                    tr.append(td_str);

                                    $('#table-train').append(tr);
                                }
                            });
                        } catch (err) {
                            console.log(err);
                        }
                    });
                });

        } catch (error) {
            console.log(error);
        }
    }

    firebase.database().ref().on("child_added", function(childSnapshot) {
        console.log('firebase.database().ref().on("child_added", function(childSnapshot) {');
        // Update with new schedule information
        updateSchedules();
        // Handle the errors
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

    firebase.database().ref().on("child_changed", function(childSnapshot) {
        console.log('firebase.database().ref().on("child_changed", function(childSnapshot) {');
        // Update with new schedule information
        updateSchedules();
        // Handle the errors
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });
});
