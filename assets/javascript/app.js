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

    // Init database variables.
    var dbRef = firebase.database();
    var trainRef = dbRef.ref().child("trains");

    // Array to hold all train schedules
    var schedules = [];
    var sourceStation = "";
    var destStation = "";

    // Capture Button Click
    $("#id-add-train").on("click", function() {
        // Grabbed values from text boxes
        var trainId = $("#id-train-id-input").val().trim();
        var departureTime = $("#id-departure-time-input").val().trim();

        // Get the hours and minutes from form
        var hour = parseInt(departureTime.substr(0, 2));
        var min = parseInt(departureTime.substr(2, 2));
        var sec = parseInt(departureTime.substr(4, 2));

        if (hour < 0 || hour > 23 || min < 0 || min > 59) {
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
                    element.sec_from_origin = parseInt(element.sec_from_origin) + date.getTime();
                });
                json_obj.inbound_stops.forEach(function(element) {
                    element.sec_from_origin = parseInt(element.sec_from_origin) + date.getTime();
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

        // Grabbed values from text boxes
        var origin = $("#id-origin-input").val().trim();
        var destination = $("#id-destination-input").val().trim();
        var departureTime = $("#id-time-input").val().trim();


        // 
        var json_obj;
        try {
            var d1 = new Date().getTime(); // d1 is type number

            json_obj = JSON.parse(json_str_train);
            json_obj.departure_time = dep;
            json_obj.id = trainId;
            json_obj.outbound_stops.forEach(function(element) {
                element.sec_from_origin = parseInt(element.sec_from_origin) + d1;
            });
            json_obj.inbound_stops.forEach(function(element) {
                element.sec_from_origin = parseInt(element.sec_from_origin) + d1;
            });
            trainRef.push(json_obj);
        } catch (error) {
            console.log(error);
        }
        console.log(obj);


        // Don't refresh the page!
        return false;
    });

    function updateSchedules() {
        schedules = [];
        //schedules - Sort by departure_time ascending
        trainRef.orderByChild("departure_time").once("value")
            .then(function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var obj = childSnapshot.val();
                    schedules.push(obj);
                });
            });
        console.log(schedules);
    }

    trainRef.on("child_added", function(childSnapshot) {
        // Update with new schedule information
        updateSchedules();
        console.log("child_added");
        // Handle the errors
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

    trainRef.on("child_changed", function(childSnapshot) {
        // Update with new schedule information
        updateSchedules();
        console.log("child_changed");
        // Handle the errors
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });
});
