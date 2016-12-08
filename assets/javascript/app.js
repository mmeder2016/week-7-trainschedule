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

    // Array to hold all train schedules
    var trainSchedules = [];

    // Capture Button Click
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
        // Grabbed values from text boxes
        var departureTime = $("#id-departure-time-input").val().trim();
        var origin = $("#id-origin-input").val().trim();
        var destination = $("#id-destination-input").val().trim();

        // Get the hours and minutes from form
        var hour = parseInt(departureTime.substr(0, 2));
        var min = parseInt(departureTime.substr(2, 2));
        var sec = parseInt(departureTime.substr(4, 2));
        var date = new Date();
        console.log("orig time = " + date.getTime());

        if (isNaN(hour) || isNaN(min) || isNaN(sec) || hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
            alert("HHMMSS : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive, \nSS between 00 and 59 inclusive");
        } else {
            try {
                //date.setHours(hour, min, sec);

            } catch (error) {
                console.log(error);
            }
            updatePage(date.getTime(), origin, destination);
        }
        // Don't refresh the page!
        return false;
    });

    // Capture Button Click
    $("#id-dump-schedules").on("click", function() {
        console.log('$("#id-dump-schedules").on("click", function() {');
        console.log("trainSchedules.length" + trainSchedules.length);
        console.log(trainSchedules);
        console.log('$("#id-dump-schedules").on("click", function() {');
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

    function updatePage(riderDepartureTime, origin, destination) {
        console.log('function updatePage(' + riderDepartureTime + ', ' + origin + ', ' + destination + ') {');

        $('#table-train').empty();

        var frequencyMin = 0; // interval between trains
        var lastTrainArrival = 0; // time last train arrived at origin station
        var direction = ""; // inbound or outbound

        try {
            // Evaluate input and test for direction, inbound or outbound
            var originIndex = trainSchedules[0].outbound_stops.findIndex(function(obj) {
                return obj.station === origin;
            });
            var destinationIndex = trainSchedules[0].outbound_stops.findIndex(function(obj) {
                return obj.station === destination;
            });

            // Check what happens if bad input            
            if (originIndex === -1) {
                alert("Origin Station " + origin + " does not exist.");
            } else if (destinationIndex === -1) {
                alert("Destination Station " + destination + " does not exist.");
            } else if (origin === destination) {
                alert("Origin and Destination Station are identical.");
            } else {

            }

            if (originIndex < destinationIndex) {
                direction = "outbound";
            } else {
                direction = "inbound";
            }

            if (direction === "outbound") {
                console.log('train outbound');
                trainSchedules.forEach(function(json_obj) {
                    json_obj.outbound_stops.forEach(function(stop) {
                        // If this is our departure station
                        if (stop.station === origin) {
                            if (lastTrainArrival !== 0) {
                                frequencyMin = Math.round((stop.arrival - lastTrainArrival) / 60000);
                            }
                            lastTrainArrival = stop.arrival;
                        }

                        // if the train can get the user to their destination - it hasn't already passed
                        if (stop.station === origin && stop.arrival > riderDepartureTime) {
                            var now = new Date();
                            var minAway = Math.round((stop.arrival - now.getTime()) / 60000);
                            var arrival = moment(stop.arrival).format('MMMM Do YYYY, h:mm:ss a');
                            var tr = $('<tr class="dyn_tr">');
                            var td_str = '<td>' + origin + '</td>' + '<td>' + destination + '</td>' + '<td>' + frequencyMin + '</td>' + '<td>' + arrival + '</td>' + '<td>' + minAway + '</td>';
                            tr.append(td_str);

                            $('#table-train').append(tr);
                        }
                    });
                });
            } else if (direction === "inbound") {

            } else {
                //problem
            }

        } catch (err) {
            console.log(err);
        }
    }

    function updateSchedules() {

        try {
            console.log('function updateSchedules() {');
            trainSchedules = [];
            // Init database variables.
            var trainRef = firebase.database().ref().child("trains");
            //schedules - Sort by departure_time ascending
            trainRef.orderByChild("departure_time").once("value")
                .then(function(snapshot) {
                    snapshot.forEach(function(childSnapshot) {
                        var obj = childSnapshot.val();
                        trainSchedules.push(obj);
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
