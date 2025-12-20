function parseAllInputs(values) {
  const parsed = {};

  for (const id in values) {
    const val = values[id];

    // Decide format by input ID or custom rules
    if (id === "300m" || id === "600m" || id === "1000m" || id === "1500m") {
      // format mm:ss.hh → seconds float
      parsed[id] = timeToSeconds(val);
    } 
    else if (id.match(/m$/i) || id.match(/mH$/i) || id.match(/x/)) {
      // short sprint / hurdles → ss.hh → seconds float
      parsed[id] = parseFloat(val);
    } 
    else if (id.match(/hoog|polstok|ver|kogel|discus|speer/i)) {
      // field events → convert to float meters (m.cm → m)
      parsed[id] = val.includes(".") ? parseFloat(val) : parseFloat(val.replace(",", "."));
    } 
    else {
      parsed[id] = parseFloat(val);
    }
  }

  return parsed;
}



function timeToSeconds(value) {
    // Normalize colon → dot
    const normalized = value.replace(":", ".");
    let minutes = 0;
    let seconds = 0;
    let hundredths = 0;
    const parts = normalized.split(".");

    if(parts.length == 3){
        minutes = parseInt(parts[0], 10);
        seconds = parseInt(parts[1], 10);
        hundredths = parseInt(parts[2], 10);
    }
    else if(parts.length == 2){
        seconds = parseInt(parts[0], 10);
        hundredths = parseInt(parts[1], 10);
        
    }
    else if(parts.length == 1){
        hundredths = parseInt(parts[0], 10);
    }

    console.log(`minutes: ${minutes}, sec: ${seconds}, hundreds ${hundredths}`);
    // Hard limits
    if (
        isNaN(minutes) ||
        isNaN(seconds) ||
        isNaN(hundredths) ||
        seconds >= 60 ||
        hundredths >= 100
    ) {
        return NaN;
    }

    return minutes * 60 + seconds + hundredths / 100;
}

function isTrackEvent(eventId)
{
    switch(eventId){
        case events.M40:
        case events.M60:
        case events.M80:
        case events.M100:
        case events.M150:
        case events.M60: 
        case events.M80:  
        case events.M100:
        case events.M150:
        case events.M300: 

        case events.M600: 
        case events.M800:
        case events.M1000:
        case events.M1500: 

        case events.MH60: 
        case events.MH80: 
        case events.MH100: 
        case events.MH300: 

        case events.M4X40:
        case events.M4X60: 
        case events.M4X80: 
        case events.M4X100M:
            return 1;
        default:
            return 0;
    }
}

function getEventByFormId(formId)
{
    var event = 0;
    switch(formId){
        case "40m": event = events.M40;break;
        case "60m": event = events.M60;break;
        case "80m": event = events.M80;break;
        case "100m": event = events.M100;break;
        case "150m": event = events.M150;break;
        case "300m": event = events.M300;break;
        case "600m": event = events.M600;break;
        case "800m": event = events.M800;break;
        case "1000m": event = events.M1000;break;
        case "1500m": event = events.M1500;break;
        case "60mh": event = events.MH60;break;
        case "80mh": event = events.MH80;break;
        case "100mh": event = events.MH100;break;
        case "300mh": event = events.MH300;break;
        case "4x40m": event = events.M4X40;break;
        case "4x60m": event = events.M4X60;break;
        case "4x80m": event = events.M4X80;break;
        case "4x100m": event = events.M4X100M;break;
        case "hoog": event = events.HOOG;break;
        case "pols": event = events.POLSTOK;break;
        case "ver": event = events.VER;break;
        case "kogel": event = events.KOGEL;break;
        case "discus": event = events.DISCUS;break;
        case "speer": event = events.SPEER;break;
        default:
            console.log(`Error unknown event: ${formId}`);
    }
    return event;
}



function calcSqrtPoints(a, b, distance) {
  return Math.floor(a * Math.sqrt(distance) - b);
}

function calcLinearPoints(distance, base, factor, offset) {
  return Math.floor((distance - base) * factor + offset);
}
function getPointsFieldGeneric(cat, event, distance) {
  const [a, b] = constValues[cat][event];
  return calcSqrtPoints(a,b, distance);
}


function getPointsFieldEvent(cat, event, distance)
{
  const rules = FIELD_RULES[cat]?.[event];

  // fallback to generic
  if (!rules) {
    return getPointsFieldGeneric(cat, event, distance);
  }

  if (distance > rules.split) {
    const { a, b } = rules.high;
    console.log(a,b);
    return calcSqrtPoints(a, b, distance);
  }

  const { base, factor, offset } = rules.low;
  return calcLinearPoints(distance, base, factor, offset);
}

function getPointsRunningEvent(cat, event, time) 
{
    a = constValues[cat][event][0];
    b = constValues[cat][event][1];

    switch(cat){
        case category.U14_U16:
        case category.PUPILLEN:
            return Math.floor((a / time) - b);
    }
    return 0;
}


//Example scoring function
function calculatePointsForEvent(idStr, performance, cat) {  
    let eventId = getEventByFormId(idStr);

    if(isTrackEvent(eventId)){
        return getPointsRunningEvent(cat, eventId, performance);
    }
    else{
        return getPointsFieldEvent(cat, eventId, performance);
    }
}

