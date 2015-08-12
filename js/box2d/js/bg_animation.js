var intervalID = 0;
var intervalID_add = 0;
var world;
var CreateObj ={};
var SCALE = 30.0;
var RAD = 180 / Math.PI; // радианы - DIV_180_PI = 180 / Math.PI;
var GRAD = Math.PI / 180; // градусы -  DIV_PI_180 = Math.PI / 180;
var bg_animation =  document.getElementById("bg_animation");
var ctx2D = bg_animation.getContext('2d');

// гравитация
var GRAVITY = -60;

// скорость создания тел миллисекунды
var CREATE_INTERVAL_BODY = 500;

// время начальной анимации миллисекунды
var ANIMATION_TIME = 300;

var DELTA_SIZE = 5;

// размер px перед scale
var PRE_SCALE_SIZE = 10;

// размер фигур
var px_minSize = 40; // в пикселях
var px_maxSize = 120; // в пикселях

// толщина линий px
var LINE_W = 10;

// с какой позиции движение вверх px
var KINEMATIK_Y = -10;

// с какой позиции удалять тела px
var DESTROY_Y = -200;

// скорость движения вверх px
var SPEED_Y = 0.2;

// массив цветов
var arrColor = [
    "#000000",
    "#197E68",
    "#042B72",
    "#E34737",
    "#E9B833",
    "#C9D0D3"
];

function randomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var     b2Vec2 = Box2D.Common.Math.b2Vec2
    ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
    ,	b2Body = Box2D.Dynamics.b2Body
    ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    ,	b2Fixture = Box2D.Dynamics.b2Fixture
    ,	b2World = Box2D.Dynamics.b2World
    ,	b2MassData = Box2D.Collision.Shapes.b2MassData
    ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
    ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
    ,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
    ;

var pred_ms = new Date().getTime();

CreateObj.init = function( interval )
{
    this.interval = interval;
    //this.pred_ms = new Date().getTime();
    this.time = new Date();

    this.arrBody = [];
    this.arrBodyDel = [];

    this.add = function( fnow )
    {
        fnow = typeof fnow !== undefined ? fnow : false;

        var cur_ms = new Date().getTime();

        if( !fnow )
        {
            if( cur_ms - pred_ms < this.interval ) {
                return false;
            } else {
                pred_ms = cur_ms;
            }
        }

        //create some objects
        var bodyDef = new b2BodyDef;
        bodyDef.type = b2Body.b2_dynamicBody;

        var fixDef = new b2FixtureDef;
        fixDef.density = 100.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0;

        // определяем рандомные свойства тела в пикселях
        var userData = {
            poligon: randomInt(0,2),
            px_x: randomInt( bg_animation.width/2, bg_animation.width),
            px_y: fnow ? 50 : randomInt( bg_animation.height-200, bg_animation.height-50),
            px_size: randomInt( px_minSize , px_maxSize ),
            angle: randomInt( 0 , 90 ),
            strokeStyle: arrColor[ randomInt( 0 , arrColor.length-1 ) ],
            create_time: cur_ms,
            animation: true,
            cur_size: PRE_SCALE_SIZE
        };

        var si_size = userData.px_size / SCALE + (LINE_W+1) / SCALE;
        //var si_size = PRE_SCALE_SIZE / SCALE;

        switch( userData.poligon )
        {
            case 0:
                // окружность
                userData.px_size = userData.px_size/2;
                si_size = si_size / 2
                fixDef.shape = new b2CircleShape( si_size );
            break;
            case 1:
                // квадрат
                si_size = si_size / 2;

                fixDef.shape = new b2PolygonShape;
                fixDef.shape.SetAsBox( si_size, si_size );
            break;
            case 2:
                //треугольник равносторонний
                fixDef.shape = new b2PolygonShape;

                var a2 = si_size/2;
                var r = si_size * Math.sqrt(3)/6;
                fixDef.shape.SetAsArray([
                    new b2Vec2( -a2, -r ),
                    new b2Vec2( si_size - a2, -r ),
                    new b2Vec2( si_size/2 - a2, si_size * Math.sqrt(3)/2 - r)
                ]);
            break;
        }

        bodyDef.type = b2Body.b2_kinematicBody;
        //bodyDef.type = b2Body.b2_staticBody;

        bodyDef.position.x = userData.px_x / SCALE;
        bodyDef.position.y = userData.px_y / SCALE;
        bodyDef.angle = userData.angle * GRAD;//--угол поворота

        var vBody = world.CreateBody( bodyDef );
            vBody.SetUserData( userData );
            vBody.CreateFixture( fixDef );

        this.arrBody.push( vBody );

        return true;
    };

    this.render = function()
    {
        var cnt_body = this.arrBody.length;

        var b = Box2D.Dynamics.b2Body;
        var ud = {};
        var bPos = {};
        var bAngle = {};
        var bSize = 0;

        for (var i = 0; i < cnt_body ;i++)
        {
            b = this.arrBody[i];
            ud = b.GetUserData();
            bPos = b.GetPosition();
            bAngle = b.GetAngle();

            if( b.GetPosition().y * SCALE < KINEMATIK_Y )
            {
                b.SetType( b2Body.b2_staticBody );
                b.SetType( b2Body.b2_kinematicBody );
            }

            // динамическое
            //if( b.GetType() == b2Body.b2_dynamicBody)
            if( !ud.animation ) {
                bSize = ud.px_size;
            }
            else {

                // scale
                var cur_time = new Date().getTime();
                var sub_time = cur_time - ud.create_time;
                if( sub_time <= ANIMATION_TIME  ){
                    ud.cur_size += DELTA_SIZE;
                    bSize = ud.cur_size;
                }else{
                    ud.animation = false;
                    b.SetType( b2Body.b2_dynamicBody );
                }

                if( ud.cur_size >= ud.px_size ){
                    ud.animation = false;
                    b.SetType( b2Body.b2_dynamicBody );
                }
            }

            // русуем
            ctx2D.save();

            ctx2D.beginPath();

            ctx2D.strokeStyle = ud.strokeStyle;
            ctx2D.lineWidth = LINE_W;

            switch( ud.poligon )
            {
                case 0:
                    // окружность
                    ctx2D.arc( bPos.x * SCALE, bPos.y * SCALE , bSize, 0, 2*Math.PI, false);
                    break;
                case 1:
                    // квадрат

                    ctx2D.translate( bPos.x * SCALE , bPos.y * SCALE  );
                    ctx2D.rotate( bAngle );

                    ctx2D.strokeRect( - bSize/2, - bSize/2 , bSize, bSize);

                    break;
                case 2:
                    //треугольник


                    var a2 = bSize/2;
                    var r = bSize * Math.sqrt(3)/6;

                    ctx2D.translate( bPos.x * SCALE, bPos.y * SCALE  );
                    ctx2D.rotate( bAngle );

                    ctx2D.moveTo( -a2, -r );
                    ctx2D.lineTo( bSize - a2, -r);
                    ctx2D.lineTo( bSize/2 - a2, bSize * Math.sqrt(3)/2 - r);
                    ctx2D.lineTo( -a2, -r);
                    ctx2D.lineTo( bSize - a2, -r);
                    break;
            }

            ctx2D.stroke();

            ctx2D.restore();

            // кинематическое тело
            if( b.GetType() == b2Body.b2_kinematicBody && !ud.animation )
            {
                b.SetPosition( new b2Vec2( bPos.x, bPos.y - SPEED_Y / 30 ) );
            }

            if( b.GetPosition().y * SCALE < DESTROY_Y )
            {
                this.arrBodyDel.push( i );
            }


/*
            ctx2D.fillStyle = 'red'; // blue
            ctx2D.strokeStyle = 'red'; // red
            ctx2D.lineWidth = 1;
            //ctx2D.fillRect (0, 0, 150, 50);
            ctx2D.strokeRect(200, 200, 1, 1);
            ctx2D.strokeRect(bPos.x * SCALE , bPos.y * SCALE, 5, 5);*/

        }
    };

    this.delete = function()
    {
        var cnt = this.arrBodyDel.length;

        // удаляем тела из мира
        for (var i = 0; i < cnt ;i++) {
            world.DestroyBody( this.arrBody[ this.arrBodyDel[ i ] ] );
        }

        // удаляем тела из массива тел
        for (var i = 0; i < cnt ;i++) {
            this.arrBody.splice( this.arrBodyDel[ i ], 1);
        }

        this.arrBodyDel = [];
    };



};

function initBgAnimation() {
    world = new b2World(
        new b2Vec2( 0, GRAVITY )    //gravity
        ,  false                 //allow sleep
    );

    CreateObj.init( CREATE_INTERVAL_BODY );
    
    /*for(var i=1;i < 15; i++){
        CreateObj.add( true );
    } */   

    //setup debug draw
    /*var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite( ctx2D );
    debugDraw.SetDrawScale(SCALE);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);*/

    intervalID = window.setInterval(update, 1000 / 60);
    intervalID_add = window.setInterval(CreateObj.add(), CREATE_INTERVAL_BODY);
};

function update()
{
    ctx2D.clearRect(0, 0, bg_animation.width, bg_animation.height);

    CreateObj.add();

    world.Step(
        1 / 60   //frame-rate
        ,  10       //velocity iterations
        ,  10       //position iterations
    );

    //world.DrawDebugData();

    world.ClearForces();

    CreateObj.render();
    CreateObj.delete();
};


function stopBgAnimation(){
    //clearInterval(intervalID);
    //clearInterval(intervalID_add);    
}

function startBgAnimation(){
    initBgAnimation();
    //intervalID = window.setInterval(update, 1000 / 60);
    //intervalID_add = window.setInterval( CreateObj.add(), CREATE_INTERVAL_BODY);
}

function resizeWindow(){
    bg_animation.width = document.body.offsetWidth-2;
    bg_animation.height = document.body.offsetHeight;
}
resizeWindow();