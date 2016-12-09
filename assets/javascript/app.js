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
        destination: "",

        reset: function() {
            this.departureTime = 0;
            this.origin = "";
            this.destination = "";
        }
    };

    // Update the train schedules every minute if there are active trains the
    // rider can use
    var minuteTimeOut = null;

    // Run a clock in the jumbotron heading
    setInterval(function() {
        var dateFormatString = 'MMMM Do YYYY, h:mm:ss a';
        var now = new Date();
        $('#id-time-of-schedule').text(moment(now.getTime()).format(dateFormatString));
    }, 1000);

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

        if (Number.isNaN(hour) || Number.isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
            alert("HHMMSS : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive");
        } else {
            // date, hour, min, and sec are of type number
            // date is when train starts its route from home station
            var date = new Date();
            try {
                date.setHours(hour, min);
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

    // Button handler to set the rider variables
    $("#id-find-train").on("click", function() {
        console.log('$("#id-find-train").on("click", function() {');

        try {
            // Early basic validation of user input
            rider.origin = $("#id-origin-input").val().trim();
            rider.destination = $("#id-destination-input").val().trim();
            var departureTime = $("#id-departure-time-input").val().trim();
            if (rider.origin === "") {
                throw "Origin must be a station";
            } else if (rider.destination === "") {
                throw "Origin must be a station";
            } else if (rider.origin === rider.destination) {
                throw "Origin and destination stations cannot be the same!";
            } else {
                // Get the hours and minutes from form
                var hour = parseInt(departureTime.substr(0, 2));
                var min = parseInt(departureTime.substr(2, 2));
                var date = new Date();

                if (Number.isNaN(hour) || Number.isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
                    throw "HHMM : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive";
                } else {
                    date.setHours(hour, min);
                    rider.departureTime = date.getTime();
                    updateSchedules();
                }
            }
        } catch (err) {
            alert(err);
        }
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
        // Default to not calling this function unless there are trains in the
        // schedule table. If there is a train added to the schedule table, we
        // set the tiemout to call update Schedules every 60 seconds until 
        // there are no trains remaining 
        if (minuteTimeOut) {
            clearTimeout(minuteTimeOut);
            minuteTimeOut = null;
            console.log('clear minuteTimeOut');
        }
        try {
            if (rider.departureTime === 0 || rider.origin === "" || rider.destination === "") {
                return false;
            }
            $('#table-train').empty(); // clear out the currently displayed schedules
            // Init database variables.
            var trainRef = firebase.database().ref().child("trains");

            // Accounting variable for keeping track of the trains frequency - must
            // hold time value of the previous train
            var lastTrainArrival = 0; // time last train arrived at origin station

            //schedules - Sort by departure_time ascending
            trainRef.orderByChild("departure_time").once("value")
                .then(function(snapshot) {
                    snapshot.forEach(function(childSnapshot) {
                        var json_obj = childSnapshot.val();

                        var frequencyMin = 0; // floored minute interval between trains in minutes
                        var direction = ""; // inbound or outbound
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
                            throw "Origin Station " + rider.origin + " does not exist.";
                        } else if (destinationIndex === -1) {
                            throw "Destination Station " + rider.destination + " does not exist.";
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
                            subSchedule = json_obj.outbound_stops;
                        } else if (direction === "Inbound") {
                            subSchedule = json_obj.inbound_stops;
                        }

                        subSchedule.forEach(function(stop) {
                            // If this is our departure station
                            if (stop.station === rider.origin) {
                                if (lastTrainArrival !== 0) {
                                    frequencyMin = Math.floor((stop.arrival - lastTrainArrival) / 60000);
                                }
                                lastTrainArrival = stop.arrival;
                            }
                            // if the train is still usable - it hasn't already passed
                            var now = new Date();
                            if (stop.station === rider.origin && stop.arrival > now.getTime()) {
                                var dateFormatString = 'MMMM Do YYYY, h:mm:ss a';
                                var str = direction + ' ' + rider.origin + ' to ' + rider.destination + ' Schedule for departure time ';
                                $('#id-current-schedule').text(str + moment(rider.departureTime).format(dateFormatString));

                                //$('#id-time-of-schedule').text(moment(now.getTime()).format(dateFormatString));

                                var minAway = Math.round((stop.arrival - now.getTime()) / 60000);
                                var arrival = moment(stop.arrival).format(dateFormatString);
                                var tr = $('<tr class="dyn_tr">');
                                var td_str = '<td>' + id + '</td>' + '<td>' + rider.origin + '</td>' + '<td>' + rider.destination + '</td>' + '<td>' + frequencyMin + '</td>' + '<td>' + arrival + '</td>' + '<td>' + minAway + '</td>';
                                tr.append(td_str);

                                $('#table-train').append(tr);
                                // If a train has been added to the schedule table, update table every minute
                                // But only set it once in this function
                                if (minuteTimeOut === null) {
                                    console.log("Set minuteTimeOut");
                                    minuteTimeOut = setTimeout(updateSchedules, 60000);
                                }
                            }
                        });

                    });
                });
        } catch (err) {
            alert(err);
            console.log(err);
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

    firebase.database().ref().on("child_removed", function(childSnapshot) {
        console.log('firebase.database().ref().on("child_removed", function(childSnapshot) {');
        // Update with new schedule information
        updateSchedules();
        // Handle the errors
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

    // Train schedule generation
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
    $("#id-add-6-trains").on("click", function() {
        console.log('$("#id-add-24-trains").on("click", function() {');
        // Init database variables.
        var dbRef = firebase.database();
        var trainRef = dbRef.ref().child("trains");
        var minutes = [2, 4, 6, 8, 10, 12];

        for (var i = 0; i < 6; i++) {
            var trainId = "55" + i.toString();
            var date = new Date();

            try {
                date.setMinutes(date.getMinutes() + minutes[i], 0);
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

});
