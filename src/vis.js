/* global document */

var g = require('./geometry');
var compass = require('./compass');
var d3 = require('d3');

var body = document.body,
    canvas = new compass.AnimationCanvas(body, { w: 10, h: 10 }, 0.1),
    anim = new compass.AnimationSequence(400);

var circles = canvas.createLayer("circles"),
    lines = canvas.createLayer("lines"),
    points = canvas.createLayer("points");

var r = canvas.width/10,
    center = g.point(canvas.width/2, canvas.height/2),
    hexAngles = d3.range(6).map(function (i) {
      return (compass.τ * i/6) + (compass.τ / 4);
    });

anim.addStep("draw circle", { onto: circles, at: center, r: r, style: "line-c", dir: "cw" });

hexAngles.forEach(function (a, i) {
  var p0 = g.point.fromPolar(2*r, a, center),
      p1 = g.point.fromPolar(4*r, a, center);

  anim.addStep("draw point", { onto: points, at: p0 }, 250);
  anim.addStep("draw point", { onto: points, at: p1 }, 250);

  anim.addStep("draw circle", { onto: circles, at: p0, r: r, style: "line-c", dir: "ccw" });
  anim.addStep("draw circle", { onto: circles, at: p1, r: r, style: "line-c", dir: "cw" });
});

d3.range(6).map(function (i) {
  d3.range(i+1, 6).map(function (j){
    return [i,j];
  }).forEach(function (pair) {
    var a0 = hexAngles[pair[0]],
        a1 = hexAngles[pair[1]],
        p0 = g.point.fromPolar(2*r, a0, center),
        p1 = g.point.fromPolar(2*r, a1, center),
        p2 = g.point.fromPolar(4*r, a0, center),
        p3 = g.point.fromPolar(4*r, a1, center);

    anim.addStep("draw line", { onto: lines, from: p0, to: p1, style: "line-b" }, 100);
    anim.addStep("draw line", { onto: lines, from: p2, to: p3, style: "line-a" });
  });
});

anim.addStep("pause");

anim.addStep("zoom",   { target: canvas.zoomableContents, times: 0.45, ease: "easeOutBack" }, 500);
anim.addStep("zoom",   { target: canvas.zoomableContents, times: 0.9, ease: "easeOutBack" }, 500);
anim.addStep("rotate", { target: canvas.rotatableContents, by: -180 }, 1000);

anim.play();
