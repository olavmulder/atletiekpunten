
const category = Object.freeze({
    U14_U16: 0,
});
var i = 0;
const events = {
    M60: i++,
    M80:  i++,
    M100: i++,
    M150: i++,
    M300: i++,

    M600: i++,
    M1000: i++,
    M1500: i++,

    MH60: i++,
    MH80: i++,
    MH100: i++,
    MH300: i++,

    M4X60: i++,
    M4X80: i++,
    M4X100M: i++,
    
    HOOG: i++,
    POLSTOK: i++,
    VER: i++,
    KOGEL: i++,
    DISCUS: i++,
    SPEER: i++,
};

const constValues = [
   //U14_16
    [
        [15365.0, 1158.00], //M60
        [19933.0, 1193.00], //M80
        [36380.0, 1200.00], //M150
        [78286.0, 1204.00], // M300

        [160470.5, 911.35], //M600
        [276912.0, 838.50], //M1000
        [425682.0, 788.50], //M1500

        [14050.0, 795.50], //MH60
        [18100.0, 804.50], //MH80
        [21800.0, 727.00], //MH100
        [70800.0, 872.50], //mh300
        
        [18100.0, 1130.00], //M4X60M
        [77325.0, 1168.00], //M4X80M
        [95150.0, 1189.50], //m4x100M
        
        [0, 0],//HOOG, use special conditions
        [795.66, 686.5], //POLS
        [0, 0], //ver, use special conditions
        [303.73, 437.5], //Kogel
        [166.79, 438.5],  //DISUCS
        [170.39, 437.5], //SPEER
    ], 
]

function getPointsJumpEventU14U16(event,distance)
{
    const category = U14_U16;
    if(event == HOOG){
        if(distance > 1.35){
            a = 1977.53;
            b = 1798.5;
            return Math.floor(a * Math.sqrt(distance) - b);
        }
        //=< 1.35
        else{
            return Math.floor((distance - 0.67) * 733.33333 + 0.7);
        }
    }
    else if(event == VER){
        if(distance > 4.41){
            a = 887.99;
            b = 686.5;
            return Math.floor(a * Math.sqrt(distance) - b);
        }
        else if(distance <= 4.41){
            return Math.floor((distance - 1.91) * 200 + 0.5);
        }
    }
    else{
        a = constValues[category, event][0];
        b = constValues[category, event][1];
        return Math.floor(a * Math.sqrt(distance) -b);
    }
}

function getPointsJumpEvents(category, event, distance)
{
    a = 0;
    b = 0;
    if(category == U14_U16){
        getPointsJumpEventU14U16(event, distance);
    }
    else{
        //TODO implemented
        return 0;
    }
}

function getPointsRunningEvent(category, event, time) 
{
    a = constValues[category][event][0];
    b = constValues[category][event][1];

    switch(category){
        case U14_U16:
            return Math.floor((a / time) - b);
    }
    return 0;
}

