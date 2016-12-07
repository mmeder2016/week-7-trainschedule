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

        if (isNan(hour) || isNan(min) || isNan(sec) || hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
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

        if (isNan(hour) || isNan(min) || isNan(sec) || hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
            alert("HHMMSS : \nHH between 00 and 23 inclusive, \nMM between 00 and 59 inclusive, \nSS between 00 and 59 inclusive");
        } else {
            try {
                date.setHours(hour, min, sec);
            } catch (error) {
                console.log(error);
            }
            updatePage(departureTime, origin, destination);
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

    function updatePage(departureTime, origin, destination) {
        console.log('function updatePage(departureTime, origin, destination) {');
        // find direction , inbound or outbound
        var direction = "";
        if (origin !== destination &&
            (trainSchedules[0].outbound_stops.findIndex(origin) < trainSchedules[0].outbound_stops.findIndex(destination))) {
            direction = "outbound";
        } else {
            direction = "inbound";
        }

        if (direction === "outbound") {
            trainSchedules.forEach(function(json_obj) {
                json_obj.outbound_stops.forEach(function(stop) {
                    // if the train can get the user to their destination
                    if (stop.station == origin && stop.departure_time > departureTime) {
                        console.log(stop);
                    }
                });
            });
        } else {

        }
    }


    // for (var i = 0; i < schedules.length; i++) {
    //     if (schedules[0].departure_time > departureTime) {

    //         var frequency;
    //         // for loop to find station
    //         var arrival = new Date();
    //         var minAway;

    //         var tr = $('<tr>');
    //         var tdOrigin = $('td').val(origin);
    //         var tdDestination = $('td').val(destination);
    //         var tdFreq = $('td').val(frequency);
    //         var tdArrival = $('td').val(arrival);
    //         var tdMinutesAway = $('td').val(minAway);
    //         tr.append();
    //         tr.append();
    //         tr.append();
    //         tr.append();
    //         tr.append();

    //     }
    // }
    //         <tr>
    //     <td>Chicago</td>
    //     <td>Park Ridge</td>
    //     <td>24</td>
    //     <td>05:20 PM</td>
    //     <td>34</td>
    // </tr>








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
