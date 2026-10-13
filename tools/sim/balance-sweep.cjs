// v0.4 balance sweep: battle outcomes from fixed preparations (200 seeds by default). Usage: node balance-sweep.cjs [N]
const {sweep}=require('./lab.cjs');const N=+process.argv[2]||80;
const base={ally:67,equipment:[1,1,1],ammo:6,supply:12};
sweep('base 67',base,N);sweep('ally 80',{...base,ally:80},N);sweep('ally 50',{...base,ally:50},N);sweep('ally 40',{...base,ally:40},N);sweep('ally 25',{...base,ally:25},N);
sweep('noGifu (+600 garrison)',{...base,gifu:false},N);sweep('noGifu deploy back',{...base,gifu:false,deploy:'back'},N);sweep('gifu deploy back',{...base,deploy:'back'},N);
sweep('ammo 0',{...base,ammo:0},N);sweep('ammo 3',{...base,ammo:3},N);
sweep('eq 000',{...base,equipment:[0,0,0]},N);sweep('eq 222',{...base,equipment:[2,2,2]},N);
sweep('supply 0',{...base,supply:0},N);sweep('supply 6',{...base,supply:6},N);sweep('supply 9',{...base,supply:9},N);sweep('auth 0',{...base,authority:0},N);
sweep('BEST eq222 ammo12 ally80 auth70',{...base,ally:80,equipment:[2,2,2],ammo:12,authority:70},N);
