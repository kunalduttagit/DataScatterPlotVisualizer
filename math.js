const math = {};

/*
for t = 0, result = a;
for t = 1, result = b;
otherwise you get differnce of a and b scaled by paramenter t and add it to a (get value b/w a and b)
*/
math.lerp = (a, b, t) => {
    return a + (b - a) * t;
}

/*
v is between a and b 
? "inverse lerp," is a technique used to find the position of a given value relative to a range defined by two other values.
a starting value (let's call it start) and an ending value (let's call it end)
eg: const t = math.invLerp(3000, 300000, km);
The inverse lerp function calculates a parameter (t) that represents the position of the km value relative to the range between start and end. 
The t value is between 0 and 1, where:
    If km is equal to start, then t will be 0.
    If km is equal to end, then t will be 1.
    If km is exactly in the middle of the range, then t will be 0.5.
*/
math.invLerp = (a, b, v) => {
    return (v - a) / (b - a);
}

/*
 is value between oldA and oldB (the old range)
const t = math.invLerp(3000, 300000, km);
const price = math.lerp(9000, 900, t); //reverse values because price depreciates for more km travelled

?getting t from inverse lerp and then applying lerp for price is called remap in data science.
    the combination of linear interpolation (lerp) and inverse linear interpolation (invLerp) is 
    often referred to as "remapping" or "mapping." Remapping involves converting a value from one range to another 
    using lerp and invLerp functions.
*/
math.remap = (oldA, oldB, newA, newB, v) => {
    return math.lerp(newA, newB, math.invLerp(oldA, oldB, v));
}

//*convert from dataset size (1K - 3M) to canvas size and return the point (km and price)
math.remapPoint = (oldBounds, newBounds, point) => {
    return [
        math.remap(oldBounds.left, oldBounds.right, newBounds.left, newBounds.right, point[0]),
        math.remap(oldBounds.top, oldBounds.bottom, newBounds.top, newBounds.bottom, point[1])
    ]
}

math.add = (p1, p2) => {
    return [ p1[0]+p2[0], p1[1]+p2[1] ]
}

math.subtract = (p1, p2) => {
    return [ p1[0]-p2[0], p1[1]-p2[1] ]
}

math.formatNumber = (n, dec) => {
    return n.toFixed(dec)
}