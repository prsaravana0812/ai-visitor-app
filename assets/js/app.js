const spreadsheetId = "1WmrNUygSxeZfrAKSkef3azePBU7atepQFiNQ1zmUy0M";
const APIKey = "AIzaSyCiYOzg7zMVusg6AD_Fbc50uW1XpAJSEbs";
const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/?key=${APIKey}&includeGridData=true`;

$(document).ready(function () {
  $("#heading, #filter, #alert").hide();

  window.filterRange = $("#range").val();

  $("#view").click(function () {
    $("#map").css('opacity', '0.5');
    $("#loader").show();
    $("#view, #reload").prop('disabled', true);

    let filterRange = $("#range").val();

    initMap(filterRange);
  });

  $("#reload").click(function () {
    window.location.reload();
  });
});

function initMap(filterRange) {
  init(filterRange)
    .then(function (locations) {
      $("#heading, #filter").show();
      $("#map").css('opacity', '1');
      $("#loader").hide();
      $("#view, #reload").prop('disabled', false);

      if (locations.length > 0) {
        let map = new google.maps.Map(document.getElementById('map'), {
          zoom: 5,
          center: new google.maps.LatLng(locations[0].lat, locations[0].lng),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        let infowindow = new google.maps.InfoWindow();
        let marker, i;

        for (i = 0; i < locations.length; i++) {
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
            map: map,
            title: locations[i].name
          });

          google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
              infowindow.setContent(getInfo(locations[i]));
              infowindow.open(map, marker);
            }
          })(marker, i));
        }
      } else {
        let map = new google.maps.Map(document.getElementById('map'), {
          zoom: 5,
          center: new google.maps.LatLng(34.052235, -118.243683),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        $('#alert').show();

        setTimeout(function () {
          $('#alert').hide();
        }, 5000);
      }
    })
    .catch(function (err) {
      $("#heading, #filter").show();
      $("#map").css('opacity', '1');
      $("#loader").hide();
      $("#view, #reload").prop('disabled', false);
      console.error(err);
    });
}

function init(filterRange) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: url,
      dataType: "jsonp",
      success: function (data) {
        let locationData = data.sheets[0].data[0].rowData;

        resolve(filterData(locationData, filterRange));
      },
      failure: function (err) {
        reject(err);
      }
    });
  });
}

function filterData(locations, filterRange) {
  if (locations[1].values[0].formattedValue) {
    let filteredLocationData = [];

    for (i = 1; i < locations.length; i++) {
      if (locations[i].values[0].formattedValue && checkDate(filterRange, locations[i].values[0].formattedValue)) {
        filteredLocationData.push({
          date: locations[i].values[0].formattedValue,
          time: locations[i].values[1].formattedValue,
          name: locations[i].values[2].formattedValue,
          factoryName: locations[i].values[3].formattedValue,
          lat: locations[i].values[4].formattedValue,
          lng: locations[i].values[5].formattedValue,
          whomVisited: locations[i].values[6].formattedValue,
          status: locations[i].values[7].formattedValue,
          comments: locations[i].values[8].formattedValue
        });
      }
    }

    return filteredLocationData;
  } else {
    return [];
  }
}

function checkDate(filterRange, vDate) {
  let today = startDate = endDate = new Date();
  today.setHours(0, 0, 0, 0);
  let visitDate = new Date(vDate);
  visitDate.setHours(0, 0, 0, 0);

  if (filterRange == "this_week") {
    startDate = new Date(today.setDate(today.getDate() - (today.getDay() - 1)));
    endDate = new Date(today.setDate(today.getDate() - (today.getDay() - 1) + 6));
  } else if (filterRange == "last_week") {
    startDate = new Date(today.setDate(today.getDate() - (today.getDay() + 6)));
    endDate = new Date(today.setDate(today.getDate() - (today.getDay()) + 7));
  } else if (filterRange == "next_week") {
    startDate = new Date(today.setDate(today.getDate() - (today.getDay() - 8)));
    endDate = new Date(today.setDate(today.getDate() - (today.getDay() - 1) + 6));
  } else if (filterRange == "last_month") {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (filterRange == "next_month") {
    startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  } else {
    startDate = today;
    endDate = today;
  }

  if (startDate <= visitDate && endDate >= visitDate) {
    return true;
  } else {
    return false;
  }
}

function getInfo(rowData) {
  let visitDate = new Date(rowData.date);
  let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let dateString = `${visitDate.getDate()}, ${monthNames[visitDate.getMonth()]}`;

  return `${dateString} - ${rowData.factoryName} visit by ${rowData.whomVisited}`;
}
