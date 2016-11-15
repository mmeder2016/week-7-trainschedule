$(document).ready(function() {

	init();

	function init();


    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAnduVN32mv1-dXtd86tqwljNkhoZbRewM",
        authDomain: "train-schedule-9333c.firebaseapp.com",
        databaseURL: "https://train-schedule-9333c.firebaseio.com",
        storageBucket: "train-schedule-9333c.appspot.com",
        messagingSenderId: "858298159225"
    };
    firebase.initializeApp(config);

    // Init database variable.
    var database = firebase.database();

    // Initial Values f prepended to indicate form. I am trying to avoid name
    // collision in the global namespace
    var fname = "";
    var fdest = "";
    var ftime = "";
    var ffreq = 0;

    // Capture Button Click
    $("#add-train").on("click", function() {

        // Grabbed values from text boxes
        fname = $("#name-input").val().trim();
        fdest = $("#destination-input").val().trim();
        ftime = $("#time-input").val().trim();
        ffreq = $("#frequency-input").val().trim();

        // Code for handling the push
        database.ref().push({
            name: fname,
            destination: fdest,
            time: ftime,
            frequency: ffreq
        });

        // Don't refresh the page!
        return false;
    });

    // // Firebase watcher
    // database.ref().on("value", function(snapshot) {

    //     // Log everything that's coming out of snapshot
    //     console.log(snapshot.val());
    //     console.log(snapshot.val().name);
    //     console.log(snapshot.val().destination);
    //     console.log(snapshot.val().time);
    //     console.log(snapshot.val().frequency);

    //     // Change the HTML to reflect
    //     $("#name-display").html(snapshot.val().name);
    //     $("#email-display").html(snapshot.val().email);
    //     $("#age-display").html(snapshot.val().age);
    //     $("#comment-display").html(snapshot.val().comment);

    //     // Handle the errors
    // }, function(errorObject) {
    //     console.log("Errors handled: " + errorObject.code);
    // });


});
