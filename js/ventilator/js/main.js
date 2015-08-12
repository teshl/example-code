var Propeller = {};
var Ventilator = {};
var rate = 50;

$(document).ready(function(){

    $(document).keydown( function(e) {
        var delta = 0;

        var keyCode = e.keyCode || e.which,
            oArrow = { left:37, up:38, right:39, down:40 };
        switch ( keyCode )
        {
            case oArrow.up:
                delta = 1;
                break;

            case oArrow.down:
                delta = -1;
                break;
        }

        console.log(delta);

        var top = $(".polzunok").position().top - delta*5;
        if( top > 20 && top < 255  )
        {
            var t = Propeller.angle + delta*1;
            Propeller.angle = t < 1 ? 1  : t ;

            $(".polzunok").css("top",top+"px");
        }
    });

    $(".wrapper").mousewheel(function(event, delta){
        var top = $(".polzunok").position().top - delta*5;
        if( top > 20 && top < 255  )
        {
            var t = Propeller.angle + delta*1;
            Propeller.angle = t < 1 ? 1  : t ;

            $(".polzunok").css("top",top+"px");
        }
        return false;
    });

    function inRad(num) {
        return num * Math.PI / 180;
    }

    function drawEllipse_B(ctx, centerX, centerY, width, height) {
        ctx.beginPath();

        ctx.moveTo(centerX, centerY - height); // A1

        ctx.bezierCurveTo(
        centerX + width, centerY - height, // C1
        centerX + width, centerY + height, // C2
        centerX, centerY + height); // A2

        ctx.bezierCurveTo(
        centerX - width, centerY + height, // C3
        centerX - width, centerY - height, // C4
        centerX, centerY - height); // A1

        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }

    // теловентилятора
    Ventilator.init = function( id, width, height) {
        this.canvasId = id;

        var canv = document.getElementById( id );
        canv.width = width;
        canv.height = height;

        this.ctx     = canv.getContext('2d');

        this.render = function()
        {
            // подставка вентилятора
            this.ctx.fillStyle = '#E9E9E9';
            this.ctx.strokeStyle = '#E9E9E9';

            this.ctx.beginPath();
            this.ctx.moveTo(0, canv.height);
            this.ctx.lineTo(canv.width/2, 0);
            this.ctx.lineTo(canv.width, canv.height);
            this.ctx.lineTo(canv.width/2, 0.8*canv.height);
            this.ctx.lineTo(0, canv.height);

            this.ctx.fill();
        }
    }

    // пропеллер
    Propeller.init = function(id, width, height, ellipse_a, ellipse_b)
    {
        this.angle = 1;

        this.canvasId = id;
        this.el_a = ellipse_a;
        this.el_b = ellipse_b;

        var canv = document.getElementById( id );
        canv.width = width;
        canv.height = height;

        this.ctx = canv.getContext('2d');

        this.ctx.beginPath();

        var center_x = canv.width/2;
        var center_y = canv.height/2;
        var ellipse_a = this.el_a == 0 ? canv.width/4: this.el_a;
        var ellipse_b = this.el_b == 0 ? 10: this.el_b;

        this.ctx.translate(center_x, center_y);

        this.render = function()
        {
            this.ctx.clearRect(-center_x, -center_y, canv.width, canv.height); // -center_x -center_y для хрома

            this.ctx.rotate(inRad( this.angle ));
            // пропеллер
            this.ctx.fillStyle = '#000';
            this.ctx.strokeStyle = '#000';
            drawEllipse_B( this.ctx, center_x-ellipse_a-(center_x), 0, ellipse_a, ellipse_b);
            drawEllipse_B( this.ctx, center_x+ellipse_a-(center_x), 0, ellipse_a, ellipse_b);

            // окружность
            this.ctx.fillStyle = '#008D7B';
            this.ctx.strokeStyle = '#008D7B';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI*2, true);
            this.ctx.closePath();
            this.ctx.fill(); //заливаем окружность
        }
    }

    Ventilator.init('ventilator', 160, 300);
    Ventilator.render();

    Propeller.init('propeller', 250, 250, 0, 12);
    setInterval('Propeller.render()', rate);
});