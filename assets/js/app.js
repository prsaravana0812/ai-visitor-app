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
    .then(function (markers) {
      $("#heading, #filter").show();
      $("#map").css('opacity', '1');
      $("#loader").hide();
      $("#view, #reload").prop('disabled', false);

      if (markers.length > 0) {
        let map = new google.maps.Map(document.getElementById('map'), {
          zoom: 7,
          center: new google.maps.LatLng(markers[0].lat, markers[0].lng),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        let infowindow = new google.maps.InfoWindow({ maxWidth: 400 });
        let marker, i;

        for (i = 0; i < markers.length; i++) {
          let isSameMarker = checkMarker(markers, markers[i]);
          let finalLatLng = new google.maps.LatLng(markers[i].lat, markers[i].lng);
          let color = markers[i].status == "Yet to visited" ? "red" : markers[i].status == "In Progress" ? "orange" : "green";
          let mapIcon = `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;

          if (isSameMarker) {
            let newLat = finalLatLng.lat() + ((Math.random() * 0.1)) / 1500;
            let newLng = finalLatLng.lng() + ((Math.random() * 0.1)) / 1500;

            finalLatLng = new google.maps.LatLng(newLat, newLng);
          }

          marker = new google.maps.Marker({
            position: finalLatLng,
            map: map,
            title: markers[i].factoryName,
            icon: {
              url: mapIcon
            }
          });

          google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
              infowindow.setContent(getInfo(markers[i]));
              infowindow.open(map, marker);
            }
          })(marker, i));
        }
      } else {
        let map = new google.maps.Map(document.getElementById('map'), {
          zoom: 5,
          center: new google.maps.LatLng(20.5937, 78.9629),
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

function checkMarker(markers, currentMarker) {
  let count = 0;

  markers.map(function (marker) {
    if (marker.lat == currentMarker.lat && marker.lng == marker.lng) {
      count++;
    }
  });

  return count > 1 ? true : false;
}

function filterData(markers, filterRange) {
  if (markers[1].values[0].formattedValue) {
    let filteredLocationData = [];

    markers.map(function (marker) {
      if (marker.values[0].formattedValue && checkDate(filterRange, marker.values[0].formattedValue)) {
        filteredLocationData.push({
          date: marker.values[0].formattedValue,
          time: marker.values[1].formattedValue,
          name: marker.values[2].formattedValue,
          factoryName: marker.values[3].formattedValue,
          lat: marker.values[4].formattedValue,
          lng: marker.values[5].formattedValue,
          whomVisited: marker.values[6].formattedValue,
          status: marker.values[7].formattedValue,
          comments: marker.values[8].formattedValue
        });
      }
    });

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
  let dateString = `${visitDate.getDate()} ${monthNames[visitDate.getMonth()]} ${visitDate.getFullYear()}`;
  let contentString = "";
  let color = rowData.status == "Yet to visited" ? "red" : rowData.status == "In Progress" ? "orange" : "green";

  contentString += `<p style="color: ${color}"><b>Status:</b> ${rowData.status}</p>`;
  contentString += `<p><b>Visit Date:</b> ${dateString}</p>`;
  contentString += `<p><b>Factory Name:</b> ${rowData.factoryName}</p>`;
  contentString += `<p><b>Contact Person:</b> ${rowData.name}</p>`;
  contentString += `<p><b>Who visited:</b> ${rowData.whomVisited}</p>`;
  contentString += `<p><b>Comments:</b> ${rowData.comments}</p>`;

  return `<div id="info">${contentString}</div>`;
}
