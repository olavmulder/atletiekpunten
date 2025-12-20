
const category = Object.freeze({
    U14_U16: 0,
    PUPILLEN: 1,
});
var i = 0;
const events = {
    M40: i++,
    M60: i++,
    M80:  i++,
    M100: i++,
    M150: i++,
    M300: i++,

    M600: i++,
    M800: i++,
    M1000: i++,
    M1500: i++,

    MH60: i++,
    MH80: i++,
    MH100: i++,
    MH300: i++,

    M4X40: i++,
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
        [0,0],//M40
        [15365.0, 1158.00], //M60
        [19933.0, 1193.00], //M80
        [24450.0, 1212.00],//M100
        [36380.0, 1200.00], //M150
        [78286.0, 1204.00], // M300

        [160470.5, 911.35], //M600
        [216604.8, 884.50], //M800
        [276912.0, 838.50], //M1000
        [425682.0, 788.50], //M1500

        [14050.0, 795.50], //MH60
        [18100.0, 804.50], //MH80
        [21800.0, 727.00], //MH100
        [70800.0, 872.50], //mh300
        
        [0,0],              //M4X40M
        [59225.0, 1130.00], //M4X60M
        [77325.0, 1168.00], //M4X80M
        [95150.0, 1189.50], //m4x100M
        
        [0, 0],//HOOG, use special conditions
        [795.66, 686.5], //POLS
        [0, 0], //ver, use special conditions
        [303.73, 437.5], //Kogel
        [166.79, 438.5],  //DISUCS
        [170.39, 437.5], //SPEER
    ], 
    //PUPILLEN
    [
        [10834.0,996.00],//M40
        [15365.0, 1058.00], //M60
        [0, 0], //M80
        [0, 0],//M100
        [0, 0], //M150
        [0, 0], // M300

        [160470.5, 811.35], //M600
        [276912.0, 738.50], //M1000
        [0, 0],             //M1500

        [0,0], //MH60
        [0,0], //MH80
        [0,0], //MH100
        [0,0], //mh300
        
        [41050.0, 953.00],  //M4X40M
        [59225.0, 1030.00], //M4X60M
        [0, 0], //M4X80M
        [0, 0], //m4x100M
        
        [0, 0],//HOOG, use special conditions
        [0, 0], //POLS
        [0, 0], //ver, use special conditions
        [303.73, 337.5], //Kogel
        [0, 0],  //DISUCS
        [126.00, 245.5], //BAL/SPEER
    ], 
];

const FIELD_RULES = {
  [category.U14_U16]: {
    [events.HOOG]: {
      split: 1.35,
      high: { a: 1977.53, b: 1798.5 },
      low:  { base: 0.67, factor: 733.33333, offset: 0.7 }
    },
    [events.VER]: {
      split: 4.41,
      high: { a: 887.99, b: 1364.5 },
      low:  { base: 1.91, factor: 200, offset: 0.5 }
    }
  },

  [category.PUPILLEN]: {
    [events.HOOG]: {
      split: 1.35,
      high: { a: 1977.53, b: 1798.5 },
      low:  { base: 0.67, factor: 733.33333, offset: 100.7 }
    },
    [events.VER]: {
      split: 4.41,
      high: { a: 887.99, b: 1264.5 },
      low:  { base: 1.91, factor: 200, offset: 100.5 }
    }
  }
};

