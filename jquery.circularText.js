// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

(function($){
    'use strict';

    $.fn.circularText = function( options ) {

        var defaults = {
            'debug':                false,
            'speed':                4,
            'activeClass':          'active',
            'animate':              false,
            'cache':                false,
            'cacheId':              'ct',
            'onMouseOver':          function(){},
            'onMouseOut':           function(){},
            'onMouseDown':          function(){},
            'onMouseUp':            function(){}
        };

        var settings = $.extend( {}, defaults, options );

        function makeCacheKey() {
            return settings.cacheId + Array.join(arguments, '').replace(/[\.\s]/g, '');
        }

        var drawDebug = settings.debug ? $.proxy(function(context, cx, cy, radius){
            var key = makeCacheKey(cx, cy, radius);
            if (this.cache[key]) {
                context.putImageData(this.cache[key], 0, 0);
            } else {
                context.save();
                context.fillStroke = '#000000';
                context.lineWidth = 1;
                context.beginPath();
                context.arc(cx, cy, radius, 0, Math.PI * 2, false);
                // context.closePath();
                context.stroke();
                this.cache[key] = context.getImageData(0, 0,
                    context.canvas.width, context.canvas.height);
                context.restore();
            }
        }, {'cache': {}}) : undefined;

        var draw = (settings.animate && settings.cache) ? $.proxy(function(context, data, cx, cy, radius, rotation) {

            var str = data.str,
                cacheKey = makeCacheKey(str.toLowerCase(), cx, cy, radius),
                cacheCanvas = this.cache[cacheKey];

            if (cacheCanvas !== undefined) {
                context.save();
                context.translate(cx, cy);
                context.rotate(rotation);
                context.drawImage(cacheCanvas, -cx, -cy);
                context.restore();
            } else {

                var ctx,
                    len = str.length,
                    metric = data.metric,
                    angle = data.angle;

                cacheCanvas = this.cache[cacheKey] = document.createElement('canvas');
                cacheCanvas.width = context.canvas.width;
                cacheCanvas.height = context.canvas.height;
                ctx = cacheCanvas.getContext('2d');

                // copy all of the style settings
                $.each([
                    'font',
                    'fillStyle',
                    'shadowBlur',
                    'shadowOffestY',
                    'shadowOffestX'
                ], function(index, value) {
                    ctx[value] = context[value];
                });

                ctx.translate(cx, cy);
                ctx.rotate(rotation + (-1*angle/2) + (-1*(angle/len)/2));

                for(var i = 0; i < len; i++) {
                    ctx.rotate(angle/len);
                    ctx.save();
                    ctx.translate(0, -1 * radius);
                    ctx.fillText(str[i], -(metric[i]/2), 0);
                    ctx.restore();
                }
                context.drawImage(cacheCanvas, 0, 0);
            }
        }, {'cache': {}}) : function(context, data, cx, cy, radius, rotation) {

            var str = data.str,
                len = str.length,
                metric = data.metric,
                angle = data.angle;

            context.save();
            context.translate(cx, cy);
            //context.rotate(rotation);
            //context.rotate(-1 * angle / 2);
            //context.rotate(-1 * (angle / len) / 2);
            rotation += (-1 * angle / 2) + (-1 * (angle / len) / 2);
            context.rotate(rotation);

            for(var i = 0; i < len; i++) {
                context.rotate(angle / len);
                context.save();
                context.translate(0, -1 * radius);

                // s = str[n], w = metric[n];
                context.fillText(str[i], -(metric[i]/2), 0);
                // context.fillText(s, 0, 0);
                context.restore();
            }
            context.restore();
        };

        function loadStyles(element, context, str) {
            if (typeof window.getComputedStyle === 'function') {
                var styles = getComputedStyle(element);
                settings.debug && console.log(styles);

                context.font = styles.fontSize + ' ' + styles.fontFamily;
                context.fillStyle = styles.color;

                // FIXME total hack, should use a regex and match
                // /(-?\d+px)|(rgb\(.+\))/g
                var shadow = styles.textShadow.split(' ');
                $.each(['Blur', 'OffestY', 'OffestX'], function(index, ele) {
                    context['shadow' + ele] = parseInt(shadow.pop().replace('px', ''));
                });
                context.shadowColor = shadow.join('');

                if (styles.textTransform == 'uppercase') {
                    str = str.toUpperCase();
                } else if (styles.textTransform === 'lowercase') {
                    str = str.toLowerCase();
                } else if (styles.textTransform === 'capitalize') {
                    str = str.replace(/(^|\s)([a-z])/g, function(m, p, q){
                        return p + q.toUpperCase();
                    });
                }
                // background image
                // var url = styles.backgroundImage.replace(/(url\(|\)|\"|file:\/\/)/gi, '');
            } else {
                // load from settings
            }
            return str;
        }

        function loadData(ctx, str, radius) {
            // Get metrics for each letter
            var data = {
                str: str,
                metric: Array(str.length),
                angle: 0
            };
            for (var i = 0, len = str.length; i < len; i++)
                data.metric[i] = ctx.measureText(str[i]).width;
            // Get metric for whole text
            data.angle = ctx.measureText(str).width/radius;

            return data;
        }

        return this.each(function(){

            var $this = $(this),
                width = $this.width(),
                height = $this.height(),
                text = $this.html().trim(),
                centerX = width/2,
                centerY = height/2,
                radius = Math.min(centerX, centerY) * 0.475,
                data,
                canvas = document.createElement('canvas'),
                ctx;

            canvas.width = width;
            canvas.height = height;

            $(canvas).css({
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'z-index': 0
            });

            $this.css({
                'position': 'relative',
            }).html('').append(canvas);

            ctx = canvas.getContext('2d');
            text = loadStyles(this, ctx, text);
            data = loadData(ctx, text, radius);

            settings.debug && drawDebug(ctx, centerX, centerY, radius);
            draw(ctx, data, centerX, centerY, radius, 0);

            if (!settings.animate) return;
            //  Everything after this point is for animation stuff
            var scope = {
                requestId: 0,
                runTime: 0,
                run: function(context, startTime) {
                    var time  = this.runTime = (new Date()).getTime() - startTime;

                    // pixels / second
                    var rads = settings.speed * time / 1000;

                    context.clearRect(0, 0, width, height);
                    settings.debug && drawDebug(context, centerX, centerY, radius);
                    draw(context, data, centerX, centerY, radius, rads);

                    // request next frame
                    this.requestId = requestAnimationFrame(function() {
                        scope.run(context, startTime);
                    });
                }
            };

            var run = $.proxy(scope.run, scope, ctx);

            function start() {
                var startTime = (new Date()).getTime();
                startTime -= scope.runTime;
                run(startTime);
            }

            $this.mouseover(start)
            .mouseout(function(){
                cancelAnimationFrame(scope.requestId);
                $this.removeClass(settings.activeClass);
            })
            .mousedown(function() {
                cancelAnimationFrame(scope.requestId);
                $this.addClass(settings.activeClass);
            })
            .mouseup(function(){
                start();
                $this.removeClass(settings.activeClass);
            });
        });
    };

})(jQuery);
