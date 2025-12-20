// Run after page loads

const formPupillen = document.getElementById("PupillenTotalPointsForm");
const formU14U16 = document.getElementById("U14_U16TotalPointsForm");
const totalSpan = document.getElementById("TotalPointsField");

//trigger calculation on page load
window.addEventListener("DOMContentLoaded", () => {
  
    if(formPupillen)
        update(formPupillen, category.PUPILLEN);
    if(formU14U16)
        update(formU14U16, category.U14_U16);
});
//add all event listeners
if(formPupillen){
    formPupillen.addEventListener("input", (event) => {
    const input = event.target;
    if (!input.matches("input")) return;
    update(formPupillen, category.PUPILLEN);
    });
}
if(formU14U16){
    formU14U16.addEventListener("input", (event) => {
    const input = event.target;
    if (!input.matches("input")) return;
    update(formU14U16, category.U14_U16);
    });
}

//update the form for a specific category
function update(form, cat) {
    let total = 0;
    form.querySelectorAll("input").forEach(input => {
        const id = input.id;
        const value = input.value.trim();

        const parsedValue = updateSingleInput(form, input, cat);

        //if invalid, do not update the points field
        if (!validateInput(id, value)) return;
        total += parsedValue;

        // update per-field points span if exists
        const pointsSpan = form.querySelector(`#points-${id}`);
        if (pointsSpan) {
            pointsSpan.textContent = parsedValue;
        }
    });
    if(totalSpan){
        totalSpan.textContent = total;
    }
}


/**a; trim value, update the badge(valid/invalid), check valid input
 * b;make float in seconds / meters
 * c;calculate points
 * @param {*} form 
 * @param {*} input
 * @param {*} cat category
 * @returns points (0= error)
 */
function updateSingleInput(form, input, cat) {
  const value = input.value.trim();
  const id = input.id;

  const pointsSpan = form.querySelector(`#points-${id}`);
  if (!pointsSpan) return 0;

  if (value === "") {
    pointsSpan.textContent = "–";
    pointsSpan.className = "badge bg-secondary";
    return 0;
  }

  if (!validateInput(id, value)) {
    pointsSpan.textContent = "Invalid";
    pointsSpan.className = "badge bg-danger";
    return 0;
  }
  //get float value in seconds or in meters
  const parsedValue = parseSingleInput(id, value);
  //get the amount of points
  const points = calculatePointsForEvent(id, parsedValue, cat);

  pointsSpan.textContent = points;
  pointsSpan.className = "badge bg-success";

  return points;
}


// Strict input validator
function validateInput(id, value) {
    // track time in mm:ss.hh
    if (id.match(/^(4x)?\d{1,9}m[hH]?$/)) {
        return (
            // ss.hh → seconds only
            /^\d{1,2}\.\d{1,2}$/.test(value) ||

            // m:ss or m:ss.hh
            /^\d{1,2}:\d{1,2}(\.\d{1,2})?$/.test(value) ||

            // m.ss.hh
            /^\d{1,2}\.\d{1,2}\.\d{1,2}$/.test(value)
        );
    }
    // Field events. meters with optional decimal
    if (id.match(/hoog|polstok|ver|kogel|discus|speer/i)) {
        return /^\d{1,3}([.,]\d{1,2})?$/.test(value);
    }

    // Default fallback → number
    return !isNaN(parseFloat(value));
}

function parseSingleInput(id, value) 
{
    // track time in mm:ss.hh
    if (id.match(/^(4x)?\d{1,9}m[hH]?$/)) {
        return timeToSeconds(value);
    }
    // Field events (m.cm or mm.cm)
    else if (id.match(/hoog|polstok|ver|kogel|discus|speer/i)) {
        return parseFloat(value.replace(",", "."));
    }
    // Default fallback
    else {
        return parseFloat(value);
  }
}