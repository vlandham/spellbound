/*global window */
var d3 = require('d3');

// const τ = 2 * Math.PI; // http://tauday.com/tau-manifesto
// const φ = (Math.sqrt(5) - 1) / 2;
// const Φ = 1 + φ;

const τ = exports.τ = 2 * Math.PI; // http://tauday.com/tau-manifesto
const φ = exports.φ = (Math.sqrt(5) - 1) / 2;
const Φ = exports.Φ = 1 + φ;

exports.AnimationCanvas = function AnimationCanvas(container, aspectRatio, marginPct) {

  var containerWidth = container.clientWidth,
      containerHeight = container.clientHeight;

  var unit = Math.min(
        containerWidth / aspectRatio.w,
        containerHeight / aspectRatio.h
      );

  var width = unit * aspectRatio.w,
      height = unit * aspectRatio.h;

  var svg = d3.select(container)
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight);

  var centerX = containerWidth / 2,
      centerY = containerHeight / 2;

  var contents = svg.append("g")
      .attr("transform", "translate(" + centerX + "," + centerY + ")");

  var rotatableContents = contents.append("g")
      .attr("transform", "rotate(0)");

  var zoomableContents = rotatableContents.append("g")
      .attr("transform", "scale(" + (1 - marginPct) + ")");

  var canvas = zoomableContents.append("g")
      .attr("transform", "translate(" + -width/2 + "," + -height/2 + ")");

  return {
    width: width,
    height: height,

    origin: {
      x: centerX,
      y: centerY,
    },

    contents: contents,
    rotatableContents: rotatableContents,
    zoomableContents: zoomableContents,

    createLayer: function(layerClass, scale, rotation, dx, dy) {
      var layer = canvas.append("g").attr("class", layerClass),
          transform = d3.transform(),
          scaleFactor = scale || 1,
          rotateBy = rotation || 0,
          translateX = dx || 0,
          translateY = dy || 0;

      transform.scale = [scaleFactor, scaleFactor];
      transform.rotate = rotateBy;
      transform.translate = [translateX, translateY];

      layer.attr("transform", transform.toString());

      return layer;
    }
  };
}

exports.AnimationSequence = function AnimationSequence(defaultStepDuration) {

  const ORIGIN = { x: 0, y: 0 };

  var steps = [],
      current = 0;

  var api = {
    addStep: function (type, options, duration) {
      steps.push({
        name: type,
        options: options,
        duration: duration || defaultStepDuration || 0
      });

      return api;
    },

    play: function () {
      var step = steps[current],
          command = commands[step.name],
          duration = step.duration,
          options = step.options || { target: d3.select(window) },
          target = options.target || options.onto;

      var afterStep = function(){
        if (++current < steps.length) {
          api.play();
        } else {
          console.log("all done");
        }
      };

      if (duration) {
        target.call(command, duration, options, afterStep);
      } else {
        target.call(command, 0, options);
        afterStep();
      }

      return api;
    }
  };

  var commands = {
    "draw circle": function (target, duration, options, onComplete) {
      var clockwise = (options.dir === "cw");

      options.from = clockwise ? 0 : τ;
      options.to = clockwise ? τ : 0;

      commands["draw arc"](target, duration, options, onComplete);
    },

    "draw arc": function (target, duration, options, onComplete) {
      var locus = options.at || ORIGIN,
          radius = options.r || 1,
          rotateBy = options.rotation || 0,
          opacity = options.opacity || 1,
          style = options.style || "line-c";

      var startAngle = options.from,
          endAngle = options.to;

      var location = "translate(" + locus.x + "," + locus.y + ")",
          rotation = "rotate(" + rotateBy + ")";

      var path = d3.svg.arc()
          .innerRadius(radius)
          .outerRadius(radius)
          .startAngle(startAngle);

      var arc = target.append("g").attr("transform", [location,rotation].join(" "));

      var line = arc.append("path")
          .datum({endAngle: startAngle})
          .attr("class", style)
          .attr("d", path)
          .style("opacity", opacity);

      line
        .transition()
        .duration(duration)
        .ease(options.ease || "cubic-in-out")
        .call(arcTween, path, endAngle)
        .each("end", onComplete);
    },

    "draw line": function (target, duration, options, onComplete) {
      var line = target.append("line");

      var a = options.from || ORIGIN,
          b = options.to || ORIGIN,
          style = options.style || "line-a";

      line
        .attr("class", style)
        .attr("x1", a.x)
        .attr("x2", a.x)
        .attr("y1", a.y)
        .attr("y2", a.y);

      if (duration && onComplete) {
        line
          .transition()
          .duration(duration)
          .attr("x2", b.x)
          .attr("y2", b.y)
          .each("end", onComplete);
      } else {
        line
          .attr("x2", b.x)
          .attr("y2", b.y);
      }

    },

    "draw point": function (target, duration, options, onComplete) {
      var locus = options.at || ORIGIN,
          radius = options.r || 3,
          style = options.style || "whole";

      var center = "translate(" + locus.x + "," + locus.y + ")";

      var point = target.append("g").attr("transform", center),
          circle = point.append("circle");

      point
        .attr("class", "point")
        .classed(style, true);

      circle
        .attr("r", 1e-8)
        .transition()
        .duration(duration)
        .attr("r", radius)
        .each("end", onComplete);
    },

    "rotate": function (target, duration, options, onComplete) {
      var targetAngle = options.by,
          transformation = "rotate(" + targetAngle + ")";

      target
        .transition()
        .duration(duration)
        .attr('transform', transformation)
        .each("end", onComplete);
    },

    "zoom": function (target, duration, options, onComplete) {
      var targetScale = options.times,
          transformation = "scale(" + targetScale + ")",
          easing = options.ease || "linear";

      target
        .transition()
        .duration(duration)
        .ease(easing)
        .attr('transform', transformation)
        .each("end", onComplete);
    },

    "fade": function (target, duration, options, onComplete) {
      target
        .transition()
        .duration(duration)
        .style('opacity', 1e-8)
        .each("end", onComplete);
    },

    "pause": function (target, duration, options, onComplete) {
      var doc = d3.select(window),
          resume = function() {
            console.log("resume!");
            doc.on(".continue", null);
            doc.on("message", null);
            onComplete();
          };

      doc.on("click.continue", resume);
      doc.on("message", resume);
    }

  };

  // See http://bl.ocks.org/mbostock/5100636
  function arcTween(transition, arc, newAngle) {

    transition.attrTween("d", function(d) {

      var interpolate = d3.interpolate(d.endAngle, newAngle);

      return function(t) {

        d.endAngle = interpolate(t);

        return arc(d);
      };

    });
  }

  return api;
}


exports.TilingPattern = function TilingPattern(id, parent, width, height) {
  var defs = d3.select(parent).append("defs"),
      pattern = defs.append("pattern")
                    .attr("id", id)
                    .attr("patternUnits", "userSpaceOnUse")
                    .attr("width", width)
                    .attr("height", height);

  var centerX = width / 2,
      centerY = height / 2;

  var contents = pattern.append("g")
      .attr("transform", "translate(" + centerX + "," + centerY + ")");

  var rotatableContents = contents.append("g")
      .attr("transform", "rotate(0)");

  var zoomableContents = rotatableContents.append("g")
      .attr("transform", "scale(1)");

  var canvas = zoomableContents.append("g")
      .attr("transform", "translate(" + -width/2 + "," + -height/2 + ")");

  return {
    id: id,

    width: width,
    height: height,

    contents: contents,
    rotatableContents: rotatableContents,
    zoomableContents: zoomableContents,

    createLayer: function(layerClass, scale, rotation, dx, dy) {
      var layer = canvas.append("g").attr("class", layerClass),
          transform = d3.transform(),
          scaleFactor = scale || 1,
          rotateBy = rotation || 0,
          translateX = dx || 0,
          translateY = dy || 0;

      transform.scale = [scaleFactor, scaleFactor];
      transform.rotate = rotateBy;
      transform.translate = [translateX, translateY];

      layer.attr("transform", transform.toString());

      return layer;
    }
  };
}

exports.TiledSurface = function TiledSurface(parent, pattern) {
  var width = parent.clientWidth,
      height = parent.clientHeight,
      surface = d3.select(parent).append("rect");

  surface
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .style("fill", "url(#" + pattern.id + ")");

  return surface;
};
