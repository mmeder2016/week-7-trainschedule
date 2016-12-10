$(document).ready(function() {

    // VARIABLES
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

    // A hack until I learn Promises, firebase, and how to write atomic functions
    // in javascript
    var childRemoveUpdateOn = true;

    // Run a clock in the jumbotron heading
    setInterval(function() {
        var dateFormatString = 'MMMM Do YYYY, h:mm:ss a';
        var now = new Date();
        $('#id-time-of-schedule').text(moment(now.getTime()).format(dateFormatString));
    }, 1000);

    // Double click to edit cells
    $(document).on("dblclick", ".cell-edit", function() {
        console.log('$(document).on("click", "td", function() {');
        var origText = $(this).text();
        $(this).html('<input type="text" value="' + origText + '"/>');
        $(this).children().first().focus();
        $(this).children().first().keypress(function(e) {
            if (e.which == 13) {
                var newText = $(this).val();
                var id = this.parentNode.getAttribute("id");
                var key = this.parentNode.parentNode.getAttribute("key");
                var dbRef = firebase.database().ref().child("trains").child(key);
                if (id === "type-id") {
                    // can update if only id changes
                    dbRef.update({
                        id: newText
                    });
                } else if (id === "type-start-time") {
                    var departureTime = HHMMtoms(newText);
                    var trainId = this.parentNode.parentNode.childNodes[0].innerHTML;
                    // must delete train and add new train to recalculate the
                    // arrival at all the stations
                    if (trainId && departureTime) {
                        // turn off the updateSchedule in the callback. The 
                        // add Train will take care of it
                        childRemoveUpdateOn = false;
                        firebase.database().ref().child("trains").child(key).remove(function() {
                            console.log("Deleted firebase record with key: " + key);
                        });
                        addTrain(trainId, departureTime);
                    } else {
                        alert("Did not update database.");
                    }
                }
            }
        });
        return false;
    });

    function HHMMtoms(str) {
        try {
            var hour = parseInt(str.substr(0, 2));
            var min = parseInt(str.substr(2, 2));
            if (Number.isNaN(hour) || Number.isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
                throw "HHMM : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive";
            }
            var date = new Date();
            date.setHours(hour, min);
            return date.getTime();
        } catch (error) {
            alert(error);
        }
    }

    // Add Train
    $("#id-add-train").on("click", function() {
        console.log('$("#id-add-train").on("click", function() {');
        // Grabbed values from text boxes
        var trainId = $("#id-train-id-input").val().trim();
        var departureTime = $("#id-start-time-input").val().trim();
        var dt = HHMMtoms(departureTime);
        addTrain(trainId, dt);
        // Don't refresh the page!
        return false;
    });

    function addTrain(trainId, departureTime) {
        var trainRef = firebase.database().ref().child("trains");
        try {
            var json_obj = JSON.parse(json_str_train);
            json_obj.id = trainId;
            json_obj.departure_time = departureTime;
            json_obj.outbound_stops.forEach(function(element) {
                element.arrival = parseInt(element.sec_from_origin * 1000) + json_obj.departure_time;
            });
            json_obj.inbound_stops.forEach(function(element) {
                element.arrival = parseInt(element.sec_from_origin * 1000) + json_obj.departure_time;
            });
            trainRef.push(json_obj);
        } catch (error) {
            console.log(error);
        }
    }

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
                        var startTime = moment(json_obj.departure_time).format("HHmm");

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
                                var key = childSnapshot.getKey();
                                var tr = $('<tr class="dyn-train" key="' + key + '">');

                                var idHTML = '<td class="cell-edit" id="type-id">' + id + '</td>';
                                var startTimeHTML = '<td class="cell-edit" id="type-start-time">' + startTime + '</td>';
                                var originHTML = '<td>' + rider.origin + '</td>';
                                var destHTML = '<td>' + rider.destination + '</td>';
                                var freqHTML = '<td>' + frequencyMin + '</td>';
                                var arrivalHTML = '<td>' + arrival + '</td>';
                                var minAwayHTML = '<td>' + minAway + '</td>';
                                var btnHTML = '<td><button class="btn btn-default" id="id-btn-delete-train" key="' +
                                    key + '" type="submit">Delete Train</button></td>';

                                var td_str = idHTML + startTimeHTML + originHTML + destHTML + freqHTML + arrivalHTML + minAwayHTML + btnHTML;

                                tr.append(td_str);

                                $('#table-train').append(tr);
                                // If a train has been added to the schedule table, update table every minute
                                // But only set it once in this function
                                if (minuteTimeOut === null) {
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

    // Capture Button Click
    $(document).on("click", "#id-btn-delete-train", function() {
        console.log('$(document).on("click", "#id-btn-delete-train", function() {');
        var key = $(this).attr("key");

        firebase.database().ref().child("trains").child(key).remove(function() {
            console.log("Deleted firebase record with key: " + key);
        });
        return false;
    });

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
        if (childRemoveUpdateOn) {
            updateSchedules();
        } else {
            childRemoveUpdateOn = true;
        }
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

    // Capture Button Click
    $("#id-add-6-trains").on("click", function() {
        console.log('$("#id-add-6-trains").on("click", function() {');
        var minutes = [2, 4, 6, 8, 10, 12];
        var date = new Date();

        for (var i = 0; i < 6; i++) {
            var trainId = "55" + i.toString();
            date.setMinutes(date.getMinutes() + minutes[i], 0);
            departureTime = date.getTime();
            addTrain(trainId, departureTime);
        }
        // Don't refresh the page!
        return false;
    });
});
